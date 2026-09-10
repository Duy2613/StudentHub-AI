# StudentHub Promax Forward Migration Rehearsal — 2026-09-10

## Verdict

`FORWARD_MIGRATION_REHEARSAL_NOT_EXECUTED`.

The previously completed clean local migration is `G1_LOCAL_CLEAN_MIGRATION_VERIFIED`. It is not being relabeled as the requested old-like-state forward rehearsal.

## Required rehearsal shape

The safe rehearsal must be:

`OLD_LIKE_LOCAL_STATE → pending canonical migrations → STUDENTHUB_EXPERT_HYBRID_RC schema`

using only sanitized synthetic fixtures and a separate disposable database. It must then verify object fingerprints, RLS, constraints, idempotency, append-only triggers, and readback of durable Community/Expert/Trust state.

## Why it did not execute

Docker Desktop has since recovered and the authenticated local E2E was completed. The old-like forward rehearsal itself was not executed: the attempted fresh PostgreSQL target did not contain the Supabase `auth`/`storage` platform schemas required by the canonical application state, and no sanitized old-like source snapshot was available. Replacing that target with a mock or Main-cloud write would have invalidated the evidence boundary.

No factory reset, volume deletion, migration, seed, or main-cloud mutation was performed.

## Static migration review completed

The pending migration set and hashes are recorded in the candidate manifest. Static review confirms:

- Realtime event history is append-only and RLS/private.
- Promax Community/Expert tables are server-owned, idempotent, revision-bound, and policy-protected.
- `202609090001` contains a controlled qualification-state normalization update but no seed inserts or deletes.
- Authority snapshot migration adds revision and lineage fields with explicit constraints; it does not rewrite assessment history.
- The main read-only preflight found no immediate NOT NULL backfill risk in inspected non-empty tables.

Static review is not a substitute for executing the pending migrations against an old-like local database.

## Rerun procedure

1. Provide a fresh disposable Supabase/Postgres engine plus a sanitized old-like application snapshot.
2. Restore only sanitized old-like application schemas into a separate target.
3. Apply `202609070001`, `202609090001`, and `202609100001` in order.
4. Re-run schema fingerprint/object diff and all live RLS, concurrency, Storage, Trust, Passport, and authenticated browser gates.
5. Re-run the same migration application only where the migration framework supports rerun semantics; do not invent destructive idempotency.
6. Record the result as `FORWARD_MIGRATION_REHEARSAL_VERIFIED` only after the target fingerprint and negative checks match the candidate.
