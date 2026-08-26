# Community Intelligence V2 — Community Reality Graph

## 1. Architectural Overview

The **Community Reality Graph (Phase T3 V2)** models the empirical reality of the student body. Unlike traditional forum upvoting, forum counting, or sentiment analysis, this system captures what students are *actually experiencing*, preserves real-world friction signals, and exposes operational discrepancies without corrupting or modifying official academic regulations.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMMUNITY REALITY GRAPH (T3 V2)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Raw Community Inputs (Posts, Comments, Shared Experiences)               │
│                                                                             │
│ 2. Provenance Clustering (SHA-256 Fingerprint + Lineage)                    │
│    └─ Syndication Collapse (100 copy-pasted posts -> 1 Provenance Cluster)  │
│                                                                             │
│ 3. Integrity & Astroturf Defense                                            │
│    ├─ Sockpuppet Burst Detector (Device Fingerprints & Coordinated Timing)  │
│    ├─ Commercial Link Spam & Affiliated Promotion Blocker                   │
│    └─ Suspected Synthetic / AI-Template Phrasing Gate                      │
│                                                                             │
│ 4. Multi-Dimensional Context Engine                                         │
│    ├─ Temporal Decay (CURRENT_EXPERIENCE -> RECENT -> AGING -> HISTORICAL)  │
│    └─ CONTEXT_SPLIT vs CONTRADICTION (Separates cross-department variance)  │
│                                                                             │
│ 5. Operational Friction Graph & Cohort Heatmap                              │
│    └─ PROCESS -> STEP -> FRICTION -> COHORT (K21-K26) -> TREND -> SEVERITY │
│                                                                             │
│ 6. Signature Flagship: Official vs Real-World Reality Gap Engine            │
│    └─ Official Target (e.g. 3 days) vs Community Reality (6-8 days)        │
│       => SIGNIFICANT_OPERATIONAL_GAP (Planning guide, not policy mutation)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Invariants & Epistemic Rules

1. **`COMMUNITY SIGNAL ≠ OFFICIAL AUTHORITY`**:
   - Community experiences and consensus **CANNOT** create official regulations, overturn faculty policies, or alter deadlines.
2. **`FIRST-HAND EXPERIENCE ≠ UNIVERSAL TRUTH`**:
   - A direct student experience is valid empirical evidence of one completed event, not universal institutional law.
3. **`10 COPIES OF ONE CLAIM = 1 PROVENANCE CLUSTER`**:
   - Syndicated or copy-pasted posts collapse into exactly 1 observation unit. Consensus counts independent observation units, never raw post counts.
4. **`UPVOTES / LIKES / VIEWS CARRY ZERO WEIGHT`**:
   - Social engagement metrics are completely decoupled from truth determination.
5. **`CONTEXT_SPLIT ≠ CONTRADICTION`**:
   - If Faculty of IT reports 3 days while Faculty of Mechanical Engineering reports 10 days, this is classified as a **`CONTEXT_SPLIT`**, not a factual contradiction.
6. **`OPERATIONAL REALITY GAP ≠ MISCONDUCT`**:
   - Stated benchmark vs empirical observed delay flags operational friction for student planning, without asserting illegal conduct.

---

## 3. Core Engine Components

| Engine File | Primary Responsibility |
| :--- | :--- |
| `communityIntelligenceModel.js` | 11 Claim Types, 6 Author States, 6 Temporal States, 7 Consensus States, 6 Reality Gap States, Factories, Redaction |
| `communityProvenanceEngine.js` | Content hashing, URL lineage, syndication collapse (100 posts $\rightarrow$ 1 cluster) |
| `communityFrictionEngine.js` | Process $\rightarrow$ Step $\rightarrow$ Friction $\rightarrow$ Cohort $\rightarrow$ Trend graph and 2D Heatmap Matrix |
| `communityRealityGapEngine.js` | Stated official benchmark (QĐ 3116) vs Empirical observed turnaround comparison |
| `communityContextEngine.js` | Multi-dimensional slicing, temporal decay, `CONTEXT_SPLIT` separation |
| `communityIntegrityEngine.js` | Sockpuppet clusters, commercial promotion links, synthetic template detection, `RARE_EDGE_CASE` mining |
| `communityExperienceEngine.js` | Consensus evaluation, independence metrics, rumor vs fact classification |
| `communityQueryEngine.js` | 7 Canonical Query Types with 8-part structured output |
| `communityStore.js` | Multi-topic seed dataset, feedback handling, post retraction, privacy redaction |
| `CommunityIntelligenceStudioV2.jsx` | Studio console with Reality Gaps, Friction Heatmap, Provenance Inspector, Query Sandbox |

---

## 4. Verification & Hardening Results

- **Community Test Suite**: **78 / 78 Tests PASS (100.0%) across 31 Suites**.
- **Master Regression Suite**: **729 / 729 Tests PASS (100.0%) across 238 Suites**.
- **Deterministic Cycles**: 3 consecutive identical passes.
- **Next.js Production Build**: **85 / 85 Routes Compiled and Optimized (0 errors)**.
