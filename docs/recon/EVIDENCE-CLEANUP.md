# Recon Evidence Cleanup — 2026-09-01

## Purpose

This file is the evidence ledger for the Antigravity reconnaissance under the F00 + F01 architecture freeze. The original recon files remain useful as historical observations, but any statement that conflicts with this ledger is superseded. The ledger separates what was inspected from what was proposed or not executed.

## Evidence labels

- **VERIFIED** — directly observed in repository source, route files, test files, or a recorded local browser run.
- **INFERRED** — a bounded interpretation of verified material; useful for product decisions but not proof of runtime behavior.
- **NOT_EXECUTED** — a proposed check or behavior for which no repository or browser evidence exists in this phase.
- **BLOCKED_BY_ENV** — a check requiring unavailable external infrastructure, credentials, or a live backend.

## Verified inventory

| Item | Evidence | Status |
| --- | --- | --- |
| Framework | Next.js 16.3 / React 19 / Tailwind v4 are declared by `frontend/package.json` | VERIFIED |
| Page routes | 39 page files under `frontend/src/app`, listed in `docs/product/ROUTE_MAP.md` | VERIFIED |
| Component files | 171 files under `frontend/src/components`; 168 are code files after excluding non-code assets | VERIFIED |
| Test files | 274 files under `frontend/tests`: 261 `.mjs` and 13 `.ts` | VERIFIED |
| Canonical shell | `/trust`, `/community`, `/expert`, and `/cases` mount `UnifiedAppShell`; `GlobalAppShell` and `StudentHubOSShell` delegate to it | VERIFIED |
| Legacy shell paths | Some deferred/legacy pages still mount `ModernNavbar` or `CollapsibleSidebar` directly | VERIFIED |
| Trust graph | `TrustGraph2D` is an interactive SVG with search, filters, zoom, node buttons, inspector, and list fallback | VERIFIED |
| Trust demo boundary | Trust demo mode is enabled only by an explicit `NEXT_PUBLIC_COMPETITION_DEMO=true` flag and is labelled in the UI | VERIFIED |
| Core browser run | Desktop core routes loaded; mobile core routes showed main-content clipping caused by the MarginRail flex child | VERIFIED |
| Live database/RLS | No live RLS run is evidenced in this repository phase; external integration remains unavailable | BLOCKED_BY_ENV |
| Field performance | No field CWV or production performance telemetry was executed | NOT_EXECUTED |

## Corrected claims by reconnaissance file

| File | Correction |
| --- | --- |
| `CURRENT_SURFACE.md` | Replace 47 routes with 39; 140+ components with 171 total / 168 code files; 285 tests with 274 test files. The 135.4 KB total CSS claim and blanket passing/domain-quality claim are not established. Eight canvas systems exist in source, but simultaneous loading was not measured. |
| `ROUTE_DECISIONS.md` | The route inventory is 39, not 47. The duplicate `/academic/profile`, `/ai`, and `/contract-check` entries are removed from accounting. Final counts are 13 KEEP, 13 MERGE_INTO, 4 REMOVE, 9 POST_V1, 0 UNKNOWN. |
| `COMPONENT_AUDIT.md` | Directory counts are corrected to the measured inventory. The existence of several canvas systems is verified; simultaneous loading is not. The named shell wrappers are not three independent runtime shells, although legacy pages still bypass the canonical shell. |
| `TRUST_GAPS.md` | TrustGraph is not static/non-interactive; it is interactive but lacks stronger keyboard graph traversal and progressive evidence navigation. Trust already exposes separate risk/confidence/evidence/source-agreement concepts in the result surface; calibration and semantic density remain open. Demo disclosure exists. |
| `EXPERT_GAPS.md` | The canonical expert view already displays scope, credential/publication counts, and an expertise-is-not-authority warning. Production credential verification, case-review history, and non-seeded authority evidence were not established. |
| `COMMUNITY_GAPS.md` | The legacy `/forum` uses social counts; canonical `/community` is an observation/provenance surface. “Crypto” or institutional verification claims are unsupported by the inspected canonical view. Contribution, detail, and corroboration production behavior was not executed. |
| `USER_FLOWS.md` | The diagrams mix current behavior and target requirements. Current command search is a static navigation filter in `UnifiedAppShell`; a unified entity-search runtime was not executed. Trust actions and handoffs exist, but the target hierarchy and full cross-pillar persistence are not yet implemented. |
| `MOBILE_GAPS.md` | The verified P0 defect is shell clipping on core routes at mobile widths: the MarginRail remains a flex child and leaves the main surface around 120–146 px wide. Claims about exact touch-target measurements were not executed. |
| `PERFORMANCE_GAPS.md` | Route chunk and shared CSS measurements are recorded in `docs/frontend/PERFORMANCE.md`. Claims about 1.4 MB initial landing JS, blocking neural weights, and exact total CSS footprint were not established by this phase. Field CWV is not executed. |
| `ACCESSIBILITY_GAPS.md` | Explicit text/icon semantics are present in the Trust risk result. The mobile shell defect is verified. TrustGraph keyboard traversal, command focus trap/restoration, and full screen-reader announcements were not executed end-to-end. |
| `DESIGN_GAPS.md` | Current tokens and loaded font declarations can be inspected; “approved target standard”, purge completion, and exact status-color violations are recommendations or require a fresh visual audit, not verified facts. |
| `REMOVE_CANDIDATES.md` | Deletion is not authorized by F00/F01. `/ai` and other duplicate surfaces are consolidated or deferred according to the final route matrix. Actual removal is a later bounded phase with redirect/404, reference, privacy, and rollback checks. |

## Route accounting resolution

All 39 current page routes are accounted for in `docs/product/ROUTE_MAP.md`. Route uncertainty is therefore zero as an inventory property. Product readiness, provider truth, and external integration availability remain separate risks and are not represented as UNKNOWN routes.

## Environment boundary

The browser evidence used a local frontend run and Playwright-equivalent checks. The `agent-browser` CLI was unavailable, so no claim is made that its command set was executed. No live ASP.NET collaborator, production Supabase/RLS database, provider credentials, or production deployment was available for this freeze.

## Decision rule

F00/F01 documents may use VERIFIED facts and bounded INFERENCES. NOT_EXECUTED and BLOCKED_BY_ENV items become explicit acceptance or release gates; they must not be silently promoted to PASS, SAFE, verified, or production-ready.

## Continuous program update — 2026-09-01

The subsequent local engineering run verified the core route redirects, canonical shell/navigation, Trust input/report/multimodal state handling, TrustGraph/Passport guards, Community/Expert typed seams, privacy/auth boundaries, and responsive/accessibility behavior. The final local evidence is:

- `265/265` discovered test files pass;
- Chromium browser gate: `67` passed and `3` explicit Trust-demo cases skipped;
- typecheck and production build pass (`117/117` static pages);
- full lint has `0` errors and `332` warnings;
- route bundle budgets pass for Trust, Community, and Expert;
- API authorization inventory covers `137` handlers; production dependency audit reports `0` vulnerabilities.

The exact `agent-browser` executable was unavailable, so Playwright was used as the browser-equivalent fallback. Live ASP.NET, Supabase/PostgreSQL/RLS, production provider credentials/observability, deployment, field CWV, and human/Antigravity final visual acceptance remain `BLOCKED_BY_ENV` or `NOT_EXECUTED`; they are not promoted to VERIFIED.
