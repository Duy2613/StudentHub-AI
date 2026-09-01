# StudentHub AI — Luna Max Post-Antigravity Regression Report

**Date:** 2026-09-01  
**Authority:** Luna Max  
**Scope:** Independent engineering regression after the Antigravity visual transformation  
**Final status:** `POST_VISUAL_REGRESSION_COMPLETE_WITH_ENV_BLOCKERS`

## 1. Final status

`POST_VISUAL_REGRESSION_COMPLETE_WITH_ENV_BLOCKERS`

The visual transformation is locally regression-checked and ready for the next live-gate pass. Static gates, the discovered suite, Chromium, WebKit, mobile Chromium, accessibility checks, responsive checks, reduced-motion checks, demo isolation, route redirects, and the standalone visual prototype pass. Firefox launch, `agent-browser`, live provider credentials, Supabase/RLS integration, and Core Web Vitals remain blocked or unverified in this environment. This is not a production or release-candidate approval.

## 2. Executive summary

The Antigravity completion report was treated as an untrusted claim set and independently checked against the repository, local runtime, route contracts, state boundaries, visual snapshots, and tests. The Lucid Aether transformation is visible on the canonical Trust, Community, and Expert surfaces; its initial visual failures were stale snapshots from the previous palette/layout and were updated only after inspecting expected, actual, and diff images.

No independently attributable unauthorized domain, API, authentication, Supabase/RLS, provider, or business-rule change was found. Exact attribution is limited because there is no separate Antigravity commit or branch and the shared worktree contains earlier Luna changes. No reset, commit, push, merge, or destructive cleanup was performed.

## 3. Antigravity claims versus independent verification

| Claim | Independent result | Evidence |
| --- | --- | --- |
| Lucid Aether transformation covers Trust, Community, Expert, Dashboard, Settings, and landing | **VERIFIED** for the inspected local surfaces; visual snapshot diffs showed a coherent palette, typography, glass, spacing, and motion transformation | Runtime route audit; final Chromium visual suite; inspected snapshot diffs |
| Truth invariants remain intact | **VERIFIED** for the tested implementation paths | Trust, Community, Expert, demo-boundary, Passport, discovered-contract, and failure-state tests |
| No domain/backend/RLS/auth/API semantics changed | **PARTIALLY VERIFIED**; no unauthorized attributable change was found, but the shared worktree has no visual-agent commit boundary | Worktree attribution audit; static contract/security scans; 265/265 discovered tests |
| All 78 Luna baseline entries were preserved | **NOT INDEPENDENTLY PROVABLE** as an attribution claim | No Antigravity branch/commit exists; the current worktree has 86 status entries (62 modified, 24 untracked) |
| TypeScript, lint, tests, build, and bundle passed | **VERIFIED**, using the owning `frontend` package and repository wrappers | Sections 32–34 and the evidence table in section 37 |
| Bundle figures represent all three core routes | **VERIFIED AFTER AUDIT FIX**; the original script measured all three but gated only `/trust` | `scripts/check-bundle-budget.mjs` now gates every measured route; section 28 |
| Full browser, Axe, runtime, and live readiness were validated | **NOT EXECUTED / BLOCKED** by the submitted report and current environment | Independent browser/runtime checks are documented below; live and Firefox gates remain blocked |

## 4. Audit snapshot

- Workspace: `C:\Users\Duy\Projects\MyProj\StudentHub-AI`
- Branch: `codex/trust-engine-v5-sequential-assurance`
- HEAD at audit start and finish: `f96291ec9fc6f1ded6c8b519574e53c48aaa63be`
- Audit date: 2026-09-01, Asia/Bangkok
- Worktree state: shared and dirty; 86 status entries at the final inventory snapshot
- Antigravity provenance: no separate commit, branch, or machine-readable change manifest
- Operations explicitly not performed: `git reset --hard`, checkout/revert, commit, push, merge, deploy, secret rotation, database migration

## 5. Change-scope attribution

The visual work is represented in the shared worktree rather than an isolated visual-agent revision. The principal visual/runtime surfaces inspected were `frontend/src/app/globals.css`, `frontend/src/components/margin/margin.css`, `frontend/src/components/layout/UnifiedAppShell.jsx`, `frontend/src/components/trust/AiTrustStudioView.jsx`, `frontend/src/components/trust/TrustGraph2D.jsx`, `frontend/src/components/community/CommunityIntelligenceView.jsx`, and `frontend/src/components/expert/ExpertIntelligenceView.jsx`.

