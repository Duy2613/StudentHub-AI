# StudentHub AI — Continuous Engineering Roadmap

**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01

## Governing rule

The frozen product is Trust P0, Community P1, and Expert P1. This roadmap records the approved F00–F19 sequence and the result of the continuous local engineering program. The program implemented every technically achievable frontend/non-visual seam against the existing repository contracts; it did not invent ASP.NET, Supabase, PostgreSQL/RLS, provider, or deployment behavior.

The human owner still controls merge, backend provisioning, and final visual acceptance. No commit, push, or merge was performed.

## Phase map

| Phase | Responsibility | Status | Evidence / boundary |
| --- | --- | --- | --- |
| F00 — Scope Freeze | Remove sprawl, freeze core pillars, final route decisions | `PASS` | 39 routes accounted for; 13 KEEP, 13 MERGE_INTO, 4 REMOVE, 9 POST_V1 |
| F01 — Information Architecture | Routes, navigation, superflows, product hierarchy | `PASS` | Canonical shell/nav source, Trust-first hierarchy, five superflows |
| F02 — Foundation | Design tokens, contracts, UI states, adapters, architecture cleanup | `PASS` | Typed ports, state envelope, explicit Demo/Live boundary, adapter tests |
| F03 — Component System | Primitives, variants, states, responsive behavior | `PASS` | Existing primitives/state boundaries consumed; no advanced visual polish claimed |
| F04 — App Shell | Unified shell, nav, mobile nav, account/search | `PASS` | `UnifiedAppShell`, canonical navigation config, redirect and responsive gates |
| F05 — Trust Input | URL, text, screenshot, QR, upload | `PASS` | Local validation, bounded upload, OCR/QR-ready metadata, cancellation |
| F06 — Trust Report | Level 1, Level 2, Level 3 | `PASS` | Ordered report layers, explicit unknowns, actual-evidence-only technical layer |
| F07 — Multimodal | Screenshot preview, OCR overlays, entity inspector, mobile interaction | `PASS` | Client OCR hint, confirmed-entity hint, no fabricated coordinates |
| F08 — TrustGraph + Passport | Evidence graph and Passport lifecycle | `PASS` / `ENV-GATED` | Graph/list fallback and exact revision guard; live persistence/auth not proven |
| F09 — Community | Observation, corroboration, conflict, moderation | `PASS` / `ENV-GATED` | List/detail/submit seams and typed scope; live persistence/moderation not proven |
| F10 — Expert | Scoped discovery, escalation, assessment | `PASS` / `ENV-GATED` | Directory/detail/assessment seams; production authority verification not proven |
| F11 — Landing | Product landing experience | `PASS` | Trust-first entry and supporting pillar links retained |
| F12 — Cinematic / Motion / Media | Advanced visual experience | `NOT_EXECUTED` | Antigravity-owned final cinematic/3D/media polish is intentionally outside Luna implementation |
| F13 — Full State Coverage | Cross-surface state completeness | `PASS` | Shared state boundary and feature failure states wired locally |
| F14 — Accessibility | WCAG, keyboard, focus, screen-reader gates | `PASS` | Playwright/Axe and keyboard/reduced-motion checks pass locally |
| F15 — Performance | Bundle, runtime, field-performance gates | `PASS` / `NOT_EXECUTED` | Route bundle budget passes; field CWV/Lighthouse telemetry not executed |
| F16 — Responsive / Browser / Visual Regression | Device/browser/visual verification | `PASS` | Chromium 67 passed, 3 explicit-demo skips; baselines refreshed |
| F17 — Frontend RC | Frontend release candidate | `PASS` | Typecheck, lint, build, discovered tests, browser/security gates pass locally |
| F18 — Backend Integration | Live ASP.NET/Supabase/provider integration | `BLOCKED_BY_ENV` | Collaborator/backend credentials, clean DB/RLS, provider credentials unavailable |
| F19 — Fullstack RC | End-to-end release candidate | `BLOCKED_BY_ENV` | Cannot claim production/fullstack readiness without F18 evidence |

## Dependency chain

    F00 Scope
      → F01 IA
      → F02 Foundation
      → F03 Components
      → F04 Shell
      → F05 Input
      → F06 Report
      → F07 Multimodal
      → F08 Graph + Passport
      → F09 Community
      → F10 Expert
      → F11 Landing
      → F12 Motion/Media
      → F13–F16 Quality
      → F17 Frontend RC
      → F18 Backend integration
      → F19 Fullstack RC

The sequence is a dependency model, not a claim that later phases may change earlier product ownership. All cross-pillar work preserves Trust case/revision authority.

## Non-negotiable gates

- Trust is the first visible intelligence destination on every responsive navigation surface.
- `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`, `PARTIAL`, and `UNAVAILABLE` remain explicit.
- Demo data is explicit and never silently substitutes for live data.
- Community and Expert add scoped events; they cannot directly mutate a Trust verdict.
- Passport writes are append-only and exact-revision scoped; a client card is not saved until the server confirms it.
- No new route, fourth pillar, undocumented backend shape, client secret, or feature sprawl enters without a scope change.
- Live/RLS/provider/deployment checks are `BLOCKED_BY_ENV` until the required environment exists.
- No visual handoff may alter domain state labels, contracts, route ownership, or safety semantics.

## Verification evidence

| Gate | Result |
| --- | --- |
| Foundation suite | `PASS` — 4/4 files, including 18 adapter assertions |
| Full discovered test suite | `PASS` — 265/265 test files |
| TypeScript | `PASS` — `npx tsc --noEmit --pretty false` |
| ESLint | `PASS` — 0 errors, 332 warnings |
| Production build | `PASS` — Next.js 16.3.0, static generation 117/117 |
| Bundle audit | `PASS` — Trust 334,180; Community 334,165; Expert 334,192 bytes; budget 500,000 |
| API authorization inventory | `PASS` — 137 handlers inspected |
| Dependency audit | `PASS` — 0 production vulnerabilities |
| Chromium E2E | `PASS` — 67 passed, 3 skipped for explicit demo-only cases |
| Visual regression update | `PASS` — 3/3 tests; 5 current baselines |
| Exact `agent-browser` execution | `BLOCKED_BY_ENV` — executable unavailable; Playwright fallback used |
| Field CWV/Lighthouse | `NOT_EXECUTED` |
| ASP.NET/Supabase/PostgreSQL/RLS/provider/deployment | `BLOCKED_BY_ENV` |

## Visual handoff boundary

Visual implementation is ready to begin from the contracts in `docs/visual-contracts/`. Antigravity owns typography application, spacing, color treatment, responsive composition, motion, media, 3D, and final visual polish. Antigravity must request a Luna contract change for missing data or semantic changes.

## Current next step

1. Antigravity executes the visual contracts and returns visual/accessibility evidence without changing domain or backend contracts.
2. The human owner provisions or identifies the approved ASP.NET/Supabase/PostgreSQL/RLS/provider environment.
3. Luna runs F18 live integration gates and only then evaluates F19 fullstack RC.
