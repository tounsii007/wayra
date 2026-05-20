# Contributing to Wayra

Thanks for taking the time to look. Wayra is a monorepo for a multimodal
transit app spanning Germany / France / Tunisia. The goal of this doc is
to get you productive in under thirty minutes.

## Layout

```
apps/
  backend/   NestJS 10 + Postgres/PostGIS + Redis + Socket.IO
  web/       Next.js 15 (App Router) + Tailwind + MapLibre
  mobile/    Expo 52 (React Native + Expo Router) + MapLibre RN
packages/
  types/     shared TS domain model
  shared/    pure utilities (geo, fuzzy, format, ApiClient)
  i18n/      DE / EN / FR / AR / IT / ES translation JSON
  ui/        design tokens + Tailwind preset
```

## Local setup

```sh
corepack enable
pnpm install
cp .env.example .env

pnpm docker:up          # Postgres + Redis + Adminer
pnpm dev                # web (3000) + backend (4000) + mobile (Metro)
```

Open <http://localhost:3000> and <http://localhost:4000/docs>.

## Branch + commit conventions

- Branch off `main`; PRs targeted at `main`.
- Commit messages are conventional (`feat(scope): …`, `fix(scope): …`,
  `test(scope): …`, `docs: …`, `chore: …`, `ci: …`).
- Each PR squash-merges to a single commit; the squashed title becomes
  the release-notes entry.

## Code style

- Prettier + ESLint enforced in CI.
- TypeScript strict mode everywhere; avoid `any` — `unknown` plus a
  narrow cast is almost always better.
- React components are functional with hooks; avoid class components.
- New endpoints: add a Zod-equivalent class-validator DTO and surface
  the schema in Swagger.

## Tests

```sh
pnpm --filter @wayra/shared test     # pure utility tests
pnpm --filter @wayra/backend test    # backend service unit tests
```

Add a test alongside any new public service method. We prefer pure unit
tests over heavyweight integration tests; spin up a real Postgres only
when behaviour depends on PostGIS / pg_trgm.

## What's "ready to ship"

- ✅ Tests pass locally and in CI
- ✅ TypeScript compiles strict
- ✅ `pnpm --filter @wayra/web build` + `@wayra/backend build` succeed
- ✅ No `console.log` left in committed code (use the Pino logger)
- ✅ User-facing strings are i18n-ed (no hardcoded English in feature
  components — admin pages excepted for now)
- ✅ Migrations: if you touched the schema, generate a migration
  (`pnpm --filter @wayra/backend migration:generate src/database/migrations/AddXyz`)

## Reporting security issues

See [SECURITY.md](./SECURITY.md).

## Code of conduct

Be excellent. Disagreements about engineering are welcome; personal
attacks aren't. Maintainers will moderate.
