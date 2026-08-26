---
title: "Authoritative Student Identity & Academic Records System V1 Architecture"
tags: ["student-identity", "academic-records", "supabase-auth", "source-of-truth", "academic-clock", "sync-bridge", "system-architecture"]
status: "RELEASED"
date: "2026-08-26"
---

# Authoritative Student Identity & Academic Records System V1

## 1. Executive Summary

The **Authoritative Student Identity & Academic Records System V1** establishes the canonical single source of truth for all student identity, institutional profile, semester transcripts, certifications, and financial records within StudentHub AI.

```text
AUTHENTICATION (Supabase Auth / Session Token / User UUID)
           ↓
STUDENT IDENTITY (StudentIdentityModel / Store)
  ├── MSSV ("24110001")
  ├── Institutional Email ("24110001@student.hcmute.edu.vn")
  ├── Faculty, Program ("7480103" - Kỹ thuật Phần mềm), Class Code, Cohort (2024)
  └── Multi-Tenant Assertion (assertOwnership: authUserId ↔ studentId)
           ↓
AUTHORITATIVE ACADEMIC RECORDS (AcademicRecordsModel / Store)
  ├── Official Transcripts & Semester Grades (10-scale, 4-scale, Letter Grades)
  ├── Earned vs Required Credits Breakdown
  ├── Certified Foreign Language Credentials (TOEIC, IELTS, VSTEP with verification authority)
  └── Tuition Clearance & Invoices
           ↓
STUDENT ACADEMIC SYNC BRIDGE (StudentAcademicSyncBridge)
           ↓
STUDENT DIGITAL TWIN (StudentDigitalTwinModel / Store)
           ↓
ACADEMIC ELIGIBILITY ENGINE (Graduation, Thesis, Registration)
           ↓
ACADEMIC WORKFLOW & ACTION CENTER (Tasks, Steps, Auto-Reconciliation)
           ↓
ACADEMIC NOTIFICATION & DEADLINE ORCHESTRATION (Time-Aware, Centralized AcademicClock)
```

---

## 2. Key Architecture Invariants & Standards

### 2.1 Centralized Time & Asia/Ho_Chi_Minh Timezone (`AcademicClock`)
- All deadline computations, reminder offsets, and calendar arithmetic are centralized in `AcademicClock` enforcing `Asia/Ho_Chi_Minh` (UTC+7).
- Eliminates scattered, non-deterministic `new Date()` and `Date.now()` calls.

### 2.2 Multi-Tier Privacy & Channel-Aware Projection
- **IN_APP**: Full structured action intents, metadata, deep-links.
- **EMAIL**: Clean official summary, authenticated portal deep-links, zero raw sensitive credentials.
- **PUSH**: Single-line urgency alert ($\le 100$ characters).
- **Secondary Sanitizer**: Defense-in-depth regex masking passwords, OTPs, full national IDs, and bank account numbers.

### 2.3 Single Source of Truth & Zero Eval
- All academic eligibility evaluations and transcript aggregations are pure deterministic calculations without dynamic code evaluation (`eval()`).

---

## 3. Verification & Testing Matrix

| Test Suite | Tests | Coverage |
|---|---|---|
| `academic_clock.test.mjs` | 4 | UTC+7 timezone constants, mock clocks, deadline parsing, calendar math. |
| `student_identity_model.test.mjs` | 3 | MSSV validation, institutional email check, national ID privacy mask. |
| `student_identity_store.test.mjs` | 2 | Crash-safe persistence, rehydration, multi-index lookup (`studentId`, `authUserId`, `email`). |
| `academic_records_model.test.mjs` | 2 | 10-scale $\rightarrow$ 4-scale $\rightarrow$ letter grade conversions, CGPA & credits math. |
| `academic_records_store.test.mjs` | 2 | Records persistence, rehydration, optimistic revision conflict locking. |
| `student_academic_sync_bridge.test.mjs` | 1 | Projection of authoritative facts into `StudentDigitalTwinStore`. |
| `student_identity_e2e.test.mjs` | 1 | Full end-to-end chain: Auth $\rightarrow$ Identity $\rightarrow$ Records $\rightarrow$ Twin $\rightarrow$ Eligibility $\rightarrow$ Workflow $\rightarrow$ Notification. |
| **Total Test Suite** | **403 / 403** | **100% PASS across 54 files, 101 suites** |
| **Security Mutants** | **31 / 31** | **100% KILLED** |
