# STUDENTHUB AI — RELEASE ASSURANCE REPORT

## Candidate

- **Branch:** design/academic-cinematic-product-evolution
- **Base/HEAD commit:** 35b1ad9f7b8330891791b5970af3fcc2e32f18c1
- **Working tree:** dirty; final evidence was collected against the same working tree after the last build.
- **Candidate digest:** 504dc4feebe45cb2afe057fd523b6c867aef9d2e05e5a705c92a0b420522e0d5 (SHA-256 over the tracked diff plus non-ephemeral untracked candidate files, excluding this report and generated test output).
- **Environment:** Windows, Node v24.16.0, npm 11.13.0, Next.js 16.3.0, local production server on port 3200.
- **Evidence date:** 2026-09-06 (Asia/Bangkok).

## Verdict

ACADEMIC_CINEMATIC_EVOLUTION_NOT_RELEASE_READY

## Executive summary

The reproducible local UI and contract defects found in this assurance cycle were fixed and rechecked. Chromium and WebKit each pass the 37-test closure matrix, including axe/keyboard behavior, hydration stability, deferred UI, Trust V5 boundaries, network failures, and the late-scan race. The production build, TypeScript, deterministic suites, security contracts, bundle budget, health probes, and local restart also pass.

The candidate is still not 100% release-ready. Fresh mobile Lighthouse JSON is valid, but LCP is above the 2,500 ms target on all four canonical routes. The Lighthouse process exits non-zero while Windows releases the temporary Chrome profile (EPERM). Firefox cannot launch in this environment, and there is no real-device, field CWV/INP, staging-provider, live PostgreSQL/RLS, executed rollback, or external observability evidence. These are explicit release gates, not assumptions to mark green.

## Why it is not perfect and remaining defects

1. **Fresh synthetic LCP still misses the release target.** The latest n=1 mobile sample is 2,572.1–2,771.6 ms across Roadmap, Lesson, Trust, and Landing. TBT and CLS are healthy, so render delay and queued work remain the primary local performance debt.
2. **The Lighthouse runner is not clean on Windows.** Every run writes valid JSON but exits 1 while cleaning its temporary Chrome profile. This is tracked as LIGHTHOUSE_METRICS_VALID plus LIGHTHOUSE_RUNNER_TEARDOWN_FAIL_WINDOWS_EPERM; the two facts are not merged into a false PASS.
3. **Firefox evidence is blocked by the machine.** Playwright returns browserType.launch: spawn UNKNOWN for the firefox-1538/firefox.exe executable. No Firefox PASS is claimed.
4. **Real-world performance is unverified.** No Android/iOS hardware, field RUM/CrUX sample, or field INP exists. Codes: REAL_DEVICE_NOT_VERIFIED, FIELD_CWV_NOT_AVAILABLE.
5. **Infrastructure gates are not executable with the current environment.** Staging URL/cases/provider credentials and the live PostgreSQL test URL are absent. Local contract tests cannot substitute for staging provider behavior or live RLS queries.
6. **Rollback and external observability are not exercised.** The procedure is documented, but no staging rollback or external sink/trace validation was run.
7. **Shared CSS and unused JavaScript remain measurable debt.** The largest shared CSS asset is 408,895 raw bytes (53,278 bytes gzip); Lighthouse estimates 124–230 KiB of unused JavaScript by route. CSS ownership was attributed, while a blind split was intentionally avoided.
8. **ESLint has warning debt.** The candidate has 0 errors and 404 warnings. The warnings are concentrated in unused test symbols and a small number of React lifecycle/dependency cases; they remain documented P2/P3 work.
9. **Optional runtime capabilities are intentionally partial.** Health reports local Trust available, live providers not configured, process-local SSE degraded/non-authoritative, experts partial, and Labbe disabled. The UI exposes those boundaries instead of fabricating availability.
10. **Browser OCR can time out.** It is bounded and fails closed as CLIENT_OCR_HINT; accuracy and warm-cache latency are not release evidence.

## What was upgraded and fixed in the project

