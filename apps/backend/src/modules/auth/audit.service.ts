import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../../database/entities';

export type AuditAction =
  | 'login.success'
  | 'login.fail'
  | 'login.rate_limited'
  | 'signup'
  | 'logout'
  | 'token.refresh'
  | 'password.change'
  | 'password.reset.request'
  | 'password.reset.complete'
  | 'email.verification.request'
  | 'email.verification.complete'
  | 'oauth.link'
  | 'oauth.signin'
  | 'totp.setup'
  | 'totp.enable'
  | 'totp.disable'
  | 'account.delete'
  | 'admin.disruption.upsert'
  | 'admin.disruption.delete';

export interface AuditContext {
  userId?: string | null;
  actorEmail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity) private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async record(action: AuditAction, ctx: AuditContext = {}): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          action,
          userId: ctx.userId ?? null,
          actorEmail: ctx.actorEmail ?? null,
          ip: ctx.ip ?? null,
          userAgent: ctx.userAgent ?? null,
          metadata: ctx.metadata ?? null,
        }),
      );
    } catch (e) {
      // Never let an audit failure break the underlying request.
      this.logger.warn(`audit write failed: ${(e as Error).message}`);
    }
  }
}
