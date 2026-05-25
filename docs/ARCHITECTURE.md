# Wayra — Architecture

> High-level architecture of the Wayra multimodal-transit platform.
> Complements the ADRs in [docs/adr/](adr/) — ADRs capture *why* a
> decision was made, this document captures *what* the system looks like
> right now.

> **Status**: v0.1 MVP scaffold. Some boxes below are stubs (mocked
> routing provider, scaffolded GTFS-RT pipelines). See the
> [ROADMAP](../ROADMAP.md) for the path to v1.0.

---

## Bird's-eye view

```
        ┌──────────────┐      ┌──────────────┐
        │  Web (Next)  │      │ Mobile (Expo)│
        └──────┬───────┘      └──────┬───────┘
               │   HTTPS + WSS       │
               └───────────┬─────────┘
                           │
                  ┌────────▼────────┐
                  │  Backend (Nest) │
                  └────┬──────┬─────┘
       ┌───────────────┘      └──────────────┐
       │                                     │
  ┌────▼────┐  ┌──────────┐         ┌────────▼─────────┐
  │  Pg +   │  │  Redis   │         │  Routing engine  │
  │ PostGIS │  │  (cache, │         │  (OTP sidecar,   │
  │         │  │ Socket   │         │   v0.1 mocked)   │
  └─────────┘  │  adapter)│         └──────────────────┘
               └──────────┘
                           ┌──────────────────┐
                           │  Anthropic Claude│
                           │  (AI companion)  │
                           └──────────────────┘
```

## Components

### apps/web — Next.js 15 (App Router)

| Aspect | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router + React 19 | Server components for SEO landing pages, streaming for route results |
| Styling | Tailwind v4 + design tokens from `packages/ui` | Single token source shared with mobile |
| i18n | next-intl, 4 primary locales (DE/EN/FR/AR + IT/ES fallback) | RTL for AR baked in at the layout level |
| Maps | MapLibre GL JS | Vendor-neutral (see ADR-0001) |
| Realtime | socket.io-client | See ADR-0004 |
| State | Server components for cacheable data, TanStack Query + Zustand for client state | — |

### apps/mobile — Expo / React Native

| Aspect | Choice |
|---|---|
| Framework | Expo 52 (RN 0.76, new architecture) + Expo Router |
| Maps | `@maplibre/maplibre-react-native` |
| Realtime | socket.io-client (same lib as web — single client surface) |
| State | Zustand + TanStack Query |
| Styling | NativeWind (Tailwind-on-RN) + tokens from `packages/ui` |

### apps/backend — NestJS 10

| Module | Responsibility |
|---|---|
| `AuthModule` | Login / register / JWT issuance + refresh-rotation per ADR-0003 |
| `PlacesModule` | Place search backed by Postgres FTS + PostGIS + pg_trgm typo tolerance |
| `RoutesModule` | Plans multimodal itineraries through the **RoutingProvider** abstraction (ADR-0002) |
| `LiveModule` | GTFS-RT ingest workers (BullMQ) + Socket.IO gateway pushing delays per route |
| `AIModule` | Anthropic Claude tool-use for natural-language itinerary planning |
| `UsersModule` | Profile, saved trips, history, premium status |
| `HealthModule` | Liveness/readiness + DB/Redis probes for orchestrator healthchecks |

Cross-cutting:
- `LoggerMiddleware` — structured JSON logs with request-id correlation
- `ThrottlerGuard` — Redis-backed rate limiting per IP and per user
- `ValidationPipe` (class-validator/class-transformer) — strict DTO validation
- OpenTelemetry tracing (planned for Etappe 2)

### packages/types

The **single source of truth** for shared domain types. Imported by web,
mobile, and backend. No runtime code — only TypeScript interfaces/zod
schemas/enums.

### packages/shared

