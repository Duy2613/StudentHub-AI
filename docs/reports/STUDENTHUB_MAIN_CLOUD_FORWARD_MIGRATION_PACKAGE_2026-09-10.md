# StudentHub Main Cloud Forward-Migration Package

Date: 2026-09-10
Candidate: `STUDENTHUB_EXPERT_HYBRID_RC`
Status: `PREPARED_READ_ONLY_NOT_EXECUTED`

This is a controlled forward-migration package, not an execution record. The current local runtime status is `LOCAL_RUNTIME_AVAILABLE_AUTHENTICATED_E2E_VERIFIED`. Main Supabase was inspected with read-only metadata and aggregate queries only. No migration, DDL, DML, seed, reset, or deploy was performed. Git branch release is a separate repository operation and does not authorize or mutate Main Supabase.

## Evidence boundary

The following local results are historical verified evidence and remain valid:

- `G1_LOCAL_CLEAN_MIGRATION_VERIFIED`
- `RLS_LOCAL_LIVE_VERIFIED`
- `CONCURRENCY_IDEMPOTENCY_VERIFIED`
- `APPLICATION_SCHEMA_RESTORE_VERIFIED`
- `LOCAL_PRIVATE_STORAGE_VERIFIED`
- `PROMAX_LOCAL_PERSISTENCE_VERIFIED`

The authenticated Community → Expert → Trust local E2E is recorded separately as `FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED` after Docker recovery, with synthetic fixtures, loopback-only network isolation, and cleanup verification. It does not authorize any Main migration.

## Read-only preflight inpu

- Main fingerprint: `80952eb54c06b8da5350e3b6442ba021dbd87f625bab6c23012d7c1c8ea8e90c`
- Candidate fingerprint: `2cf6854763fc33b2251811c473c3adf5e95b892e750158d1edf7689d2a716fc8`
- Main counts: 48 tables, 403 columns, 254 constraints, 108 indexes, 33 policies, 5 triggers, 18 routines.
- Candidate counts: 58 tables, 607 columns, 450 constraints, 159 indexes, 41 policies, 29 triggers, 5 routines.
- Candidate objects absent from Main: 16 tables, 248 columns, 208 constraints, 62 indexes, 9 policies, 24 triggers, 4 routines.
- Aggregate compatibility: `NO_IMMEDIATE_NOT_NULL_BACKFILL_RISK_DETECTED`.
- Main aggregates: `profiles=5`, `trust_cases=4`, `expert_assessments=0`, `private.expert_verifications=0`, `private.integration_outbox=0`; no orphaned verification references were found.
- Full machine-readable evidence: `artifacts/main-cloud-readonly-preflight-2026-09-10.json`.

## Canonical forward order

Apply only the repository migrations below, in timestamp order, after a separate disposable rehearsal and approved change window:

| Order | Migration | SHA-256 |
| ---: | --- | --- |
| 1 | `database/migrations/202608270001_v2_authority_foundation.sql` | `3e6e5bc0cb4cc6895f485140d4f0c67f240305421f8c47e69fd0e2de6a0024a7` |
| 2 | `database/migrations/202608290001_feature_freeze_cross_system.sql` | `5cb27dc79f19a4c04779e041ebc16aeefd9e9b52d336a05254c89d6ace0e33ab` |
| 3 | `database/migrations/202609010001_private_screenshot_storage.sql` | `dbbf36ded1424145125458c2f3cc9df2576ad7043e71448f20bc3061fb96c96e` |
| 4 | `database/migrations/202609060001_expert_qualification.sql` | `16b2da3119827d4b82898f0457240e180fc92e484de4190d60bf8bbeae6222e2` |
| 5 | `database/migrations/202609060002_integration_outbox.sql` | `8bfc73c0c9e8b5aa7a004c5c3bcf15a68c95b164a91a3d82cb5fc50462dbb4c6` |
| 6 | `database/migrations/202609060003_trust_runs_revisions.sql` | `eceb68be1b3451dd15c75b7770809ac2c05ce16ba493762bfc41b4304d184a51` |
| 7 | `database/migrations/202609060004_reports.sql` | `da4e31c700950a964318bfdcd41e0f54c76ea27a4d1efadd89173cf5cf1b043a` |
| 8 | `database/migrations/202609070001_realtime_event_log.sql` | `914f4120f60ebd999031caec772864f6f818ad13d68a43530627c21af4dbf024` |
| 9 | `database/migrations/202609090001_community_expert_promax.sql` | `de2761d05c8c11e2688960d5adb73d5e7c23b8c3e9054f43018715f8ec7e5bdc` |
| 10 | `database/migrations/202609100001_expert_authority_snapshot.sql` | `d94f1db628178beb8e90d62b234e8ee7ba02a8cfa8e3a547095c59f5e7e9371b` |

