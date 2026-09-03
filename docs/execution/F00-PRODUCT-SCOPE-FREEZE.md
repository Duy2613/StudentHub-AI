# F00 — Product Scope Freeze (Historical Record)

**Status:** `COMPLETED_AND_SUPERSEDED_BY_F00_F01_FREEZE`  
**Authority:** Luna Max  
**Date:** 2026-09-01

This record preserves the earlier bounded scope-freeze decision. The canonical, combined F00 + F01 decision is now in `docs/product/PRODUCT_SCOPE.md`, `docs/product/CORE_PILLARS.md`, `docs/product/INFORMATION_ARCHITECTURE.md`, `docs/product/ROUTE_MAP.md`, and `docs/product/SUPERFLOWS.md`.

## Decisions retained

1. Trust is the P0 flagship and sole Trust case owner.
2. Community observations and Expert assessments are typed contributors, not automatic truth.
3. Trust owns report, evidence, TrustGraph, action, Passport, and revision history.
4. Dashboard lists personal cases; Profile exposes permitted identity/history.
5. `/cases` remains an explicitly labelled demo Case Lab, not live Passport authority.
6. Academic, Safety, Scholarships, Tuition, and Scheduler remain deferred.
7. Forum, Marketplace, Quests, and Ultra are removed from the product IA after a later migration/removal gate.
8. Duplicate Intelligence/tool/profile routes merge into their named canonical owner.
9. No route, API handler, database, or provider was deleted or changed by the scope freeze.

## Supersession note

The earlier record stopped at a human-approval candidate and named F01 as a future phase. F01 is now frozen in the canonical product documents. The next and only specified implementation phase is `docs/execution/F02-FOUNDATION.md`.

## Verification boundary

This phase was documentation-only. Route enumeration and document consistency are locally verified. Frontend runtime/build/typecheck, live backend, Supabase/RLS, production provider, and visual handoff were not executed or are blocked by environment. No visual polish was started.

## Final status

`SPEC_FROZEN_READY_FOR_F02`
