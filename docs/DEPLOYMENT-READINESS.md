# Deployment Readiness

Status: blocked pending environment proof

## Required before production

- Apply both database migrations to a disposable staging database first.
- Run `npm run test:phase3-live` with `STUDENTHUB_RLS_TEST_DATABASE_URL` pointed only at that disposable database.
- Configure `DATABASE_URL`, `STUDENTHUB_SESSION_PEPPER`, Supabase issuer/audience, and approved provider secrets in server-only storage.
- Run staging browser/API tests with `STUDENTHUB_STAGING_BASE_URL` and authenticated storage state.
- Verify session exchange, idle expiry, revoke-all, server restart, Passport append conflict, notification material-change dedupe, and rollback.
- Confirm demo mode is explicitly selected for rehearsal and disabled by default for production.

## Rollback boundary

- Do not apply migrations directly to production without a backup and a tested staging restore.
- The feature-freeze migration only adds new tables/policies; application rollback can stop routing to `/api/v1/passports` and `/api/v1/decisions` without deleting evidence history.
- Never drop Passport or Decision tables during an application rollback. Preserve append-only history for later reconciliation.

## Current blockers

- Dedicated live RLS database is not configured.
- Staging base URL and authenticated storage state are not configured.
- Live provider keys/approved accounts are not available in this workspace.
