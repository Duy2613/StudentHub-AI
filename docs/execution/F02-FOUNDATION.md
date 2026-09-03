# F02 — Foundation

**Status:** `COMPLETE_AND_ABSORBED_IN_CONTINUOUS_PROGRAM`  
**Owner:** Luna Max  
**Depends on:** F00 Scope Freeze + F01 Information Architecture  
**Authority:** `docs/product/*`, `docs/architecture/FRONTEND_ARCHITECTURE.md`, `docs/contracts/*`  
**Date:** 2026-09-01

## GOAL

Create the executable engineering foundation for the frozen product: semantic design tokens, typed contracts, canonical UI state semantics, explicit backend adapters, and architecture cleanup that makes the dependency direction enforceable.

F02 prepares the seams consumed by F03 Component System and F04 App Shell. It does not implement the component system, app shell, navigation, mobile navigation, Trust input/report, or visual polish.

## WHY

The current frontend has useful API/schema modules and a working baseline, but provider selection, state semantics, token ownership, and feature/backend responsibilities are distributed. The shell and route structure also contain known adoption gaps, but their implementation belongs to F04. Establishing contracts first prevents F03/F04 and later Trust work from encoding contradictory states or undocumented backend assumptions.

F02 is the smallest foundation phase that can be completed without waiting for the unavailable ASP.NET collaborator or inventing live infrastructure.

## CURRENT STATE (AT F02 ENTRY)

- F00/F01 freeze Trust P0, Community P1, Expert P1, supporting platform routes, route dispositions, hierarchy, and superflows.
- 39 page routes exist under `frontend/src/app`; route ownership is documented but canonical navigation metadata is not yet an executable single source.
- `UnifiedAppShell` is the selected future shell owner, but shell/nav/mobile implementation is deliberately reserved for F04.
- `frontend/src/lib/api/client.ts` already provided timeout, abort propagation, credentials, trace IDs, transport errors, and response parsing; safe request IDs/retryability/redaction were not yet consolidated.
- Trust, Community, and Expert had typed API/schema modules, but there was no single domain-safe provider port/factory shared by Demo and future Live modes.
- Trust had detailed pipeline states, while cross-pillar UI states were not yet represented by one runtime envelope and transition guard.
- `frontend/src/app/globals.css` contains multiple token eras and aliases; semantic layering and ownership need normalization before F03 components consume them.
- Existing test inventory at entry was 274 files (`261 .mjs`, `13 .ts`); a blanket pass rate was not claimed.
- Live ASP.NET, production Supabase/RLS, provider credentials, and field performance evidence are unavailable or not executed.
- The mobile MarginRail clipping defect is verified, but fixing shell layout is an F04 acceptance item, not an F02 implementation item.

## IMPLEMENTED STATE

- `frontend/src/lib/ui-state/model.ts` now owns the canonical state envelope, state transitions, request/run stale guards, Trust uncertainty invariant, and error-to-state mapping.
- `frontend/src/lib/backend/ports.ts` now owns runtime-validated Trust, Community, Expert, Passport, provider-status, provenance, command-scope, and provider-result contracts.
- `frontend/src/lib/backend/providerFactory.ts` requires an explicit `DEMO` or `LIVE` mode and rejects a demo bundle in the live slot.
- `DemoProvider` is deterministic, labelled, and network-free. `FutureLiveProvider` is live-mode but returns typed `UNAVAILABLE` until live infrastructure is configured; it never imports or selects demo fixtures.
- `ApiProviderAdapter` is the only F02 adapter allowed to import current API transport modules. It validates caller input and responses, normalizes supported DTOs, and returns typed unavailable/contract-limited results for unsupported capabilities.
- `apiRequest` and Trust streaming now propagate bounded request identity, abort/timeout, safe messages, schema failures, and retryability without raw provider messages.
- `globals.css` adds primitive, semantic, status, component, typography, spacing, motion, and reduced-motion token aliases while preserving baseline values. No component, shell, route, or advanced visual work was changed.

## TARGET STATE

- Primitive, semantic, and component-token layers are named and documented without changing the approved visual identity or adding visual polish.
- Contracts are runtime-validated at boundaries and distinguish domain result, provenance, unknowns, partial data, conflicts, unavailable dependencies, and transport errors.
- Trust, Community, Expert, and Passport features use one shared UI state envelope with request/run stale-response guards.
- `DemoProvider` is deterministic and explicit; `FutureLiveProvider` is an explicit unavailable/live boundary with no silent fallback.
- Existing API modules are transport implementations behind a domain-safe adapter facade; leaf UI does not call raw fetch, Supabase, SDKs, or backend DTOs.
- Architecture checks document/enforce the dependency direction: UI → Feature → Domain → Contract/Schema → Provider Port → Adapter → Data.
- F03 can build primitives and variants against stable semantic tokens and states; F04 can implement the already-decided shell/nav/mobile architecture without changing contracts.