The root `index.html` and `media/open-constant/` are a separate, local, visual-only Three.js prototype. They are not the canonical StudentHub `/` route, not a Trust evidence source, and not part of the Next.js route bundle.

## 6. Unauthorized semantic-change audit

No independently attributable visual change was found that makes `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`, `NO MATCH`, `UNAVAILABLE`, or `PARTIAL` appear safe or complete. Semantic rendering continues to use explicit labels, text, icons, state boundaries, and independent metrics. Community volume is not presented as truth, expert identity is not a universal seal, graph nodes are data-backed, and live failures do not fall back to demo fixtures.

Because the worktree is shared, this is an evidence-backed regression conclusion rather than a cryptographic statement that every modified line was written by Antigravity. No contract or domain review was required by the observed regressions.

## 7. Information architecture and routes

The frozen route matrix accounts for 39 unique current page routes:

| Disposition | Count |
| --- | ---: |
| `KEEP` | 13 |
| `MERGE_INTO:<route>` | 13 |
| `REMOVE` | 4 |
| `POST_V1` | 9 |
| **Total** | **39** |

The three core pillar routes remain `/trust` (P0 flagship), `/community` (P1 corroboration), and `/expert` (P1 scoped escalation). `/cases` is the supporting Evidence Case Lab. The compatibility matrix is implemented in `frontend/next.config.ts`: Trust aliases redirect to `/trust`, the Community alias to `/community`, Expert aliases to `/expert`, and `/forum`, `/marketplace`, `/quests`, and `/ultra` redirect to their canonical migration destinations. Browser navigation tests cover the redirects and unknown-route 404 behavior.

## 8. UnifiedAppShell regression

`UnifiedAppShell` remains the canonical shell and consumes the canonical navigation configuration. Trust is first in desktop, tablet, mobile, and command navigation. The shell owns the skip link, main landmark, active route state, global search/`Ctrl-K` dialog, account access, settings access, and mobile disclosure. It does not own Trust, Community, Expert, or Passport domain logic.

The responsive and navigation suites found no horizontal overflow, duplicate main landmark, broken active state, or inaccessible core control. Legacy shell wrappers remain compatibility wrappers rather than competing IA owners.

## 9. Trust Level 1 semantics and order

The effective Level 1 order is:

1. Verdict and state boundary.
2. Recommended Action, including the explicit safety-action block immediately after the verdict.
3. Top Reasons.
4. Unknown/Unresolved signals.
5. Independent Risk metric.
6. Decision Confidence metric.
7. Evidence/Coverage metric.
8. Source Agreement metric.

The implementation keeps risk, confidence, evidence coverage, and source agreement as separate values. High/critical risk is danger-colored; uncertainty and unavailable states are not green-coded as safe. Trust tests cover insufficient evidence, invalid/oversized input, 401/403/429/503, malformed JSON, schema mismatch, stale requests, and the sequential pipeline.

## 10. Trust Level 2 evidence

Level 2 sections are emitted only from actual response fields. The inspected builder supports content claims, reputation, student context, identity, technical, community, expert, and handoff categories without inventing empty or placeholder facts. No phantom category was found in the rendered contract path.

## 11. Trust Level 3 technical evidence

Level 3 is limited to actual technical observations: URL/domain, redirect chain, DNS, TLS/certificate, headers, infrastructure, provider observations, timestamps, provenance, and safe raw observations. The UI does not fabricate DNS, TLS, provider, or infrastructure facts when they are absent. Sensitive values are redacted and bounded before rendering.

## 12. Multimodal input

URL, text, image, and QR-ready input paths were exercised through the Trust tests. Image object URLs are cleaned up. OCR regions render overlays only when actual coordinates exist; missing coordinates do not generate boxes. OCR is explicitly a client hint and worker fallback is surfaced as an expected notice, not as authoritative evidence. Mobile input remains within the responsive content boundary.

## 13. TrustGraph

TrustGraph nodes and edges are derived from input, claims, sources, related cases, and links rather than decorative filler. The inspected implementation provides search/filter, selection, zoom, an inspector, keyboard-accessible node controls, a list fallback, empty handling, lazy client graph loading, and reduced-motion behavior. Graph section failure is scoped to a localized error boundary and does not silently manufacture a successful report.

