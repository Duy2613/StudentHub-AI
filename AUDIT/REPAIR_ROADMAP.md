# 🛠️ PROVIP Repair Roadmap (Prioritized Action Plan)

> **Execution Principle**: Remediate critical security vulnerabilities and persistence gaps first without disrupting working systems.

---

## 🚨 Phase 1: Critical Security Hardening (P0 — Immediate)

### 1. Fix Anonymous Mode BOLA Vulnerability (`SEC-01`)
- **Affected Endpoints**: `frontend/src/app/api/academic/me/profile-360/route.js`, `frontend/src/app/api/student/identity/route.js`.
- **Root Cause**: When `allowAnonymous: true`, an unauthenticated request passing `?studentId=<MSSV>` is permitted to query arbitrary student records.
- **Remediation**:
  - For unauthenticated / anonymous requests, restrict access strictly to the public demo student (`24110001`).
  - If an anonymous request attempts to query another student ID (e.g. `24110002`), immediately throw `403 Forbidden` (`OBJECT_NOT_OWNED`).
  - For authenticated requests, enforce `principal.subjectId === targetStudentId` (or require `ACADEMIC.READ_ALL` admin permission).

### 2. Sanitize Expert Sensitive PII Exposure (`SEC-02`)
- **Affected Endpoints**: `frontend/src/app/api/intelligence/experts/route.js`, `frontend/src/app/api/intelligence/experts/[expertId]/route.js`.
- **Root Cause**: API routes return the raw expert object from `.data/expert_intelligence_store.json`, which contains `privateContact` (`personalPhone`, `personalEmail`, `citizenId`).
- **Remediation**:
  - Implement a `sanitizeExpertPublicView(expert)` DTO transformer that strips `privateContact` and any internal tracking fields before sending the response.
  - Add unit test in `security_fabric_attack_simulation.test.mjs` verifying that `privateContact` is never present in public API responses.

---

## 💾 Phase 2: State Durability & Persistence (P1)

### 3. Implement Durable Storage for Ephemeral In-Memory Engines (`ENG-01`)
- **Affected Engines**:
  - `EarlyWarningEngine.js` -> Persist active warnings to `.data/early_warnings_store.json`.
  - `UserGoalEngine.js` -> Persist goals to `.data/user_goals_store.json`.
  - `AiMemoryGuard.js` -> Persist candidate/approved memory to `.data/ai_memory_store.json`.
  - `DeviceSyncEngine.js` -> Persist registered devices to `.data/device_sync_store.json`.
- **Implementation**:
  - Use crash-safe atomic write pattern (`fs.writeFileSync` to `.tmp` then rename) and startup rehydration identical to `StudentIdentityStore.js`.

### 4. Upgrade Public Feed Connectors to Live HTTP (`CONN-01`)
- **Affected Connectors**:
  - `InstitutionalRssConnector`: Implement live RSS/Atom XML parser using native `fetch()` against public university announcement feeds.
  - `GitHubAcademicConnector`: Implement live GitHub REST API fetcher (`api.github.com/repos/...`) for syllabus/assignment updates.

---

## 🧹 Phase 3: Background Jobs & Data Retention (P2)

### 5. Automated Data Retention Purge Daemon (`RET-01`)
- **Affected Module**: `DataRetentionManager.js`.
- **Implementation**:
  - Create `DataRetentionCleaner.js` to execute periodic cleanup:
    - Purge raw ingested items older than 14 days.
    - Purge ephemeral session logs older than 30 days.
    - Archive audit logs older than 365 days.

### 6. Legitimate Meta (Facebook / Instagram) Integration Specification (`CONN-02`)
- Document Meta Graph API OAuth2 app registration requirements, required permissions (`pages_read_engagement`, `instagram_basic`), and Webhook subscription endpoints.

---

## 📈 Phase 4: Verification & Master Suite Certification

1. Re-run complete test suite across all modified components.
2. Confirm 100% test pass rate with zero regressions.
3. Update Obsidian Knowledge Vault and generate final Walkthrough report.
