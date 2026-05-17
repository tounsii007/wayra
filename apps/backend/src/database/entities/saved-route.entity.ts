import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'saved_route' })
export class SavedRouteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text', nullable: true })
  label!: string | null;

  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>;

  @Column({ name: 'notify_on_disruption', type: 'boolean', default: false })
  notifyOnDisruption!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
