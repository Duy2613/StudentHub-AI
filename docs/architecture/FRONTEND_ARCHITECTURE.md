# StudentHub AI — Canonical Frontend Architecture

**Phase:** Stages 00–24 continuous engineering program  
**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01

## Decision summary

The frontend remains a Next.js App Router modular monolith with one effective internal app shell, one navigation configuration target, typed domain contracts, and an explicit provider port. The current `frontend/src/lib/api` layer is retained as the transport/schema seam during migration. The continuous program implements the required non-visual seams incrementally; it does not rewrite unrelated features or claim final visual direction.

| Foundation decision | Canonical choice |
| --- | --- |
| App shell | `frontend/src/components/layout/UnifiedAppShell.jsx` |
| Navigation | One route metadata/config source consumed by every responsive presentation |
| Contract layer | Versioned domain/runtime schemas at the adapter boundary; current schemas under `frontend/src/lib/api/schemas`, with the F02 provider port in `frontend/src/lib/backend` |
| Frontend/backend boundary | Feature/domain use case → provider port → explicit adapter → existing transport client → same-origin backend |
| UI state | Shared envelope and guards defined in `docs/contracts/UI_STATE_MODEL.md` and implemented under `frontend/src/lib/ui-state` |

## Dependency direction

The only permitted direction for new or migrated code is:

    Route page / shell composition
        ↓
    Feature view/controller
        ↓
    Domain use case and state reducer
        ↓
    Contract types + runtime schemas
        ↓
    Provider interface
        ↓
    DemoProvider or FutureLiveProvider adapter
        ↓
    Same-origin API / Supabase / approved external provider

Reverse dependencies are prohibited. UI components must not import database clients, provider SDKs, secrets, or raw backend DTOs. Domain logic must not import React or visual tokens.

## Current baseline

### Routing and shell

- The current page tree has 39 routes; canonical ownership is frozen in `docs/product/ROUTE_MAP.md`.
- `UnifiedAppShell.jsx` is the effective canonical internal shell.
- `GlobalAppShell.jsx` and `StudentHubOSShell.jsx` currently delegate to `UnifiedAppShell`; they are compatibility wrapper names, not independent product shells.
- Some legacy/deferred pages still mount `ModernNavbar` or `CollapsibleSidebar` directly. They are migration exceptions and must not define new IA.

### Data and transport

- `frontend/src/lib/api/client.ts` provides timeout, abort propagation, credentials, status mapping, trace IDs, and runtime schema parsing.
- Trust, Community, Expert, and Passport have typed API modules/schemas; the continuous program adds `frontend/src/lib/backend/ports.ts`, `providerFactory.ts`, deterministic Demo/FutureLive providers, and `ApiProviderAdapter.ts` as the domain-safe seam. Existing legacy direct-fetch responsibilities remain outside the migrated boundary until their owning phase.
- The current frontend can run without the collaborator ASP.NET backend. Live backend and RLS proof are not available in this phase.

### UI state

Trust already has detailed pipeline states in the existing verification specification. The canonical cross-pillar state model and transition rules are implemented in `frontend/src/lib/ui-state/model.ts` and documented in `docs/contracts/UI_STATE_MODEL.md` so that feature-specific state machines do not drift.

## Canonical shell decision

`UnifiedAppShell` is the single effective internal shell. It owns only platform composition:

- route-aware navigation;
- responsive navigation presentation;
- global command/search entry;
- account/profile/settings entry;
- shell-level status and context affordances;
- keyboard/focus lifecycle for shell controls.

It does not own Trust verdict logic, Community observation logic, Expert assessment logic, or Passport persistence. The shell receives typed display state and callbacks from feature boundaries.

F02 may change layout mechanics needed to fix mobile clipping, but it must preserve the frozen route order and state semantics. Visual polish, new motion, and advanced TrustGraph redesign remain out of scope.

## Canonical navigation decision

Navigation is data-driven from one route metadata/configuration source. It distinguishes:

- `KEEP` canonical destinations;
- `MERGE_INTO` compatibility aliases;
- `POST_V1` deferred routes;
- `REMOVE` routes pending a removal gate;
- auth/protocol routes that are not regular navigation items.

The configuration must be consumed by desktop, tablet, mobile, command overlay, active-state logic, and redirect tests. A component must not maintain a second hard-coded product nav list.

Canonical intelligence order is Trust, Community, Expert, Case Lab. Dashboard is the personal destination; Profile and Settings are account destinations. Trust is first everywhere.

## Feature boundaries

### Trust feature

Owns input normalization, investigation orchestration, case identity, report semantics, evidence navigation, TrustGraph, action handoffs, and Passport events. It consumes Community/Expert events through contracts and never treats a fixture as live evidence.

### Community feature

Owns observation listing/detail, source/context/time/evidence metadata, corroboration submission, moderation state, and case-link events. It does not own Trust verdict state.

