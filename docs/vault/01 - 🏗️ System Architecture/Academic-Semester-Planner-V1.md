# 📅 Academic Semester Planner & Constraint-Based Study Planning V1

## 1. Executive Overview

The **Academic Semester Planner V1** is an optimization and planning engine for StudentHub AI that answers the student's central planning question:
> *"Với tình trạng học tập hiện tại của tôi, học kỳ tới tôi nên làm gì và đăng ký những học phần nào để tiến gần mục tiêu tốt nghiệp nhất mà không vi phạm các điều kiện học vụ?"*

```text
AUTHORITATIVE STUDENT STATE (Profile 360 + Digital Twin)
                          │
                          ▼
            CURRICULUM & PREREQUISITE GRAPH
       (HCMUTE Catalog DAG, Availability, Unlocks)
                          │
                          ▼
                  CONSTRAINT ENGINE
       (Hard: Prereqs, Bounds [6-20], Cohort Rules)
       (Soft: Workload balance, Blocker reduction)
                          │
                          ▼
               CANDIDATE PLAN GENERATOR
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
     PLAN A             PLAN B             PLAN C
  (Recommended ⭐)   (Fast-Track ⚡)     (Light Load 🌱)
   12-15 Credits      16-18 Credits       6-9 Credits
       └──────────────────┼──────────────────┘
                          │
                          ▼
            WHAT-IF SIMULATION PROJECTION
        (Projected Credits, Roadmap %, Blockers)
                          │
                          ▼
             PLAN COMPARISON & SELECTION
                          │
                          ▼
               EXPLICIT WORKFLOW BRIDGE
```

---

## 2. Core Architectural Invariants

### A. Principle of Non-Mutation (`PLAN != REALITY`)
1. **Zero Database Writes**: Candidate plan generation is pure computation over immutable input snapshots.
2. **Zero Store Mutation**: Does not mutate `StudentProfile360`, `StudentDigitalTwin`, `AcademicRecordsStore`, `AcademicTaskStore`, or `AcademicNotificationStore`.
3. **No Automatic Registration**: Adopting a plan creates a personal draft; course enrollment requires explicit student action on the official university portal.
4. **Distinct Output Modes**:
   - `REAL`: Authoritative student truth.
   - `SIMULATION`: Hypothetical arbitrary sandbox experimentation.
   - `PLANNING`: Feasible, constraint-bounded, actionable study recommendations.

---

## 3. Component Architecture

### A. Prerequisite & Course Graph Engine (`academicPrerequisiteEngine.js`)
- **Canonical Course Source**: `HCMUTE_UNIVERSITY_PROFILE.courses`.
- **DAG Integrity**: Verified cycle-free via DFS traversal.
- **Prerequisite Validation**: Matches course prerequisites against student's passed course history.
- **Downstream Unlock Cascade**: Calculates bottleneck unlock weight for each course.
- **Semester Availability**: Filters courses offered in Semester 1, 2, or 3 (Summer).

### B. Planner Domain Model (`academicPlannerModel.js`)
- **Standard Terms**: `2026-HK1`, `2026-HK2`, `2026-HK3` (Summer).
- **Institutional Credit Bounds**:
  - Minimum: 6 credits.
  - Maximum: 20 credits.
  - Recommended: 12–16 credits.
  - Summer Maximum: 9 credits.
- **Plan Archetypes**:
  - `RECOMMENDED` (Plan A): 12–15 credits, optimal balance of blocker reduction and workload.
  - `FAST_TRACK` (Plan B): 16–18 credits, maximum prerequisite acceleration.
  - `LIGHT_LOAD` (Plan C): 6–9 credits, foundational repair & minimum risk.

### C. Semester Planning Engine (`academicSemesterPlannerEngine.js`)
- **Candidate Formulation**: Selects feasible courses obeying all hard constraints.
- **What-If Projection Composition**: Directly invokes `AcademicSimulationEngine.simulateScenario()` for each plan to calculate:
  - `projectedCredits`
  - `projectedRoadmapProgress`
  - `projectedEligibilityStatus`
  - `resolvedBlockerCount`
- **Explainability**: Cites specific prerequisite unlocks and curriculum requirement satisfaction for each recommendation.
- **Staleness Detection**: Compares `baseRevisions` (`profileRevision`, `twinRevision`) against live state.

---

## 4. REST API Contract

### `POST /api/academic/me/planner`
- **Request**:
  ```json
  {
    "targetTerm": "2026-HK1",
    "creditTarget": 15
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "planning": {
      "mode": "PLANNING",
      "studentId": "24110001",
      "targetTerm": "2026-HK1",
      "termName": "Học kỳ 1 (2026–2027)",
      "baseline": {
        "earnedCredits": 20,
        "cgpa": 2.85,
        "completedCourseCount": 6,
        "feasibleCourseCount": 14
      },
      "candidatePlans": [
        {
          "planId": "PLAN_24110001_2026-HK1_RECOMMENDED_...",
          "planType": "RECOMMENDED",
          "title": "Kế hoạch Cân Bằng (Khuyến nghị ⭐)",
          "totalCredits": 15,
          "riskLevel": "LOW",
          "score": 95,
          "selectedCourses": [...],
          "selectedActions": [...],
          "projectedOutcome": {
            "projectedCredits": 35,
            "projectedRoadmapProgress": { "percentage": 43 },
            "resolvedBlockerCount": 1
          },
          "explanation": "..."
        }
      ]
    }
  }
  ```

---

## 5. Verification & Test Certification

- **Baseline Pre-Execution**: 478 / 478 tests PASS across 133 suites.
- **New Test Files Added**: 8 test suites (prerequisite DAG, constraints, ranking, e2e, staleness, auth, mutation defense).
- **Mutants Killed**: 4/4 planner mutation invariants verified.
- **Repeatability**: 3/3 cycles deterministic pass.
