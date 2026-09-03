# Changelog

All notable changes to StudentHub AI / StudentHub OS are documented in this file.

## [1.0.0] — 2026-08-27 — StudentHub OS Production Release

### Added
- **StudentHub OS Unified UI/UX**:
  - Multi-audience Application Shell ([`StudentHubOSShell.jsx`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/layout/StudentHubOSShell.jsx)) with role switching (Sinh Viên K24, Chuyên Gia, Quản Trị Viên) and `Ctrl + K` global command search.
  - Personal Command Center ([`CommandCenterDashboard.jsx`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/home/CommandCenterDashboard.jsx)) featuring live adaptive academic briefings and "What Changed?".
  - Academic 360 Workspace ([`AcademicWorkspace360.jsx`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/academic/AcademicWorkspace360.jsx)) for transcript progression and graduation rule reconciliation (QĐ 1422).
  - Unified Intelligence Fabric ([`UnifiedIntelligenceWorkspace.jsx`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/intelligence/UnifiedIntelligenceWorkspace.jsx)) integrating T1 Trust, T2 Experts, T3 Community Claims, and T4 Evidence Fusion.
  - Grounded AI Studio ([`GroundedAIStudio.jsx`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/ai/GroundedAIStudio.jsx)) supporting multi-modal research, semester planning, and provenance explainability.
  - Privacy, Security & Sources Center ([`PrivacyAndSecurityCenter.jsx`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/src/components/settings/PrivacyAndSecurityCenter.jsx)) for multi-device management, session revocation, AI memory audit, and GDPR Data Vault export.
- **Database Repository Layer**:
  - `DatabaseAdapter.js` supporting PostgreSQL/Supabase multi-instance cloud deployments with optimistic concurrency locking and crash-safe atomic `.tmp -> rename` local fallback.
  - `UserGoalRepository`, `EarlyWarningRepository`, `AiMemoryRepository`, `DeviceRepository`.
  - Database migration and checksum validator (`scripts/migrate-json-to-db.mjs`).
- **Connectors**:
  - `InstitutionalRssConnector.js` (live XML fetcher) and `GitHubAcademicConnector.js` (live GitHub REST API).
  - Truthful source statuses: Meta connectors (Facebook/Instagram) truthfully declared as `NOT_CONFIGURED`.

### Security & Hardening
- **P0 Remediations**:
  - Disallowed anonymous access on `/api/academic/me/profile-360` and `/api/student/identity`. Enforced server-derived identity (`principal.subjectId`) with `ObjectAuthorizer.assertAccess` check (BOLA/IDOR eliminated).
  - Masked all expert PII (`citizenId` / CCCD, private phone, personal email) through `ExpertPublicDTO.js`.
- **Zero-Trust Security Fabric**:
  - 10-vector attack simulation suite (`test:security`), enforcing strict scope boundaries, single-use capability tokens, purpose limitations, and AI tool firewalls.
