# Luna Max V2 implementation report

Date: 2026-09-08
Candidate: StudentHub VNext R1 to R17 local implementation pass
Status: LOCAL_CANDIDATE_PARTIAL

This report is the evidence owner for the current frontend implementation pass. It is updated after each major W phase. It does not claim production readiness, live provider readiness, WCAG compliance, competition success, or nationwide readiness.

## W00 baseline

| Item | Evidence |
| --- | --- |
| Branch | `design/academic-cinematic-product-evolution` |
| HEAD | `4b8f9fd12667bd727ebd59578902720c2e560c6c` |
| Dirty digest | `83716c2c8c5368155b6a9f7efac16ff20c1d29ad8b6129c0abcd503874a8bbb1` |
| Production build | PASS, Next.js generated 135/135 pages |
| Lint | PASS with 0 errors and 426 pre-existing warnings |
| Discovered tests | BLOCKED_BY_ENV at `frontend/tests/community_expert/phase8_live_gate.test.mjs`; `DATABASE_URL` is required |
| Type check | PASS as part of baseline production build |
| Route inventory | Core routes plus legacy course, practice, projects, quests and roadmap routes are still present |
| Existing owner work | Preserved. No reset, checkout, restore, stash, commit, push, merge, or deploy |
| Final dirty digest after this pass | `5beedaa5e258478178345b9cf0b0f31f5e8675136225e3845694a28cca244782` |

### Pre-existing worktree boundary

The following worktree classes existed before this report: realtime changes, Vault changes, frontend changes, the VNext asset pack, the V2 design handoff, existing visual test output, and asset processing scripts. They are treated as owner work. The implementation pass must only add or modify files recorded in the change ledger below.

## Execution order

| Phase | Scope | Status | Evidence |
| --- | --- | --- | --- |
| W00 | Baseline | PASS | This report and recorded command outputs |
| W01 | Scope reduction, CUT-1 public promotion and navigation | PASS | Public entrypoint contract test passed; legacy routes retained for later CUT-2 review |
| W02 | Typography | PASS | Root font contract and readable scale locked; typography contract test passed |
| W03 | Tokens | PASS | Canonical semantic layer, surfaces, motion, spacing and z-layer contract added; build passed |
| W04 | Primitives | PASS | Surface, button, evidence-state and context contracts passed |
| W05 | Shell | PASS | Route context and realtime console scoped; global layer contract passed |
| W06 | Route-aware media environment | PASS | Verified registry, poster-first policy and reduced-motion/mobile fallback passed |
| W07 | Static landing | PASS | Hero plus five chapters rendered static-first; landing video remains disabled until later visual gate |
| W08 | Trust workbench | PASS | Trust composition improved without changing runtime authority; desktop/mobile/reduced-motion browser check passed |
| W09-W12 | Graph, Community, Expert, Passport | PASS | Scoped Community/Expert/Passport composition and authority contracts passed; browser matrix passed |
| W13 | Cinematic enhancement after static gate | DEFERRED | Static-first policy intentionally keeps landing video disabled until a separate visual-release gate |
| W14-W17 | Responsive, accessibility, performance and regression | PARTIAL | Responsive and axe gates pass; root bundle passes; route transfer and live environment gates remain open |

## State and authority guardrails

- Trust verdict remains server-authoritative.
- Analysis, persistence, and provider availability remain separate UI axes.
- Community and Expert are explanatory or scoped evidence layers, not Trust writeback paths.
- Labbe remains observer and assurance only. No automatic writeback is enabled.
- Media is decorative and cannot create verdict, persistence, authorization, or expert status.
- Mobile and reduced motion default to static poster behavior.

## Change ledger

This section is completed as files change. Unrelated owner changes are not copied into this ledger.

