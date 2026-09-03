# Provider Rollback Runbook

Status: `PROCEDURE_READY_NOT_REHEARSED`

This runbook is for a capability cutover. It does not authorize deployment,
secret changes, remote migration, or production mutation.

## Preconditions

- Record release SHA, deployment/build ID, active selection flags, provider
  health, and current contract versions.
- Confirm the target is disposable staging or an explicitly approved rollback
  window.
- Confirm the previous provider and its secret/configuration remain available
  without exposing them to the browser or logs.
- Snapshot operational configuration and ensure Passport/provenance writes are
  append-oriented.

## Rollback sequence

1. Stop the affected native cutover or mark the capability unavailable if its
   behavior is unsafe.
2. Set the affected server-side flag to `legacy` (or `auto` only when the
   intended legacy fallback is confirmed).
3. Restart/reload the target runtime through the approved deployment control
   plane; do not mutate production from this repository.
4. Run the provider matrix: success, no-match/unknown, timeout, 400, 401/403,
   429, 500/503, malformed, cancellation, and circuit/bulkhead behavior.
5. Verify deterministic Trust policy, evidence observations, TrustGraph, and
   Passport history. A rollback must not create duplicate events or upgrade an
   unavailable provider to a positive result.
6. Compare privacy/data location, latency, retry count, and relative cost.
7. Record actual logs and request IDs, then decide whether the native flag may
   be re-enabled in shadow only.

## Failure rules

- Unknown/malformed provider output fails closed.
- Provider failure is `UNAVAILABLE`/`PARTIAL`, never demo data.
- `NO_KNOWN_THREAT` is not `VERIFIED_SAFE`.
- Do not route sensitive data to an unapproved fallback provider.
- Do not delete Passport history, provenance, or source observations to make a
  rollback appear clean.

## Current rehearsal result

Repository-level adapter/gateway tests cover simulated failure and rollback
selection. A staging deployment/rollback rehearsal is `BLOCKED_BY_ENV` because
no approved disposable deployment, database, storage, or operator case matrix
is configured. See `docs/ROLLBACK-REHEARSAL.md`.