- Reduced active runtime fonts to Be Vietnam Pro, Lora, and JetBrains Mono; removed legacy family references and unnecessary preload pressure.
- Kept the server-rendered critical shell stable for Landing, Lesson, Roadmap, and Trust, including a permanently mounted Trust hero so late analysis islands cannot replace the LCP candidate.
- Deferred WebGL, cinematic video, Command Palette, Lenis, Trust analysis, auth bootstrap, AI Tutor, and notes until their interaction/idle boundaries; added bounded media readiness and semantic SVG fallback behavior.
- Added shared User Timing helpers and marks for hydration, cinematic media, navigation, Command Palette, TOC, AI drawer, Trust workspace/analysis, and Atlas filtering.
- Added Trust V5 stage semantics: seven keyboard-operable tabs, roving focus, one panel, explicit finding / meaning / not proved / evidence / limitation / next stage blocks, and a no-auto-scroll contract.
- Fixed SSR/client auth capability copy drift by using a shared, statically analyzable capability environment; /login now hydrates without mismatch.
- Fixed the asynchronous Trust scan race: a late Scan A cannot clear or overwrite a newer Scan B draft/result, and rerun copy reflects the current submission.
- Preserved trust-case identity, idempotency, revision redaction, durable outbox boundaries, principal-aware realtime channels, and fail-closed provider/error handling covered by contracts.
- Added stale-artifact protection to the canonical Lighthouse helper and robust missing/invalid JSON handling.
- Scoped the Tailwind utility scan to application source and produced an ownership/size breakdown before any CSS removal.
- Added and updated closure tests for keyboard behavior, accessibility, hydration, deferred UI timing, Trust V5 boundaries, and race/failure journeys.

## Gate matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Production build | PASS | npm run build; Next/Turbopack compiled and generated 135/135 static pages. |
| TypeScript | PASS | Completed during the production build with no type errors. |
| Deterministic suite | PASS | npm run test:all: 521 passed, 0 failed, 0 skipped. |
| Security hardening | PASS | Final audit contract: 7/7. |
| Auth/session contracts | PASS | Auth resilience + identity closure: 23/23. |
| Trust/persistence contracts | PASS | Stage presenter + revision persistence: 5/5. |
| Labbe/integration/DB contracts | PASS | Canonical vectors, outbox, qualification, and migration contracts: 25/25. |
| Bundle budget | PASS | Six routes measured; all below 500,000 bytes. |
| Chromium closure | PASS | 37/37 Playwright tests on the final build. |
| WebKit closure | PASS | 37/37 Playwright tests on the final build. |
| Firefox closure | BLOCKED | BLOCKED_BY_ENVIRONMENT: executable launch returns spawn UNKNOWN. |
| Automated accessibility | PASS | Chromium and WebKit each pass 14/14 axe/keyboard cases; no serious/critical violations. |
| Keyboard/focus behavior | PASS | Command Palette, mobile navigation, TOC, Trust tabs, dialogs, print gating, and account controls exercised. |
| Reduced motion | PASS | Reduced-motion route behavior and transform suppression verified locally. |
| Screen reader | NOT TESTED | No assistive-technology runtime was available. |
| User Timing marks | PASS | Hydration, media, navigation, TOC, AI drawer, Trust, and Atlas marks captured in both engines. |
| Actual INP | NOT TESTED | Event Timing support is observed where available, but no field or real-device INP sample exists. |
| Lighthouse JSON validity | PASS | Fresh landing-1, lesson-1, roadmap-1, and trust-1 reports parse successfully. |
| Lighthouse LCP threshold | FAIL | All four fresh n=1 LCP values exceed 2,500 ms. |
| Lighthouse runner teardown | FAIL | Windows Chrome profile cleanup exits 1 with EPERM. |
| Real-device mobile | NOT TESTED | REAL_DEVICE_NOT_VERIFIED. |
| Field CWV/RUM | NOT TESTED | FIELD_CWV_NOT_AVAILABLE. |
| Font/text audit | PASS | Only the three approved families remain in source; no legacy family references. |
| WebGL fallback | PASS | Semantic SVG fallback, bounded enhancement, repeated navigation, and no-WebGL behavior pass locally. |
| WebGL mobile/hardware load | NOT TESTED | No physical-device thermal/GPU sample. |
| Deferred UI before/after interaction | PASS | Playwright confirms no pre-trigger companion/AI work and usable post-trigger panels. |
| Network/failure matrix | PASS | Invalid input, malformed JSON, schema mismatch, 401, 403, 429, 503, OCR timeout, and pending navigation cases pass locally. |
| Duplicate Trust submission/idempotency | PASS | Latest scan remains authoritative; durable idempotency contracts pass. |
| CSS attribution | PASS | Shared versus route CSS sizes are measured and ownership is documented. |
| Shared CSS reduction | NOT TESTED | Safe route isolation/dead-code removal still needs a measured follow-up. |
| ESLint | PASS | 0 errors; 404 warnings documented as debt. |
| Local liveness/readiness | PASS | /api/health/live and /api/health/ready return HTTP 200; correlation id is present. |
| Local restart | PASS | Production server was rebuilt, restarted on port 3200, and health-checked before final browser/Lighthouse runs. |
| Staging provider | BLOCKED | STAGING_PROVIDER_BLOCKED_BY_ENV: required staging URL/cases/token/scope/database variables are missing. |
| Live PostgreSQL/RLS | BLOCKED | BLOCKED_BY_DATABASE_ENV: STUDENTHUB_RLS_TEST_DATABASE_URL is absent; live report gate skips without DATABASE_URL. |
| Private artifact storage live check | NOT TESTED | Contract coverage exists; no clean staging storage query was available. |
| Staging restart persistence | NOT TESTED | No staging runtime was supplied. |
| Rollback execution | NOT TESTED | ROLLBACK_DEFINED_NOT_EXECUTED. |
| External observability sink | NOT TESTED | Local structured/correlated logs are exercised; no staging sink was supplied. |
| Candidate binding | PASS | Branch, base SHA, environment, dirty state, and candidate digest recorded above; fresh artifacts were regenerated after the final build. |

