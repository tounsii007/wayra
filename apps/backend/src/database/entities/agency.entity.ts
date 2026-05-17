import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'agency' })
export class AgencyEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'feed_id', type: 'text', nullable: true })
  feedId!: string | null;

  @Index()
  @Column({ name: 'country_code', type: 'char', length: 2, nullable: true })
  countryCode!: string | null;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'short_name', type: 'text', nullable: true })
  shortName!: string | null;

  @Column({ type: 'text', nullable: true })
  url!: string | null;

  @Column({ type: 'text', nullable: true })
  timezone!: string | null;
}
