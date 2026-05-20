# ADR 0003: Access tokens, refresh tokens, and where they live

- **Status**: Accepted
- **Date**: 2026-05

## Context

Wayra has both a public web app (with all the XSS / CSRF concerns that
come with it) and a mobile app (Expo, with Keychain/EncryptedStorage
available). The first cut put refresh tokens in `localStorage`, which is
an XSS goldmine: a single compromised dependency could exfiltrate every
session for 30 days.

## Decision

Two-token model:

- **Access token**: short-lived JWT (`JWT_EXPIRES_IN`, default 15 min).
  Sent as `Authorization: Bearer …`. Stored only in memory on the web,
  in SecureStore on mobile.
- **Refresh token**: long-lived opaque (`crypto.randomBytes(32)`) string,
  hashed (SHA-256) and persisted server-side in `refresh_token`.

Where the refresh token lives:

- **Web**: `wayra_rt` HttpOnly + SameSite=lax + Secure (in prod) cookie,
  scoped to `/api/auth`. The cookie is set by `/api/auth/{signup,login,
refresh,oauth}` and cleared by `/api/auth/{logout, me DELETE}`. JS
  cannot read it; CSRF is mitigated by the SameSite default plus the
  fact that the refresh endpoint also rotates the token.
- **Mobile**: SecureStore (iOS Keychain / Android EncryptedStorage),
  managed by zustand's `persist` middleware via a custom adapter that
  falls back to AsyncStorage on web/Expo Go.

Refresh rotation: every `/api/auth/refresh` revokes the prior refresh
token and issues a new one. Password change and account deletion revoke
all refresh tokens for the user.

## Consequences

- Login + refresh are HTTPS-only in production (the cookie has Secure).
- The mobile client and the web client take different paths through
  `/api/auth/refresh`; the controller accepts the token from either the
  cookie or the JSON body.
- We pay one extra DB hit per refresh (cheap) and gain XSS-proof token
  storage on the web.
- We give up the option of "remember me across browser restarts" via JS
  reading the token — but the HttpOnly cookie already covers that case.
