# StudentHub AI V2 Historical Frontend Audit

Date: 2026-08-28
Scope: frontend architecture, information architecture, product UX, visualization, accessibility, performance and testing. Backend, PostgreSQL, RLS, session and JWKS implementation are outside this audit.

> **Closure note (2026-08-30):** This is an archived frontend review. Current browser/build/security evidence and the release decision are in [`FINAL-AUDIT-REPORT.md`](../../FINAL-AUDIT-REPORT.md). Older counts below are historical observations, not current gates.

## Executive assessment

StudentHub has unusually deep domain logic and a broad set of working routes, but the previous frontend exposed that breadth as several unrelated products. The strongest competition narrative is now deliberately narrower:

```text
Trust detects
Community contributes evidence
Experts verify within scope
TrustGraph connects the record
```

The primary competition path is `/trust`. `/scam-check` redirects to it so there is only one canonical Trust experience. `/community` and `/expert` now share the same shell, typography, panels, state labels and evidence-first hierarchy.

## Strengths found

- Next.js 16 App Router and React 19 provide good server/client boundaries when components use them carefully.
- The repository already contains real four-layer Trust services, browser OCR, QR parsing, community stores, expert scope models and evidence-aware APIs.
- Existing semantic dark-surface tokens and the unified authenticated shell were a sound base.
- Backend truth contracts explicitly distinguish server OCR from `CLIENT_OCR_HINT`.
- Reduced-motion CSS, a skip link and visible focus patterns already existed.
- The project has substantial security and domain regression coverage, plus a production build gate.

## Main weaknesses found

- Trust, Community and Expert previously looked like separate phase dashboards, with different accent identities and dense implementation language above user outcomes.
- `/scam-check` and `/trust` duplicated the same product with different shells and radically different visual systems.
- The old Trust studio injected mock sources and evidence during evaluation. This violated the project’s `ZERO FABRICATION` rule.
- Risk, confidence, evidence sufficiency and source agreement were not presented as four distinct concepts above the fold.
- TrustGraph was not the core visual signature and the existing graph-related UI did not provide an accessible list fallback.
- Global navigation exposed too many unrelated modules and did not establish Trust, Community and Experts as the primary model.
- Raw `fetch` remains distributed across many legacy components. The new core flow begins a typed, cookie-ready API boundary, but repository-wide migration remains incomplete.
- The root layout still loads several font families and global visual providers. Core product pages use the human/machine pair, but the unused families remain a performance cleanup item.
- At the time of this review, Playwright/axe coverage had not yet been installed; the current RC has those gates and records Firefox as a host-runtime blocker.

## Route classification

Classification describes navigation priority, not code deletion.

| Route | Class | Role / recommendation |
|---|---|---|
| `/trust` | CORE | Flagship Trust flow and canonical competition demo. |
| `/community` | CORE | Student Collective Intelligence. |
| `/expert` | CORE | Domain-scoped Expert Trust Network. |
| `/dashboard` | SUPPORTING | Personal command center; keep secondary. |
| `/profile` | SUPPORTING | Personal profile. |
| `/profile/[id]` | SUPPORTING | Public profile detail. |
| `/settings` | SUPPORTING | Settings and connected sources. |
| `/settings/privacy` | SUPPORTING | Privacy and session controls. |
| `/login` | SUPPORTING | Authentication entry. |
| `/register` | SUPPORTING | Registration entry. |
| `/callback` | SUPPORTING | Authentication callback. |
| `/onboarding` | SUPPORTING | First-run setup. |
| `/` | SUPPORTING | Public/command landing, depending on session. |
| `/scam-check` | LEGACY | Compatibility redirect to `/trust`. |
| `/forum` | LEGACY | Older community UI; remove from primary navigation and converge on `/community`. |
| `/intelligence` | LEGACY | Older intelligence hub; no longer primary IA. |
| `/intelligence/ai-trust` | LEGACY | Advanced Trust studio; keep for technical inspection only. |
| `/intelligence/trust` | LEGACY | Older topic-trust view. |
| `/intelligence/community` | LEGACY | Older community studio. |
| `/intelligence/experts` | LEGACY | Older expert studio. |
| `/intelligence/evidence` | LEGACY | Supporting evidence-fusion surface. |
| `/intelligence/knowledge` | LEGACY | Supporting knowledge-object surface. |
| `/academic` | REMOVE_FROM_NAV | Valuable subsystem, outside the three-product competition path. |
| `/academic/execution` | REMOVE_FROM_NAV | Academic execution tool. |
| `/academic/planner` | REMOVE_FROM_NAV | Academic planner. |
| `/academic/profile` | REMOVE_FROM_NAV | Academic profile. |
| `/academic/roadmap` | REMOVE_FROM_NAV | Academic roadmap. |
| `/ai` | REMOVE_FROM_NAV | Generic AI studio dilutes the Trust narrative. |
| `/contract-check` | ARCHIVE | Specialized showcase; retain code, do not promote. |
| `/credit-scheduler` | ARCHIVE | Specialized showcase; retain code, do not promote. |
| `/marketplace` | ARCHIVE | Outside V2 product core. |
| `/prof-rating` | ARCHIVE | Overlaps expert/community direction and risks gamified trust. |
| `/quests` | ARCHIVE | Gamification is not part of the core trust narrative. |
| `/safety-map` | ARCHIVE | Specialized safety module. |
| `/scholarships` | ARCHIVE | Specialized academic utility. |
| `/sos` | ARCHIVE | Specialized emergency utility. |
| `/tuition-radar` | ARCHIVE | Specialized trust utility; candidate future Trust input preset. |

