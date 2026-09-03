# Visual Handoff — Evidence Passport

**Status:** `READY_FOR_ANTIGRAVITY`  
**Feature:** Evidence Passport linked from Trust/Dashboard  
**Owner:** Antigravity visual; Luna persistence/privacy contract  
**Date:** 2026-09-01

## USER GOAL

Give a student an auditable, privacy-aware history of a case and its revisions without implying that an unconfirmed write was saved.

## INFO HIERARCHY

1. Passport identity, owner/privacy scope, and exact case revision.
2. Current confirmed status.
3. Append-only revision/event timeline and provenance.
4. Add event, inspect, retry, or return to Trust.

## DATA CONTRACT

Every read/write is scoped by `caseId` and exact non-negative `caseRevision`; revisions are immutable and append-only. Preserve Passport ID, revision ID, event type, source mode, evidence references, timestamps, retention metadata, and server confirmation. Do not display a locally optimistic item as saved.

## STATE CONTRACT

Support `IDLE`, `AUTH_REQUIRED`, `LOADING`, `NO_PASSPORT`, `CREATING`, `CREATED`, `HISTORY_LOADING`, `HISTORY_READY`, `PARTIAL`, `CONFLICTING_EVIDENCE`, `UNAVAILABLE`, `ERROR`, `OFFLINE`, and `CANCELLED`.

## INTERACTION

Creation requires consent/retention disclosure and server confirmation. Stale revision, duplicate, forbidden, and unavailable writes remain explicit. A new Trust/Community/Expert event must return through its owning flow.

## DESKTOP / TABLET / MOBILE

- Desktop: timeline and revision facts may use two columns.
- Tablet: keep case/revision identity sticky while inspecting events.
- Mobile: use a chronological, readable timeline with no wide table dependency.

## ACCESSIBILITY

Use headings, timeline semantics, status text, clear confirmation/error announcements, keyboard-safe dialogs, and explicit unsaved state. Sensitive content must not be exposed in hidden labels or focus order.

## PERFORMANCE BUDGET

Paginate/lazy-load history where supported; do not load private history in the global shell. Keep Passport views within their route budget.

## ALLOWED FILES

Passport timeline/card composition, consent/unsaved visual states, feature styles, and focused tests.

## FORBIDDEN FILES

Ownership/RLS/auth/persistence semantics, revision mutation/overwrite, silent local fallback, raw sensitive data logging, or API endpoint invention.

## VISUAL FREEDOM

Choose the timeline language, revision comparison layout, privacy disclosure treatment, and confirmed/unsaved emphasis within the state contract.

## SEMANTIC RESTRICTIONS

Never use a local optimistic card as proof of persistence; never reveal another user's case; never collapse conflicting revisions into one “current truth”.

## ACCEPTANCE

Exact revision guard, append-only language, auth/forbidden/unavailable/unsaved states, privacy disclosure, keyboard/mobile access, and no overwrite behavior remain visible and testable.

