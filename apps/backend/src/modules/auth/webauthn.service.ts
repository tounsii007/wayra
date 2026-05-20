import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import {
  UserEntity,
  WebAuthnCredentialEntity,
  WebAuthnChallengeEntity,
} from '../../database/entities';

interface RpConfig {
  id: string;
  name: string;
  origin: string[];
}

@Injectable()
export class WebAuthnService {
  private readonly logger = new Logger(WebAuthnService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(WebAuthnCredentialEntity)
    private readonly creds: Repository<WebAuthnCredentialEntity>,
    @InjectRepository(WebAuthnChallengeEntity)
    private readonly challenges: Repository<WebAuthnChallengeEntity>,
  ) {}

  private rp(): RpConfig {
    const id = this.config.get<string>('WEBAUTHN_RP_ID') ?? 'localhost';
    const name = this.config.get<string>('WEBAUTHN_RP_NAME') ?? 'Wayra';
    const origins = (
      this.config.get<string>('WEBAUTHN_ORIGINS') ?? 'http://localhost:3000'
    )
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return { id, name, origin: origins };
  }

  async generateRegistrationOptions(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'user_not_found', message: 'User not found.' });

    const existing = await this.creds.find({ where: { userId } });
    const rp = this.rp();

    const opts = await generateRegistrationOptions({
      rpName: rp.name,
      rpID: rp.id,
      userID: Buffer.from(userId),
      userName: user.email ?? user.id,
      userDisplayName: user.displayName ?? user.email ?? user.id,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: existing.map((c) => ({
        id: c.credentialId,
        transports: (c.transports ?? undefined) as never,
      })),
    });

    await this.challenges.save(
      this.challenges.create({
        userId,
        challenge: opts.challenge,
        kind: 'register',
        expiresAt: new Date(Date.now() + 5 * 60_000),
      }),
    );

    return opts;
  }

  async verifyRegistration(
    userId: string,
    body: { response: RegistrationResponseJSON; deviceName?: string },
  ): Promise<{ ok: true; credentialId: string }> {
    const row = await this.challenges.findOne({ where: { userId, kind: 'register' } });
    if (!row || row.expiresAt < new Date()) {
      throw new BadRequestException({ code: 'challenge_missing', message: 'Challenge missing or expired.' });
    }
    const rp = this.rp();
    const verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: row.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.id,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException({ code: 'attestation_invalid', message: 'Attestation invalid.' });
    }

    const info = verification.registrationInfo as {
      credential?: { id: string; publicKey: Uint8Array; counter: number; transports?: string[] };
    };
    const cred = info.credential;
    if (!cred) {
      throw new BadRequestException({ code: 'no_credential', message: 'No credential in registration result.' });
    }

    await this.creds.save(
      this.creds.create({
        userId,
        credentialId: cred.id,
        publicKey: Buffer.from(cred.publicKey),
        counter: String(cred.counter),
        transports: cred.transports ?? null,
        deviceName: body.deviceName ?? null,
      }),
    );
    await this.challenges.delete({ userId });
    return { ok: true, credentialId: cred.id };
  }

  async generateAuthenticationOptions(userId: string) {
    const list = await this.creds.find({ where: { userId } });
    const rp = this.rp();
    const opts = await generateAuthenticationOptions({
      rpID: rp.id,
      allowCredentials: list.map((c) => ({
        id: c.credentialId,
        transports: (c.transports ?? undefined) as never,
      })),
      userVerification: 'preferred',
    });
    await this.challenges.save(
      this.challenges.create({
        userId,
        challenge: opts.challenge,
        kind: 'authenticate',
        expiresAt: new Date(Date.now() + 5 * 60_000),
      }),
    );
    return opts;
  }

  async verifyAuthentication(
    userId: string,
    body: { response: AuthenticationResponseJSON },
  ): Promise<{ ok: true }> {
    const row = await this.challenges.findOne({ where: { userId, kind: 'authenticate' } });
    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'challenge_missing', message: 'Challenge missing.' });
    }
    const credRow = await this.creds.findOne({
      where: { credentialId: body.response.id, userId },
    });
    if (!credRow) {
      throw new UnauthorizedException({ code: 'unknown_credential', message: 'Unknown credential.' });
    }

    const rp = this.rp();
    const verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: row.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.id,
      credential: {
        id: credRow.credentialId,
        publicKey: new Uint8Array(credRow.publicKey),
        counter: Number(credRow.counter),
        transports: (credRow.transports ?? undefined) as never,
      },
    });

    if (!verification.verified) {
      throw new UnauthorizedException({ code: 'auth_failed', message: 'Assertion invalid.' });
    }
    credRow.counter = String(verification.authenticationInfo.newCounter);
    credRow.lastUsedAt = new Date();
    await this.creds.save(credRow);
    await this.challenges.delete({ userId });
    return { ok: true };
  }

  async listCredentials(userId: string) {
    const list = await this.creds.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return list.map((c) => ({
      id: c.id,
      deviceName: c.deviceName,
      createdAt: c.createdAt,
      lastUsedAt: c.lastUsedAt,
    }));
  }

  async removeCredential(userId: string, id: string): Promise<{ ok: true }> {
    const c = await this.creds.findOne({ where: { id, userId } });
    if (!c) throw new NotFoundException({ code: 'credential_not_found', message: 'Not found.' });
    await this.creds.delete({ id });
    return { ok: true };
  }
}
