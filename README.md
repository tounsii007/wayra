# Wayra — Travel. Simple. Connected.

A modern, multimodal transit & travel-planning platform for **Europe & North Africa**, with first-class support for **Germany, France and Tunisia**. Trains, buses, metros, trams, long-distance coaches — combined in one beautiful app on web and mobile.

> **Status:** v0.1 MVP scaffold. Code and architecture are ready; routing, GTFS ingestion and live AI wiring are stubbed but interface-compatible with production providers.

---

## Suggested names (chose `Wayra`)

| Name      | Notes                                                                |
| --------- | -------------------------------------------------------------------- |
| **Wayra** | 5 chars, clean in DE/EN/FR/AR, evokes _way_ + soft suffix. ✅ chosen |
| Navira    | Latin _navigare_, melodic in all four languages                      |
| Tariqa    | Arabic _طريقة_ (way/method), works as international name             |
| Routique  | Route + boutique — premium European feel                             |
| Movira    | Movement-oriented, neutral across languages                          |
| Transio   | Short, modern, .app/.io likely available                             |
| Mobyla    | Mobility-leaning, easy in Arabic & French                            |
| Voyaro    | Voyage + Esperanto-style suffix, friendly                            |

---

## Monorepo layout

```
wayra/
├── apps/
│   ├── web/        Next.js 15 (App Router) + Tailwind + next-intl + MapLibre
│   ├── mobile/     Expo / React Native (Expo Router, RN-MapLibre)
│   └── backend/    NestJS 10 + PostgreSQL/PostGIS + Redis + GTFS-RT WS
├── packages/
│   ├── types/      All TypeScript domain types (single source of truth)
│   ├── shared/     Pure functions: geo, fuzzy, format, ApiClient
│   ├── i18n/       Translation JSONs (DE/EN/FR/AR + IT/ES fallback)
│   └── ui/         Design tokens + Tailwind preset
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Tech stack

| Layer    | Choice                               | Why                                                               |
| -------- | ------------------------------------ | ----------------------------------------------------------------- |
| Web      | Next.js 15 + Tailwind + next-intl    | App Router for streaming, RTL-friendly i18n, PWA-ready            |
| Mobile   | Expo (React Native, new arch)        | One codebase iOS/Android, native modules, shared types with web   |
| Backend  | NestJS 10                            | Modular, decorators, OpenAPI out of the box, easy testing         |
| DB       | PostgreSQL 16 + PostGIS              | Native geo, `pg_trgm` for typo-tolerant autocomplete              |
| Cache    | Redis 7                              | Hot-path caching, rate-limit counters, GTFS-RT fan-out            |
| Realtime | Socket.IO via NestJS                 | WS push for delays, platform changes, disruptions                 |
| Maps     | MapLibre GL JS / MapLibre Native     | Open-source, no vendor lock-in, MBTiles for offline               |
| AI       | Claude (Anthropic) — tool use        | Multilingual, route-explanation, disruption-aware                 |
| Build    | Turborepo + pnpm workspaces          | Fast incremental builds, perfect for shared types                 |
| Data     | GTFS · GTFS-RT · OpenStreetMap (OSM) | Standard, license-friendly, broad European/North African coverage |

---

## What lives in this repository

### Implemented in v0.1 (MVP scaffold)

**Web (Next.js)**

- Beautiful, polished landing page with animated hero, search, quick actions, country picker, live status, popular routes, features grid, map preview.
- Locale switcher (DE/EN/FR/AR, IT/ES fallback) with **full RTL support** for Arabic.
- Dark / light / system theme via `next-themes` with custom CSS variables (no flash).
- Route planner page (`/plan`) with mock results — fastest / cheapest / fewest transfers / least walking / accessible.
- AI assistant page (`/assistant`) with example prompts and a deterministic stub (ready to wire to Claude).
- Map preview, live status, settings pages.
- Tailwind preset shared with `@wayra/ui` — single source of truth for tokens.
- Strong SEO/PWA: metadata, manifest, theme-color, viewport-fit.
- Security headers in `next.config.mjs`.

**Mobile (Expo + Expo Router)**

- 5-tab navigation (Plan, Map, Live, Assistant, Profile).
- Adaptive light/dark theme synced with system.
- Shared i18n via `i18next` reading the same `@wayra/i18n` resources.
- Home screen, live screen, assistant chat, profile placeholder.
- Metro config + Babel module-resolver wired for workspace packages.

**Backend (NestJS)**

- REST modules: `places`, `routes`, `realtime`, `fares`, `ai`, `offline`, `health`.
- Swagger UI at `/docs`, response envelope (`{ data, meta }`), centralized error filter.
- Throttler + Helmet + global validation pipe.
- WebSocket gateway namespace `/live` for departure pushes.
- SQL init scripts (PostGIS + pg_trgm extensions, full Wayra schema, seed countries).
- Dockerfile + multi-stage build, Docker Compose with healthchecks and Adminer (dev profile).

**Shared packages**

- `@wayra/types` — every domain entity (Place, Route, Departure, Disruption, FareOffer, User, AI, etc.) plus API request/response envelopes.
- `@wayra/shared` — `distanceMeters`, `formatDuration`, `formatTime`, `formatFare`, `formatCO2`, `fuzzyScore`, `normalize`, `ApiClient`, constants.
- `@wayra/i18n` — DE/EN/FR/AR translations with proper Arabic plural rules.
- `@wayra/ui` — design tokens (colors, radii, spacing, typography, motion) + Tailwind preset.

### Stubbed (clearly marked, drop-in ready)

- **Routing engine** — `RoutesService.plan()` returns realistic mock routes. Production swap: call OpenTripPlanner 2 / Motis over an ingested GTFS+OSM graph; service signature is already production-shaped.
- **GTFS-RT ingestion** — `RealtimeService` returns demo departures. Production: poll DB / SNCF / RATP / SNCFT feeds every ~30 s, parse `gtfs-realtime-bindings`, store in `realtime_update`, fan-out via `RealtimeGateway`.
- **Live AI assistant** — `AiService.respond()` returns local replies. Add `ANTHROPIC_API_KEY` and replace the function body with `client.messages.create({ model: 'claude-sonnet-4-6', tools: [planRoute, departures, disruptions], ... })`.
- **Mobile MapLibre map** — tab present; `react-native-maplibre-gl` is in dependencies. v0.2 wires tiles + clustering.

---

## Quick start

### Prerequisites

- Node 20+
- pnpm 9+ (enable via `corepack enable`)
- Docker Desktop (for Postgres + Redis)

### Bootstrap

```powershell
cd C:\projects\wayra
corepack enable
pnpm install
copy .env.example .env
pnpm docker:up               # starts Postgres (with PostGIS) + Redis
pnpm dev                     # runs web + backend + mobile (Metro) in parallel
```

Open:

- Web: <http://localhost:3000>
- API docs: <http://localhost:4000/docs>
- Adminer (DB UI): <http://localhost:8080> (run with `--profile dev`)
- Mobile: scan the Expo QR code with the Expo Go app

### Run individually

```powershell
pnpm --filter @wayra/web dev
pnpm --filter @wayra/backend dev
pnpm --filter @wayra/mobile dev
```

---

## API surface (v0.1)

All endpoints are mounted under `/api`. Responses use `{ data, meta }`; errors use `{ error: { code, message, details? } }`.

```
GET    /api/health
GET    /api/search?q=&lat=&lng=&limit=
GET    /api/places/autocomplete?q=
GET    /api/stops/nearby?lat=&lng=&radiusMeters=
GET    /api/stations/:id