| File | Phase | Reason | Verification |
| --- | --- | --- | --- |
| `frontend/src/components/layout/AcademicNavbar.jsx` | W01 | Removed learning/course/practice/project navigation and translated primary public labels to Vietnamese | `frontend/tests/vnext_scope_contract.test.mjs` PASS |
| `frontend/src/components/layout/navigationConfig.js` | W01 | Removed the learning navigation group from the canonical visible navigation contract | `frontend/tests/vnext_scope_contract.test.mjs` PASS |
| `frontend/src/lib/search/searchProviders.js` | W01 | Removed course, lesson, practice, roadmap and project promotion from deterministic public search | `frontend/tests/vnext_scope_contract.test.mjs` PASS |
| `frontend/src/components/command/AcademicCommandPalette.jsx` | W01 | Replaced course-oriented defaults and categories with cases/evidence-oriented defaults | `frontend/tests/vnext_scope_contract.test.mjs` PASS |
| `frontend/src/components/layout/UnifiedAppShell.jsx` | W01 | Removed course/lesson language from the visible search affordance | Static review; lint command blocked by local ESLint 10/plugin incompatibility |
| `frontend/src/app/page.jsx` | W01 | Removed the public learning continuation bar and `/learn` footer entrypoint | `frontend/tests/vnext_scope_contract.test.mjs` PASS |
| `frontend/tests/vnext_scope_contract.test.mjs` | W01 | Regression contract for public scope reduction | Node test PASS |
| `frontend/src/app/layout.tsx` | W02 | Updated product metadata to the approved Vietnamese-first proposition; existing Be Vietnam Pro/Lora/JetBrains configuration retained and verified | `frontend/tests/vnext_typography_contract.test.mjs` PASS |
| `frontend/src/app/globals.css` | W02/W03 | Added canonical type scale, family aliases, readable body minimum, semantic palette, four surfaces, focus, motion, spacing and z-layer tokens; mapped legacy aliases and removed global background image | `frontend/tests/vnext_typography_contract.test.mjs` PASS; `frontend/tests/vnext_token_contract.test.mjs` PASS; production build PASS |
| `frontend/tests/vnext_typography_contract.test.mjs` | W02 | Regression contract for Vietnamese font weights and readable scale | Node test PASS |
| `frontend/tests/vnext_token_contract.test.mjs` | W03 | Regression contract for palette, surfaces and layer policy | Node test PASS |
 
| File | Phase | Reason | Verification |
| --- | --- | --- | --- |
| frontend/src/components/ui/VNextSurface.jsx | W04 | Added semantic PAPER/INSTRUMENT/ARCHIVE/CHROME surface primitive | vnext_primitives contract PASS |
| frontend/src/components/ui/VNextButton.jsx | W04 | Added intent-based action primitive with loading state | vnext_primitives contract PASS |
| frontend/src/components/ui/EvidenceStateBadge.jsx | W04 | Added stateful evidence badge with icon, text and border treatment | vnext_primitives contract PASS |
| frontend/src/components/ui/ContextBar.jsx | W04 | Added data-backed route context strip that omits unavailable values | vnext_primitives contract PASS |
| frontend/tests/vnext_primitives_contract.test.mjs | W04 | Regression contract for the first primitive layer | Node test PASS |
| frontend/src/components/layout/UnifiedAppShell.jsx | W05 | Added truthful route context and scoped realtime console inside the authenticated shell | vnext_shell contract PASS |
| frontend/src/components/margin/MarginRail.jsx | W05 | Removed legacy cinematic rail film mapping from visible navigation | vnext_shell contract PASS |
| frontend/src/components/realtime/RealtimeLiveConsole.jsx | W05 | Kept operator realtime UI above shell chrome at the approved overlay layer | vnext_shell contract PASS |
| frontend/tests/vnext_shell_contract.test.mjs | W05 | Regression contract for shell layer ownership | Node test PASS |
| frontend/src/lib/media/vnextMediaRegistry.js | W06 | Added verified semantic media IDs and route policy with mobile/reduced-motion fallback | vnext_media contract PASS |
| frontend/src/components/providers/BackgroundContext.jsx | W06 | Resolved legacy compatibility IDs through verified media registry only | vnext_media contract PASS |
| frontend/src/components/providers/UniversalCinematicBackground.jsx | W06 | Added poster-first, route-aware and offscreen-paused enhancement behavior | vnext_media contract PASS |
| frontend/src/components/media/VerifiedPoster.jsx | W07 | Added poster rendering through semantic verified media IDs | Landing contract and browser check PASS |
| frontend/src/components/landing/VNextLandingHero.jsx | W07 | Added static-first Vietnamese hero with Trust CTA and verified poster | vnext_landing contract PASS |
| frontend/src/components/landing/VNextLandingChapter.jsx | W07 | Added reusable chapter composition for the five public product chapters | vnext_landing contract PASS |
| frontend/src/components/landing/VNextLanding.jsx | W07 | Added Trust, Evidence relationships, AI verification, Community + Expert and Safe Action chapters | Landing contract and browser check PASS |
| frontend/tests/vnext_landing_contract.test.mjs | W07 | Regression contract for static-first landing scope and chapter completeness | Node test PASS |
| frontend/src/components/trust/TrustWorkspaceClient.jsx | W08 | Replaced Trust cinematic card chrome with readable static composition; preserved input/provenance behavior | vnext_trust contract and browser check PASS |
| frontend/src/components/trust/AiTrustStudioView.jsx | W08 | Added optional hero suppression and provenance callback so SSR shell does not duplicate interactive runtime hero | vnext_trust contract; build PASS |
| frontend/tests/vnext_trust_contract.test.mjs | W08 | Regression contract for Trust hierarchy and runtime boundary | Node test PASS |
| frontend/src/app/globals.css | W08 | Added Trust hierarchy, readable type overrides, static-first surfaces and mobile app-body containment | Browser check: 390px overflow 0 |
| frontend/src/components/community/CommunityIntelligenceView.jsx | W09-W12 | Added secondary intelligence workspace treatment without promoting scoped community evidence to Trust authority | vnext_network contract PASS; responsive matrix PASS |
| frontend/src/components/expert/ExpertIntelligenceView.jsx | W09-W12 | Added secondary expert workspace treatment with explicit expertise/authority boundary | vnext_network contract PASS; responsive matrix PASS |
| frontend/src/app/globals.css | W09-W12 | Added opaque secondary workspaces, Passport archive treatment and responsive states | Responsive matrix and axe PASS |
| frontend/tests/vnext_network_contract.test.mjs | W09-W12 | Regression contract for Community/Expert scope and read-only Passport projection | Node test PASS |
| frontend/src/components/margin/Mark.jsx | W14 | Replaced invalid doc-noteref role with valid note semantics | Axe routes PASS with zero violations |
| frontend/src/components/trust/TrustPipelineTimeline.jsx | W14 | Replaced invalid article/tabpanel role combination with valid tabpanel container semantics | Axe routes PASS with zero violations |
| frontend/tests/e2e/landing-boundary.spec.ts | W14 | Updated stale landing boundary assertions to the approved Vietnamese core navigation and no-learning-promotion scope | Chromium E2E 2/2 PASS |
| frontend/scripts/check-bundle-budget.mjs | W14 | Made the root initial JavaScript budget check measure actual Next build manifest files and fail over 500 KiB | Root initial JS 428.94 KiB, PASS |

