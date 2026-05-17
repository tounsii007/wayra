import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'offline_region' })
export class OfflineRegionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'country_code', type: 'char', length: 2, nullable: true })
  countryCode!: string | null;

  // geography(POLYGON, 4326) — read via raw SQL when bbox is needed.
  @Column({ type: 'text', nullable: true })
  bbox!: string | null;

  @Column({ name: 'size_bytes', type: 'bigint', nullable: true })
  sizeBytes!: string | null;

  @Column({ type: 'timestamptz' })
  version!: Date;

  @Column({ name: 'downloaded_at', type: 'timestamptz', default: () => 'now()' })
  downloadedAt!: Date;
}
