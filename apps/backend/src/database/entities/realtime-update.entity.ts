import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'realtime_update' })
export class RealtimeUpdateEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Index()
  @Column({ name: 'trip_id', type: 'text', nullable: true })
  tripId!: string | null;

  @Index()
  @Column({ name: 'stop_id', type: 'text', nullable: true })
  stopId!: string | null;

  @Column({ type: 'text' })
  type!: string;

  @Column({ name: 'delay_seconds', type: 'int', nullable: true })
  delaySeconds!: number | null;

  @Column({ name: 'predicted_time', type: 'timestamptz', nullable: true })
  predictedTime!: Date | null;

  @Column({ name: 'new_platform', type: 'text', nullable: true })
  newPlatform!: string | null;

  @Column({ name: 'fetched_at', type: 'timestamptz', default: () => 'now()' })
  fetchedAt!: Date;
}
