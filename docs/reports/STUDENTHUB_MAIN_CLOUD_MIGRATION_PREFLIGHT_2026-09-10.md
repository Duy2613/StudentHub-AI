# StudentHub Main Cloud Migration Preflight — 2026-09-10

## Verdic

`MAIN_CLOUD_MIGRATION_PREFLIGHT_VERIFIED` for read-only schema/data inspection.

`MAIN_SUPABASE_LIVE_VERIFIED` and `PRODUCTION_READY` are not claimed. No DDL, DML, migration, reset, seed, or destructive operation was sent to main Supabase.

## Read-only connection evidence

- Target class: `MAIN_CLOUD_READ_ONLY`.
- Host class: Supabase transaction pooler; credentials are not printed.
- Postgres: `17.6`.
- Database: `postgres`.
- Schemas inspected: `public`, `private`, `storage`.
- Storage audit: `trust-screenshots-private` exists and is `public=false`.
- `pg_advisory_xact_lock` is supported.
- Mutation guard: `SELECT_ONLY`; writes attempted `0`; DDL attempted `0`; DML attempted `0`.

Artifact: `artifacts/main-cloud-readonly-preflight-2026-09-10.json`.

## Candidate comparison

| Object class | Local RC candidate | Main cloud | Missing on main | Changed | Extra on main |
|---|---:|---:|---:|---:|---:|
| Tables | 58 | 48 | 16 | 1 | 6 |
| Columns | 607 | 403 | 248 | 0 | 44 |
| Constraints | 450 | 254 | 208 | 3 | 12 |
| Indexes | 159 | 108 | 62 | 3 | 11 |
| Policies | 41 | 33 | 9 | 0 | 1 |
| Triggers | 29 | 5 | 24 | 0 | 0 |
| Routines | 5 | 18 | 4 | 0 | 17 |

Schema fingerprints:

- Local candidate: `2cf6854763fc33b2251811c473c3adf5e95b892e750158d1edf7689d2a716fc8`.
- Main read-only snapshot: `80952eb54c06b8da5350e3b6442ba021dbd87f625bab6c23012d7c1c8ea8e90c`.

The main missing tables are the Promax Community/Expert append-only and workflow objects plus `private.realtime_events`. The six extra main objects are Supabase Storage platform tables (`buckets_analytics`, `buckets_vectors`, `migrations`, multipart tables, and `vector_indexes`); they are not drop candidates.

Main has one RLS difference on `public.institutions` and one extra public policy. This is an existing platform/legacy difference, not an instruction to alter main during this pass.

## Pending migration impac

The pending candidate set is:

1. `202609070001_realtime_event_log.sql` — creates `private.realtime_events`, three indexes, one append-only trigger function, two triggers, and enables RLS.
2. `202609090001_community_expert_promax.sql` — creates the Community/Expert/appeal/correction tables, constraints, indexes, policies, append-only triggers, RLS, and compatibility alterations to existing qualification, verification, quality, assessment, reaction, and outbox structures. It contains one explicit qualification-state normalization update; it does not insert seed rows or delete rows.
3. `202609100001_expert_authority_snapshot.sql` — adds verification/assignment revisions and assessment authority-snapshot lineage, constraints, indexes, and revision triggers. It is forward-only and contains no seed insert/delete.

Migration inventory and SHA-256 values are recorded in `artifacts/candidate/STUDENTHUB_EXPERT_HYBRID_RC_MANIFEST.json` and the local schema manifest.

## Main data compatibility

Read-only aggregate checks found:

- `public.profiles`: `5` rows.
- `public.trust_cases`: `4` rows.
- `public.expert_assessments`: `0` rows.
- `private.expert_verifications`: `0` rows.
- `private.integration_outbox`: `0` rows.
- `private.expert_assignments`: not present on main.
- No orphaned `expert_verifications.expert_id` references were observed because the inspected verification table had zero rows.
- No immediate NOT NULL backfill risk was detected for existing non-empty inspected tables.

This is not a complete migration approval: constraints, locks, provider execution behavior, and exact forward rehearsal remain to be tested on an isolated old-like disposable database.

## Migration safety decision

- Apply to main: `NOT AUTHORIZED / NOT EXECUTED`.
- Transactional rollback promise: `NOT CLAIMED`.
- Recommended release shape: backup → read-only preflight → forward-only migration in an authorized window → post-migration schema/RLS checks → forward-fix if necessary.
- Main migration package is prepared as metadata and verification guidance only; it is not an executable deployment action.
