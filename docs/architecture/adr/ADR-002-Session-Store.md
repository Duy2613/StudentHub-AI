# ADR-002 — Durable Server Session Store

Status: Accepted architecture; implementation ready for live PostgreSQL validation.

## Decision

StudentHub sessions use a 256-bit opaque random browser secret in an `HttpOnly`, `SameSite=Lax`, production-`Secure` cookie. PostgreSQL stores only an HMAC-SHA-256 digest using a deployment secret pepper. A verified upstream token may be exchanged once; a digest of the exact proof provides replay detection even when the provider omits `jti`.

Sessions have a 30-minute idle boundary and a 24-hour absolute boundary by default. Validation atomically checks revocation and both expiries while updating last-seen state. Logout revokes the database row before clearing the cookie. The repository also supports revoke-all and delayed cleanup of expired rows.

## Security boundaries

- Supabase/OIDC remains identity authority; the session store records that verified authority and never creates credentials.
- Raw session secrets, raw upstream tokens, and raw user-agent strings are not stored.
- Legacy process-memory sessions are rejected in production. Their local escape hatch requires non-production plus `STUDENTHUB_ALLOW_LEGACY_SESSIONS=true`.
- Cookie-authenticated unsafe methods require an exact same-origin `Origin` header. Bearer service requests remain a separate mechanism.
- Missing PostgreSQL or session-pepper configuration fails closed with a safe 503 boundary.

## Consequences

Database availability is now part of authentication availability. Multi-instance revocation and restart survival become possible, but production rollout requires a dedicated PostgreSQL migration, pepper rotation procedure, live OIDC/JWKS test, and browser E2E. Browser bearer storage remains temporarily present until those rollout gates pass.
