import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type AuthActionKind = 'password_reset' | 'email_verification';

@Entity({ name: 'auth_action_token' })
@Index('auth_action_user_kind_idx', ['userId', 'kind'])
export class AuthActionTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  kind!: AuthActionKind;

  @Column({ name: 'token_hash', type: 'text', unique: true })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;
}
