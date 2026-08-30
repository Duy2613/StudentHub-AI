# ADR-001 — Identity Authority

Status: Accepted; foundation implemented, production cutover blocked on live Supabase/PostgreSQL validation and caller migration.

## Decision

Use Supabase Auth as the sole end-user identity authority through its OIDC-compatible signed tokens. Next.js is the browser session boundary and authorization BFF. SecurityFabric consumes only cryptographically verified identity or an opaque, server-managed session. PostgreSQL RLS is the final data boundary.

```text
Supabase Auth / OIDC
  -> one-time server session exchange
  -> Secure + HttpOnly + SameSite cookie
  -> SecurityFabric authorization
  -> PostgreSQL RLS
```

The external ASP.NET authentication service is a compatibility dependency, not a second identity authority. Its current catch-all proxy is restricted to `auth/login`, `auth/register`, `auth/sync`, and `auth/me` while migration remains incomplete.

## Rejected alternatives

- Browser `localStorage` or `sessionStorage` bearer tokens: exposed to successful XSS and duplicated across auth implementations.
- Trusting decoded JWT claims: does not prove signature, issuer, audience, expiry, or key rotation.
- Process-memory sessions as a production solution: sessions disappear on restart and do not support multi-instance revocation.
- Keeping Supabase, custom JWT, ASP.NET JWT, and demo identity as co-equal authorities: role and subject resolution becomes inconsistent.

## Required implementation gates

1. Durable session and revocation storage in PostgreSQL/Redis.
2. Supabase JWKS verification with issuer, audience, subject, expiration, and rotation tests.
3. One-time session bootstrap that never returns the provider token to application code after exchange.
4. CSRF protection for cookie-authenticated mutations.
5. Login, logout, refresh, expiry, revocation, and protected-route E2E tests.
6. Removal of production bearer storage only after every caller uses the cookie boundary.

JWKS verification, one-time exchange, durable-session repository, cookie resolution, CSRF baseline, and revocation are implemented and contract-tested. Live Supabase/PostgreSQL integration, browser E2E, refresh/re-auth, and caller migration have not passed. Until those gates pass, the existing browser-token code remains a documented security risk and must not be described as production-ready.
