import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Unified place row — covers city, neighborhood, station, stop, airport, POI, …
 * Geometry is stored as `geography(POINT, 4326)`. We deliberately keep TypeORM
 * out of PostGIS parsing — the service layer reads `ST_X(geom)` / `ST_Y(geom)`
 * (or `ST_AsGeoJSON`) via the QueryRunner / raw SQL where it actually needs
 * coordinates.
 */
@Entity({ name: 'place' })
@Index('place_country_idx', ['countryCode'])
@Index('place_type_idx', ['type'])
export class PlaceEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  type!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'country_code', type: 'char', length: 2, nullable: true })
  countryCode!: string | null;

  @Column({ name: 'parent_id', type: 'text', nullable: true })
  parentId!: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  modes!: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  address!: Record<string, unknown> | null;

  @Column({ name: 'localized_names', type: 'jsonb', nullable: true })
  localizedNames!: Record<string, string> | null;

  @Column({ name: 'external_ids', type: 'jsonb', nullable: true })
  externalIds!: Record<string, string> | null;
}
