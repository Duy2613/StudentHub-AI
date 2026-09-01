# StudentHub AI — Frozen Information Architecture

**Phase:** Stages 00–24 continuous engineering program  
**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01

## IA principles

1. Trust is the flagship and the first intelligence destination.
2. One product job has one canonical route owner.
3. A route alias may preserve an inbound link, but it cannot create a second domain model.
4. Decision and action precede explanation and technical depth.
5. Community and Expert are cross-pillar branches from a Trust case, not alternate verdict engines.
6. Personal/account routes are supporting infrastructure, not additional pillars.
7. Navigation exposes only `KEEP` routes. `MERGE_INTO`, `POST_V1`, and `REMOVE` routes are not canonical navigation items.

## Canonical hierarchy

    Public
    └── /

    Intelligence
    ├── /trust                 P0 flagship investigation and case owner
    ├── /community             P1 observations and corroboration
    ├── /expert                P1 scoped authority and escalation
    └── /cases                 supporting, explicitly demo-labelled Case Lab

    Personal
    ├── /dashboard             cases, actions, briefing
    ├── /profile               own/public identity and permitted history
    └── /settings
        └── /settings/privacy  retention, redaction, privacy controls

    Identity
    ├── /login
    ├── /register
    ├── /callback              OAuth protocol boundary; not a nav item
    └── /onboarding

The complete route disposition is in `docs/product/ROUTE_MAP.md`. No `/intelligence` umbrella is retained in the final hierarchy.

## Canonical app shell composition

`UnifiedAppShell` is the effective canonical internal shell and the single owner of app-level navigation state. `GlobalAppShell` and `StudentHubOSShell` are compatibility wrappers that currently delegate to it. Legacy pages that mount `ModernNavbar` or `CollapsibleSidebar` directly are adoption exceptions, not alternate IA decisions.

The shell owns:

- brand/home return;
- primary intelligence navigation;
- Trust status indicator and case context entry;
- global command/search entry;
- personal Dashboard entry;
- Profile and Settings account menu;
- responsive navigation presentation;
- route-level active state and accessible focus semantics.

The shell does not own Trust, Community, Expert, or Passport business logic.

## Desktop navigation

At desktop widths, the internal shell presents one primary intelligence group in this order:

1. **Trust** — flagship and default investigation entry.
2. **Community** — observations/corroboration.
3. **Expert** — scoped authority/escalation.
4. **Case Lab** — demo-only supporting route, visibly labelled by product state.

The secondary personal group contains Dashboard. Profile and Settings are reached from the account control. Auth and callback routes are not shown as internal nav. Deferred, merged, and removed routes are absent.

## Tablet navigation

At tablet widths, the same route order and labels remain canonical, but the presentation may collapse the desktop rail into a compact top navigation or overflow menu. Trust remains directly visible. Community, Expert, and Case Lab remain one interaction away. Dashboard and account controls remain in the account/overflow region. This is a composition change, not a route or contract change.

## Mobile navigation

At mobile widths, there is no permanent horizontal MarginRail/flex child consuming content width. The navigation is a disclosure drawer/overlay or a non-blocking flow region owned by `UnifiedAppShell`.

The mobile order is:

1. Trust
2. Community
3. Expert
4. Case Lab (Demo)
5. Dashboard
6. Profile
7. Settings
8. Privacy

The header exposes a menu control, the current route/context, search/command entry, and account access. The Trust entry is first and must remain discoverable without opening a secondary feature directory.

## Search placement and scope

- The global search/command entry lives in the app header and is available from every internal `KEEP` route.
- Its baseline responsibility is navigation/action discovery and route filtering through the canonical nav configuration.
- The `/trust` input is the investigation search surface for URLs, text, images, and QR-ready input.
- Community search remains scoped to observations/topics; Expert search remains scoped to experts/scope/credentials.
- A unified entity search API is allowed by `docs/API-CONTRACTS.md`, but its production runtime, ranking, privacy filtering, and authorization are not claimed as implemented in this freeze. It must not be faked by the command overlay.
- No new `/search` route is added in F01.

## Account and settings placement

- Dashboard is the first personal destination after a user has an active session or returns to personal work.
- Profile is the canonical identity/Passport-facing surface. Public profile identifiers resolve through the same ownership boundary.
- Settings is the account preferences parent; Privacy is nested under Settings.
- Retention, deletion, redaction, export, and sharing controls must be explicit before a case or attachment is made persistent.
- Login, register, callback, and onboarding use an auth/first-run boundary rather than the full internal navigation.

## Cross-pillar navigation

### Trust to Community

The Trust report may link to related observations, corroboration, or a “request community context” action. The link carries a `caseId` and allowed context. Community can add an observation event or conflict; it cannot directly set the Trust verdict.

### Trust to Expert

The Trust report may open Expert filtered by required scope and carry `caseId` plus the current case revision. Expert returns an assessment event with scope, evidence reviewed, confidence, limitations, and timestamp. The Trust case remains the owner.

### Trust to Passport

The report may create or open the case Passport. Dashboard lists it; Profile may show only permitted user-owned history. Passport revisions are append-only and do not grant the profile or dashboard authority to rewrite Trust findings.

### Community to Trust

An observation may link to “investigate in Trust.” This creates or opens a Trust case with the observation as contextual input. It does not convert the observation into a finding.

### Expert to Trust

An expert assessment always links back to the specific Trust case and revision it reviewed. Out-of-scope or unavailable assessments return to the case as explicit state, not as a positive/negative verdict.

## Deep-link contract

Canonical routes may accept typed context such as `caseId`, `revisionId`, `section`, `mode`, or `source` only when the destination validates ownership, format, and allowed values. Query context must never bypass authorization or manufacture evidence. Compatibility redirects preserve source context only when it is safe and meaningful.

## IA acceptance

- Trust is the first and visibly primary intelligence route on desktop, tablet, and mobile.
- No current primary nav item points to a merged, deferred, or removed route.
- Mobile navigation does not reduce the core content to a narrow clipped column.
- Search entry, account/settings, and cross-pillar handoffs have one canonical owner.
- The IA requires no visual token, animation, 3D, or advanced Trust redesign decision.

## Local implementation evidence

`UnifiedAppShell` now consumes the canonical navigation configuration at `frontend/src/components/layout/navigationConfig.js`. Core routes render through the shell, Trust is first in desktop/tablet/mobile and command navigation, and compatibility aliases are covered by redirect tests. Core browser evidence covers keyboard reachability, reduced motion, responsive overflow, and serious/critical Axe checks with Playwright. The exact `agent-browser` gate was not executable in this environment.
