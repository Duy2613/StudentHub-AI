# StudentHub AI × GovSec Citadel / Labbe
# Staging assurance closure pass

Date: 2026-09-06 (Asia/Bangkok)  
Scope: existing StudentHub → Labbe bridge and transactional outbox only  
Mutation policy: no commit, push, deployment, remote migration, production
egress, or automatic writeback

## Final verdict

`LABBE_STAGING_BLOCKED_BY_ENV`

The bridge is locally verified at `VERIFIED_SHADOW`. The real staging gate was
prepared but could not run because the current process has no
`STUDENTHUB_LABBE_BASE_URL`, `STUDENTHUB_LABBE_TOKEN`,
`STUDENTHUB_LABBE_SCOPE`, or `STUDENTHUB_LABBE_TEST_DATABASE_URL`. No remote
call or database write was attempted.

This is not a production-readiness claim.

## Mode and authority matrix

| Mode | Event/hash | Outbox | Network | Closure result |
| --- | --- | --- | --- | --- |
| `DISABLED` | not constructed | none | none | verified by contract test |
| `SHADOW` | constructed and hashed | persisted; lease exercise ends in `SHADOW` | none | verified |
| `STAGING` | constructed and hashed | persisted; `PENDING`/`FAILED`/`SHADOW` catch-up | real HTTPS only | blocked by environment |
| `CONTROLLED` | not enabled in this pass | none in this pass | none | explicit `CONTROLLED_DISABLED` |

Labbe remains observation-only: detect, correlate, and assure. The bridge has
no writeback path for Trust verdicts, Expert activation/revocation, Community
moderation, or user bans. `writeback` is fixed to `DISABLED`.

## Executed local evidence

| Evidence | Result |
| --- | ---: |
| `npm run test:labbe` | **19/19 pass** |
| Node canonical vector checks | **8/8 pass** |
| Python Labbe reference vector verifier | **8/8 pass** |
| Local bridge/outbox/authority closure checks | **10/10 pass** |
| Real staging gate | **5 skipped by explicit environment blocker** |
| `npm run build` | **pass** |
| Full `npm run lint` | **0 errors, 412 pre-existing warnings** |
| Targeted ESLint | **0 errors, 0 warnings** |
| `npm test` full discovered suite | stopped at an existing unrelated AuthContext contract failure in the already-dirty worktree |

The staging runner was also executed directly and returned the intended
blocker code (`2`):

```text
LABBE_STAGING_BLOCKED_BY_ENV: missing STUDENTHUB_LABBE_BASE_URL,
STUDENTHUB_LABBE_TOKEN, STUDENTHUB_LABBE_SCOPE,
STUDENTHUB_LABBE_TEST_DATABASE_URL; STUDENTHUB_LABBE_MODE must be exactly STAGING
```

## Canonical hash vectors

The shared vectors are in
[`labbe-canonical-json-vectors.json`](../integrations/labbe-canonical-json-vectors.json).
They cover null, booleans, Unicode Vietnamese, numbers including exponent
boundaries and negative zero, nested objects, arrays, and equivalent objects
with different key insertion order.

| Vector | SHA-256 |
| --- | --- |
| `null` | `74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b` |
| `booleans` | `b458395c03ca5e7da62530eed20b8acd9f36ab530bed7dec763ce79162f6ad0f` |
| `unicode-vietnamese` | `284f66e250cf22b46b530cc5979ce41e0b486bf7cac1831cc9589b82e12dbc26` |
| `numbers` | `d239d2bd735cd01ab95348a639deefec851a34bf4e1b650a02960481aa9cf937` |
| `nested-objects` | `f52b8ad8c1daffae20b80acc0fb14ae90e0d9d49f9e8a61bf787cd468564677c` |
| `arrays` | `ae9f3b0fe239c715e3b47420cf4c2ffc95381aeb49c1bbb0cf4d64a0d67274ee` |
| `different-key-order-a/b` | `0784831444382aa3a9fd79ebf1b04f2d32e9d136bf57b75973b737fef40bbcf4` |

StudentHub uses
[`CanonicalJson.js`](../../frontend/src/lib/server/integrations/CanonicalJson.js);
the dependency-free Python reference is
[`canonical_json.py`](../../scripts/labbe_reference/canonical_json.py).
Both hash the compact canonical bytes as UTF-8.

## Shadow event and outbox evidence

The following IDs are deterministic local closure fixtures, not production
events. Their payload hashes are the hashes stored/checked by the outbox
model.