## 14. Evidence Passport

Passport behavior remains append-only: history, revisions, timestamps, provenance, contradictions, and old/new results are preserved. Existing Passport tests reject out-of-order events, demo evidence in a live passport, and Community-only resolution authority. User notes do not change the result. Dashboard/Profile exposure remains permission-bound and is not an overwrite path.

## 15. Community pillar

Community renders observations with context, provenance, timestamps, corroboration, and contradiction signals. The UI explicitly states that experience volume or upvotes are not truth or official policy. Submission fields are cleared and data is reloaded only after an actual `SUCCESS`; validation and typed failures remain recoverable. Public payloads do not expose raw author IDs, device fingerprints, or internal behavioral scores.

## 16. Expert pillar

Expert surfaces retain scope, identity, verification, credentials, publications/evidence reviewed, confidence, limitations, and time context. The UI warns that expertise does not equal universal authority. Empty claims disable assessment, out-of-scope paths remain explicit, and no leaderboard or universal expert seal was introduced.

## 17. Demo, live, and unavailable boundary

Provider mode is explicit. `runtimeProvider.js` defaults to `LIVE`; demo fixtures are enabled only by explicit competition-demo configuration. Live failure returns typed `UNAVAILABLE`/error state and never silently switches to demo. `SourceDisclosure` exposes `DEMO FIXTURE`, `LIVE PROVIDER`, or `UNAVAILABLE` labels.

The explicit demo suite passed 3/3 and asserted visible demo disclosure plus zero Trust API requests. The local live route and compatibility failure paths were tested with controlled mocks; this does not prove an external production provider is reachable.

## 18. UI state coverage

The canonical state model includes `LOADING`, `SUCCESS`, `EMPTY`, `PARTIAL`, `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`, `UNAVAILABLE`, `ERROR`, and `OFFLINE`, with additional auth/forbidden/cancelled boundaries where needed. `StateBoundary` uses alert semantics for error-like states and status semantics for progress/neutral states. State copy is explicit and fail-closed. Not every state has an independent visual snapshot; all required Trust failure semantics are represented in the Trust and discovered suites.

## 19. Error model

API failures are normalized to the safe shape `{ code, userMessage, requestId, retryable, safeDetails? }`. User-facing messages do not expose provider payloads or scanned content. A signed-out `/api/auth/session` 401 is an expected authentication boundary, not a page exception. 429 retry guidance and correlation references are covered by browser tests.

## 20. Accessibility and WCAG/Axe

Chromium and WebKit Playwright accessibility checks reported zero serious or critical Axe violations on core routes and Trust result states. Labels, landmarks, roles, dialogs, sheets, list fallbacks, graph controls, screenshot input, and Passport-facing controls were inspected through the test suite. Color is paired with text/state/icon semantics. The `agent-browser` gate was not executable because the binary is absent, so its result is `BLOCKED_BY_ENV`, not a fabricated pass.

## 21. Keyboard and focus

Skip navigation, core Trust tabs, graph/list controls, search dialog focus, and mobile menu controls are keyboard reachable. The WebKit keyboard test initially exposed a hydration-readiness race; the test now waits for the Trust text tab to be visible before tabbing. The targeted Chromium/WebKit rerun passed 2/2, and the final full WebKit run passed all 64 executed tests.

## 22. Reduced motion

The core reduced-motion test passed. CSS media-query handling and manual “Still” behavior disable or reduce transitions/ambient motion without removing content or controls. The standalone prototype also supports `prefers-reduced-motion`, a manual Still mode, visibility-based pause, and media pause/resume.

## 23. Responsive behavior

Chromium responsive checks passed at 360×800, 390×844, 768×1024, 1280×800, 1440×900, and 1920×1080; extended surfaces also passed at 320×900 and 768×900. The full mobile Chromium project passed 27/27. A stable multi-route audit covered `/`, `/trust`, `/community`, `/expert`, `/cases`, `/dashboard`, `/profile`, and `/settings` at desktop and 390 px mobile widths with one main landmark and no horizontal overflow.

## 24. Browser matrix

