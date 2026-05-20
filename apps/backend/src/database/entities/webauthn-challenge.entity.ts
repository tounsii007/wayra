import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'webauthn_challenge' })
export class WebAuthnChallengeEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  challenge!: string;

  @Column({ type: 'text' })
  kind!: 'register' | 'authenticate';

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;
}