## Verification matrix

| Gate | Status | Notes |
| --- | --- | --- |
| Course promotion removed from public candidate | PASS | W01 contract covers navbar, canonical navigation, public search, command palette and landing footer. Legacy routes/data remain intentionally available pending CUT-2/CUT-4 analysis. |
| Canonical Vietnamese font mapping | PASS | Be Vietnam Pro 400/500/600/700 with Vietnamese subset, Lora selective display, JetBrains Mono technical; local contract passed |
| Semantic token consolidation | PASS | VNext semantic layer and compatibility aliases are present; remaining legacy route classes require later incremental migration |
| Static landing reviewed before video | PASS | Playwright fallback check at 1440px and 390px; five chapter IDs present, no video element, no horizontal overflow; landing video policy remains disabled |
| Trust seven-stage presenter preserved | PASS | Interactive runtime remains AiTrustStudioView; build and Trust browser check show the existing stage timeline; no provider/verdict code moved |
| Mobile 320/390/768/1024/1440 | PASS | 25/25 route/viewport checks across `/`, `/trust`, `/community`, `/expert` and `/cases`; HTTP 200, body content, no overlay, no page errors and horizontal overflow 0 |
| Reduced motion | PASS | Playwright reduced-motion checks at 390px landing and Trust; no video element and CSS motion duration is reduced by policy |
| Media request policy | PASS | Registry/browser check shows poster-only route behavior and zero rendered video elements for landing and Trust |
| Bundle budget | PASS for root initial JS; PARTIAL for route transfer | Root initial JS is 428.94 KiB against the 500 KiB budget. Route transfer remains above the same budget on Community and Expert and needs a release decision/code-split follow-up. |
| Browser and accessibility evidence | PASS with tooling note | Playwright fallback: 25/25 responsive checks pass; axe on `/`, `/trust`, `/community`, `/expert`, `/cases` at 1440px reports zero violations. `agent-browser` is unavailable in this environment. |
| Full lint | PASS | 0 errors, 424 warnings; warnings are repository-wide legacy findings and are not treated as a clean production gate |

## W14-W17 evidence tables

### Responsive route matrix

| Routes | Viewports | Result | Checks |
| --- | --- | --- | --- |
| `/`, `/trust`, `/community`, `/expert`, `/cases` | 320x900, 390x844, 768x900, 1024x800, 1440x900 | PASS, 25/25 | HTTP 200, non-empty body, expected heading, no horizontal overflow, no video element, no overlay, no page errors |

### Accessibility

