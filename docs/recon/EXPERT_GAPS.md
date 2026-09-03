# 07 — Corrected Expert Intelligence Experience Gap Analysis

**Audit date:** 2026-09-01  
**Auditor:** Antigravity 3.7 Flash High; Luna Max evidence review  
**Claim discipline:** Mixed evidence. The current view facts are `VERIFIED` from source/tests; production authority verification is `NOT_EXECUTED` or `BLOCKED_BY_ENV`. See `docs/recon/EVIDENCE-CLEANUP.md`.

## Verified current behavior

- The canonical `/expert` route mounts `ExpertIntelligenceView` with a seeded `ExpertStore` and a typed evaluation seam.
- The canonical view exposes scope/meter information, credential and publication counts, assessment content, and an explicit warning that expertise is not unbounded authority.
- The source contains a deeper `ExpertIntelligenceStudioV2` surface, but it is not the canonical `/expert` route.

## Corrected gaps

```text
[FINDING-EXP-01] [SEVERITY: HIGH] [STATUS: VERIFIED PARTIAL]
Scope and credential/publication fields are present, but the inspected canonical data is seeded/demo data. Production credential citations and independent verification are not established.
Required boundary: an expert may assess only within a declared scope; missing verification must render UNVERIFIED/UNKNOWN, never a trust badge.
```

```text
[FINDING-EXP-02] [SEVERITY: HIGH] [STATUS: NOT_EXECUTED]
The repository does not prove that every assessment is stamped to a case revision and exact evidence-item set in a live persistence flow.
Required boundary: assessment events must include caseId, caseRevision, evidenceReviewed identifiers, scope, confidence, limitations, reviewer identity, and timestamp.
```

```text
[FINDING-EXP-03] [SEVERITY: MEDIUM] [STATUS: NOT_EXECUTED]
Production search, request routing, disagreement history, moderation, and review SLA behavior were not executed.
```

## Product implication

Expert remains P1 support for Trust. It is not a global rating or popularity system, and the legacy professor-rating route is consolidated into scoped Expert discovery without importing anonymous ratings as authority.
