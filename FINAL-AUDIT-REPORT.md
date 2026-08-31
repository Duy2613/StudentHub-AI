# StudentHubAI Final Audit & Hardening Report

Audit date: 2026-08-30 16:04 (Asia/Bangkok)
Scope: current local `develop` worktree after Feature Freeze
Authority: `STUDENTHUBAI_LUNA_MAX_ULTIMATE_FULL_BUILD_MASTER_PROMPT.md` and the approved repository/design sources
Release posture: feature-frozen; surgical RC fixes pushed to `develop`; no merge to `main`

## 1. Executive summary

The final audit resumed from the protected checkpoint and completed the local P0/P1 hardening and release verification pass. The candidate has a coherent Trust → Community → Expert → Academic → Passport/Decision Twin → Command Center story, deterministic offline-safe demo paths, server-derived authority boundaries, bounded outbound integrations, and passing local build/security/browser checks.

All confirmed non-external P0/P1 findings found in this pass were fixed or covered by a typed fail-closed path. Production certification is still not claimed because live database/RLS, operator staging cases, fresh third-party providers, rollback control, and Windows Firefox parity are unavailable in this environment. The public Vercel preview and Linux browser CI are independently verified for the final head.

**Verdict: `PR2_READY_FOR_FINAL_REVIEW_WITH_EXTERNAL_LIMITATIONS`.**

## 2. Baseline protected

- Repository: `Duy2613/StudentHub-AI`.
- Actual checkout: local `develop`, `HEAD ad04de7980e26d6e3b1a68096ad97b0aea3be01b` (equal to `origin/develop`).
- PR #2 remains based on `main`; `origin/main` is unchanged at `251e7cb4a908c5a185be89a39301b294f9595dbf`.
- The final worktree is clean. RC closure fixes were kept surgical: `e4c75e1` (frontend-only CI install), `d2bb044`/`fbda772` (portable bundle budget resolver), and `ad04de7` (read-only ExpertStore fallback + focused regression test).
- A recoverable operator-local snapshot exists outside the repository with baseline status and a secret-scan-clean redacted tracked patch; it is not part of the release payload.
- The authoritative Obsidian vault, master prompt, current repository, design handoff, and historical Trust PDF were kept in their stated precedence order. Historical archives and credential files were not imported.

## 3. P0 issues found/fixed

- Public errors could expose internal exception text; `SecurityErrorEnvelope`, `SecurityFabric`, and audit logging now return bounded generic messages with `code`, `userMessage`, `requestId`, and `retryable` while keeping raw details server-side and redacted.
- SSRF and unsafe redirects were possible at outbound URL boundaries; `SafeRemoteUrl`, per-hop DNS checks, HTTPS/public-host checks, redirect caps, and response-size caps now guard retrieval, academic fetch, RSS, URLhaus, AI endpoints, and the backend proxy.
- Trust detail reads lacked a complete owner/privileged boundary; evaluations, claims, evidence, and audits now resolve through owner-bound store helpers and fail closed as not-found for another principal.
- Public projections could expose author/seller identifiers or trust scores; community, marketplace, safety-map, and professor-review reads now redact them while authenticated mutation responses return only the caller’s server-assigned reconciliation fields.
- Direct public post/comment read grants were too broad; the migration now removes blanket grants and exposes only the approved public columns while server repositories retain service-role access.
- Rate-limit maps and provider responses lacked hard memory/body bounds; bucket counts, cache sizes, prompt lengths, provider bodies, and request payloads are now capped and oldest entries evicted where applicable.
- Logs and external-link handling were hardened against bearer tokens, URLs, emails, and unsafe navigation leakage.

No confirmed non-external P0 remains open in the tested local surface. The live database and deployment claims remain explicitly unproven under section 34.

## 4. P1 issues found/fixed

