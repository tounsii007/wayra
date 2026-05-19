import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'vehicle_position' })
export class VehiclePositionEntity {
  @PrimaryColumn({ name: 'vehicle_id', type: 'text' })
  vehicleId!: string;

  @PrimaryColumn({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt!: Date;

  @Column({ name: 'trip_id', type: 'text', nullable: true })
  tripId!: string | null;

  // geography(POINT, 4326) — query via raw SQL for coordinates
  @Column({ type: 'text', nullable: true })
  geom!: string | null;

  @Column({ type: 'real', nullable: true })
  bearing!: number | null;

  @Column({ name: 'speed_mps', type: 'real', nullable: true })
  speedMps!: number | null;

  @Column({ name: 'feed_id', type: 'text', nullable: true })
  feedId!: string | null;
}
