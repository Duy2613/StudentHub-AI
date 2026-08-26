# 👥 Community Intelligence V1 (Phase T3 — Comprehensive Architecture Spec)

## 1. Executive Summary

**Community Intelligence V1** is the third standalone intelligence pillar of the **StudentHub Intelligence OS**. It provides the **Real-World Experience Layer**, empirical **Procedure Duration Tracking**, **Multi-Account Experience Consensus**, and robust defense mechanisms against sockpuppets and coordinated astroturfing.

```text
==================================================================================
           COMMUNITY EXPERIENCE NEVER CREATES OFFICIAL ACADEMIC POLICY
==================================================================================
Community reports capture OPERATIONAL REALITY (e.g. real turnaround times, friction 
points, and edge-cases), but when conflicting with published academic guidelines, 
the Registrar Office decisions remain the sole authoritative ground truth.
==================================================================================
```

---

## 2. System Topology & Operational Pipeline

```text
STUDENT EXPERIENCE REPORT / FORUM THREAD
  │
  ▼
SALTED IDENTITY PRIVACY & ANONYMIZATION
(Converts SV21110001 -> STUDENT_K21_3FA28D01; preserves cohort & verification badge)
  │
  ▼
7-DIMENSIONAL CONTENT CLASSIFICATION
(FIRST_HAND_EXPERIENCE • PRACTICAL_TIP • PROCEDURE_TIMELINE • EDGE_CASE_WARNING • 
 OPINION_REVIEW • SECOND_HAND_REPORT • UNVERIFIED_RUMOR • SPAM_OR_PROMOTION)
  │
  ▼
ADVERSARIAL MANIPULATION SHIELD
(Fingerprint hashing for copy-paste syndication • Device clustering for sockpuppets • 
 Repeated promotional vendor link detection)
  │
  ▼
REAL-WORLD EXPERIENCE CONSENSUS GRAPH
(Evaluates >= 3 independent students across distinct phrasing & semesters)
  │
  ▼
MEDIAN DURATION & EDGE-CASE MINING
(Calculates empirical turnaround time in days • Highlights pitfalls & system nuances)
  │
  ▼
OFFICIAL REGULATION CONTRAST LAYER
(Contrasts practical realities against official policy deadlines without conflating them)
```

---

## 3. Core Architectural Modules

| Subsystem Component | File | Operational Invariants |
| :--- | :--- | :--- |
| **Domain Model & State Machines** | [communityIntelligenceModel.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/community/communityIntelligenceModel.js) | Canonical post schema, 7 content types, salted privacy anonymization, and public payload redaction. |
| **Experience Consensus & Integrity Engine** | [communityExperienceEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/community/communityExperienceEngine.js) | Computes $\ge 3$ independent consensus, median turnaround days, astroturfing detection, and sockpuppet burst clustering. |
| **Durable Community Store** | [communityStore.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/community/communityStore.js) | Persistent disk JSON store with pre-seeded topics (`TOEIC_SUBMISSION_TIME`, `PREREQUISITE_WAIVER_PRACTICE`, etc.). |
| **Query & Discrepancy Engine** | [communityQueryEngine.js](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/lib/intelligence/community/communityQueryEngine.js) | Answers student questions about real turnaround times while enforcing explicit disclaimers. |
| **Server API Endpoints** | `api/intelligence/community/...` | Server routes (`GET/POST /posts`, `GET /consensus`, `POST /evaluate`). |
| **Experience Studio UI** | [CommunityExperienceStudio.jsx](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/community/CommunityExperienceStudio.jsx) | Interactive UI at `/intelligence/community` with consensus radar, turnaround timer, and edge-case callouts. |

---

## 4. Adversarial Integrity Defenses

1. **Astroturfing & Coordinated Copy-Paste**: Hashes normalized content strings into SHA-256 fingerprints; flags `SUSPECTED_COORDINATION` when multiple accounts repeat identical phrasing.
2. **Sockpuppet Cluster Detection**: Groups device and network fingerprints; detects burst posting from a single device across multiple pseudo-accounts (`SUSPECTED_SOCKPUPPET`).
3. **Commercial Vendor Promotion**: Detects repeated third-party links and triggers `ASTROTURFING_PROMOTION`.
4. **Rumor vs Fact Filter**: Flags hearsay keywords ("nghe nói", "bạn mình bảo") as `UNVERIFIED_RUMOR`.
5. **Student Privacy Shield**: Generates salted HMAC-like anonymous identifiers (`STUDENT_K21_...`) while retaining verifiable cohort badges.

---

## 5. API Reference

### `GET /api/intelligence/community/consensus?topic=TOEIC_SUBMISSION_TIME`
- **Response**:
  ```json
  {
    "success": true,
    "consensus": {
      "topic": "TOEIC_SUBMISSION_TIME",
      "consensusSignal": "STRONG_EXPERIENCE_CONSENSUS",
      "manipulationRisk": "NONE",
      "independentAccountsCount": 3,
      "medianProcedureDays": 7,
      "edgeCases": [
        { "warning": "Scan mờ mã QR kiểm tra sẽ bị từ chối.", "cohort": "K21" }
      ]
    }
  }
  ```
