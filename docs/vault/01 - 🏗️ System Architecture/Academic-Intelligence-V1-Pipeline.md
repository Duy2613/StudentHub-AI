# Academic Intelligence V1 — Architecture & Pipeline Specification

## 1. Overview & Vision

**Academic Intelligence V1** transforms StudentHub AI from a purely defensive scam/fraud screening engine into an **Authoritative Academic Digital Twin & Notification System**. It continuously watches official university sources, captures versioned document snapshots, isolates semantic changes, extracts machine-actionable academic rules, and computes fine-grained, personalized impacts for each student.

```text
               ┌───────────────────────────────┐
               │   OFFICIAL SOURCE REGISTRY    │
               │   - Allowlist Verification   │
               │   - SLA & Crawl Policies      │
               └───────────────┬───────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │   SAFE RETRIEVAL & FETCHER    │
               │   - 5MB Payload Boundary      │
               │   - Redirect Security Gate    │
               │   - ETag / 304 Handling       │
               └───────────────┬───────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │    CANONICAL NORMALIZATION    │
               │   - NFKC & Zero-Width Strip   │
               │   - SHA-256 Content Pinned    │
               └───────────────┬───────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │   IMMUTABLE SNAPSHOT STORE    │
               │   - Versioned (v1.0 -> v2.0)  │
               │   - Defensive Deep Cloning    │
               │   - Stale Warning Fallback    │
               └───────────────┬───────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │     SEMANTIC DIFF ENGINE      │
               │   - Cosmetic Noise Filter     │
               │   - Deadline / Fee / Req Diffs│
               └───────────────┬───────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │    ACADEMIC RULE EXTRACTOR    │
               │   - Structured Conditions     │
               │   - Provenance & Evidence     │
               │   - VERIFIED vs REVIEW        │
               └───────────────┬───────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │     STUDENT IMPACT ENGINE     │
               │   - Cohort / Major Filtering  │
               │   - 5 Impact Levels (NONE->CR)│
               │   - "Why You Are Affected"    │
               └───────────────┬───────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │    CANONICAL INSIGHT MODEL    │
               │   - Single Source of Truth    │
               │   - Actionable User Intents   │
               └───────────────┬───────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
   ┌───────────────────────────┐ ┌───────────────────────────┐
   │   NOTIFICATION ADAPTER    │ │     TIMELINE ADAPTER      │
   │   - [HỌC VỤ K24] Alerts   │ │   - Chronological Flow    │
   │   - Action Buttons        │ │   - Severity Badges       │
   └───────────────────────────┘ └───────────────────────────┘
```

---

## 2. Core Module Architecture

### 2.1 Source Registry (`AcademicSourceRegistry.js`)
- Enforces official domain governance using `OFFICIAL_HCMUTE_ALLOWLIST`.
- Assigns strict source tiers:
  - `TIER_1_OFFICIAL`: Official university portals (`hcmute.edu.vn`, `daotao.hcmute.edu.vn`, `ctsv.hcmute.edu.vn`, `fit.hcmute.edu.vn`).
  - `TIER_4_UNKNOWN`: Unverified external links, automatically blocked from authoritatively updating student rules.

### 2.2 Safe Document Fetcher (`AcademicDocumentFetcher.js`)
- Limits maximum response payload to 5MB to prevent memory exhaustion.
- Enforces redirect authority validation: if an official source redirects to an external untrusted domain, it halts with `REDIRECT_AUTHORITY_VIOLATION`.
- Supports HTTP 304 Not Modified caching with `ETag` and `If-Modified-Since`.

### 2.3 Document Normalizer (`AcademicDocumentNormalizer.js`)
- Applies Unicode NFKC normalization and strips adversarial zero-width characters.
- Computes deterministic SHA-256 hashes (`rawContentHash` and `normalizedContentHash`).

### 2.4 Immutable Snapshot Store (`DocumentSnapshotStore.js`)
- Maintains versioned history (`v1.0`, `v2.0`).
- Provides deep defensive copies (`_cloneDoc`) on every public getter to prevent memory tampering.
- Emits `[STALE_SOURCE_WARNING]` on live source downtime while serving the last verified snapshot.

### 2.5 Semantic Diff Engine (`SemanticDiffEngine.js`)
- Filters cosmetic formatting mutations (HTML tags, spaces, CSS).
- Categorizes semantic deltas:
  - `DEADLINE_CHANGE` (e.g. `30/08/2026` $\rightarrow$ `05/09/2026`)
  - `FEE_CHANGE` (e.g. `14.500.000 VNĐ` $\rightarrow$ `16.000.000 VNĐ`)
  - `REQUIREMENT_CHANGE` (e.g. TOEIC exit scores, credits)
  - `ELIGIBILITY_CHANGE` (e.g. GPA thresholds)

### 2.6 Academic Rule Extractor (`AcademicRuleExtractor.js`)
- Converts document text into structured `AcademicRule` records with clause evidence and target cohorts/programs.
- Sets `verificationStatus = "VERIFIED"` for official sources and `"PENDING_REVIEW"` for unverified sources.

### 2.7 Academic Digital Twin & Student Impact (`AcademicDigitalTwin.js`)
- Evaluates student academic states against active rules.
- Emits 5 impact levels: `NONE`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Formulates clear, evidence-backed explanations:
  > *"Bạn bị ảnh hưởng vì: Bạn thuộc Khóa K24 ngành Kỹ thuật Phần mềm, chuẩn đầu ra Ngoại ngữ yêu cầu 550 điểm, chứng chỉ hiện tại của bạn là 450 điểm (Chưa đạt chuẩn)."*

### 2.8 Presentation Adapters
- `AcademicNotificationAdapter.js`: Generates actionable alerts with priority routing (`RADAR_PUSH`, `IN_APP_POPUP`).
- `AcademicTimelineAdapter.js`: Maps changes into chronological milestones for student dashboard timelines.

---

## 3. Test Coverage & Verification

| Test Suite File | Tests | Focus Area |
|---|---|---|
| `academic_source_watcher.test.mjs` | 8 | Source allowlist, 5MB limit, 304 caching, redirect security. |
| `academic_semantic_diff_rules.test.mjs` | 7 | Cosmetic vs. semantic diff, fee/deadline changes, rule extraction. |
| `academic_student_impact.test.mjs` | 4 | Cohort filtering, TOEIC deficit evaluation, tuition debt impact. |
| `academic_intelligence_pipeline_e2e.test.mjs` | 4 | End-to-end 21-step synchronization and alert lifecycle. |
| **Total New Academic Intel Tests** | **23** | **100% Pass** |
| **Full Master Regression Suite** | **288 / 288** | **100% Pass across 24 files, 84 suites** |
| **Actual Source Mutants** | **31 / 31** | **100% Killed (0 Survived)** |
