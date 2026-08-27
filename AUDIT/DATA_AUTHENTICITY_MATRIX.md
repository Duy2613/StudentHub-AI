# 📁 Data Authenticity Matrix

> **Core Audit Question**: Where does data actually originate? Is it live external data, official institutional records, developer-authored seed fixtures, or synthetic mock objects?

---

| Data Entity | Physical Location | Claimed Origin | Actual Origin | Data Authenticity Classification | Production Readiness Risk |
|---|---|---|---|---|---|
| **Student Identities** | `.data/student_identity_store.json` | University Registrar | Seed fixture (HCMUTE MSSV `24110001`, `24110002`...) | **TEST_FIXTURE** | Must connect to university SIS/LDAP via OAuth2 OIDC. |
| **Student Academic Records** | `.data/academic_records_store.json` | Authoritative SIS | Seed transcript fixture (Grades, Credits, Prereqs) | **TEST_FIXTURE** | Requires read-only bridge to Edusoft/UIS portal database. |
| **Student Profile 360** | `.data/student_profile_360_store.json` | Assembled 360 profile | Derived from local store fixtures | **DERIVED_FIXTURE** | High local fidelity, but single-node file bound. |
| **Expert Profiles** | `.data/expert_intelligence_store.json` | Faculty Directory | Seed faculty records (Prof. Minh, Prof. Triet...) | **SYNTHETIC_WITH_PII** | **CRITICAL: Contains mock private phone/CCCD that must be purged/masked.** |
| **Official Academic Rules** | `lib/intelligence/academic/academicRuleEngine.js` | Rector Circulars / Handbook | Static verified rules (QĐ 102/QĐ-ĐHSPKT, max credits, GPA scale) | **VERIFIED_STATIC_RULES** | Accurately models real HCMUTE regulations, but manual update needed. |
| **Social / Community Posts** | `IncrementalSyncEngine.js` (`#fallbackMockSync`) | Live Campus Feeds | In-code JavaScript mock array | **SYNTHETIC_MOCK** | Not connected to live Facebook Graph or Instagram API. |
| **Early Warnings** | `EarlyWarningEngine.js` (`#activeWarnings`) | Live Student Reports | In-memory dynamically populated signals | **DYNAMIC_EPHEMERAL** | Resets to empty on serverless cold start. |
| **User Goals** | `UserGoalEngine.js` (`#goals`) | Student Custom Input | In-memory dynamically created objects | **DYNAMIC_EPHEMERAL** | Lost on server reboot. Requires database table. |
| **AI Memory** | `AiMemoryGuard.js` (`#memoryStore`) | User-approved AI memory | In-memory store | **DYNAMIC_EPHEMERAL** | Lost on server reboot. Requires database table. |
| **Device Sessions** | `DeviceSyncEngine.js` (`#devices`) | Multi-device logins | In-memory session registry | **DYNAMIC_EPHEMERAL** | Requires Redis / database session store for multi-server clusters. |
