import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'trip' })
export class TripEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'line_id', type: 'text' })
  lineId!: string;

  @Column({ type: 'text', nullable: true })
  headsign!: string | null;

  @Column({ type: 'smallint', nullable: true })
  direction!: number | null;

  @Column({ name: 'wheelchair_accessible', type: 'boolean', nullable: true })
  wheelchairAccessible!: boolean | null;

  @Column({ name: 'bikes_allowed', type: 'boolean', nullable: true })
  bikesAllowed!: boolean | null;
}
