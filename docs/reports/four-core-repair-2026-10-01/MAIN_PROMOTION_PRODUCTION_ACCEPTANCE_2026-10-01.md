# Historical main promotion and real production acceptance gate — 2026-10-01

This is a read-only observation of prior candidate `eea55564ebaef4dc2edc7af14586fe8f04324114`; it does not cover current candidate `cc2a31069dfab6dd4fa112335f930c3639719fe6`. See [CANONICAL_PRODUCTION_UNIFICATION_2026-10-01.md](CANONICAL_PRODUCTION_UNIFICATION_2026-10-01.md) for current source checks. Production main and deployment remain `595a99110367aefb545b02dab4b9f9a5a6106ab6`; the current candidate was not deployed.

## Frozen identifiers and race check

Observed at 2026-10-01 13:06:31 UTC using the isolated candidate checkout and read-only Vercel/Supabase operator metadata.

CANDIDATE_SOURCE_SHA = eea55564ebaef4dc2edc7af14586fe8f04324114
BRANCH = codex/studenthub-four-core-repair-20261001
ORIGIN_MAIN_SHA = 595a99110367aefb545b02dab4b9f9a5a6106ab6
REMOTE_RELEASE_SHA = 3d42b8cdb9d756d9ea04e44ad7420d25dfb0c5b9
RELEASE_HEAD_SHA = 3d42b8cdb9d756d9ea04e44ad7420d25dfb0c5b9
LOCAL_EVIDENCE_COMMITS_NOT_PUSHED_BEFORE_REPORT = 0
MAIN_IS_ANCESTOR_OF_RELEASE = YES
MAIN_ONLY_COMMITS_SINCE_CANDIDATE_BASE = 0

PRODUCTION_DEPLOYMENT_ID = dpl_ED91sTmSbtDS3xTzhgCeeiJqeRh7
PRODUCTION_DEPLOYMENT_STATE = READY
PRODUCTION_DEPLOYMENT_TARGET = production
PRODUCTION_DEPLOYMENT_GIT_REF = main
PRODUCTION_DEPLOYMENT_SHA = 595a99110367aefb545b02dab4b9f9a5a6106ab6
MAIN_DEPLOYMENT_MATCH = YES
CANDIDATE_DEPLOYED = NO

VERCEL_PROJECT_ID = prj_HVvrINpQcsBUyP36oa1ySEFRShla
SUPABASE_OPERATOR_PROJECT_REF = kytdomflmjytzyaabogi
SUPABASE_OPERATOR_PROJECT_STATUS = ACTIVE_HEALTHY
SUPABASE_OPERATOR_POSTGRES_VERSION = 17.6.1.155
VERCEL_PRODUCTION_SUPABASE_REF = UNKNOWN
VERCEL_PRODUCTION_AUTH_REF = UNKNOWN
VERCEL_PRODUCTION_DB_PROJECT_REF = UNKNOWN
VERCEL_PRODUCTION_DURABLE_SESSION_TARGET = UNKNOWN
RUNTIME_DATABASE_IDENTITY_MATCH = UNKNOWN
RUNTIME_AUTH_IDENTITY_MATCH = UNKNOWN

The Supabase project lookup proves the operator project exists; it does not prove that the deployed Vercel runtime uses that project for database or Auth. The Vercel deployment metadata confirms its Git SHA but does not expose the requested runtime references. The available approved Vercel connector has no environment-reference read operation. The prior vercel env pull attempt was rejected before execution by command review (blocked by policy); no bypass was attempted.

## Gate decision

RUNTIME_IDENTITY_HARD_GATE = BLOCKED
PRODUCTION_BACKUP_GATE = NOT_RUN
BACKUP_RESTORE_PROOF = NOT_RUN
PRODUCTION_STORAGE_INVENTORY = NOT_RUN
TARGET_MIGRATION_UNKNOWN = NOT_ZERO
HASH_MISMATCH = 0 (prior reconciliation)
MIGRATION_REHEARSAL = PASS (local disposable PostgreSQL only)
PRODUCTION_MAINTENANCE_APPROVAL = NOT_VERIFIED
ABORT_THRESHOLDS_DEFINED = NOT_VERIFIED
PRODUCTION_MIGRATION_PREFLIGHT = BLOCKED
PRODUCTION_MIGRATIONS = NOT_RUN
PRODUCTION_SCHEMA_MATCH = UNKNOWN
CURRENT_DEPLOYED_CODE_DATABASE_SMOKE = NOT_RUN
REAL_PRODUCTION_ACCEPTANCE = NOT_STARTED
PROD_ACCEPTANCE_RUN_ID = NOT_CREATED
TAVILY_MODE_FINAL = OFF
TAVILY_FINAL_LIVE = NOT_RUN
FRESH_RETRIEVAL_HOLDOUT = NOT_RUN

