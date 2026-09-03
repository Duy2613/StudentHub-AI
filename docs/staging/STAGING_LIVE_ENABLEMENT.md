# Staging and Live Enablement Gates

Status: `BLOCKED_BY_SECURITY_AND_ENVIRONMENT`

This is the operator gate for enabling live dependencies. Repository work may
continue, but no staging/live mutation is implied by this document.

## Required external prerequisites

1. Revoke/rotate the exposed friend-backend database credential and verify the
   old value no longer authenticates.
2. Provide an approved non-production StudentHub Supabase project, identity,
   private screenshot bucket, backup point, and RLS test target.
3. Provide server-only staging secrets for database/session/provider use after
   ownership, terms, and data-classification review.
4. Provide a staging URL, exact Git SHA/build ID, branch, database environment,
   contract versions, and operator-owned case matrix.
5. Authorize migrations, test-user creation, storage tests, deployment, and
   backup/restore rehearsal separately.

See `docs/staging/STAGING_ENVIRONMENT_MATRIX.md` and
`docs/reports/HUMAN_ACTION_REQUIRED.md` for the exact owner actions.

## Enablement order

```text
credential containment
  -> clean staging identity/configuration
  -> canonical migration checksum review
  -> RLS/auth/session/storage matrix
  -> provider failure matrix
  -> Trust end-to-end staging case
  -> browser/accessibility/performance gates
  -> backup/restore + rollback rehearsal
  -> live assurance rerun
  -> final RC closure
```

## Mandatory staging identities

Anonymous, User A, User B, scoped Expert, scoped Moderator, and Admin/service
contexts must be tested. Every positive permission test has a negative
counterpart. Browser hiding is not authorization proof.

## Mandatory Trust flow

`input -> canonical API -> L1 -> L2 -> L3 -> optional L4 -> normalization -> deterministic policy -> TrustGraph -> Passport`.

Exercise success, partial, provider unavailable, timeout, 400, 401/403, 429,
500/503, malformed response, expired auth, database outage, storage outage, and
AI outage. Every result must expose an honest typed state and request ID with
no fabricated evidence.

## Current gate result

Local contract, adapter, gateway, provenance, budget, and deterministic policy
tests are available. Live Auth/RLS/private storage/provider/deployment/backup
evidence is not present in this workspace. Therefore staging and live
enablement remain blocked and no live readiness claim is made.

