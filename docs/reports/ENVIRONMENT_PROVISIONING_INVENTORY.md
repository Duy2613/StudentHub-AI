# StudentHub AI — Environment Provisioning Inventory

Date: 2026-09-01  
Scope: minimum safe non-production enablement for Trust v5 and the four-layer
compatibility boundary  
Mutation policy: no remote migration, secret write, Vercel link, deployment, or
production action was performed

## Classification key

- `AVAILABLE`: verified in the current local environment or by a bounded
  read-only probe.
- `PARTIAL`: some evidence exists, but the complete runtime capability is not
  proven.
- `NOT_CONFIGURED`: the repository supports the capability, but required values
  or target setup are absent.
- `BLOCKED_BY_ENV`: the check cannot execute because the required environment or
  tool is absent.
- `HUMAN_AUTHORIZATION_REQUIRED`: the next step mutates an external target or
  requires an operator-owned secret/credential.

No secret values, cookies, raw provider bodies, database URLs, or API keys are
included in this inventory.

## Repository and baseline

| Capability | Status | Evidence | Next action |
| --- | --- | --- | --- |
| Current local Trust v5 code | `AVAILABLE` | Existing local source, contracts, adapters, and route tests are present | Preserve the current semantic baseline |
| Golden baseline report | `AVAILABLE` | `docs/reports/LUNA_POST_ANTIGRAVITY_REGRESSION_REPORT.md` exists and remains unchanged | Compare post-integration results against it |
| Current local baseline integrity | `AVAILABLE` | Golden report records 267/267 discovered tests, TS 0, build 117/117, browser gates, Axe 0 serious/critical, and bundle sizes | Do not lower those gates |
| Product scope | `AVAILABLE` | Core pillars remain Trust, Community, Expert; Cases is supporting | Do not resurrect removed or POST_V1 scope |

## Supabase and database