- Synthetic Observatory metrics were made explicit (`LOCAL_SYNTHETIC_BENCHMARK`, `SYNTHETIC_FIXTURE`, `isAuthoritative:false`, cost `NOT_MEASURED`) instead of resembling live provider telemetry.
- Gateway/provider responses, semantic endpoints, retrieval bodies, and OCR/academic errors are bounded and schema-aware; provider failure becomes a typed degraded state rather than fabricated success.
- Browser-supplied Trust/Passport/Decision authority, provenance, status, and deterministic consequence fields are ignored or downgraded to server-controlled states.
- Academic source retrieval now validates authority and freshness boundaries and follows only bounded, revalidated redirects.
- RSS sync now validates configured URLs and bounds feeds/body size; malformed cookies fail closed; database pool size is clamped.
- The canonical API inventory, final-audit tests, and migration contract tests were added or refreshed to make these boundaries repeatable.

## 5. Security

The Security Fabric is the common boundary for authenticated and public handlers. It provides identity resolution, policy checks, rate/size limits, correlation IDs, safe error envelopes, and audit events. CORS is allowlisted, external URLs are restricted to HTTPS/public destinations, private/link-local/metadata IP ranges and credentials are rejected, and unsafe external links use safe navigation behavior. Upload and OCR paths validate type/size before parsing.

The remaining security debt is bounded: the CSP still includes `unsafe-inline` for existing runtime compatibility and needs a nonce/hash migration; this is tracked as P2, not hidden as a pass.

## 6. Auth/AuthZ

The generated inventory covers 135 handlers: 70 require authentication, 59 explicitly allow anonymous access, and 0 unprotected mutations require P0 review. Authenticated state is derived from the verified principal, not request body IDs. Trust artifacts are owner-bound; Passport/Decision mutations derive ownership and privileged fields on the server. Public read contracts are intentionally public only where their DTOs are non-sensitive. The inventory’s `contract conflict` markers are read-only public routes with inert permission metadata and are documented for cleanup, not treated as an authorization bypass for private data.

## 7. Database/RLS

Migration contract tests pass for constraints, RLS declarations, append-only/revision rules, owner binding, and public column projections. The audited migration removes blanket anon/authenticated reads of posts/comments and grants only approved public columns; service-role repositories handle private joins. Passport append concurrency uses row locking, unique revisions, and stale-revision rejection.

Live PostgreSQL/Supabase migration, RLS, restart, and connection-policy proof is **BLOCKED_BY_ENV** because `STUDENTHUB_RLS_TEST_DATABASE_URL` is not configured. It must not be inferred from the contract-only pass.

## 8. API contracts

Route inventory generation passes with 135 handlers. High-risk routes are wrapped by Security Fabric or the bounded service-only proxy, validate request shape/size, and return canonical safe errors. The catch-all proxy forwards only the allowlisted authentication contracts, validates `BACKEND_URL`, follows no unsafe redirects, and caps upstream response size. Invalid JSON and provider errors fail into stable typed responses.

## 9. Trust correctness

Trust remains a four-layer server-composed pipeline: live precheck, semantic analysis, evidence retrieval, and final verdict. Tests cover abstention, source independence, citation entailment, temporal conflict, counter-evidence, prompt-injection attempts, indirect tool payloads, invalid JSON/schema, provider degradation, race ordering, and print/result state. `UNKNOWN`, `NEEDS_LAYER3`, and insufficient-evidence outcomes remain visible; no browser field can manufacture `SAFE`.

## 10. Evidence/provenance

Official, community, expert, user-submitted, and synthetic evidence are distinct in the data model and UI. Evidence spans retain source references and extraction state; source freshness and authority are visible. Passport entries are server-stamped, revisioned, owner-bound, and cannot self-assign privileged provenance. Demo references use `demo://`/fixture labels and are rejected by live persistence boundaries.

## 11. AI Gateway

Capability routing is centralized through provider adapters with bounded prompts, timeouts, output bodies, API-key headers, schema validation, health/degraded states, and deterministic fallback where the contract permits it. Layer 2 now uses the gateway instead of a direct vendor call. The Observatory endpoint is admin-only and reports synthetic benchmark metadata, not live vendor quality.

## 12. Prompt injection

