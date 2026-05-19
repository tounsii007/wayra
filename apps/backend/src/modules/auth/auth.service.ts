import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';
import {
  UserEntity,
  RefreshTokenEntity,
  AuthActionTokenEntity,
  OauthIdentityEntity,
} from '../../database/entities';
import { MailerService } from './mailer.service';
import { OAuthVerifierService } from './oauth-verifier.service';
import { AuditService } from './audit.service';
import { LoginRateLimitService } from './login-rate-limit.service';
import { TotpService } from './totp.service';

export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  user: UserView;
}

export interface UserView {
  id: string;
  email: string | null;
  displayName: string | null;
  locale: string;
  theme: string;
  role: string;
  emailVerified: boolean;
  totpEnabled?: boolean;
}

export interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

const REFRESH_DAYS = 30;
const ACTION_TOKEN_MINUTES = 60;

@Injectable()
export class AuthService {
  private readonly bcryptRounds: number;

  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshes: Repository<RefreshTokenEntity>,
    @InjectRepository(AuthActionTokenEntity)
    private readonly actions: Repository<AuthActionTokenEntity>,
    @InjectRepository(OauthIdentityEntity)
    private readonly oauth: Repository<OauthIdentityEntity>,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
    private readonly verifier: OAuthVerifierService,
    private readonly audit: AuditService,
    private readonly limiter: LoginRateLimitService,
    private readonly totp: TotpService,
  ) {
    this.bcryptRounds = Number(this.config.get<string>('BCRYPT_ROUNDS') ?? '12');
  }

  // ---------- signup / login ----------

  async signup(
    input: { email: string; password: string; displayName?: string; locale?: string },
    ctx: RequestContext = {},
  ): Promise<SessionResult> {
    const email = this.normalizeEmail(input.email);
    if (!email) throw new BadRequestException({ code: 'invalid_email', message: 'Invalid email.' });
    if (!this.isStrongEnough(input.password)) {
      throw new BadRequestException({
        code: 'weak_password',
        message: 'Password must be at least 8 characters and include a digit.',
      });
    }
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException({ code: 'email_in_use', message: 'Email already registered.' });
    }
    const passwordHash = await bcrypt.hash(input.password, this.bcryptRounds);
    const user = this.users.create({
      email,
      displayName: input.displayName ?? null,
      passwordHash,
      locale: input.locale ?? 'en',
      theme: 'system',
      role: 'user',
    });
    await this.users.save(user);
    await this.sendEmailVerification(user);
    await this.audit.record('signup', { userId: user.id, actorEmail: email, ...ctx });
    return this.sign(user, ctx);
  }

  async login(
    input: { email: string; password: string; totp?: string },
    ctx: RequestContext = {},
  ): Promise<SessionResult | { totpRequired: true }> {
    const email = this.normalizeEmail(input.email);

    const limit = await this.limiter.check(email);
    if (!limit.allowed) {
      await this.audit.record('login.rate_limited', { actorEmail: email, ...ctx });
      throw new UnauthorizedException({
        code: 'rate_limited',
        message: `Too many attempts. Retry in ${limit.retryAfterSeconds}s.`,
        details: { retryAfterSeconds: limit.retryAfterSeconds },
      });
    }

    const user = await this.users.findOne({ where: { email } });
    if (!user || !user.passwordHash) {
      await this.limiter.record(email, false, ctx.ip);
      await this.audit.record('login.fail', { actorEmail: email, ...ctx, metadata: { reason: 'no_user' } });
      throw new UnauthorizedException({ code: 'invalid_credentials', message: 'Invalid credentials.' });
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      await this.limiter.record(email, false, ctx.ip);
      await this.audit.record('login.fail', { userId: user.id, actorEmail: email, ...ctx, metadata: { reason: 'bad_password' } });
      throw new UnauthorizedException({ code: 'invalid_credentials', message: 'Invalid credentials.' });
    }

    if (await this.totp.isEnabled(user.id)) {
      if (!input.totp) return { totpRequired: true };
      const totpOk = await this.totp.verifyCode(user.id, input.totp);
      if (!totpOk) {
        await this.limiter.record(email, false, ctx.ip);
        await this.audit.record('login.fail', { userId: user.id, actorEmail: email, ...ctx, metadata: { reason: 'bad_totp' } });
        throw new UnauthorizedException({ code: 'invalid_totp', message: 'Invalid TOTP code.' });
      }
    }

    await this.limiter.record(email, true, ctx.ip);
    await this.audit.record('login.success', { userId: user.id, actorEmail: email, ...ctx });
    return this.sign(user, ctx);
  }

  async refresh(refreshToken: string, ctx: RequestContext = {}): Promise<SessionResult> {
    const hash = this.hash(refreshToken);
    const row = await this.refreshes.findOne({ where: { tokenHash: hash } });
    if (!row || row.revokedAt || row.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'invalid_refresh', message: 'Invalid refresh token.' });
    }
    const user = await this.users.findOne({ where: { id: row.userId } });
    if (!user) throw new UnauthorizedException({ code: 'invalid_refresh', message: 'User missing.' });

    row.revokedAt = new Date();
    await this.refreshes.save(row);
    await this.audit.record('token.refresh', { userId: user.id, ...ctx });
    return this.sign(user, ctx);
  }

  async logout(refreshToken: string, ctx: RequestContext = {}): Promise<{ ok: true }> {
    const hash = this.hash(refreshToken);
    const row = await this.refreshes.findOne({ where: { tokenHash: hash } });
    if (row) {
      row.revokedAt = new Date();
      await this.refreshes.save(row);
      await this.audit.record('logout', { userId: row.userId, ...ctx });
    }
    return { ok: true };
  }

  // ---------- profile ----------

  async me(userId: string): Promise<UserView | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return null;
    return this.toView(user, await this.totp.isEnabled(user.id));
  }

  async updateProfile(
    userId: string,
    body: { displayName?: string; locale?: string; theme?: string; homeCountry?: string },
  ): Promise<UserView> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'user_not_found', message: 'User not found.' });
    if (body.displayName !== undefined) user.displayName = body.displayName;
    if (body.locale !== undefined) user.locale = body.locale;
    if (body.theme !== undefined) user.theme = body.theme;
    if (body.homeCountry !== undefined) user.homeCountry = body.homeCountry;
    await this.users.save(user);
    return this.toView(user, await this.totp.isEnabled(user.id));
  }

  async changePassword(
    userId: string,
    body: { currentPassword: string; newPassword: string },
    ctx: RequestContext = {},
  ): Promise<{ ok: true }> {
    if (!this.isStrongEnough(body.newPassword)) {
      throw new BadRequestException({
        code: 'weak_password',
        message: 'New password must be at least 8 characters and include a digit.',
      });
    }
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new NotFoundException({ code: 'user_not_found', message: 'User not found.' });
    }
    const ok = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'wrong_password',
        message: 'Current password is incorrect.',
      });
    }
    user.passwordHash = await bcrypt.hash(body.newPassword, this.bcryptRounds);
    await this.users.save(user);
    await this.refreshes.update({ userId, revokedAt: undefined }, { revokedAt: new Date() });
    await this.audit.record('password.change', { userId: user.id, ...ctx });
    return { ok: true };
  }

  async deleteAccount(
    userId: string,
    body: { password: string },
    ctx: RequestContext = {},
  ): Promise<{ ok: true }> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new NotFoundException({ code: 'user_not_found', message: 'User not found.' });
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'wrong_password',
        message: 'Password does not match.',
      });
    }
    await this.users.delete(user.id);
    await this.audit.record('account.delete', { userId, actorEmail: user.email, ...ctx });
    return { ok: true };
  }

  // ---------- password reset ----------

  async requestPasswordReset(emailRaw: string, ctx: RequestContext = {}): Promise<{ ok: true }> {
    const email = this.normalizeEmail(emailRaw);
    await this.audit.record('password.reset.request', { actorEmail: email, ...ctx });
    const user = await this.users.findOne({ where: { email } });
    if (!user) return { ok: true };
    const token = this.generateOpaqueToken();
    const expiresAt = new Date(Date.now() + ACTION_TOKEN_MINUTES * 60_000);
    await this.actions.save(
      this.actions.create({
        userId: user.id,
        kind: 'password_reset',
        tokenHash: this.hash(token),
        expiresAt,
        usedAt: null,
      }),
    );
    const baseUrl = this.config.get<string>('PUBLIC_WEB_URL') ?? 'http://localhost:3000';
    await this.mailer.send({
      to: user.email!,
      subject: 'Reset your Wayra password',
      body:
        `Hello,\n\nUse this link to reset your password:\n\n` +
        `${baseUrl}/reset-password?token=${encodeURIComponent(token)}\n\n` +
        `The link expires in ${ACTION_TOKEN_MINUTES} minutes.`,
    });
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string, ctx: RequestContext = {}): Promise<{ ok: true }> {
    if (!this.isStrongEnough(newPassword)) {
      throw new BadRequestException({
        code: 'weak_password',
        message: 'Password must be at least 8 characters and include a digit.',
      });
    }
    const action = await this.actions.findOne({
      where: { tokenHash: this.hash(token), kind: 'password_reset' },
    });
    if (!action || action.usedAt || action.expiresAt < new Date()) {
      throw new BadRequestException({ code: 'invalid_token', message: 'Invalid or expired token.' });
    }
    const user = await this.users.findOne({ where: { id: action.userId } });
    if (!user) throw new BadRequestException({ code: 'invalid_token', message: 'User missing.' });
    user.passwordHash = await bcrypt.hash(newPassword, this.bcryptRounds);
    action.usedAt = new Date();
    await this.users.save(user);
    await this.actions.save(action);
    await this.refreshes.update({ userId: user.id }, { revokedAt: new Date() });
    await this.audit.record('password.reset.complete', { userId: user.id, ...ctx });
    return { ok: true };
  }

  // ---------- email verification ----------

  async sendEmailVerification(user: UserEntity): Promise<void> {
    if (!user.email || user.emailVerifiedAt) return;
    const token = this.generateOpaqueToken();
    await this.actions.save(
      this.actions.create({
        userId: user.id,
        kind: 'email_verification',
        tokenHash: this.hash(token),
        expiresAt: new Date(Date.now() + 24 * 3600_000),
        usedAt: null,
      }),
    );
    await this.audit.record('email.verification.request', { userId: user.id, actorEmail: user.email });
    const baseUrl = this.config.get<string>('PUBLIC_WEB_URL') ?? 'http://localhost:3000';
    await this.mailer.send({
      to: user.email,
      subject: 'Verify your email for Wayra',
      body:
        `Welcome to Wayra! Confirm your email:\n\n` +
        `${baseUrl}/verify-email?token=${encodeURIComponent(token)}\n\n` +
        `Link is valid for 24 hours.`,
    });
  }

  async verifyEmail(token: string): Promise<{ ok: true }> {
    const action = await this.actions.findOne({
      where: { tokenHash: this.hash(token), kind: 'email_verification' },
    });
    if (!action || action.usedAt || action.expiresAt < new Date()) {
      throw new BadRequestException({ code: 'invalid_token', message: 'Invalid or expired token.' });
    }
    const user = await this.users.findOne({ where: { id: action.userId } });
    if (!user) throw new BadRequestException({ code: 'invalid_token', message: 'User missing.' });
    user.emailVerifiedAt = new Date();
    action.usedAt = new Date();
    await this.users.save(user);
    await this.actions.save(action);
    await this.audit.record('email.verification.complete', { userId: user.id, actorEmail: user.email });
    return { ok: true };
  }

  async resendEmailVerification(userId: string): Promise<{ ok: true }> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'user_not_found', message: 'User not found.' });
    await this.sendEmailVerification(user);
    return { ok: true };
  }

  /** Throw if the user hasn't verified their email — for high-risk endpoints. */
  async requireVerifiedEmail(userId: string): Promise<void> {
    if (this.config.get<string>('REQUIRE_EMAIL_VERIFICATION') !== 'true') return;
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'user_not_found', message: 'User not found.' });
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        code: 'email_not_verified',
        message: 'Please verify your email address first.',
      });
    }
  }

  // ---------- OAuth ----------

  async oauthSignIn(
    input: { provider: 'google' | 'apple'; idToken: string },
    ctx: RequestContext = {},
  ): Promise<SessionResult> {
    const verified = await this.verifier.verify(input.provider, input.idToken);
    let identity = await this.oauth.findOne({
      where: { provider: input.provider, subject: verified.subject },
    });

    let user: UserEntity | null;
    if (identity) {
      user = await this.users.findOne({ where: { id: identity.userId } });
    } else {
      user = verified.email
        ? await this.users.findOne({ where: { email: this.normalizeEmail(verified.email) } })
        : null;
      if (!user) {
        user = this.users.create({
          email: verified.email ? this.normalizeEmail(verified.email) : null,
          displayName: verified.name ?? null,
          locale: 'en',
          theme: 'system',
          role: 'user',
          emailVerifiedAt: verified.emailVerified ? new Date() : null,
        });
        await this.users.save(user);
      } else if (verified.emailVerified && !user.emailVerifiedAt) {
        user.emailVerifiedAt = new Date();
        await this.users.save(user);
      }
      identity = await this.oauth.save(
        this.oauth.create({
          userId: user.id,
          provider: input.provider,
          subject: verified.subject,
          email: verified.email ?? null,
          displayName: verified.name ?? null,
        }),
      );
      await this.audit.record('oauth.link', {
        userId: user.id,
        actorEmail: user.email,
        metadata: { provider: input.provider },
        ...ctx,
      });
    }
    if (!user) throw new UnauthorizedException({ code: 'oauth_failed', message: 'OAuth failed.' });
    await this.audit.record('oauth.signin', {
      userId: user.id,
      actorEmail: user.email,
      metadata: { provider: input.provider },
      ...ctx,
    });
    return this.sign(user, ctx);
  }

  // ---------- internals ----------

  private async sign(user: UserEntity, ctx: RequestContext = {}): Promise<SessionResult> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '15m' },
    );
    const refresh = this.generateOpaqueToken();
    await this.refreshes.save(
      this.refreshes.create({
        userId: user.id,
        tokenHash: this.hash(refresh),
        expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 3600_000),
        userAgent: ctx.userAgent ?? null,
        ip: ctx.ip ?? null,
      }),
    );
    return {
      accessToken,
      refreshToken: refresh,
      user: this.toView(user, await this.totp.isEnabled(user.id)),
    };
  }

  private toView(user: UserEntity, totpEnabled: boolean): UserView {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      locale: user.locale,
      theme: user.theme,
      role: user.role,
      emailVerified: !!user.emailVerifiedAt,
      totpEnabled,
    };
  }

  private normalizeEmail(raw: string): string {
    return raw.trim().toLowerCase();
  }

  private isStrongEnough(pw: string): boolean {
    return typeof pw === 'string' && pw.length >= 8 && /\d/.test(pw);
  }

  private generateOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