The Main read-only comparison identifies migrations 8–10 as pending. Migrations 1–7 are included in the package so a disposable rehearsal can prove the complete clean-chain checksum, rather than silently relying on an unknown remote history.

## Impact and compatibility review

- `202609070001_realtime_event_log.sql`: one private event table, three indexes, one function, two triggers, and RLS. The event table is append-only by policy and must not be treated as client-writable state.
- `202609090001_community_expert_promax.sql`: Community contribution/reaction/source/file/quality objects, expert practice/assignment/review objects, appeal objects, indexes, RLS policies, revision guards, and the qualification compatibility extension. It has no seed dataset. Existing `private.expert_verifications` rows are not required for the empty-state path; the preflight found zero rows.
- `202609100001_expert_authority_snapshot.sql`: authority snapshot/revision columns and their integrity/index/guard support. It has no seed dataset. Existing data must be checked for nullability and revision compatibility before apply.
- Existing `public.institutions` RLS is enabled on Main while the candidate manifest describes it differently. This is an observed compatibility difference, not an instruction to disable or rewrite Main policy state; it remains outside the pending application delta.
- Storage platform tables and collation differences are platform-owned. They are not drop/replace targets and must not be “normalized” by the application migration.
- No immediate NOT NULL backfill risk was detected from the current Main aggregates. This does not replace a transaction-level preflight immediately before execution.

## Required gates before any future apply

1. Preserve the authenticated local E2E artifact and resume from that checkpoint only if a future code or migration change invalidates it; do not repeat completed read-only work.
2. Run the complete ten-migration chain on a fresh disposable database and compare the resulting fingerprint to `2cf6854763fc33b2251811c473c3adf5e95b892e750158d1edf7689d2a716fc8`.
3. Capture a fresh Main backup/snapshot according to the operator’s Supabase recovery policy. Do not represent an application backup as a platform restore proof.
4. Re-run the read-only schema and aggregate preflight immediately before the change window and confirm the migration files have the listed SHA-256 values.
5. Confirm no unrelated migration is interleaved and that the target migration history is the expected branch/revision.
6. Apply only through the approved Supabase migration mechanism in the approved change window; this package does not authorize execution.

## Post-apply verification gates

After an authorized apply, verify from a fresh read-only connection:

- all ten migration versions are present and checksummed;
- the candidate schema fingerprint and object counts match the clean disposable reference;
- RLS is enabled and expected policies/triggers/routines exist for Community, Expert, Trust, realtime, and authority snapshots;
- no existing rows violate new checks, foreign keys, ownership constraints, or revision invariants;
- protected anonymous requests remain `401/403` and cross-user access remains denied;
- authenticated Community contribution/reaction → qualification/assignment/COI → Expert assessment → Trust evidence path persists real rows and respects idempotency;
- no fake profile, count, quote, citation, or expert authority is rendered for empty projections;
- application build/tests and the required browser smoke run pass against the migrated target.

If any gate fails, stop at the failing stage and preserve the evidence. Do not fabricate a rollback claim. Use the approved forward-fix or platform recovery procedure after incident review.

## Package contents

- Canonical SQL: `database/migrations/202608270001_v2_authority_foundation.sql` through `database/migrations/202609100001_expert_authority_snapshot.sql`.
- Read-only preflight: `scripts/main-cloud-readonly-preflight.mjs`.
- Machine-readable preflight result: `artifacts/main-cloud-readonly-preflight-2026-09-10.json`.
- Human-readable preflight: `docs/reports/STUDENTHUB_MAIN_CLOUD_MIGRATION_PREFLIGHT_2026-09-10.md`.
- Current candidate manifest: `artifacts/candidate/STUDENTHUB_EXPERT_HYBRID_RC_MANIFEST.json`.

No operation from this package was executed against Main Supabase in the current pass.
