# Realtime multi-instance event-log slice

Date: 2026-09-07  
Status: `IMPLEMENTED_LOCAL_CONTRACT / LIVE_ENVIRONMENT_PENDING`

This slice closes the process-local replay gap without changing the Labbe
bridge. PostgreSQL is the recovery source; SSE is only a delivery projection.
When PostgreSQL is configured, the stream reads `private.realtime_events` by a
monotonic sequence cursor and polls again after each bounded page. A browser
reconnect can resume with `Last-Event-ID` or the explicit `cursor` query value.

## Invariants

- Every durable private event is bound to one canonical `auth.users` UUID.
- `channel + idempotency_key` is unique; same content is deduplicated and a
  different payload returns `REALTIME_IDEMPOTENCY_CONFLICT`.
- Payloads are canonical JSON, bounded to 64 KiB, and stored with a SHA-256
  digest. Raw credentials and provider tokens are outside the event contract.
- The event table is service-role-only and append-only. Update/delete attempts
  are rejected by database triggers.
- Replay applies channel scope and subject filtering before data reaches SSE;
  an authenticated user cannot receive another user's private event.
- Production refuses the process-local fallback. Development/test may use the
  explicitly non-authoritative in-memory adapter while the database is absent.
- Trust terminal publication is attempted only after the durable Trust
  transaction returns successfully. A publication outage does not rewrite the
  committed business result.

## Implementation

| Area | Path |
| --- | --- |
| PostgreSQL event log | `database/migrations/202609070001_realtime_event_log.sql` |
| Append/replay/idempotency | `frontend/src/lib/server/realtime/DurableRealtimeRepository.js` |
| Post-commit publisher | `frontend/src/lib/server/realtime/RealtimePublisher.js` |
| SSE route and cursor | `frontend/src/app/api/realtime/stream/route.js` |
| Admin/service publication | `frontend/src/app/api/realtime/broadcast/route.js` |
| Client reconnect cursor | `frontend/src/components/providers/RealtimeContext.jsx` |
| Local fallback compatibility | `frontend/src/lib/realtime/RealtimeHub.js` |

## Verification

- Durable event-log contracts: **4/4 pass**.
- Existing realtime transport contract: **1/1 pass**.
- Auth/session regression used by the realtime provider: **23/23 pass**.
- PostgreSQL/RLS test now includes the event-log migration and private-table
  access assertion; execution is skipped until
  `STUDENTHUB_RLS_TEST_DATABASE_URL` is supplied.
- Targeted ESLint: **0 errors**.

## Remaining evidence boundary

No live two-replica fan-out, reconnect storm, slow-consumer, database outage,
retention/partition, or Supabase Broadcast benchmark was run in this local
environment. The capability therefore remains `LIVE_ENVIRONMENT_PENDING` and
must not be described as a production multi-instance guarantee until a staging
PostgreSQL target and controlled load harness produce sequence/replay,
authorization, latency, memory and recovery evidence.
