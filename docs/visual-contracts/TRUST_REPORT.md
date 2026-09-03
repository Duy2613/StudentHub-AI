# Visual Handoff — Trust Report

**Status:** `READY_FOR_ANTIGRAVITY`  
**Feature:** `/trust` report layers  
**Owner:** Antigravity visual; Luna verdict/state contract  
**Date:** 2026-09-01

## USER GOAL

Help a student understand what the investigation knows, what it does not know, and what safe action is available.

## INFO HIERARCHY

1. Level 1: decision semantics and immediate safe action.
2. Unknowns, missing scope, and top reasons.
3. Independent risk/confidence/evidence/source-agreement metrics.
4. Level 2: human-readable evidence categories.
5. Level 3: technical evidence only where actual fields exist.
6. Case timeline and cross-pillar actions.

## DATA CONTRACT

Use the canonical decision, risk, confidence, evidence coverage, source agreement, reasons, unknowns, provider observations, technical evidence, `caseId`, exact revision, provenance, and related-case fields. Omit absent technical facts; never fill null with zero or a positive label.

## STATE CONTRACT

The report may be `SUCCESS`, `PARTIAL`, `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`, `UNAVAILABLE`, `ERROR`, `OFFLINE`, or `CANCELLED`. A successful transport can still contain an uncertain decision. `UNKNOWN` and `INSUFFICIENT_EVIDENCE` must not receive a “safe” treatment.

## INTERACTION

Allow progressive disclosure of Level 2/3, evidence references, related cases, TrustGraph, Community, Expert, and Passport. Preserve exact case/revision context in every handoff. Review/check-official actions must state their scope.

## DESKTOP / TABLET / MOBILE

- Desktop: make Level 1 dominant and let deeper evidence expand without competing with the decision.
- Tablet: keep decision, unknowns, and action visible before details.
- Mobile: stack layers in order; keep metric labels and uncertainty readable; avoid horizontal technical tables.

## ACCESSIBILITY

Use headings for levels, semantic status text, expandable region names, focusable actions, and live announcements for completion/partial/error. Do not rely on risk color or icon shape alone.

## PERFORMANCE BUDGET

Lazy-load deep technical evidence, graph, and heavy inspectors. Keep initial `/trust` route JS below `500,000` bytes.

## ALLOWED FILES

Trust report layout, typography, disclosure/accordion composition, report-focused styles, and visual regression fixtures.

## FORBIDDEN FILES

Verdict/scoring semantics, provider adapters, evidence fabrication, API/database/auth files, route changes, or changes to unknown/partial/unavailable meaning.

## VISUAL FREEDOM

Antigravity may establish visual distinction between levels and actions, provided the independent metrics remain independent and actual evidence remains distinguishable from absence.

## SEMANTIC RESTRICTIONS

Never use “verified”, “safe”, “clean”, or equivalent reassurance unless the returned domain contract explicitly supports it. Transport success is not domain safety.

## ACCEPTANCE

Level order, unknown/missing scope, actual-only technical evidence, independent metrics, case/revision handoffs, keyboard disclosure, reduced motion, and browser snapshots remain correct.

