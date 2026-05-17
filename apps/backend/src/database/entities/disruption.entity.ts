import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'disruption' })
export class DisruptionEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  type!: string;

  @Column({ type: 'text' })
  severity!: string;

  @Column({ type: 'text', nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'start_time', type: 'timestamptz', nullable: true })
  startTime!: Date | null;

  @Column({ name: 'end_time', type: 'timestamptz', nullable: true })
  endTime!: Date | null;

  @Column({ name: 'affected_lines', type: 'text', array: true, nullable: true })
  affectedLines!: string[] | null;

  @Column({ name: 'affected_stops', type: 'text', array: true, nullable: true })
  affectedStops!: string[] | null;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  language!: string | null;
}
