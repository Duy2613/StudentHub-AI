# StudentHub AI — Luna Max Post-4-Layer Integration Regression Report

**Date:** 2026-09-01  
**Authority:** Luna Max  
**Scope:** Independent regression and assurance after four-layer backend compatibility integration  
**Golden baseline:** `docs/reports/LUNA_POST_ANTIGRAVITY_REGRESSION_REPORT.md`

## 1. Final status

`POST_4_LAYER_REGRESSION_COMPLETE_WITH_ENV_BLOCKERS`

The local post-integration regression is complete. Confirmed integration regressions were fixed and the final local gates pass. Reference-backend, Supabase/RLS, Firefox, `agent-browser`, staging, and field-performance evidence remain environment-blocked or unverified. This report makes no live, deployment, or Final RC claim.

## 2. Executive summary

The immutable pre-4-layer golden baseline was verified before and after the audit. The current repository still accounts for 39 page routes, preserves the canonical Trust pipeline, and retains the baseline browser, build, type, accessibility, and bundle results.

The audit found four integration-owned `POST_INTEGRATION_REGRESSION` conditions: sensitive URL query disclosure at the direct legacy Layer 2 boundary, unsupported Layer 3 truth promotion, implicit Layer 3-unavailable continuation, and cross-layer evidence/TrustGraph ID collisions. All four were corrected and covered by regression tests. The final discovered suite passes `267/267` files.

## 3. Golden baseline hash verification

The baseline report was treated as immutable and was not edited, overwritten, or reinterpreted.

| Artifact | Bytes | SHA-256 | Result |
| --- | ---: | --- | --- |
| `docs/reports/LUNA_POST_ANTIGRAVITY_REGRESSION_REPORT.md` | 27,569 | `97770E16D180D6963733627D6FAA9D7CBA4AC64435730C32B55284D546A59169` | **UNCHANGED** |
| `docs/reports/LUNA_4_LAYER_BACKEND_INTEGRATION_REPORT.md` | 26,791 | `D0B1A8AD8BEDAA5A7DC6A5BA24288A4D3BA11CE9A8C38C626AD4710125800A32` | Compared as historical integration evidence |

The baseline hash was checked after all source and test changes and remains identical.

## 4. Integration report claims vs independently verified reality

| Historical claim | Independent result |
| --- | --- |
| Canonical Trust entry remains `POST /api/v1/trust` | **VERIFIED**; browser and route tests still use the canonical entrypoint |
| Four-layer calls are server-side and adapter-owned | **VERIFIED** by route/import audit; no client import reaches the legacy adapter |
| Layer 3 and Layer 4 origins remain separate | **PARTIALLY VERIFIED, THEN FIXED**; same-ID records could previously collide in canonical projection/graph; origin-scoped IDs now preserve both |
| Legacy verdicts cannot override deterministic StudentHub policy | **VERIFIED** by orchestrator and Layer 4 policy tests |
| Adapter suite had 14 cases | Historical count at report creation; current regression suite is `20/20` after adding independent regression coverage |
| Remote backend integration is complete | **NOT PROVEN**; the base URL and live provider credentials are absent |
| No regressions exist | **Not accepted without independent audit**; four local `POST_INTEGRATION_REGRESSION` findings were fixed before final status |

The historical report remains evidence of the earlier phase; this report is the independent post-integration verdict.

## 5. Change-scope audit

The worktree is shared and already dirty from earlier Luna/visual/product work. No clean Antigravity or integration commit boundary exists, so unrelated changes are not reattributed.

This audit directly changed only the legacy adapter, canonical projection, integration test coverage, and this report. No route, database schema, RLS policy, backend service, package dependency, visual asset, or client API contract was changed by the regression fixes. No reset, checkout, commit, push, merge, deploy, or destructive cleanup was performed.

## 6. Legacy adapter regression

The server-only `LegacyVerificationAdapter` was independently exercised across transport, schema, semantic, security, and cancellation cases.

