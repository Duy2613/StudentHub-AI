# Visual Handoff — TrustGraph

**Status:** `READY_FOR_ANTIGRAVITY`  
**Feature:** TrustGraph / related evidence navigation  
**Owner:** Antigravity visual; Luna graph/domain semantics  
**Date:** 2026-09-01

## USER GOAL

Trace how a Trust case relates to evidence, sources, community context, expert events, and Passport history without mistaking graph shape for a verdict.

## INFO HIERARCHY

1. Case and current revision context.
2. Graph/list scope and filters.
3. Selected node facts and provenance.
4. Safe action: inspect, filter, open owning surface, or return to report.

## DATA CONTRACT

Use typed nodes/edges and preserve node kind, IDs, labels, provenance, timestamp, case/revision scope, and missing/unknown state. UI caps graph rendering at 50 nodes. CASE and PASSPORT nodes are included only when the contract allows them.

## STATE CONTRACT

Support `IDLE`, `LOADING`, `SUCCESS`, `EMPTY`, `PARTIAL`, `UNKNOWN`, `CONFLICTING_EVIDENCE`, `UNAVAILABLE`, `ERROR`, `OFFLINE`, and `CANCELLED`. A graph cannot create or change a Trust verdict.

## INTERACTION

Provide filter/search, zoom where useful, node selection, inspector, and a synchronized list fallback. Keyboard users must reach the same facts and actions without pointer-only graph navigation.

## DESKTOP / TABLET / MOBILE

- Desktop: graph and inspector can share a workspace.
- Tablet: preserve the selected-node context while filters remain reachable.
- Mobile: list-first fallback is valid and preferred when graph interaction would be cramped; never require 3D/canvas.

## ACCESSIBILITY

Every node has a text label and list representation. Focus, selected state, graph status, and missing scope are announced. The list fallback is not hidden from assistive technology.

## PERFORMANCE BUDGET

Keep graph code route-scoped/lazy, cap nodes/edges, and do not add WebGL or heavy canvas to the initial shell. `/trust` remains below `500,000` initial route bytes.

## ALLOWED FILES

Graph presentation, SVG/list layout, filters, inspector styling, graph-focused tests, and non-semantic animation.

## FORBIDDEN FILES

Graph-to-verdict mutation, fabricated edges/nodes, provider/domain changes, secrets, backend/API/database changes, or mandatory 3D/WebGL.

## VISUAL FREEDOM

Antigravity may choose graph/list composition, spatial rhythm, focus treatment, and restrained transitions while preserving the list fallback and node cap.

## SEMANTIC RESTRICTIONS

Connectivity, node prominence, or animation must never imply confidence, safety, authority, or causality not present in the data.

## ACCEPTANCE

50-node cap, filters, inspector, list fallback, exact case/revision context, keyboard equivalence, reduced motion, and no graph-driven verdict mutation remain intact.

