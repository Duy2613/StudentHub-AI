---
title: "Durable Academic Workflow Persistence V1 Architecture"
tags: ["academic-workflow", "durable-persistence", "crash-recovery", "optimistic-concurrency", "restart-safe", "system-architecture"]
status: "RELEASED"
date: "2026-08-26"
---

# Durable Academic Workflow Persistence V1 — Architecture & Recovery Semantics

## 1. Executive Summary

The **Durable Academic Workflow Persistence V1** eliminates in-memory volatility and transforms StudentHub AI's workflow engine into a **Restart-Safe, Concurrency-Protected System**.

```text
CLIENT MUTATION REQUEST
          ↓
SERVER AUTHENTICATION & AUTHORIZATION
          ↓
OPTIMISTIC CONCURRENCY VALIDATION (Revision Check)
          ↓
STATE MACHINE EVALUATION
          ↓
IMMUTABLE WORKFLOW EVENT FACTORY
          ↓
ATOMIC WRITE-THROUGH JOURNAL (.tmp ➔ renameSync)
          ↓
IN-MEMORY INDEX & CACHE SYNC
          ↓
AUTHORITATIVE CANONICAL RESPONSE
```

---

## 2. Persistence Guarantees & Recovery Semantics

### 2.1 Atomic Crash Resilience
- All mutations are flushed to disk using a two-phase atomic write strategy:
  1. Write serialized JSON payload to a temporary file (`.tmp_[timestamp]_[nonce]`).
  2. Atomically rename the temporary file to the target storage path (`fs.renameSync`).
- If a server process or container crashes mid-write, the existing durable store file remains completely uncorrupted.

### 2.2 Startup Rehydration (`rehydrate()`)
- Upon server startup or container boot, `AcademicTaskStore.rehydrate()` reconstructs all in-memory lookup maps (`#plansById`, `#plansByStudent`, `#tasksById`, `#tasksByStudent`, `#eventsByTask`, `#recordedEventIds`).
- Verified Golden Guarantee:
  ```text
  Create Task ➔ Start Task ➔ Crash Process ➔ Restart ➔ Rehydrate ➔ Exact Same State, Progress, & Evidence
  ```

### 2.3 Optimistic Concurrency Control
- Each `AcademicTask` and `ActionPlan` maintains an integer `revision` sequence number.
- Any update submitted with an outdated revision (`incomingRevision < currentRevision`) is strictly rejected with a `STALE_REVISION_CONFLICT` exception.

### 2.4 Event Deduplication & Unique Constraints
- `eventId` uniqueness is strictly enforced via `#recordedEventIds`. Duplicate attempts to record an already processed event are safely ignored.

---

## 3. Verification & Testing Matrix

| Test File | Tests | Coverage |
|---|---|---|
| `academic_workflow_persistence.test.mjs` | 4 | Write-through journaling, rehydration, event deduplication. |
| `academic_workflow_restart.test.mjs` | 5 | 10-step Golden Crash Recovery lifecycle. |
| `academic_workflow_concurrency.test.mjs` | 3 | Simultaneous START idempotency, stale revision rejection. |