## Performance

Fresh local synthetic mobile sample, one run per route (median equals worst for this sample):

| Route | LCP | FCP | CLS | TBT | Scores (perf/a11y/best/SEO) |
| --- | ---: | ---: | ---: | ---: | --- |
| / | 2,771.6 ms | 2,771.6 ms | 0.000 | 76.8 ms | 0.90 / 1.00 / 0.96 / 1.00 |
| /learn/cs101/fullstack-intro | 2,630.2 ms | 2,630.2 ms | 0.000 | 131.1 ms | 0.90 / 0.98 / 0.96 / 1.00 |
| /roadmap | 2,572.1 ms | 2,572.1 ms | 0.000 | 37.2 ms | 0.93 / 0.98 / 0.96 / 1.00 |
| /trust | 2,706.8 ms | 2,706.8 ms | 0.000 | 166.6 ms | 0.90 / 1.00 / 0.92 / 1.00 |

The JSON reports are preserved at frontend/.lighthouseci/academic-mobile/final-canonical/. The LCP candidates are text, with no resource-load delay in this profile; the remaining local cost is render delay/queued work. The profile is synthetic and does not prove field tail latency.

Initial JavaScript after the final build:

| Route | Bytes | Chunks |
| --- | ---: | ---: |
| / | 204,993 | 5 |
| /learn/cs101/fullstack-intro | 129,995 | 5 |
| /roadmap | 140,563 | 5 |
| /trust | 142,244 | 5 |
| /community | 124,458 | 5 |
| /expert | 124,452 | 5 |

User Timing captures prove application milestones but are not a substitute for INP. In Chromium, examples include hydration 47–455 ms, Command Palette opening 307 ms, TOC settling 67 ms, AI drawer opening 309 ms, Trust analysis 1,468 ms, and Atlas filtering 6 ms. WebKit captures the same marks; its Event Timing API is unavailable on one navigation.

## Browser matrix

| Engine | Result | Scope |
| --- | --- | --- |
| Chromium | PASS | 37/37 closure suite, 14/14 axe/keyboard, timing and failure matrix. |
| WebKit | PASS | 37/37 closure suite, 14/14 axe/keyboard, timing and failure matrix. |
| Firefox | BLOCKED | Installed executable cannot launch: spawn UNKNOWN. |

## Device matrix

