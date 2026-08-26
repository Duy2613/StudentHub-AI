---
title: "Academic Action & Workflow Center V1 Architecture"
tags: ["academic-intelligence", "action-center", "workflow-engine", "state-machine", "traceability", "system-architecture"]
status: "RELEASED"
date: "2026-08-26"
---

# Academic Action & Workflow Center V1 — Architecture & Operating Workflow

## 1. Executive Summary

The **Academic Action & Workflow Center V1** transitions StudentHub AI from passive notification delivery to an active, stateful, and explainable **Academic Operating System**.

```text
OFFICIAL HCMUTE SOURCE
        ↓
DOCUMENT SNAPSHOT
        ↓
SEMANTIC DIFF
        ↓
ACADEMIC RULE EXTRACTION
        ↓
STUDENT IMPACT ANALYSIS
        ↓
ACADEMIC INSIGHT
        ↓
ACTION INTENT
        ↓
ACTION PLAN
        ↓
ACADEMIC TASK & STEPS
        ↓
WORKFLOW STATE MACHINE
        ↓
STEP EXECUTION & EVIDENCE
        ↓
VERIFICATION & COMPLETION
        ↓
TIMELINE & NOTIFICATION DISPATCH
```

---

## 2. Core Domain Contracts & Modules

### 2.1 Action Intent (`academicActionIntent.js`)
- Enforces typed action definitions (`VIEW_DOCUMENT`, `OPEN_SOURCE`, `CHECK_ELIGIBILITY`, `REGISTER`, `PAY`, `UPLOAD_DOCUMENT`, `SUBMIT_APPLICATION`, `CHECK_STATUS`, `VERIFY_INFORMATION`).
- Precondition evaluation checks credits, GPA, prerequisite course completion, and certificate thresholds before steps unlock.
- Sanitizes routes and prevents dangerous URI schemes (`javascript:`, `data:`).

### 2.2 Workflow State Machine (`academicWorkflowStateMachine.js`)
- Manages authoritative state progression:
  - `NOT_STARTED` $\rightarrow$ `READY` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `PENDING_VERIFICATION` $\rightarrow$ `COMPLETED`
  - Recoverable states: `BLOCKED`, `EXPIRED`
  - Terminal states: `COMPLETED`, `CANCELLED`
- Strictly rejects illegal regressive transitions (`COMPLETED -> NOT_STARTED`, `CANCELLED -> COMPLETED`).
- Emits immutable `WorkflowEvent` objects for complete audit retention.

### 2.3 Task Model & Deterministic IDs (`academicTaskModel.js`)
- `derivePlanId(studentId, insightId, version)`: Deterministic, stable plan identity.
- `deriveTaskId(planId, actionType)`: Prevents duplicate task generation upon page refresh.
- `calculateProgress(steps)`: Computes authoritative completion percentages (`completedSteps / totalSteps`).
- `resolveNextAction(steps)`: Identifies the immediate actionable step for student execution.

### 2.4 Task Store (`academicTaskStore.js`)
- Structured, thread-safe memory store with deep defensive cloning (`_clone`) on all queries to prevent runtime tampering.
- Indexed by `studentId`, `taskId`, and `planId`.

### 2.5 Workflow Reconciliation Engine (`academicWorkflowReconciliationEngine.js`)
- Reconciles active workflows when university rules shift (e.g. deadline extension `30/08` $\rightarrow$ `05/09`).
- Emits `TASK_RECONCILED` audit events, updates `dueAt`, and preserves student step progress without duplicate task generation or reopening historical completed records.

### 2.6 Task Authorization Guard (`academicTaskAuthorization.js`)
- Asserts `studentId` ownership on every mutation, preventing unauthorized cross-student access.
- Validates step dependencies to enforce sequential workflow completion.

---

## 3. UI Component Integration

| Component | File Path | Focus |
|---|---|---|
| **Action Center** | `frontend/src/components/academic/ActionCenter.jsx` | Renders multi-step progress bar (`3/4 bước hoàn tất ████████░░ 75%`), countdowns, and direct CTA. |
| **Workflow Detail Drawer** | `frontend/src/components/academic/WorkflowDetailDrawer.jsx` | Interactive step checklist, locked dependency badges, audit history log, and step action buttons. |
| **Command Center Container** | `frontend/src/components/academic/AcademicCommandCenter.jsx` | Server-authoritative step mutation binding via `/api/academic/tasks/[taskId]`. |

---

## 4. Verification & Testing Matrix

| Test File | Tests | Coverage |
|---|---|---|
| `academic_action_intent.test.mjs` | 7 | Intent creation, URI sanitization, precondition evaluation. |
| `academic_workflow_state.test.mjs` | 9 | State machine progression, illegal transition rejection, event factories. |
| `academic_task_model.test.mjs` | 6 | Deterministic ID generation, progress calculations, next action resolution. |
| `academic_workflow_authorization.test.mjs` | 6 | Student boundary enforcement, dependency validation. |
| `academic_workflow_reconciliation.test.mjs` | 3 | Deadline extensions (30/08 $\rightarrow$ 05/09), event logging, progress retention. |
| `academic_workflow_e2e.test.mjs` | 6 | 26-step Golden Lifecycle: Source Change $\rightarrow$ Task $\rightarrow$ Steps $\rightarrow$ Completion $\rightarrow$ Idempotency. |
| **Full Master Regression Suite** | **336 / 336** | **100% PASS across 31 files, 84 suites** |
| **Security Mutants** | **31 / 31** | **100% KILLED (0 Survivors)** |