Pure functions only:
- `geo` — distance, bbox, decode polyline
- `fuzzy` — typo-tolerant string match (mirrors backend's pg_trgm behavior on the client)
- `format` — duration, distance, money, datetime per locale
- `ApiClient` — typed wrapper over fetch with auth-header injection and refresh-on-401

### packages/i18n

Translation JSONs for DE / EN / FR / AR (+ IT/ES fallback). Compiled
into the web + mobile bundles via next-intl and the mobile equivalent.

### packages/ui

Design tokens (color, spacing, type-scale) as JSON + a Tailwind preset
that consumes them. Mirrored to NativeWind for mobile so the same token
name resolves to the same value on both surfaces.

## Data stores

### PostgreSQL 16 + PostGIS

- **PostGIS** for place geometry (points and bboxes) — ST_DWithin/ST_Within
  for radius search
- **pg_trgm** for typo-tolerant place autocomplete
- **JSONB** for routing-itinerary cache rows
- Flyway-style migrations under `apps/backend/migrations/`

### Redis 7

- **TanStack Query / route-plan cache** — hot routes don't re-query OTP
- **JWT refresh-token denylist** — per ADR-0003
- **Socket.IO Redis adapter** — multi-pod backend broadcast — per ADR-0004
- **BullMQ** — GTFS-RT ingest queue, AI-call queue

### Third-party

- **GTFS / GTFS-RT** — DB Fernverkehr, SNCF, Transtu (planned Q3 2026)
- **OpenStreetMap** — base map tiles via MapTiler / Stadia
- **OpenTripPlanner** — routing engine, runs as a sidecar (interface stub
  in place, real container wiring pending Q3 2026)
- **Anthropic Claude** — Sonnet/Opus via the Messages API for the
  AI travel companion

## Sequence: a route plan request

```
User types "Berlin → Köln tomorrow 9am"
  │
  ▼
[Web/Mobile] POST /v1/routes/plan { from, to, when }
  │
  ▼
[Backend] auth-guard → throttle → ValidationPipe
  │
  ├──> [Redis] cache lookup by (from, to, time-bucket)
  │      └─ hit  → return cached itineraries (~80 ms)
  │
  └─── miss → [RoutingProvider]
              │
              ▼ (v0.1: mocked; Q3 2026: OTP sidecar)
            [OTP] /plan?fromPlace=…&toPlace=…
              │
              ▼
            [Backend] decorate with realtime delays from
                      Redis live-state, write to Postgres
                      itinerary cache + Redis hot-cache
              │
              ▼
            return itineraries to client (~600 ms cold path)
```

## Sequence: a live delay update

```
[OTP sidecar] streams GTFS-RT vehicle positions
  │
  ▼
[Backend Worker] BullMQ "live-feed" job consumes, dedupes,
   writes to Redis live-state with TTL
  │
  ▼
[Backend Worker] emits "delay:{route_id}" event on
   Socket.IO Redis pub-sub adapter
  │
  ▼
[All backend pods] their Socket.IO gateway broadcasts to
   sockets in room route:{route_id}
  │
  ▼
[Web/Mobile clients subscribed to that route] receive the
   delay update, re-render the affected leg
```

## Cross-cutting concerns

### Authentication

JWT access tokens (15 min) + refresh tokens (30 d) with rotation per
ADR-0003. Refresh tokens stored in Postgres, denylist in Redis on logout
or rotation.

### Localization

next-intl on web, react-intl on mobile, ARB-style JSON files in
`packages/i18n`. RTL handled at the layout level for AR — flips the
flexbox direction and mirrors directional icons.

### Observability (Etappe 2)

- **Logs**: JSON-structured, request-id correlated, shipped via stdout
  to docker-compose log driver in dev; Loki / CloudWatch in prod
- **Metrics**: Prometheus exposition from NestJS via `@willsoto/nestjs-prometheus`,
  Grafana dashboards in `infra/observability/`
- **Traces**: OpenTelemetry with W3C trace context, exported to Tempo

### Security

See [SECURITY.md](../SECURITY.md) for threat model and reporting.

Key invariants:
- All non-public endpoints require a valid JWT
- All inputs validated via class-validator on the backend
- All user-typed strings sanitized before rendering on web/mobile
- No PII in logs (request-id correlation, not user-id)

## Repository layout

```
wayra/
├── apps/
│   ├── web/        Next.js 15 (App Router)
│   ├── mobile/     Expo + Expo Router
│   └── backend/    NestJS 10
├── packages/
│   ├── types/      Domain types — shared source of truth
│   ├── shared/     Pure functions — geo, fuzzy, format, ApiClient
│   ├── i18n/       Translations
│   └── ui/         Design tokens + Tailwind preset
├── infra/
│   └── observability/   Prometheus / Grafana / Tempo configs (Etappe 2)
├── docs/
│   ├── adr/        Architecture Decision Records
│   └── ARCHITECTURE.md   This file
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## What's stubbed in v0.1

- **Routing**: `RoutingProvider` mock returns synthetic legs. Real OTP
  wiring lands in Etappe 1 (Q3 2026 — see [ROADMAP](../ROADMAP.md)).
- **GTFS-RT ingestion**: BullMQ worker structure exists; real feeds
  (DB, SNCF, Transtu) come in Etappe 2.
- **AI companion**: Claude wired but using mock tool-calls. Full
  conversational memory + PII filter in Etappe 3.
- **Auth**: Email/password works; Apple/Google sign-in in Etappe 4.

## Related documents

- [ROADMAP](../ROADMAP.md) — four-stage path to v1.0 with acceptance criteria
- [ADR-0001](adr/0001-monorepo-and-stack.md) — monorepo + stack choice
- [ADR-0002](adr/0002-routing-provider-abstraction.md) — routing provider abstraction
- [ADR-0003](adr/0003-auth-tokens.md) — auth tokens and where they live
- [ADR-0004](adr/0004-realtime-transport-via-socketio.md) — Socket.IO transport
- [CONTRIBUTING](../CONTRIBUTING.md) — dev workflow
- [SECURITY](../SECURITY.md) — vulnerability reporting and threat model