### Expert feature

Owns scoped expert discovery, authority/credential display, assessment request, review state, evidence-reviewed identifiers, limitations, and assessment revision. It does not own a global rating or Trust verdict.

### Platform feature

Owns auth/session, onboarding, Dashboard, Profile, Settings, Privacy, navigation, and route access. It may list or link cases subject to ownership/privacy; it cannot rewrite domain evidence.

## Provider and adapter boundary

The canonical application depends on a provider port, not on a concrete backend. The provider port returns typed domain results and typed failures/state. F02 implements:

- `DemoProvider`: deterministic local fixtures, explicit selection, stable IDs, `DEMO_FIXTURE` provenance, no live-looking claim, no hidden network;
- `FutureLiveProvider`: the explicit future ASP.NET/Supabase/provider boundary. Until configured and contract-verified it returns `UNAVAILABLE` or a typed configuration error;
- no automatic live-to-demo fallback;
- no demo-to-live claim promotion;
- explicit provider mode in logs/response metadata where safe.

The current `frontend/src/lib/api` modules are wrapped by `ApiProviderAdapter` where the existing endpoint capability is approved. The adapter normalizes transport errors and schemas at the boundary; feature code receives domain-safe results, not `Response` objects. Unsupported capabilities remain typed unavailable rather than being guessed.

## Server/client boundary

- Browser components may call approved same-origin route handlers through the adapter/facade.
- Supabase service-role keys, provider secrets, and privileged database access remain server-only.
- Client input is validated for size/type/format, but server validation and authorization are mandatory.
- User/case/profile identifiers from URLs are untrusted and require schema validation, ownership checks, and privacy filtering.
- Abort, timeout, rate-limit, and trace identity are preserved across the boundary.
- Raw sensitive input, OCR data, attachments, and Passport history follow the privacy/retention contract.

## Rendering and loading boundary

- Route pages compose features; they do not orchestrate provider calls directly.
- Heavy OCR, QR, graph, model, and canvas modules must be lazy or route-scoped where possible.
- Long operations expose a truthful `runId`/state contract; the client never creates fake progress.
- A loading shell may render structure but not a fabricated report.
- Reduced motion, keyboard access, and text state semantics are architectural acceptance criteria, not optional visual polish.

## Error and truth boundary

Every adapter result maps to the shared states in `UI_STATE_MODEL.md`. Transport failure is not evidence. Missing provider data is not safe. Schema mismatch is a contract error. Partial results identify the missing provider/stage. The UI never infers verdict, confidence, provenance, or coordinates from a missing field.

## Testing boundary

Tests are layered:

1. contract/schema tests for valid, unknown, partial, conflict, unavailable, and malformed responses;
2. provider tests proving DemoProvider determinism and no network;
3. adapter tests proving live-unavailable/no-fallback behavior;
4. feature state-machine tests for transitions and stale-run cancellation;
5. route/navigation tests for all 39 dispositions and canonical links;
6. browser/accessibility/responsive tests for shell composition and core flows;
7. live integration/RLS tests only when the required environment exists, labelled `BLOCKED_BY_ENV` otherwise.

## Architecture invariants

- One canonical shell and one canonical nav source.
- One owner per domain concept.
- One provider port for DemoProvider and FutureLiveProvider.
- No raw fetch in leaf UI components.
- No secrets in client bundles.
- No silent fallback or fabricated progress.
- No visual change may alter domain state labels, contract fields, or route ownership without Luna approval.

## Continuous program implementation evidence

- Canonical UI state/error/provider runtime modules are present under `frontend/src/lib/ui-state`, `frontend/src/lib/api`, and `frontend/src/lib/backend`.
- `DemoProvider` is deterministic and network-free; `FutureLiveProvider` is explicit live-mode unavailable; a provider bundle carries mode, source mode, and availability so a demo bundle cannot occupy the live slot silently.
- `apiRequest` preserves same-origin credentials, bounded timeout, abort, request identity, schema validation, safe errors, and explicit retryability.
- Foundation suite: `4/4 files PASS`, including `18` adapter assertions; full discovered suite: `265/265 PASS`.
- Chromium browser suite: `67 passed`, `3 skipped` (the skipped cases require explicit Trust demo mode); visual baselines were regenerated and pass.
- TypeScript: `PASS`; full ESLint: `PASS` with `0` errors and `332` warnings; production build: `PASS`, `117/117` static pages; dependency audit: `0` vulnerabilities.
- Bundle audit: `/trust` `334,180` bytes, `/community` `334,165` bytes, `/expert` `334,192` bytes, each under the `500,000` byte route budget.
- API authorization inventory: `PASS`, `137` handlers inspected. Live ASP.NET/Supabase/RLS/provider/deployment proof is `BLOCKED_BY_ENV`; the exact `agent-browser` executable was unavailable and Playwright was used as the browser fallback.