## IN SCOPE

1. Normalize the design-token foundation into primitive → semantic → component layers.
2. Preserve current values unless a token alias/semantic naming correction is required; do not introduce a new visual direction.
3. Define token categories for surface, ink, border, status, spacing, radius, typography roles, and motion/reduced-motion semantics for later consumers.
4. Add typed provider/domain contracts and runtime schema guards for Trust, Community, Expert, and Passport boundaries.
5. Add explicit `DemoProvider`, `FutureLiveProvider`, provider factory, adapter result/error mapping, provenance, and no-fallback behavior.
6. Add the shared UI state envelope and transition/stale-run guards from `docs/contracts/UI_STATE_MODEL.md`.
7. Wrap existing `frontend/src/lib/api` transport modules without renaming or inventing backend endpoints.
8. Add architecture boundary checks and focused unit/contract tests.
9. Update only foundation documentation required to describe implemented contracts.

## OUT OF SCOPE

- unified shell, app navigation, desktop/tablet/mobile navigation, account/search placement, or the mobile MarginRail fix; these belong to F04;
- primitives, variants, component states, responsive component behavior, or component-system polish; these belong to F03;
- Trust URL/text/screenshot/QR/upload implementation; these belong to F05;
- Trust Level 1/2/3 report redesign, advanced TrustGraph, Passport UI, Community UX, or Expert UX;
- new landing visual direction, colors as a visual redesign, typography redesign, GSAP, Framer Motion, 3D, WebGL, canvas, media, or cinematic polish;
- implementing ASP.NET, Supabase schema/RLS, production credentials, live provider behavior, deployment, or database migrations;
- inventing endpoints, provider findings, OCR coordinates, expert verification, community truth, or persistence behavior;
- deleting or redirecting route folders, adding a route, adding a fourth pillar, or promoting POST_V1/REMOVE features;
- broad source cleanup unrelated to token, contract, state, adapter, or dependency-boundary work.

## FILES EXPECTED

Expected changes are limited to these paths and directly paired tests. The implementer may combine small modules if the same boundaries remain explicit.

### Token foundation

- `frontend/src/app/globals.css` — normalize semantic token aliases and categories without visual redesign
- `docs/design/DESIGN_TOKENS.md` — only if the design-token documentation tree is created in this phase; no component visual spec

### Contract, state, and adapter foundation

- `frontend/src/lib/backend/ports.ts` — provider/domain port types
- `frontend/src/lib/backend/providerFactory.ts` — explicit provider mode selection
- `frontend/src/lib/backend/providers/DemoProvider.ts` — deterministic fixture provider
- `frontend/src/lib/backend/providers/FutureLiveProvider.ts` — explicit unavailable/live boundary
- `frontend/src/lib/backend/adapters/ApiProviderAdapter.ts` — transport-to-domain normalization
- `frontend/src/lib/ui-state/model.ts` — shared state envelope, transitions, and stale guards
- existing `frontend/src/lib/api/client.ts`, `frontend/src/lib/api/trust.ts`, `frontend/src/lib/api/community.ts`, and `frontend/src/lib/api/experts.ts` only when needed to expose the frozen contracts without changing endpoint meaning

### Tests

- `frontend/tests/foundation/tokens-contract.test.mjs`
- `frontend/tests/foundation/backend-adapter.test.mjs`
- `frontend/tests/foundation/ui-state-model.test.mjs`
- `frontend/tests/foundation/architecture-boundary.test.mjs`
- `frontend/tests/foundation/ts-extension-loader.mjs` — test-only Node TypeScript extensionless-import loader
- existing Trust/API contract tests only when assertions must align with the frozen state/provenance semantics

## FILES NOT TO TOUCH

- `frontend/src/components/layout/UnifiedAppShell.jsx`, `GlobalAppShell.jsx`, `StudentHubOSShell.jsx`, `ModernNavbar.jsx`, `CollapsibleSidebar.jsx`, and `frontend/src/components/margin/MarginRail.jsx`; shell/nav work belongs to F04;
- route page files under `frontend/src/app` for navigation, redirects, deletion, or feature changes;
- `frontend/src/components/landing/**`, `frontend/src/components/ultra/**`, `frontend/src/components/visual/**`, and media/canvas assets;
- `frontend/src/components/ui/**`, `frontend/src/components/trust/**`, `frontend/src/components/community/**`, `frontend/src/components/expert/**`, and `frontend/src/components/competition/**` presentation code, except a type-only import if unavoidable;
- Supabase migrations, database schema, RLS policies, backend/ASP.NET code, provider credentials, `.env*`, deployment configuration, or package upgrades;
- unrelated Academic, Safety, Scholarship, Tuition, SOS, Forum, Marketplace, Quests, or Ultra domain logic.