## Implemented frontend changes

- One primary navigation model: Trust, Community, Experts; personal destinations are secondary.
- `/trust` accepts image, pasted image, text and URL. Unsupported formats and files over 8 MB receive explicit errors.
- OCR is dynamically imported and labeled `CLIENT_OCR_HINT`; it is never presented as authoritative server OCR.
- The four analysis calls advance the UI only after actual completion. Early Layer 1 block marks external evidence as `SKIPPED`.
- Verdict separates risk, AI confidence, evidence sufficiency and source agreement.
- Missing reasons and related cases use explicit empty states rather than fabricated data.
- TrustGraph is a lazy client island with search, node filtering, zoom, selection, node inspector and list fallback. It only renders nodes derived from the current input and returned claims/sources.
- Community prioritizes first-hand evidence, warning provenance and source-reading guidance rather than vanity engagement.
- Expert discovery prioritizes domain scopes, credentials, publications and the `EXPERTISE ≠ AUTHORITY` boundary. The old reputation-points display is removed.
- Core API calls begin migration to `lib/api/` with normalized errors and `credentials: "include"`.

## Responsive and accessibility review

- Core layouts collapse to one column below tablet width.
- TrustGraph provides a list mode and node buttons are keyboard focusable.
- Upload, input modes, analysis controls and graph controls have accessible labels and disabled states.
- Status is never encoded by color alone; every state includes text.
- Reduced-motion preference is inherited from the global product CSS.
- Remaining gap: run automated axe/Playwright coverage once a browser-test dependency and CI browser runtime are approved.

## Performance assessment

- `/scam-check` no longer hydrates its previous WebGL, audio, motion and telemetry stack; it performs a server redirect.
- Tesseract OCR is loaded only when an image is analyzed.
- TrustGraph is loaded only after a verdict is available and uses a small deterministic SVG/HTML visualization without a new graph library.
- Production build passes with 102 pages. The canonical `/trust` initial JavaScript is 356,857 bytes across four chunks against the 500,000-byte budget.
- Remaining gap: the root layout still loads six font configurations and global cursor/smooth-scroll providers. Reduce to Plus Jakarta Sans plus JetBrains Mono for core product routes in a separate low-risk pass.

## Upgrade roadmap

### P0 before competition demo

1. Add Playwright with desktop/mobile Trust smoke flows and axe checks.
2. Connect a real related-case query contract; preserve the current empty state until then.
3. Add provider-level evidence status when Layer 3 exposes a stable provider contract.
4. Record a deterministic, source-backed demo fixture at the API/test layer, clearly marked as a fixture, for offline judging environments.

### P1 engineering consolidation

1. Migrate Community and Expert reads/actions to typed `lib/api/` modules.
2. Converge `/forum` on `/community` and advanced `/intelligence/*` routes on shared core components.
3. Move the canonical navigation model into one typed module consumed by desktop, mobile and command search.
4. Reduce root fonts and audit global client providers per route group.
5. Add component tests for error normalization, pipeline skip/partial behavior and TrustGraph list parity.

### P2 maximum-quality evolution

1. Add server-backed case history, campaign expansion and timestamp filtering to TrustGraph.
2. Add expert disagreement views and blind independent assessment when contracts exist.
3. Add grounded Community search facets and cited summaries only when the API supplies provenance.
4. Establish performance budgets per core route and visual regression snapshots for 360, 768, 1280 and 1440 px widths.

## Truthful blockers

- Related cases, provider status detail, expert disagreement and grounded Community summaries do not yet have stable data in the current core page contracts.
- Live database/RLS and production session proof remain backend checkpoints documented elsewhere and were not modified by this frontend pass.
- Browser E2E and automated accessibility tests remain pending because Playwright/axe are not currently installed.

## Verification record

- Targeted lint on every changed core frontend file: 0 errors, 0 warnings.
- Full repository lint: 0 errors, 336 pre-existing warnings.
- Next.js production build: pass, 102 pages.
- Bundle gate: pass, `/trust` 356,857 bytes initial JS, OCR and TrustGraph excluded until requested.
- Runtime smoke: `/trust`, `/community` and `/expert` return 200 with their expected product headings; `/scam-check` returns 307 with `Location: /trust`.
- Discovered regression gate: 239/239 test files pass.
