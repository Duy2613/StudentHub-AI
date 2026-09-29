# Community V4 — Realtime Map

**State:** code-path review complete; live replay and cross-session behavior remain unverified without an approved database target.

## Event paths

| Commit source | Durable channel / event | Audience | Payload | Consumer behavior |
|---|---|---|---|---|
| Community contribution publish | `community:contribution` | Public | Contribution ID, revision/scope metadata, publication state; no statement or private case text | Feed refetches canonical posts/search result |
| Community comment | `community:comment` | Public | Contribution/comment/parent IDs and depth | Thread/feed refetches canonical comments and count |
| Community reaction | `community:reaction` | Public | Contribution ID, reaction kind/value, `trustMutation:false` | Feed refetches persisted reaction totals |
| Trust case execution/revision | `trust:revision` | Trust-authorized subject | Case ID/revision and run metadata | Community feed refetches freshness; Trust consumers reload their canonical case |
| Trust Expert request state | `trust:expert_review` | Trust-case owner | Request ID/status/count and scoped case/revision | Owner refreshes request state |
| Expert assignment | `expert:assignment` | Assigned reviewer | Assignment/request IDs, case/revision/domain and linked contribution ID | Reviewer refreshes the blind assignment queue |
| Expert assessment/revision | `expert:revision` | Trust owner and/or scoped reviewer | Assessment/request state metadata | Authorized Trust/Expert consumers refetch canonical state |

## Transport and recovery

- `/api/realtime/stream` allows anonymous sessions only on `system` and `community`; `trust`, `audit`, and `expert` require their authenticated scopes.
- Durable replay queries eligible events by increasing sequence, scoped channel and subject, and a replay cursor. The server polls the event log and sends SSE IDs; production fails closed when the durable adapter is unavailable.
- Community events have a null subject only because the public payload is metadata-only. Trust and Expert events remain subject-bound.
- The client remembers up to 1,000 event IDs, advances the reconnect cursor, and refetches canonical state rather than applying untrusted event payloads as feed data. Account changes clear private event state.
- Write endpoints use durable idempotency keys. Duplicate publish/comment/reaction requests do not create duplicate domain rows; duplicate realtime event IDs do not redispatch in the same client session.

## Correctness evidence and limits

The implementation path addresses duplicate events, ordered replay, reconnect cursor recovery, account changes, and multiple tabs by having each tab independently subscribe and converge through canonical refetch. API writes remain idempotent across tabs. It does not prove live database replay, retention-window recovery, actual multi-session scope enforcement, or simultaneous event races. Those checks require the correct isolated database and the migrations to be applied; none was identified or mutated in this run.
