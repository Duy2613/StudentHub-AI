# 🔍 STUDENTHUB AI — PROVIP FORENSIC AUDIT REPORT

> **Audit Type**: Full Ground-Truth Reality Verification, Backend Authority & Production Readiness Audit  
> **Auditor Roles**: Principal Security Auditor, Principal Backend Auditor, Data Integrity Auditor, QA/SDET Lead  
> **Timestamp**: 2026-08-27T13:30:00+07:00 | **Git Branch**: `develop` | **Commit Baseline**: `a05994f`  
> **Repository Type**: Next.js 16+ Fullstack TypeScript/JavaScript Monolith (Node.js Serverless Route Handlers + Edge Middleware + Local File/In-Memory Stores + Supabase Client)

---

## 1. 📋 EXECUTIVE VERDICT

### A. What is ACTUALLY REAL?
1. **Mathematical & Epistemic Algorithms**: T1 Multi-dimensional Trust scoring, Brier Score calibration, Jaccard shingle deduplication, Coordination window detection, and Contradiction detection logic are fully implemented and verified in code.
2. **Server-Side Security Fabric Architecture**: `SecurityFabric.wrapHandler`, `TokenValidator` (HMAC/RSA signature verification), `AuthorizationEngine` (RBAC/ABAC/ReBAC), `AiToolFirewall`, and `RateLimiter` execute on the Node.js Serverless backend runtime inside `frontend/src/app/api/.../route.js`.
3. **Academic Pipeline & Digital Twin Core**: Snapshot versioning, semantic diffing, student eligibility checks, and academic workflows with crash-safe atomic file persistence (`fs.writeFileSync` to `.data/*.json`) are functional and durable across restarts.
4. **All 876 Unit & Integration Tests**: 876 tests across 82 test suites execute and pass via Node.js native test runner (`node --test`).

### B. What is OVERCLAIMED or MISLEADING?
1. **"100% Production Ready"**: Overclaimed. The system uses local `.data/*.json` files and in-memory `Map` objects rather than a distributed database (PostgreSQL / Supabase / Redis) with database transactions, connection pooling, and multi-instance distributed locking.
2. **"Facebook & Instagram Connectors Connected"**: False positive claim. `ConnectorRegistry.js` only contains abstractions for Official Portal, Institutional RSS, Academic GitHub, Discord, and Community Forums. **There is NO live Facebook Graph API or Instagram Basic Display API integration.**
3. **"Live Campus Social Ingestion"**: Overclaimed. `IncrementalSyncEngine.js` falls back to a hardcoded mock fixture (`#fallbackMockSync`) when live endpoints are unreachable.
4. **"Data Retention Enforced"**: Overclaimed. `DataRetentionManager.js` defines retention duration rules, but there is no active server cron daemon executing actual data purge queries against a database.
5. **"Vector Database Protected"**: Overclaimed. `VectorSecurityGuard.js` contains filtering logic, but there is no connected live Vector Database instance (e.g. pgvector, Pinecone, Qdrant). It operates on in-memory array filtering.

### C. What is MISSING or DEFICIENT?
1. **P0 BOLA Vulnerability in Anonymous Mode**: In `GET /api/academic/me/profile-360` and `GET /api/student/identity`, setting `allowAnonymous: true` allows an unauthenticated client to pass `?studentId=<ANY_MSSV>` and extract another student's full academic record.
2. **P0 Sensitive PII Exposure**: `GET /api/intelligence/experts/[expertId]` returns raw records from `.data/expert_intelligence_store.json` which contains unmasked personal phone numbers, private emails, and Citizen IDs (CCCD).
3. **Absence of Separate C# / ASP.NET Backend**: The repository contains an empty `backend/` directory (`README.md` only). All backend logic runs within Next.js Route Handlers (`app/api/`).
4. **Synthetic Expert & Community Seed Data**: Expert credentials and community forum posts in `.data/` are developer-authored seed fixtures, not live synced university registries.

---

## 2. 🏛️ ARCHITECTURE REALITY: SERVER VS CLIENT EXECUTION

```text
[CLIENT BUNDLE (Browser)]
  ├── Pages (Home, Academic, Intelligence, Settings)
  ├── Components (PersonalCommandCenter, PersonalAcademicBriefing, SocialSignalRadar)
  └── Transport: fetch('/api/...') ONLY.
        │
        ▼ (HTTP Network Boundary with Bearer Token / Session Cookie)
        │
[SERVER RUNTIME (Next.js Node.js Serverless Route Handlers)]
  ├── frontend/src/app/api/.../route.js
  ├── Wrapped by SecurityFabric.wrapHandler (Server-Authoritative)
  │     ├── RateLimiter.assertRateLimit
  │     ├── TokenValidator.validateToken (Cryptographic HMAC-SHA256)
  │     ├── IdentityResolver (Maps token sub -> SecurityPrincipal)
  │     ├── RiskEngine & PurposeValidator
  │     └── AuthorizationEngine (RBAC + ABAC + ReBAC)
  │
  ├── Core Engines (frontend/src/lib/...)
  │     ├── T1 Trust, T2 Expert, T3 Community, T4 Fusion
  │     ├── SocialClaimExtractor, CoordinationDetector, EarlyWarningEngine
  │     ├── SocialContentFirewall & AiMemoryGuard
  │     └── UserGoalEngine & AcademicBriefingEngine
  │
  └── Persistence Layer
        ├── Local Durable Files: .data/*.json (Atomic fs.writeFileSync)
        └── In-Memory State: Static Maps in Server Node.js Process
```