The Trust and AI security suites exercise direct instructions in evidence, indirect tool payloads, hostile source text, and authority-confusion attempts. Retrieved content is treated as untrusted evidence, not instructions; tools are allowlisted by the AI firewall; provider output is schema-validated and bounded. A source cannot promote itself to an authority or change a verdict policy.

## 13. Providers

Gemini/OpenAI-compatible adapters, semantic providers, retrieval clients, URLhaus, academic fetch, RSS, GitHub, and AI Drive paths have explicit endpoint/key/size/timeout handling and typed failure states. Live provider health, quotas, terms, latency, and output quality remain **BLOCKED_BY_PROVIDER** until fresh approved secrets and deployment policy are supplied. Historical configuration and credential archives were intentionally excluded.

## 14. RAG

Layer 3 prioritizes registered/known-good knowledge where available, records source metadata, validates fetched URLs and redirects, caps response bodies, and downgrades unverified or stale sources. Retrieval errors are generic to clients and do not become evidence. Custom test transports are injection points for deterministic tests only; production uses the guarded fetch path.

## 15. Cost/rate limiting

Request payloads, prompt lengths, provider bodies, feed caches, redirect hops, and in-memory rate-limit buckets have explicit caps. Rate-limit keys and windows are clamped and bucket memory is bounded with oldest-entry eviction. Local cost accounting is contract-safe, but live spend/latency/quota measurement is **BLOCKED_BY_PROVIDER** because no approved provider credentials are present.

## 16. Community

Community search, topic filters, reality-gap signals, moderation state, feedback, friction, consensus, safety reports, marketplace, reviews, and quests preserve provenance and public/private boundaries. Public DTOs exclude author IDs, seller IDs, and server trust scores; authenticated writes are server-stamped. UI copy explicitly says community volume is not truth, and fixture counts are not marketed as live prevalence.

## 17. Expert

Expert discovery and intelligence views expose scoped authority, evidence, credential provenance, disagreements, and resolution state. Profile and claim routes use redacted DTOs and safe failure envelopes. An expert assessment is not presented for an empty claim, and expertise in one domain cannot be silently generalized to all student decisions.

## 18. Academic

Academic 360 includes source watch, semantic diffs, student impact, deterministic eligibility, planner, roadmap, deadlines, tasks, execution reconciliation, notifications, profile freshness/conflict/versioning, and command center surfaces. Outputs expose source/cohort/version/freshness and deterministic bases. Official verification and live institutional freshness remain dependent on configured sources and are not faked by the demo fixtures.

## 19. Decision Twin

The Student Decision Twin records explicit factors, bases, assumptions, consequences, and review state. User-provided assumptions remain labeled as such; browser-supplied expert/Trust/deterministic provenance is rejected or downgraded. A decision requiring server evidence remains `REVIEW_REQUIRED` rather than claiming official certainty.

## 20. Evidence Passport

Passport create/read/append contracts are authenticated and owner-bound. Server-side policy stamps provenance, event type, status, revision, and references; user records begin at insufficient evidence. Unique revisions, row locking, and optimistic checks prevent lost updates. Cross-owner reads are indistinguishable from not-found to avoid enumeration.

## 21. Command Center

The personal dashboard consumes authenticated `dashboard.v1` data and provides a cross-pillar Next Clear Move, briefing, goals, devices, memory, and notifications. Signed-out state is explicit. Synthetic dashboard fixtures render only after explicit Demo Mode selection; there is no silent unauthenticated fallback.

## 22. Concurrency

Trust scan sequencing prevents late Scan A from overwriting Scan B, and slow evidence keeps completed layers visible. Passport appends use database locking/unique revision expectations; notification and academic workflow suites cover idempotency, restart, reconciliation, deduplication, completion-stop, and authorization. Live restart/RLS behavior awaits a real database environment.

## 23. Accessibility

Chromium core accessibility tests pass 6/6, including serious/critical axe checks on Trust, Community, Expert, Login, completed Trust, and keyboard navigation. Case Lab and Ultra accessibility checks pass; reduced-motion behavior is tested. Visible focus, labels, keyboard command palette behavior, and semantic failure states are retained.