- Layer 2 maps `SAFE`/no-match to `NO_KNOWN_THREAT`, `DANGEROUS` to `THREAT_MATCH`, and `UNKNOWN` to `UNKNOWN`; no-match remains explicitly non-proof of safety.
- Sensitive URL query and fragment material is redacted before the provider boundary; fingerprints use the disclosed URL, not the original secret-bearing URL.
- Private, metadata, loopback, local, and SSRF-sensitive targets fail closed without a provider call.
- Request IDs, bounded JSON, content type, body/response limits, timeout, abort, redirect rejection, and typed HTTP/error states are preserved.
- Malformed Layer 2, Layer 3, and Layer 4 responses are discarded as contract failures and never become positive evidence.
- Caller cancellation propagates as `AbortError`; timeout is not retried by the adapter and does not substitute demo data.

The focused adapter suite passes `20/20`.

## 7. TrustOrchestrator regression

`TrustOrchestrator` remains a thin server-side facade over the existing V5 `TrustPipelineOrchestrator`. The canonical sequence remains L1 → L2A → L2B → L2C → L3 → L4 → L5.

Legacy Layer 2 is injected as the L2A provider port, Layer 3 is invoked through the adapter, and Layer 4 legacy synthesis is called only after local deterministic policy execution and validated Layer 3 continuation. The legacy Layer 4 result is advisory metadata; the StudentHub deterministic result and downgrade-only assurance remain authoritative.

The focused orchestrator suite passes `3/3`, including complete execution, continuation stop, Layer 4 outage, local policy retention, graph, and Passport projection checks.

## 8. Continuation policy

Continuation is server-controlled and fail-closed.

- `stop: true` with `canContinueToLayer4: true` is rejected as a contract contradiction.
- Explicit `canContinueToLayer4: false` skips legacy Layer 4 and does not become a pass.
- A Layer 3 transport, schema, timeout, or configuration failure sets continuation to false.
- An omitted continuation on a raw `UNAVAILABLE` Layer 3 verdict now defaults to false; an explicit valid continuation remains an explicit provider instruction, not an inferred pass.
- At most one orchestrator retry is allowed for transient L2A/L3 work. Legacy adapter calls themselves do not retry, and Layer 4 has no retry loop.

## 9. Legacy verdict normalization

Legacy security and truth vocabularies remain separate. Layer 2 `SAFE` is a threat-lookup observation, Layer 3 `TRUE` is a provider claim, and Layer 4 model output is an independent candidate assessment. None is copied into the final StudentHub decision without the existing deterministic policy.

Layer 3 `TRUE`/`SUPPORTED` becomes `VERIFIED` only when evidence records carry the required live retrieval, success, and source-fingerprint markers. Without evidence it becomes `INSUFFICIENT_EVIDENCE`; with unverified records it remains partial. False/contradicted/mixed outcomes retain contested semantics only when evidence supports that conclusion. Raw verdicts remain available as bounded legacy metadata.

## 10. Confidence normalization

Legacy confidence is accepted only as a finite number in `[0, 1]` and is retained under its own meaning:

- Layer 2 provider confidence;
- Layer 3 legacy assessment confidence;
- Layer 4 assessment confidence.

These values are not safety probability, evidence confidence, source agreement, or StudentHub decision confidence. Numeric source agreement is bounded without changing its type; invalid numeric values are rejected or represented as unknown.

## 11. Evidence normalization

Canonical evidence is built only from normalized Layer 1 signals, Layer 2 provider observations, Layer 3 evidence/source records, and Layer 4 research/assessment records. Records are bounded and carry layer, origin, source, provider, provenance, status, limitations, and raw reference where available.

Provider assertions without independently verifiable live markers retain limitations. `externalEvidence` is false when the legacy response merely asserts external evidence. Layer 4 model assessment is explicitly marked as candidate assessment and cannot be used as evidence or safety probability.

## 12. Source provenance

The canonical origins remain:

- `LAYER_1_INTERNAL`
- `LAYER_2_PROVIDER`
- `LAYER_3_WEB_EVIDENCE`
- `LAYER_4_INDEPENDENT_RESEARCH`
- `COMMUNITY`
- `EXPERT`

The regression fix scopes canonical Layer 3 IDs with `l3:` and Layer 4 IDs with `l4:`. TrustGraph source node IDs include the canonical origin, while `rawReference` preserves the upstream identifier. Identical URLs and identifiers from Layer 3 and Layer 4 now remain two records with two origins and two graph nodes.

