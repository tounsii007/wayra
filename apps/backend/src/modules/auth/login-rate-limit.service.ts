import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { LoginAttemptEntity } from '../../database/entities';

/**
 * Per-email rate limiter for login attempts.
 * Sliding-window: 5 failed attempts within 15 minutes → temporary block.
 * Successful login resets the counter.
 */
@Injectable()
export class LoginRateLimitService {
  private readonly MAX_FAILED = 5;
  private readonly WINDOW_MS = 15 * 60_000;

  constructor(
    @InjectRepository(LoginAttemptEntity)
    private readonly attempts: Repository<LoginAttemptEntity>,
  ) {}

  async check(email: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
    const since = new Date(Date.now() - this.WINDOW_MS);
    const rows = await this.attempts.find({
      where: { email, attemptedAt: LessThan(new Date()) },
      order: { attemptedAt: 'DESC' },
      take: this.MAX_FAILED + 1,
    });
    const recent = rows.filter((r) => r.attemptedAt >= since);
    const failed = recent.filter((r) => !r.success);
    if (failed.length >= this.MAX_FAILED) {
      const oldest = failed[failed.length - 1]!;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest.attemptedAt.getTime() + this.WINDOW_MS - Date.now()) / 1000),
      );
      return { allowed: false, retryAfterSeconds };
    }
    return { allowed: true };
  }

  async record(email: string, success: boolean, ip?: string | null): Promise<void> {
    await this.attempts.save(
      this.attempts.create({ email, ip: ip ?? null, success }),
    );
  }

  /** Optional periodic cleanup of attempts older than the window. */
  async prune(): Promise<void> {
    const cutoff = new Date(Date.now() - this.WINDOW_MS * 4);
    await this.attempts.delete({ attemptedAt: LessThan(cutoff) });
  }
}