## 24. Responsive

Chromium responsive tests pass across 360×800, 390×844, 768×1024, 1280×800, 1440×900, and 1920×1080. Mobile Chromium navigation/responsive is 13/13. WebKit non-visual tests pass 48/48 with 3 explicit demo skips. No horizontal overflow was observed in the core routes and Case Lab breakpoints.

## 25. Browser results

| Browser/project | Result | Notes |
| --- | --- | --- |
| Chromium | 51 passed, 3 skipped / 54 | Functional, accessibility, responsive, Trust, Ultra, and visual targets pass |
| WebKit | 48 passed, 3 skipped / 51 non-visual | Functional, accessibility, responsive, Trust, and Ultra pass |
| Mobile Chromium | 13/13 passed | Navigation, breakpoints, reduced motion |
| Firefox Linux (GitHub Actions) | PASS | Competition workflow completed Firefox browser gate successfully on the final head |
| Firefox Windows (local host) | BLOCKED | Environment-only `spawn UNKNOWN`/side-by-side failure before page assertions |

Firefox Linux is **PASS**; only local Windows parity remains **BLOCKED_BY_ENV**.

## 26. Performance

Production build completes with 115/115 routes generated. Bundle budget audit passes: Trust 379,110 bytes, Community 335,899 bytes, and Expert 337,882 bytes, each below the 500,000-byte route budget. Provider response and retrieval body caps reduce memory/latency abuse. The browser logs one non-blocking Three.js deprecation warning (`THREE.Clock`); it does not fail the tested route.

## 27. Visual QA

The three Chromium visual regression tests pass after refreshing stale snapshots whose dimensions reflected an older shell. The refreshed baselines were reviewed against the current frozen Margin shell, responsive layout, Trust input/result/graph, Community, and Expert surfaces. The change is a baseline correction for the current frozen UI, not a feature addition. WebKit visual snapshots were not claimed as a separate pass because the project has no established WebKit snapshot set.

## 28. UX

The user journey is coherent from evidence intake to action: `/cases` establishes provenance, Trust explains uncertainty, Community supplies lived context, Expert adds scoped judgment, Academic resolves deterministic constraints, Passport/Decision Twin preserve the evidence trail, and Command Center presents one next clear move. Typed recoverable errors, explicit Demo Mode, reduced-motion fallback, mobile navigation, and visible source states support judged and real use.

## 29. Dependencies/dead code

`npm audit --audit-level=high` and the production-only audit report zero known vulnerabilities. Lint exits 0 with 359 warnings and zero errors; warnings are predominantly legacy unused imports/variables and are not globally suppressed. The audit removed/disabled an obsolete Safety Map verification control and corrected the SOS registry/UI mismatch. Remaining dead-code and CSP cleanup are tracked as bounded post-RC debt.

## 30. Test totals

Observed local totals:

- Discovered regression suite: **252/252 test files passed**.
- Final audit hardening: **6/6**.
- Security: P0 regression **7/7**, attack simulation **10/10**, token/session **9/9**, AI firewall **3/3**, Security Fabric integration **8/8**.
- Auth phase 2: **9/9**; migration/RLS contract: **5/5**.
- Layer 2: **14/14**; Layer 3: **8/8**; Layer 4: **8/8**; threat intelligence: **6/6**.
- Chromium E2E: **51 passed + 3 skipped**; WebKit non-visual: **48 passed + 3 skipped**; mobile Chromium: **13/13**; visual target: **3/3**.
- Explicit Demo Mode Trust rehearsal: **3/3 passed** with `NEXT_PUBLIC_COMPETITION_DEMO=true`; fixtures remained offline and made zero Trust API calls.

## 31. Build/lint/typecheck

