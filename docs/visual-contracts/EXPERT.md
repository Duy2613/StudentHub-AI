# Visual Handoff — Expert

**Status:** `READY_FOR_ANTIGRAVITY`  
**Feature:** `/expert` scoped expert discovery and assessment  
**Owner:** Antigravity visual; Luna authority/domain contract  
**Date:** 2026-09-01

## USER GOAL

Find an expert whose declared scope fits the case, inspect limitations and evidence of authority, and request a bounded assessment.

## INFO HIERARCHY

1. Scope fit and current availability.
2. Credential/publication/verification projection.
3. Limitations, conflicts, and evidence reviewed.
4. Assessment status tied to exact case/revision.

## DATA CONTRACT

Expert data may include ID, name, title/institution, scopes, credential/publication counts, verification status, limitations, conflicts, and status. Assessment requires expert scope, `caseId`, exact `caseRevision`, evidence-reviewed IDs, confidence/limitations, status, timestamps, and disagreement/withdrawal semantics when returned.

## STATE CONTRACT

Support `IDLE`, `LINKING`, `SCOPE_SELECTION`, `LOADING`, `EMPTY`, `SUCCESS`, `UNKNOWN`, `PARTIAL`, `PENDING_REVIEW`, `UNAVAILABLE`, `ERROR`, `OFFLINE`, `AUTH_REQUIRED`, `FORBIDDEN`, and `CANCELLED`.

## INTERACTION

Search/filter by name, title, institution, department, and scope. Show dossier/detail and request/review status. Route back to Trust with the original case/revision context; an expert event cannot directly set a Trust verdict.

## DESKTOP / TABLET / MOBILE

- Desktop: directory and dossier can be composed as list/detail.
- Tablet: keep scope and limitations visible before request action.
- Mobile: stack dossier facts and use clear scope chips/text; do not make horizontal tables mandatory.

## ACCESSIBILITY

Scope, verification, limitations, conflicts, and review status require text labels. Search/results empty state, focus return, form errors, and pending announcements must be accessible.

## PERFORMANCE BUDGET

Keep the expert directory/detail chunk route-scoped and below the `500,000` byte route budget. Do not add global expert media or model payloads.

## ALLOWED FILES

Directory/dossier/review presentation, search/filter layout, responsive behavior, and visual regression fixtures.

## FORBIDDEN FILES

Global ratings/leaderboards, authority inflation, credential verification invention, Trust verdict mutation, backend/API/auth/RLS changes, or private expert data exposure.

## VISUAL FREEDOM

Choose dossier hierarchy, scope/credential disclosure, review status treatment, and responsive directory composition within the bounded authority model.

## SEMANTIC RESTRICTIONS

An expert is not global authority. A credential count is not verification, a pending assessment is not a conclusion, and an unavailable expert is not a positive signal.

## ACCEPTANCE

Scoped search/detail, limitation/verification disclosure, exact case/revision assessment, pending/unavailable/error states, no global authority claim, keyboard/mobile access, and reduced motion remain intact.

