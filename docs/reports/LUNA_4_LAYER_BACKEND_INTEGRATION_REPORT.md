# StudentHub AI — Luna Max Four-Layer Backend Integration Report

**Date:** 2026-09-01  
**Authority:** Luna Max  
**Scope:** Pre-integration golden-baseline comparison, legacy four-layer compatibility integration, canonical Trust pipeline assurance  
**Final status:** `4_LAYER_INTEGRATION_COMPLETE_WITH_ENV_BLOCKERS`

## 1. Final status

`4_LAYER_INTEGRATION_COMPLETE_WITH_ENV_BLOCKERS`

The server-side compatibility implementation, canonical orchestration boundary,
normalization, projections, safety handling, and local regression gates are
complete. The reference deployment was not configured in this environment, so
actual remote HTTP/provider behavior, Supabase/PostgreSQL/RLS execution, and
staging/live assurance remain environment-blocked. This status is not a claim
that the reference backend is live or production-ready.

The immutable pre-4-layer baseline was checked before and after integration:

| Baseline artifact | Pre-integration | Post-integration check |
| --- | --- | --- |
| `docs/reports/LUNA_POST_ANTIGRAVITY_REGRESSION_REPORT.md` | SHA-256 `97770E16D180D6963733627D6FAA9D7CBA4AC64435730C32B55284D546A59169` | Same hash; file was not edited |
| Current page routes | 39 accounted for | 39 remain accounted for |
| Discovered tests | 265/265 passed | 267/267 passed; two integration test files were added |
| Chromium | 67 passed | 67 passed, 3 explicit demo tests skipped |
| WebKit | 64/64 executed passed | 64/64 executed passed, 6 policy skips |
| Mobile Chromium | 27/27 passed | 27/27 passed |
| TypeScript | 0 errors | 0 errors |
| ESLint | 0 errors | 0 errors; 332 existing warnings remain |
| Production build | 117/117 pages | 117/117 pages |
| Axe serious/critical | 0 | 0 on tested Chromium/WebKit accessibility paths |
| `/trust` initial JS | 334,180 bytes | 334,180 bytes |
| `/community` initial JS | 334,165 bytes | 334,165 bytes |
| `/expert` initial JS | 334,192 bytes | 334,192 bytes |

No local degradation meeting the definition of
`POST_INTEGRATION_REGRESSION` was found. Firefox launch and the prescribed
`agent-browser` binary are separately classified as `BLOCKED_BY_ENV`, not as
product regressions.

## 2. Existing backend reality

The current repository already owns a canonical Trust API at
`POST /api/v1/trust`, including JSON and V5 SSE paths. The browser Trust client
calls that same-origin canonical endpoint; it does not call the legacy layer
paths. The existing V5 pipeline owns deterministic StudentHub Layer 1 through
Layer 5 policy and stage state.

The repository also contains an existing, separate Layer 2A provider boundary
for `STUDENTHUB_LAYER2_BASE_URL`. It remains intact. This phase adds an optional
unified compatibility adapter for the reference four-layer service rather than
replacing StudentHub's existing policy engine.

No reference ASP.NET deployment, provider credential, or
`STUDENTHUB_LEGACY_VERIFICATION_BASE_URL`/`LEGACY_VERIFICATION_BASE_URL` value
was available in `frontend/.env.local`. No remote availability probe was
therefore executed. The implementation is locally exercised with controlled
adapter fixtures only; fixture success is not reported as remote availability.

## 3. Reference backend contracts

The user-supplied reference contract is approximate and is treated as an
untrusted external DTO shape:

```text
Layer 2: { verdict, confidence, reason, providers }
Layer 3: { verdict, confidence, stop, canContinueToLayer4, reason, evidence, sources }
Layer 4: {
  verdict, confidence, evidenceAgreement, sourceQuality, stop,
  canContinueToLayer4, mode, geminiModel, groqModel, reason,
  contradictoryEvidence, sources
}
```

These payloads do not cross directly into React. The adapter validates and
normalizes them into existing StudentHub layer contracts and bounded canonical
projection fields. The canonical public response remains:

```text
verificationId, requestId, mode, state, input,
layers, decision, evidence, graph, passport
```

## 4. Compatibility decisions