## 13. Trust decision semantics

The deterministic Layer 4 policy remains the source of final security, truth, enforcement, and action. Hard negatives from local security or threat intelligence remain authoritative. A no-match cannot clear a local block; a true claim cannot make a dangerous URL safe; provider success cannot become final Trust success; and model confidence cannot override policy.

The final response continues to expose risk, truth, action, decision confidence, evidence coverage, source agreement, and unresolved signals as separate axes. Existing sequential Trust and Layer 4 boundary tests pass.

## 14. Progressive states

Stage envelopes continue to distinguish `RUNNING`, `COMPLETED`, `PARTIAL`, `FAILED`, `BLOCKED`, `SKIPPED`, and `CANCELLED` operational outcomes from domain meanings such as `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`, and `UNAVAILABLE`.

SSE and JSON responses use the same canonical pipeline result. A partial or unavailable provider is disclosed in stage status and limitations; it is not rendered as safe, complete, or demo data. Existing UI state, failure, schema mismatch, and stale-run tests remain green.

## 15. Demo/Live boundary

The canonical Trust route remains `LIVE` StudentHub execution with `demo: false`. The legacy adapter is disabled unless an approved server-side base URL is configured. Demo fixtures are available only through explicit demo configuration and remain visibly labelled.

Local provider outage, timeout, malformed payload, and absent configuration paths produce typed unavailable/unknown states. No legacy failure path imports `DemoProvider`, and no live request is silently converted into a demo result.

## 16. Reference backend configuration

The adapter accepts only server environment configuration:

- `STUDENTHUB_LEGACY_VERIFICATION_BASE_URL` (preferred)
- `LEGACY_VERIFICATION_BASE_URL` (fallback)
- `STUDENTHUB_LEGACY_VERIFICATION_TIMEOUT_MS`
- `STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS`

The current environment reports `enabled: false`, `configured: false`, and `configError: NOT_CONFIGURED`. The approved paths remain `/api/verify/layer2`, `/api/verify/layer3`, and `/api/verify/layer4`. No live availability or schema probe was possible.

## 17. SSRF boundary

The adapter validates its configured base with the existing `SafeRemoteUrl` boundary and optional DNS resolution immediately before fetch. Unsupported schemes, credentials, loopback, private, link-local, metadata, local, and invalid targets fail closed. Fetch uses `redirect: "error"`; no redirect hop is accepted by the adapter.

Submitted candidate source URLs are bounded and normalized as data. The adapter does not certify the reference service's own internal crawler, egress policy, DNS behavior, or redirect handling; those remain live deployment checks.

## 18. Prompt-injection boundary

Legacy reasons, excerpts, claims, source titles, model identifiers, and contradictions are treated as untrusted data. They are bounded, normalized, and passed through canonical policy/projection fields; no provider text grants tools, permissions, authority, or a final verdict. Existing trusted-instruction separation and Layer 2B/Layer 3 prompt-injection tests pass.

No remote provider prompt-injection run was executed because the reference backend is not configured. This is an environment limitation, not a fabricated pass.

## 19. TrustGraph

TrustGraph is built from the actual input, normalized claims, and normalized evidence sources. Decorative or index-only nodes are not added. Edges are emitted only when both endpoint records exist and the relationship is known.

The origin-scoped source node fix prevents Layer 3 and Layer 4 records with the same source ID or URL from being collapsed. The focused projection test verifies two evidence records, two origins, two source nodes, distinct IDs, and preserved raw references.

## 20. Evidence Passport

The canonical projection remains append-only and explicitly reports `persistenceStatus: NOT_PERSISTED` for anonymous Trust runs without authenticated case ownership and revision scope. Stage transitions, provider-unavailable events, evidence additions, and composed verdict descriptors remain representable without claiming durable persistence.

Existing Passport tests continue to enforce immutable history, revision ordering, provenance, no demo evidence in live history, and no Community-only resolution authority. No Passport schema or persistence path was changed by this audit.

## 21. Community boundary

Community remains a separate observation and corroboration pillar. Volume, votes, consensus, and experience frequency do not become Trust truth or official policy. The four-layer adapter neither imports Community observations as Layer 3/4 evidence nor mutates a Community record.