If a not-touch path is required for a contract/security fix, stop and request a scope decision rather than expanding F02.

## ARCHITECTURE CHANGES

1. Introduce semantic token ownership so future components consume named roles rather than route-local raw values. Existing values remain baseline unless a safe alias correction is required.
2. Introduce a domain-safe provider port and explicit factory under `frontend/src/lib/backend`.
3. Keep transport concerns in `frontend/src/lib/api`; adapters validate and normalize at the boundary.
4. Implement DemoProvider and an explicit unavailable FutureLiveProvider without a hidden fallback path.
5. Centralize shared UI state and request/run identity guards; feature phases remain nested under the envelope.
6. Add a dependency-boundary test/check preventing leaf UI from importing transport clients, Supabase, provider SDKs, or privileged modules.
7. Record the selected `UnifiedAppShell` and navigation architecture as F04 consumers, but do not migrate shell code in F02.

## CONTRACT CHANGES

- Implement the state envelope and vocabulary in `docs/contracts/UI_STATE_MODEL.md` as runtime types/guards.
- Implement the provider port and adapter result/error semantics in `docs/contracts/BACKEND_ADAPTER_SPEC.md` as runtime types/schemas.
- Require explicit provenance (`DEMO_FIXTURE`, user-supplied, community, expert, or approved live) where a result is displayed.
- Preserve current versioned endpoints from `docs/API-CONTRACTS.md`; no new business endpoint is approved.
- Normalize partial, unknown, insufficient, conflict, unavailable, error, offline, auth, forbidden, timeout, schema mismatch, and cancellation behavior.
- Require `caseId`/revision scope for cross-pillar commands and `requestId`/`runId` for asynchronous work.
- Define semantic token roles and fallback/reduced-motion behavior without changing component variants; variants belong to F03.

## SECURITY RISKS

| Risk | Mitigation / acceptance |
| --- | --- |
| Provider mode spoofing or silent demo fallback | Explicit factory mode; live-unavailable returns `UNAVAILABLE`; no fallback test |
| Secrets in client bundle | Server-only provider credentials; client import/bundle scan |
| Raw URL/image/document input bypasses safe boundary | Preserve server-side SSRF, MIME, size, egress, and content validation |
| Cross-pillar data leakage | Validate IDs, ownership, case/revision scope, and public projections |
| Replay/duplicate writes | Idempotency keys and stale revision conflict semantics |
| Stale response changes Trust state | request/run identity guard and abort/late-response tests |
| Raw provider/PII error leakage | Safe typed errors, redacted logging, and schema validation |
| Token state hides uncertainty | Semantic status roles must preserve text meaning; no color-only state mapping |

## PERFORMANCE RISKS

- A new adapter layer must not duplicate request or schema parsing; reuse `apiRequest` and parse once at the boundary.
- Token and state modules must be small and synchronous; no OCR, graph, model, provider SDK, or canvas import in the foundation entry path.
- DemoProvider must be deterministic and network-free.
- Requests retain bounded payloads, timeouts, abort signals, and idempotent mutation rules.
- New token aliases must not add a second large global stylesheet or duplicate font/media loading.
- F02 records a repeatable bundle/static-import check where tooling exists; field CWV and route shell performance remain later gates.

## ACCEPTANCE CRITERIA

F02 may be marked complete only when:

1. Token layers and ownership are documented and runtime code has semantic aliases for the required categories without a visual redesign.
2. Trust, Community, Expert, and Passport boundary contracts validate success, empty, partial, unknown, insufficient, conflict, unavailable, error, offline, auth, forbidden, and demo cases.
3. DemoProvider is deterministic, explicitly selected, provenance-labelled, and makes no network request.
4. FutureLiveProvider returns typed unavailable/configuration state when not configured and never silently falls back to DemoProvider.
5. Leaf UI cannot import raw transport, Supabase, provider SDK, secrets, or backend DTOs through the tested dependency boundary.
6. Shared UI state guards prevent stale request/run responses from overwriting current state.
7. Cross-pillar commands preserve case/revision scope and cannot directly mutate a Trust verdict.
8. Existing versioned endpoint names and business verdict semantics remain unchanged.
9. Foundation tests cover invalid input, timeout, abort, schema mismatch, provider partial/error, unknown, insufficient, conflict, unavailable, offline, auth, forbidden, and explicit demo mode.
10. Targeted lint/type/build/unit checks pass; unavailable live/RLS checks are recorded `BLOCKED_BY_ENV`, not PASS.
11. No shell/nav/mobile behavior, component variants, Trust presentation, route, backend, database, visual polish, or unrelated feature changed.