| Capability | Status | Evidence | Next action |
| --- | --- | --- | --- |
| Supabase project reference | `NOT_CONFIGURED` | No project reference is available in the local environment | Owner supplies the StudentHub-owned non-production project reference |
| Supabase project ownership | `BLOCKED_BY_ENV` | The local public URL is present but ownership/identity cannot be verified from the available tooling | Confirm independent StudentHub ownership before any write |
| Supabase project URL | `PARTIAL` | `NEXT_PUBLIC_SUPABASE_URL` is present locally; value intentionally not printed | Confirm it belongs to the approved staging project |
| Supabase anon key | `PARTIAL` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` is present locally; value intentionally not printed | Confirm it matches the approved project and store it as public runtime config |
| Supabase service-role key | `NOT_CONFIGURED` | No process value is configured | Operator adds it only to the server secret store if required |
| Auth endpoint | `AVAILABLE` | Bounded read-only `/auth/v1/settings` probe returned HTTP 200 | Recheck against the approved project after staging exists |
| PostgREST authorization boundary | `PARTIAL` | Anonymous REST root probe returned HTTP 401, which shows auth is enforced but not schema correctness | Execute authenticated positive/negative tests against disposable staging |
| Storage endpoint | `PARTIAL` | Bounded storage bucket probe returned HTTP 200 with no buckets; this does not prove the required private bucket | Apply and verify the review migration on approved staging |
| Direct database URL | `NOT_CONFIGURED` | `DATABASE_URL` is absent from the current process/local configuration | Supply a staging direct or pooler URL through secrets |
| Pooler URL | `NOT_CONFIGURED` | No database connection string is available | Supply only for disposable staging |
| PostgreSQL client tooling | `BLOCKED_BY_ENV` | `psql`, `pg_dump`, and `pg_restore` are not available | Use approved repository/CI tooling or operator-managed client tooling |
| Supabase CLI | `BLOCKED_BY_ENV` | `supabase` command is not available; no global install was attempted | Operator chooses a safe, approved CLI path |

## Migrations and RLS

| Capability | Status | Evidence | Next action |
| --- | --- | --- | --- |
| Authority foundation migration | `AVAILABLE` | `database/migrations/202608270001_v2_authority_foundation.sql` is present | Apply only to approved disposable staging after authorization |
| Cross-system/Passport migration | `AVAILABLE` | `database/migrations/202608290001_feature_freeze_cross_system.sql` is present | Verify applied revision remotely |
| Private screenshot migration | `AVAILABLE` | Review-only `database/migrations/202609010001_private_screenshot_storage.sql` is prepared | Review and apply remotely only with explicit approval |
| Remote migration state | `BLOCKED_BY_ENV` | No safe database connection or migration tool is configured | Obtain target and authorization, then inspect before applying |
| RLS policy matrix | `AVAILABLE` | `docs/security/STAGING_RLS_POLICY_MATRIX.md` records intended boundaries | Validate with executable tests, not static inspection alone |
| Executable RLS harness | `PARTIAL` | `frontend/tests/db/phase3_live_postgres_rls.test.mjs` now covers five identities, anonymous access, ownership, roles, Passport, community, and storage metadata | Set `STUDENTHUB_RLS_TEST_DATABASE_URL` to a disposable target and execute |
| RLS execution evidence | `BLOCKED_BY_ENV` | Required disposable database URL is absent | Do not treat SQL presence as a passing RLS result |

## Auth, sessions, and storage

| Capability | Status | Evidence | Next action |
| --- | --- | --- | --- |
| Test identity definitions | `AVAILABLE` | `docs/staging/STAGING_IDENTITY_RUNBOOK.md` defines Anonymous, User A/B, Expert, Moderator, and service context | Create identities in the approved staging project |
| Test identity accounts | `NOT_CONFIGURED` | No non-production accounts or opaque IDs are available locally | Operator creates accounts without committing passwords |
| Session pepper | `NOT_CONFIGURED` | `STUDENTHUB_SESSION_PEPPER` is absent | Generate per-environment random secret of at least 32 characters in secret storage |
| Durable session exchange | `PARTIAL` | Code and schema boundary exist; live database and pepper are absent | Run sign-in, exchange, restore, expiry, logout, revoke, and cross-user tests |
| Passport persistence | `PARTIAL` | Migration, repository, and append/history tests exist locally | Verify restart persistence and owner isolation on staging |
| Private screenshot storage design | `AVAILABLE` | Migration and `docs/contracts/SCREENSHOT_STORAGE_CONTRACT.md` define private bucket, MIME/size limits, owner keys, metadata, and deletion | Apply after owner review and execute access tests |
| Private screenshot storage live state | `NOT_CONFIGURED` | Safe probe found no buckets; required private bucket is not proven | Create/verify bucket and policies on disposable staging |

## Provider environment and contracts

| Capability | Status | Evidence | Next action |
| --- | --- | --- | --- |
| Layer 2 endpoint configuration | `NOT_CONFIGURED` | `STUDENTHUB_LAYER2_BASE_URL` is blank; one prior bounded ephemeral override worked | Add server-only staging endpoint and execute no-match/threat/unknown/unavailable cases |
| Layer 2 credential | `NOT_CONFIGURED` | No provider credential is available | Obtain provider-owned staging credential if required |
| Layer 2 semantic contract | `PARTIAL` | Adapter and local tests preserve `NO_KNOWN_THREAT` rather than `SAFE` | Confirm provider response schema and failure matrix |
| Layer 3 endpoint | `NOT_CONFIGURED` | Current legacy base is blank; prior live observation was `PARTIAL`/`UNAVAILABLE` without evidence | Supply authoritative endpoint and contract |
| Layer 3 contract | `PARTIAL` | `docs/contracts/LAYER3_REQUIRED_CONTRACT.md` defines the minimum required schema without fabricating behavior | Provider owner supplies versioned request/response schema and fixtures |
| Layer 4 endpoint | `NOT_CONFIGURED` | Current legacy base is blank; prior bounded reference response was HTTP 400 problem JSON | Obtain authoritative request fields, auth, enums, and envelope |
| Layer 4 drift resolution | `PARTIAL` | `docs/contracts/LAYER4_CONTRACT_GAP.md` records the observed failure and preserves fail-closed normalization | Align only through the anti-corruption adapter after contract evidence arrives |
| Provider credentials | `NOT_CONFIGURED` | No server-side provider keys are configured | Add only to approved staging secret storage |

## Deployment and staging

| Capability | Status | Evidence | Next action |
| --- | --- | --- | --- |
| Vercel project linkage | `NOT_CONFIGURED` | `.vercel/project.json` is absent | Human links the repository to the approved staging project |
| Vercel authentication | `BLOCKED_BY_ENV` | Local `vercel` CLI is present but no usable authenticated control plane is available | Human authenticates with the intended team/project |
| Vercel deployment | `HUMAN_AUTHORIZATION_REQUIRED` | No deployment was attempted | Owner authorizes and identifies one current Trust v5 staging target |
| Staging URL | `NOT_CONFIGURED` | `STUDENTHUB_STAGING_BASE_URL` is blank | Supply current staging origin, not the stale preview |
| Staging metadata | `NOT_CONFIGURED` | No current SHA/build/deployment timestamp record exists | Create `STAGING_DEPLOYMENT_MANIFEST.md` only after deployment exists |
| Staging fixture package | `AVAILABLE` | `docs/staging/STAGING_CASES.example.json` and `STAGING_CASES_SPEC.md` are present | Copy into controlled staging/CI location and set the path |
| Playwright storage state | `NOT_CONFIGURED` | No staging users or state file exists | Generate after sign-in; keep ignored and short-lived |

## Test tooling and assurance gates

| Capability | Status | Evidence | Next action |
| --- | --- | --- | --- |
| Node/Playwright | `AVAILABLE` | Node and frontend Playwright are installed | Use current repository scripts |
| Chromium | `AVAILABLE` | Golden baseline passed Chromium gate | Re-run against current staging only after provisioning |
| WebKit | `AVAILABLE` | Golden baseline executed and passed WebKit cases | Re-run against current staging after target exists |
| Mobile Chromium | `AVAILABLE` | Golden baseline passed mobile cases | Re-run against current staging after target exists |
| Firefox | `BLOCKED_BY_ENV` | Local Firefox binary cannot spawn on this Windows host | Run in CI Linux or another supported environment |
| Lighthouse | `BLOCKED_BY_ENV` | `lighthouse` is not available; stale preview is not a valid target | Run against current Trust v5 staging only |
| GPU/device telemetry | `BLOCKED_BY_ENV` | No current staging/device target | Defer until staging and performance gate are available |
| Broad regression rerun | `NOT_CONFIGURED` | Intentionally not rerun during provisioning | Rerun only after database, identities, storage, providers, and staging exist |

## External action gates

| Action | Classification | Reason |
| --- | --- | --- |
| Apply migrations to Supabase | `HUMAN_AUTHORIZATION_REQUIRED` | Remote schema mutation |
| Create Auth identities/roles | `HUMAN_AUTHORIZATION_REQUIRED` | External account and authorization mutation |
| Create private storage bucket/policies | `HUMAN_AUTHORIZATION_REQUIRED` | Remote storage/policy mutation |
| Add server secrets | `HUMAN_AUTHORIZATION_REQUIRED` | Secret-store mutation |
| Link/deploy Vercel staging | `HUMAN_AUTHORIZATION_REQUIRED` | External deployment and environment mutation |
| Run restore rehearsal | `HUMAN_AUTHORIZATION_REQUIRED` | External infrastructure/data mutation |

## Inventory conclusion

The repository-side provisioning package is prepared, but the required
StudentHub-owned non-production project, database connection, identities,
server secrets, live providers, and current staging deployment are not
available. The correct phase classification is
`ENVIRONMENT_PROVISIONING_PARTIAL_HUMAN_ACTION_REQUIRED`.
