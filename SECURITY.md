# Security policy

## Reporting a vulnerability

**Do not** open a public GitHub issue for security problems. Instead, write to
**security@wayra.app** with:

- A clear description of the issue and the impact you've observed
- Steps to reproduce (PoC welcome)
- The commit SHA or release tag you tested against
- Whether you've discussed this with anyone else

We aim to acknowledge within **48 hours** and to ship a fix or a workaround
within **14 days** for high-severity issues. We're happy to credit you in the
release notes unless you'd prefer to stay anonymous.

## In scope

- `apps/backend/` — auth, routing, realtime, fares, AI, admin endpoints
- `apps/web/` — Next.js app, including the embedded service worker
- `apps/mobile/` — the Expo app, including SecureStore handling

## Out of scope

- Reports against upstream dependencies that don't materially affect Wayra
- Brute force or rate-limit reports without a concrete bypass
- Vulnerability scanners' raw output without a reproduction
- DoS via huge map bounding boxes (we documented the trade-off)

## Hardening posture (as of v0.7)

- bcrypt(12) for password hashing (`BCRYPT_ROUNDS` env-configurable)
- HttpOnly, SameSite=lax refresh-token cookie scoped to `/api/auth`
- TOTP 2FA available; backup codes hashed at rest
- Per-account login rate limit (5 failed attempts / 15 min) on top of the
  global throttler
- OAuth id_tokens verified via JWKS with audience pinned to our client_id
- Audit log: login, signup, password change, OAuth link/signin, account
  delete, 2FA setup/enable/disable, admin disruption upsert/delete
- Pino redaction: authorization, cookie, password, currentPassword,
  newPassword, idToken, refreshToken — never written to logs
- Mobile auth tokens stored in iOS Keychain / Android EncryptedStorage
  (via expo-secure-store)
- `JWT_SECRET` is required in production — boot fails loud if missing
- CORS configurable per env (`CORS_ORIGINS`)
- All write endpoints require a `Bearer` access token; admin routes
  additionally require `role: 'admin' | 'staff'`

## Known limitations (will be tracked in the issue tracker)

- No WebAuthn / passkey support yet
- No CSP header configured (Helmet's CSP middleware is disabled by default)
- Map tile fetches leak the user IP to the configured tile provider —
  documented in `/privacy`
