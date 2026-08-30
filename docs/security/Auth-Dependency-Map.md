# Authentication Dependency Map

Updated: 2026-08-27

## Target flow

```text
Supabase Auth access proof (transient)
  -> POST /api/auth/session/exchange
  -> JWKS signature + iss + aud + exp + sub verification
  -> one-time proof fingerprint
  -> hashed PostgreSQL server session
  -> HttpOnly SameSite cookie
  -> IdentityResolver -> SecurityFabric
```

## Caller classification

| Caller | Current authority path | Migration state |
| --- | --- | --- |
| `src/lib/supabase/client.js` | Supabase session persisted by a Web Storage adapter | Legacy; removal blocked until live session exchange and refresh are proven |
| `src/lib/auth/authService.js` | Supabase plus ASP.NET login/sync/me, custom bearer storage | Legacy compatibility; not an approved production authority |
| `src/lib/auth/AuthContext.jsx` | Restores demo, Supabase, then ASP.NET bearer state | Legacy fragmented state machine; caller migration outstanding |
| `src/app/callback/page.jsx` | Reads OAuth access token, stores it, syncs backend | Must call session exchange and stop durable bearer storage after live proof |
| `src/app/login/page.jsx` | Password/OAuth plus visible demo identities | Demo must remain non-production only; canonical login migration outstanding |
| `src/lib/security/identity/TokenValidator.js` | Legacy application bearer JWT | Compatibility only; normal production cookie path must not use it |
| `src/lib/security/identity/SessionManager.js` | Process-local `Map` session | Disabled in production; local escape hatch requires two explicit gates |
| `src/lib/personalization/DeviceSyncEngine.js` | Revokes legacy `SessionManager` subject sessions | Must migrate to owned `server_sessions` operations |
| `src/lib/security/identity/IdentityResolver.js` | Bearer compatibility first, durable cookie second | Durable cookie implemented; bearer caller removal outstanding |
| `src/lib/security/SecurityFabric.js` | Resolves principal and authorizes routes | Durable-cookie lookup and unsafe-method CSRF enforcement implemented |
| `/api/auth/session/exchange` | Verified upstream proof to durable opaque session | Implemented; live Supabase/PostgreSQL integration not yet proven |
| `/api/auth/session`, `/logout` | Cookie validation and durable revocation | Implemented; live route E2E not yet proven |

Harmless Web Storage callers such as audio mute and sidebar preferences are outside the auth migration and should remain untouched.

## Removal gate

Do not remove the old browser bearer path until a dedicated environment proves login/exchange, refresh or re-auth, cookie-authenticated protected access, logout, restart durability, and regression coverage. Until then, PHASE 2 is intentionally marked incomplete rather than breaking the current sign-in experience.
