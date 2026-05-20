#!/bin/sh
set -e

# Wait until Postgres accepts queries.
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] waiting for database…"
  i=0
  until node -e "
    const { Client } = require('pg');
    new Client({ connectionString: process.env.DATABASE_URL })
      .connect()
      .then((c) => c.end().then(() => process.exit(0)))
      .catch(() => process.exit(1));
  " >/dev/null 2>&1; do
    i=$((i + 1))
    if [ $i -gt 30 ]; then
      echo "[entrypoint] db never became reachable — continuing anyway"
      break
    fi
    sleep 2
  done
fi

# Optional one-shot demo import (idempotent — skips if data exists).
if [ "$WAYRA_AUTO_IMPORT_DEMO" = "true" ]; then
  echo "[entrypoint] auto-importing demo GTFS…"
  node dist/scripts/auto-import-demo.js || echo "[entrypoint] demo import failed (non-fatal)"
fi

exec "$@"
