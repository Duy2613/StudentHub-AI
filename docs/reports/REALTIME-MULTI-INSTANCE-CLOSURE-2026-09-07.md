# StudentHub AI — Realtime multi-instance closure slice

Date: 2026-09-07 (Asia/Bangkok)  
Scope: durable event log, cursor replay, private subject filtering and
post-commit Trust projection. Labbe remains frozen.

## Verdict

`REALTIME_DURABLE_LOCAL_VERIFIED`

This is a local contract result, not a production-readiness claim. The prior
process-local SSE path remains available only outside production when no
PostgreSQL event log is configured.

## What changed

1. Added the private append-only `realtime_events` table with sequence,
   payload hash, idempotency key, classification, subject binding and RLS /
   service-role grants.
2. Added a PostgreSQL repository that appends immutable events, binds
   idempotency to the complete envelope, detects event/content conflicts, and
   replays by sequence while filtering private rows to the authenticated
   subject (including subject-bound events on nominally public channels).
3. Updated SSE to use the durable repository when `DATABASE_URL` is present,
   emit `id` cursors, resume from `Last-Event-ID`/`cursor`, and fail closed in
   production when the shared event log is unavailable.
4. Kept the in-memory hub explicitly non-authoritative for local development,
   added subject-aware delivery, and made the browser preserve the latest
   sequence across reconnects.
5. Published a minimal Trust revision projection only after the existing Trust
   transaction commits; it contains no raw input, evidence, or credentials.

## Evidence

| Check | Result |
| --- | --- |
| Durable repository + migration tests | 6/6 pass |
| Existing realtime transport test | 1/1 pass |
| Auth/session contracts | 23/23 pass |
| PostgreSQL/RLS migration contract | pass; live test skipped without DSN |
| Targeted ESLint | 0 errors |

## Explicit blockers

The environment has no approved `DATABASE_URL` or
`STUDENTHUB_RLS_TEST_DATABASE_URL` for a clean PostgreSQL run. No two-replica
fan-out, reconnect/slow-consumer load, restart recovery, retention drill, or
Supabase Broadcast comparison was executed. Realtime remains partial in the
release gate until those environment-bound checks are completed.

## Next controlled action

Apply migration `202609070001_realtime_event_log.sql` to an owned disposable
staging database, run the phase-3 RLS test, then execute a two-instance SSE
fan-out/reconnect harness with a bounded synthetic event profile. Record
sequence continuity, duplicate suppression, subject isolation, lag, memory,
connection admission and recovery before changing the readiness or release
verdict.