POST   /api/routes/plan
GET    /api/routes/:id
GET    /api/routes/:id/alternatives

GET    /api/realtime/departures?stopId=&limit=&windowMinutes=
GET    /api/realtime/disruptions?country=
GET    /api/realtime/trip/:tripId
WS     /live   →  emit 'subscribe' with { stopIds: [] }

POST   /api/fares/estimate
GET    /api/fares/offers?country=&type=

POST   /api/ai/travel-assistant
POST   /api/ai/explain-delay
POST   /api/ai/route-summary

GET    /api/offline/regions
GET    /api/offline/download/:regionId
```

Full schemas in OpenAPI at `/docs`.

---

## Database model

PostGIS-enabled. Key tables (full DDL in `apps/backend/db/init/02-schema.sql`):

- `country`, `agency` — providers per country (DB, SNCF, SNCFT, RATP, BVG, ...)
- `place` — unified table for **city / neighborhood / street / address / station / stop / metro / tram / bus / airport / poi / landmark**, with `geom geography(Point,4326)`, trigram index on `name`, and `localized_names jsonb` for multilingual matching.
- `line`, `trip`, `stop_time` — GTFS-derived static schedules.
- `realtime_update`, `disruption` — GTFS-RT slice + curated disruptions.
- `fare` — official + estimated offers, currency, validity.
- `app_user`, `favorite_place`, `saved_route`, `offline_region`, `notification_preference` — user-facing entities.

Two key indexes for autocomplete + nearby:

```sql
CREATE INDEX place_geom_idx  ON place USING GIST (geom);
CREATE INDEX place_name_trgm ON place USING GIN  (name gin_trgm_ops);
```

---

## Design system

Defined in `packages/ui/src/tokens.ts` and exposed via `packages/ui/tailwind-preset.cjs`.

- **Brand palette:** blue `#2563eb` → violet `#7c3aed` → teal `#0ea5a5`
- **Status:** on-time green `#16a34a`, delay amber `#f59e0b`, severe red `#dc2626`, info sky `#0ea5e9`
- **Typography:** Inter (Latin), Cairo (Arabic), Inter for display
- **Radii:** 6 / 10 / 16 / 22 / 999
- **Motion:** standard `cubic-bezier(0.2, 0, 0, 1)`, durations 150 / 220 / 360

