# Changelog

All notable changes to **Wayra** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1)
- `CHANGELOG.md` (Keep-a-Changelog format)

### Changed
- `.gitignore` now excludes `docker-compose.override.yml` so per-machine port
  remaps stay local

## [0.1.0] - 2026-05 — MVP Scaffold

### Added
- Monorepo layout (pnpm workspaces + Turbo)
  - `apps/web` — Next.js 15 + Tailwind + next-intl + MapLibre
  - `apps/mobile` — Expo / RN with Expo Router and RN-MapLibre
  - `apps/backend` — NestJS 10 + PostgreSQL/PostGIS + Redis + GTFS-RT WebSocket
  - `packages/types` — TypeScript domain types (single source of truth)
  - `packages/shared` — pure functions: geo, fuzzy, format, ApiClient
  - `packages/i18n` — translations DE/EN/FR/AR (+ IT/ES fallback)
  - `packages/ui` — design tokens and Tailwind preset
- Architecture Decision Records
  - ADR-0001: Monorepo & primary stack
  - ADR-0002: Routing provider abstraction (mock → OTP → Motis)
  - ADR-0003: Access tokens, refresh tokens, and where they live
- Docker Compose stack: Postgres+PostGIS, Redis, Adminer, backend service
- CI: `ci.yml` (lint + build matrix) and `codeql.yml` (security scanning)
- RTL support (Arabic) in web and mobile layouts
- Real-time updates via Socket.IO scaffolding
- Mock routing provider with interface compatible with OTP/Motis
- Anthropic Claude AI integration scaffolding for itinerary planning
- next-intl based i18n with 4 primary locales

### Known Limitations
- Routing logic is mocked; real OTP HTTP client implemented but Java sidecar
  wiring deferred
- GTFS ingestion pipeline scaffolded but not yet populated with real feeds
- AI itinerary planning currently uses mock responses
