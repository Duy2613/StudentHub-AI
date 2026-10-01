# Room media storage acceptance — candidate `cc2a31069dfab6dd4fa112335f930c3639719fe6`

## Result

The original static defect is repaired in the candidate source. A guarded local Supabase 17.6 run passed 31 Room IMAGE/QR service checks and eight exact cleanup confirmations. This is **local integration evidence**, not the requested production UI acceptance: no production account, deployment, provider, or cloud object was used, and the package test used a synthetic terminal Trust response.

```ini
CANDIDATE_SOURCE_SHA = cc2a31069dfab6dd4fa112335f930c3639719fe6
ENVIRONMENT = LOCAL_DISPOSABLE_SUPABASE_17_6
ROOM_MEDIA_STORAGE_LOCAL = PASS
ROOM_MEDIA_STORAGE_PRODUCTION = NOT_ACCEPTED
ROOM_MEDIA_STORAGE = NOT_ACCEPTED_PRODUCTION
TRUST_L1_L4_LIVE = NOT_RUN
PRODUCTION_MUTATIONS = 0
```

Evidence: [room-media-local-assurance.json](room-media-local-assurance.json). It records the candidate SHA, environment, per-check outcomes, migration hashes, and cleanup. Build, lint, regression, and secret bundle logs for this same source are `build-room-media.log`, `lint-room-media.log`, `regression-room-media.log`, and `secret-scan-room-media.log`.

## R01–R17

| Check | Local candidate evidence | Production acceptance |
| --- | --- | --- |
| R01 Host authenticated | PASS: harness created a real disposable Supabase Auth user/session | NOT_RUN; production persona/UI login not exercised |
| R02 Create real verification room | PASS: candidate Room service created rooms in local Supabase | NOT_RUN in production |
| R03 Select IMAGE through Room UI | UI/browser journey not part of local harness | NOT_RUN |
| R04 Upload succeeds | PASS: authenticated local IMAGE and QR durable uploads | NOT_RUN in production |
| R05 Durable storage object exists | PASS: private bucket object and metadata verified in local Storage | NOT_RUN in production |
| R06 Room stores canonical asset reference | PASS: Room stores canonical `mediaArtifactId`, SHA-256, MIME and size | NOT_RUN in production |
| R07 Canonical Trust intake consumes same asset | PASS locally: shared intake/handoff carries the stored ID and digest; no second Room asset is created | NOT_RUN through production Trust |
| R08 Trust L1–L4 completes | Harness does not invoke live providers or prove layers | NOT_RUN; synthetic response is not L1–L4 evidence |
| R09 Evidence Package references same provenance | PASS locally with synthetic terminal Trust response; package preserves media ID/SHA and exact case linkage | NOT_RUN with a real production Trust case |
| R10 Reload room | PASS: canonical Room readback resolves media locally | NOT_RUN in production |
| R11 IMAGE resolves for authorized participant | PASS: host and current participant local readback; cold-process hydration verifies stored bytes | NOT_RUN in production |
| R12 Outsider access denied | PASS: local outsider Room/read and private-object denial | NOT_RUN in production |
| R13 Repeat R03–R12 with QR | Service/storage checks PASS locally; QR pixels decoded from the canonical stored bytes | UI and production Trust acceptance NOT_RUN |
| R14 Disconnect/reconnect participant | PASS locally: `DISCONNECTED` membership retains authorized readback | NOT_RUN in production |
| R15 Canonical room state resolves media/evidence | PASS locally for Room media plus a synthetic package | NOT_RUN with production evidence |
| R16 Cleanup only run-owned media | PASS locally: exact run-owned rooms, two objects/metadata rows, two synthetic cases and three Auth users | No production cleanup run |
| R17 Verify cleanup | PASS locally: all eight exact cleanup confirmations passed | NOT_RUN in production |

## Required status fields

```ini
ROOM_IMAGE_UPLOAD = PASS_LOCAL / NOT_RUN_PRODUCTION
ROOM_IMAGE_READBACK = PASS_LOCAL / NOT_RUN_PRODUCTION
ROOM_IMAGE_TRUST_HANDOFF = PASS_LOCAL_SAME_ID_AND_SHA / NOT_RUN_PRODUCTION

ROOM_QR_UPLOAD = PASS_LOCAL / NOT_RUN_PRODUCTION
ROOM_QR_READBACK = PASS_LOCAL_COLD_PROCESS_DECODE / NOT_RUN_PRODUCTION
ROOM_QR_TRUST_HANDOFF = PASS_LOCAL_SAME_ID_AND_SHA / NOT_RUN_PRODUCTION

ROOM_MEDIA_AUTHORIZATION = PASS_LOCAL / NOT_RUN_PRODUCTION
ROOM_MEDIA_RELOAD = PASS_LOCAL / NOT_RUN_PRODUCTION
ROOM_MEDIA_RECONNECT = PASS_LOCAL / NOT_RUN_PRODUCTION
ROOM_MEDIA_CLEANUP = PASS_LOCAL_EXACT_RUN_OWNED / NOT_RUN_PRODUCTION

ROOM_MEDIA_STORAGE = NOT_ACCEPTED_PRODUCTION
```

The former `FAIL_STATIC` finding in the prior baseline report is superseded for candidate `cc2a31069dfab6dd4fa112335f930c3639719fe6`: durable object creation, canonical reference, authenticated readback, and package provenance are implemented and locally exercised. Production release remains blocked by the unverified Vercel runtime Auth/database/Storage/Realtime/session project refs, unresolved production migration state, missing production backup/restore proof, and all live user/provider acceptance gates.
