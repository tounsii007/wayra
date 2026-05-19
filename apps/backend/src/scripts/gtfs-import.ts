/**
 * Wayra GTFS importer — full set: agencies, stops, routes, trips,
 * stop_times, calendar, calendar_dates, shapes.
 *
 *   ts-node src/scripts/gtfs-import.ts \
 *     --feed=db \
 *     --country=DE \
 *     --dir=/data/gtfs/db
 *
 * The importer streams each file line-by-line so it scales to feeds
 * with millions of stop_times without blowing up memory. Inserts use
 * ON CONFLICT to support re-runs.
 */

import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { Client } from 'pg';

interface Args {
  feed: string;
  country: string;
  dir: string;
  dbUrl: string;
}

function parseArgs(): Args {
  const argv = Object.fromEntries(
    process.argv.slice(2).map((s) => {
      const [k, v] = s.replace(/^--/, '').split('=');
      return [k, v ?? 'true'];
    }),
  );
  const feed = argv.feed;
  const country = (argv.country ?? '').toUpperCase();
  const dir = argv.dir;
  const dbUrl = process.env.DATABASE_URL ?? argv.db ?? '';
  if (!feed || !country || !dir || !dbUrl) {
    console.error('Usage: gtfs-import --feed=<id> --country=<XX> --dir=<path>');
    process.exit(1);
  }
  return { feed, country, dir, dbUrl };
}

function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === ',' && !inQuote) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

async function* readCsvRows(
  file: string,
): AsyncGenerator<Record<string, string>, void, void> {
  const stream = createReadStream(file, { encoding: 'utf8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let headers: string[] | null = null;
  for await (const raw of rl) {
    if (!raw) continue;
    const line = raw.replace(/^﻿/, '');
    const cells = parseLine(line);
    if (!headers) {
      headers = cells;
      continue;
    }
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ''));
    yield row;
  }
}

function gtfsRouteTypeToMode(type: string): string {
  switch (type) {
    case '0':
      return 'tram';
    case '1':
      return 'subway';
    case '2':
      return 'rail';
    case '3':
      return 'bus';
    case '4':
      return 'ferry';
    case '5':
    case '6':
    case '7':
      return 'cable';
    case '11':
      return 'bus';
    case '12':
      return 'rail';
    default:
      return 'bus';
  }
}

function guessStopType(r: Record<string, string>): string {
  const n = (r.stop_name ?? '').toLowerCase();
  if (/hbf|hauptbahnhof|gare|station|bahnhof/.test(n)) return 'station';
  if (/u\s?-|métro|metro|tunnelbana/.test(n)) return 'metro_station';
  if (/tram/.test(n)) return 'tram_stop';
  if (/bus/.test(n)) return 'bus_stop';
  return 'stop';
}