## TESTS

### Unit/contract

- assert token role presence, semantic aliases, no duplicate/conflicting state names, and no raw-token requirement for new foundation consumers;
- assert provider-port schemas and all canonical edge states;
- assert DemoProvider deterministic output, stable fixture IDs, provenance, and no network;
- assert FutureLiveProvider unavailable/configuration behavior and no-fallback invariant;
- assert adapter transport-error mapping, timeout, abort, invalid JSON, schema mismatch, idempotency, and stale-run guard;
- assert Trust/Community/Expert/Passport commands carry required case/revision/ownership scope;
- assert dependency direction through import-boundary checks.

### Regression/build

- run existing API, Trust, Community, Expert, and Case Lab contract tests affected by the new facade;
- run targeted lint, typecheck/build, and foundation unit tests;
- record source/bundle static-import evidence for heavy provider/visual modules;
- do not run or report live backend/RLS as passing when the environment is absent.

Responsive browser, shell navigation, component states, and accessibility behavior were originally F03/F04 gates. They are recorded below as later continuous-program evidence, while this file retains the original F02 scope for traceability.

## EXECUTION EVIDENCE

| Gate | Result |
| --- | --- |
| Focused foundation suite | `PASS` — 4/4 files, including 18 adapter assertions |
| TypeScript (`npx tsc --noEmit --pretty false`) | `PASS` |
| Targeted ESLint for F02 modules | `PASS` |
| Full ESLint (`npm run lint`) | `PASS` — 0 errors, 332 repository warnings |
| Trust V5 sequential regression | `PASS` — 62/62 |
| Canonical API runtime regression | `PASS` — 1/1 |
| Canonical v1 API contract regression | `PASS` — 2/2 |
| P0 runtime route regression | `PASS` — 1/1 |
| Route contract regression | `PASS` — 2/2 |
| Auth resilience regression | `PASS` — 14/14 |
| Production build (`npm run build`) | `PASS` — Next.js 16.3.0, static generation 117/117 |
| Live ASP.NET/provider integration | `BLOCKED_BY_ENV` |
| Live PostgreSQL/Supabase/RLS integration | `BLOCKED_BY_ENV` |
| Full discovered suite | `PASS` — 265/265 test files |
| Chromium browser/accessibility/responsive/visual regression | `PASS` — 67 passed, 3 explicit-demo skips |
| Bundle audit | `PASS` — Trust 334,180; Community 334,165; Expert 334,192 bytes |
| Field CWV/Lighthouse | `NOT_EXECUTED` |

The original F02 implementation changed no endpoint names, backend files, database/RLS files, or provider assumptions. The later continuous program consumed these seams to update route compatibility, shell composition, feature state handling, and tests; those later changes are accountable in `docs/reports/LUNA_FULL_COMPLETION_REPORT.md`. No commit or push was performed.

## ROLLBACK

F02 is one bounded foundation change. If acceptance fails, revert the F02 implementation commit or disable its explicit adapter/token feature flag, restore the previous transport imports, and retain the F00/F01 documents. Do not delete route folders, fixtures, data, or legacy shell code. Rerun contract, Trust error, no-fallback, and dependency-boundary tests after rollback.

## STOP CONDITIONS

Stop F02 and return to Luna/human owner when:

- implementation requires an undocumented backend endpoint, database table, RLS rule, or provider behavior;
- live failure would require silent DemoProvider fallback;
- a shell/nav/mobile fix or component variant becomes necessary to finish the foundation;
- a new route, fourth pillar, or deferred feature is proposed;
- Community/Expert must directly mutate a Trust verdict;
- a visual redesign, advanced TrustGraph/scoring change, media/motion system, or landing change is requested;
- a secret, privileged client operation, unsafe URL fetch, or unbounded upload is introduced;
- token normalization changes the approved visual direction rather than establishing semantic ownership;
- state contracts conflict or route/product ownership no longer agrees with F00/F01;
- live/RLS evidence is required but the environment remains unavailable.

F02 is complete and its contracts are consumed by the continuous program. Advanced visual/cinematic work remains Antigravity-owned; live backend/Supabase/RLS/provider/deployment verification remains `BLOCKED_BY_ENV`.

## Continuous-program disposition

This specification is the historical foundation phase requested by F00/F01. The implementation program subsequently completed the technically achievable F03–F17 local work and generated the visual handoff package. It did not create another numbered implementation specification, because the master execution prompt requested exactly one implementation phase document. The next operational handoff is `READY_FOR_ANTIGRAVITY`; the next environment-gated engineering phase is F18.