---

## 3. 🛡️ SECURITY REALITY & CRITICAL FINDINGS

| ID | Severity | Component | Finding Description | Production Impact |
|---|---|---|---|---|
| **SEC-01** | **P0** | `app/api/academic/me/profile-360` | When `allowAnonymous: true`, `?studentId=24110002` returns student B's complete transcript to unauthenticated caller. | Cross-tenant student academic data leak (BOLA/IDOR). |
| **SEC-02** | **P0** | `app/api/intelligence/experts/[expertId]` | Returns unmasked `privateContact` (Personal Phone, Email, CCCD) from `.data/expert_intelligence_store.json`. | Severe PII privacy leak. |
| **SEC-03** | **P1** | `lib/intelligence/social/EarlyWarningEngine` | State is held in static `Map()`. Restarting server wipes all operational warning lifecycles. | Loss of state across serverless invocations. |
| **SEC-04** | **P1** | `lib/personalization/UserGoalEngine` | Goals stored in static in-memory `Map()`. Not persisted to disk or database. | Goals vanish on server restart. |
| **SEC-05** | **P2** | `lib/intelligence/social/DataRetentionManager` | No scheduled background worker or database TTL to delete expired data. | Retention policy is advisory only. |

---

## 4. 🧠 T1–T4 & SOCIAL INTELLIGENCE AUDIT SUMMARY

### T1 Trust Intelligence: `Maturity Score: 5/7 (EXPLAINABLE)`
- **Strengths**: 10-dimension trust evaluation (`identity`, `behavior`, `contribution`, `evidence`, `academic`, `community`, `expertise`, `consistency`, `temporal`, `integrity`), Brier score calculation, sybil defense.
- **Deficiencies**: Relies on seed data in `.data/`; not linked to live university event queues.

### T2 Expert Intelligence: `Maturity Score: 4/7 (INTERCONNECTED)`
- **Strengths**: Expert verification model, scope hierarchy, topic jurisdictions, conflict of interest detection, reliability tracker.
- **Deficiencies**: Seed data contains synthetic professors with real mock CCCD/phone numbers. No live OAuth connection to university LDAP/Active Directory.

### T3 Community Intelligence: `Maturity Score: 4/7 (INTERCONNECTED)`
- **Strengths**: 11-category signal extractor, Vietnamese slang normalizer, shingle deduplication, coordination window detector.
- **Deficiencies**: Ingestion falls back to mock generator `#fallbackMockSync`. Real user volume is fixture-based.

### T4 Evidence Fusion: `Maturity Score: 5/7 (EXPLAINABLE)`
- **Strengths**: ContradictionEngine (Direct, Partial, Temporal, Scope conflicts), Snapshot reproducibility store, dual-layer advisory (statutory policy vs operational reality).
- **Deficiencies**: In-memory snapshot store resets on cold start.

### Social Intelligence & Connectors: `Maturity Score: 2/7 (CRUD / ABSTRACTION)`
- **Strengths**: Solid architectural interface (`ISourceConnector`), rate limiter token bucket, incremental sync state model.
- **Deficiencies**: Facebook and Instagram connectors do not exist. Discord and Portal connectors fall back to static fixtures.

---

## 5. 🎯 FINAL AUDIT SCORECARD

| Subsystem | Score | Evidence / Justification |
|---|---|---|
| **Security Fabric** | **3.5 / 5** | Server-authoritative token/session validation works; P0 BOLA in anonymous fallback mode requires remediation. |
| **Intelligence Fabric Core** | **4.0 / 5** | Mathematical algorithms, deduplication, contradiction, and calibration are proven and robust. |
| **T1 Trust Engine** | **5 / 7** | Multi-dimensional scoring with historical tracking, but uses seed fixtures. |
| **T2 Expert Engine** | **4 / 7** | Clear verification hierarchy, but PII data leak in API response must be sanitized. |
| **T3 Community Engine** | **4 / 7** | 11 signal categories and anti-coordination heuristics proven; live feed is mocked. |
| **T4 Evidence Fusion** | **5 / 7** | Contradiction engine and dual-layer advisory functional; persistence needs database backing. |
| **Social Intelligence** | **2 / 7** | Framework exists; Facebook/Instagram connectors absent; live scraping is simulated. |
| **Personal Digital Twin** | **3.5 / 5** | Data classification model (5 tiers) enforced; server-side assembly works; goals in-memory only. |
| **Cross-Device Sync** | **3.0 / 5** | Server session revocation works; storage is single-server file/memory. |
| **Hyper-Personalization** | **3.5 / 7** | Academic briefing compiles 6 dimensions with explainability; requires database goal persistence. |
| **AI Grounding & Safety** | **4.5 / 7** | Prompt injection quarantine envelope and passive data wrapping fully verified. |
| **Production Readiness** | **2.5 / 5** | Code is robust for single-node development/staging; lacks distributed DB, migrations, and live connectors. |

---

## 6. 🚦 FINAL AUDIT VERDICT: `GO WITH CONDITIONS` (REPAIR REQUIRED)

The architecture is **fundamentally sound, modular, and server-authoritative in its core design**. However, **PRODUCTION DEPLOYMENT IS BLOCKED** until the P0/P1 security and persistence gaps are remediated according to the `AUDIT/REPAIR_ROADMAP.md`.
