# Visual Handoff — Global Visual System

**Status:** `READY_FOR_ANTIGRAVITY`  
**Authority:** Antigravity 3.7 Flash High for visual execution; Luna Max for product/engineering semantics  
**Date:** 2026-09-01

## USER GOAL

Make StudentHub AI feel like one trustworthy product: Trust is the first intelligence surface, while Community and Expert extend a case without competing with its authority.

## INFO HIERARCHY

1. Trust / investigate before believing.
2. Community corroboration and lived context.
3. Expert scope-bound escalation.
4. Case Lab, Dashboard, Profile, and Settings as supporting destinations.

## DATA CONTRACT

Use the typed domain results and safe UI state envelope in `frontend/src/lib/backend`, `frontend/src/lib/api`, and `frontend/src/lib/ui-state`. Display provenance, case ID/revision, missing scope, and source mode when supplied. Do not style raw backend DTOs or infer missing values.

## STATE CONTRACT

Render `IDLE`, `VALIDATING`, `LOADING`, `SUBMITTING`, `SUCCESS`, `EMPTY`, `PARTIAL`, `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`, `UNAVAILABLE`, `ERROR`, `OFFLINE`, `CANCELLED`, `AUTH_REQUIRED`, and `FORBIDDEN` as distinct semantic states. `DEMO_FIXTURE` must be visible; `UNKNOWN` is never safe reassurance.

## INTERACTION

Keep existing route ownership and action callbacks. Preserve request/run cancellation, stale-response guards, exact case/revision scope, and truthful next actions. Motion may explain hierarchy or progress only when the underlying state entered that phase.

## RESPONSIVE

- Desktop: Trust-first global hierarchy with clear pillar switching.
- Tablet: retain all three pillars without collapsing uncertainty or provenance.
- Mobile: prioritize one task at a time, preserve a reachable state label and safe action, and avoid horizontal clipping.

## ACCESSIBILITY

Use semantic landmarks, visible focus, keyboard reachability, text labels for icon actions, live-region updates for async state changes, and reduced-motion behavior. Never encode risk or availability by color alone.

## PERFORMANCE BUDGET

Keep route-specific heavy work lazy. Preserve the verified route initial-JS budget of `500,000` bytes for Trust, Community, and Expert. Do not add global media, WebGL, font, or animation payloads without a measured budget update.

## ALLOWED FILES

Visual styles, component composition, typography application, spacing, responsive layout, icons, restrained motion, and visual regression fixtures under the owning feature paths and `.agents/DESIGN.md` token system.

## FORBIDDEN FILES

`frontend/src/lib/backend/**`, `frontend/src/lib/api/**`, `frontend/src/lib/ui-state/**`, server/API/database/RLS/auth/security files, route disposition, domain logic, provider contracts, and secrets unless Luna approves a contract change.

## VISUAL FREEDOM

Antigravity may choose the visual language, composition, type scale, color treatment, responsive choreography, and motion expression within the existing semantic token ownership and the surface contracts below.

## SEMANTIC RESTRICTIONS

Do not turn unavailable into success, unknown into safe, community volume into truth, expert presence into global authority, or a demo fixture into live evidence. Missing data must trigger a contract request, not a fabricated visual.

## ACCEPTANCE

All feature contracts below remain truthful at every breakpoint; Trust remains visibly flagship; serious/critical Axe checks, keyboard, reduced motion, no-overflow, build, bundle, and route tests continue to pass.

