/**
 * Standalone TypeORM DataSource for the migration CLI.
 *
 * Run:
 *   pnpm --filter @wayra/backend exec typeorm-ts-node-commonjs migration:generate src/database/migrations/<Name> -d src/database/data-source.ts
 *   pnpm --filter @wayra/backend exec typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts
 *   pnpm --filter @wayra/backend exec typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { entities } from './entities';

loadEnv();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities,
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'wayra_migrations',
  synchronize: false,
});