Existing Community provenance, privacy, astroturfing, contradiction, and observation-not-truth tests pass in the final discovered suite.

## 22. Expert boundary

Expert remains scoped escalation, not a universal truth seal or a new layer. Scope, credentials, evidence reviewed, confidence, limitations, disagreement, and time context remain explicit. The adapter does not grant global authority or inject Expert output into legacy verification.

Existing Expert scope, empty-claim, identity, assessment, and failure-boundary tests pass.

## 23. Frontend regression

The integration changes remain server/adaptor-owned. Client Trust code continues to call the canonical same-origin Trust endpoint and does not call legacy endpoints directly. Production compilation still completes and the existing Trust, Community, Expert, navigation, state, and error surfaces remain operational in the browser matrix.

No visual redesign, advanced Trust redesign, new feature, new route, or client-side provider orchestration was added during this regression audit.

## 24. Responsive

The final mobile Chromium project passes `27/27`. The baseline responsive coverage at 360×800, 390×844, 768×1024, 1280×800, 1440×900, 1920×1080, plus extended 320×900 and 768×900 surfaces remains intact. No horizontal overflow or shell landmark regression was observed in the rerun.

## 25. Accessibility

Chromium and WebKit accessibility paths report zero serious or critical Axe violations on the tested core routes and Trust states. Keyboard, focus, state semantics, labels, landmarks, and reduced-motion checks remain covered by the existing browser suite.

The prescribed `agent-browser` binary is absent from `PATH`, so its result is `BLOCKED_BY_ENV`; no pass is claimed for that tool.

## 26. Browsers

| Project | Result |
| --- | --- |
| Chromium | `67 passed`, `3 skipped`, 70 collected |
| WebKit | `64 passed`, `6 skipped`, 70 collected |
| Mobile Chromium | `27 passed` |
| Firefox | `66 failed`, `3 skipped`, `1 passed`; `browserType.launch: spawn UNKNOWN` for the installed Firefox executable |
| `agent-browser` | `BLOCKED_BY_ENV`; binary not found |

The Chromium, WebKit, and mobile results are local regression evidence. Firefox is an environment launch failure, not a product pass or product regression classification.

## 27. Bundle

`npm run audit:bundle` passes without a budget change:

| Route | Initial JS | Budget |
| --- | ---: | ---: |
| `/trust` | 334,180 bytes | 500,000 bytes |
| `/community` | 334,165 bytes | 500,000 bytes |
| `/expert` | 334,192 bytes | 500,000 bytes |

All three measured routes are now gated by the audit script, and the values exactly match the golden baseline. The server-only adapter did not increase client route bundles.

## 28. Dependencies

The authoritative package-owning command `npm audit --omit=dev --audit-level=high` from `frontend/` reports `0 vulnerabilities`. No dependency or lockfile change was made by this regression audit.

The root workspace does not own the frontend TypeScript/compiler dependency or a usable root audit virtual tree; root-level attempts were not used as quality conclusions.

## 29. Static tests

| Gate | Result |
| --- | --- |
| TypeScript (`frontend/`) | **PASS**, 0 errors |
| ESLint | **PASS WITH WARNINGS**, 0 errors / 332 warnings |
| Discovered tests | **PASS**, `267/267` files |
| Production build | **PASS**, `117/117` pages |
| API authorization inventory | **PASS**, 137 handlers inventoried |
| RLS/migration contract | **PASS**, `5/5` |
| `git diff --check` | **PASS**, no whitespace errors; line-ending warnings only |

One post-change discovered run exposed a transient unrelated file-adapter failure in `repository_persistence.test.mjs` (`1 !== 2`). The test passed immediately when isolated and the subsequent complete discovered rerun passed `267/267`; no touched integration file participates in that repository path. This is retained as a test-isolation risk, not hidden as a pass.

## 30. New integration test matrix

