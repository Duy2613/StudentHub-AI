---
title: "Student Academic Digital Twin & Eligibility Engine V1 Architecture"
tags: ["student-digital-twin", "eligibility-engine", "academic-profile", "single-source-of-truth", "explainable-ai", "system-architecture"]
status: "RELEASED"
date: "2026-08-26"
---

# Student Academic Digital Twin & Eligibility Engine V1

## 1. Executive Summary

The **Student Academic Digital Twin V1** establishes the canonical, authoritative Single Source of Truth for all student academic facts within StudentHub AI.

```text
AUTHORITATIVE STUDENT STATE (Portal / Transcripts / Certificates)
                    ↓
        STUDENT DIGITAL TWIN
                    ↓
  ┌─────────────────┼─────────────────┐
  ▼                 ▼                 ▼
ELIGIBILITY      IMPACT            WORKFLOW
  ENGINE         ENGINE             ENGINE
  │                 │                 │
  └─────────────────┼─────────────────┘
                    ▼
            ACADEMIC INSIGHT
                    ↓
            ACTION PLAN & TASK
                    ↓
          COMMAND CENTER & DRAWER
```

---

## 2. Digital Twin Domain Schema (`studentDigitalTwinModel.js`)

| Domain Attribute | Type | Description / Constraints |
|---|---|---|
| `studentId` | `string` | Canonical student identifier (e.g. `"24110001"`). |
| `cohort` | `number` | Admission year (e.g. `2024`). Constraint: `[2000, 2099]`. |
| `programCode` / `programName` | `string` | Official degree program (e.g. `"7480103"` / `"Kỹ thuật Phần mềm"`). |
| `earnedCredits` / `totalRequiredCredits` | `number` | Completed credits (e.g. `115/150`). Invariant check: `[0, total + 40]`. |
| `cgpa` / `majorGpa` | `number` | Cumulative Grade Point Average. Invariant check: `[0.0, 4.0]`. |
| `courses` | `Array` | Transcript of course records with codes, credits, grades, and pass flags. |
| `certificates` | `Array` | Verified international certifications (TOEIC, IELTS, VSTEP) with official scores. |
| `tuitionPaid` / `debtAmount` | `boolean` / `number` | Administrative and financial clearance state. |
| `sourceAuthority` / `asOf` | `string` / `ISO` | Data provenance (e.g. `"HCMUTE_DAOTAO_PORTAL"`) and snapshot freshness. |

---

## 3. Typed Academic Eligibility Engine (`academicEligibilityEngine.js`)

Evaluates requirements strictly without using `eval()` or dynamic string execution:

- `CREDITS_MIN`: Evaluates `twin.earnedCredits >= requiredCredits`.
- `GPA_MIN`: Evaluates `twin.cgpa >= requiredGpa`.
- `CERTIFICATE_PRESENT`: Evaluates official verified certificate scores (e.g. TOEIC $\ge 550$).
- `COURSE_COMPLETED`: Evaluates prerequisite course completions.
- `TUITION_CLEAR`: Evaluates financial status.

### Status Outcomes:
- `ELIGIBLE`: All graduation/academic requirements satisfied.
- `PARTIALLY_ELIGIBLE`: Some requirements satisfied, with structured missing list.
- `NOT_ELIGIBLE`: Prerequisite criteria not met.
- `INSUFFICIENT_DATA`: Missing student profile or records.

---

## 4. Digital Twin ➔ Workflow Auto-Reconciliation

When a student updates their Digital Twin (e.g. submitting verified TOEIC `560` replacing `480`):
1. `AcademicWorkflowReconciliationEngine.reconcileWithDigitalTwin` identifies active tasks.
2. The relevant step is automatically marked `COMPLETED` with verified certificate evidence.
3. Progress is recalculated (e.g. `67%` $\rightarrow$ `100%`).
4. Emits `TASK_RECONCILED` audit event (`actor: "DIGITAL_TWIN_RECONCILIATION"`).

---

## 5. Verification & Testing Matrix

| Test File | Tests | Coverage |
|---|---|---|
| `academic_digital_twin.test.mjs` | 8 | Invariant boundaries, consistency validation, durable twin store, boundary isolation. |
| `academic_eligibility_engine.test.mjs` | 5 | Typed evaluators, explainability strings, fail-closed handling. |
| `academic_twin_workflow_reconciliation.test.mjs` | 2 | Auto-reconciliation upon TOEIC 480 $\rightarrow$ 560 update. |
| **Total Full Regression Baseline** | **363 / 363** | **100% PASS across 37 files, 84 suites** |
| **Security Mutants** | **31 / 31** | **100% KILLED** |
