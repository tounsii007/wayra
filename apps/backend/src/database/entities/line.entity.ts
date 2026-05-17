import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'line' })
export class LineEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'agency_id', type: 'text' })
  agencyId!: string;

  @Column({ name: 'short_name', type: 'text' })
  shortName!: string;

  @Column({ name: 'long_name', type: 'text', nullable: true })
  longName!: string | null;

  @Column({ type: 'text' })
  mode!: string;

  @Column({ type: 'char', length: 7, nullable: true })
  color!: string | null;

  @Column({ name: 'text_color', type: 'char', length: 7, nullable: true })
  textColor!: string | null;
}