- Desktop-sized local viewports (768/1024 through 1440/900): PASS for route navigation, shell integrity, reduced motion, and no document-level horizontal overflow.
- Emulated mobile (360/640 Lighthouse and Playwright mobile profiles): PASS for local functional behavior and fallback paths; Lighthouse LCP threshold remains FAIL.
- Real Android/iOS device: NOT TESTED (REAL_DEVICE_NOT_VERIFIED).

## Accessibility

Automated axe and behavioral keyboard checks pass 14/14 in both Chromium and WebKit. Trust status is conveyed through text, stage labels, evidence/limitation boundaries, and recovery states; it is not dependent on color alone. Reduced motion is verified locally. A screen-reader/AT pass remains NOT TESTED.

## Backend and provider boundaries

Local deterministic Trust, auth, security, outbox, idempotency, malformed-response, timeout, and retry contracts pass. The readiness endpoint reports local Trust AVAILABLE and live providers NOT_CONFIGURED (optional), while realtime is PROCESS_LOCAL_SSE and explicitly non-authoritative. Staging provider execution is BLOCKED by missing environment variables; no secret or remote call was attempted.

## Database and storage

Migration and RLS contract tests pass, including ownership policy shape, private report snapshot boundaries, and fail-closed configuration behavior. Actual cross-user PostgreSQL/RLS queries and private storage access were not executed because the live test database and clean staging environment were unavailable.

## Lifecycle

The final production build was served, restarted on port 3200, and verified through live/readiness probes before the final browser and Lighthouse passes. No staging restart or rollback was executed. The documented rollback state is therefore ROLLBACK_DEFINED_NOT_EXECUTED.

## Observability

Local health responses include structured status and a correlation id; security tests confirm generic correlated errors without credential leakage. Local logs and timing captures are available for the assurance run. An external staging log/trace/metrics sink, provider cost telemetry, and database latency stream were not available for verification.

## Critical journeys

1. **First visit → Trust:** PASS locally. The SSR shell paints, navigation reaches Trust, the stable hero remains mounted, and optional analysis is requested only after interaction.
2. **Trust investigation:** PASS locally. Text and image input validation, in-flight state, seven-stage explanation, evidence/limitation boundaries, partial-provider disclosure, recovery statuses, print gating, and latest-scan binding are covered.
3. **Lesson → TOC → companion:** PASS locally. The quiet reading shell loads without the companion chunk before interaction; TOC settles, the AI/notes panel loads after activation, and reading continues after close.
4. **Application shell:** PASS locally. Core navigation, mobile navigation, Command Palette, Atlas fallback, repeated WebGL navigation, sticky/fixed surfaces, and overflow behavior pass in Chromium/WebKit.
5. **Account/profile boundary:** PASS locally. Auth state transitions, same-origin application session behavior, logout cleanup, provider capability copy, and hydration stability are covered; real provider login is not a staging claim.

## Remaining risks

- LCP threshold failure on all four fresh synthetic canonical routes.
- Lighthouse process teardown failure on Windows.
- Unverified Firefox, physical-device, field CWV/INP, screen-reader, staging provider, live PostgreSQL/RLS, private-storage, rollback, and external observability gates.
- Shared CSS/unused-JS payload and 404 ESLint warnings remain technical debt.
- Realtime and optional provider capabilities remain explicitly partial in local readiness.
- OCR may degrade to a bounded client hint when its worker times out.

## External blockers

- Firefox executable launch failure (spawn UNKNOWN).
- Missing STUDENTHUB_STAGING_BASE_URL and external case file.
- Missing Labbe staging URL/token/scope/test database and STUDENTHUB_LABBE_MODE=STAGING.
- Missing STUDENTHUB_RLS_TEST_DATABASE_URL and live DATABASE_URL.
- Windows temporary Chrome profile handle cleanup (EPERM).

## Release decision

DO_NOT_RELEASE

Keep the verdict ACADEMIC_CINEMATIC_EVOLUTION_NOT_RELEASE_READY until the LCP/runner issue is resolved or accepted by a release owner and the blocked staging, database/RLS, essential-browser, real-device/field, rollback, and observability gates have fresh evidence. No deployment was performed in this pass.
