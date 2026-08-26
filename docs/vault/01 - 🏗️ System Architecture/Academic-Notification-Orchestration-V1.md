---
title: "Academic Notification & Deadline Orchestration V1 Architecture"
tags: ["academic-notification", "deadline-orchestration", "reminder-policy", "idempotency", "auto-stop", "system-architecture"]
status: "RELEASED"
date: "2026-08-26"
---

# Academic Notification & Deadline Orchestration V1

## 1. Executive Summary

The **Academic Notification & Deadline Orchestration V1** establishes the proactive, time-aware intelligence layer of StudentHub AI. It coordinates notifications, deadline calculations, reminder intervals, user acknowledgements, and automatic cancellation upon task completion.

```text
ACADEMIC RULE / SNAPSHOT / TASK
          ↓
DEADLINE INTELLIGENCE ENGINE (Asia/Ho_Chi_Minh timezone, pure date arithmetic)
          ↓
REMINDER POLICY (7d / 3d / 1d / Day-of / Overdue)
          ↓
NOTIFICATION ORCHESTRATOR
  ├── Deterministic Deduplication (studentId:taskId:type:v{ver}:{window})
  ├── Atomic Crash-Safe Persistence (.tmp ➔ renameSync + Rehydration)
  ├── Multi-Channel Delivery (In-App first-class, privacy-safe email/push)
  └── Event Invariants:
        ├─ Task COMPLETED ➔ Auto-Cancel all future reminders
        ├─ Deadline Extended (30/08 ➔ 05/09) ➔ Cancel old schedule, schedule new
        ├─ Source Invalidated ➔ Hold / cancel obsolete notifications
        └─ Digital Twin Updated (TOEIC 480 ➔ 560) ➔ Reconcile & cancel obsolete
          ↓
COMMAND CENTER 2.0 & NOTIFICATION CENTER DRAWER
```

---

## 2. Invariants & Guarantees

### 2.1 Single Notification Path
- No feature module, UI component, or task model directly dispatches notifications. All alerts must pass through `AcademicNotificationOrchestrator`.

### 2.2 Task Completion Auto-Stop
- When a task reaches `COMPLETED` or `VERIFIED`, all pending `SCHEDULED` or `QUEUED` reminders for that task are immediately transitioned to `CANCELLED` with audit history.

### 2.3 Deadline Change Reconciliation
- When a deadline is officially modified (e.g. `30/08` $\rightarrow$ `05/09`), previous version notifications are cancelled and replaced with the updated deadline version (`v2`). No stale dates are ever delivered.

### 2.4 Idempotent Deduplication
- Every notification is keyed by `deriveDedupeKey(studentId, taskId, type, deadlineVersion, reminderWindow)`. Repetitive sync passes, page refreshes, and cron retries produce zero duplicate records.

### 2.5 Multi-Tenant Authorization & Privacy
- Student A cannot view, mark read, acknowledge, or snooze Student B's notifications.
- Privacy filter automatically redacts passwords, OTPs, and private financial identifiers from notifications.

---

## 3. Verification & Testing Matrix

| Test Suite | Tests | Coverage |
|---|---|---|
| `academic_deadline_engine.test.mjs` | 5 | Date parsing, UTC+7 calendar math, urgency states. |
| `academic_notification_policy.test.mjs` | 3 | Reminder window offsets (7d, 3d, 1d, day-of, overdue). |
| `academic_notification_deduplication.test.mjs` | 3 | Deterministic dedupe key computation and idempotency. |
| `academic_notification_state_machine.test.mjs` | 3 | Legal progression, snooze rescheduling, illegal transition rejection. |
| `academic_notification_store.test.mjs` | 3 | Atomic journaling, restart rehydration, optimistic revision checks. |
| `academic_notification_reconciliation.test.mjs` | 1 | Golden deadline extension (30/08 $\rightarrow$ 05/09) scenario. |
| `academic_notification_completion_stop.test.mjs` | 1 | Task completion auto-cancellation. |
| `academic_notification_authorization.test.mjs` | 3 | Multi-tenant boundary checks and privacy keyword sanitization. |
| `academic_notification_scheduler.test.mjs` | 2 | Dispatch cycles, retry backoff, health signal telemetry. |
| `academic_notification_e2e.test.mjs` | 1 | Full end-to-end golden loop. |
| **Total Full Regression Suite** | **388 / 388** | **100% PASS across 47 files, 94 suites** |
| **Security Mutants** | **31 / 31** | **100% KILLED** |