- `npx tsc --noEmit` from `frontend/`: PASS.
- `npm run build`: PASS; TypeScript validation and static generation **115/115**.
- `npm run lint`: PASS, exit 0; **359 warnings, 0 errors**.
- `npm run audit:bundle`: PASS.
- `npm run audit:api-auth`: PASS; 135 handlers inventoried, 0 unprotected mutations requiring P0 review.
- `git diff --check`: PASS; final worktree is clean after the surgical RC commits.
- GitHub Actions final head: push run [33302735122](https://github.com/Duy2613/StudentHub-AI/actions/runs/33302735122) and PR run [33302736663](https://github.com/Duy2613/StudentHub-AI/actions/runs/33302736663) completed `success`; all quality steps, Chromium, Firefox Linux, and artifact upload passed.
- Vercel status checks for `ad04de7` are `success` for both linked projects. The public preview target is [student-hub-ai-weje-git-develop-vi-be-city.vercel.app](https://student-hub-ai-weje-git-develop-vi-be-city.vercel.app); the duplicate [student-hub-ai-git-develop-vi-be-city.vercel.app](https://student-hub-ai-git-develop-vi-be-city.vercel.app) is Ready but SSO-protected.
- Final-head public preview smoke: core pages and all three Case Lab tabs returned `200`, non-empty UI, and no page errors; demo APIs returned deterministic `DEMO_FIXTURE` payloads; `/api/intelligence/health` and `/api/v1/search` returned 200 after the read-only filesystem fix; private canonical APIs returned `401 UNAUTHORIZED`.

## 32. Competition superflows

The three deterministic cross-system superflows are available through `/cases` and connect Trust, Community, Expert, Academic, Evidence Triangle, Passport, Decision Twin, and Command Center. Cases expose provenance and source state before interaction. The audited flow proves that provider outage, insufficient evidence, and invalid input remain explainable rather than becoming fictional success.

## 33. Demo Mode

Demo Mode is explicit and scoped to competition fixtures. Fixture labels (`DEMO_FIXTURE`, `SYNTHETIC_FIXTURE`, `LOCAL_SYNTHETIC_BENCHMARK`) remain visible; fixtures use non-network references and cannot be persisted as live authoritative records. The three Trust fixtures pass when the explicit demo flag is enabled (`3/3`, zero Trust API calls). The demo script in `docs/DEMO-SCRIPT.md` is the recommended 5–7 minute rehearsal. No historical credential/config bundle is used.

## 34. External blockers

1. **Database:** `STUDENTHUB_RLS_TEST_DATABASE_URL` is absent. `npm run test:phase3-live` reports `BLOCKED_BY_DATABASE_ENV`.
2. **Staging:** the approved Vercel preview origin is smoke-verified, but the official staging runner still reports `STAGING_E2E_BLOCKED_BY_ENV` because operator-owned `STUDENTHUB_STAGING_CASES_PATH` (and any required storage state) is absent.
3. **Providers:** fresh approved AI/search/OCR/institutional secrets, terms, quotas, and production network policy are absent; live health, grounding, and cost remain unverified.
4. **Deployment/rollback:** both Vercel preview deployments are Ready, but no disposable staging control plane, backup/snapshot, or safe rollback operation is available; the procedure is documented in `docs/ROLLBACK-REHEARSAL.md`.
5. **Firefox Windows parity:** the installed local Playwright Firefox binary cannot launch (`spawn UNKNOWN`/side-by-side configuration); the required Linux CI gate is green.

## 35. Release gate matrix

| Gate family | Status | Classification |
| --- | --- | --- |
| P0 security and authority boundaries | PASS | Local evidence and negative tests |
| P1 correctness, Trust, provenance, API, AI fallback | PASS | Local deterministic evidence |
| Authentication and owner isolation | PASS | Contract/runtime tests; live session DB still external |
| RLS/migration contract | PASS | SQL contract proof |
| Live RLS/restart/concurrency | BLOCKED | Environment: disposable database absent |
| API inventory and safe envelopes | PASS | 135-handler inventory and focused tests |
| Prompt injection/tool firewall | PASS | Adversarial and firewall suites |
| Provider reliability/grounding/cost | BLOCKED | Fresh secrets/terms/provider environment absent |
| Community/Expert/Academic contracts | PASS | Deterministic suites and UI flows |
| Passport/Decision Twin/Command Center | PASS | Owner/authority/workflow suites |
| Accessibility | PASS | Axe/keyboard suites |
| Responsive/mobile | PASS | Chromium/WebKit/mobile breakpoints |
| Chromium/WebKit browser coverage | PASS | See section 25 |
| Firefox Linux browser coverage | PASS | GitHub Actions final head |
| Firefox Windows parity | BLOCKED | Host runtime dependency |
| Visual regression | PASS | Chromium current baselines 3/3 |
| Build/typecheck/bundle | PASS | 115 routes and budgets |
| Dependency audit | PASS | 0 high-or-greater findings |
| Secret scan and clean delivery | PASS | No high-confidence secrets; accidental `.codex-temp`/`.github/skills` moved to recovery |
| Lint quality | PASS WITH WARNINGS | 0 errors, 359 legacy warnings |
| Staging case suite/deployment rollback | BLOCKED | Operator case file, DB/provider environment, and rollback control plane absent; Vercel preview smoke is PASS |

## 36. Remaining risks

- Live RLS and restart behavior could still reveal deployment-specific policy/configuration issues until proven against a disposable database.
- Third-party provider quality, terms, quota exhaustion, and cost are not represented by the synthetic Observatory.
- `unsafe-inline` CSP and 359 lint warnings are quality/security-debt items for the next hardening window.
- In-memory adapters are not durable production stores; deployment must use the approved repository/database configuration.
- Firefox Linux is verified in CI; only local Windows parity remains unverified until the host runtime is repaired.
- Registered external feeds can become stale or change terms; source freshness and authority must remain visible at runtime.

## 37. Changed files

Audit changes are spread across the frozen RC history. The principal hardening and evidence files are:

- Security: `frontend/src/lib/security/core/SecurityErrorEnvelope.js`, `SecurityContext.js`, `SecurityFabric.js`, `audit/SecurityAuditLogger.js`, `hardening/RateLimiter.js`, `hardening/SecurityHeaders.js`, `hardening/SafeRemoteUrl.js`, identity resolvers/verifiers, and `AiToolFirewall.js`.
- Trust/AI/retrieval: Trust ownership model/store/engine and routes, `AIObservatoryEngine.js`, `WebSearchRetriever.js`, `academicDocumentFetcher.js`, provider adapters, Layer 2/3 services, and URLhaus client.
- API/data boundaries: public DTO projections and authenticated mutation responses for forum, marketplace, safety-map, reviews, intelligence, expert, academic, scheduler, scholarships, and personalization routes; `202608270001_v2_authority_foundation.sql`.
- Integrations: guarded AI Drive/backend proxy and institutional RSS connector.
- Tests: `frontend/tests/security/final_audit_hardening.test.mjs`, migration RLS contract assertions, `frontend/tests/expert/expert_store_serverless_fallback.test.mjs`, and refreshed current Chromium visual snapshots.
- Release evidence: `docs/FINAL-AUDIT-STATE-MATRIX.md`, `docs/EVALUATION-PLAN.md`, `docs/KNOWN-LIMITATIONS.md`, `docs/COMPETITION-TECHNICAL-BRIEF.md`, `docs/DEMO-SCRIPT.md`, `docs/RELEASE-CHECKLIST.md`, `docs/ROLLBACK-REHEARSAL.md`, `docs/PR-DRAFT.md`, and this report.
- `docs/ACTIVE-BUILD-CHECKPOINT.md` is updated so the next session can resume without replanning.

The final head is pushed non-force to `origin/develop`; no merge to `main` was performed.

## 38. Final verdict

**`PR2_READY_FOR_FINAL_REVIEW_WITH_EXTERNAL_LIMITATIONS`**

The feature-frozen PR head is ready for final human review: local gates, GitHub push/PR CI, Linux Chromium/Firefox, Vercel preview deployment, public route/API smoke, private-route fail-closed checks, and deterministic demo flows are evidenced. It is not production certification: provision the disposable database, operator staging case file, fresh approved providers, rollback control plane, and (if required) a repaired Windows Firefox runtime, then rerun the explicitly blocked gates before public release.