| Coverage | Result |
| --- | --- |
| Legacy adapter focused suite | `20/20` |
| Legacy orchestrator focused suite | `3/3` |
| Sensitive URL disclosure redaction | Pass; secret query not sent |
| Malformed Layer 2 response | Pass; typed invalid response / unknown finding |
| Layer 3 TRUE without evidence | Pass; insufficient evidence, no external proof |
| Layer 3 unavailable without continuation | Pass; no automatic Layer 4 continuation |
| Caller cancellation and timeout | Pass; abort propagates, timeout calls provider once |
| Layer 3/4 same-ID and same-URL provenance | Pass; both origins and graph nodes preserved |
| Layer 4 outage and deterministic policy retention | Pass |
| Full discovered regression | `267/267` |

## 31. Runtime/console

The final Chromium/WebKit browser runs completed without unexpected page exceptions, hydration failures, unhandled core resource failures, or horizontal-overflow failures in the tested paths. The known OCR worker fallback emits an `[OCR Worker Notice]: Error` while retaining the client-hint boundary; the related flow passes and this notice is not treated as authoritative evidence.

Signed-out authentication 401s, intentional request cancellation during rapid navigation, and unavailable-provider states remain expected typed boundaries.

## 32. Retry behavior

The adapter has no hidden retry loop. The V5 orchestrator caps retries at one for transient L2A/L3 stages, records attempts, and never retries deterministic L1 or legacy Layer 4 synthesis. The timeout test records exactly one provider invocation and no demo substitution.

Provider retryability is separate from domain meaning: a retryable transport failure remains unavailable/unknown until a validated response exists.

## 33. stale/cancelled request behavior

The V5 orchestrator aborts the active run when a new run starts, checks the active signal before and after stage work, and publishes cancellation rather than a stale result. The adapter propagates caller aborts as control flow. Existing `CANCELLATION_AND_STALE_RUNS_ARE_NOT_PUBLISHED` coverage passes, and the new direct adapter cancellation test passes.

No legacy provider response can overwrite a later scan through the canonical run boundary.

## 34. Performance/provider call count

The client bundle remains at the golden baseline values. Server request and response payloads remain bounded at the configured adapter limits, timeout is bounded to the approved range, and the normal path has at most one call per legacy layer plus the existing single transient retry policy for L2A/L3.

Real provider latency, throughput, memory, Core Web Vitals, GPU behavior, and deployed egress performance were not measured because the live backend and staging environment are unavailable.

## 35. Golden baseline comparison table

| Metric | Pre-4-layer golden baseline | Post-integration final audit | Verdict |
| --- | --- | --- | --- |
| Page routes | 39 accounted for | 39 page files accounted for | **NO REGRESSION** |
| Discovered test files | 265/265 | 267/267; two integration files are now included | **PASS; +2 intentional coverage files** |
| Chromium | 67 passed; 3 demo skips | 67 passed; 3 skips | **NO REGRESSION** |
| WebKit | 64/64 executed; 6 skips | 64 passed; 6 skips | **NO REGRESSION** |
| Mobile Chromium | 27/27 | 27/27 | **NO REGRESSION** |
| TypeScript | 0 errors | 0 errors | **NO REGRESSION** |
| ESLint | 0 errors / 332 warnings | 0 errors / 332 warnings | **NO REGRESSION** |
| Production pages | 117/117 | 117/117 | **NO REGRESSION** |
| Axe serious/critical | 0 | 0 | **NO REGRESSION** |
| `/trust` initial JS | 334,180 bytes | 334,180 bytes | **NO REGRESSION** |
| `/community` initial JS | 334,165 bytes | 334,165 bytes | **NO REGRESSION** |
| `/expert` initial JS | 334,192 bytes | 334,192 bytes | **NO REGRESSION** |
| Dependency vulnerabilities | 0 | 0 | **NO REGRESSION** |
| Trust/Graph/Passport semantics | Verified | Verified after four fixes | **PASS** |
| Community observation boundary | Verified | Verified | **PASS** |
| Expert scope boundary | Verified | Verified | **PASS** |

The temporary defects found during the audit were classified as `POST_INTEGRATION_REGRESSION`, fixed, and rechecked. The baseline was not lowered.

## 36. Files changed

Audit-owned source/test changes:

- `frontend/src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js`
- `frontend/src/lib/ai-trust/integrations/canonicalTrustProjection.js`
- `frontend/tests/integration/legacy_verification_adapter.test.mjs`
- `docs/reports/LUNA_POST_4_LAYER_REGRESSION_REPORT.md`

