# Migrations

The `db/init/*.sql` scripts in `apps/backend/db/init/` are the canonical
schema for fresh databases (they run once on `docker compose up` when the
Postgres data volume is empty).

For incremental schema changes in production, use TypeORM migrations:

```sh
# Generate a migration from current entity ↔ schema diff
pnpm --filter @wayra/backend migration:generate src/database/migrations/AddXyz

# Apply pending migrations
pnpm --filter @wayra/backend migration:run

# Roll back the last one
pnpm --filter @wayra/backend migration:revert
```

The `wayra_migrations` table tracks which have been applied.
