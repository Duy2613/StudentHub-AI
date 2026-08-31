# 📊 Feature Evidence Matrix & Classification

> **Audit Baseline**: Git Commit `a05994f` | **Date**: 2026-08-27  
> **Status Classifications**: `REAL`, `CONNECTED`, `PRODUCTION_READY`, `PARTIAL`, `FRONTEND_ONLY`, `BACKEND_ONLY`, `MOCK`, `STATIC`, `ORPHANED`, `NOT_IMPLEMENTED`

---

| Feature / Claim | Claimed Capability | Found in Code | Runtime Path Verified | Evidence Location | Status |
|---|---|---|---|---|---|
| **Social Connector Framework** | Base connector contract & capability checks | Yes | Yes | `lib/intelligence/social/ISourceConnector.js` | **REAL** |
| **Campus Connectors** | Portal, RSS, GitHub, Discord, Forum | Yes | Partial (Mock fallback) | `lib/intelligence/social/ConnectorRegistry.js` | **MOCK / PARTIAL** |
| **Facebook Connector** | Live Facebook Graph API ingestion | No | No | Not present in registry | **NOT_IMPLEMENTED** |
| **Instagram Connector** | Live Instagram Display API ingestion | No | No | Not present in registry | **NOT_IMPLEMENTED** |
| **Slang Normalizer** | Vietnamese academic slang expansion | Yes | Yes | `lib/intelligence/social/ContentItemNormalizer.js` | **REAL & CONNECTED** |
| **Entity Resolver** | Resolve course codes, faculty, professors | Yes | Yes | `lib/intelligence/social/EntityResolutionEngine.js` | **REAL & CONNECTED** |
| **11-Category Claim Extractor** | Extract questions, warnings, official rules | Yes | Yes | `lib/intelligence/social/SocialClaimExtractor.js` | **REAL & CONNECTED** |
| **Signal Quality Engine** | Multi-dimensional scoring (7 dimensions) | Yes | Yes | `lib/intelligence/social/SocialSignalQualityEngine.js` | **REAL & CONNECTED** |
| **Social Duplication Detector** | Shingle clustering ($1/\sqrt{N}$ dampening) | Yes | Yes | `lib/intelligence/social/SocialDuplicationDetector.js` | **REAL & CONNECTED** |
| **Coordination Detector** | Fast temporal copy-paste campaign detection | Yes | Yes | `lib/intelligence/social/CoordinationDetector.js` | **REAL & CONNECTED** |
| **Early Warning Engine** | Operational incident tracker lifecycle | Yes | In-memory only | `lib/intelligence/social/EarlyWarningEngine.js` | **PARTIAL** |
| **Social-to-Official Pipeline** | Dual-layer statutory + operational advisory | Yes | Yes | `lib/intelligence/social/SocialToOfficialPipeline.js` | **REAL & CONNECTED** |
| **AI Content Firewall** | Prompt injection quarantine & safe wrapping | Yes | Yes | `lib/intelligence/safety/SocialContentFirewall.js` | **REAL & CONNECTED** |
| **Vector Security Guard** | Pre/post-retrieval authorization scoping | Yes | In-memory array only | `lib/intelligence/safety/VectorSecurityGuard.js` | **PARTIAL** |
| **AI Memory Guard** | Multi-tiered memory & anti-poisoning validation | Yes | In-memory only | `lib/intelligence/safety/AiMemoryGuard.js` | **PARTIAL** |
| **User Goal Engine** | Academic goals tracking with priorities | Yes | In-memory only | `lib/personalization/UserGoalEngine.js` | **PARTIAL** |
| **Academic Briefing Engine** | Compiles "My Academic Briefing" (6 dimensions) | Yes | Yes | `lib/personalization/AcademicBriefingEngine.js` | **REAL & CONNECTED** |
| **T1 Trust Engine** | 10-dimension trust profile scoring | Yes | Yes | `lib/intelligence/trust/TrustIntelligenceEngine.js` | **REAL & CONNECTED** |
| **T2 Expert Engine** | Expert verification, scope & reliability tracker | Yes | Yes | `lib/intelligence/expert/ExpertDiscoveryEngine.js` | **REAL & CONNECTED** |
| **T3 Community Engine** | Consensus engine & claim extraction | Yes | Yes | `lib/intelligence/community/CommunityConsensusEngine.js` | **REAL & CONNECTED** |
| **T4 Evidence Fusion** | Contradiction detection & Brier calibration | Yes | Yes | `lib/intelligence/fusion/ContradictionEngine.js` | **REAL & CONNECTED** |
| **Zero-Trust Security Gateway** | Token, Session, Risk, Purpose, Authorization | Yes | Yes | `lib/security/SecurityFabric.js` | **REAL & CONNECTED** |
| **Academic Digital Twin** | Single Source of Truth student state | Yes | Durable file backing | `lib/intelligence/academic/studentDigitalTwinStore.js` | **REAL & CONNECTED** |
| **Cross-Device Session Sync** | Multi-device registry & remote revocation | Yes | Single-server memory | `lib/personalization/DeviceSyncEngine.js` | **PARTIAL** |
| **876 Native Tests** | 82 test suites executed via node:test | Yes | Yes | `frontend/tests/**/*.test.mjs` | **REAL & EXECUTING** |
