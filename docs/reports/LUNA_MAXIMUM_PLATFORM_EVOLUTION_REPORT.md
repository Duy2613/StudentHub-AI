# StudentHub AI — Luna Maximum Platform Evolution Report

**Program:** `LUNA MAXIMUM PLATFORM EVOLUTION PROGRAM V2`

**Phase covered:** Phase A — exact friend-backend reconciliation and source pinning

**Date:** `2026-09-02`

**Status:** `MAXIMUM_PLATFORM_EVOLUTION_PARTIAL_HUMAN_ACTION_REQUIRED`

## Architectural outcome

The target boundary is now evidence-backed for the pinned collaborator source:

```text
StudentHub control plane
  Trust v5 · Supabase · Passport · TrustGraph · Community · Expert
          │
          ▼
StudentHub TrustOrchestrator
          │
          ▼
Capability-oriented provider gateway
          │
          ▼
LegacyVerificationAdapter (server-only anti-corruption boundary)
          │
          ▼
Google Safe Browsing · Tavily · Gemini · Groq
          │
          ▼
Evidence normalization → provenance → deterministic Trust policy
```

StudentHub remains independently operable if the friend backend disappears. The friend backend is a compatibility source, not a canonical data or decision plane.

## Work completed

- Consulted the permanent project vault, active session context, system architecture, design contract, and sprint board.
- Read and applied the project Spec-Driven Development guidance; added an explicit adapter state-transition matrix to the reconciliation report.
- Resolved `develop` from the public repository and pinned commit `0625b1b950f29edd714507e485284208207039fb`.
- Captured a SHA-256 manifest for the relevant backend, DTO, migration, configuration, and container files.
- Audited startup/authentication, controllers, DTOs, services, provider calls, persistence, migrations, CORS, deployment assumptions, and dependency vulnerability output.
- Classified useful behavior, legacy behavior, unsafe behavior, contract drift, schema drift, behavior to preserve, and behavior to reject.
- Wrote [`FRIEND_BACKEND_SOURCE_SNAPSHOT.md`](./FRIEND_BACKEND_SOURCE_SNAPSHOT.md) and [`FRIEND_BACKEND_SOURCE_RECONCILIATION.md`](./FRIEND_BACKEND_SOURCE_RECONCILIATION.md).

## Files changed

Repository-side changes are documentation-only:

- `docs/reports/FRIEND_BACKEND_SOURCE_SNAPSHOT.md`
- `docs/reports/FRIEND_BACKEND_SOURCE_RECONCILIATION.md`
- `docs/reports/LUNA_MAXIMUM_PLATFORM_EVOLUTION_REPORT.md`

No application code, schema migration, credential, deployment, or remote system was changed.

## Verification evidence

The pinned friend project was built in an isolated temporary checkout with .NET SDK `10.0.302`:

```text
dotnet build: 0 errors, 4 warnings
```

The warnings include a high-severity transitive vulnerability in `Microsoft.OpenApi` `2.0.0` (`GHSA-v5pm-xwqc-g5wc`) and an unprunable `Microsoft.Extensions.Identity.Core` reference. This build proves compilation only; it does not prove database compatibility, provider availability, authentication correctness, RLS, or production safety.

The StudentHub working tree was clean before this phase. Existing project baseline claims remain those recorded in the vault and current reports; this phase did not rerun the full frontend regression suite because no runtime code changed.

## Release-blocking findings

1. `backend/StudentHub.API/appsettings.json:3` contains a tracked literal PostgreSQL password. This is `SECRET_ROTATION_REQUIRED`. The operator must revoke/rotate it, inspect reachable history and deployments, and replace it through a secret store. The value is intentionally not reproduced.
2. The current `User` model requires `SupabaseUserId`, while the checked-in initial migration omits that column and retains stale password/Google columns.
3. Anonymous `GET /api/users` enumerates private user fields.
4. Layer 2 maps Safe Browsing no-match to `SAFE` and exposes upstream bodies/exception messages.
5. Layer 3 keyword heuristics can stop on lexical signals and exposes provider-derived text/error messages.
6. Layer 4 collapses independent observations by URL and lets raw model metrics influence its stop decision without canonical evidence-ID/schema validation.
7. The friend project reports a high-severity transitive dependency vulnerability.

## Human actions required

- Revoke and rotate the exposed database credential immediately; check provider/database access logs and all deployments that may have consumed it.
- Review Git history and any generated/binary artifacts for the same credential, then remove compromised material through the repository's approved secret-remediation process.
- Decide whether the friend source may be used at all after the security incident is closed; no live enablement is implied by this report.
- Provide an approved staging environment and test credentials before live ASP.NET, Supabase/PostgreSQL/RLS, or provider E2E claims can be made.

## Next repository phase

After operator security action, extract sanitized, source-derived `friend.layer2.v1`, `friend.layer3.v1`, and `friend.layer4.v1` fixtures and contract tests. Then harden the existing server-only adapter with bounded schemas, provider-state mapping, provenance preservation, retry/cancellation policy, and differential tests. Do not adapt canonical Trust v5 semantics to match the friend DTO.

## Non-claims

This phase does not claim production readiness, live provider availability, database/RLS correctness, credential remediation, deployment safety, or friend-backend decommission eligibility.
