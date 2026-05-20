# ADR 0001: Monorepo & primary stack

- **Status**: Accepted
- **Date**: 2026-05
- **Deciders**: Wayra core team

## Context

We're building a multimodal transit app for Europe + North Africa with a
public web app, native iOS/Android apps, and a server-side API that
ingests open transit data (GTFS / GTFS-RT) and integrates third-party
provider APIs. We want strong type sharing, fast iteration, and a single
place to land cross-cutting changes (translations, design tokens, types).

## Decision

- **Monorepo** with `pnpm workspaces` + Turborepo for task orchestration.
- **Web**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind.
- **Mobile**: Expo 52 (RN 0.76, new architecture) + Expo Router.
- **Backend**: NestJS 10 + PostgreSQL 16 + PostGIS + Redis.
- **Maps**: MapLibre GL JS (web) + `@maplibre/maplibre-react-native` (mobile).
- **Data**: GTFS static + GTFS-RT (gtfs-realtime-bindings) + OSM.
- **AI**: Anthropic Claude with tool-use.

## Alternatives considered

- **Angular vs. Next.js**: Angular gives a heavyweight integrated stack
  but our public site needs SSR for SEO and edge-cacheable marketing
  routes that Next does better.
- **Flutter vs. RN/Expo**: Flutter is faster to start but its plugin
  ecosystem for MapLibre + native push is less mature than RN's, and we
  get to share `@wayra/types` / `@wayra/shared` with the web app.
- **Spring Boot vs. NestJS**: Spring is the obvious enterprise choice
  but adds a second language to the monorepo; Nest gives us the same
  modular controller/service/repo shape on TS, which keeps the team
  homogenous.
- **MongoDB vs. PostgreSQL+PostGIS**: PostGIS owns geo. There is no
  contest for radius/bbox/route-polyline workloads.

## Consequences

- We give up first-class platform-native widgets in favour of RN.
- Cross-language refactors (e.g. renaming a domain field) cost one PR.
- Onboarding a backend dev with no Postgres/PostGIS background is real
  work — we document idioms in `apps/backend/db/init/`.