- Chromium: 70 tests collected; 67 passed and 3 explicit demo tests skipped in the normal suite. The final run included the visual tests.
- WebKit: 64 executed tests passed; 6 visual/demo tests were intentionally skipped by the project test policy.
- Firefox: `BLOCKED_BY_ENV`. Playwright could not spawn `C:\Users\Duy\AppData\Local\ms-playwright\firefox-1538\firefox\firefox.exe`; the failure was `browserType.launch: spawn UNKNOWN`. One request-only case completed, but the browser matrix is not green.
- `agent-browser`: `BLOCKED_BY_ENV`; `Get-Command agent-browser` returned `NOT_FOUND_IN_PATH`.

## 25. Visual snapshot audit

The first Chromium visual run had three failures: Trust input, Trust result, and Community. Inspection of expected, actual, and diff images showed page-wide intentional Lucid Aether changes rather than isolated layout breakage: deep indigo/teal palette, typography, glass surfaces, spacing, and content treatment had changed from the old baseline. Snapshots were then updated deliberately with `--update-snapshots` and the visual suite reran without update mode at 3/3 passed.

The six final Chromium snapshots are `community-desktop`, `expert-desktop`, `trust-input-desktop`, `trust-result-desktop`, `trust-result-mobile`, and `trustgraph-desktop`. No blind snapshot update was used.

## 26. Performance observations

The three core routes remain under the 500 KB initial-JS budget and the production build completes successfully. Runtime route audits found no horizontal overflow or duplicate shell landmark. CSS contains legacy dormant animation definitions in the shared global stylesheet; the tested core pages showed one controlled ambient system, but those definitions should be cleaned when their ownership is next refactored.

Core Web Vitals, long-task traces, memory, and device-level frame telemetry were not available in this environment: `NOT_VERIFIED_IN_CURRENT_ENVIRONMENT`.

## 27. GPU, animation, media, and cleanup audit

The direct-open prototype audit loaded `index.html` in Chromium from `file:///`, confirmed a 1440×900 canvas, WebGL availability, loaded poster, two ready/playing local video slots, no console/page errors, a stable paused time after clicking Pause, successful Still and Reset controls, and a ready scene status. Source inspection confirmed animation-frame cancellation, renderer/resource disposal, visibility pause/resume, media cleanup, reduced-motion handling, and bounded dust/manifold counts.

The prototype asset directory contains 11 local files totaling 81,553,686 bytes (9 videos, one PNG, and local `three.min.js`). It is outside the Next route bundle and is therefore a separate asset-volume/performance limitation. No GPU telemetry, device thermal test, or production CDN media test was executed.

## 28. Bundle budget

`npm run audit:bundle` passed after correcting the audit script so every measured core route is gated:

| Route | Initial JS | Budget |
| --- | ---: | ---: |
| `/trust` | 334,180 bytes | 500,000 bytes |
| `/community` | 334,165 bytes | 500,000 bytes |
| `/expert` | 334,192 bytes | 500,000 bytes |

The script previously printed all measurements but only failed on `/trust`; the fix is audit-infrastructure-only and does not change application behavior.

## 29. Security boundary