Earlier four-layer integration files, product files, visual files, docs, and the standalone prototype remain in the shared worktree as pre-existing context and are not reattributed by this report.

## 37. Commands run

Authoritative commands included:

```text
node --test frontend/tests/integration/legacy_verification_adapter.test.mjs
node --test frontend/tests/integration/trust_orchestrator_legacy.test.mjs
npm run test:all-discovered
npm run test:all-discovered -- frontend/tests/foundation/ui-state-model.test.mjs
npm run lint
npx eslint src/lib/ai-trust/integrations/canonicalTrustProjection.js src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js tests/integration/legacy_verification_adapter.test.mjs
npx tsc --noEmit --pretty false                         # from frontend/
npm run build
npm run audit:bundle
npm run audit:api-auth
npm audit --omit=dev --audit-level=high                   # from frontend/
npm run test:phase3-contract
npm run test:phase3-live
npx playwright test --project=chromium
npx playwright test --project=webkit
npx playwright test --project=mobile-chromium
npx playwright test --project=firefox
git diff --check
```

The browser projects were run without snapshot update mode. The final discovered run returned `267/267`.

## 38. Environment blockers

These gates remain open and are not converted into product passes:

- `agent-browser` is not installed or available on `PATH`;
- Firefox Playwright launch fails with Windows `spawn UNKNOWN`;
- `STUDENTHUB_LEGACY_VERIFICATION_BASE_URL` and its fallback are not configured;
- approved live reference-provider credentials and deployed endpoint behavior are unavailable;
- `STUDENTHUB_RLS_TEST_DATABASE_URL` is not configured, so live PostgreSQL/Supabase/RLS proof did not run;
- staging/deployment, production CSP/media delivery, Core Web Vitals, GPU telemetry, and device-level performance were not executed.

## 39. Remaining risks

- The reference backend's real response variants, auth, rate limits, latency, provenance, and internal retrieval safety remain unverified.
- The backend's own crawler/egress boundary requires an independent SSRF and redirect audit.
- Anonymous Trust Passport projection is intentionally not persistence proof; authenticated case/revision/RLS gates remain open.
- The shared dirty worktree weakens attribution until a clean reviewable revision boundary exists.
- Repository file-adapter test isolation has shown one transient failure and should be hardened separately; it is not caused by the four-layer files audited here.
- ESLint has 332 existing warnings despite zero errors; field performance is not equivalent to local build performance.

## 40. Live-gate readiness

**Local post-4-layer engineering regression:** complete.  
**Reference backend assurance:** blocked by environment.  
**Supabase/RLS assurance:** blocked by environment.  
**Browser assurance:** Chromium/WebKit/mobile pass; Firefox and `agent-browser` blocked.  
**Live/staging readiness:** not proven.  
**Final RC approval:** not granted.

## 41. Final acceptance statement

- [x] Golden baseline hash verified unchanged.
- [x] All 39 current page routes remain accounted for.
- [x] Canonical Trust API, server adapter boundary, deterministic policy, and demo/live isolation remain intact.
- [x] Layer 2/3/4 transport, normalization, evidence, provenance, graph, Passport, continuation, retry, cancellation, and failure semantics were independently audited.
- [x] Confirmed `POST_INTEGRATION_REGRESSION` findings were fixed and covered by tests.
- [x] Final discovered suite, typecheck, lint, build, bundle, dependency, API authorization, browser, responsive, and accessibility gates pass locally where executable.
- [ ] Live provider, Supabase/RLS, Firefox, `agent-browser`, staging deployment, CWV, GPU, and production egress/security gates remain open environment gates.

The final classification is `POST_4_LAYER_REGRESSION_COMPLETE_WITH_ENV_BLOCKERS`.

## 42. Next gate

Provision an approved disposable reference backend and PostgreSQL/Supabase RLS environment, then run the live contract/error/provenance/timeout matrix through `POST /api/v1/trust`. Re-run the full golden comparison with Firefox and `agent-browser`, validate authenticated Passport ownership/revision behavior, and collect staging security, CSP, egress, Core Web Vitals, GPU, and device traces.

Do not proceed to live assurance or Final RC approval until those environment-gated checks complete without baseline degradation.
