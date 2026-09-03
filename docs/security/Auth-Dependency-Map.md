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
| `src/lib/supabase/client.js` | Supabase provider session held in page memory only; application auth is server-cookie based | Browser Web Storage credential persistence removed; live refresh/E2E proof remains external |
| `src/lib/auth/authService.js` | Transient Supabase proof -> same-origin session exchange; ASP.NET bearer retained only for compatibility sync/me | Canonical login uses the server-owned session boundary; legacy compatibility is not an authority |
| `src/lib/auth/AuthContext.jsx` | Restores durable cookie session first, then exchanges a current provider proof | UI auth state is established only after application-session success |
| `src/app/callback/page.jsx` | Reads transient OAuth proof, syncs, then exchanges it for an opaque cookie | No durable browser bearer storage; exchange failure routes to signed-out state |
| `src/app/login/page.jsx` | Password/OAuth plus visible demo identities | Demo remains non-production only; canonical password flow uses Supabase then exchange |
| `src/lib/security/identity/TokenValidator.js` | Legacy application bearer JWT | Compatibility only; normal production cookie path must not use it |
| `src/lib/security/identity/SessionManager.js` | Process-local `Map` session | Disabled in production; local escape hatch requires two explicit gates |
| `src/lib/personalization/DeviceSyncEngine.js` | Revokes legacy `SessionManager` subject sessions | Must migrate to owned `server_sessions` operations |
| `src/lib/security/identity/IdentityResolver.js` | Server-owned session cookie first; bearer compatibility only when no cookie exists | Cookie precedence and malformed-cookie fail-closed behavior are contract-tested |
| `src/lib/security/SecurityFabric.js` | Resolves principal and authorizes routes | Durable-cookie lookup and unsafe-method CSRF enforcement implemented |
| `/api/auth/session/exchange` | Verified upstream proof to durable opaque session | Implemented; live Supabase/PostgreSQL integration not yet proven |
| `/api/auth/session`, `/logout` | Cookie validation and durable revocation | Implemented; live route E2E not yet proven |

Harmless Web Storage callers such as audio mute and sidebar preferences are outside the auth migration and should remain untouched.

## Removal gate

Browser bearer persistence has been removed locally. A dedicated environment must still prove login/exchange, refresh or re-auth, cookie-authenticated protected access, logout, restart durability, and regression coverage before claiming the migration operationally complete. The remaining ASP.NET bearer calls are compatibility-only sync/me calls and do not establish browser UI authority.
