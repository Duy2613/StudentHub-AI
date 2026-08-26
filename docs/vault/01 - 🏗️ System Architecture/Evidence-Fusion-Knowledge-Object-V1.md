# Evidence Fusion & Knowledge Object V1

> Phase T4 — Authority-Aware Non-Democratic Evidence Fusion Architecture

---

## Core Principle

**EVIDENCE IS NOT DEMOCRACY.**

Three weak sources do not defeat one authoritative source. Twenty community posts do not outweigh one current official regulation. One expert does not override institutional authority. AI agreement does not create truth.

## Four Knowledge Layers

| Layer | Question | Authority Class |
|-------|----------|-----------------|
| **A: Official Truth** | What is institutionally authoritative? | `INSTITUTIONAL_AUTHORITY` |
| **B: AI Verified Reasoning** | What can be safely entailed from evidence? | `AI_SYNTHESIS` |
| **C: Expert Interpretation** | How do qualified experts interpret this? | `QUALIFIED_EXPERT` |
| **D: Community Reality** | What are students actually experiencing? | `COMMUNITY_EMPIRICAL` |

## Knowledge Object Contract

```
{
  knowledgeObjectId,
  version,
  subject,
  topic,
  authoritativeState,      // 9 Epistemic Final States
  evidenceHealth,           // 6 Evidence Health States
  officialTruth,            // Layer A canonical fact
  aiVerifiedReasoning,      // Layer B synthesis
  expertInterpretation[],   // Layer C interpretations
  communityReality,         // Layer D empirical signals
  claims[],                 // Normalized canonical claims
  supportingEvidence[],
  contradictions[],
  realityGaps[],
  unknowns[],
  limitations[],
  scope,
  temporalState,
  policyVersion,
  fusionPolicyVersion,
  sourceSetHash,
  confidenceTelemetry,
  generatedAt,
  lastVerifiedAt
}
```

## Epistemic Final States

- `AUTHORITATIVE` — Verified against active official academic sources
- `SUPPORTED` — Backed by strong reasoning & expert consensus
- `PARTIALLY_SUPPORTED` — Some aspects confirmed, others unverified
- `CONTEXTUALIZED` — Official policy augmented by expert & community reality
- `CONFLICTED` — Unresolved disagreement among sources of equal authority
- `SUPERSEDED` — Historical truth replaced by newer official regulation
- `OUTDATED` — Stale information from previous terms
- `UNRESOLVED` — Insufficient or ambiguous evidence requiring review
- `UNKNOWN` — Zero verified evidence available

## Evidence Health States

- `HEALTHY` — All 4 layers aligned, current sources, high independence
- `AGING` — Sources approaching freshness SLA boundary
- `CONFLICTED` — Divergence between layers or equal authorities
- `DEGRADED` — Supporting evidence retracted or mirror down
- `STALE` — Historical regulations needing re-verification
- `REQUIRES_REVIEW` — Triggering Human Review Gate

## Authority Matrix

|                          | Official | Expert    | Community | AI        |
|--------------------------|----------|-----------|-----------|-----------|
| **Policy Truth**         | ✓ FINAL  | context   | context   | synthesis |
| **Interpretation**       | text     | ✓ DIRECT  | hearsay   | synthesis |
| **Operational Reality**  | target   | academic  | ✓ DIRECT  | discovery |
| **Prediction**           | —        | —         | —         | bounded   |

## Flagship User Experiences

1. **"WHY THIS CONCLUSION?"** — Full 4-layer breakdown with evidence lineage DAG
2. **"WHAT DISAGREES?"** — Official conflicts, expert disagreements, community reality gaps
3. **"WHAT CHANGED?"** — Knowledge Diff V1 → V2 with supersession explanation
4. **"WHAT IS STILL UNKNOWN?"** — Epistemic blindspots, missing evidence, scope limitations

## Engine Architecture

### Core Engines (`frontend/src/lib/intelligence/fusion/`)

| Engine | File | Purpose |
|--------|------|---------|
| Domain Model | `evidenceFusionModel.js` | Canonical types, factories, redaction |
| Claim Aligner | `evidenceFusionClaimAligner.js` | Semantic normalization & equivalence |
| Fusion Graph | `evidenceFusionGraph.js` | Unified DAG across all 4 layers |
| Adjudicator | `evidenceFusionAdjudicator.js` | Non-democratic authority-aware fusion |
| Temporal Engine | `evidenceFusionTemporalEngine.js` | Supersession & lifecycle management |
| Scope Engine | `evidenceFusionScopeEngine.js` | Multi-dimensional context partitioning |
| Independence Engine | `evidenceFusionIndependenceEngine.js` | Cross-layer derivation detection |
| Blast Radius | `evidenceFusionBlastRadius.js` | Downstream consumer impact analysis |
| Review Engine | `evidenceFusionReviewEngine.js` | Human Review Packet generation |
| Store | `evidenceFusionStore.js` | Multi-version persistence & diffing |

### Server API Routes

- `POST /api/intelligence/fusion/evaluate`
- `GET /api/intelligence/fusion/objects/[knowledgeObjectId]`
- `GET /api/intelligence/fusion/objects/[knowledgeObjectId]/evidence`
- `GET /api/intelligence/fusion/objects/[knowledgeObjectId]/history`
- `GET /api/intelligence/fusion/objects/[knowledgeObjectId]/conflicts`
- `GET /api/intelligence/fusion/objects/[knowledgeObjectId]/unknowns`

### Studio UI

- **Page**: `/intelligence/knowledge`
- **Component**: `KnowledgeObjectStudio.jsx`
- 6 interactive tabs: 4 Layers, Why, Disagrees, Changed, Unknown, Authority Matrix

## Test Suite (19 Files, 68 Tests)

| Suite | Count | Coverage |
|-------|-------|----------|
| Domain Model | 3 | States, factories, redaction |
| Claim Alignment | 3 | Normalization, equivalence, relations |
| Authority | 2 | Non-democratic precedence |
| Temporal | 2 | Supersession, historical filtering |
| Scope | 2 | Cohort/Faculty partitioning |
| Provenance | 1 | Evidence lineage DAG |
| Independence | 1 | Cross-layer derivation chains |
| Contradiction | 2 | Official conflict, expert disagreement |
| Supersession | 1 | V1 → V2 invalidation |
| Knowledge Object | 1 | Canonical entity contract |
| History | 1 | Knowledge Diff |
| Blast Radius | 1 | Downstream impact |
| Authorization | 1 | Privacy redaction |
| Property | 4 | Idempotency, order invariance, immunity |
| Metamorphic | 2 | Input reordering, JSON roundtrip |
| Red-Team | 15 | Attacks A–O |
| Mutation | 12 | 0 surviving mutants |
| E2E | 10 | Golden Scenarios A–J |
| UI Contract | 4 | API & store contracts |

## Related Documents

- [[System-Architecture]] — Overall system architecture
- [[00-Permanent-Memory]] — Agent permanent context
- [[Sprint-Board]] — Active sprint tracking
