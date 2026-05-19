import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'totp_secret' })
export class TotpSecretEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  secret!: string;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ name: 'enabled_at', type: 'timestamptz', nullable: true })
  enabledAt!: Date | null;

  @Column({ name: 'backup_codes_hash', type: 'text', array: true, nullable: true })
  backupCodesHash!: string[] | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
