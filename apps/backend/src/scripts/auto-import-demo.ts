/**
 * Idempotent demo-import bootstrap.
 *
 * Invoked from the backend container's entrypoint when
 * WAYRA_AUTO_IMPORT_DEMO=true. Checks whether the `place` table already
 * has rows from feed=wayra-demo; if not, imports the bundled feed.
 *
 *   node dist/scripts/auto-import-demo.js
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { Client } from 'pg';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('[demo-import] DATABASE_URL not set — skipping.');
    return;
  }
  const feed = process.env.WAYRA_DEMO_FEED ?? 'wayra-demo';
  const dir = process.env.WAYRA_DEMO_DIR ?? '/app/db/demo-gtfs/wayra-demo';
  const country = (process.env.WAYRA_DEMO_COUNTRY ?? 'DE').toUpperCase();

  if (!existsSync(dir)) {
    console.log(`[demo-import] demo dir ${dir} missing — skipping.`);
    return;
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const { rows } = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM place WHERE id LIKE $1`,
      [`${feed}:%`],
    );
    if (Number(rows[0]?.count ?? '0') > 0) {
      console.log(`[demo-import] ${feed} already loaded — skipping.`);
      return;
    }
  } catch (e) {
    console.warn(`[demo-import] precheck failed: ${(e as Error).message} — skipping.`);
    return;
  } finally {
    await client.end().catch(() => undefined);
  }

  console.log(`[demo-import] importing ${feed} (${country}) from ${dir} …`);
  const result = spawnSync(
    process.execPath,
    ['dist/scripts/gtfs-import.js', `--feed=${feed}`, `--country=${country}`, `--dir=${dir}`],
    { stdio: 'inherit', env: process.env },
  );
  if (result.status !== 0) {
    console.warn(`[demo-import] importer exited with ${result.status}`);
  }
}

void main();
