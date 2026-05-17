import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'stop_time' })
export class StopTimeEntity {
  @PrimaryColumn({ name: 'trip_id', type: 'text' })
  tripId!: string;

  @PrimaryColumn({ name: 'stop_sequence', type: 'int' })
  stopSequence!: number;

  @Index()
  @Column({ name: 'stop_id', type: 'text' })
  stopId!: string;

  @Column({ name: 'arrival_time', type: 'int', nullable: true })
  arrivalTime!: number | null;

  @Column({ name: 'departure_time', type: 'int', nullable: true })
  departureTime!: number | null;

  @Column({ type: 'text', nullable: true })
  platform!: string | null;
}
