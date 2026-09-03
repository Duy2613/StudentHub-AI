# StudentHub AI V2 — Historical Current-State Record

Audit date: 2026-08-27
Branch: `develop` at `5aeaf71`
Scope: the current working tree, including pre-existing uncommitted work.

> **Closure note (2026-08-30):** This diagnostic snapshot is historical and is superseded by [`FINAL-AUDIT-REPORT.md`](FINAL-AUDIT-REPORT.md) and [`docs/ACTIVE-BUILD-CHECKPOINT.md`](docs/ACTIVE-BUILD-CHECKPOINT.md). The current local RC passes 250/250 discovered tests, builds 115/115 routes, and remains externally limited by live database/RLS, staging, providers, rollback, and Firefox runtime proof.

## Executive truth

StudentHub AI is a broad research prototype with strong deterministic domain engines, a distinctive interface, and unusually extensive pure-logic tests. It is not yet production-ready. The primary gaps are fragmented identity, incomplete server-authoritative authorization, process-local persistence, simulated AI/retrieval paths, scientific evaluation leakage, and an oversized Trust client bundle.

PHASE 2/3 now has a production-oriented foundation: verified Supabase/OIDC JWKS exchange, opaque hashed PostgreSQL sessions, cookie/CSRF integration, a core PostgreSQL/RLS migration, and PostgreSQL-first forum POST/GET. This is not a production-completion claim: the current machine has no database/pepper environment, live RLS and restart E2E did not run, and browser auth callers still retain the legacy bearer path.

The V2 product boundary is now:

1. AI Trust Engine
2. Campus Collective Intelligence
3. Expert Trust Network
4. StudentHub TrustGraph as their shared evidence, knowledge, and reputation core

Legacy modules remain available for migration analysis but are not V2 core commitments.

## Measured baseline

| Area | Observed baseline |
| --- | --- |
| Repository | One Git repository; no nested implementation backend was found |
| Source | 589 source files; about 85k application lines excluding generated model weights |
| Routes | 37 page routes; 93 API route files |
| Tests | 235 test files, heavily weighted toward pure/domain logic |
| Build | Next.js production build passed and emitted 102 static pages |
| Lint | 0 errors, 364 warnings before P0 work |
| Runtime | 10 handlers reproduced HTTP 500 due to a `SecurityFabric.wrapHandler` contract mismatch |
| Privacy | Academic command center, student records, and user profiles reproduced anonymous HTTP 200 responses |
| Bundle | `/scam-check` shipped about 22.77 MB uncompressed JavaScript; one model chunk was about 22.69 MB |
| Dependencies | One high-severity transitive `nanoid` advisory remained in the installed production dependency tree |
| Type coverage | Nearly all application boundaries remain JavaScript despite strict TypeScript configuration |

All 235 test files were demonstrated passing across two runs. The default restricted runner still exits non-zero when its final production drill cannot access the external network; that test passed separately with network access. This is a test-isolation defect, not proof of external-service availability.

## P0 state matrix

| State | Trigger | Expected action | Boundary/error |
| --- | --- | --- | --- |
| Anonymous private read | No valid credential | Stop before domain handler | 401 `UNAUTHORIZED` |
| Anonymous mutation | No valid credential | Stop before parsing/mutation | 401 `UNAUTHORIZED` |
| Own-resource read | Valid student principal | Derive student identity from principal | 200 or domain 404 |
| Cross-student request | Query/body identifies another student | Object ownership deny | 403 `OBJECT_NOT_OWNED` |
| Client role/trust injection | Body contains role, trust, verification, expert fields | Ignore security-sensitive fields | Preserve server values |
| Invalid route wrapper | No callable handler supplied | Fail during module initialization | Explicit `TypeError` |
| Embedded compatibility handler | Handler is supplied in policy config | Invoke named context adapter | Normal route response |
| External provider unavailable | Provider disabled/timeout | Preserve partial/unknown state | Never convert failure to safe |

## P0 changes implemented in this phase