The canonical entrypoint remains `POST /api/v1/trust`. A server-side
`TrustOrchestrator` supplies the optional reference adapter to the existing V5
pipeline. The browser continues to depend on one canonical Trust request.

The reference base URL is server-only and configured through
`STUDENTHUB_LEGACY_VERIFICATION_BASE_URL`, with the documented legacy alias
accepted for compatibility. Paths are constants inside the adapter and are not
embedded in UI components.

The reference backend is an optional provider, not a replacement database,
policy engine, or irreversible dependency. When it is not configured or is
unavailable, the result is explicit `UNAVAILABLE`/`UNKNOWN`/`PARTIAL` as
appropriate. No DemoProvider data is injected after a live failure.

StudentHub's deterministic Layer 1 and final policy remain authoritative.
Reference Layer 2/3/4 results are normalized observations or advisory synthesis
and cannot silently rewrite StudentHub domain semantics.

## 5. Architectural conflicts found

The main conflicts and resolutions were:

| Conflict | Resolution |
| --- | --- |
| Reference flow can be interpreted as frontend-owned L1 → L2 → L3 → L4 orchestration | Kept execution order, stop policy, continuation, timeout, and normalization in the server-side Trust orchestrator |
| Raw legacy verdict names do not match StudentHub state contracts | Added a server-only anti-corruption adapter with explicit verdict/status mapping |
| Reference confidence has no calibration guarantee | Retained it as provider assessment confidence; never mapped it to safety probability or final decision confidence |
| Layer 3 web evidence and Layer 4 independent research have different authority/origin | Preserved separate canonical origins and arrays |
| Existing Passport persistence requires an authenticated case owner and revision scope | Returned honest append-only projection with `NOT_PERSISTED` for anonymous Trust runs; no unauthenticated write was added |
| TrustGraph must not be decorative | Built nodes and edges only from actual normalized input, claim, evidence, and source records |

No contract blocker was discovered in the local codebase. Remote contract
compatibility is still unverified until the reference environment is supplied.

## 6. Adapter implementation

Implemented `frontend/src/lib/ai-trust/integrations/legacyVerification/`:

- `config.js` resolves server-only environment configuration, endpoint paths,
  bounded request/response/content limits, timeout, and DNS policy.
- `LegacyVerificationAdapter.js` is the anti-corruption boundary for all three
  reference endpoints.
- `canonicalTrustProjection.js` converts normalized layer records into the
  canonical evidence, graph, and Passport projections.

The adapter validates input and output, forwards a bounded `requestId`, uses
server-side `fetch`, applies `redirect: "error"`, validates content type and
response size, supports abort/timeout, and returns safe error metadata without
raw backend bodies or exception text.

The adapter never exposes provider credentials, never imports into browser-only
Trust UI code, and never selects demo data as a recovery path.

## 7. TrustOrchestrator implementation

`frontend/src/lib/ai-trust/TrustOrchestrator.js` extends the existing
`TrustPipelineOrchestrator` and injects the optional adapter at the server
boundary. `frontend/src/app/api/v1/trust/route.js` uses the factory for both
canonical JSON and existing V5 SSE execution.

The V5 pipeline continues to own stage sequence, retry/cancellation handling,
public stage envelopes, final policy, and assurance. The new adapter is opt-in:
with no valid legacy base URL, the existing local pipeline path remains the
runtime path.

## 8. Layer 1 implementation

Layer 1 remains the existing server-owned `Layer1ScreenService`. It continues to
normalize and screen input before external reputation/evidence work. The
adapter does not treat client checks as authoritative and does not fabricate DNS,
TLS, redirect, or other remote metadata.

Layer 1 hard negatives remain propagated into the local final policy even when a
downstream provider reports a no-match. Valid public URL input may be sent to
the configured Layer 2 adapter only after the existing reputation lookup policy
allows it.

## 9. Layer 2 integration

The adapter exposes a provider-port shape consumed by the existing Layer 2A
reputation service. It sends the normalized URL and request identity to
`POST /api/verify/layer2` only on the server and only when the adapter is
configured.

Mapping is explicit:

- `SAFE`/no known match → canonical `NO_KNOWN_THREAT`;
- `DANGEROUS` → canonical `THREAT_MATCH`;
- `UNKNOWN` → canonical `UNKNOWN`;
- timeout, rate limit, invalid response, configuration failure, or outage →
  typed unknown/unavailable provider state.

