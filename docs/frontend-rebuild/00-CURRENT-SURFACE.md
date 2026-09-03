# 00 — Current Frontend Surface

**Audit date:** 2026-09-01  
**Baseline:** codex/trust-engine-v5-sequential-assurance at f96291e  
**Posture:** read-only reconnaissance. No source code, package, database, environment, commit, or push changes were made.

## Executive finding

The existing frontend is a substantial, working Next.js product surface with a strong Trust foundation and a visually credible editorial landing page. It is not yet a safe design handoff.

The decisive blockers are:

1. The product scope is not frozen: the shell still presents Academic 360, Evidence Case Lab, and Forum beside the P0/P1 pillars, while several legacy routes and duplicate intelligence surfaces remain.
2. A browser check at 390 px verifies a critical mobile shell defect on the canonical app pages: the mobile Margin strip remains a flex child, leaving the main content only 146 px wide on Trust, Community, Expert, Cases, and Academic, and 120 px on Dashboard.
3. The Trust page has a good input/pipeline/error foundation but does not yet expose the requested three-level report, numeric evidence metrics, screenshot entity highlights, or Evidence Passport in the primary Trust flow.

**Final verdict: FRONTEND_REQUIRES_SCOPE_FREEZE.**

This means the baseline is worth preserving and can support the next phase, but the scope and the mobile shell must be resolved before a visual design specification is considered authoritative.

## Evidence protocol

Each statement in these reports is labelled implicitly by its source:

- **Verified:** measured from the current repository, current browser run, or checked release/test documents.
- **Inferred:** a product or architecture conclusion derived from verified evidence.
- **Not verified:** a capability that needs a future backend, product decision, or broader test pass.

The absent files PROJECT_SPEC.md and getdesign.md were searched for and not found in this checkout. Existing vault and frontend documents were used as the available authority instead; no external design reference was copied.

## Measured baseline

| Surface | Current evidence |
| --- | --- |
| Framework | Next.js 16.3.0 App Router, React 19.2.8, Tailwind CSS v4 |
| Page routes | 39 page files under frontend/src/app, including one dynamic profile route and redirect/compatibility pages |
| API handlers | 110 files under frontend/src/app/api; this is an implementation inventory, not a product-scope decision |
| Components | 171 files under frontend/src/components; 168 are JS/JSX/TS/TSX across 22 top-level directories |
| Shell wrappers | Three named wrappers (GlobalAppShell, StudentHubOSShell, UnifiedAppShell); the first two currently delegate to UnifiedAppShell |
| Global styling | globals.css is approximately 82.6 KB / 2,013 lines; living-campus-atlas.module.css is approximately 42.4 KB / 203 lines |
| Typography | Four loaded families in the root layout: Plus Jakarta Sans, JetBrains Mono, Instrument Serif, and Inter Tight |
| Core route chunks | Release evidence records Trust 379,110 bytes, Community 335,899 bytes, and Expert 337,882 bytes, all below the documented 500 KB route budget |
| Test evidence | Release audit records Chromium 51 pass / 3 skipped, WebKit 48 pass / 3 skipped, mobile Chromium 13/13, core serious/critical accessibility checks 6/6, and Chromium visual regression 3/3 |
| Browser reconnaissance | Desktop and mobile snapshots were taken locally at 1440 and 390 px with Playwright because the requested agent-browser executable was unavailable |

## Current surface map

    StudentHub AI
    ├── Public discovery
    │   └── /  Living Campus Atlas landing
    ├── Canonical intelligence
    │   ├── /trust       Trust investigation studio
    │   ├── /community   seeded observation feed
    │   ├── /expert      seeded expert directory and assessment
    │   └── /cases       explicit competition/demo case lab
    ├── Personal and identity
    │   ├── /dashboard
    │   ├── /profile and /profile/[id]
    │   ├── /settings and /settings/privacy
    │   └── /login, /register, /callback, /onboarding
    └── Legacy, compatibility, or deferred surfaces
        ├── /intelligence/*, /forum, /ultra
        ├── Academic 360 routes
        └── safety, scholarship, marketplace, rating, quest, and contract aliases

## Runtime architecture

### Shells and navigation

The effective canonical shell is frontend/src/components/layout/UnifiedAppShell.jsx, mounted directly or through the two delegating wrappers. It supplies:

- sticky header, brand, account chip, protection status;
- MarginRail desktop navigation and mobile details navigation;
- command search opened by Ctrl/Cmd+K;
- skip link and main landmark;
- route groups that currently mix the three pillars with Academic 360, Case Lab, and Forum.

The older ModernNavbar / CollapsibleSidebar pattern is still used by heavy legacy pages such as Forum, Profile, Safety Map, Scholarships, SOS, and Ultra. Auth uses a separate Saffron shell. This is not merely an aesthetic difference: it changes navigation, spacing, focus behavior, and responsive risk.

### State and backend boundary

The current frontend already has useful contract primitives in frontend/src/lib/api:

- typed request/error handling with status, timeout, abort, invalid JSON, and schema mismatch states;
- Zod schemas for Trust, Community, and Expert responses;
- a V5 Trust sequential request path with legacy compatibility parsing;
- explicit demo gating through NEXT_PUBLIC_COMPETITION_DEMO;
- deterministic local stores for seeded Community and Expert views.

The proposed src/lib/backend/contracts, providers, demo, and friend-backend boundary from the brief does not exist yet. Therefore the UI has a partial seam, not a frozen adapter architecture. Backend unavailability is not a reason to fake live evidence; it is a reason to preserve explicit states.

## Strengths to preserve

- Trust input validation, abort handling, scan-sequence protection, typed errors, provider status, unknown/unavailable language, print action, and explicit demo labelling.
- TrustGraph search, filters, graph/list fallback, selected-node inspector, and dynamic loading.
- Community and Expert pages already express the intended domain vocabulary better than the legacy forum and professor-rating pages.
- The landing page has a distinctive dark campus/editorial direction, coherent mineral-mint accenting, and a dedicated mobile composition.
- Existing release gates provide a useful test and evidence discipline even though they do not cover the full route or product scope.

## Gaps that prevent design readiness

| Gate | Evidence | Consequence |
| --- | --- | --- |
| Product scope | 39 routes, duplicate intelligence paths, legacy shell families, mixed canonical sidebar | A design spec could accidentally polish features that will be removed or moved |
| Mobile shell | 390 px core pages render main content at 146 px or 120 px | Component and page screenshots are not trustworthy until the shell composition is corrected |
| Trust information architecture | Current result is a dense staged stack; requested Level 1/2/3 hierarchy is not present | The flagship layout cannot be frozen from current pixels |
| Evidence Passport | Strong /cases demo exists, but Passport/Decision Twin is not part of the primary /trust report | Case lifecycle and revision ownership remain unresolved |
| Contract seam | frontend/src/lib/api exists; requested provider folder and endpoint contract are not frozen | Future C# integration can still force frontend reshaping |
| Research inputs | PROJECT_SPEC.md and getdesign.md are absent | Research-derived design claims cannot be treated as approved direction |

## Read-only handoff recommendation

Before visual design work is approved, freeze:

1. the canonical navigation and route disposition in 01-ROUTE-DECISIONS.md;
2. the mobile shell layout and responsive test assertion in 06-MOBILE-A11Y-GAPS.md;
3. the Trust report, Passport, and state taxonomy in 05-TRUST-GAP.md;
4. the provider/contract boundary and evidence ownership;
5. the definition of live, demo, unknown, and unavailable for every pillar.

Do not delete routes or rewrite the shell during this reconnaissance phase. The findings are a scope and design gate, not an implementation diff.
