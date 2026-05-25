# ADR 0004: Realtime transport via Socket.IO

- **Status**: Accepted
- **Date**: 2026-05
- **Deciders**: Wayra core team

## Context

For the public-beta (Etappe 2) we need to stream GTFS-RT delay updates from the backend to active sessions on web and mobile. Several transport options apply:

1. Raw WebSocket (ws / native)
2. Server-Sent Events (SSE)
3. Socket.IO (with WebSocket primary + long-polling fallback)
4. gRPC-Web with server-streaming

Constraints:
- Mobile clients on flaky 3G connections in Tunisia and rural France must work
- Backend already on NestJS — Socket.IO is the first-class WebSocket adapter there
- A single user typically subscribes to 1-3 active routes at a time (low fan-out)
- Total active subscriptions at beta scale: ≤ 10k concurrent
- Re-subscribe-on-reconnect must be fast and not lose updates mid-flight

## Decision

We use **Socket.IO 4** as the realtime transport, with these constraints:

- Server: `@nestjs/websockets` + `@nestjs/platform-socket.io`
- Web client: `socket.io-client`
- Mobile client: `socket.io-client` (Expo-compatible)
- Backplane: Redis adapter (`@socket.io/redis-adapter`) so multiple backend pods can broadcast to the same room
- One room per route ID — clients join on subscribe, leave on unsubscribe
- Heartbeat: server-side ping every 25 s, client expects pong within 5 s
- Reconnect strategy: exponential backoff capped at 30 s, automatic room re-join on reconnect

## Alternatives considered

### Raw WebSocket
**Rejected.** Forces us to hand-build reconnect, room management, fallback, and Redis pub/sub plumbing. Same end-state as Socket.IO with more code.

### Server-Sent Events
**Rejected.** Unidirectional only. We need the client to send subscribe/unsubscribe over the same channel; doing that as separate HTTP POSTs adds latency and breaks the connection-bound state assumption.

### gRPC-Web with server-streaming
**Rejected for now.** Strong typing is appealing but the mobile RN gRPC story is shaky (no first-class Expo support), and we'd lose long-polling fallback for flaky-network markets.

## Consequences

✅ Positives:
- Library-level reconnect + fallback unblocks Q4 ship-target without bespoke transport code
- Room-based subscription model matches our "subscribe to a route ID" mental model 1:1
- Redis adapter lets us horizontally scale backend pods without sticky sessions
- Common client lib across web and mobile — same API surface

❌ Negatives:
- Socket.IO adds ~30 kB minified to the web bundle vs. raw WS
- Protocol is not a strict subset of WebSocket — clients must use the Socket.IO client (we can't use, e.g., the browser's native `WebSocket` for testing)
- Long-polling fallback path is rare in 2026 but still active code; adds attack surface

## Mitigations

- Socket.IO bundle goes into a separately-loaded chunk (only routes pages need it)
- Add `socket.io-msgpack-parser` to compress payloads on the wire
- Disable HTTP long-polling transport on backend in v1 — only allow it after a regression where 5xG networks fail WebSocket upgrade
- Monitor reconnect frequency per region in Grafana; if Tunisia / rural FR > 5% reconnect rate, re-enable polling fallback for those geos only