- `SecurityFabric.wrapHandler` now supports its positional contract and the existing embedded compatibility contract, and rejects missing handlers immediately.
- The ten previously broken personalization/social handlers no longer return handler-contract 500s.
- Private academic records, command-center data, notifications, task workflows, discrepancy reports, personalization state, device state, recommendations, and user profiles require authentication.
- Client-provided student IDs are checked for ownership; the server derives the effective subject from the authenticated principal.
- Profile updates no longer accept client role, expert field, trust score, or verification authority.
- Institutional email status now requires an identity-provider mailbox-verification claim; a domain string no longer grants reputation.
- JWT validation now requires expiration and issuer claims in addition to signature and audience validation.
- The compatible dependency fix removed the observed high-severity `nanoid` advisory; the current production audit reports zero known vulnerabilities.
- A real Next.js runtime regression suite covers the fixed handlers, anonymous rejection, IDOR rejection, self-promotion rejection, and institutional-email proof.
- Rate-limit buckets are isolated by client IP and route action, preventing unrelated endpoints from exhausting each other's quota.
- Core forum/community mutations now derive author and voter identity from the authenticated principal; expert graph mutations require explicit authority.

## Verified result after this phase

| Metric | Before | After |
| --- | ---: | ---: |
| Discovered test files | 235 | 236/236 pass |
| Lint | 364 warnings, 0 errors | 341 warnings, 0 errors |
| Security Fabric authenticated handlers | 29 | 52 |
| Explicitly rate-limited public handlers | not inventoried | 24 |
| Unprotected mutations flagged for review | 40 | 0 |
| Known production dependency vulnerabilities | 1 high | 0 |
| `/scam-check` initial JavaScript | about 22.77 MB | 885,917 bytes |

## PHASE 1 continuation result

- All 116 API handlers now receive exactly one inventory class: `PUBLIC`, `AUTHENTICATED`, `ADMIN`, or `SERVICE_ONLY`.
- Previously unclassified analyzer endpoints are explicitly rate-limited and body-size bounded; stateful/private endpoints require authentication or a service permission.
- Marketplace, professor review, quest, and safety-report mutations no longer accept client authority, verification, reputation, or trusted severity.
- The catch-all backend proxy is restricted to four authentication contracts and rejects every other path/method pair before forwarding credentials.
- Server OCR no longer claims to process image bytes when no OCR worker exists. It returns `SERVER_OCR_NOT_CONFIGURED`; client-derived text is labeled `CLIENT_OCR_HINT` with no fabricated confidence.

The large neural weights still exist as an optional asynchronous chunk (about 22.7 MB). They no longer belong to the route's initial entry set, but must move to a worker/server model service or be quantized before the final 500 KB Trust-shell target can be considered achieved.

## PHASE 2/3 foundation checkpoint

- API inventory now covers 119 handlers with 0 unprotected mutation P0 review, including explicit session exchange/read/logout contracts.
- OIDC verification enforces signed ES256/RS256 keys, issuer, audience, expiration, subject, and JWKS rotation.
- Upstream proofs exchange once into 256-bit opaque sessions; PostgreSQL stores only keyed hashes and revocation/expiry state.
- Production refuses legacy process-memory session cookies. Cookie-authenticated mutations receive exact-origin CSRF enforcement.
- Migration `202608270001_v2_authority_foundation.sql` separates public profile display data from private role/session/expert/reputation authority and removes the insecure legacy public-profile policy/grants during upgrade.
- Forum POST/GET is PostgreSQL-first and fails with `DATABASE_UNAVAILABLE`; explicit memory mode is non-production only.
- 239/239 discovered test files, build/TypeScript, lint (0 errors), bundle budget, and dependency audit pass.
- Live migration/RLS and real browser/server restart gates remain `BLOCKED_BY_DATABASE_ENV`; browser bearer migration remains intentionally incomplete.

## Architecture truth

### Valuable foundations

