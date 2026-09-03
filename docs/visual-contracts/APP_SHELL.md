# Visual Handoff Contract — Canonical App Shell

**Feature:** Canonical StudentHub AI app shell  
**Owner:** Antigravity 3.7 Flash High for visual implementation; Luna Max for product/engineering contracts  
**Status:** `READY_FOR_ANTIGRAVITY`  
**Depends on:** Continuous local engineering program; structural F03/F04 shell baseline is already present  
**Date:** 2026-09-01

## FEATURE

Implement the visual experience of the existing canonical `UnifiedAppShell` without changing route ownership, domain meaning, provider contracts, or Trust safety semantics.

This is a bounded shell handoff. It is not a redesign of Trust Report, TrustGraph, Evidence Passport, Community, Expert, Landing, or the whole application.

## USER GOAL

Students can move between Trust, Community, Expert, Case Lab, personal workspace, search, and account/settings destinations with an obvious hierarchy and a predictable responsive shell. Trust must remain the first and visibly flagship intelligence destination.

## INFORMATION HIERARCHY

1. Brand and global context.
2. Primary intelligence destinations: Trust, Community, Expert.
3. Supporting intelligence/workspace destination: Case Lab.
4. Personal destination: Dashboard.
5. Utility actions: search/command entry, profile, settings, sign out where the existing auth boundary permits.
6. Page content supplied by the route/feature; the shell does not invent domain results.

## ROUTES

Canonical shell destinations:

- `/trust` — primary Trust investigation/report surface;
- `/community` — Community observations/corroboration;
- `/expert` — scoped Expert discovery/escalation;
- `/cases` — Case Lab/workspace;
- `/dashboard` — personal workspace;
- `/profile` and `/settings` — account/settings surfaces.

`/settings/privacy` remains an account/settings child. `/scam-check`, `/contract-check`, `/ai`, and `/intelligence/*` are compatibility/deep-link routes governed by `docs/product/ROUTE_MAP.md`; they must not become a second primary navigation system. Auth/protocol routes (`/login`, `/register`, `/callback`, `/onboarding`) are not regular primary nav items.

## NAVIGATION SEMANTICS

- Trust is first in desktop, tablet, mobile, command/search, and active-route logic.
- Community and Expert are sibling pillars; neither is a Trust verdict authority.
- Case Lab is supporting workspace, not a fourth pillar.
- Active state is derived from canonical route metadata and nested route matching, not a second hard-coded list.
- Compatibility aliases retain defined redirect/deep-link behavior; the shell does not expose `REMOVE` or `POST_V1` routes as primary destinations.
- Search is a utility entry point into approved search semantics; it must not perform arbitrary browser navigation or invent entity results.
- Account/settings actions use the existing auth/session boundary and must not expose private data when `AUTH_REQUIRED` or `FORBIDDEN`.

## REQUIRED STATES

The shell and shell-owned controls must consume the F02 semantic state model, including:

- `IDLE`, `LOADING`, `SUCCESS`, `EMPTY`, `PARTIAL`;
- `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`;
- `UNAVAILABLE`, `ERROR`, `OFFLINE`, `CANCELLED`;
- `AUTH_REQUIRED`, `FORBIDDEN`.

State is communicated with text and accessible semantics. `UNKNOWN` is never styled or labelled as `SAFE`; `UNAVAILABLE` is never styled or labelled as `SUCCESS`. Demo provenance remains visible if a shell-level preview or switcher ever receives demo data. The shell does not create Trust verdicts, progress, provider identity, or confidence.

## COMPONENT BOUNDARIES

Visual work may compose:

- `frontend/src/components/layout/UnifiedAppShell.jsx`;
- the existing compatibility wrappers only while route consumers still require them;
- F03 primitives and shell-scoped styles/tokens;
- the approved route metadata/configuration source once F04 adds it;
- accessible search/account/mobile navigation controls.

The shell receives typed state and callbacks. Domain features own Trust, Community, Expert, Passport, and data-fetching logic. Do not move API calls, provider selection, Supabase, auth token handling, or route-domain decisions into visual components.

## DATA REQUIREMENTS

No new endpoint is required for this handoff. The shell may consume:

- canonical route metadata/disposition from `docs/product/ROUTE_MAP.md`;
- current pathname/navigation callbacks;
- existing approved session/account state;
- F02 safe UI state and error envelopes for utility controls.

If visual work requires a missing field, Antigravity must request a contract change from Luna Max. Do not infer data from labels, fixture values, colors, or URL fragments.

