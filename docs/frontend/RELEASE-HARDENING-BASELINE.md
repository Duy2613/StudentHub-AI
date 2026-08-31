# StudentHub AI Historical Frontend Release-Hardening Baseline

Verified: 2026-08-28
Scope: the current dirty working tree; no reset, commit, dependency upgrade or product feature expansion is authorized.

> **Closure note (2026-08-30):** Archived baseline. Use [`FINAL-AUDIT-REPORT.md`](../../FINAL-AUDIT-REPORT.md) and [`docs/RELEASE-CHECKLIST.md`](../RELEASE-CHECKLIST.md) for the current RC decision. The Firefox PASS row below reflects an earlier clean-cache observation and is not current Windows-host proof.

## VERIFIED

| Gate | Result | Evidence |
|---|---|---|
| Dependency tree | PASS | `npm ls --depth=0`; React 19.2.8, Next 16.3.0, TypeScript 5.9.3, Tailwind 4.3.3, Playwright 1.62.1, Zod 4.4.3 |
| Lint | PASS WITH DEBT | 0 errors, 336 warnings |
| TypeScript | PASS | `npx --no-install tsc --noEmit` |
| Regression | PASS | 240/240 discovered test files |
| Production build | PASS | Next.js compiled and generated 102 routes |
| Production dependency audit | PASS | 0 known vulnerabilities across 498 production dependencies |
| Bundle budget | PASS | Trust 368,504 B; Community 325,808 B; Expert 327,837 B; Trust budget 500,000 B |
| Lighthouse release assertions | PASS | Trust 77/100/100/100; Community 67/100/100/100; Expert 77/100/100/100 (performance/accessibility/best-practices/SEO) |
| Chromium E2E, isolated | PASS | 41 passed, 3 explicit demo-mode skips |
| WebKit E2E, isolated | PASS | 38 passed, 6 intended Chromium-only/demo skips |
| Firefox E2E, clean cache | PASS | 38 passed, 6 intended skips |
| Responsive matrix | PASS | 12/12 on Chromium/WebKit at 360, 390, 768, 1280 and 1440 px; Firefox full suite covers the same matrix |
| Full cross-browser run at previous default concurrency | FAIL — INFRA/CONFIG | 63 passed, 12 skipped, 69 failed; Next dev Fast Refresh reached 29 s and tests timed out under eight workers |
| Firefox default browser cache | HOST LIMITATION | Default `%LOCALAPPDATA%/ms-playwright` still returns `spawn UNKNOWN`; the same Playwright build passes from a clean temp cache, proving application assertions are green |
| Frontend security review | PASS WITH DEBT | URL-navigation injection fixed and regression-tested; no tracked secret or production dependency CVE found; Web Storage auth and initial academic-fetch allowlisting remain architectural debt |

## INFERRED

- The large full-suite failure is primarily concurrency-induced rather than a product regression: the same Chromium and WebKit assertions pass with one worker.
- The default Firefox-cache result is a host path/runtime failure, not a test assertion failure: a clean cache passed all 38 executed assertions.
- The hydration warning observed during rapid responsive navigation was a capture race; waiting for the canonical heading and network idle produced a clean 12/12 responsive run.

## UNKNOWN

- Live staging/provider correctness because `STUDENTHUB_STAGING_BASE_URL` and approved staging cases are not configured.
- Live PostgreSQL/RLS and server-restart proof because the dedicated database environment is unavailable.
- Field Core Web Vitals; local Lighthouse is a lab measurement only.
- Field INP and real-user Core Web Vitals; local Lighthouse cannot measure field behavior.

## Current product map

| Pillar | Canonical route | User value | Status | Release action |
|---|---|---|---|---|
| Trust | `/trust` | Analyze input, show verdict/evidence/cases/TrustGraph/human handoff | Core, verified with deterministic browser contracts | KEEP; staging proof pending |
| Community | `/community` | Surface experience evidence without treating volume as truth | Core, browser verified | KEEP |
| Experts | `/expert` | Scope expert claims and authority boundaries | Core, browser verified | KEEP |
| Identity/settings | `/login`, `/register`, `/callback`, `/onboarding`, `/profile*`, `/settings*` | Access and personal control | Supporting | KEEP; cookie cutover/live auth pending |
| Personal/academic OS | `/dashboard`, `/academic*` | Academic planning and execution | Supporting, outside competition primary navigation | KEEP secondary |
| Legacy intelligence | `/intelligence*`, `/forum` | Technical/legacy views over similar domains | Duplicate surface | POST-RC convergence; do not delete in this batch |
| Specialist showcases | `/ai`, `/contract-check`, `/credit-scheduler`, `/marketplace`, `/prof-rating`, `/quests`, `/safety-map`, `/scholarships`, `/sos`, `/tuition-radar` | Narrow tools and demonstrations | Non-core competition surface | Keep out of primary navigation; removal requires dependency/usage evidence |
| Compatibility | `/scam-check` | Preserve old links | Redirects to `/trust` | KEEP redirect |

## Baseline priorities

- **P0:** resolved deterministic E2E concurrency and unsafe action navigation.
- **P1:** staging/provider proof, default Firefox cache/path repair, browser caller cookie-auth cutover, academic fetch preflight allowlist.
- **P2:** 336 lint warnings, large shared CSS, remaining distributed raw fetch usage, legacy/duplicate route convergence.
- **P3:** archived specialist surfaces; no deletion before usage and dependency evidence.