- Deterministic Trust Layer 1 contains useful Vietnamese scam rules, homoglyph/userinfo handling, OTP/payment-pressure detection, evidence spans, and fail-closed behavior.
- Academic planning and execution modules contain substantive state machines, prerequisite/what-if logic, reconciliation, and idempotency concepts.
- Evidence, provenance, epistemic-state, authority-scope, consensus, contradiction, and reliability domain models form a credible starting point for TrustGraph.
- Security Fabric already separates identity, RBAC/ABAC/ReBAC, risk, purpose, rate limiting, and audit concerns.
- The project contains strong property/mutation/domain coverage and a maintained Obsidian knowledge vault.

### Deficits that remain

- Supabase Auth, an external ASP.NET service, and browser demo/session behavior remain fragmented. Production tokens are still stored in browser storage.
- Most API routes are not yet protected by Security Fabric; several legacy write routes still accept client identity or reputation-like fields.
- Persistence can fall back to process memory or local files and is unsafe for multi-instance/serverless production.
- There is no complete migration set for TrustGraph, RLS test harness, Redis/queue worker, object-storage pipeline, or append-only durable audit store.
- AI Studio/chat are simulated or hardcoded. Layer 3 is not live web search, and Layer 4 currently falls back deterministically rather than executing a model jury.
- OCR is real in the browser, but the server OCR endpoint does not process supplied image bytes.
- Model registry metrics are declared rather than recomputed from immutable leakage-resistant holdouts. Existing datasets are substantially synthetic.
- Three API namespaces and multiple Trust implementations/shells overlap.
- The visual system mixes multiple palettes, seven font families, many hardcoded colors, and expensive concurrent motion/WebGL systems.
- Browser/E2E, database/RLS, accessibility, load, and true API integration tests are still sparse.

## Product migration classification

| Classification | Modules | Decision |
| --- | --- | --- |
| CORE | Scam/Trust analysis, evidence fusion, community intelligence, expert intelligence, TrustGraph | Consolidate and harden |
| SUPPORTING | Authentication, notifications, profile/settings, moderation/admin, source connectors | Retain only as support for the three core systems |
| ARCHIVE CANDIDATE | Academic super-app, scholarship, tuition radar, contract checker, safety map, SOS | Preserve useful rules/components; remove from primary V2 navigation |
| REMOVE FROM CORE | Marketplace, quests/leaderboard, professor rating, generic chatbot/AI Studio | Do not invest further until a proven core dependency exists |

## Target architecture

```text
Web / PWA
   -> Next.js App Router (SSR UI + thin authenticated BFF)
      -> Modular application API
         -> Trust | Community | Expert modules
            -> TrustGraph core
               -> PostgreSQL + pgvector + tested RLS
               -> Redis / durable queue
               -> Object storage
               -> AI/ML orchestrator and workers
               -> approved evidence-provider adapters
```

The target is a modular monolith plus asynchronous workers, not presentation-driven microservices.

## Next completion gates

1. Finish the generated API authorization inventory and lock every sensitive/write route.
2. Select one identity authority and replace browser bearer storage with secure HttpOnly session handling, CSRF protection, refresh rotation, revocation, and JWKS verification.
3. Introduce canonical PostgreSQL migrations and tested RLS; prohibit production file/memory fallback.
4. Consolidate `/api/v1/trust`, `/api/v1/community`, `/api/v1/experts`, and `/api/v1/graph` behind compatibility adapters.
5. Move OCR/model weights off the critical client path and enforce bundle budgets.
6. Replace simulated AI/search with explicit provider states and real, schema-validated orchestration.
7. Build immutable ScamBench VN splits and recompute calibration/holdout metrics from raw predictions.
8. Add CI gates for integration, RLS, E2E, accessibility, security, bundle size, and model evaluation.

## Evidence commands

```bash
npm run lint
npm run build
npm run test:all-discovered
node frontend/tests/security/security_token_session.test.mjs
node frontend/tests/security/security_fabric_integration.test.mjs
node frontend/tests/platform/p0_runtime_routes.test.mjs
npm run audit:api-auth
npm run audit:bundle
cd frontend && npm audit --omit=dev
```

Claims in future UI, documentation, and competition material must remain labeled `research prototype`, `synthetic benchmark`, `risk indicators`, or `expert-reviewed` unless a reproducible gate proves a stronger statement.
