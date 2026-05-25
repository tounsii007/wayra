# ADR 0005: Mobile token storage and refresh transport

- **Status**: Accepted
- **Date**: 2026-05
- **Deciders**: Wayra core team
- **Supersedes**: clarifies the mobile half of [ADR 0003](0003-auth-tokens.md)

## Context

ADR-0003 settled on access-tokens-in-memory + refresh-tokens-in-cookies
for the **web** client. The mobile (Expo / React Native) client doesn't
have access to HttpOnly cookies the same way a browser does — the cookie
jar is per-session on iOS (`URLSession`) and Android (`OkHttp`), and
clearing it logs the user out of every other app linked through the
same Safari View Controller / Custom Tab.

We need to pick:

1. Where the mobile refresh token lives (Keychain / Keystore / SecureStore
   / AsyncStorage / cookie / nowhere)
2. How the mobile client transports it to `/api/auth/refresh`

## Decision

**Storage**: `expo-secure-store` — wraps iOS Keychain Services and Android
Keystore. Both are hardware-backed when available, never appear in app
backups by default, and survive process termination. Specifically NOT
`AsyncStorage`, which writes plaintext to the app sandbox.

**Transport**: Refresh token travels in a JSON request body to
`POST /api/auth/refresh`, not in a cookie. The mobile client constructs
the request manually and includes the token as a `refreshToken` field.

**Rotation**: Same one-time-use rotation policy as web — every refresh
returns a new refresh token and the previous one is added to the Redis
denylist (per ADR-0003).

**Access token**: In-memory only. Never persisted. On app cold start the
client reads the refresh token from SecureStore, exchanges it for a
fresh access token, and proceeds. Cold-start latency cost is ~150-300 ms
on cellular which is acceptable since the user is already waiting on
the initial route plan / search query.

## Alternatives considered

### AsyncStorage (rejected)
Plaintext. Survives uninstall on iOS but readable by any process with
file-system access on jailbroken / rooted devices. Wrong tier of security
for an auth credential.

### Cookie jar via `react-native-cookies` (rejected)
Doesn't share with the in-app browser used for OAuth flows, so we'd end
up with the refresh-token-in-secure-store-anyway path for OAuth-initiated
sessions and inconsistency for email/password sessions. Pick one model.

### Hardware-backed asymmetric key + signed assertion (deferred)
The Right Way™ is to store a private key in Secure Enclave / StrongBox
and have the client sign a per-request assertion. We don't have the
backend support for it yet (would need a JWKS endpoint per device and
a public-key-binding step at registration). Track for v1.x; not a v1.0
blocker since the refresh token in SecureStore is already very hard to
exfiltrate without root.

### "Bearer token only, no refresh" (rejected)
Would mean a 14-day access token. If exfiltrated, attacker has 14 days
of access. With the short-access + long-refresh-in-SecureStore split,
exfiltration of the in-memory access token gives at most 15 minutes.

## Consequences

✅ Positives:
- Token never lands on disk in plaintext
- Refresh transport doesn't depend on cookie-jar sharing between the app
  WebView, the Custom Tab, and the native HTTP client
- Works identically for email/password sessions and OAuth sessions
- Cold-start refresh is fast enough to not need a splash-screen workaround

❌ Negatives:
- SecureStore I/O is async (~10-30 ms) → must be done in the auth-init
  effect, not synchronously during render. Acceptable.
- A user who clears app data on Android (Settings → Apps → Storage → Clear)
  is logged out instantly. Acceptable; equivalent to clearing cookies on web.
- Backup restore between two iOS devices skips SecureStore by default,
  so a restore = re-login. Acceptable.

## Implementation pointers

Mobile (`apps/mobile/`):
```ts
import * as SecureStore from 'expo-secure-store';

const REFRESH_KEY = 'wayra.auth.refresh';
const ACCESS_KEY = 'wayra.auth.access.mem'; // never persisted, in-memory ref

export async function persistRefreshToken(token: string) {
  await SecureStore.setItemAsync(REFRESH_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function loadRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}
```

Backend (`apps/backend/src/auth/`):
- `/api/auth/refresh` accepts both the cookie (web) and the JSON body
  (mobile) variants — we don't fork the controller, just check both
  sources in the AuthService.

## Related

- [ADR 0001](0001-monorepo-and-stack.md) — overall stack
- [ADR 0003](0003-auth-tokens.md) — web token storage
- [SECURITY.md](../../SECURITY.md) — vulnerability reporting
