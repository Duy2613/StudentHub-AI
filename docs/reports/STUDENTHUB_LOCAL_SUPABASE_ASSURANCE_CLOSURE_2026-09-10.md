# StudentHub Local Supabase Assurance Closure — 2026-09-10

## Executive verdict

Overall status: `STUDENTHUB_LOCAL_BACKEND_RC_VERIFIED`.

The Community × Expert Promax integration is verified against a disposable local Supabase/Postgres instance. The main Supabase project was not migrated, mutated, seeded, reset, or used as the target of the live assurance writes. Therefore this report does not claim production or main-cloud live completion.

## Scope and environment identity

- Test target: `LOCAL_DISPOSABLE_SUPABASE`.
- Main target: `CLOUD / NON-DISPOSABLE`.
- Identity proof: `MAIN = CLOUD / NON-DISPOSABLE`, `TEST = LOCAL / DISPOSABLE`, `IDENTITY_CHECK = PASS`.
- Local API gateway: `http://127.0.0.1:56021`; local Postgres host port: `55432`.
- Local containers were healthy for DB, Kong, Auth, Storage, and Realtime. The Realtime HTTP probe used a non-health endpoint and returned `404`; the container health status remained healthy.
- No secret, service key, or access token is included in this report or its artifacts.

## Migration and schema evidence

All ten canonical migrations in `database/migrations/` were applied to a clean disposable database without manual patching:

1. `202608270001_v2_authority_foundation.sql`
2. `202608290001_feature_freeze_cross_system.sql`
3. `202609010001_private_screenshot_storage.sql`
4. `202609060001_expert_qualification.sql`
5. `202609060002_integration_outbox.sql`
6. `202609060003_trust_runs_revisions.sql`
7. `202609060004_reports.sql`
8. `202609070001_realtime_event_log.sql`
9. `202609090001_community_expert_promax.sql`
10. `202609100001_expert_authority_snapshot.sql`

Schema manifest: `artifacts/local-supabase-schema-manifest-2026-09-10.json`.

- Application schema tables after migration: `56`.
- Manifest tables including Supabase Storage tables: `58`.
- Columns: `607`.
- Constraints: `450`.
- Indexes: `159`.
- RLS policies: `41`.
- Triggers: `29`.
- Routines: `5`.
- Schema fingerprint: `2cf6854763fc33b2251811c473c3adf5e95b892e750158d1edf7689d2a716fc8`.
- The manifest contains the byte size and SHA-256 for every applied migration.

## Assurance gate results

| Gate | Result | Evidence |
|---|---|---|
| `LOCAL_SUPABASE_AVAILABLE` | PASS | Local Auth/REST/Storage endpoints responded; containers healthy. |
| `G1_LOCAL_CLEAN_MIGRATION_VERIFIED` | PASS | Ten canonical migrations applied to initially clean local app schemas. |
| `RLS_LOCAL_LIVE_VERIFIED` | PASS | Phase 3 live Postgres/RLS suite `9/9`; isolated Trust/report/passport/session live gates pass. |
| `CONCURRENCY_IDEMPOTENCY_VERIFIED` | PASS | Promax local concurrency suite `1/1`; concurrent duplicate/conflict/revocation/lease cases covered. |
| `LOCAL_PRIVATE_STORAGE_VERIFIED` | PASS | Authenticated upload/download allowed; non-owner and anonymous access denied; server metadata insert allowed. |
| `LOCAL_RESTORE_VERIFIED` | PASS | Custom-format `pg_dump` and restore into a separate disposable DB; readback matched expected durable rows. |
| `PROMAX_LOCAL_PERSISTENCE_VERIFIED` | PASS | Community contribution/reaction, Expert assignment/assessment, outbox, Trust and passport persistence exercised locally. |
| `FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED` | PASS | Synthetic authenticated Community → Expert → Trust journey passed after Docker recovery; live-provider UI remains honest when no live records are available. |
| `MAIN_SUPABASE_UNCHANGED` | PASS | No main-cloud migration, write, reset, or seed was performed. |
| `STUDENTHUB_EXPERT_HYBRID_LIVE_VERIFIED` | NOT CLAIMED | Main/staging migration and authenticated live expert journey remain outstanding. |

## Live database evidence

### RLS and durable persistence

- Phase 3 live RLS: `9/9` pass.
- Isolated live gates: durable Trust persistence `5/5`, phase 2 `1/1`, report `1/1`, phase 5 `1/1`, Trust-case passport binding `1/1`, phase 7 `1/1`, phase 6 `1/1`, Postgres session repository `1/1`, and phase 8 `1/1`.
- RLS checks exercised owner boundaries, authenticated writes, private schema protection, append-only history, and fail-closed access paths.