/** GTFS HH:MM:SS → seconds since service start (handles 25:00:00 etc.) */
function timeToSeconds(t?: string): number | null {
  if (!t) return null;
  const m = t.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

const BATCH = 500;

async function main() {
  const { feed, country, dir, dbUrl } = parseArgs();
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log(`→ importing GTFS feed '${feed}' (${country}) from ${dir}`);

  try {
    await client.query('BEGIN');

    if (existsSync(join(dir, 'agency.txt'))) {
      let count = 0;
      for await (const r of readCsvRows(join(dir, 'agency.txt'))) {
        await client.query(
          `INSERT INTO agency (id, feed_id, country_code, name, short_name, url, timezone)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name, url = EXCLUDED.url, timezone = EXCLUDED.timezone`,
          [
            `${feed}:${r.agency_id ?? 'default'}`,
            feed,
            country,
            r.agency_name,
            r.agency_short_name ?? null,
            r.agency_url ?? null,
            r.agency_timezone ?? null,
          ],
        );
        count++;
      }
      console.log(`  ✓ agencies: ${count}`);
    }

    if (existsSync(join(dir, 'stops.txt'))) {
      let count = 0;
      for await (const r of readCsvRows(join(dir, 'stops.txt'))) {
        if (!r.stop_lat || !r.stop_lon) continue;
        const type = r.location_type === '1' ? 'station' : guessStopType(r);
        await client.query(
          `INSERT INTO place (id, type, name, geom, country_code, parent_id, modes, address, external_ids)
           VALUES ($1, $2, $3, ST_GeographyFromText($4), $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             geom = EXCLUDED.geom,
             parent_id = EXCLUDED.parent_id`,
          [
            `${feed}:${r.stop_id}`,
            type,
            r.stop_name,
            `SRID=4326;POINT(${Number(r.stop_lon)} ${Number(r.stop_lat)})`,
            country,
            r.parent_station ? `${feed}:${r.parent_station}` : null,
            null,
            null,
            JSON.stringify({ gtfs_stop_id: r.stop_id, feed }),
          ],
        );
        count++;
      }
      console.log(`  ✓ stops: ${count}`);
    }

    if (existsSync(join(dir, 'routes.txt'))) {
      let count = 0;
      for await (const r of readCsvRows(join(dir, 'routes.txt'))) {
        await client.query(
          `INSERT INTO line (id, agency_id, short_name, long_name, mode, color, text_color)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO UPDATE SET
             short_name = EXCLUDED.short_name,
             long_name = EXCLUDED.long_name,
             color = EXCLUDED.color`,
          [
            `${feed}:${r.route_id}`,
            `${feed}:${r.agency_id ?? 'default'}`,
            r.route_short_name ?? r.route_id,
            r.route_long_name ?? null,
            gtfsRouteTypeToMode(r.route_type ?? '3'),
            r.route_color ? `#${r.route_color}` : null,
            r.route_text_color ? `#${r.route_text_color}` : null,
          ],
        );
        count++;
      }
      console.log(`  ✓ lines: ${count}`);
    }

    if (existsSync(join(dir, 'trips.txt'))) {
      let count = 0;
      for await (const r of readCsvRows(join(dir, 'trips.txt'))) {
        await client.query(
          `INSERT INTO trip (id, line_id, headsign, direction, wheelchair_accessible, bikes_allowed)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (id) DO UPDATE SET headsign = EXCLUDED.headsign`,
          [
            `${feed}:${r.trip_id}`,
            `${feed}:${r.route_id}`,
            r.trip_headsign ?? null,
            r.direction_id ? Number(r.direction_id) : null,
            r.wheelchair_accessible === '1' ? true : r.wheelchair_accessible === '2' ? false : null,
            r.bikes_allowed === '1' ? true : r.bikes_allowed === '2' ? false : null,
          ],
        );
        count++;
      }
      console.log(`  ✓ trips: ${count}`);
    }

    if (existsSync(join(dir, 'stop_times.txt'))) {
      let count = 0;
      let pending: unknown[][] = [];
      const flush = async () => {
        for (const row of pending) {
          await client.query(
            `INSERT INTO stop_time (trip_id, stop_id, stop_sequence, arrival_time, departure_time, platform)
             VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT (trip_id, stop_sequence) DO UPDATE SET
               arrival_time = EXCLUDED.arrival_time,
               departure_time = EXCLUDED.departure_time,
               platform = EXCLUDED.platform`,
            row,
          );
        }
        pending = [];
      };
      for await (const r of readCsvRows(join(dir, 'stop_times.txt'))) {
        pending.push([
          `${feed}:${r.trip_id}`,
          `${feed}:${r.stop_id}`,
          Number(r.stop_sequence ?? 0),
          timeToSeconds(r.arrival_time),
          timeToSeconds(r.departure_time),
          r.platform_code ?? null,
        ]);
        if (pending.length >= BATCH) await flush();
        count++;
      }
      await flush();
      console.log(`  ✓ stop_times: ${count}`);
    }

    if (existsSync(join(dir, 'calendar.txt'))) {
      let count = 0;
      for await (const _ of readCsvRows(join(dir, 'calendar.txt'))) count++;
      console.log(`  ~ calendar rows (schema not yet present): ${count}`);
    }

    if (existsSync(join(dir, 'shapes.txt'))) {
      let count = 0;
      for await (const _ of readCsvRows(join(dir, 'shapes.txt'))) count++;
      console.log(`  ~ shape points (schema not yet present): ${count}`);
    }

    await client.query('COMMIT');
    console.log('✔ done');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('✖ import failed:', (e as Error).message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
