# StudentHub canonical production unification — current candidate evidence

## Decision

```ini
FINAL_VERDICT = STUDENTHUB_PRODUCTION_RELEASE_PARTIAL
FULL_FIX_ACCEPTED = NO
PACKAGE_STATUS = CANDIDATE_REPAIRED_AND_LOCALLY_VERIFIED_PRODUCTION_HOLD
FINAL_RELEASE_SOURCE_SHA = cc2a31069dfab6dd4fa112335f930c3639719fe6
RELEASE_BRANCH = codex/studenthub-four-core-repair-20261001
BASELINE_SOURCE_SHA = eea55564ebaef4dc2edc7af14586fe8f04324114
CURRENT_PRODUCTION_MAIN_SHA = 595a99110367aefb545b02dab4b9f9a5a6106ab6
CURRENT_PRODUCTION_DEPLOYMENT_ID = dpl_ED91sTmSbtDS3xTzhgCeeiJqeRh7
CURRENT_PRODUCTION_DEPLOYMENT_SHA = 595a99110367aefb545b02dab4b9f9a5a6106ab6
PRODUCTION_MUTATED = NO
```

The user-provided approved production metadata confirms the Vercel project, Production environment, deployment ID/SHA, and expected Supabase ref `kytdomflmjytzyaabogi`. It explicitly does **not** establish runtime identity: Auth, database, Storage, Realtime, and durable-session project refs are all `UNKNOWN`. The operator's read-only Supabase project is the expected production project but cannot stand in for Vercel runtime proof. Therefore the production hard gate remains HOLD; no backup, restore, migration, deploy, canary, or production user/object mutation was performed.

## Candidate source and verification

Source commit `cc2a31069dfab6dd4fa112335f930c3639719fe6` contains the scoped Room media durability, canonical Trust intake, authorization, provenance, cleanup, and tests. The change reuses the existing private Trust storage contract; it adds no production migration. A complete 29-migration disposable PostgreSQL 17.6 rehearsal exists at `migration-rehearsal-final.json` for baseline `eea55564ebaef4dc2edc7af14586fe8f04324114`; a direct comparison confirms that the candidate adds no changes under `database/migrations`. The Room local Supabase 17.6 harness also rehearsed the four applicable existing migrations and records their hashes in `room-media-local-assurance.json`. Thus the SQL rehearsal remains applicable to the same migration tree, but neither run is a production dump restore or cloud migration approval. Older cloud catalog/ledger observations remain historical evidence only.

| Gate | Candidate result | Evidence / boundary |
| --- | --- | --- |
| Next.js production build and TypeScript | PASS | `build-room-media.log`; build completed successfully for this source |
| Lint | PASS; 0 errors, 489 warnings | `lint-room-media.log` |
| Discovered test files | 393/399 PASS; 6 BLOCKED_BY_EXTERNAL_GATE | `regression-room-media.log`; this is file-level runner status, not a claim that every live/database test ran |
| Browser cross-engine UI | NOT_RUN for this candidate | Chromium, Firefox, WebKit, responsive and accessibility acceptance remain open |
| Client secret scan | PASS; 91 static bundle files, zero detected leakage | `secret-scan-room-media.log`; scan found zero configured secret values and checked server-only identifiers |
| Room IMAGE/QR local integration | 31/31 checks PASS; eight exact cleanup confirmations PASS | `room-media-local-assurance.json`; local disposable environment only |
| Migration rehearsal | PASS for all 29 tracked migrations on disposable PostgreSQL 17.6; SQL tree unchanged from rehearsal baseline | `migration-rehearsal-final.json`; current Room harness replays four applicable existing migrations |
| Room package input | Synthetic terminal Trust response | Does not prove live Trust L1–L4 or real provider evidence |
| Live OpenAlex / Tavily / Trust | NOT_RUN | No provider calls; Tavily remains OFF |
| Fresh retrieval and Final Predict holdout | NOT_MEASURED on this candidate | Do not substitute V3/V4/V5 historical runs or claim accuracy metrics |
| Production backup and restore | NOT_DONE | Runtime database identity and verified backup target unavailable |
| Production migration reconciliation | NOT_CLOSED | Earlier read-only ledger observation on operator ref: 4 NOT_APPLIED, 15 UNKNOWN, 0 hash mismatches; it is not proof of Vercel runtime identity |
| Production schema match / missing active objects | UNKNOWN | Older catalog is historical and cannot close current production gate |
| Production personas and UI journeys | 0/8 accepted for this candidate | Prior auth diagnostic is not candidate-bound production UI evidence |
| Production deployment of candidate | NOT_DEPLOYED | Current production remains on SHA `595a99110367aefb545b02dab4b9f9a5a6106ab6` |

The six externally blocked test files are:

- `frontend/tests/evidence/fresh_retrieval_holdout_v3.test.mjs`
- `frontend/tests/evidence/fresh_retrieval_holdout_v4.test.mjs`
- `frontend/tests/evidence/fresh_retrieval_holdout_v5_public_api.test.mjs`
- `frontend/tests/evidence/live_web_retrieval.test.mjs`
- `frontend/tests/evidence/real_world_live_search_golden_flow.test.mjs`
- `frontend/tests/expert/expert_v5_live_readonly.test.mjs`

## Required final output fields

Here `UNKNOWN` means evidence is unavailable; `NOT_RUN` means the named acceptance has not been executed. `NO` is used only where the current evidence affirmatively fails the requested acceptance or the implementation is not deployed.

