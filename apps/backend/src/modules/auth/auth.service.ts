import {
  BadRequestException,
  ConflictException,
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
}

const REFRESH_DAYS = 30;
const ACTION_TOKEN_MINUTES = 60;

@Injectable()
export class AuthService {
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
  ) {}

  // ---------- signup / login ----------

  async signup(input: {
    email: string;
    password: string;
    displayName?: string;
    locale?: string;
  }): Promise<SessionResult> {
    const email = this.normalizeEmail(input.email);
    if (!email) throw new BadRequestException({ code: 'invalid_email', message: 'Invalid email.' });
    if (!input.password || input.password.length < 8) {
      throw new BadRequestException({
        code: 'weak_password',
        message: 'Password must be at least 8 characters.',
      });
    }
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException({ code: 'email_in_use', message: 'Email already registered.' });
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
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
    return this.sign(user);
  }

  async login(input: { email: string; password: string }): Promise<SessionResult> {
    const email = this.normalizeEmail(input.email);
    const user = await this.users.findOne({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({ code: 'invalid_credentials', message: 'Invalid credentials.' });
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({ code: 'invalid_credentials', message: 'Invalid credentials.' });
    }
    return this.sign(user);
  }

  async refresh(refreshToken: string): Promise<SessionResult> {
    const hash = this.hash(refreshToken);
    const row = await this.refreshes.findOne({ where: { tokenHash: hash } });
    if (!row || row.revokedAt || row.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'invalid_refresh', message: 'Invalid refresh token.' });
    }
    const user = await this.users.findOne({ where: { id: row.userId } });
    if (!user) throw new UnauthorizedException({ code: 'invalid_refresh', message: 'User missing.' });

    // Rotate: revoke old, issue new
    row.revokedAt = new Date();
    await this.refreshes.save(row);
    return this.sign(user);
  }

  async logout(refreshToken: string): Promise<{ ok: true }> {
    const hash = this.hash(refreshToken);
    await this.refreshes.update({ tokenHash: hash }, { revokedAt: new Date() });
    return { ok: true };
  }

  // ---------- profile ----------

  async me(userId: string): Promise<UserView | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return null;
    return this.toView(user);
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
    return this.toView(user);
  }

  async changePassword(
    userId: string,
    body: { currentPassword: string; newPassword: string },
  ): Promise<{ ok: true }> {
    if (!body.newPassword || body.newPassword.length < 8) {
      throw new BadRequestException({
        code: 'weak_password',
        message: 'New password must be at least 8 characters.',
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
    user.passwordHash = await bcrypt.hash(body.newPassword, 12);
    await this.users.save(user);
    // Revoke all refresh tokens to force re-login on other devices
    await this.refreshes.update({ userId, revokedAt: undefined }, { revokedAt: new Date() });
    return { ok: true };
  }

  async deleteAccount(userId: string, body: { password: string }): Promise<{ ok: true }> {
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
    // ON DELETE CASCADE handles refresh tokens, favorites, saved routes, etc.
    await this.users.delete(user.id);
    return { ok: true };
  }

  // ---------- password reset ----------

  async requestPasswordReset(emailRaw: string): Promise<{ ok: true }> {
    const email = this.normalizeEmail(emailRaw);
    const user = await this.users.findOne({ where: { email } });
    if (!user) return { ok: true }; // don't leak existence
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

  async resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
    if (newPassword.length < 8) {
      throw new BadRequestException({
        code: 'weak_password',
        message: 'Password must be at least 8 characters.',
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
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    action.usedAt = new Date();
    await this.users.save(user);
    await this.actions.save(action);
    await this.refreshes.update({ userId: user.id }, { revokedAt: new Date() });
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
    return { ok: true };
  }

  async resendEmailVerification(userId: string): Promise<{ ok: true }> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'user_not_found', message: 'User not found.' });
    await this.sendEmailVerification(user);
    return { ok: true };
  }

  // ---------- OAuth (Google / Apple) ----------

  /**
   * Server-side completion of an OAuth flow that already happened on the
   * client. Front-ends call this after `gapi`/Apple sign-in returns an
   * id_token. Until real verification is wired (jose + provider JWKs)
   * the dev mode trusts the payload's `sub`+`email`+`name`.
   */
  async oauthSignIn(input: {
    provider: 'google' | 'apple';
    idToken: string;
    /** decoded subject (dev mode); ignored if VERIFY_OAUTH=true */
    subject?: string;
    email?: string | null;
    displayName?: string | null;
  }): Promise<SessionResult> {
    let subject = input.subject ?? '';
    let email = input.email ?? null;
    let displayName = input.displayName ?? null;

    if (this.config.get<string>('VERIFY_OAUTH') === 'true') {
      const verified = await this.verifyOauthIdToken(input.provider, input.idToken);
      subject = verified.subject;
      email = verified.email ?? email;
      displayName = verified.name ?? displayName;
    }
    if (!subject) {
      throw new BadRequestException({ code: 'oauth_invalid', message: 'No subject in id_token.' });
    }

    // Find or create the user
    let identity = await this.oauth.findOne({ where: { provider: input.provider, subject } });
    let user: UserEntity | null;
    if (identity) {
      user = await this.users.findOne({ where: { id: identity.userId } });
    } else {
      user = email ? await this.users.findOne({ where: { email: this.normalizeEmail(email) } }) : null;
      if (!user) {
        user = this.users.create({
          email: email ? this.normalizeEmail(email) : null,
          displayName,
          locale: 'en',
          theme: 'system',
          role: 'user',
          emailVerifiedAt: email ? new Date() : null,
        });
        await this.users.save(user);
      }
      identity = await this.oauth.save(
        this.oauth.create({
          userId: user.id,
          provider: input.provider,
          subject,
          email,
          displayName,
        }),
      );
    }
    if (!user) throw new UnauthorizedException({ code: 'oauth_failed', message: 'OAuth failed.' });
    return this.sign(user);
  }

  /**
   * Real JWKS verification entry-point. Currently a placeholder; production
   * imports `jose`:
   *   const { payload } = await jwtVerify(idToken, JWKS_FOR(provider), {
   *     issuer: provider === 'google' ? 'https://accounts.google.com' : 'https://appleid.apple.com',
   *     audience: process.env[`${provider.toUpperCase()}_CLIENT_ID`],
   *   });
   *   return { subject: payload.sub!, email: payload.email, name: payload.name };
   */
  private async verifyOauthIdToken(
    provider: 'google' | 'apple',
    _idToken: string,
  ): Promise<{ subject: string; email?: string; name?: string }> {
    throw new BadRequestException({
      code: 'oauth_verification_not_configured',
      message: `OAuth id-token verification for ${provider} is not configured. ` +
        `Set VERIFY_OAUTH=false in dev or wire jose + JWKS in production.`,
    });
  }

  // ---------- internals ----------

  private async sign(user: UserEntity): Promise<SessionResult> {
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
      }),
    );
    return { accessToken, refreshToken: refresh, user: this.toView(user) };
  }

  private toView(user: UserEntity): UserView {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      locale: user.locale,
      theme: user.theme,
      role: user.role,
      emailVerified: !!user.emailVerifiedAt,
    };
  }

  private normalizeEmail(raw: string): string {
    return raw.trim().toLowerCase();
  }

  private generateOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
