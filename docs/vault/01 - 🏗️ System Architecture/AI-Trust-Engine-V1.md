# 🛡️ AI Trust Engine V1 (Phase T1)

## 1. Executive Overview

The **AI Trust Engine V1** is the foundational reliability, grounding, and verification subsystem of the **StudentHub Intelligence OS**.

```text
USER QUERY
    │
    ▼
┌───────────────────────────┐
│ QUERY RISK CLASSIFICATION │ (LOW, MEDIUM, HIGH, CRITICAL)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ ADVERSARIAL & PROMPT INJ. │ (Treats retrieved text strictly as DATA;
│          GUARD            │  Neutralizes prompt injection & instruction overrides)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│  SOURCE AUTHORITY FILTER  │ (Tier 1 Registrar -> Tier 2 Faculty -> Tier 3 Expert
│     & INDEPENDENCE        │  -> Tier 4 Community; Clusters syndicated copies)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│  CLAIM DECOMPOSITION      │ (Decomposes responses into atomic claims:
│         ENGINE            │  Subject, Predicate, Object, Scope, Numeric thresholds)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│  CITATION ENTAILMENT      │ (Exact passage span semantic & numeric alignment;
│         ENGINE            │  Detects CITATION_MISMATCH and CITATION_FABRICATED)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│  TEMPORAL & CONTRADICTION │ (Differentiates SUPERSESSION vs TRUE CONTRADICTION;
│         ENGINE            │  Flags STALE / RETRACTED / CONFLICTED policies)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│   ABSTENTION & DECISION   │ (High-stake claims without official proof ->
│        COMPOSER           │  ABSTAIN with transparent audit explanation)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ AUDITABLE TRUST OBJECT    │ (Multi-dimensional Trust Metrics + Provenance Graph)
└───────────────────────────┘
```

---

## 2. Core Architectural Invariants

1. **`CONFIDENCE NEVER CREATES AUTHORITY`**:
   High model certainty or confident prose can **never** override evidence quality or fabricate institutional truth. AI output is strictly synthetic reasoning until verified against authoritative source documents.

2. **`CLAIM-LEVEL GROUNDING`**:
   The engine does not evaluate responses as monolithic strings. It decomposes answers into atomic propositions:
   `{ claimId, subject, predicate, object, qualifiers, scope, jurisdiction, effectiveFrom, effectiveUntil, status }`.
   - **Compound Sentence Defense**: Splitting conjunctions ("A và B") so one valid citation cannot cover unsupported neighboring clauses.
   - **Numeric Defense**: Verifying exact score thresholds (e.g. TOEIC 550), credits, deadlines, and cohort scopes (e.g. K24).

3. **`TEMPORAL VALIDITY & SUPERSESSION`**:
   - A newer official policy replacing an older policy is **SUPERSESSION** (`TEMPORAL_STATUS.SUPERSEDED`), not a contradiction. The active decision uses the newer policy.
   - Two concurrent, active official documents disagreeing is a **TRUE CONTRADICTION** (`CONFLICTED`), triggering human review.
   - Retracted documents immediately invalidate dependent claims (`RETRACTED`).

4. **`SOURCE INDEPENDENCE & LAUNDERING DEFENSE`**:
   - Multiple sites mirroring the same text/content hash are clustered into **1 Provenance Cluster** and never counted as multiple independent corroborations.
   - Circular laundering loops (Forum -> Blog -> Search Result) are detected and demoted to community-tier provenance.

5. **`ABSTENTION AS A FIRST-CLASS CITIZEN`**:
   For `CRITICAL` or `HIGH` stakes lacking authoritative proof or encountering contradictory official documents, the AI is required to abstain (`INSUFFICIENT_EVIDENCE` / `OFFICIAL_CONFLICT`).

---

## 3. Subsystem Architecture

| Module | File | Role & Invariants |
| :--- | :--- | :--- |
| **Domain Model** | [aiTrustModel.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/trust/aiTrustModel.js) | Canonical models, enums (`STAKE_LEVEL`, `CLAIM_TYPE`, `SOURCE_TYPE`, `AUTHORITY_TIER`, `TEMPORAL_STATUS`, `CITATION_STATUS`, `TRUST_STATUS`, `ABSTENTION_REASON`), and multi-dimensional trust metrics. |
| **Adversarial Guard** | [adversarialTrustGuard.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/trust/adversarialTrustGuard.js) | Prompt injection defense, instruction vs data separation, citation URL validation. |
| **Source Independence** | [sourceIndependenceEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/trust/sourceIndependenceEngine.js) | Content hashing, syndication clustering, laundering detection. |
| **Claim Decomposition** | [claimDecompositionEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/trust/claimDecompositionEngine.js) | Atomic claim extraction, compound sentence splitting, numeric & cohort scope parsing. |
| **Citation Entailment** | [citationEntailmentEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/trust/citationEntailmentEngine.js) | Exact passage span semantic & numeric entailment verification, mismatch detection. |
| **Temporal & Contradiction** | [temporalContradictionEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/trust/temporalContradictionEngine.js) | Supersession vs contradiction evaluation, temporal validity scoring. |
| **Trust Orchestrator** | [aiTrustEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/trust/aiTrustEngine.js) | End-to-end pipeline execution, multi-dimensional synthesis, abstention composer. |
| **Trust Store** | [aiTrustStore.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/trust/aiTrustStore.js) | Persistent storage, retrieval, and deterministic replay of evaluations. |
| **UI Studio** | [AiTrustStudioView.jsx](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/trust/AiTrustStudioView.jsx) | Interactive Trust Studio with Claim Inspector, Evidence Highlighting, Entailment Matrix, and Adversarial Shield. |

---

## 4. Multi-Dimensional Trust Metrics

Instead of a single misleading confidence score (e.g. `0.96`), the Trust Engine computes:
```json
{
  "provenanceScore": 1.0,
  "authorityScore": 100,
  "evidenceQuality": 1.0,
  "claimCoverage": 1.0,
  "citationAccuracy": 1.0,
  "temporalValidity": 1.0,
  "sourceIndependenceScore": 1.0,
  "contradictionSeverity": 0.0,
  "manipulationRisk": 0.0,
  "uncertainty": 0.0
}
```

---

## 5. REST API

### `POST /api/ai/trust/evaluate`
- **Request**:
  ```json
  {
    "query": "HCMUTE yêu cầu TOEIC bao nhiêu điểm đối với K24?",
    "rawAnswer": "HCMUTE yêu cầu TOEIC 550 điểm đối với K24.",
    "sources": [...],
    "evidenceSpans": [...],
    "stakeLevel": "HIGH"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "evaluation": {
      "evaluationId": "TRUST_EVAL_...",
      "trustStatus": "AUTHORITATIVE",
      "requiresAbstention": false,
      "claims": [...],
      "citations": [...],
      "metrics": {...}
    }
  }
  ```
