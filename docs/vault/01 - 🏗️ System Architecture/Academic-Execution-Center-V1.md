# 📊 Academic Execution Center & Plan-Actual Reconciliation V1

## 1. Executive Overview

The **Academic Execution Center V1** closes the planning and study journey loop in StudentHub AI:

```text
       ADOPTED PLAN (Decision Studio)
                     │
                     ▼
           EXECUTION CENTER V1
  (Plan vs Actual Reconciliation Engine)
                     │
                     ▼
       REAL ACADEMIC REALITY (Authoritative)
   (Transcripts, Grades, Twin, Clearances)
                     │
                     ▼
             PLAN DRIFT DETECTION
     (None / Low / Medium / High / Critical)
                     │
                     ▼
          EXPLAINABLE REPLANNING CTA
                     │
                     ▼
         DECISION STUDIO & WHAT-IF
```

Sinh viên luôn có câu trả lời rõ ràng, minh bạch cho câu hỏi:
> *"Kế hoạch tôi đã chọn đang tiến triển ra sao? Có học phần nào bị chậm hoặc trượt không? Độ lệch ảnh hưởng thế nào đến lộ trình tốt nghiệp và tôi cần làm gì tiếp theo?"*

---

## 2. Core Architectural Invariants

### A. Non-Authoritative Tracking (`TRACK + RECONCILE != RECORD AUTHORITY`)
1. **Authoritative Sources of Truth**: The actual academic truth remains strictly with:
   - `Profile 360` & `AcademicRecordsStore` (Official transcripts & course history)
   - `StudentDigitalTwinStore` & `AcademicEligibilityEngine` (Certificates & graduation criteria)
   - `StudentIdentityStore` (Authoritative student identity)
2. **Actual > Plan Invariant**: When an adopted plan expects a course or certificate to be completed, but the real transcript shows it is incomplete, failed, or missing, **actual verified state always wins**. The system never silently mutates or assumes the plan is actual.
3. **No Autonomous Replanning**: When plan drift is detected (e.g. `CRITICAL` drift from failing a prerequisite course), the system generates clear, explainable warnings and replanning recommendations, but **never** silently switches the student's adopted plan. The student remains the sole decision maker.
4. **Plan Supersession & Audit History**: Adopting a new plan preserves previous execution snapshots with `SUPERSEDED` state, maintaining complete historical provenance of the student's academic journey.

---

## 3. Component Architecture

### A. Execution Domain Model (`academicExecutionModel.js`)
- **Execution States**: `NOT_STARTED`, `ACTIVE`, `AT_RISK`, `BLOCKED`, `COMPLETED`, `STALE`, `SUPERSEDED`.
- **Item Execution Statuses**: `PLANNED`, `ENROLLED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `WITHDRAWN`, `NOT_OFFERED`.
- **Drift Severities**: `NONE`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- **Drift Categories**: `COURSE_DELAYED`, `COURSE_FAILED`, `COURSE_NOT_OFFERED`, `CREDENTIAL_MISSING`, `REQUIREMENT_CHANGED`, `DEADLINE_CHANGED`, `PROFILE_CHANGED`, `CURRICULUM_CHANGED`, `DATA_CONFLICT`, `WORKFLOW_BLOCKED`.
- **Replan Recommendations**: `NO_ACTION`, `CONTINUE`, `ADJUST`, `REPLAN`, `REVIEW_REQUIRED`.

### B. Plan Drift & Reconciliation Engine (`academicPlanDriftEngine.js`)
- Reconciles adopted plan items against live transcripts (`AcademicRecordsStore`), digital twins (`StudentDigitalTwinStore`), and tasks (`AcademicTaskStore`).
- Calculates credit progress, item completion percentages, and drift scores.
- Produces human-friendly explanations linking course prerequisites to graduation impact.
- Enforces staleness checks when `profileRevision` or `twinRevision` changes.

### C. Execution Store (`academicExecutionStore.js`)
- Multi-student isolation.
- Revision pinning and historical execution audit preservation.

---

## 4. REST API Contract

### `GET /api/academic/me/execution?targetTerm=2026-HK1`
- **Response**:
  ```json
  {
    "success": true,
    "execution": {
      "executionId": "EXEC_24110001_PLAN_RECOMMENDED_2026-HK1",
      "adoptedPlanId": "PLAN_24110001_2026-HK1_RECOMMENDED",
      "studentId": "24110001",
      "targetTerm": "2026-HK1",
      "status": "ACTIVE",
      "progress": {
        "plannedTotalCredits": 14,
        "actualCompletedCredits": 7,
        "completedItemCount": 2,
        "totalItemCount": 4,
        "progressPercentage": 50
      },
      "drift": {
        "driftState": "NONE",
        "driftScore": 0,
        "driftReasons": [],
        "recommendedResponse": "NO_ACTION",
        "replanRationale": ""
      },
      "plannedItems": [...]
    }
  }
  ```

---

## 5. Verification & Certification

- **Master Regression**: 526 / 526 tests PASS across 157 suites (100.0% PASS RATE).
- **Mutants Killed**: 51 / 51 mutants killed across all academic modules.
- **Repeatability**: 3 / 3 cycles deterministic PASS.
