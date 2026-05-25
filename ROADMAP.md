# Wayra Roadmap

> Status: **v0.1 MVP scaffold** — Architektur, Skelett und Provider-Schnittstellen stehen; reales Routing, GTFS-Daten und Live-AI sind aktuell gemockt aber interface-kompatibel.

Diese Roadmap zeigt den Weg von **v0.1 (Scaffold)** zu **v1.0 (Public Beta)** in vier Etappen. Jede Etappe ist ein klar definierter, testbarer Meilenstein — keine vage "irgendwann"-Liste.

---

## 🟢 Etappe 1 — Real Routing (Q3 2026)

**Goal:** Echte Multimodal-Routen zwischen zwei Punkten in Deutschland, Frankreich und Tunesien.

### Backend

- [ ] OpenTripPlanner (OTP) Sidecar in Docker Compose integrieren
- [ ] GTFS-Daten-Pipeline: DB Fernverkehr, SNCF, Transtu — automatischer Download + Validate + Build via `gtfs-via-postgres`
- [ ] OTP HTTP-Client gegen die neue Sidecar verkabeln (Interface aus ADR-0002 ist schon da)
- [ ] Routing-Endpoint `POST /v1/routes/plan` → liefert echte Itineraries statt Mocks
- [ ] Caching von Routing-Antworten in Redis (TTL nach Distanz: kürzer für kurze Routen)

### Frontend

- [ ] Route-Result-Cards aus Mock auf echte OTP-Antworten umstellen
- [ ] Multimodal-Indikator je Leg (Walk, Bus, Train, Metro, Tram)
- [ ] Estimated arrival pro Leg
- [ ] Realtime-Update-Annotation (`updated 23s ago`)

### Done = Acceptance

- "Berlin Hbf → Köln Hbf" liefert ≥ 3 echte Verbindungen mit korrekten Abfahrtszeiten
- Mobile + Web zeigen die gleichen Ergebnisse
- Median-Antwort < 800 ms (cached: < 80 ms)

---

## 🟡 Etappe 2 — Live Realtime (Q4 2026)

**Goal:** GTFS-Realtime-Updates fließen durch, Nutzer:innen sehen Verspätungen live.

- [ ] GTFS-RT-Ingest-Worker (BullMQ + ioredis) für DB, SNCF, RATP
- [ ] WebSocket `GET /v1/live/route/:id` streamt Delay-Updates
- [ ] Mobile + Web: Socket.IO-Client zeigt Live-Delays mit Visual-Diff
- [ ] Push-Notification-Trigger: Verspätung > 5 Min auf gebuchter Route
- [ ] Backend-Health-Dashboard für Ingest-Lag pro Feed

### Done = Acceptance

- Sichtbares Live-Delay innerhalb von ≤ 30 s nach echter Verspätungsmeldung
- Mobile-Push erreicht das Device in ≤ 10 s

---

## 🟠 Etappe 3 — AI Travel Companion (Q1 2027)

**Goal:** Natural-Language-Itinerar-Planung statt nur A→B-Routing.

- [ ] Anthropic Claude (Sonnet/Opus) integration produktiv
- [ ] Tool-use für: `search_places`, `plan_route`, `find_alternatives`, `check_realtime`
- [ ] Conversational Memory pro User in Postgres (mit Vector-Embeddings für Kontext)
- [ ] PII-Filter vor jedem Claude-Call (User-Email, exakte Privatadressen)
- [ ] Mobile + Web: Chat-Drawer mit Streaming-Antworten

### Done = Acceptance

- "Ich fliege am Donnerstag nach Tunis und will sonntag in Sousse sein, was sind meine Optionen?"
  → liefert 2-3 strukturierte Vorschläge mit echten Routen und Hotelhinweisen
- p95 First-Token-Latency < 1.5 s

---

## 🔵 Etappe 4 — Public Beta (Q2 2027)

**Goal:** Öffentlich nutzbar, monetarisiert, mit erstem Marketing-Push.

- [ ] Auth via Apple Sign-In + Google Sign-In + Email/Password
- [ ] Account-Sync zwischen Mobile und Web (Refresh-Token-Rotation per ADR-0003)
- [ ] Saved Trips, Favorites, History
- [ ] Premium-Tier (Stripe): unbegrenzte AI-Calls, Offline-Karten, Mehrgeräte-Sync
- [ ] App Store / Play Store Listings (DE/FR/AR/EN)
- [ ] Marketing-Site auf wayra.app
- [ ] Status-Page (`status.wayra.app`)
- [ ] Privacy Policy + Terms — DSGVO + tunesische Datenschutz-Compliance
- [ ] SOC2 Type 1 (Lite) — Audit-Logs, Backup-Strategy, Incident-Runbook

### Done = Acceptance

- 100 echte Tester:innen ohne Kontakt zum Team — End-to-End-Onboarding klappt
- Crash-Rate < 0.5% (Sentry)
- App Store / Play Store Approval ohne Blocker

---

## Cross-Cutting (jederzeit)

Diese Themen laufen parallel zu allen Etappen, ohne eigene Deadline:

- **Performance** — Lighthouse > 90 für Web, < 100 MB Mobile-Install-Size
- **Accessibility** — WCAG 2.1 AA für Web, VoiceOver/TalkBack auf Mobile
- **Tests** — Coverage > 70% für Backend, E2E-Smoke auf alle drei Plattformen
- **Observability** — OpenTelemetry-Tracing über alle drei Apps
- **Security** — Quartalsweises Dependency-Audit, jährlicher externer Pentest ab Beta

## Out-of-Scope

Bewusst **nicht** auf der Roadmap:

- Flugbuchung — wir vermitteln, wir verkaufen keine Tickets
- Carsharing/Bikesharing — könnte Etappe 5+ werden, jetzt nicht
- Eigenes Kartentile-Hosting — wir bleiben bei MapTiler / Stadia bis Volumen es rechtfertigt
- Native macOS / Windows-Apps — Web reicht
- B2B-API — vielleicht später, aber niemals vor öffentlicher Beta

---

Fragen / Vorschläge? Issue auf GitHub oder direkt PR mit Änderungen an dieser Datei.
