# Trust V4.2 contract audit — 2026-09-28

Authority: attached V4.2 execution prompt and `D:/Download/STUDENTHUB_AI_MASTER_FRONTEND_CONSTITUTION_v4_THREE_CORE.md`. Repository `docs/frontend/MASTER_FRONTEND_CONSTITUTION.md` declares v3 and cannot override the three-core scope. Historical vault dark/cinematic defaults are superseded for this light/midnight evidence-first surface.

## Canonical route decision

`frontend/src/app/trust/page.jsx` owns `/trust`. Replace its legacy `TrustWorkspaceClient → AiTrustStudioView → OwnTrustJourney` presentation with one V4 workspace. Preserve those legacy modules for separately classified consumers/tests; do not import them into the active route. Use existing `trustApi.sequential` directly: the generic provider adapter discards detailed layer/source records on terminal conversion. This is a transport-preserving presentation change, not a new engine.

## Contract inventory

| Capability | Status | Actual source / shape | Presentation / limitations |
|---|---|---|---|
| Submit, streaming, timeout | EXISTS | `frontend/src/lib/api/trust.ts:150` sequential request, POST `/api/v1/trust`, SSE/JSON, 120s timeout, request/idempotency headers | One submit path, no automatic retry or fake cancel |
| Validation | EXISTS | `frontend/src/lib/api/schemas/trust.ts:211` four-layer pipeline and response schema | Validate terminal and streamed snapshots, reject fixture markers |
| Case/run/revision | EXISTS | same schema response `caseId?`, `caseRevision?`, `runId?`, `persistence?` | Null means unestablished; only durable scopes enable handoffs |
| Input | EXISTS/PARTIAL | `frontend/src/app/api/v1/trust/route.js:231` text/url/image/qr and sanitized metadata; file bytes use server media ingestion | Text, URL, image and QR; general document upload omitted |
| Claims | EXISTS/PARTIAL | layer2 claims, layer3 claim assessments; layer values are passthrough records | Read/select claims; no editing/splitting/merging contract |
| Stages | EXISTS | schema stages operationStatus, timestamps, summaries, limitations | Render returned stages only; no timer percentages |
| Conclusion | EXISTS | schema `finalPredict`, `finalDecision`; deterministic decision authority | Preserve truth/security/action independently; no client score policy |
| Evidence | EXISTS/PARTIAL | layer3 evidence: evidenceId, claimId, sourceId, relation, excerpt | Explicit relationships only; missing linkage remains unknown |
| Sources | EXISTS/PARTIAL | layer3 sources: sourceId/url/title/publisher/retrievalOrigin/timestamps | URL reachability and supplied origin never establish support |
| Metrics | EXISTS/PARTIAL | finalPredict confidenceKind/explanation, evidenceSufficiency, verificationCompleteness, sourceQuality, evidenceAgreement | Display only present fields with their meaning; no thresholds invented |
| Uncertainty | EXISTS | finalPredict remainingUncertainty/uncertainties/keyReasons; layer4 userExplanation | Show explicit returned text, no generated unresolved checklist |
| Comparison | PARTIAL | evidence claim/source/relation and layer3 crossSourceAgreement | Compare explicit claim relationships; no count-based consensus |
| Existing case read | EXISTS | `api/v1/trust/cases/[caseId]/route.js:51`; owner-scoped inputs/evidence/claims | Case record is not a complete historical pipeline response |
| History | PARTIAL | `DurableTrustRepository.js:413` owner list latest revision; passport API revisions | Inspect available lineage; no invented historical conclusions |
| Expert | EXISTS/PARTIAL | canonical RequestExpertReviewSheet; authenticated `/api/expert/assessments` | Request is separate from assessment; respect case revision, no anonymous projection |
| Community | EXISTS/PARTIAL | CommunityComposer VERIFY owner case selection and privacy preview | Reuse composer with explicit scope selection; no automatic publishing |
| Realtime | PARTIAL | RealtimeContext subscribe, durable trust events | Invalidate/refetch owner metadata; events never replace full result; live convergence deferred |
| Cancellation/resumption | MISSING | no verified cancel/status-by-request endpoint in active transport | No server cancel CTA; timeout retains uncertainty about completion |
| Permissions | EXISTS/UNVERIFIED LIVE | SecurityFabric route wrappers, owner check on case read | UI is explanatory, live isolation/RLS deferred |
| Omni | PARTIAL | existing scoped runtime provider | No added indexing; private local result never exported |

Evidence level: local source inspection only. No database or provider was contacted. Detailed runtime evidence is recorded separately after implementation.
