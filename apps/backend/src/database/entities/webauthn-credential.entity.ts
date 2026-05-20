import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'webauthn_credential' })
@Index('webauthn_user_idx', ['userId'])
export class WebAuthnCredentialEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  /** base64url-encoded credential ID */
  @Column({ name: 'credential_id', type: 'text', unique: true })
  credentialId!: string;

  @Column({ name: 'public_key', type: 'bytea' })
  publicKey!: Buffer;

  @Column({ type: 'bigint', default: 0 })
  counter!: string;

  @Column({ type: 'text', array: true, nullable: true })
  transports!: string[] | null;

  @Column({ name: 'device_name', type: 'text', nullable: true })
  deviceName!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;
}