## DESKTOP REQUIREMENTS

- Persistent primary navigation with Trust visually prioritized.
- Content remains readable at the approved app width and does not depend on hover to reveal essential meaning.
- Search and account utilities remain discoverable without competing with Trust.
- Focus order follows visual order; keyboard users can bypass shell chrome to page content.

## TABLET REQUIREMENTS

- Preserve the same hierarchy and route semantics with a compact navigation composition.
- No clipped rail, hidden essential action, or hover-only interaction.
- Search/account remain reachable with touch and keyboard where supported.

## MOBILE REQUIREMENTS

- Use one predictable primary navigation pattern with Trust first.
- Preserve current route and return context during navigation and authentication transitions.
- No horizontal overflow, clipped MarginRail content, or inaccessible off-canvas controls.
- Touch targets, focus restoration, escape behavior, and screen-reader labels are explicit.

## ACCESSIBILITY REQUIREMENTS

- Semantic landmarks for header/navigation/main; one meaningful page heading remains in route content.
- Visible keyboard focus and logical tab order.
- Mobile drawer/menu has labelled controls, focus containment/restoration, Escape handling, and no background interaction while modal.
- State/error changes use appropriate live-region semantics without streaming raw provider telemetry.
- Color is never the only state signal; reduced motion disables non-essential transitions.

## PERFORMANCE BUDGET

- No new network request or provider initialization from shell presentation alone.
- Keep shell interactions responsive on the existing baseline; avoid per-frame React state updates.
- Lazy-load optional search/help/visual modules; do not import TrustGraph, OCR, 3D, WebGL, or media into the base shell bundle.
- Preserve the existing production build and route bundle budgets; measure before/after in the F04 gate.

## ALLOWED FILES

- `frontend/src/components/layout/UnifiedAppShell.jsx`;
- shell-scoped CSS/module files and F03 primitives;
- canonical route metadata/configuration file approved by Luna;
- shell-focused tests, accessibility tests, and responsive/visual regression fixtures;
- this visual contract only when a semantic requirement changes through Luna approval.

## FORBIDDEN FILES

- backend, API route, Supabase, database/RLS, auth/session security, provider, or secret files;
- `frontend/src/lib/backend/**`, `frontend/src/lib/api/**`, and `frontend/src/lib/ui-state/**` without an explicit Luna-approved contract change;
- Trust/Community/Expert/Passport domain logic or report components;
- route creation/deletion or route disposition changes;
- Landing/cinematic/motion/3D/WebGL/media implementation in this bounded handoff;
- silent DemoProvider fallback, fabricated loading/progress, or unsafe URL navigation.

## ALLOWED VISUAL FREEDOM

Antigravity may determine layout composition, typography application, spacing, color application, iconography, responsive choreography, animation restraint, and visual hierarchy within the approved token system and this contract. Antigravity may refine how the shell feels.

## FORBIDDEN BEHAVIOR

Antigravity may not change what a route means, promote a compatibility route to a pillar, make a Community/Expert event a Trust verdict, hide uncertainty/unavailability, expose private account data, or invent data required by a visual treatment.

## ACCEPTANCE CRITERIA

- Trust remains first and visibly flagship at desktop, tablet, and mobile widths.
- All canonical destinations and compatibility behavior remain reachable according to the route map.
- One shell authority and one navigation source are preserved; wrappers remain compatibility-only until F04 migration proves safe.
- All required shell states are textually and accessibly represented; `UNKNOWN`/`UNAVAILABLE` never render as success/safe.
- No horizontal overflow or clipped mobile navigation.
- Keyboard, focus, menu/drawer, reduced-motion, and screen-reader checks pass.
- No new backend contract, endpoint, secret, provider behavior, or domain mutation is introduced.
- Production build and shell performance budgets remain within the F04 gate.

## LOCAL ENGINEERING EVIDENCE

- `UnifiedAppShell` consumes `frontend/src/components/layout/navigationConfig.js`; Trust is first in desktop, tablet, mobile, and command navigation.
- Core browser checks cover canonical routes, compatibility redirects, keyboard reachability, reduced motion, responsive overflow, and serious/critical Axe findings.
- Chromium gate: `67` passed, `3` explicit Trust-demo cases skipped. The exact `agent-browser` executable was unavailable; Playwright was used as the local browser fallback.
- Antigravity may now apply visual composition and motion within this contract. Any missing semantic data or route change requires Luna approval.
