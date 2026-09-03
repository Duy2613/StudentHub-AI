# StudentHub AI — Antigravity Handoff Requirements

**Status:** `READY_FOR_ANTIGRAVITY`  
**Technical authority:** Luna Max  
**Visual authority:** Antigravity 3.7 Flash High  
**Date:** 2026-09-01

## Stable routes

Canonical intelligence routes are `/trust`, `/community`, and `/expert`. `/cases` is a supporting/demo Case Lab. `/`, `/dashboard`, `/profile`, `/settings`, `/settings/privacy`, auth, and onboarding remain supporting/platform routes. Compatibility routes and their redirects are frozen in `docs/product/ROUTE_MAP.md`.

## Stable layout regions

- `UnifiedAppShell`: header/search/account/navigation composition.
- Trust workspace: input → report → evidence/action progression.
- Community workspace: observation list → detail → scoped submission.
- Expert workspace: directory → dossier → scoped assessment.
- Case Lab: supporting demo workspace only.
- Passport: case/revision-scoped history linked from Trust.

## Design token hooks

Use the existing semantic token ownership and `.agents/DESIGN.md`. Antigravity may apply typography, spacing, color, border, surface, focus, state, and motion treatment, but must not introduce a competing token vocabulary or redefine state meaning.

## Trust visual slots

- Trust-first input mode switch and bounded input control.
- Level 1 decision/action/unknowns block.
- Independent risk, confidence, coverage, and agreement metrics.
- Level 2 evidence disclosures.
- Level 3 actual technical evidence.
- TrustGraph/list fallback and cross-pillar handoff actions.

## Screenshot annotation slots

Preview, OCR/client-hint disclosure, entity inspector, explicit confirmation controls, validated provider-coordinate overlay, and textual fallback. No coordinate means no box.

## TrustGraph integration slots

Graph canvas/SVG, search/filter, node selection, inspector, list fallback, mobile bottom sheet/list, loading/partial/unavailable states. Preserve the UI cap of 50 nodes and never derive a verdict from visual prominence.

## Passport visualization slots

Case identity, exact revision, append-only event timeline, provenance, conflict branch, partial history, unsaved/unavailable write state, and comparison between revisions. A client optimistic card is never a saved revision.

## Community visual slots

Observation card, source/context/time/freshness, contributor privacy projection, corroboration/conflict grouping, detail state, scoped submission form, moderation/abuse boundary, and return-to-Trust action.

## Expert visual slots

Scope, identity, credentials/publications/verification projection, limitations/conflicts, dossier, pending review, evidence-reviewed IDs, assessment timestamp, and return-to-Trust/Passport action. Do not add stars, global ranking, or authority inflation.

## Media/video slots

Media is ambient/product storytelling only. The standalone prototype at `index.html` uses the supplied assets in `media/open-constant/`; it is not Trust evidence, Community evidence, Expert evidence, or technical proof. Video must not replace readable UI, state text, or accessible fallback.

## Motion boundaries

Motion may clarify hierarchy, reveal actual state transitions, or create atmosphere. It must pause when hidden/offscreen, respect reduced motion, avoid fake progress, and avoid multiple permanent GPU loops on core transaction routes. Advanced cinematic/3D/WebGL work remains Antigravity-owned but must preserve these constraints.

## Accessibility constraints

Target WCAG 2.2 AA: semantic landmarks, keyboard access, visible focus, labels, touch targets, focus restoration, reduced motion, error association, accessible dialogs/sheets, graph/list fallback, screenshot text fallback, and color-plus-text/icon state communication.

## Performance constraints

Keep Trust, Community, and Expert initial route bundles below the verified `500,000` byte budget. Lazy-load graph/OCR/media/3D where possible, pause offscreen media, retain poster fallback, and measure any new font/video/WebGL payload before adoption.

## Contract requirements for missing visual data

If a visual treatment requires a missing field, provider observation, coordinate, credential, metric, or status, stop the visual change and submit a contract request to Luna. Do not invent data in JSX, CSS, SVG, canvas, shader uniforms, media labels, or animation timing.

## Forbidden modifications

Antigravity must not modify domain semantics, backend, database, RLS, auth/session, API semantics, Trust scoring, evidence semantics, canonical states, route ownership, or provider selection. Any requested semantic change must be recorded as a Luna-approved contract change before implementation.

