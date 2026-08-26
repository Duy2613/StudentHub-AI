---
title: "Academic Data Provenance & Source-of-Truth Matrix V1"
tags: ["data-provenance", "source-of-truth", "authority-matrix", "academic-records", "system-architecture"]
status: "RELEASED"
date: "2026-08-26"
---

# Academic Data Provenance & Source-of-Truth Matrix V1

## 1. Field Authority & Provenance Specification

| Field Name | Canonical Source | Authority Level | TTL / Freshness Window | Precedence Priority | Authorized Consumers |
|---|---|---|---|---|---|
| `studentId` | `SUPABASE_AUTH` | `AUTHORITATIVE` | 720 Hours (30 Days) | 100 (Highest) | `ALL`, `SECURITY`, `DIGITAL_TWIN`, `WORKFLOW` |
| `institutionalEmail` | `SUPABASE_AUTH` | `AUTHORITATIVE` | 720 Hours (30 Days) | 100 | `PROFILE`, `NOTIFICATION` |
| `cohort` | `HCMUTE_DAOTAO_PORTAL` | `AUTHORITATIVE` | 2160 Hours (90 Days) | 90 | `DIGITAL_TWIN`, `ELIGIBILITY`, `RULES` |
| `programCode` | `HCMUTE_DAOTAO_PORTAL` | `AUTHORITATIVE` | 2160 Hours (90 Days) | 90 | `DIGITAL_TWIN`, `ELIGIBILITY`, `RULES` |
| `earnedCredits` | `HCMUTE_SIS_PORTAL` | `AUTHORITATIVE` | 24 Hours (1 Day) | 80 | `DIGITAL_TWIN`, `ELIGIBILITY`, `WORKFLOW` |
| `cgpa` | `HCMUTE_SIS_PORTAL` | `AUTHORITATIVE` | 24 Hours (1 Day) | 80 | `DIGITAL_TWIN`, `ELIGIBILITY`, `WORKFLOW` |
| `courses` | `HCMUTE_SIS_PORTAL` | `AUTHORITATIVE` | 24 Hours (1 Day) | 80 | `PROFILE`, `TRANSCRIPT`, `DIGITAL_TWIN` |
| `certifications` | `IIG_VIETNAM` / `BRITISH_COUNCIL` | `AUTHORITATIVE` | 168 Hours (7 Days) | 85 | `DIGITAL_TWIN`, `ELIGIBILITY`, `WORKFLOW` |
| `tuitionStatus` | `HCMUTE_FINANCE_PORTAL` | `AUTHORITATIVE` | 12 Hours | 80 | `PROFILE`, `ELIGIBILITY` |
| `graduationEligibility` | `ACADEMIC_ELIGIBILITY_ENGINE` | `DERIVED` | 1 Hour | 70 | `COMMAND_CENTER`, `ACTION_CENTER`, `WORKFLOW` |

---

## 2. Precedence Hierarchy & Conflict Resolution

```text
SUPABASE_AUTH (Authentication Anchor)
       ↓
HCMUTE_DAOTAO_PORTAL (Registrar & Curriculum Regulations)
       ↓
HCMUTE_SIS_PORTAL (Student Information System & Transcripts)
       ↓
IIG_VIETNAM / BRITISH_COUNCIL (Testing Authorities)
       ↓
HCMUTE_FINANCE_PORTAL (Tuition Invoices & Payment Clearance)
       ↓
HCMUTE_STUDENT_AFFAIRS (Extracurricular & Disciplinary)
       ↓
STUDENT_SUBMISSION (Self-Reported Claim / Review Request)
```

- When an official source contradicts a student claim, the official source wins automatically.
- When two official sources with equal authority contradict each other, the record enters `REQUIRES_REVIEW` and generates an administrative audit flag without silent overwriting.
