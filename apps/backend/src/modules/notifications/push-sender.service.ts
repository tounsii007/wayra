import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushSubscriptionEntity } from '../../database/entities';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}

/**
 * Push sender — fans out a notification to all of a user's web + Expo
 * subscriptions.
 *
 * Dev mode (no VAPID / no EXPO_ACCESS_TOKEN): logs the would-be send
 * so the rest of the system stays testable.
 *
 * Production: install `web-push` for Web Push and call the Expo Push
 * REST endpoint (https://exp.host/--/api/v2/push/send) for tokens.
 */
@Injectable()
export class PushSender {
  private readonly logger = new Logger(PushSender.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(PushSubscriptionEntity)
    private readonly subs: Repository<PushSubscriptionEntity>,
  ) {}

  async sendToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
    const subs = await this.subs.find({ where: { userId } });
    let sent = 0;
    let failed = 0;

    const vapidPub = this.config.get<string>('VAPID_PUBLIC_KEY');
    const vapidPriv = this.config.get<string>('VAPID_PRIVATE_KEY');
    const expoToken = this.config.get<string>('EXPO_ACCESS_TOKEN');

    for (const s of subs) {
      try {
        if (s.platform === 'web') {
          if (vapidPub && vapidPriv) {
            // Real send path (web-push):
            //   const webpush = require('web-push');
            //   webpush.setVapidDetails('mailto:dev@wayra.app', vapidPub, vapidPriv);
            //   await webpush.sendNotification(
            //     { endpoint: s.endpoint, keys: { p256dh: s.p256dh!, auth: s.auth! } },
            //     JSON.stringify(payload),
            //   );
            this.logger.warn('web-push not yet wired; logging the would-be send.');
          }
          this.logger.log(`[push:web] → ${s.endpoint.slice(-12)}: ${payload.title}`);
          sent++;
        } else if (s.platform === 'ios' || s.platform === 'android') {
          if (s.expoToken) {
            // Real Expo Push:
            //   await fetch('https://exp.host/--/api/v2/push/send', {
            //     method: 'POST',
            //     headers: { 'content-type': 'application/json', 'authorization': `Bearer ${expoToken}` },
            //     body: JSON.stringify([{ to: s.expoToken, title: payload.title, body: payload.body, data: payload.data }]),
            //   });
            if (!expoToken) this.logger.warn('EXPO_ACCESS_TOKEN not set; skipping real send.');
            this.logger.log(`[push:${s.platform}] → ${s.expoToken.slice(-12)}: ${payload.title}`);
            sent++;
          } else {
            failed++;
          }
        }
      } catch (e) {
        this.logger.error(`push to ${s.id} failed: ${(e as Error).message}`);
        failed++;
      }
    }
    return { sent, failed };
  }
}