| Tool/gate | Result | Scope |
| --- | --- | --- |
| axe-core Playwright | PASS | `/`, `/trust`, `/community`, `/expert`, `/cases` at 1440px; `violations: []` for every route |
| Landing boundary E2E | PASS | Chromium, 2/2 tests; Vietnamese core navigation present and learning extension not promoted |
| agent-browser | BLOCKED_BY_ENV | CLI is not installed; Playwright was used as the documented fallback |

### Browser performance snapshot against local production server

These are local measurements, not production SLO evidence. They expose route transfer risk rather than hiding it.

| Route | DCL | Load | FCP | JS requests | JS decoded | JS transfer | Video elements | Overflow |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 161 ms | 177 ms | 156 ms | 23 | 993,553 B | 328,407 B | 0 | 0 |
| `/trust` | 59 ms | 156 ms | 208 ms | 29 | 1,548,767 B | 481,386 B | 0 | 0 |
| `/community` | 28 ms | 127 ms | 168 ms | 29 | 1,952,939 B | 602,039 B | 0 | 0 |
| `/expert` | 54 ms | 133 ms | 168 ms | 32 | 1,765,123 B | 538,915 B | 0 | 0 |
| `/cases` | 28 ms | 156 ms | 168 ms | 26 | 1,388,949 B | 432,316 B | 0 | 0 |

### Bundle budget

| Measurement | Result | Evidence |
| --- | --- | --- |
| Root initial JavaScript | PASS | 439,236 bytes / 428.94 KiB, 6 files, budget 512,000 bytes / 500 KiB |
| Route-level transfer budget | PARTIAL | Community 602,039 B and Expert 538,915 B exceed 500 KiB; code-splitting or an explicit route budget is required before a final competitive release decision |

### Regression and environment gates

| Command/gate | Result | Evidence |
| --- | --- | --- |
| `node --test` VNext contracts | PASS | 9/9 tests passed |
| `npm run build` | PASS | Next.js 16.3.0; 135/135 generated routes |
| `npm run lint` | PASS with warnings | 0 errors, 424 repository-wide warnings |
| `npm run test:all-discovered` | BLOCKED_BY_ENV | Suite reaches the Community/Expert Phase 8 live gate, which fails because `DATABASE_URL` is not set; durable production state was not available |
| `npm run test:e2e:staging` | BLOCKED_BY_ENV | `STUDENTHUB_STAGING_BASE_URL` and `STUDENTHUB_STAGING_CASES_PATH` are missing |

## Scope and authority confirmation

- The approved order was followed through W00 → W12. Static landing was implemented and checked before any video enhancement.
- W13 cinematic enhancement is deliberately deferred. The landing policy keeps `videoEligible: false`; mobile and reduced-motion remain poster/static-first.
- Trust keeps its existing seven-stage runtime presenter and server-authoritative verdict path. The pass changes composition, readability and responsive containment only.
- Community, Expert and Passport remain scoped explanatory/read-only lanes. No Trust verdict writeback, expert activation/revocation, Community moderation or user banning bridge was added.
- No automatic writeback was enabled. No backend, database, auth, realtime, Labbe or AI pipeline implementation was changed in this pass.
- Legacy course/LMS routes and data remain present but are no longer promoted by the public candidate navigation/search/landing. Destructive deletion is intentionally deferred to a separately authorized CUT-2/CUT-4 pass.

## Known blockers for Principal Release Audit

1. Staging base URL/case path and database credentials are unavailable, so live staging and durable live-gate evidence cannot be claimed.
2. The `agent-browser` binary is unavailable; the evidence uses Playwright fallback, with axe results recorded separately.
3. Community and Expert route JavaScript transfer exceeds the 500 KiB target and needs route-level code-splitting or an approved budget exception.
4. Repository lint has 424 warnings even though it has zero errors; warning ownership and burn-down remain release-audit work.
5. W13 video/cinematic enhancement is not a verified candidate feature yet and remains disabled by policy.
6. The implementation has not been deployed, production-tested, or judged against a competition rubric. This report makes no production-readiness claim.

## Final verdict

STUDENTHUB_VNEXT_LOCAL_CANDIDATE_PARTIAL

The local frontend candidate is evidence-backed through W00-W12, with responsive and accessibility gates passing. It is not a final release candidate: staging/live-database gates are `BLOCKED_BY_ENV`, route transfer has a known performance issue, and W13 cinematic enhancement remains intentionally deferred. The next authorized step is the Principal Release Audit against this report, followed by environment-backed staging verification and a focused route-bundle remediation pass.
