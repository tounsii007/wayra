import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'push_subscription' })
export class PushSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'text' })
  platform!: 'web' | 'ios' | 'android';

  @Column({ type: 'text', unique: true })
  endpoint!: string;

  @Column({ type: 'text', nullable: true })
  p256dh!: string | null;

  @Column({ type: 'text', nullable: true })
  auth!: string | null;

  @Column({ name: 'expo_token', type: 'text', nullable: true })
  expoToken!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;
}
