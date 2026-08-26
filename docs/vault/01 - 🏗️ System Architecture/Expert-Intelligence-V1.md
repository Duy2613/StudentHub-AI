# 🎓 Expert Intelligence V1 (Phase T2 — Comprehensive Architecture Spec)

## 1. Executive Summary

**Expert Intelligence V1** is the second standalone intelligence pillar of the **StudentHub Intelligence OS**. It provides an **Auditable Expert Knowledge Graph**, strict **Multi-Signal Entity Resolution**, fine-grained **Domain Scope Graphs**, and enforces the non-negotiable core invariant:

```text
==================================================================================
                     EXPERTISE ≠ INSTITUTIONAL AUTHORITY
==================================================================================
A verified Professor with deep scientific expertise in Artificial Intelligence 
(Domain: AI_ML) DOES NOT possess administrative registrar authority to establish 
or alter HCMUTE academic regulations, tuition deadlines, or graduation criteria.
==================================================================================
```

---

## 2. System Topology & Knowledge Pipeline

```text
EXPERT
  │
  ▼
IDENTITY & ENTITY RESOLUTION
(Multi-Signal: ORCID, Verified Email @hcmute.edu.vn, Institutional Directory, DOIs)
  │
  ▼
CREDENTIAL LIFECYCLE STATE MACHINE
(VERIFIED • PARTIALLY_VERIFIED • UNVERIFIED • EXPIRED • DISPUTED • REVOKED)
  │
  ▼
MULTI-DIMENSIONAL DOMAIN EXPERTISE GRAPH
(Domain • Subdomain • Citations • Recency • Strength: STRONG / MODERATE / NOT_ESTABLISHED)
  │
  ▼
DISCIPLINARY & ADMINISTRATIVE JURISDICTION
(Technical Domain vs Institutional Registrar Authority with Active Temporal Intervals)
  │
  ▼
CONFLICT OF INTEREST & PROMOTIONAL FILTER
(Detects commercial endorsements, vendor affiliations, and sponsored advice)
  │
  ▼
CLAIM CLASSIFICATION & VERSIONING
(Opinion • Interpretation • Technical Claim • Research Claim • Retraction Propagation)
  │
  ▼
SHARED PROVENANCE & CONSENSUS ENGINE
(Collapses shared single-source citations into 1 cluster; requires >= 3 independent sources)
```

---

## 3. Core Architectural Modules

| Subsystem Component | File | Invariants & Operational Role |
| :--- | :--- | :--- |
| **Domain Model & State Machines** | [expertIntelligenceModel.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/expert/expertIntelligenceModel.js) | Canonical factories, 7 credential states, 8 claim types, and public privacy redaction. |
| **Multi-Signal Entity Resolver** | [expertEntityResolver.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/expert/expertEntityResolver.js) | Disambiguates same-name candidates via ORCID/email; flags `IDENTITY_AMBIGUOUS` to prevent fake merges. |
| **Scope & Jurisdiction Engine** | [expertScopeEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/expert/expertScopeEngine.js) | Evaluates claim domain alignment, time-bounded administrative roles, and shared citation clusters. |
| **Durable Expert Store** | [expertStore.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/expert/expertStore.js) | Persistent disk storage, multi-signal lookups, and private field redaction. |
| **Query & Answering Engine** | [expertQueryEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/expert/expertQueryEngine.js) | Matches user domain questions to verified scope graphs without generating fake vanity scores. |
| **Server API Endpoints** | `api/intelligence/experts/...` | Server-authoritative routes (`GET /api/intelligence/experts`, `POST /api/intelligence/experts/resolve`, etc.). |
| **Knowledge Graph UI Studio** | [ExpertKnowledgeGraphView.jsx](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/expert/ExpertKnowledgeGraphView.jsx) | Interactive Multi-Signal Entity Inspector, Scope Radar, Evidence Panels, and Claim Sandbox (`/intelligence/experts`). |

---

## 4. 10 Adversarial Red-Team Defenses

1. **Attack A (Fake Professor)**: Unverified self-proclaimed CVs remain `UNVERIFIED_EXPERT` and cannot produce verified expert claims.
2. **Attack B & C (Same-Name Collision)**: Multiple candidates with identical names without disambiguating signals return `IDENTITY_AMBIGUOUS`, never merged silently.
3. **Attack D (Fake University Page)**: Requires authoritative registry or official domain email.
4. **Attack E (AI-Generated CV)**: Unindexed degrees remain `UNVERIFIED`.
5. **Attack F (Expired Administrative Position)**: Roles with `validUntil < NOW` return `AUTHORITY_MISMATCH` for current regulations.
6. **Attack G (Cross-Domain Statements)**: Statements outside established scope return `OUT_OF_SCOPE`.
7. **Attack H (Sponsored Recommendation)**: Commercial endorsements return `CONFLICT_OF_INTEREST`.
8. **Attack I (Circular Consensus)**: Multiple experts citing the same DOI are collapsed into `1 Shared Evidence Cluster`.
9. **Attack J (Retracted Publication)**: Dependent claims are marked `RETRACTED` and re-evaluated.
10. **Privacy Shield**: Private phone numbers, personal emails, and citizen IDs are automatically redacted for public endpoints.

---

## 5. API Reference

### `POST /api/intelligence/experts/resolve`
- **Request**:
  ```json
  { "name": "Nguyễn Văn Minh", "orcid": "0000-0002-1825-0097" }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "resolution": {
      "status": "EXACT_MATCH",
      "confidence": 1.0,
      "expert": { "expertId": "EXP_DR_MINH_AI", "name": "TS. Nguyễn Văn Minh" }
    }
  }
  ```

### `POST /api/intelligence/experts/:expertId/claims`
- **Request**:
  ```json
  {
    "text": "Mô hình Transformer nén tối ưu cho thiết bị IoT.",
    "domain": "AI_ML",
    "claimJurisdiction": "TECHNICAL_DOMAIN"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "evaluation": {
      "claimStatus": "QUALIFIED_EXPERT_OPINION",
      "answerMode": "EXPERT_SUPPORTED",
      "isWithinExpertise": true,
      "isWithinJurisdiction": true
    }
  }
  ```
