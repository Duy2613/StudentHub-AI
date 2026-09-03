# Visual Handoff — Community

**Status:** `READY_FOR_ANTIGRAVITY`  
**Feature:** `/community` observations and corroboration  
**Owner:** Antigravity visual; Luna community/domain contract  
**Date:** 2026-09-01

## USER GOAL

Help students inspect lived observations and contribute bounded corroboration with source, context, time, evidence references, and case scope.

## INFO HIERARCHY

1. Observation context and freshness/moderation state.
2. Evidence/source references and contributor privacy projection.
3. Corroboration/conflict relation.
4. Case/revision scope and safe next action.

## DATA CONTRACT

Observations carry IDs, optional case linkage, statement, source/context, observed/submitted timestamps, evidence references, freshness/moderation, privacy projection, and corroboration/conflict metadata. Submit requires explicit case ID, non-negative revision, statement, and bounded evidence references when the command contract requires them.

## STATE CONTRACT

Use `IDLE`, `LINKING`, `LOADING`, `EMPTY`, `SUCCESS`, `PARTIAL`, `UNKNOWN`, `CONFLICTING_EVIDENCE`, `SUBMITTING`, `UNAVAILABLE`, `ERROR`, `OFFLINE`, `AUTH_REQUIRED`, `FORBIDDEN`, and `CANCELLED`. `SUCCESS` means an observation was returned/accepted, not that it is true.

## INTERACTION

Support list, detail, retry, explicit scoped submission, cancel, and return to Trust. Popularity, count, or visual prominence must not be presented as truth strength.

## DESKTOP / TABLET / MOBILE

- Desktop: list and selected observation detail can coexist.
- Tablet: keep provenance and freshness visible before the contribution action.
- Mobile: use stacked cards/forms, clear validation, and readable evidence references.

## ACCESSIBILITY

Observation cards need headings/labels, detail controls need names and focus return, forms need associated errors, and moderation/freshness must be text-readable.

## PERFORMANCE BUDGET

Paginate or virtualize long feeds when the backend contract permits. Keep Community route initial JS below `500,000` bytes; do not load graph/visual media globally.

## ALLOWED FILES

Observation/feed/detail/form presentation, responsive layout, states, and visual regression fixtures.

## FORBIDDEN FILES

Trust verdict mutation, popularity ranking semantics, private contributor exposure, backend/API/auth/RLS changes, unscoped submission, or fabricated community evidence.

## VISUAL FREEDOM

Choose feed density, provenance emphasis, detail composition, form hierarchy, and safe empty/partial treatment while preserving observation-first meaning.

## SEMANTIC RESTRICTIONS

Community context is corroboration/context, not automatic proof. Missing source, stale observation, or unavailable service must stay visibly unresolved.

## ACCEPTANCE

List/detail/submit states, case/revision scope, provenance/freshness, privacy, conflict, no popularity-as-truth, keyboard/mobile access, and unavailable/error behavior remain intact.

