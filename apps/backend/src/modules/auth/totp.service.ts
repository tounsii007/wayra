import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { authenticator } from 'otplib';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { TotpSecretEntity, UserEntity } from '../../database/entities';

@Injectable()
export class TotpService {
  constructor(
    @InjectRepository(TotpSecretEntity) private readonly secrets: Repository<TotpSecretEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  /** Generate a fresh (un-enabled) secret + provisioning URI for an authenticator app. */
  async setup(userId: string): Promise<{ secret: string; uri: string }> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user)
      throw new BadRequestException({ code: 'user_not_found', message: 'User not found.' });
    const secret = authenticator.generateSecret();
    await this.secrets.save(
      this.secrets.create({
        userId,
        secret,
        enabled: false,
        enabledAt: null,
        backupCodesHash: null,
      }),
    );
    const uri = authenticator.keyuri(user.email ?? user.id, 'Wayra', secret);
    return { secret, uri };
  }

  /** Verify a code against the stored secret and flip enabled to true on success. */
  async enable(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const row = await this.secrets.findOne({ where: { userId } });
    if (!row)
      throw new BadRequestException({ code: 'totp_not_setup', message: 'TOTP not initialised.' });
    if (!authenticator.check(code, row.secret)) {
      throw new UnauthorizedException({ code: 'totp_invalid', message: 'Invalid TOTP code.' });
    }
    const codes = Array.from({ length: 8 }, () => randomBytes(5).toString('hex'));
    row.enabled = true;
    row.enabledAt = new Date();
    row.backupCodesHash = await Promise.all(codes.map((c) => bcrypt.hash(c, 10)));
    await this.secrets.save(row);
    return { backupCodes: codes };
  }

  /** Disable 2FA after re-verifying a current code. */
  async disable(userId: string, code: string): Promise<{ ok: true }> {
    const row = await this.secrets.findOne({ where: { userId } });
    if (!row || !row.enabled) return { ok: true };
    if (!authenticator.check(code, row.secret)) {
      throw new UnauthorizedException({ code: 'totp_invalid', message: 'Invalid TOTP code.' });
    }
    await this.secrets.delete({ userId });
    return { ok: true };
  }

  /** True if the user has TOTP enabled. */
  async isEnabled(userId: string): Promise<boolean> {
    const row = await this.secrets.findOne({ where: { userId } });
    return !!row?.enabled;
  }

  /**
   * Validate a TOTP code OR a single-use backup code. Backup codes are
   * consumed on use. Returns true if either succeeds.
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const row = await this.secrets.findOne({ where: { userId } });
    if (!row || !row.enabled) return false;
    if (authenticator.check(code, row.secret)) return true;

    // Backup codes
    const remaining: string[] = [];
    let consumed = false;
    for (const hash of row.backupCodesHash ?? []) {
      if (!consumed && (await bcrypt.compare(code, hash))) {
        consumed = true;
        continue;
      }
      remaining.push(hash);
    }
    if (consumed) {
      row.backupCodesHash = remaining;
      await this.secrets.save(row);
      return true;
    }
    return false;
  }
}