Web utility classes: `.surface`, `.surface-muted`, `.glass`, `.glass-strong`, `.skeleton`, `.focus-ring`, `.text-muted`, `.text-subtle`, `.hero-blob`, `.grid-pattern`.

---

## i18n & RTL

- All UI strings live in `packages/i18n/src/locales/{de,en,fr,ar}.json` — IT/ES fall back to EN until translated.
- Plurals use ICU MessageFormat (`{count, plural, ...}`), with full Arabic six-form rule.
- The web app sets `<html dir="rtl">` for Arabic; Cairo is the default font.
- Mobile uses `expo-localization` to auto-detect device language and `i18next` to read the same JSON.

---

## Country focus (MVP)

| Country    | Networks targeted                                         | Provider feeds                                  |
| ---------- | --------------------------------------------------------- | ----------------------------------------------- |
| 🇩🇪 Germany | DB, S-Bahn, U-Bahn, BVG, HVV, VRR, RMV, RNV, …            | DB Open Data + Verbund GTFS + Deutschlandticket |
| 🇫🇷 France  | SNCF (TGV, Intercités, TER), RATP, IDFM, Metro Paris, RER | SNCF API + IDFM open data + RATP                |
| 🇹🇳 Tunisia | SNCFT, TRANSTU (Métro Tunis, bus), regional buses         | Curated GTFS + scheduled crawls + estimates     |

Country selector on the home page filters search, popular routes, fares.

---

## Roadmap

### v0.1 — MVP scaffold

- Monorepo, shared packages, design system, i18n with RTL.
- Beautiful web landing page + plan + assistant + map preview.
- Mobile shell with 5 tabs, theme-aware.
- Backend REST + WS with full type-shared interfaces, mock data.
- Postgres+PostGIS schema, Docker Compose, OpenAPI.

### v0.2 — Data foundation (this commit)

- **TypeORM entities** mapping every table; `PlacesService` now queries Postgres with `pg_trgm` + `ST_Distance` and falls back to in-memory samples when the DB is empty or unreachable.
- **Real MapLibre map on web** — interactive `/map` with country + mode filters, lazy-loaded teaser on the landing page, clickable markers → stop details.
- **Stop details page** (`/stops/[id]`) — live departures board with `useLiveDepartures` WebSocket hook, route shortcuts, map view.
- **Search results page** (`/search`) — debounced backend autocomplete, type filters, in-memory fallback, URL-linkable results.
- **Admin dashboard** (`/admin/*`) — overview KPIs, disruption editor with new-disruption form, feeds table, live API-status probe, feedback inbox.
- **GTFS importer** script `apps/backend/src/scripts/gtfs-import.ts` — upserts agencies / stops / routes with PostGIS geographies.
- **Mobile MapLibre** (`react-native-maplibre-gl`) on the Map tab + stop details screen `/stop/[id]` with live departures.
- **PWA service worker** — app-shell cache, map-tile cache-first, API network-first with short-TTL fallback, push handlers (`/sw.js`).