### Community × Expert concurrency and idempotency

`frontend/tests/community_expert/promax_local_concurrency_live.test.mjs` passed `1/1` and covered:

- Concurrent Community contribution requests with the same idempotency key: one durable contribution, one quality event, and one internal outbox event.
- Idempotency conflict when the same key is reused with a different body.
- Concurrent reaction replay: one durable reaction event.
- Concurrent Expert assignment and assessment with the same idempotency key.
- Assessment replay after verification revocation remains idempotent; a new key is rejected with `UNVERIFIED_EXPERT_DOMAIN`.
- LABBE outbox shadow lease contention and expired-lease recovery (`lease_count=2`, `shadow_count=2`).

### Private screenshot storage

Artifact: `artifacts/local-storage-assurance-2026-09-10.json`.

The `trust-screenshots-private` bucket was confirmed private. The local test passed authenticated upload, owner download, non-owner denial, anonymous denial, and server-side metadata insertion. Test users and objects were cleaned up in the disposable local API.

### Backup and restore

Artifact: `artifacts/local-supabase-backup-restore-2026-09-10.json`.

- Backup format: `pg_dump_custom`.
- Backup size: `454769` bytes.
- Backup SHA-256: `341e2e54d585aa43e5cb22e505dbdf72eb075ef33442c8459bf99cc4ae1ee40e`.
- Restored readback: `56` app tables, `14` trust cases, `9` community contributions, `7` expert assessments, and `36` integration outbox rows.
- Restore result: `restorePass=true`.

The restore used schema-filtered application schemas (`auth`, `public`, `private`, `storage`) to avoid copying Supabase platform-owned Realtime function-role incompatibilities into the disposable restore target.

## Hybrid product reality

The verified authority chain is now one system:

`COMMUNITY CONTRIBUTION → TRACK RECORD (0–100 + ★) → EXPERT CANDIDATE → IDENTITY/DOMAIN/PRACTICE → SUPERVISED REVIEW → HUMAN ACTIVATION → VERIFIED DOMAIN EXPERT → ASSIGNMENT + COI → ASSESSMENT → EXPERT EVIDENCE → TRUST V5`.

The server remains authoritative for qualification, verification, assignment, COI, assessment, quality events, and Trust evidence. Client state cannot promote a contributor or expert. Empty live projections render `EMPTY/UNKNOWN` or an unavailable provider state; they do not invent names, counts, quotes, SLA values, or citations.

The current browser dataset contains no verified expert profiles. The `/expert` directory therefore shows an honest durable empty state, while protected qualification and track-record endpoints fail closed for anonymous access.

## Application and regression verification

- Production build: PASS with Next.js `16.3.0` / Turbopack; compilation, TypeScript, page-data collection, static generation `150/150`, and route optimization completed.
- Bundle audit: PASS. Initial JS: `/` `140171`, `/trust` `149478`, `/community` `125846`, `/expert` `125840`, `/cases` `267371` bytes; all below the `500000`-byte budgets.
- Full ESLint snapshot: PASS with `0` errors and `450` non-blocking warnings; no warning was introduced in the files changed during the final remediation pass.
- Independent `tsc --noEmit`: PASS.
- Latest selected contract suite: `21/21` pass; earlier Promax targeted contract suite: `35/35` pass.
- Full discovered regression: `348/350` test files exited successfully; `0` failed and `2` external live-provider files were explicitly `BLOCKED_BY_EXTERNAL_GATE`. Child live database cases that self-skipped for missing disposable acknowledgement are not counted as executed live proof; the explicit local live gates listed above were rerun with the required acknowledgement and passed `27/27`.
- Browser evidence: authenticated local E2E `FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED`; cross-browser RC matrix and `agent-browser` landing/content/console smoke are recorded in `STUDENTHUB_FINAL_BROWSER_MATRIX_2026-09-10.md`.

The final build fix typed `SecurityFabric.wrapHandler` as a callable Next Route Handler instead of the broad `Function` type. The only blocking lint error found in the final pass was also removed by typing the browser network connection capability in `frontend/src/lib/performance.ts`.

## Explicit non-claims and next gates

This closure does not claim:

- main-cloud or production migration completion;
- production/staging authenticated expert qualification, human activation, assignment, COI, and assessment evidence;
- live external-provider latency, cost, or availability evidence;
- LABBE staging delivery or controlled writeback;
- Main-cloud migration, production deployment, or full Supabase platform restore.

Before a production claim, the next controlled gates are: apply the reviewed migration to an explicitly authorized non-disposable staging target; rerun the schema fingerprint and live suites there; create a real human-activated verified expert; execute the authenticated Community → Expert → Trust journey; and only then consider the main-cloud release path.