| Fixture | Event ID | Payload hash |
| --- | --- | --- |
| `closure-shadow` | `sh-trust-c48849ac15afa7e748cbfdd648d86f541fb44783` | `607b324c58947b43146c7114b9d0a6e3fba476afcf15a084c6330b88f9b51511` |
| `closure-identity` | `sh-trust-da94928eacd2f7681cfae97bda43fe45ce2367a3` | `4fbf93acb0be837108474dd479a1f60cd752457418a178fa2c5f1307be1e91f6` |
| `closure-timeout` | `sh-trust-ed04095c89bbde81735c7fa2ce6f8745343b5c89` | `9f57e1ee784065f45fec6522d448cf76ccb40d54ff8636e771d3070d7037197a` |
| `closure-backoff` | `sh-trust-30bd4b58afce5c89c3ffe5a1d7c84c0300d97f9c` | `8800cf02b6823760c3366d2949fe324b9e5d8f71b2a98413af47a76bcc26ef6c` |
| `closure-conflict` | `sh-trust-ff246c5b8ee7b229d8deaffd850907488caebafe` | `5292b1aa62a9b75d1c842288f6def35836d39b48c36d1d76325f5e441c90f52a` |
| `closure-expired` | `sh-trust-48107bc0f476900f69395f1eff3b1db5db221b64` | `3259a12255a58a37454319ee23a7706cdb63a6150b00c090a650cd199f86ae98` |
| `closure-worker-a` | `sh-trust-21db80b2114eef0a88f3c3587cfe0040e7828dc0` | `d426461c3360036658cea5865c54650dca6832baaef6476216d881ef706d18f1` |
| `closure-worker-b` | `sh-trust-f4df026d3fc1d28459b020aa185a3932135f3cd1` | `098236fbc4dee6183ad50345f942138c2a2dd285a131fb2550fd8e67f03cd5ab` |

Observed local state transitions:

- Shadow fixture: `PENDING → IN_FLIGHT → SHADOW`, `attempts=0`,
  `lease_count=1`, `shadow_count=1`, and the fetch function was not called.
- Staging catch-up: `SHADOW → IN_FLIGHT → DELIVERED`.
- Timeout-after-receiver-commit: `PENDING → FAILED → DELIVERED`; the receiver
  business-effect count remained `1` after retrying the same event ID/hash.
- Same event ID and same hash: `DEDUPLICATED`.
- Same event ID and different hash: receiver `CONFLICT`; outbox `CONFLICT` is
  terminal and is not retried.
- Retry backoff: HTTP 503 produced `FAILED` with the bounded two-second first
  retry delay, then delivery succeeded.
- Expired/dead worker: an expired `IN_FLIGHT` row, including one at the maximum
  prior attempt count, was recoverable by a new worker.
- Multiple workers: `FOR UPDATE SKIP LOCKED` selected the two fixtures once;
  lease-token matching prevents a stale worker from completing a newer lease.

## Transactional outbox and crash/restart

The repository validates the minimal event and inserts it into
`private.integration_outbox` on the same database transaction as the Trust
case graph, before `COMMIT`; any invalid event/hash conflict reaches
`ROLLBACK`. Delivery begins only after commit. A restart therefore observes
the committed outbox row, while an interrupted transaction observes neither
the Trust write nor its integration event.

The local closure test checks the source transaction ordering and a crash-safe
transaction model. The executable PostgreSQL commit/restart proof is part of
the real staging gate and remains blocked without
`STUDENTHUB_LABBE_TEST_DATABASE_URL`.

## Transport and authorization evidence

Locally verified transport behavior:

- HTTPS is mandatory for `STAGING`; HTTP, URL userinfo, query, and fragment are
  rejected as not configured.
- Authorization is server-only `Bearer` workload token; the token is never in
  the event, report, or result object.
- Explicit `X-StudentHub-Workload-Scope` and
  `X-StudentHub-Classification` headers accompany the minimal body.
- Raw screenshot, OCR text, private evidence, provider token, session token,
  and credentials are rejected by the payload allowlist and are never sent.
- Wrong-token, wrong-scope, receiver-timeout, receiver-outage, TLS certificate,
  and real receiver classification behavior require the blocked staging target.

The read-only assurance projection requires `ADMIN.SECURITY` authorization and
uses a five-minute freshness window. It returns only `CURRENT`, `STALE`, or
`UNAVAILABLE` and cannot mutate or carry Trust verdict fields.

## Known blockers and next controlled action

The following evidence is still open and must not be inferred from local
tests:

1. Provide a non-production Labbe staging HTTPS origin, workload token, and
   explicit ingest scope.
2. Provide a disposable PostgreSQL target with the outbox migration applied.
3. Run `npm run test:labbe:staging` with
   `STUDENTHUB_LABBE_MODE=STAGING`; keep `CONTROLLED` disabled.
4. Provide approved timeout and outage probe endpoints to complete the two
   failure-injection tests.
5. Resolve the unrelated pre-existing full-suite AuthContext contract failure
   before using the complete repository suite as a release gate.

Until those steps produce evidence, retain
`LABBE_STAGING_BLOCKED_BY_ENV`. Never treat this report as production
readiness.