`NO_KNOWN_THREAT` retains `noMatchIsSafetyProof: false`. It never becomes
`VERIFIED_SAFE`, `ALLOW`, or a safety probability. Malformed responses are
discarded as contract failures.

## 10. Layer 3 integration

The adapter sends bounded input, candidate claims/sources, and upstream layer
summaries to `POST /api/verify/layer3`. It normalizes returned claims, evidence,
sources, verdict, reason, confidence, stop, and continuation fields into the
existing Layer 3 types.

Layer 3 `TRUE`/`SUPPORTED` maps to verified truth status only when the canonical
Layer 3 contract permits it. `FALSE`/`CONTRADICTED`/`MIXED` remains contested;
`UNKNOWN`/`UNVERIFIED`/insufficient remains insufficient; `UNAVAILABLE` remains
partial/unavailable. An external-evidence assertion is not accepted as live
proof unless the returned evidence includes the required live retrieval,
success, and source-fingerprint markers.

Every normalized Layer 3 source and evidence item carries
`origin: LAYER_3_WEB_EVIDENCE`. Layer 3 failure never substitutes local demo or
synthetic external evidence when the adapter is enabled.

## 11. Layer 4 integration

The existing deterministic StudentHub Layer 4 policy executes first and remains
the source of the canonical security/truth/action decision. If Layer 3
explicitly authorizes continuation, the adapter may call
`POST /api/verify/layer4` with bounded upstream context and unresolved signals.

The normalized reference response is attached as `legacyIntegration` advisory
metadata. It preserves raw verdict, assessment confidence, agreement, source
quality, model identifiers, concise reason, contradictions, and independent
research sources, all bounded and safe. It cannot override local policy or
upgrade an unknown/no-match result to safe.

If the reference Layer 4 service is unavailable or malformed, the canonical
result remains partial/reviewable and the local deterministic policy remains in
force. No hidden chain-of-thought is accepted or exposed.

## 12. Continuation policy

Continuation is server-controlled. The adapter rejects malformed types and the
contradictory combination `stop: true` with
`canContinueToLayer4: true`.

The reference Layer 4 call executes only when normalized Layer 3 has completed,
has not stopped, and does not explicitly set
`canContinueToLayer4: false`. A Layer 3 transport/configuration/schema failure
sets continuation to false. An explicit Layer 3 unknown may continue when the
validated response allows it; it is never treated as success.

No confidence threshold provides early certainty. Provider errors do not
continue as if a pass, and a dangerous Layer 2 finding remains governed by
StudentHub hard-negative policy.

## 13. Legacy verdict normalization

Legacy security and truth terms are not collapsed into one dimension. Layer 2
security observations, Layer 3 claim truth status, and Layer 4 advisory
synthesis remain distinct.

The canonical policy continues to distinguish security classification, truth
status, enforcement/action, evidence completeness, source agreement, unresolved
signals, and provider availability. A `TRUE` claim can coexist with a high-risk
URL; a Layer 2 no-match cannot prove either URL safety or claim truth.

## 14. Confidence normalization

Legacy `confidence` values are accepted only when numeric and within `[0, 1]`.
They are retained as:

- Layer 2 provider confidence;
- Layer 3 legacy assessment confidence;
- Layer 4 assessment confidence.

They are not converted into safety probability, evidence confidence, or
StudentHub final `decisionConfidence`. The canonical decision confidence remains
produced by the existing deterministic policy/assurance path. Numeric source
agreement is preserved as a bounded scalar in the canonical projection.

## 15. Evidence model mapping

`canonicalTrustProjection.js` emits bounded evidence records with the required
fields where present: `id`, `caseId`, `layer`, `origin`, `type`, `claim`,
`observation`, `source`, `provider`, `retrievedAt`, `provenance`,
`reliabilityMetadata`, `limitations`, `rawReference`, and `status`.

Layer 1 signals, Layer 2 provider observations, Layer 3 evidence/source
records, and Layer 4 research/synthesis records are projected from actual
normalized data. Missing evidence remains missing. Unverified provider claims
carry limitations rather than being upgraded to evidence proof.

