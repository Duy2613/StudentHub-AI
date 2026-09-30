# Mixed-auth CSRF and identity-source regression

**Status:** CLOSED IN CANDIDATE  
**Scope:** Security Fabric request authentication and CSRF policy

## Finding

The previous policy let `IdentityResolver` select a session cookie while `SecurityFabric` treated the same request as Bearer-only whenever an `Authorization: Bearer` header was also present. That mismatch could skip the cookie CSRF origin check.

## Resolution

`IdentityResolver.getCredentialSource()` now selects one authoritative source, with application and provider cookies taking precedence over Bearer. `resolvePrincipal()` and `SecurityFabric` use that same decision. Any present cookie remains authoritative if malformed or rejected, so it cannot fall back to Bearer. `SecurityFabric` applies CSRF checks to cookie mutations even when a Bearer header is also supplied.

## Verification

`frontend/tests/security/mixed_auth_csrf_identity_source.test.mjs` is an executable hermetic regression. It covers cross-origin mixed-auth rejection before the route handler, same-origin cookie success, cross-origin provider-cookie rejection, Bearer-only stateless success, and invalid-cookie rejection without Bearer fallback. Synthetic fixtures and a resolver stub avoid real credentials and session-store access.

Focused command on 2026-09-30:

```text
node --test tests/security/mixed_auth_csrf_identity_source.test.mjs tests/security/auth_phase2_durable_session.test.mjs tests/security/security_fabric_integration.test.mjs tests/security/final_audit_hardening.test.mjs
```

Result: **27 passed, 0 failed, 0 skipped, 0 TODO**. No staging request, production request, database mutation, or credential value logging was used. Live session-store behavior was not exercised by this hermetic test.
