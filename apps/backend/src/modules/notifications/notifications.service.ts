import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PushSubscriptionEntity } from '../../database/entities';

export interface NotificationChannels {
  delay: boolean;
  cancellation: boolean;
  platformChange: boolean;
  departureSoon: boolean;
  tightTransfer: boolean;
  disruptionOnFavorite: boolean;
  priceChange: boolean;
  offlineDataStale: boolean;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  channels: NotificationChannels;
}

const DEFAULTS: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: false,
  channels: {
    delay: true,
    cancellation: true,
    platformChange: true,
    departureSoon: true,
    tightTransfer: true,
    disruptionOnFavorite: true,
    priceChange: false,
    offlineDataStale: true,
  },
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @InjectRepository(PushSubscriptionEntity)
    private readonly subs: Repository<PushSubscriptionEntity>,
  ) {}

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const rows = await this.ds.query<
      Array<{
        push_enabled: boolean;
        email_enabled: boolean;
        channels: NotificationChannels | null;
      }>
    >(
      `SELECT push_enabled, email_enabled, channels
       FROM notification_preference WHERE user_id = $1`,
      [userId],
    );
    if (rows.length === 0) return DEFAULTS;
    const r = rows[0]!;
    return {
      pushEnabled: r.push_enabled,
      emailEnabled: r.email_enabled,
      channels: { ...DEFAULTS.channels, ...(r.channels ?? {}) },
    };
  }

  async updatePreferences(
    userId: string,
    patch: Partial<NotificationPreferences> & { channels?: Partial<NotificationChannels> },
  ): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    const next: NotificationPreferences = {
      pushEnabled: patch.pushEnabled ?? current.pushEnabled,
      emailEnabled: patch.emailEnabled ?? current.emailEnabled,
      channels: { ...current.channels, ...(patch.channels ?? {}) },
    };
    await this.ds.query(
      `INSERT INTO notification_preference (user_id, push_enabled, email_enabled, channels)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         push_enabled = EXCLUDED.push_enabled,
         email_enabled = EXCLUDED.email_enabled,
         channels = EXCLUDED.channels`,
      [userId, next.pushEnabled, next.emailEnabled, JSON.stringify(next.channels)],
    );
    return next;
  }

  // ----- subscriptions -----

  async addWebPushSubscription(
    userId: string | null,
    sub: { endpoint: string; p256dh?: string; auth?: string },
  ): Promise<{ id: string }> {
    const existing = await this.subs.findOne({ where: { endpoint: sub.endpoint } });
    if (existing) {
      existing.userId = userId;
      existing.p256dh = sub.p256dh ?? existing.p256dh;
      existing.auth = sub.auth ?? existing.auth;
      existing.lastUsedAt = new Date();
      await this.subs.save(existing);
      return { id: existing.id };
    }
    const created = await this.subs.save(
      this.subs.create({
        userId,
        platform: 'web',
        endpoint: sub.endpoint,
        p256dh: sub.p256dh ?? null,
        auth: sub.auth ?? null,
      }),
    );
    return { id: created.id };
  }

  async addExpoSubscription(
    userId: string | null,
    body: { token: string; platform: 'ios' | 'android' },
  ): Promise<{ id: string }> {
    const existing = await this.subs.findOne({ where: { endpoint: body.token } });
    if (existing) {
      existing.userId = userId;
      existing.lastUsedAt = new Date();
      await this.subs.save(existing);
      return { id: existing.id };
    }
    const created = await this.subs.save(
      this.subs.create({
        userId,
        platform: body.platform,
        endpoint: body.token,
        expoToken: body.token,
      }),
    );
    return { id: created.id };
  }

  async removeSubscription(endpoint: string): Promise<{ ok: true }> {
    await this.subs.delete({ endpoint });
    return { ok: true };
  }
}