```ini
PRODUCTION_SUPABASE_REF = kytdomflmjytzyaabogi (expected/operator ref)
VERCEL_RUNTIME_SUPABASE_REF = UNKNOWN
RUNTIME_DATABASE_IDENTITY_MATCH = UNKNOWN
RUNTIME_AUTH_IDENTITY_MATCH = UNKNOWN
PRODUCTION_BACKUP_GATE = NOT_RUN
PRODUCTION_SCHEMA_MATCH = UNKNOWN
ACTIVE_MISSING_TABLES = UNKNOWN (older catalog listed 22 repair-scope tables absent; not current runtime evidence)
ACTIVE_MISSING_COLUMNS = UNKNOWN (older catalog listed 6 repair-scope columns absent; not current runtime evidence)

AUTH = NOT_RUN_ON_CANDIDATE
PROFILE = NOT_RUN_ON_CANDIDATE
COMMUNITY = NOT_RUN_ON_CANDIDATE
COMMUNITY_HELPFUL = NOT_RUN
COMMUNITY_SEARCH = NOT_RUN

TRUST_L1 = NOT_RUN_LIVE
TRUST_L2 = NOT_RUN_LIVE
TRUST_L3 = NOT_RUN_LIVE
TRUST_L4 = NOT_RUN_LIVE
FINAL_PREDICT = NOT_MEASURED
TRUST_PERSISTENCE = NOT_RUN_ON_PRODUCTION

EXPERT = NOT_RUN_ON_PRODUCTION
EXPERT_REQUEST = NOT_RUN
EXPERT_TEXTBOX = NOT_RUN
EXPERT_SCOPE = NOT_RUN
QUESTION_BANK = NOT_RUN
QUIZ = NOT_RUN
MISSIONS = NOT_RUN
STAR_LEVEL = NOT_RUN
REPUTATION = NOT_RUN

LIVE_ROOM = PASS_LOCAL_SERVICE_ONLY / NOT_RUN_PRODUCTION_UI
ROOM_IMAGE_STORAGE = PASS_LOCAL / NOT_RUN_PRODUCTION
ROOM_QR_STORAGE = PASS_LOCAL / NOT_RUN_PRODUCTION
SUPERVISOR = NOT_RUN
TIMER = NOT_RUN
ANSWER_PRIVACY = NOT_RUN_PRODUCTION
EVIDENCE_PACKAGE = PASS_LOCAL_SYNTHETIC_INPUT / NOT_RUN_LIVE_TRUST
ADJUDICATION = NOT_RUN_PRODUCTION

REALTIME = NOT_RUN_PRODUCTION
REALTIME_RECONNECT = PASS_LOCAL_ROOM_READBACK_ONLY / NOT_RUN_PRODUCTION
REALTIME_PLUS_DB = NOT_RUN
OPENALEX = NOT_RUN_ON_CANDIDATE
FRESH_RETRIEVAL = NOT_MEASURED
TAVILY_FINAL_LIVE = NOT_RUN
TAVILY_MODE_FINAL = OFF
DEMO_ACCOUNTS_READY = 0/8 candidate-bound production acceptance

CHROMIUM = NOT_RUN
FIREFOX = NOT_RUN
WEBKIT = NOT_RUN
ACCESSIBILITY = NOT_RUN
BUILD = PASS
TYPE = PASS (included in production build)
LINT_ERRORS = 0
SECRET_SCAN = PASS (91 static bundle files)

FINAL_RELEASE_SOURCE_SHA = cc2a31069dfab6dd4fa112335f930c3639719fe6
REMOTE_RELEASE_SHA = PENDING_PUBLICATION
REMOTE_MAIN_SHA = 595a99110367aefb545b02dab4b9f9a5a6106ab6 (last verified)
PRODUCTION_DEPLOYMENT_SHA = 595a99110367aefb545b02dab4b9f9a5a6106ab6

FRONTEND_BACKEND_FULLY_CONNECTED = NO (candidate production acceptance not established)
DATABASE_FULLY_COMPATIBLE = UNKNOWN
ALL_ACTIVE_APIS_WORKING = UNKNOWN
FULL_WEB_SYSTEM_RUNNING_END_TO_END = NO (required production journeys not run)
FULL_FIX_ACCEPTED = NO
FINAL_VERDICT = STUDENTHUB_PRODUCTION_RELEASE_PARTIAL
```

## Release sequence after the hard gate closes

1. Obtain approved, secret-safe runtime refs proving Vercel production Auth, database, Storage, Realtime, and durable sessions all resolve to `kytdomflmjytzyaabogi`; if any do not, correct them through the approved Vercel workflow and reverify.
2. Resolve all 15 unknown migration entries and four not-applied entries against the proven runtime, with zero hash mismatches. Inventory relevant legacy Room records before deployment; do not assume old raw Room media can be migrated safely without a reviewed owner/provenance mapping.
3. Create an encrypted production database backup plus separate Storage-object backup, restore the database to a compatible disposable target, and verify checksums, schema, representative rows, FKs, indexes, RLS, policies, grants, functions, and triggers.
4. Rehearse and apply only migrations confirmed both required and not applied. Verify final canonical schema and permissions.
5. Complete non-Tavily live Trust L1–L4, OpenAlex, fresh unseen retrieval/Final Predict holdout metrics, all product-core regressions, and all eight real persona journeys. Only then run the final live Tavily campaign within the 100-unique-call ceiling and set Tavily OFF afterward.
6. Publish the exact frozen candidate branch, fetch and race-check `origin/main`, and promote only after critical gates pass. Verify Vercel READY deployment SHA exactly matches the promoted main SHA.
7. Run real production UI acceptance, including the IMAGE/QR R01–R17 flow, role boundaries, reload/reconnect, and exact run-owned cleanup. Recheck health and data after cleanup; record environment, source/deployment SHA, and evidence.

The earlier static Room media failure is fixed in candidate code and its local integration rehearsal passed. The release is still PARTIAL because the user-required production identity, recovery, provider, schema and real-user evidence has not been established.
