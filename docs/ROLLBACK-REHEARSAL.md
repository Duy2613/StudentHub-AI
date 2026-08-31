# StudentHubAI Rollback Rehearsal Record

Status: **BLOCKED_BY_ENV** — the final Vercel previews are deployed and smoke-verified, but no disposable staging database, operator case matrix, backup/snapshot, or safe deployment control plane is available in this workspace. This is a documented procedure, not a claimed rollback rehearsal.

## A. Application rollback

| Step | Command/action | Expected result | Actual result |
| --- | --- | --- | --- |
| 1 | Capture current deployment ID and previous known-good ID | Both immutable IDs recorded | Vercel preview IDs are visible in PR checks; BLOCKED for a controlled staging rollback target |
| 2 | Deploy the RC artifact in production-build mode to staging | Staging health endpoint and core routes return 200 | Public Vercel preview smoke PASS; official staging run BLOCKED: `STUDENTHUB_STAGING_CASES_PATH` unset |
| 3 | Run the staging smoke suite | landing, login, Trust, Community, Expert, Academic, Dashboard, Passport, Decision Twin, and three cases pass | Not run |
| 4 | Roll back to the previous deployment ID | Previous route assets and health checks recover | Not run |
| 5 | Verify cookies, API paths, logs, and 404/500 rates | No stale asset/session or route regression | Not run |

## B. Database migration rollback/forward-fix

The current migrations are additive foundation migrations. Do not run a destructive rollback against production. In a disposable staging database:

1. Snapshot schema/data and record migration version.
2. Apply the RC migrations and run the live RLS/ownership matrix.
3. For a failed additive change, use a reviewed forward-fix migration that restores the prior contract while preserving data.
4. Validate anonymous, owner, non-owner, Expert, moderator, and admin paths again.
5. Retain the snapshot and SQL output with the release artifact.

Actual result: **BLOCKED_BY_DATABASE_ENV**. `npm run test:phase3-live` reports that `STUDENTHUB_RLS_TEST_DATABASE_URL` is required.

## C. Provider rollback

For each provider enabled for competition, disable the provider flag or remove its secret in staging, then run the deterministic/degraded contract path. Expected behavior is a typed unavailable/partial state, no fabricated evidence, and no automatic `SAFE` verdict. Actual live rehearsal: **BLOCKED_BY_PROVIDER**; no approved provider secrets/terms are configured.

## D. Frontend rollback

Keep the previous known-good deployment artifact and visual baseline available. After application rollback, verify the canonical routes, reduced-motion behavior, responsive breakpoints, and asset cache invalidation. Actual rehearsal: **BLOCKED_BY_ENV** because no staging deployment target is configured.

## Release rule

Attach timestamps, deployment IDs, commands, logs, and expected/actual outcomes after the rehearsal is run against non-production infrastructure. Until then, the release gate remains blocked and must not be relabeled PASS.