Prior repository-to-operator reconciliation recorded 4 target migrations as NOT_APPLIED, 15 migration entries as UNKNOWN, and no hash mismatch. A current read-only migration-list call still returned only the operator project's recorded migration entries; this does not resolve the unknown schema effects. The runtime identity gate fails before backup or writes, so this run performed no production backup, restore, migration, database mutation, deployment, canary, provider request, or real-user action.

The remote main SHA equals the previously recorded main SHA and is the release branch's merge base. At fetch time there were no main-only commits and 20 release-only commits. This is a race check only, not approval to promote. The pending report is a separate documentation commit; main was not modified.

## Acceptance status

The required real-user acceptance sequence was not started because Section 4's runtime identity hard gate remains UNKNOWN. No production personas logged in, no acceptance data was created, and no cleanup ran. Staging evidence remains staging evidence and is not promoted to production proof.

For the requested Room media matrix, see ROOM_MEDIA_STORAGE_ACCEPTANCE.md. Its code-path audit remains:

ROOM_IMAGE_UPLOAD = NOT_RUN
ROOM_IMAGE_READBACK = FAIL_STATIC
ROOM_IMAGE_TRUST_HANDOFF = BLOCKED_BY_MISSING_CANONICAL_ASSET_REFERENCE
ROOM_QR_UPLOAD = NOT_RUN
ROOM_QR_READBACK = FAIL_STATIC
ROOM_QR_TRUST_HANDOFF = BLOCKED_BY_MISSING_CANONICAL_ASSET_REFERENCE
ROOM_MEDIA_AUTHORIZATION = NOT_RUN_LIVE
ROOM_MEDIA_RELOAD = FAIL_ACCEPTANCE
ROOM_MEDIA_RECONNECT = NOT_RUN_FOR_MEDIA
ROOM_MEDIA_CLEANUP = NOT_RUN
ROOM_MEDIA_STORAGE = FAIL

The specific static failures are: no durable Storage object is created by Room upload (R05); the room persists bytes rather than a canonical artifact ID/digest (R06); the Trust handoff and Evidence Package do not preserve the same canonical media provenance (R07/R09); and reload cannot resolve a Storage-backed artifact (R10/R11). These findings block the requested IMAGE/QR Room acceptance.

## Final status snapshot

This table separates current production acceptance from prior candidate/staging results. NOT_RUN_PRODUCTION is not a PASS.

| Area | Current production acceptance |
| --- | --- |
| Auth / Profile | NOT_RUN_PRODUCTION |
| Community | BLOCKED; prior production baseline APIs returned 500 and 503; candidate staging checks passed |
| Community search / realtime | NOT_RUN_PRODUCTION |
| Trust TEXT / URL / IMAGE / QR / L1-L4 / persistence | NOT_RUN_PRODUCTION; separate candidate staging checks passed |
| Expert request / matching / assignment / assessment / textbox | NOT_RUN_PRODUCTION; candidate staging checks passed |
| Question bank / Quiz / missions / Star-Level / reputation | NOT_RUN_PRODUCTION |
| Expert presence / Live Room / Supervisor / timer / answer privacy / Evidence Package / adjudication | NOT_RUN_PRODUCTION; Room media has the release-required failure above |
| Realtime / reconnect / realtime plus DB | NOT_RUN_PRODUCTION |
| Storage | BLOCKED for Room media; direct Trust IMAGE/QR staging storage checks passed |
| Omni / notifications | NOT_RUN_PRODUCTION |
| OpenAlex | NOT_RUN_THIS_ACCEPTANCE; earlier staging smoke is not production acceptance |
| Chromium / Firefox / WebKit / mobile / accessibility | NOT_RUN_PRODUCTION; candidate browser matrix previously passed |
| Build / TypeScript / lint | NOT_RERUN_THIS_ACCEPTANCE; candidate build/type passed and lint had 0 errors |
| Secret scan | PASS for changed report/index/manifest; full repository scan not run |
| Frontend ↔ backend fully connected | NO — not proven for production |
| Database fully compatible | NO — not proven against the deployed runtime |
| Auth/RBAC/RLS fully working | NO — not proven by this acceptance |
| Realtime fully working | NO — not proven by this acceptance |
| Full web system running end-to-end | NO |
| Full fix accepted | NO |

FINAL_VERDICT = STUDENTHUB_PRODUCTION_RELEASE_PARTIAL

No source change was made. The candidate source SHA remains frozen. Production promotion and real-user acceptance remain on hold until runtime database/Auth references are proven through an approved operator workflow, followed by the backup/restore, migration/schema, deployment, and acceptance gates in the rollout prompt.
