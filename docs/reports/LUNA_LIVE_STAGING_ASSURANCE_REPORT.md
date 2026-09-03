# StudentHub AI — Luna Max Live & Staging Assurance Report

**Assurance date:** 2026-09-01  
**Authority:** Luna Max  
**Scope:** Production-reality, reference-backend, Supabase, staging, security, persistence, provider, browser, performance, and release-gate assurance after the four-layer integration.  
**Change policy:** No visual redesign, feature expansion, domain semantic change, migration execution, deployment, or remote destructive action was authorized or performed in this assurance pass.

## 1. Final status

**LIVE_ASSURANCE_BLOCKED_BY_ENVIRONMENT**

The local application and the local post-integration quality baseline remain green. Live assurance cannot be completed because the required production-like environment is not available or not fully contract-compatible:

- no executable staging base URL or staging case file;
- no configured disposable PostgreSQL/Supabase test database, service-role credential, session pepper, or test identities;
- no verified RLS, authenticated session, Passport ownership, private screenshot storage, backup, or restart-persistence evidence;
- the approved reference provider is only reachable through an ephemeral local adapter override, with Layer 3 unavailable and Layer 4 returning an incompatible HTTP 400 problem response;
- no authenticated Vercel control plane or deployment evidence;
- Firefox cannot spawn in this host and agent-browser is not installed;
- production-like Lighthouse/Core Web Vitals, GPU/device, and staging observability evidence are unavailable.

No claim of staging readiness, live readiness, or final RC is made.

## 2. Executive summary

The frozen StudentHub AI product boundary is intact: Trust is the P0 flagship, Community and Expert are P1 supporting pillars, and the final core pillar route count is 3. The source tree still contains 39 page routes, all accounted for by the frozen route matrix: 13 KEEP, 13 MERGE_INTO, 4 REMOVE, and 9 POST_V1.

The golden local baseline was independently rechecked without changing its source report. Local quality gates passed: 267/267 discovered test files, TypeScript with 0 errors, ESLint with 0 errors, production build with 117/117 static pages, exact Trust/Community/Expert bundle budgets, dependency audit with 0 production vulnerabilities, and targeted Chromium, WebKit, mobile Chromium, and Axe checks. These results establish local regression safety only.

The current environment does not support the required live boundary checks. Supabase Auth settings respond, but PostgREST rejects the available anonymous request and no database execution or RLS harness ran. Storage lists no buckets and no private screenshot bucket/policy is defined in the inspected migrations. Anonymous local routes correctly return typed access failures, but no real user A/B, expert, moderator, or admin identities exist for authorization proof.

The reference backend provides useful compatibility evidence but is not a passing four-layer production contract. Layer 2 returned a valid safe result through an ephemeral adapter override. Layer 3 returned PARTIAL with legacy integration UNAVAILABLE and no evidence. Layer 4 returned UNAVAILABLE after an HTTP 400 application/problem+json response. The adapter fails closed; the missing provider contract must be resolved outside this report.

## 3. Reports reviewed

The following source-of-truth reports and operational documents were reviewed. The pre-4-layer report was treated as immutable and was not overwritten or reinterpreted.

