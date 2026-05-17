import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { distanceMeters, fuzzyScore } from '@wayra/shared';
import type {
  Coordinates,
  Place,
  PlaceSuggestion,
  PlaceType,
  TransitMode,
} from '@wayra/types';
import { sampleSuggestions } from './sample-data';

interface PlaceRow {
  id: string;
  type: string;
  name: string;
  lat: number;
  lng: number;
  country_code: string;
  modes: string[] | null;
  localized_names: Record<string, string> | null;
  external_ids: Record<string, string> | null;
  score: number;
  distance_m: number | null;
}

/**
 * Places service.
 *
 * Hot path = Postgres `pg_trgm` similarity + `ST_Distance` for nearness boost.
 * If the DB is unreachable or empty (fresh dev), the service falls back to
 * the in-memory MVP sample dataset so the UI stays useful.
 */
@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private dbReady = true;
  private warnedNoDb = false;

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async findById(id: string): Promise<Place | undefined> {
    if (this.dbReady) {
      try {
        const rows = await this.ds.query<Array<PlaceRow>>(
          `SELECT id, type, name,
                  ST_Y(geom::geometry) AS lat,
                  ST_X(geom::geometry) AS lng,
                  country_code,
                  modes,
                  localized_names,
                  external_ids,
                  1.0 AS score,
                  NULL::float AS distance_m
           FROM place WHERE id = $1
           LIMIT 1`,
          [id],
        );
        if (rows.length > 0) return this.rowToPlace(rows[0]!);
      } catch (e) {
        this.markDbUnavailable(e);
      }
    }
    return sampleSuggestions.find((p) => p.id === id);
  }

  async autocomplete(
    query: string,
    opts: { near?: Coordinates; limit?: number; countryCodes?: string[] } = {},
  ): Promise<{ suggestions: PlaceSuggestion[] }> {
    if (!query || query.trim().length === 0) return { suggestions: [] };
    const limit = Math.min(opts.limit ?? 8, 20);

    if (this.dbReady) {
      try {
        const params: unknown[] = [query, limit];
        let where = `(unaccent(lower(name)) % unaccent(lower($1))
                       OR unaccent(lower(name)) ILIKE unaccent(lower($1)) || '%')`;
        if (opts.countryCodes?.length) {
          params.push(opts.countryCodes);
          where += ` AND country_code = ANY($${params.length}::char(2)[])`;
        }

        let nearbySql = '';
        if (opts.near) {
          params.push(`POINT(${opts.near.lng} ${opts.near.lat})`);
          nearbySql = `, ST_Distance(geom, ST_GeographyFromText('SRID=4326;' || $${params.length})) AS distance_m`;
        }

        const sql = `
          SELECT id, type, name,
                 ST_Y(geom::geometry) AS lat,
                 ST_X(geom::geometry) AS lng,
                 country_code,
                 modes,
                 localized_names,
                 external_ids,
                 similarity(unaccent(lower(name)), unaccent(lower($1))) AS score
                 ${nearbySql || ', NULL::float AS distance_m'}
          FROM place
          WHERE ${where}
          ORDER BY score DESC ${opts.near ? ', distance_m ASC NULLS LAST' : ''}
          LIMIT $2`;

        const rows = await this.ds.query<Array<PlaceRow>>(sql, params);
        if (rows.length > 0) {
          return {
            suggestions: rows.map((r) => ({
              place: this.rowToPlace(r),
              score: r.score,
              ...(r.distance_m !== null && { distanceMeters: Number(r.distance_m) }),
            })),
          };
        }
      } catch (e) {
        this.markDbUnavailable(e);
      }
    }

    // Fallback to in-memory.
    return this.autocompleteInMemory(query, opts);
  }

  async nearbyStops(
    coords: Coordinates,
    radiusMeters: number,
    limit: number,
  ): Promise<{ stops: Array<Place & { distanceMeters: number }> }> {
    const stopTypes = ['stop', 'bus_stop', 'tram_stop', 'metro_station', 'station'];
    if (this.dbReady) {
      try {
        const rows = await this.ds.query<
          Array<PlaceRow & { distance_m: number }>
        >(
          `SELECT id, type, name,
                  ST_Y(geom::geometry) AS lat,
                  ST_X(geom::geometry) AS lng,
                  country_code, modes, localized_names, external_ids,
                  0 AS score,
                  ST_Distance(geom, ST_GeographyFromText($1)) AS distance_m
           FROM place
           WHERE type = ANY($2::text[])
             AND ST_DWithin(geom, ST_GeographyFromText($1), $3)
           ORDER BY distance_m ASC
           LIMIT $4`,
          [
            `SRID=4326;POINT(${coords.lng} ${coords.lat})`,
            stopTypes,
            radiusMeters,
            limit,
          ],
        );
        if (rows.length > 0) {
          return {
            stops: rows.map((r) => ({
              ...this.rowToPlace(r),
              distanceMeters: Number(r.distance_m),
            })),
          };
        }
      } catch (e) {
        this.markDbUnavailable(e);
      }
    }

    // Fallback
    const stops = sampleSuggestions
      .filter((p) => stopTypes.includes(p.type))
      .map((p) => ({ ...p, distanceMeters: distanceMeters(coords, p.coordinates) }))
      .filter((p) => p.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, limit);
    return { stops };
  }

  // --- internals ---

  private rowToPlace(r: PlaceRow): Place {
    return {
      id: r.id,
      type: r.type as PlaceType,
      name: r.name,
      coordinates: { lat: Number(r.lat), lng: Number(r.lng) },
      countryCode: r.country_code as Place['countryCode'],
      modes: (r.modes ?? undefined) as TransitMode[] | undefined,
      localizedNames: r.localized_names ?? undefined,
      externalIds: r.external_ids ?? undefined,
    };
  }

  private autocompleteInMemory(
    query: string,
    opts: { near?: Coordinates; limit?: number; countryCodes?: string[] },
  ): { suggestions: PlaceSuggestion[] } {
    const limit = opts.limit ?? 8;
    const scored = sampleSuggestions
      .filter((p) => !opts.countryCodes || opts.countryCodes.includes(p.countryCode))
      .map((place) => {
        const nameScore = fuzzyScore(query, place.name);
        const localizedScore = Math.max(
          0,
          ...Object.values(place.localizedNames ?? {}).map((n) => fuzzyScore(query, n)),
        );
        const score = Math.max(nameScore, localizedScore);
        const distance = opts.near ? distanceMeters(opts.near, place.coordinates) : undefined;
        const nearBonus =
          distance !== undefined && distance < 25_000 ? 0.15 * (1 - distance / 25_000) : 0;
        return {
          place,
          score: Math.min(1, score + nearBonus),
          ...(distance !== undefined && { distanceMeters: distance }),
        };
      })
      .filter((s) => s.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { suggestions: scored };
  }

  private markDbUnavailable(e: unknown): void {
    this.dbReady = false;
    if (!this.warnedNoDb) {
      this.warnedNoDb = true;
      this.logger.warn(
        `Postgres unavailable or empty (${(e as Error).message}); using in-memory samples.`,
      );
    }
    // Re-arm after a minute so a recovering DB gets picked up automatically.
    setTimeout(() => {
      this.dbReady = true;
      this.warnedNoDb = false;
    }, 60_000);
  }
}
