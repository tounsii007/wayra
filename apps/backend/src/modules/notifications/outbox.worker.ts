import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { NotificationOutboxEntity } from '../../database/entities';
import { PushSender, type PushPayload } from './push-sender.service';

/**
 * Periodic worker that drains `notification_outbox`.
 *
 * Producers enqueue payloads with `NotificationsService.enqueue(...)`
 * (set the user_id and payload). The worker picks rows whose
 * `next_attempt_at <= now`, attempts a push, and on failure schedules
 * the next retry with exponential backoff. Drops after 8 attempts.
 *
 * Disable by setting NOTIFICATION_OUTBOX_ENABLED=false (default: on).
 */
@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly enabled: boolean;
  private readonly intervalMs: number;
  private running = false;

  constructor(
    config: ConfigService,
    @InjectRepository(NotificationOutboxEntity)
    private readonly outbox: Repository<NotificationOutboxEntity>,
    private readonly sender: PushSender,
  ) {
    this.enabled = (config.get<string>('NOTIFICATION_OUTBOX_ENABLED') ?? 'true') !== 'false';
    this.intervalMs = Number(config.get<string>('NOTIFICATION_OUTBOX_INTERVAL_MS') ?? '10000');
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('outbox worker disabled');
      return;
    }
    this.timer = setInterval(() => void this.drain(), this.intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async drain() {
    if (this.running) return;
    this.running = true;
    try {
      const due = await this.outbox.find({
        where: { nextAttemptAt: LessThanOrEqual(new Date()), sentAt: undefined },
        take: 25,
      });
      for (const row of due) {
        if (row.sentAt) continue;
        if (row.attempts >= 8) {
          row.lastError = 'attempts_exhausted';
          row.sentAt = new Date();
          await this.outbox.save(row);
          continue;
        }
        try {
          if (!row.userId) {
            row.lastError = 'no_user_id';
            row.sentAt = new Date();
            await this.outbox.save(row);
            continue;
          }
          const result = await this.sender.sendToUser(row.userId, row.payload as PushPayload);
          if (result.sent > 0) {
            row.sentAt = new Date();
            row.lastError = null;
          } else {
            row.attempts++;
            row.lastError = `0 subs delivered`;
            row.nextAttemptAt = new Date(Date.now() + this.backoff(row.attempts));
          }
          await this.outbox.save(row);
        } catch (e) {
          row.attempts++;
          row.lastError = (e as Error).message;
          row.nextAttemptAt = new Date(Date.now() + this.backoff(row.attempts));
          await this.outbox.save(row);
        }
      }
    } finally {
      this.running = false;
    }
  }

  /** Exponential backoff: 5s, 15s, 45s, 2m15s, 7m, 20m, 1h, 3h */
  private backoff(attempt: number): number {
    return Math.min(3 * 3600_000, 5_000 * Math.pow(3, attempt - 1));
  }
}