| Document | Evidence role | Integrity / note |
| --- | --- | --- |
| docs/reports/LUNA_POST_ANTIGRAVITY_REGRESSION_REPORT.md | Immutable pre-4-layer golden baseline | SHA-256 97770E16D180D6963733627D6FAA9D7CBA4AC64435730C32B55284D546A59169 |
| docs/reports/LUNA_4_LAYER_BACKEND_INTEGRATION_REPORT.md | Historical integration record | SHA-256 D0B1A8AD8BEDAA5A7DC6A5BA24288A4D3BA11CE9A8C38C626AD4710125800A32 |
| docs/reports/LUNA_POST_4_LAYER_REGRESSION_REPORT.md | Post-integration regression evidence | SHA-256 E86EBC3C6D7D10CA8AF1A053CC5660B23AB2A1555EACE022966D8774C3812AEA |
| docs/product/ROUTE_MAP.md | Frozen 39-route product and compatibility matrix | Reviewed as current route authority |
| docs/EXECUTION_STATE.md | Historical environment and security boundary record | Used only with current checks where applicable |
| docs/PRODUCTION_RUNBOOK.md | Intended deployment, recovery, health, and observability contract | Aspirational until independently verified |
| docs/KNOWN-LIMITATIONS.md | Declared external limitations | Compared with current environment |
| docs/RELEASE-CHECKLIST.md and docs/DEPLOYMENT-READINESS.md | Release-gate expectations | Not treated as runtime evidence |
| docs/contracts/* and docs/architecture/* | API, state, adapter, and boundary contracts | Used to classify static versus live proof |
| docs/visual-contracts/* | Visual handoff constraints | No visual implementation was started |

Route accounting was also independently enumerated from frontend/src/app. The 39 current page routes are fully accounted for:

| Disposition | Routes | Count |
| --- | --- | ---: |
| KEEP | /, /trust, /community, /expert, /cases, /dashboard, /profile, /settings, /settings/privacy, /login, /register, /callback, /onboarding | 13 |
| MERGE_INTO | /ai→/trust, /academic/profile→/profile, /contract-check→/trust, /intelligence→/trust, /intelligence/ai-trust→/trust, /intelligence/community→/community, /intelligence/evidence→/trust, /intelligence/experts→/expert, /intelligence/knowledge→/trust, /intelligence/trust→/trust, /prof-rating→/expert, /profile/[id]→/profile?profileId=:id, /scam-check→/trust | 13 |
| REMOVE | /forum→/community migration, /marketplace→/community migration, /quests→/dashboard migration, /ultra→/cases migration | 4 |
| POST_V1 | /academic, /academic/execution, /academic/planner, /academic/roadmap, /credit-scheduler, /safety-map, /scholarships, /sos, /tuition-radar | 9 |
| **Total** | **Every current page route** | **39** |

## 4. Golden baseline verification

The immutable pre-4-layer baseline remains unchanged. Current local checks were compared against it without lowering thresholds.

| Gate | Golden / recorded baseline | Current evidence | Result |
| --- | --- | --- | --- |
| Route accounting | 39 routes | 39 page files enumerated and mapped | PASS |
| Discovered tests | 267/267 | 267/267 | PASS |
| Adapter contracts | 20/20 | 20/20 included in discovered suite | PASS |
| Orchestrator contracts | 3/3 | 3/3 included in discovered suite | PASS |
| TypeScript | 0 errors | 0 errors | PASS |
| ESLint | 0 errors | 0 errors, 332 warnings | PASS |
| Production build | 117/117 pages | 117/117 pages | PASS |
| Chromium | 67 passed in recorded baseline | Current targeted core smoke 35/35 | PASS locally |
| WebKit | 64/64 executed in recorded baseline | Current targeted core smoke 35/35 | PASS locally |
| Mobile Chromium | 27/27 | 27/27 | PASS locally |
| Axe serious/critical | 0 | Targeted accessibility run passed with no serious/critical violation | PASS locally |
| Initial JavaScript | Trust 334,180 B; Community 334,165 B; Expert 334,192 B | Exact recorded values retained; all below 500,000 B budget | PASS |
| Production dependency audit | 0 vulnerabilities | 0 vulnerabilities | PASS |
| Demo/Live isolation | Verified locally | No source change in this assurance pass | PASS locally |
| Trust semantic invariants | Verified locally | Regression suite remains green | PASS locally |

The baseline is a local/static baseline. It does not substitute for live database, RLS, provider, storage, staging, or deployment proof.

## 5. Initial environment reality

Evidence classification used in this report:

- **VERIFIED:** directly observed in this repository or by a bounded local/remote request.
- **INFERRED:** derived from source/configuration and explicitly labelled as such.
- **NOT_EXECUTED:** the check was available in principle but not run.
- **BLOCKED_BY_ENV:** the check could not execute because a required environment, tool, credential, endpoint, or identity was absent.
- **EXTERNAL_LIMITATION:** a host/tool limitation is isolated from product correctness.

Observed environment:

| Area | Observation | Classification |
| --- | --- | --- |
| Working tree | Branch codex/trust-engine-v5-sequential-assurance at f96291ec9fc6f1ded6c8b519574e53c48aaa63be; extensively dirty from user/prior work | VERIFIED |
| Runtime | Node 24.16.0; frontend Playwright 1.62.1 | VERIFIED |
| Canonical layer configuration | STUDENTHUB_LAYER2_BASE_URL and STUDENTHUB_LEGACY_VERIFICATION_BASE_URL are empty in the example and not present as process environment values | VERIFIED |
| Supabase | NEXT_PUBLIC_SUPABASE_URL and an anonymous public key are present in frontend/.env.local; service-role, database, and session-pepper values are absent | VERIFIED without printing secrets |
| Auth/backend compatibility | NEXT_PUBLIC_API_URL points to the documented Render host; this is not the canonical four-layer provider environment variable | VERIFIED |
| Database tooling | No Supabase CLI, psql, pg_dump, or pg_restore available | VERIFIED |
| Staging | Required base URL and case-file variables absent | VERIFIED |
| Vercel control plane | CLI exists but has no usable credentials/project control-plane evidence | VERIFIED |
| Agent browser | agent-browser not present in PATH | VERIFIED |
| Firefox | Playwright binary exists but cannot spawn | VERIFIED |

No secret values were printed or copied into the report.

## 6. Reference backend availability

The configured Render host was probed only with safe, controlled data and through the existing anti-corruption adapter. No deployment, mutation, migration, or secret disclosure was performed.

| Probe | Observation | Result |
| --- | --- | --- |
| Host root, /health, /api/health | HTTP 404 | Endpoint health contract not available |
| GET /api/verify/layer2 | HTTP 405, confirming a POST-only route exists | PARTIAL |
| Adapter Layer 2 | Valid safe response and preserved request ID | PASS for one controlled case |
| Adapter Layer 3 | Bounded call returned PARTIAL / UNAVAILABLE with no response body observed | BLOCKED_BY_ENV / PARTIAL |
| Adapter Layer 4 | HTTP 400 application/problem+json; adapter normalized to UNAVAILABLE | CONTRACT DRIFT / BLOCKED |
| Public Vercel URL in prior docs | Pages return 200, but Trust API returns trust.v1 while current local contract is trust.v5 | STALE PREVIEW, not staging |

The reference API is reachable enough to establish that Layer 2 exists and that Layer 4 has a problem response, but it is not evidence of full live readiness.

## 7. Layer 2 live results

**Status: PARTIAL**

An ephemeral process-only adapter configuration used the configured Render compatibility host as the Layer 2 base URL. The repository environment files were not modified.

- Controlled URL input was safe and contained a sensitive query parameter solely to verify redaction behavior.
- Adapter result: providerStatus SUCCESS, finding NO_KNOWN_THREAT.
- Adapter preserved the request ID and did not expose the sensitive query in the normalized result.
- Adapter describe() reported the canonical Layer 2 endpoint shape when the ephemeral override was supplied.

This proves one bounded adapter-to-provider response, not a configured production Layer 2 deployment. The canonical environment variable remains unset and no provider failure matrix was completed.

## 8. Layer 3 live results

**Status: BLOCKED_BY_ENVIRONMENT / PARTIAL**

A safe text claim was sent through the canonical adapter using an ephemeral base URL override. The observed normalized result was:

- result PARTIAL;
- legacyIntegration.status UNAVAILABLE;
- no sources or evidence;
- canContinueToLayer4 false.

The bounded call did not produce an observed upstream HTTP response before the adapter returned its unavailable state. The Layer 3 contract, source schema, timeout behavior against the approved staging provider, and provider-backed evidence binding therefore remain unverified.

The fail-closed result is correct for the available evidence. It must not be promoted to VERIFIED or used to continue to Layer 4.

## 9. Layer 4 live results

**Status: BLOCKED_BY_ENVIRONMENT / CONTRACT DRIFT**

A safe Layer 4 payload was sent through the canonical adapter using the same process-only override. The result normalized to:

- providerStatus UNAVAILABLE;
- errorCode LEGACY_LAYER4_HTTP_400;
- no sources;
- rawVerdict null.

A bounded response wrapper observed HTTP 400 with content type application/problem+json; charset=utf-8 and a 369-byte body containing the generic keys errors, status, title, traceId, and type. The untrusted response body was not copied into this report.

The upstream response shape is not the current accepted Layer 4 result contract. No adapter change was made because the authoritative provider contract and expected request schema were not supplied.

## 10. Live provider failure behavior

**Status: PARTIAL**

The available evidence demonstrates safe failure normalization:

| Failure | Observed behavior | Assessment |
| --- | --- | --- |
| Layer 3 bounded no-response/timeout path | PARTIAL plus UNAVAILABLE integration; no evidence; continuation disabled | PASS for fail-closed local adapter behavior |
| Layer 4 upstream HTTP 400 problem response | UNAVAILABLE; raw verdict cleared; no sources returned | PASS for fail-closed normalization |
| Provider 5xx, malformed success, schema mismatch, slow response, retry budget, and circuit behavior | Not exercised against an approved staging provider | BLOCKED_BY_ENV |
| Live provider outage to user-facing UI | No staging run | BLOCKED_BY_ENV |

The failure path does not fall back to DemoProvider or fabricate a verdict. Full live assurance remains blocked.

## 11. External SSRF boundary

**Status: PARTIAL**

Local tests and source inspection verified the presence of URL validation, remote URL safety checks, adapter URL handling, and sensitive-query redaction. Local controlled checks did not demonstrate an unsafe redirect or private-address fetch.

The following required external checks were not executed:

- redirect from a permitted host to loopback, link-local, private, or metadata addresses;
- DNS rebinding or IPv6/private address handling in the deployed crawler;
- maximum response size, content type, redirect count, and timeout enforcement in staging;
- server egress logs proving that blocked destinations were not contacted.

The external boundary is therefore not release-ready evidence.

## 12. Prompt injection

**Status: PARTIAL**

Local PromptInjectionGuard/firewall and Trust regression tests are present and passed as part of the discovered suite. External web content from a live provider was not supplied to the current runtime, and the unavailable Layer 3 response did not provide source material to process.

Verified local invariant: retrieved or user-provided content is treated as data and does not authorize a change in Trust semantics. Unverified live invariant: hostile instructions embedded in fetched pages, OCR text, provider explanations, or community content remain non-authoritative in the deployed pipeline.

## 13. Supabase environment

**Status: BLOCKED_BY_ENVIRONMENT**

Safe probes against the configured Supabase URL found:

| Probe | Observation | Meaning |
| --- | --- | --- |
| GET /auth/v1/settings | HTTP 200 with auth capability metadata | Supabase Auth endpoint is reachable |
| GET /rest/v1/ with anonymous key | HTTP 401 | No usable anonymous PostgREST proof; does not prove database outage or RLS correctness |
| GET /storage/v1/bucket with anonymous key | HTTP 200 and an empty list | No visible buckets; does not prove intended private storage exists |

No service-role key, database connection string, disposable RLS test URL, storage-state file, test users, or staging origin was available. The evidence is insufficient to say that the configured project contains the expected schema, policies, private bucket, or deployment migration.

## 14. Migration status

**Status: BLOCKED_BY_ENVIRONMENT**

Static inspection found two migration files under database/migrations:

- 202608270001_v2_authority_foundation.sql: one transaction, 19 RLS enables, 12 policies, no DROP TABLE;
- 202608290001_feature_freeze_cross_system.sql: one transaction, 6 RLS enables, 9 policies, no DROP TABLE.

The files were not executed against Supabase or a disposable PostgreSQL instance. There is no supabase/ directory and no local PostgreSQL execution tool. No migration checksum was applied to a remote project. The inspected migrations do not define a private screenshot storage bucket, object policy, or signed URL route.

The runbook's migration and recovery statements remain intended contracts, not execution evidence.

## 15. RLS matrix

This is the required live authorization matrix. Every runtime cell is unverified because the dedicated database URL and test identities are absent. Static route/repository intent is not substituted for an RLS result.

| Resource | Anonymous | Owner | Other user | Expert/moderator/admin | Live result |
| --- | --- | --- | --- | --- | --- |
| Profiles | Public-safe fields only | Own permitted fields | Deny private fields | Role-scoped fields only | BLOCKED_BY_ENV |
| Trust evidence | Deny private records | Own permitted records | Deny | Role-scoped review only | BLOCKED_BY_ENV |
| Evidence Passport | Deny | Read/append own Passport | Deny | Explicit support scope only | BLOCKED_BY_ENV |
| Community observations | Read public observation DTO | Own correction/retraction scope | Deny owner-only mutations | Moderation scope only | BLOCKED_BY_ENV |
| Expert records/evaluations | Read published safe directory | Own permitted profile | Deny private data | Explicit expert/admin scope | BLOCKED_BY_ENV |
| Session/audit records | Deny | No direct client access | Deny | Service-only | BLOCKED_BY_ENV |
| Screenshot objects | Deny | Signed access to own object if implemented | Deny | Explicit review scope | NOT_IMPLEMENTED / BLOCKED_BY_ENV |

## 16. Auth/session

**Status: BLOCKED_BY_ENVIRONMENT**

Static code contains the intended Supabase/OIDC verification, one-time proof exchange, durable opaque session, HttpOnly cookie, CSRF, expiry, revocation, and server-derived principal boundaries. Local anonymous requests verified that protected endpoints reject unauthenticated access:

- GET /api/auth/session returned HTTP 401 with authenticated false;
- GET /api/v1/passports returned HTTP 401;
- local Trust API accepted only the documented public investigation path.

No real sign-in, OTP/OAuth callback, refresh, idle expiry, revocation, account-disabled, cross-user, or server-restart session test ran against a configured database. AuthContext/authService still include compatibility and browser profile-preference storage paths; no live evidence proves that every legacy bearer/session caller has completed the production cutover.

## 17. Passport persistence

**Status: BLOCKED_BY_ENVIRONMENT**

The Passport routes require a durable authenticated identity and use PostgresCrossSystemRepository for list, read, create, and append operations. The route code has explicit DATABASE_UNAVAILABLE and DURABLE_IDENTITY_REQUIRED failures.

The authenticated persistence contract, ownership filter, append-only history, replay protection, and restart survival passed local contract tests. No authenticated Passport could be created, read, appended, or read after restart in a live database. This is a hard release gate, not an external limitation.

## 18. Screenshot storage

**Status: BLOCKED_BY_ENVIRONMENT / NOT IMPLEMENTED AS LIVE STORAGE**

The current Trust UI can create a local browser preview and run local OCR hints. Static inspection found no verified private Supabase Storage bucket, object policy, upload route, signed download route, retention policy, or live screenshot ownership test in the inspected migrations and route set.

The supplied prototype media and user-selected screenshot are not evidence of private production storage. The requirement remains blocked until storage is provisioned, authenticated, cross-user tested, and deletion/retention behavior is demonstrated.

## 19. Source provenance

**Status: PARTIAL**

The local v5 contracts carry source identifiers, evidence identifiers, request identifiers, and provenance metadata. The post-4-layer regression work fixed Layer 3/Layer 4 evidence/source ID collisions and preserved source identity through normalized results.

Live Layer 3 and Layer 4 responses did not supply a valid current evidence set. Layer 4 returned no sources and a null raw verdict; Layer 3 returned no sources/evidence. Therefore deployed provider provenance, source freshness, same-source binding, and persisted provenance remain unverified.

## 20. TrustGraph live projection

**Status: BLOCKED_BY_ENVIRONMENT**

The TrustGraph behavior and lazy-load/bundle constraints passed local regression checks. The graph is intended to project claims, sources, evidence, and decisions from the canonical Trust case; it is not an independent source of truth.

No live evidence database, provider source set, Passport link, or post-restart graph projection was available. A visual graph can be shown locally, but that does not prove a live projection or provenance-safe graph.

## 21. Trust decision live semantics

**Status: PARTIAL**

Local semantic invariants remain verified:

- Layer 3 TRUE is not promoted to VERIFIED without verified live evidence;
- Layer 3 UNAVAILABLE stops downstream continuation;
- unknown, partial, error, and unavailable are distinct;
- provider failure does not become a clean or trusted verdict;
- Demo and Live paths remain isolated in local checks.

The available reference provider did not return a valid full Layer 3/Layer 4 evidence contract. Same-source live decision semantics, persisted decision history, and production provider failure UX are therefore blocked.

## 22. Community permissions

**Status: STATIC PASS / LIVE BLOCKED**

The local contracts preserve the invariant that a Community observation is context or corroboration, not truth. State-changing paths derive actor identity on the server and the route inventory contains authorization boundaries.

No live database/RLS test proved anonymous read scope, owner correction/retraction, cross-user denial, moderator scope, or that a community observation cannot mutate the canonical Trust verdict. Community release evidence remains blocked by the missing database environment.

## 23. Expert permissions

**Status: STATIC PASS / LIVE BLOCKED**

The expert directory is discoverable through the canonical API and the product contract preserves scoped authority: an expert response is an escalation or review signal, not an automatic Trust verdict. Expert/admin capabilities are expected to be role-scoped.

No live expert identity, role claim, evaluation persistence, cross-user denial, or unauthorized role escalation test ran. The public directory response alone is not proof of private expert permissions.

## 24. Rate limiting

**Status: PASS LOCALLY / STAGING BLOCKED**

A local single-process test sent 25 small safe POST requests to /api/v1/trust:

- first 20 returned HTTP 200;
- next 5 returned HTTP 429;
- the 429 body included code RATE_LIMIT_EXCEEDED, userMessage, correlationId, requestId, retryable true, and timestamp;
- no secret or request payload was echoed;
- Retry-After was not present on the observed 429 response.

This verifies typed local enforcement and user guidance. Distributed/staging limits, identity/IP policy, reset windows, provider-cost protection, and Retry-After behavior remain unverified.

## 25. Secret boundary

**Status: PARTIAL**

Static scans over source, build output, and inspected documentation found no matching provider secret, private key, or service-role assignment pattern. No secret value was printed. The anonymous Supabase key was treated as public configuration and not copied into this report.

Runtime secret protection is not fully proven because no authenticated deployment control plane, Vercel environment audit, staging bundle audit, provider invocation with a real server secret, or server log sink was available. Provider tokens and database service credentials were absent from this environment.

## 26. Staging runtime

**Status: BLOCKED_BY_ENVIRONMENT**

The repository's staging E2E command stopped before any request with:

STAGING_E2E_BLOCKED_BY_ENV: missing STUDENTHUB_STAGING_BASE_URL, STUDENTHUB_STAGING_CASES_PATH

The documented public Vercel URL is a preview URL, not a supplied staging contract. Direct safe requests to that URL returned pages, but its Trust API returned trust.v1 and therefore does not represent the current local trust.v5 contract. Vercel CLI authentication and project/deployment evidence were unavailable.

## 27. Staging Trust flow

**Status: BLOCKED_BY_ENVIRONMENT**

The required staging flow URL → investigation → report → action could not be executed. There is no staging base URL, case file, authenticated test account, live provider contract, database state, or storage state.

Local fallback evidence covers the deterministic UI and API states only:

1. URL input reaches the local Trust pipeline.
2. Provider unavailable is rendered as unavailable and cannot be treated as verified.
3. A valid live report requires provider/evidence data that the current external contract did not provide.
4. Action/persistence gates require authenticated Passport and storage infrastructure that are not configured.

## 28. CSP

**Status: NOT VERIFIED FOR STAGING**

SecurityHeaders.js defines a CSP with self, inline scripts/styles, data/HTTPS images, data fonts, and broad HTTPS connect sources. This is a source-level policy, not proof of the deployed header.

The local page probe showed that /trust did not receive CSP because frontend/src/proxy.js matches only a subset of pages and /api paths. The public preview also showed inconsistent header coverage between core pages. The current policy's unsafe-inline and broad HTTPS allowances require a production security review before release.

## 29. Security headers

**Status: PARTIAL**

Local API routes under the security wrapper emitted correlation IDs and standard hardening headers in the observed probes. Local /trust lacked the complete expected header set because the proxy matcher excludes the canonical core page routes. The preview showed the same type of route inconsistency: some pages returned HSTS only while other routes returned additional hardening headers.

No staging or production response was available to verify CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-Robots-Tag, cache behavior, or header behavior through the deployed CDN.

## 30. Egress

**Status: NOT VERIFIED**

Static egress inventory identified these classes of outbound destinations:

| Egress class | Examples / purpose | Runtime status |
| --- | --- | --- |
| Supabase | Auth, PostgREST, Storage | URL reachable; DB/storage policy not verified |
| Compatibility backend | Render host used by auth/backend compatibility path | Some endpoints reachable; full contract incomplete |
| Four-layer provider | Base URLs supplied by server-only environment variables | Canonical variables absent |
| AI providers | OpenAI-compatible/Gemini/optional GenSpark integrations | Not configured |
| Threat intelligence | URLhaus and similar safety sources | Local code present; deployed allowlist not verified |
| Institutional/community sources | HCMUTE, GitHub, RSS, published source URLs | Source freshness and server egress policy not verified |

No deployed allowlist, DNS policy, proxy policy, outbound firewall, timeout/size enforcement record, or egress log was available. Client-visible and server-only boundaries need deployment verification.

## 31. Logging privacy

**Status: PARTIAL**

Local server logs emitted structured security audit events with event ID, timestamp, event type, subject, action, decision, correlation ID, client IP, and bounded details. The observed logs contained no provider secret or user payload. Rate-limit failures also logged a safe error name/status rather than submitted content.

There is no staging log sink or retention policy evidence. Client IP is present in local security audit records, so production privacy notice, access control, retention, redaction, and data-residency policy remain required checks.

## 32. Observability

**Status: PARTIAL**

Verified local observability primitives include correlation/request IDs, structured security audit events, typed API errors, and provider unavailable states. The reference Layer 4 response carried an upstream traceId inside an untrusted problem envelope, but no live trace correlation was established.

No production destination, provider latency/error dashboard, database pool telemetry, rate-limit dashboard, alert route, sampling policy, or privacy-reviewed log pipeline was available. Operational observability is not release evidence.

## 33. Health/readiness

**Status: NOT VERIFIED**

The only discovered health route is GET /api/intelligence/health. It returned HTTP 200 locally but identifies its data as synthetic benchmark health, with isAuthoritative false; it does not prove database, token-validator, provider, storage, or deployment readiness.

The production runbook describes liveness and readiness checks, but no separate executable readiness route or deployed probe was demonstrated. A real staging health contract must distinguish process liveness from dependency readiness and fail when required dependencies are unavailable.

## 34. Firefox

**Status: EXTERNAL_LIMITATION**

The Firefox Playwright binary is present in the local cache. A targeted 35-test run failed before test execution because the host could not spawn:

C:\Users\Duy\AppData\Local\ms-playwright\firefox-1538\firefox\firefox.exe

with spawn UNKNOWN. A browser install command completed without restoring the spawn capability. This is a host/runtime limitation, not evidence of a Firefox product failure. Firefox remains an external limitation for final RC until rerun on a supported host.

## 35. agent-browser

**Status: EXTERNAL_LIMITATION**

agent-browser is not installed or discoverable in PATH. The required browser skill fallback was used: direct Playwright browser automation against the correctly bound local server. Chromium, WebKit, and mobile Chromium checks passed, but this cannot be reported as an agent-browser pass.

## 36. Lighthouse/CWV

**Status: NOT_EXECUTED**

No Lighthouse or production-like Core Web Vitals run was completed in this assurance pass. The bundle budget audit passed, but it is not a substitute for LCP, CLS, INP, TBT, network waterfall, font/media, or accessibility lab metrics.

The public preview's HTTP page sizes are not lab performance evidence. Lighthouse must be run against the approved staging deployment with representative throttling and recorded artifacts before the final RC gate.

## 37. GPU/device

**Status: NOT_EXECUTED**

No GPU acceleration, WebGL/canvas fallback, reduced-motion, thermal/mobile memory, high-DPI, low-power, or device matrix was executed for the prototype media/Three.js surface. The core application tests cover responsive and reduced-motion behavior locally, but not production GPU delivery.

The prototype must remain isolated from the core initial route until visual ownership and media delivery gates are separately approved.

## 38. Prototype media delivery

**Status: LOCAL PROTOTYPE ONLY**

The media/open-constant directory contains 11 files: 9 MP4 files, 1 PNG, and three.min.js. The measured total is 81,553,686 bytes, approximately 77.78 MiB. The root prototype index references this media, and no matching media was included in the frontend/.next build output by the inspected match check.

No CDN, transcoding, poster, preload policy, pause/visibility policy, mobile fallback, cache policy, or deployed media route was verified. These assets were not integrated into the product in this assurance pass and must not be used as live performance evidence.

## 39. Failure experience

**Status: PARTIAL**

Locally verified failure boundaries include:

| Boundary | Observed result |
| --- | --- |
| Unknown page | HTTP 404 |
| Anonymous session | HTTP 401 with authenticated false |
| Anonymous Passport list | HTTP 401 |
| Malformed Trust JSON | HTTP 400 with typed error shape |
| Trust rate limit | HTTP 429 with typed retryable error |
| Layer 3 unavailable | PARTIAL/UNAVAILABLE and continuation disabled |
| Layer 4 problem response | UNAVAILABLE; raw verdict null |
| Database unavailable route branch | Static contract and tests exist; live outage not run |

Staging 500/503 behavior, retry-after guidance, upstream incident correlation, and user-facing recovery from real provider/database/storage outages remain blocked.

## 40. Backup/recovery

**Status: NOT VERIFIED**

docs/PRODUCTION_RUNBOOK.md describes an intended RPO under 5 minutes, RTO under 15 minutes, automated snapshots, WAL replication, and atomic file journals. No backup provider, snapshot schedule, restore artifact, checksum, recovery rehearsal, or measured RPO/RTO was available.

No migration or restore operation was attempted. Production release must not rely on the runbook text as proof of recoverability.

## 41. Incident readiness

**Status: NOT VERIFIED**

The repository contains runbook and structured audit primitives, but no verified staging alert destination, on-call owner, provider incident path, database incident path, backup escalation, trace search procedure, or privacy-approved log access process.

The current code's fail-closed provider and database states are the correct safety posture while infrastructure is missing. Incident readiness requires a real deployment rehearsal.

## 42. Live E2E matrix

**Overall status: BLOCKED_BY_ENVIRONMENT**

| ID | Scenario | Evidence | Result |
| --- | --- | --- | --- |
| LIVE-01 | Authenticated user submits URL and reaches a live Trust investigation | No staging identity/provider contract | BLOCKED_BY_ENV |
| LIVE-02 | Live provider success, partial, timeout, 4xx, 5xx, and unavailable states | L3 unavailable and L4 400 observed; full matrix absent | PARTIAL / BLOCKED_BY_ENV |
| LIVE-03 | Screenshot upload to private storage and authorized retrieval | No bucket, policy, or storage state | BLOCKED_BY_ENV |
| LIVE-04 | User A cannot read User B's Passport/evidence | No RLS database/test users | BLOCKED_BY_ENV |
| LIVE-05 | Authenticated Passport append is owner-bound and append-only after restart | No live database or restart environment | BLOCKED_BY_ENV |
| LIVE-06 | Community observation/corroboration permissions | Static contract only | BLOCKED_BY_ENV |
| LIVE-07 | Expert escalation and role-scoped permissions | No expert/admin identities | BLOCKED_BY_ENV |
| LIVE-08 | Login, refresh, expiry, logout, revocation, and CSRF | Anonymous-only local proof | BLOCKED_BY_ENV |
| LIVE-09 | Staging rate limit and provider-cost protection | Local 20/5 result only | PARTIAL / BLOCKED_BY_ENV |
| LIVE-10 | Provenance, TrustGraph, and decision same-source binding | Local semantic proof; no live source set | PARTIAL / BLOCKED_BY_ENV |

## 43. Static regression rerun

**Status: PASS LOCALLY**

No live-driven source fix was made in this phase. The static and local regression gates were nevertheless rerun against the current working tree:

- discovered suite: 267/267;
- TypeScript: 0 errors;
- ESLint: 0 errors and 332 warnings;
- production build: 117/117 pages;
- production dependency audit: 0 vulnerabilities;
- adapter contract suite: 20/20;
- orchestrator contract suite: 3/3;
- bundle audit: Trust 334,180 B, Community 334,165 B, Expert 334,192 B;
- targeted Chromium: 35/35;
- targeted WebKit: 35/35;
- mobile Chromium: 27/27;
- Axe serious/critical: 0 in the targeted accessibility run;
- git diff --check: no whitespace errors; only existing LF/CRLF notices.

Because no live-driven code change was authorized, there is no additional post-fix source delta to isolate. Pre-existing dirty worktree changes remain owned by the user/prior work and were not rewritten.

## 44. Browser matrix

| Browser/runtime | Current run | Result | Boundary |
| --- | --- | --- | --- |
| Chromium desktop | 35/35 targeted core tests | PASS | Local dev server |
| WebKit desktop | 35/35 targeted core tests | PASS | Local dev server |
| Mobile Chromium | 27/27 navigation/responsive tests | PASS | Local dev server |
| Firefox | 35 launch failures with spawn UNKNOWN | EXTERNAL_LIMITATION | Host process spawn |
| agent-browser | Not installed | EXTERNAL_LIMITATION | Fallback Playwright used |
| Public preview browser flow | Not run as staging | NOT_VERIFIED | URL is stale preview, not approved staging |

The recorded golden browser results remain preserved separately and were not replaced with this narrower current smoke set.

## 45. Provider matrix

| Provider/layer | Configuration | Safe observation | Result |
| --- | --- | --- | --- |
| Layer 2 legacy verification | Ephemeral override only; canonical environment variable absent | Valid safe response, SUCCESS / NO_KNOWN_THREAT, request ID preserved | PARTIAL |
| Layer 3 legacy integration | Ephemeral override only | PARTIAL, UNAVAILABLE, no sources/evidence, cannot continue | BLOCKED_BY_ENV |
| Layer 4 legacy integration | Ephemeral override only | HTTP 400 problem response; normalized UNAVAILABLE | CONTRACT DRIFT / BLOCKED |
| Layer 2A local configuration | No canonical base URL in environment | Not executed as configured deployment | BLOCKED_BY_ENV |
| OpenAI-compatible AI Gateway | OPENAI_API_KEY/base route not configured | No provider call | BLOCKED_BY_ENV |
| Gemini | GEMINI_API_KEY not configured | No provider call | BLOCKED_BY_ENV |
| GenSpark AI Drive | Optional token/route not configured | No provider call | OUT OF CORE / NOT_EXECUTED |

The adapter remains the only approved compatibility boundary. No upstream contract was silently changed.

## 46. Security matrix

| Control | Local/static evidence | Live/staging result |
| --- | --- | --- |
| Auth/session server enforcement | SecurityFabric/session contract; anonymous 401 | BLOCKED_BY_ENV |
| CSRF/cookie lifecycle | Static contract tests | BLOCKED_BY_ENV |
| Cross-user authorization | Route/repository ownership intent | BLOCKED_BY_ENV |
| Private screenshot access | No bucket/policy/route evidence | BLOCKED_BY_ENV / NOT_IMPLEMENTED |
| Passport ownership/append-only | Local contract tests | BLOCKED_BY_ENV |
| Provider secret boundary | 0 static secret-pattern hits | Runtime deployment audit blocked |
| Provider failure fail-closed | L3/L4 unavailable normalization | Full staging matrix blocked |
| Demo/Live isolation | Local regression verified | Preview is stale; staging blocked |
| SSRF | Local URL safety/redaction tests | External crawler boundary blocked |
| Prompt injection | Local guards/regression tests | External content fixture blocked |
| CSP | Source policy and API hardening | Canonical page/staging headers not verified |
| Security headers | Partial local API coverage | Core page/deployment coverage blocked |
| Rate limiting | Local 20 success / 5 typed 429 | Staging/distributed behavior blocked |
| Log privacy | Safe local structured logs | Live retention/sink blocked |
| Evidence binding | Local Trust v5 invariants | Live provider evidence blocked |

## 47. RLS matrix

The following is the execution result for the mandatory RLS proof, separate from the expected matrix in section 15:

| Test | Required proof | Result |
| --- | --- | --- |
| Anonymous cannot read private Passport | Execute with no session | BLOCKED_BY_ENV |
| User A reads own Passport | Authenticated A plus database row | BLOCKED_BY_ENV |
| User A cannot read User B Passport | Authenticated A against B row | BLOCKED_BY_ENV |
| User A cannot append to User B Passport | Authenticated A PATCH against B row | BLOCKED_BY_ENV |
| User cannot assign role/reputation/expert verification | Column/policy denial | BLOCKED_BY_ENV |
| Anonymous cannot retrieve private screenshot | Storage policy/object URL denial | BLOCKED_BY_ENV / NOT_IMPLEMENTED |
| Community owner-only mutation | A may mutate own; B denied | BLOCKED_BY_ENV |
| Expert/admin positive and negative scopes | Role-specific allow/deny | BLOCKED_BY_ENV |
| Database restart persistence | Row and append survive process restart | BLOCKED_BY_ENV |

No pass is claimed for a live RLS test that did not run.

## 48. Performance matrix

| Metric/gate | Evidence | Result |
| --- | --- | --- |
| Initial Trust JavaScript | 334,180 B, under 500,000 B | PASS |
| Initial Community JavaScript | 334,165 B, under 500,000 B | PASS |
| Initial Expert JavaScript | 334,192 B, under 500,000 B | PASS |
| Production build | 117/117 pages | PASS |
| Lighthouse LCP/CLS/INP/TBT | Not run | NOT_EXECUTED |
| Field Core Web Vitals | No deployment/telemetry | BLOCKED_BY_ENV |
| TrustGraph lazy loading | Local contract/regression evidence | PASS LOCALLY |
| Prototype media delivery | Local directory only; 77.78 MiB | NOT_VERIFIED |
| Hidden-tab/pause/GPU behavior | Not run | NOT_EXECUTED |
| Staging API/provider latency | No staging/provider matrix | BLOCKED_BY_ENV |

Performance approval cannot advance on bundle size alone.

## 49. Files changed

Assurance-owned changes in this phase:

- docs/reports/LUNA_LIVE_STAGING_ASSURANCE_REPORT.md — this report.

Generated or touched by an inspection command, but not a product/source fix:

- docs/security/API-Authorization-Inventory.md — generated by npm run audit:api-auth; it was already part of the shared dirty worktree context and is not treated as a live integration implementation.

No frontend source, migration, auth contract, adapter, provider contract, deployment configuration, media file, or database file was changed in this assurance pass. Existing user/prior-session modifications were preserved.

## 50. Commands run

The following local commands and bounded probes were run:

- npm run test:all-discovered
- npm run lint
- npx tsc --noEmit --pretty false from frontend
- npm run build
- npm run audit:bundle
- npm run audit:api-auth
- npm run test:phase3-contract
- npm run test:phase3-live
- npm audit --omit=dev --audit-level=high from frontend
- npx playwright install firefox
- targeted Playwright Chromium, WebKit, mobile Chromium, and Firefox runs
- cd frontend; npm run test:e2e:staging
- local HTTP probes for core pages, 404, session, Passport, malformed Trust input, safe Trust input, experts, and health
- local Playwright fallback checks for core pages, navigation, responsive behavior, Trust v5, accessibility, and no error overlay
- local rate-limit probe: 25 safe Trust requests
- ephemeral adapter probes for Layer 2, Layer 3, and Layer 4
- safe Supabase Auth, PostgREST, and Storage endpoint probes
- source, migration, route, egress, static sink, and secret-pattern scans
- git diff --check
- SHA-256 verification of the three baseline reports

Remote calls were read-only or safe controlled POST probes. No migration, deployment, account mutation, storage upload, restore, or credential operation was attempted.

## 51. Environment blockers

The following blockers prevent live/staging completion:

1. STUDENTHUB_STAGING_BASE_URL and STUDENTHUB_STAGING_CASES_PATH are absent.
2. No approved staging storage-state file or authenticated test accounts are present.
3. STUDENTHUB_RLS_TEST_DATABASE_URL is absent.
4. DATABASE_URL, DIRECT_URL, SUPABASE_SERVICE_ROLE_KEY, and STUDENTHUB_SESSION_PEPPER are absent.
5. No PostgreSQL/Supabase CLI or disposable database runtime is available.
6. No verified private screenshot bucket, object policy, signed URL route, or storage fixture exists.
7. Canonical Layer 2/Layer 3/Layer 4 provider base variables are absent from the configured environment.
8. Layer 3 and Layer 4 reference responses are not a complete current provider contract.
9. No Vercel authentication or deployment control-plane evidence is available.
10. agent-browser is unavailable; Firefox cannot spawn on this host.
11. No Lighthouse/CWV artifact, GPU/device matrix, live log sink, alert destination, or backup rehearsal is available.

These are environment blockers, not reasons to weaken the local baseline or to substitute DemoProvider for live evidence.

## 52. Human authorization blockers

No destructive human authorization was requested or used. The following actions remain operator-owned and must not be inferred:

- provision or select a disposable Supabase/PostgreSQL project;
- provide staging URL, staging case file, storage state, and test identities;
- provide or install server-only provider/database/session secrets through the approved secret store;
- approve execution of migrations and RLS tests against a named non-production database;
- approve a staging deployment, Vercel control-plane access, or public preview promotion;
- approve backup/restore or incident-rehearsal operations;
- approve any adapter contract change after receiving an authoritative Layer 3/Layer 4 provider schema.

The primary current status is environment-blocked. Human authorization becomes a separate gate only after the required environment is provisioned.

## 53. Remaining risks

- The deployed provider may differ from the local v5 adapter contract; Layer 4 currently demonstrates concrete contract drift.
- Live RLS, auth/session lifecycle, Passport ownership, screenshot privacy, and database restart persistence are unproven.
- The public preview URL is stale relative to the current Trust v5 contract and must not be used as staging evidence.
- Core page security headers are inconsistent locally because the proxy matcher does not cover every canonical page; deployment behavior is also unknown.
- CSP uses unsafe-inline and broad HTTPS connect sources and needs production hardening review.
- Optional direct egress paths and source fetchers have no verified deployed allowlist.
- Rate limiting has no observed Retry-After header and has not been tested across instances.
- The only health route is synthetic and not an authoritative readiness probe.
- Firefox and agent-browser evidence remain unavailable on this host.
- Lighthouse/CWV, GPU/device, media delivery, backup, restore, alerting, and log-retention evidence are absent.
- The shared working tree is dirty, so source ownership and deployment provenance must be separated before release operations.

## 54. Final release recommendation

**Do not advance to staging sign-off, public preview promotion, or final RC.**

The local engineering baseline is preserved and the application is suitable for the next evidence-collection attempt, but the mandatory live gates are not satisfied. Do not reinterpret the failure-normalized provider responses as a passing live integration and do not lower the golden thresholds to accommodate missing infrastructure.

Recommended release decision: provision the required non-production environment, resolve the authoritative Layer 3/Layer 4 contract through the adapter boundary, execute live auth/RLS/storage/Passport/provider/staging matrices, then independently compare all results against this report and the immutable golden baseline.

## 55. Next gate

The next gate is **LIVE_ASSURANCE_RERUN_AFTER_ENVIRONMENT_PROVISIONING**, with this minimum evidence package:

1. A named staging URL, deployed commit/build identifier, staging case file, and storage-state file.
2. A disposable Supabase/PostgreSQL database with migrations applied from a clean state, checksums recorded, and a rollback/restore point.
3. Two ordinary test users plus expert, moderator, and admin identities with documented role claims.
4. DATABASE_URL or approved equivalent, STUDENTHUB_RLS_TEST_DATABASE_URL, server-only service credentials, and a compliant 32-character-or-longer session pepper in the secret store.
5. A private screenshot bucket with explicit object policies, signed access, retention/deletion behavior, and cross-user denial evidence.
6. Authoritative Layer 2, Layer 3, and Layer 4 request/response schemas plus controlled success, partial, timeout, 4xx, 5xx, malformed, and unavailable fixtures.
7. Live URL → investigation → report → action, screenshot → entities → evidence → report, Community corroboration, Expert escalation, and Evidence Passport flows.
8. Live SSRF redirect/private-address, prompt-injection, source-provenance, TrustGraph, and deterministic Trust decision tests.
9. Staging CSP/security-header/egress/logging/observability/health-readiness evidence.
10. Firefox on a supported runner, agent-browser if required by the release policy, Lighthouse/CWV artifacts, and GPU/device results.
11. Backup/restore rehearsal, measured RPO/RTO, incident contact and alert evidence.
12. Full static/browser regression rerun after any live-driven code fix, compared to the unchanged golden report.

Until that package exists and passes, the final status remains **LIVE_ASSURANCE_BLOCKED_BY_ENVIRONMENT**.