Static inspection found no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`, iframe `srcDoc`, `data:text/html`, or contextual-fragment sink in the inspected application path. JSX renders community, Trust, and Expert values through escaping. URL validation, prompt-injection/firewall classes, safe OCR rendering, object-URL cleanup, body/response limits, API allowlists, origin-matching CORS, and auth boundaries remain present.

The existing CSP permits `unsafe-inline` and broad `https:` image/connect sources. This is a production hardening limitation, not a visual-induced semantic regression. External media hosts, CSP tightening, screenshot privacy/storage retention, and deployment secret review remain live-release work.

## 30. Console and runtime audit

Stable per-route Chromium and WebKit audits returned HTTP 200 for the inspected page routes, one main landmark, no hydration markers, no page errors, and no horizontal overflow. Expected observations were:

- signed-out `/api/auth/session` returns 401 and logs a browser resource warning by design;
- unmounted Community/Expert/personalization requests may be cancelled during rapid navigation;
- OCR worker fallback logs an expected `[OCR Worker Notice]` while retaining its client-hint disclosure.

No unexpected core runtime exception, hydration error, failed page resource, or unhandled rejection was found in the stable route audit.

## 31. End-to-end superflow coverage A–H

| Flow | Coverage | Result |
| --- | --- | --- |
| A. URL/text investigation → report → action | Trust input, sequential Trust pipeline, verdict/action tests | **PASS** |
| B. Screenshot/QR → entities/OCR → evidence → report | File validation, OCR hint, multimodal Trust tests | **PASS** |
| C. Trust → failure/unknown/unavailable handling | 401/403/429/503, malformed JSON, schema mismatch, insufficient evidence | **PASS** |
| D. Trust → TrustGraph → Passport | Graph filters/zoom/inspector/list fallback and immutable Passport tests | **PASS** |
| E. Trust → Community corroboration | Community search/provenance/volume boundary and scoped submission tests | **PASS** |
| F. Trust → Expert escalation | Expert scope/identity/empty claim/failure tests | **PASS** |
| G. Responsive/accessibility/mobile continuation | Responsive, keyboard, Axe, reduced-motion, mobile projects | **PASS** |
| H. Demo/live boundary and compatibility navigation | Demo 3/3, route aliases, removed-route migration, static security/API audits | **PASS locally; live portion blocked** |

## 32. TypeScript gate

**PASS.** `npx tsc --noEmit --pretty false` from `frontend/` exited 0. The repository root does not own the TypeScript package; the owning-package command is the authoritative invocation.

## 33. Lint gate

**PASS WITH WARNINGS.** `npm run lint` exited 0 with 0 errors and 332 warnings. Warnings are pre-existing quality debt, primarily unused symbols and React hook guidance; no new lint error blocked this audit.

## 34. Production build gate

**PASS.** `npm run build` completed on Next.js 16.3.0/Turbopack, compiled successfully, ran TypeScript, and generated 117/117 static pages.

## 35. Fixes made during this regression

Only scoped, low-risk fixes were made:

1. Added a readiness assertion to `frontend/tests/e2e/accessibility.spec.ts` to remove a WebKit hydration/tab timing race.
2. Corrected `scripts/check-bundle-budget.mjs` to fail on any measured core route over budget, not only `/trust`.
3. Updated `scripts/run-discovered-tests.mjs` to propagate the repository’s TypeScript extension loader to discovered tests.
4. Changed the intelligence freshness fixture to a relative recent timestamp so the test remains deterministic across dates.
5. Removed trailing whitespace from the two visual CSS files; `git diff --check` is clean.
6. Deliberately regenerated six stale visual snapshots after inspecting their diffs.

No domain model, API contract, provider implementation, auth boundary, RLS policy, or database schema was changed as part of these fixes.

## 36. Files changed or created by this audit

Audit-owned changes are limited to the files listed in section 35 plus this report and the six visual snapshot PNGs under `frontend/tests/e2e/visual-regression.spec.ts-snapshots/`. The shared worktree also contains pre-existing Luna and visual-agent changes, including product components, docs, adapters, routes, and the standalone prototype; those are not reattributed here without a separate baseline revision.

## 37. Required evidence table

| Gate | Status | Evidence |
| --- | --- | --- |
| TypeScript | **PASS** | `frontend/`: `npx tsc --noEmit --pretty false`, exit 0 |
| Lint | **PASS WITH WARNINGS** | `npm run lint`, 0 errors / 332 warnings |
| Discovered tests | **PASS** | `npm run test:all-discovered`, 265/265 files |
| Build | **PASS** | `npm run build`, 117/117 static pages |
| Bundle | **PASS** | `/trust` 334,180; `/community` 334,165; `/expert` 334,192; each <500 KB |
| Chromium | **PASS** | `npx playwright test --project=chromium`, 67 passed, 3 explicit skips |
| WebKit | **PASS** | `npx playwright test --project=webkit`, 64/64 executed passed, 6 skips |
| Firefox | **BLOCKED_BY_ENV** | Browser launch `spawn UNKNOWN` at Playwright Firefox executable |
| Mobile 390 | **PASS** | `npx playwright test --project=mobile-chromium`, 27/27 passed; responsive 390×844 passed |
| WCAG/Axe | **PASS** | Chromium/WebKit core route and Trust-result Axe checks: zero serious/critical violations |
| Reduced motion | **PASS** | Responsive reduced-motion test plus prototype manual Still check |
| Trust semantics | **PASS** | Trust V5 sequential, Trust failure-state, multimodal, and state-boundary tests |
| Demo boundary | **PASS** | Explicit demo suite 3/3; visible label and zero Trust API requests |
| Passport | **PASS** | Living Evidence Passport tests: immutable history, revision, contradiction, provenance, rejection rules |
| GPU/prototype | **PASS WITH LIMITATION** | Direct-open Chromium: WebGL, canvas, media, pause/reset/Still, no page/console errors; no GPU telemetry |
| Supabase/RLS | **BLOCKED_BY_ENV** | No `STUDENTHUB_RLS_TEST_DATABASE_URL`; live RLS drill not executed |
| Providers | **BLOCKED_BY_ENV** | No production external provider proof/credentials; local typed failure and mock paths pass |
| Core Web Vitals | **NOT_VERIFIED_IN_CURRENT_ENVIRONMENT** | No production-like telemetry or CWV runner available |
| agent-browser | **BLOCKED_BY_ENV** | Binary not present in PATH |

## 38. Environment blockers

The following are environment limitations, not converted into product failures: Firefox cannot spawn (`spawn UNKNOWN`); `agent-browser` is not installed; no Supabase/RLS test database URL is configured; live external provider credentials/endpoints are not proven; Core Web Vitals and GPU telemetry are unavailable. These blockers must be rerun in the appropriate CI/staging/device environment.

## 39. Production blockers

Before live or RC approval, the team still needs a real deployment check for provider reachability, Supabase auth/session behavior, RLS policies, CSP/media hosts, secret configuration, Firefox, WebKit on supported devices, CWV, and production bundle/media delivery. The shared worktree attribution gap should also be resolved by producing a reviewable visual-agent commit or clean diff boundary.

## 40. Risks and limitations

- The current worktree cannot prove which existing lines belong to Antigravity versus prior Luna work.
- Lint has 332 warnings even though it has zero errors.
- The standalone prototype carries approximately 81.6 MB of local media outside the application bundle.
- Global CSS retains dormant legacy animation definitions and should receive ownership cleanup before broader motion work.
- CSP `unsafe-inline` and broad HTTPS allowances require hardening for production.
- Local mock/demo providers do not prove external provider correctness or latency.
- Firefox, Supabase/RLS, live providers, CWV, and GPU telemetry remain unverified.

## 41. Live readiness

**Local engineering readiness:** complete.  
**Live readiness:** not yet proven.  
**Release-candidate readiness:** not granted.

The exact final classification is `POST_VISUAL_REGRESSION_COMPLETE_WITH_ENV_BLOCKERS`, not a claim that production is safe to deploy.

## 42. Rollback

No destructive rollback was required. The six visual snapshots can be reverted through the normal review diff, and the three audit/test fixes are isolated and reversible. If the visual transformation must be withdrawn, use the owning review branch/commit once one exists; do not reset this shared worktree because it contains unrelated user-owned Luna changes.

## 43. Acceptance criteria

- [x] Antigravity claims independently classified as verified, inferred/partial, not executed, or environment-blocked.
- [x] All 39 current page routes accounted for by the frozen route matrix.
- [x] Trust remains the P0 flagship and first canonical intelligence destination.
- [x] UnifiedAppShell, aliases, active state, search, account/settings, focus, and responsive overflow verified locally.
- [x] Trust Level 1 ordering and separation of verdict, action, reasons, unknowns, risk, confidence, coverage, and agreement verified.
- [x] Level 2/3, multimodal, TrustGraph, Passport, Community, Expert, and demo/live boundaries audited.
- [x] Canonical UI states and safe API error boundaries audited.
- [x] Chromium, WebKit, mobile Chromium, Axe, keyboard, reduced-motion, and visual snapshots verified.
- [x] Static TypeScript, lint, discovered tests, build, API authorization inventory, dependency audit, and all-route bundle budget gates verified.
- [x] No contract/domain change was needed to resolve a confirmed regression.
- [ ] Firefox browser gate, agent-browser gate, live provider gate, Supabase/RLS gate, production CSP/media gate, CWV, and GPU telemetry remain open environment/production gates.

## 44. Next gate

Proceed to the dedicated staging/live assurance pass: create or identify an isolated visual-agent diff boundary, run Firefox and `agent-browser`, configure the Supabase/RLS test database, exercise real provider health/failure paths, collect CWV and GPU/device traces, and perform the final security/deployment review. Until those checks are complete, retain the final status:

`POST_VISUAL_REGRESSION_COMPLETE_WITH_ENV_BLOCKERS`