## 16. Source provenance/origin mapping

The projection supports and uses explicit origins:

| Record | Origin |
| --- | --- |
| Local security signals and candidate claims | `LAYER_1_INTERNAL` |
| Layer 2 provider observations | `LAYER_2_PROVIDER` |
| Layer 3 web evidence and sources | `LAYER_3_WEB_EVIDENCE` |
| Layer 4 independent research and synthesis | `LAYER_4_INDEPENDENT_RESEARCH` |
| Community observations | `COMMUNITY` (existing contract) |
| Expert assessments | `EXPERT` (existing contract) |

Layer 3 and Layer 4 records are not merged. Origin is a data field, not a title
prefix or visual inference.

## 17. TrustGraph integration

TrustGraph receives the canonical projection when it is present. Nodes are
created only for the actual input, normalized claims, and normalized evidence
source records. Edges are emitted only when both endpoint records exist and the
relationship is known.

No decorative related-case, placeholder-source, or index-only nodes are added.
If a source has no claim linkage, its relationship is limited to the actual input
reporting relationship. This intentionally avoids inventing a Layer 3 → Layer 4
visual relationship that the returned data does not establish.

## 18. Passport integration

The canonical run builds append-only Passport event descriptors for meaningful
stage transitions, provider partial/unavailable states, evidence additions, and
verdict composition. Existing Passport history semantics are not overwritten.

Anonymous `POST /api/v1/trust` runs do not possess an authenticated case owner
and exact revision scope. Therefore the projection is explicitly:

```text
persistenceStatus: NOT_PERSISTED
appendOnly: true
caseId: null
revision: null
```

This is a representable event projection, not a persistence success claim. A
future authenticated case flow must call the existing Passport provider with
case/revision authorization and append-only server enforcement.

## 19. Community boundary

Community remains a separate Student Collective Intelligence pillar. Community
observations, volume, votes, and corroboration do not mutate the canonical
Trust verdict directly. Existing `COMMUNITY` provenance and privacy projection
remain unchanged.

The four-layer adapter does not treat Community as Layer 3/4 evidence and does
not promote a community observation into official truth.

## 20. Expert boundary

Expert remains scoped escalation/authority, not a new Layer 5 and not a global
truth seal. Existing scope, credentials, evidence-reviewed IDs, limitations,
and disagreement semantics remain the governing contract.

The four-layer adapter does not grant expert authority, inject expert data into
the legacy provider payload, or allow an expert assessment to bypass Trust
policy.

## 21. Supabase persistence

No Supabase schema, RLS policy, or unauthenticated write was introduced by this
phase. Canonical legacy DTOs are not stored as the primary database model. The
existing Supabase/PostgreSQL boundary remains the owner of durable cases,
normalized evidence, revisions, and Passport events when an authorized
case/revision flow is available.

The live RLS contract suite passes its static/migration checks, but execution
against a real disposable PostgreSQL/Supabase database was not possible because
`STUDENTHUB_RLS_TEST_DATABASE_URL` is not configured.

## 22. Demo/Live/Unavailable

The canonical route remains a `LIVE` StudentHub-owned pipeline by default; that
does not imply that an external reference provider is configured. The legacy
adapter reports configuration state independently and is disabled without a
valid server-only base URL.

The following rules are enforced and tested:

- explicit demo mode is still the only way to use demo fixtures;
- an unavailable/malformed/timeout legacy dependency remains unavailable or
  unknown;
- no remote outage injects DemoProvider data;
- no provider completion is emitted before the provider response is validated;
- no-match is not safe and unavailable is not safe.

## 23. Security/SSRF/prompt injection

The adapter applies the existing `SafeRemoteUrl` static and optional DNS
validation before calling the configured base. Loopback, private, link-local,
metadata, local, and invalid targets fail closed. It also enforces bounded
request content, response content length/bytes, JSON content type, timeout,
abort, request ID, and redirect rejection.

Fetched or provider-returned text is untrusted data. It is normalized as data,
not trusted instructions. Existing AI Gateway and Layer 2B/Layer 3 prompt
injection boundaries remain active; this phase does not permit legacy provider
text to override policy or tool permissions.

The adapter does not itself fetch arbitrary submitted webpages. If the reference
backend performs web retrieval, its own SSRF/egress controls still require live
deployment verification.

