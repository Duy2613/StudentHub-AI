# 🌐 API Connectivity Matrix (End-to-End Tracing)

> **Trace Schema**: `Frontend UI Component -> Client Fetch -> Server Endpoint -> SecurityFabric Layer -> Domain Service -> Storage Mechanism`

---

| Frontend Component | HTTP Call | Server Route Handler | Security Fabric Check | Backing Engine | Persistence / Storage |
|---|---|---|---|---|---|
| `PersonalAcademicBriefing.jsx` | `GET /api/personalization/briefing` | `app/api/personalization/briefing/route.js` | `ALLOW_ANON (Demo)`, Scope: `personal:read` | `AcademicBriefingEngine.js` | In-Memory + Profile Store (`.data/`) |
| `SocialSignalRadar.jsx` | `GET /api/intelligence/social/signals` | `app/api/intelligence/social/signals/route.js` | `ALLOW_ANON`, Scope: `social:read` | `IncrementalSyncEngine.js` | In-Memory Ingest Cache |
| `SocialSignalRadar.jsx` | `GET /api/intelligence/social/early-warnings` | `app/api/intelligence/social/early-warnings/route.js` | `ALLOW_ANON`, Scope: `social:read` | `EarlyWarningEngine.js` | In-Memory `Map` (`#activeWarnings`) |
| `ConnectedSourcesManager.jsx` | `GET /api/intelligence/social/sources` | `app/api/intelligence/social/sources/route.js` | `ALLOW_ANON`, Scope: `sources:read` | `ConnectorRegistry.js` | In-Memory Registry |
| `ConnectedSourcesManager.jsx` | `POST /api/intelligence/social/sync` | `app/api/intelligence/social/sync/route.js` | `REQUIRED_PERM: SOURCES.SYNC` | `IncrementalSyncEngine.js` | In-Memory Sync Job State |
| `PersonalizationControls.jsx` | `GET /api/personalization/goals` | `app/api/personalization/goals/route.js` | `ALLOW_ANON`, Scope: `goals:read` | `UserGoalEngine.js` | In-Memory `Map` (`#goals`) |
| `PersonalizationControls.jsx` | `POST /api/personalization/goals` | `app/api/personalization/goals/route.js` | `REQUIRED_AUTH`, Scope: `goals:write` | `UserGoalEngine.js` | In-Memory `Map` (`#goals`) |
| `PersonalizationControls.jsx` | `GET /api/personalization/memory` | `app/api/personalization/memory/route.js` | `ALLOW_ANON`, Scope: `memory:read` | `AiMemoryGuard.js` | In-Memory `Map` (`#memoryStore`) |
| `PersonalizationControls.jsx` | `POST /api/personalization/memory` | `app/api/personalization/memory/route.js` | `REQUIRED_AUTH`, Scope: `memory:write` | `AiMemoryGuard.js` | In-Memory `Map` (`#memoryStore`) |
| `CommandPalette.jsx` | `GET /api/personalization/search` | `app/api/personalization/search/route.js` | `ALLOW_ANON`, Scope: `search:read` | Universal Search Aggregator | Multidimensional Indices |
| `PersonalCommandCenter.jsx` | `GET /api/academic/me/profile-360` | `app/api/academic/me/profile-360/route.js` | `ALLOW_ANON (BOLA Risk)`, Scope: `academic:read` | `StudentProfile360Service.js` | `.data/student_profile_360_store.json` |
| `PersonalCommandCenter.jsx` | `GET /api/student/identity` | `app/api/student/identity/route.js` | `ALLOW_ANON (BOLA Risk)`, Scope: `academic:read` | `StudentIdentityStore.js` | `.data/student_identity_store.json` |
| `ExpertCard.jsx` | `GET /api/intelligence/experts/[id]` | `app/api/intelligence/experts/[expertId]/route.js` | `ALLOW_ANON (PII Leak)`, Scope: `expert:read` | `ExpertStore.js` | `.data/expert_intelligence_store.json` |
| `TrustScoreCard.jsx` | `GET /api/intelligence/trust/[id]` | `app/api/intelligence/trust/[subjectId]/route.js` | `ALLOW_ANON`, Scope: `trust:read` | `TrustIntelligenceEngine.js` | Derived from `.data/` records |
| `ContradictionBadge.jsx` | `GET /api/intelligence/contradictions/[id]` | `app/api/intelligence/contradictions/[claimId]/route.js` | `ALLOW_ANON`, Scope: `trust:read` | `ContradictionEngine.js` | Derived on query |
| `PrivacyAccessCenter.jsx` | `POST /api/personalization/reset` | `app/api/personalization/reset/route.js` | `REQUIRED_AUTH`, Scope: `personal:write` | `PersonalizationEngine.js` | In-Memory Default Reset |
