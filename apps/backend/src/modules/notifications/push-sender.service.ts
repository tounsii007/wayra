import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webPush from 'web-push';
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { PushSubscriptionEntity } from '../../database/entities';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}

/**
 * Push sender — fans out to all of a user's web + Expo subscriptions.
 *
 * Web Push:
 *   • Enabled when VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY are set.
 *   • Subscriptions returning 404/410 are pruned automatically.
 *
 * Expo Push:
 *   • Tickets batched 100 at a time per Expo SDK guidance.
 *   • DeviceNotRegistered → token row deleted.
 *
 * If neither is configured, the service logs the would-be send so dev
 * flows stay testable.
 */
@Injectable()
export class PushSender implements OnModuleInit {
  private readonly logger = new Logger(PushSender.name);
  private webPushReady = false;
  private expo: Expo;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(PushSubscriptionEntity)
    private readonly subs: Repository<PushSubscriptionEntity>,
  ) {
    this.expo = new Expo({
      accessToken: this.config.get<string>('EXPO_ACCESS_TOKEN'),
    });
  }

  onModuleInit() {
    const pub = this.config.get<string>('VAPID_PUBLIC_KEY');
    const priv = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:dev@wayra.app';
    if (pub && priv) {
      webPush.setVapidDetails(subject, pub, priv);
      this.webPushReady = true;
      this.logger.log('Web Push ready (VAPID configured).');
    } else {
      this.logger.warn('VAPID keys not set — web push will only log.');
    }
  }

  async sendToUser(
    userId: string,
    payload: PushPayload,
  ): Promise<{ sent: number; failed: number }> {
    const subs = await this.subs.find({ where: { userId } });
    let sent = 0;
    let failed = 0;
    const expoMessages: ExpoPushMessage[] = [];

    for (const s of subs) {
      try {
        if (s.platform === 'web') {
          if (this.webPushReady && s.p256dh && s.auth) {
            try {
              await webPush.sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                JSON.stringify(payload),
              );
              sent++;
            } catch (err) {
              const e = err as { statusCode?: number; message?: string };
              if (e.statusCode === 404 || e.statusCode === 410) {
                await this.subs.delete({ id: s.id });
                this.logger.log(`Pruned dead web-push subscription ${s.id}`);
              } else {
                this.logger.warn(`Web push to ${s.id} failed: ${e.message}`);
              }
              failed++;
            }
          } else {
            this.logger.log(`[push:web:log] → …${s.endpoint.slice(-12)}: ${payload.title}`);
            sent++;
          }
        } else if (s.expoToken && Expo.isExpoPushToken(s.expoToken)) {
          expoMessages.push({
            to: s.expoToken,
            sound: 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data,
          });
          s.lastUsedAt = new Date();
          await this.subs.save(s);
        } else {
          failed++;
        }
      } catch (e) {
        this.logger.error(`push fan-out error for ${s.id}: ${(e as Error).message}`);
        failed++;
      }
    }

    if (expoMessages.length > 0) {
      const chunks = this.expo.chunkPushNotifications(expoMessages);
      for (const chunk of chunks) {
        try {
          const tickets = await this.expo.sendPushNotificationsAsync(chunk);
          await this.handleExpoTickets(tickets, chunk);
          sent += tickets.length;
        } catch (e) {
          this.logger.error(`Expo push chunk failed: ${(e as Error).message}`);
          failed += chunk.length;
        }
      }
    }

    return { sent, failed };
  }

  private async handleExpoTickets(tickets: ExpoPushTicket[], chunk: ExpoPushMessage[]) {
    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      const m = chunk[i];
      if (t && t.status === 'error') {
        const details = (t.details ?? {}) as { error?: string };
        if (details.error === 'DeviceNotRegistered' && m && typeof m.to === 'string') {
          await this.subs.delete({ endpoint: m.to });
          this.logger.log(`Pruned dead Expo token ${m.to}`);
        } else {
          this.logger.warn(`Expo ticket error: ${t.message}`);
        }
      }
    }
  }
}