## 24. Tests

Added:

- `frontend/tests/integration/legacy_verification_adapter.test.mjs` — 14 test
  cases covering Layer 2 SAFE/no-match, dangerous, unknown, outage;
  Layer 3 TRUE/FALSE/UNKNOWN, continuation contradiction/malformed payload;
  Layer 4 TRUE/FALSE/UNKNOWN, contradiction/source handling; non-JSON and
  oversized response rejection; timeout; SSRF fail-closed; no demo fallback;
  Passport/graph projections; and confidence separation.
- `frontend/tests/integration/trust_orchestrator_legacy.test.mjs` — 3
  orchestration cases covering canonical L2/L3/L4 execution, server-side
  continuation stop, optional Layer 4 outage, deterministic policy retention,
  and canonical projections.

Final local test evidence:

| Gate | Result |
| --- | --- |
| Targeted adapter tests | 14/14 pass |
| Targeted orchestrator tests | 3/3 pass |
| Full discovered suite | 267/267 files pass |
| RLS/migration contract suite | 5/5 pass |
| Live RLS suite | `BLOCKED_BY_DATABASE_ENV` |
| Dependency audit | 0 vulnerabilities |
| `git diff --check` | No whitespace errors; line-ending warnings only |

The required semantic cases are covered without treating fixture execution as
remote backend proof.

## 25. Browser regression

The existing Playwright fallback was run against the canonical local app after
the integration implementation. The prescribed `agent-browser` executable is
not installed in this environment, so its gate is `BLOCKED_BY_ENV`; no pass was
fabricated.

- Chromium: 70 collected, 67 passed, 3 explicit demo tests skipped by test
  policy.
- WebKit: 64/64 executed passed; 6 intentional visual/demo skips.
- Mobile Chromium: 27/27 passed.
- Firefox: `BLOCKED_BY_ENV`; the installed Firefox executable failed with
  `browserType.launch: spawn UNKNOWN`.

Because the legacy base URL was not configured, these browser runs verify that
the canonical UI and local pipeline do not regress when the optional adapter is
disabled. They do not verify remote provider connectivity.

## 26. Accessibility

Chromium and WebKit accessibility paths reported zero serious or critical Axe
violations on the tested core routes and Trust states. Existing keyboard,
responsive, state, and reduced-motion checks remained green. The missing
`agent-browser` binary is an environment limitation and does not change the
Axe result already produced by the repository's Playwright checks.

## 27. Build

`npm run build` passed on Next.js 16.3.0/Turbopack. TypeScript completed with
zero errors and static generation completed `117/117` pages.

`npx tsc --noEmit --pretty false` from `frontend/` also passed with zero output.

## 28. Bundle

`npm run audit:bundle` passed without a budget change:

| Route | Initial JS | Budget |
| --- | ---: | ---: |
| `/trust` | 334,180 bytes | 500,000 bytes |
| `/community` | 334,165 bytes | 500,000 bytes |
| `/expert` | 334,192 bytes | 500,000 bytes |

These numbers exactly match the pre-4-layer golden baseline. The adapter is
server-only and did not increase the measured client route bundles.

## 29. Files changed

Integration-owned files for this phase:

- `frontend/src/lib/ai-trust/integrations/legacyVerification/config.js`
- `frontend/src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js`
- `frontend/src/lib/ai-trust/integrations/canonicalTrustProjection.js`
- `frontend/src/lib/ai-trust/TrustOrchestrator.js`
- `frontend/src/lib/ai-trust/v5/TrustPipelineOrchestrator.js`
- `frontend/src/lib/ai-trust/v5/stageAdapters.js`
- `frontend/src/lib/ai-trust/v5/contracts.js`
- `frontend/src/app/api/v1/trust/route.js`
- `frontend/src/components/trust/AiTrustStudioView.jsx`
- `frontend/.env.local.example`
- `docs/contracts/API_CONTRACTS.md`
- `docs/contracts/BACKEND_ADAPTER_SPEC.md`
- `frontend/tests/integration/legacy_verification_adapter.test.mjs`
- `frontend/tests/integration/trust_orchestrator_legacy.test.mjs`

The shared worktree contains unrelated prior product, visual, documentation,
and regression changes. They were preserved and are not reattributed to this
phase without a clean revision boundary.

