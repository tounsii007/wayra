import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'oauth_identity' })
@Index(['provider', 'subject'], { unique: true })
export class OauthIdentityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  provider!: 'google' | 'apple';

  @Column({ type: 'text' })
  subject!: string;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Column({ name: 'display_name', type: 'text', nullable: true })
  displayName!: string | null;

  @Column({ name: 'linked_at', type: 'timestamptz', default: () => 'now()' })
  linkedAt!: Date;
}
