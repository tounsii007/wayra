import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'country' })
export class CountryEntity {
  @PrimaryColumn({ type: 'char', length: 2 })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  // geography(POINT, 4326) — TypeORM doesn't parse PostGIS natively, so we
  // read it back via raw SQL when we need lat/lng.
  @Column({ type: 'text', name: 'centroid', nullable: true })
  centroidWkt!: string | null;

  @Column({ name: 'default_zoom', type: 'smallint', nullable: true })
  defaultZoom!: number | null;
}
