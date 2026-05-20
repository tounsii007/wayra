# ADR 0002: Routing provider abstraction (mock → OTP → Motis)

- **Status**: Accepted (mock implemented; OTP HTTP client implemented; Java sidecar wiring deferred)
- **Date**: 2026-05

## Context

`RoutesService.plan()` is on the hot path for every "from → to" query.
Production needs a real graph-based router that respects calendar
exceptions, transfer rules, walking distances and accessibility tags.
We can't ship our own routing engine, and we may want to switch providers
based on geography (e.g. OTP for DE/FR, a different engine for TN).

## Decision

Introduce a `RoutingProvider` interface:

```ts
interface RoutingProvider {
  plan(req: PlanRouteRequest): Promise<PlanRouteResponse>;
}
```

with three implementations:

- `MockRoutingProvider` — current behaviour. Used by default and in tests.
- `OtpRoutingProvider` — talks to an OpenTripPlanner 2 HTTP API.
  Selected when `ROUTING_PROVIDER=otp` and `OTP_BASE_URL` is set.
- (Future) `MotisRoutingProvider` — for high-throughput multimodal queries.

The provider is registered as a Nest provider keyed by the
`ROUTING_PROVIDER` env var; `RoutesController` depends on the
`ROUTING_PROVIDER` token, not on a concrete class.

## Consequences

- Adding a third provider is a single-file change.
- We can fall back to the mock provider in CI without booting OTP.
- Tests for `RoutesService.cacheRoute` / `byId` / `alternatives` stay
  provider-agnostic.
- `RoutesService` becomes mostly a cache façade; the heavy lifting moves
  to the provider.

## Open questions

- Where does the OTP graph live? Container per-region (DE/FR/TN) or
  one global graph?
- How do we cap query timeouts on the Nest side when OTP is slow?