## 30. Commands run

Successful local commands included:

```text
npx eslint src/lib/ai-trust/integrations/canonicalTrustProjection.js tests/integration/legacy_verification_adapter.test.mjs tests/integration/trust_orchestrator_legacy.test.mjs
npx tsc --noEmit --pretty false                         # frontend
npm run lint                                             # 0 errors, 332 warnings
npm run test:all-discovered                              # 267/267
npm run test:phase3-contract                             # 5/5
npm run build                                            # 117/117 pages
npm run audit:api-auth                                   # 137 handlers inventoried
npm run audit:bundle                                     # PASS; three route budgets
npm audit --omit=dev --audit-level=high                   # 0 vulnerabilities
git diff --check                                         # no whitespace errors
```

The live database command was run and intentionally recorded its actual result:

```text
npm run test:phase3-live
BLOCKED_BY_DATABASE_ENV: STUDENTHUB_RLS_TEST_DATABASE_URL is required
exit code 2
```

Targeted Playwright project commands were also run for Chromium, WebKit,
mobile Chromium, and Firefox as documented in section 25.

## 31. Environment blockers

The following gates remain environment-blocked or unavailable:

- `agent-browser` is not installed, so the repository's prescribed browser
  verification skill could not execute its preferred binary;
- Firefox Playwright launch fails with Windows `spawn UNKNOWN` for the installed
  browser executable;
- no `STUDENTHUB_LEGACY_VERIFICATION_BASE_URL` or alias is configured;
- no approved live reference provider credentials/configuration are present;
- no `STUDENTHUB_RLS_TEST_DATABASE_URL` is configured;
- staging deployment, production CSP/media delivery, Core Web Vitals, and
  device/GPU telemetry were not executed.

These are not lowered acceptance criteria. They are explicit blockers to live
assurance.

## 32. Live reference backend blockers

No safe availability/contract probe could run because the reference base URL is
absent. Consequently the following remain unverified:

- actual HTTP status/error behavior of all three reference endpoints;
- deployed request/response schema compatibility beyond local fixtures;
- server-side connectivity, proxy, TLS, and CORS/deployment behavior;
- provider statuses and real Gemini/Groq model behavior;
- remote Layer 3 retrieval provenance and SSRF/redirect controls;
- timeout behavior under the deployed service;
- remote auth, rate limiting, observability, and rollout/rollback behavior.

The local adapter tests prove the anti-corruption boundary and failure handling;
they do not prove the remote service exists or is healthy.

## 33. Remaining risks

The next live gate must validate the actual legacy response variants, especially
optional fields, HTTP error bodies, source fingerprints, source agreement types,
continuation combinations, and provider-specific status values.

Passport persistence is intentionally not wired into anonymous canonical Trust
runs. A future persistence step must provide authenticated case ownership,
revision concurrency, idempotency, privacy retention, and append-only RLS proof.

If the reference backend itself retrieves web content, its egress policy must be
audited independently; the adapter's URL boundary cannot certify another
service's internal fetcher.

The shared dirty worktree lacks a clean per-agent revision boundary, so change
attribution remains weaker than a reviewable merge commit. Existing full lint
warnings also remain, although no lint errors were introduced by the integration
files.

## 34. Recommended next gate

Provision a disposable, approved reference backend and a disposable PostgreSQL/
Supabase RLS environment. Configure only server-side test variables, then:

1. Run a safe HTTP/schema/error/timeout probe through the canonical
   `POST /api/v1/trust` route, never from browser code.
2. Exercise every L2/L3/L4 verdict, continuation, source-origin, and outage
   case against the deployed service.
3. Run live RLS/Passport owner and revision tests with clean data.
4. Re-run the full pre-4-layer browser, accessibility, bundle, and performance
   matrix and compare against the immutable baseline artifact.
5. Resolve Firefox/`agent-browser` environment failures and complete staging
   security/deployment review before RC assurance.

Until those environment gates execute, retain:

`4_LAYER_INTEGRATION_COMPLETE_WITH_ENV_BLOCKERS`

No `POST_INTEGRATION_REGRESSION` was found in the local gates run for this
phase, and the pre-4-layer golden baseline remains unchanged.
