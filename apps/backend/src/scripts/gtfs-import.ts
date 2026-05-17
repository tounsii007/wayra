/**
 * Wayra GTFS importer — minimal, dependency-light skeleton.
 *
 * Reads a downloaded GTFS feed (a directory containing `agency.txt`,
 * `stops.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`) and upserts
 * the rows into Postgres. Designed to be run per-feed:
 *
 *   ts-node src/scripts/gtfs-import.ts \
 *     --feed=db          \
 *     --country=DE       \
 *     --dir=/data/gtfs/db
 *
 * Production should switch to streaming parsers (csv-parser + pg COPY) and
 * a queue-based scheduler. This script is fine for the MVP / curated feeds.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
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
    console.error(
      'Usage: gtfs-import --feed=<id> --country=<XX> --dir=<path> (DATABASE_URL or --db=)',
    );
    process.exit(1);
  }
  return { feed, country, dir, dbUrl };
}

function readCsv(file: string): Array<Record<string, string>> {
  const raw = readFileSync(file, 'utf8').replace(/^﻿/, '');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = parseLine(lines[0]!);
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ''));
    return row;
  });
}

function parseLine(line: string): string[] {
  // GTFS CSV: simple double-quote escapes, comma separators.
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

async function main() {
  const { feed, country, dir, dbUrl } = parseArgs();
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log(`→ importing GTFS feed '${feed}' (${country}) from ${dir}`);

  try {
    await client.query('BEGIN');

    // --- agency ---
    if (existsSync(join(dir, 'agency.txt'))) {
      const rows = readCsv(join(dir, 'agency.txt'));
      for (const r of rows) {
        await client.query(
          `INSERT INTO agency (id, feed_id, country_code, name, short_name, url, timezone)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             short_name = EXCLUDED.short_name,
             url = EXCLUDED.url,
             timezone = EXCLUDED.timezone`,
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
      }
      console.log(`  ✓ agencies: ${rows.length}`);
    }

    // --- stops (placed into the unified `place` table) ---
    if (existsSync(join(dir, 'stops.txt'))) {
      const rows = readCsv(join(dir, 'stops.txt'));
      let inserted = 0;
      for (const r of rows) {
        if (!r.stop_lat || !r.stop_lon) continue;
        const type =
          r.location_type === '1' ? 'station' : guessStopType(r);
        await client.query(
          `INSERT INTO place
             (id, type, name, geom, country_code, parent_id, modes, address, external_ids)
           VALUES ($1, $2, $3,
                   ST_GeographyFromText($4),
                   $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             geom = EXCLUDED.geom,
             parent_id = EXCLUDED.parent_id,
             modes = EXCLUDED.modes,
             external_ids = EXCLUDED.external_ids`,
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
        inserted++;
      }
      console.log(`  ✓ stops: ${inserted}`);
    }

    // --- routes → line ---
    if (existsSync(join(dir, 'routes.txt'))) {
      const rows = readCsv(join(dir, 'routes.txt'));
      for (const r of rows) {
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
      }
      console.log(`  ✓ lines: ${rows.length}`);
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

function guessStopType(r: Record<string, string>): string {
  const n = (r.stop_name ?? '').toLowerCase();
  if (/hbf|hauptbahnhof|gare|station|bahnhof/.test(n)) return 'station';
  if (/u\s?-|métro|metro|tunnelbana/.test(n)) return 'metro_station';
  if (/tram/.test(n)) return 'tram_stop';
  if (/bus/.test(n)) return 'bus_stop';
  return 'stop';
}

function gtfsRouteTypeToMode(type: string): string {
  // https://developers.google.com/transit/gtfs/reference#routestxt
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
      return 'cable';
    case '6':
      return 'cable';
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
