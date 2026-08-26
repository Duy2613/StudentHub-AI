# ⚖️ Academic Decision Studio & Plan Comparison V1

## 1. Executive Overview

The **Academic Decision Studio V1** is an explainable decision support and trade-off comparison layer for StudentHub AI that answers the student's pivotal question:
> *"Trong các phương án học kỳ đã được tính toán, phương án nào phù hợp nhất với ưu tiên cá nhân của tôi? Tôi nhận được gì, đối mặt rủi ro gì và phải đánh đổi những gì giữa các lựa chọn?"*

```text
CURRENT AUTHORITATIVE STATE (Profile 360 + Digital Twin)
                          │
                          ▼
            CANDIDATE SEMESTER PLANS (Plan A, B, C)
                          │
                          ▼
              NORMALIZED COMPARISON ENGINE
       (Credits, Workload, Blocker Reduction, Progress)
                          │
                          ▼
             PREFERENCE-AWARE RANKING & TRADE-OFFS
      (Balanced vs Fast-Track vs Light Load Analysis)
                          │
                          ▼
            DECISION STUDIO COMPARISON VIEW
         (Side-by-side Table + Trade-off Cards)
                          │
                          ▼
               EXPLICIT PLAN ADOPTION
      (Revalidates Revisions ➔ Stores Draft Choice)
                          │
                          ▼
              CANONICAL WORKFLOW BRIDGE
```

---

## 2. Core Architectural Invariants

### A. Non-Autonomous Decision Support (`DECISION_SUPPORT != AUTONOMOUS_ACTION`)
1. **Decision Advisory Only**: Decision Studio scores, ranks, and highlights advantages/trade-offs based on transparent, deterministic policies. It **never** makes autonomous decisions or claims "the AI chose this for you."
2. **Zero Mutation on Adoption**: Adopting a plan (`POST /api/academic/me/decision-studio/adopt`) stores a user-confirmed draft plan with revision pinning. It **never mutates transcripts, grades, or university registrations**.
3. **Explicit Action Bridge**: Plan execution occurs strictly by handing off adopted parameters to the canonical Workflow Center (`/academic`).
4. **Distinct Output Modes**:
   - `REAL`: Authoritative student truth.
   - `SIMULATION`: Hypothetical arbitrary sandbox experimentation.
   - `PLANNING`: Candidate semester plan generation.
   - `DECISION_SUPPORT`: Normalized side-by-side comparison & trade-off analysis.

---

## 3. Component Architecture

### A. Decision Domain Model (`academicDecisionModel.js`)
- **Student Preferences**:
  - `BALANCED` (Default): Balances credit load (12–15 TC) and graduation blocker reduction with lowest risk.
  - `GRADUATE_ASAP`: Prioritizes fast-track credit accumulation (16–18 TC) to accelerate graduation.
  - `MINIMIZE_WORKLOAD`: Prioritizes light course load (6–9 TC) to minimize semester stress.
  - `PROTECT_GPA`: Prioritizes fewer courses to maximize focus on high course grades.
- **Comparison Criteria**:
  - `CREDIT_LOAD`, `WORKLOAD_RISK`, `BLOCKER_REDUCTION`, `ROADMAP_PROGRESS_DELTA`, `ELIGIBILITY_STATUS`, `GOAL_ALIGNMENT`.
- **Adoption Records**: Scoped by `studentId`, `planId`, `targetTerm`, `baseRevisions`, `status: "ADOPTED"`.

### B. Decision & Trade-Off Engine (`academicDecisionEngine.js`)
- **Normalized Plan Evaluation**: Computes uniform comparison metrics directly from `AcademicSemesterPlannerEngine` and `AcademicSimulationEngine`.
- **Preference-Aware Re-Ranking**: Ranks plans deterministically based on student preference (e.g. under `GRADUATE_ASAP`, Fast-Track is ranked top with score 96).
- **Pairwise Trade-Off Matrix**: Explains explicit advantages, disadvantages, and verdicts for all plan pairs (Plan A vs B, Plan A vs C).
- **Revision-Guarded Adoption**: Verifies `profileRevision` and `twinRevision` match live state before storing adoption.

### C. Decision & Adoption Store (`academicDecisionStore.js`)
- Provides multi-student isolated storage for adopted draft plans.
- Marks prior adoptions for the same semester as `SUPERSEDED` when a new plan is selected.
- Validates staleness via `isAdoptionStale(adoptedRecord, currentProfRev, currentTwinRev)`.

---

## 4. REST API Contract

### `POST /api/academic/me/decision-studio`
- **Request**:
  ```json
  {
    "targetTerm": "2026-HK1",
    "studentPreference": "GRADUATE_ASAP"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "decisionStudio": {
      "mode": "DECISION_SUPPORT",
      "studentId": "24110001",
      "targetTerm": "2026-HK1",
      "studentPreference": "GRADUATE_ASAP",
      "plans": [
        {
          "planId": "PLAN_24110001_2026-HK1_FAST_TRACK",
          "planType": "FAST_TRACK",
          "title": "Kế hoạch Tăng Tốc (Fast-Track)",
          "totalCredits": 18,
          "decisionScore": 96,
          "riskLevel": "MEDIUM",
          "goalAlignment": "ACCELERATED (Rút ngắn thời gian tốt nghiệp...)"
        }
      ],
      "tradeOffs": [...],
      "recommendation": {
        "recommendedPlanId": "PLAN_24110001_2026-HK1_FAST_TRACK",
        "rationale": "..."
      }
    }
  }
  ```

---

## 5. Verification & Certification

- **Master Regression**: 511 / 511 tests PASS across 149 suites (100.0% PASS RATE).
- **Mutants Killed**: 47 / 47 mutants killed across all academic modules.
- **Repeatability**: 3 / 3 cycles deterministic PASS.