### v0.3 — Assistant, accounts & realtime worker (this commit)

- **Claude-powered assistant** with tool-use (find_place, plan_route, get_departures, get_disruptions). Falls back to deterministic localized stubs when `ANTHROPIC_API_KEY` is unset.
- **JWT auth** (`/api/auth/signup`, `/api/auth/login`, `/api/auth/me`) with bcrypt + Postgres users.
- **Favorites & saved routes** API (`/api/me/favorites`, `/api/me/routes`) with `JwtAuthGuard`.
- **Web auth flow** — `/login` (sign in / sign up tabs), `/me` profile with favorites + saved routes, zustand-persisted session.
- **Trip details page** (`/trips/[id]`) — leg-by-leg breakdown, save & share, MapLibre overview with route polyline.
- **Offline regions UI** — web (`/offline`) and mobile (`/offline`) with simulated download progress, staleness detection.
- **Recent searches** persisted in localStorage and surfaced when the autocomplete is empty.
- **GTFS-RT polling worker** (`GtfsRtWorker`) — polls configured feeds every 30 s, fans out via Socket.IO `/live`. Wired but disabled until `GTFS_RT_ENABLED=true`.
- **Mobile onboarding** flow on first launch (4 slides, persisted in AsyncStorage).
- **Settings page polish** — push/email/channel toggles with persistent state, recents clear, offline shortcut.
- **Jest tests** for `@wayra/shared` (geo, fuzzy, format) — 20+ assertions.

### v0.4 — Real routing & operations

### v0.4 — Real routing & operations

- Embed OpenTripPlanner 2 (Java sidecar) and proxy through `RoutesService`.
- GTFS-RT decoder using `gtfs-realtime-bindings` — replaces the worker stub.
- Web Push subscription flow + Expo Push for mobile.
- Redis pub/sub for cross-process realtime fanout.
- Conversation memory + structured `attachments` (route, disruption) in AI replies.

### v0.5 — Account & favorites

- Email + Google + Apple sign-in.
- Saved routes, home/work shortcuts, history sync.
- Notification preferences per channel and per route.

### v0.6 — Fares (real money)

- DB Sparpreis / Flexpreis lookup, Deutschlandticket detection.
- SNCF tariffs, Pass Rail Jeune.
- SNCFT estimates (no public price API yet).
- Verbund tariffs (VRR/RMV/HVV/BVG).
- Affiliate / deep-link booking out to provider checkouts.

### v0.7 — Admin & ops

- Admin dashboard (Next.js route group): provider status, GTFS reload, disruption editor, feedback inbox, data-quality dashboard.
- Observability: OpenTelemetry → Grafana / Prometheus.
- Synthetic monitors on key endpoints.

### v1.0 — Wider Europe & North Africa

- Add AT, CH, BE, NL, IT, ES.
- Add MA, DZ, EG (where data is available).
- Accessibility audit (WCAG 2.1 AA).
- Real performance SLOs: P50 search < 80 ms, P95 plan < 600 ms.

---

## Verification notes

This commit scaffolds the full monorepo and code surface. **No `pnpm install` has been run in this environment**, so dev servers haven't been booted — that's a one-time step the user runs locally (see Quick start). Once deps install, `pnpm dev` runs web + backend + mobile concurrently via Turborepo.

To verify the web app locally:

```powershell
cd C:\projects\wayra
pnpm install
pnpm --filter @wayra/web dev
# open http://localhost:3000
```

For verification of the backend independently of the web app:

```powershell
pnpm docker:up
pnpm --filter @wayra/backend dev
# open http://localhost:4000/docs
```

---

## License

Choose an OSS license before publishing. Recommended: **AGPL-3.0** (for SaaS-style services) or **Apache-2.0** (for permissive use). Data attributions: OpenStreetMap contributors (ODbL), GTFS feeds per provider terms.

---

## Contact / contributions

PRs welcome once a repository is initialized (`git init && git add . && git commit -m "feat: Wayra v0.1 scaffold"`). Translations especially appreciated for AR, IT, ES.
