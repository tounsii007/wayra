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

async function* readCsvRows(file: string): AsyncGenerator<Record<string, string>, void, void> {
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

/** GTFS YYYYMMDD → ISO date string */
function gtfsDate(s?: string): string | null {
  if (!s || !/^\d{8}$/.test(s)) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
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
          `INSERT INTO trip
             (id, line_id, headsign, direction, wheelchair_accessible, bikes_allowed, service_id, shape_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET
             headsign = EXCLUDED.headsign,
             service_id = EXCLUDED.service_id,
             shape_id = EXCLUDED.shape_id`,
          [
            `${feed}:${r.trip_id}`,
            `${feed}:${r.route_id}`,
            r.trip_headsign ?? null,
            r.direction_id ? Number(r.direction_id) : null,
            r.wheelchair_accessible === '1' ? true : r.wheelchair_accessible === '2' ? false : null,
            r.bikes_allowed === '1' ? true : r.bikes_allowed === '2' ? false : null,
            r.service_id ? `${feed}:${r.service_id}` : null,
            r.shape_id ? `${feed}:${r.shape_id}` : null,
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
      for await (const r of readCsvRows(join(dir, 'calendar.txt'))) {
        await client.query(
          `INSERT INTO service_day
             (id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (id) DO UPDATE SET
             monday=EXCLUDED.monday, tuesday=EXCLUDED.tuesday, wednesday=EXCLUDED.wednesday,
             thursday=EXCLUDED.thursday, friday=EXCLUDED.friday,
             saturday=EXCLUDED.saturday, sunday=EXCLUDED.sunday,
             start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date`,
          [
            `${feed}:${r.service_id}`,
            r.monday === '1',
            r.tuesday === '1',
            r.wednesday === '1',
            r.thursday === '1',
            r.friday === '1',
            r.saturday === '1',
            r.sunday === '1',
            r.start_date ? gtfsDate(r.start_date) : null,
            r.end_date ? gtfsDate(r.end_date) : null,
          ],
        );
        count++;
      }
      console.log(`  ✓ service_day: ${count}`);
    }

    if (existsSync(join(dir, 'calendar_dates.txt'))) {
      let count = 0;
      for await (const r of readCsvRows(join(dir, 'calendar_dates.txt'))) {
        await client.query(
          `INSERT INTO service_date (service_id, date, exception_type)
           VALUES ($1, $2, $3)
           ON CONFLICT (service_id, date) DO UPDATE SET exception_type=EXCLUDED.exception_type`,
          [`${feed}:${r.service_id}`, gtfsDate(r.date), Number(r.exception_type ?? '1')],
        );
        count++;
      }
      console.log(`  ✓ service_date exceptions: ${count}`);
    }

    if (existsSync(join(dir, 'shapes.txt'))) {
      let count = 0;
      for await (const r of readCsvRows(join(dir, 'shapes.txt'))) {
        if (!r.shape_pt_lat || !r.shape_pt_lon) continue;
        await client.query(
          `INSERT INTO shape_point (shape_id, shape_pt_sequence, geom, shape_dist_traveled)
           VALUES ($1, $2, ST_GeographyFromText($3), $4)
           ON CONFLICT (shape_id, shape_pt_sequence) DO UPDATE SET
             geom=EXCLUDED.geom, shape_dist_traveled=EXCLUDED.shape_dist_traveled`,
          [
            `${feed}:${r.shape_id}`,
            Number(r.shape_pt_sequence ?? 0),
            `SRID=4326;POINT(${Number(r.shape_pt_lon)} ${Number(r.shape_pt_lat)})`,
            r.shape_dist_traveled ? Number(r.shape_dist_traveled) : null,
          ],
        );
        count++;
      }
      console.log(`  ✓ shape_point: ${count}`);
    }

    if (existsSync(join(dir, 'transfers.txt'))) {
      let count = 0;
      for await (const r of readCsvRows(join(dir, 'transfers.txt'))) {
        if (!r.from_stop_id || !r.to_stop_id) continue;
        await client.query(
          `INSERT INTO transfer (from_stop_id, to_stop_id, transfer_type, min_transfer_time)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (from_stop_id, to_stop_id) DO UPDATE SET
             transfer_type=EXCLUDED.transfer_type,
             min_transfer_time=EXCLUDED.min_transfer_time`,
          [
            `${feed}:${r.from_stop_id}`,
            `${feed}:${r.to_stop_id}`,
            Number(r.transfer_type ?? '0'),
            r.min_transfer_time ? Number(r.min_transfer_time) : null,
          ],
        );
        count++;
      }
      console.log(`  ✓ transfer rules: ${count}`);
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
