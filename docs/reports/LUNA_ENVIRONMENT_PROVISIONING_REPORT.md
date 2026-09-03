# StudentHub AI — Luna Environment Provisioning Report

Date: 2026-09-01  
Authority: Luna Max engineering/environment owner  
Scope: safe non-production enablement before live-assurance rerun  
Golden baseline: `docs/reports/LUNA_POST_ANTIGRAVITY_REGRESSION_REPORT.md`  
Baseline policy: preserved; not overwritten or reinterpreted

## 1. Final provisioning status

`ENVIRONMENT_PROVISIONING_PARTIAL_HUMAN_ACTION_REQUIRED`

Repository-side scaffolding and review artifacts are prepared. The external
StudentHub-owned staging project, disposable database target, test identities,
server secrets, live provider contracts, and current Trust v5 deployment still
require operator action. This is not a failed local implementation and is not a
claim of live readiness.

## 2. Environment inventory

The detailed inventory is in
`docs/reports/ENVIRONMENT_PROVISIONING_INVENTORY.md`. Key findings:

- local public Supabase configuration exists, but project ownership/reference
  is unverified;
- no safe database connection, service-role key, session pepper, provider
  credential, staging URL, or Vercel project linkage is available;
- Auth settings are reachable by a bounded read-only probe, while schema/RLS
  and storage behavior are not live-proven;
- Firefox and Lighthouse remain environment/tooling blockers and are deferred
  until a current staging target exists.

## 3. Supabase project status

Status: `PARTIAL` / `BLOCKED_BY_ENV`.

The local environment contains a Supabase URL and anon key without exposing
their values. The available evidence does not identify a project reference or
prove that the URL belongs to the independent StudentHub-owned project. A
bounded Auth settings request returned HTTP 200. An anonymous REST probe
returned HTTP 401 and a storage bucket probe returned an empty list; these are
useful boundary signals, not proof of the required project/schema/storage
configuration. No service-role credential was available and no remote write was
performed.

## 4. Database status

Status: `NOT_CONFIGURED`.

`DATABASE_URL` and `STUDENTHUB_RLS_TEST_DATABASE_URL` are not available in the
current process. Therefore the application cannot prove durable session,
Passport, or RLS behavior against PostgreSQL. No direct or pooler URL is
recorded here. The local Postgres pool remains fail-closed when no URL exists.

## 5. Migration status

The inspected migration set is:

1. `database/migrations/202608270001_v2_authority_foundation.sql` — profiles,
   roles, sessions, audit, community, Trust case/input/evidence/claim/source,
   and Expert foundations.
2. `database/migrations/202608290001_feature_freeze_cross_system.sql` —
   Evidence Passport/events and cross-system feature-freeze tables.
3. `database/migrations/202609010001_private_screenshot_storage.sql` —
   review-only private screenshot metadata/bucket/policies.

Status: local definitions `AVAILABLE`; remote applied revision
`BLOCKED_BY_ENV`. The third migration was not executed remotely. Its bucket
block deliberately raises if an existing bucket is public.

## 6. RLS implementation

Status: `PARTIAL` pending execution.

The existing migrations enable RLS for the authority tables and apply owner,
public-projection, role/service-only, and Passport ownership rules. The new
storage migration adds:

- private bucket `trust-screenshots-private`;
- owner-keyed object names;
- PNG/JPEG/WebP allowlist and 8 MiB limit;
- authenticated owner select/insert/delete object policies;
- owner-scoped metadata read and service-controlled metadata writes;
- no default Expert/Moderator storage bypass.

The complete intended matrix is in
`docs/security/STAGING_RLS_POLICY_MATRIX.md`. Public Expert/community behavior
is expected through redacted server projections where direct table access is
not granted. Remote enforcement remains unverified until the executable
harness passes.

## 7. RLS test harness

Status: `AVAILABLE` as code; execution `BLOCKED_BY_ENV`.

`frontend/tests/db/phase3_live_postgres_rls.test.mjs` now applies all three
local migrations to a disposable database, creates User A, User B, Expert,
Moderator, and Admin/service context, seeds Trust/Passport/community/Expert
records, tests positive and negative permissions, and cleans up its records and
users. It includes anonymous denial, owner isolation, role/service-only paths,
Passport history protection, and screenshot metadata boundary checks.

A passing static test is not treated as an RLS pass. The required disposable
database URL is still absent.

## 8. Test identities

Status: definitions `AVAILABLE`; accounts `NOT_CONFIGURED`.

`docs/staging/STAGING_IDENTITY_RUNBOOK.md` defines the deterministic identity
matrix and lifecycle. No passwords, tokens, or cookie state are committed. The
operator must create User A, User B, Expert, and Moderator in the approved
non-production Auth project, assign roles server-side, and retain only opaque
IDs in protected operator evidence. Admin/service remains a server-only
context, not a browser identity.

## 9. Auth/session configuration

Status: `PARTIAL`.

Public Supabase Auth configuration is present locally and its settings endpoint
was reachable. `STUDENTHUB_SESSION_PEPPER` is absent, so durable session
exchange cannot be live-enabled. The environment matrix now includes the
server-only `SUPABASE_SERVICE_ROLE_KEY` and pepper requirements without values.
After provisioning, staging must exercise sign-in, session exchange/restore,
expiry, logout, revocation, CSRF/origin controls, role scope, and cross-user
denial. Browser state alone is not authorization evidence.

## 10. Passport persistence

Status: `PARTIAL`.

The schema and repository support owner-bound Passport records and append-only
events/revisions. The local harness seeds multiple events and checks that an
authenticated client cannot arbitrarily update history. Anonymous Trust remains
non-persistent where canonical behavior says so. Restart persistence, actual
Supabase/Postgres writes, and cross-user denial still require the staging
database and identities.

## 11. Screenshot storage

Status: local design `AVAILABLE`; live state `NOT_CONFIGURED`.

`database/migrations/202609010001_private_screenshot_storage.sql` and
`docs/contracts/SCREENSHOT_STORAGE_CONTRACT.md` define a private bucket,
owner-scoped UUID object keys, allowed image MIME types, an 8 MiB limit,
service-controlled metadata, owner reads, controlled deletion, and no public
indexing. Expert/Moderator access is not granted by default. Signed/controlled
short-lived retrieval belongs to the server workflow and is not replaced with
public URLs. The migration is review-only and has not been applied remotely.

## 12. Layer 2 configuration

Status: `PARTIAL`.

The server-only `STUDENTHUB_LAYER2_BASE_URL` and bounded timeout are already
recognized by the adapter, but the value is blank. A previous bounded test via
an ephemeral override reached a reference endpoint and preserved a request ID
with sensitive query data redacted. That evidence does not make the provider a
configured staging dependency. The no-match semantic remains
`NO_KNOWN_THREAT`, never `SAFE`.

Staging must verify no-match, threat, unknown, timeout, rate limit, malformed
response, and unavailable behavior.

## 13. Layer 3 contract

Status: `PARTIAL` / `NOT_CONFIGURED`.

The current compatibility adapter can emit a bounded request and normalize
provider observations, but the previous live observation was
`PARTIAL`/`UNAVAILABLE` without evidence. No authoritative provider schema was
available. `docs/contracts/LAYER3_REQUIRED_CONTRACT.md` records the exact
current request shape, accepted normalized fields, required provider answers,
and the acceptance boundary without inventing a provider response. A versioned
provider schema, staging endpoint, credentials, controlled fixtures, and
success/failure contract tests are still required.

## 14. Layer 4 contract drift resolution

Status: `PARTIAL`; fail-closed behavior retained.

The bounded reference call returned HTTP 400 with a problem+json content type.
The raw provider body is intentionally not stored in this report. The current
adapter normalizes the result to an unavailable/error boundary and does not
pretend to have a verdict or evidence. `docs/contracts/LAYER4_CONTRACT_GAP.md`
records the current request, safe response metadata, missing provider-owner
inputs, and the proposed anti-corruption mapping. No adapter mapping was
guessed or weakened.

## 15. Provider environment

Status: `NOT_CONFIGURED` for live credentials; `PARTIAL` for separation.

Layer 2 has a distinct server-only configuration. The current legacy adapter
keeps Layer 3 and Layer 4 as separate endpoint paths under one server-only
legacy base URL. Separate provider origins, credentials, authentication
headers, model fields, or enum mappings are not invented until authoritative
provider documentation/code is supplied. No provider secret is present in
client variables or this report.

## 16. Staging target

Status: `NOT_CONFIGURED`.

`STUDENTHUB_STAGING_BASE_URL` is blank. The previously inspected public preview
is stale/preview evidence and returned the old `trust.v1` API shape; it is not
accepted as current Trust v5 staging. A deployment manifest must be created
only after an approved current deployment exists, with URL, SHA, branch, build
ID, timestamp, and environment name.

## 17. Vercel status

Status: `BLOCKED_BY_ENV` / `HUMAN_AUTHORIZATION_REQUIRED`.

The local repository is not Vercel-linked (`.vercel/project.json` is absent),
and the CLI has no usable authenticated control plane. No link, environment
variable write, deployment, promotion, or rollback was attempted. An owner
must identify the staging project/team and authorize the deployment workflow.

## 18. Environment variables

Status: matrix prepared.

`docs/staging/STAGING_ENVIRONMENT_MATRIX.md` separates public Supabase/runtime
identifiers from server-only database, service-role, session, provider,
storage, and AI credentials. The safe example file contains names and blank
values only. The server-only `SUPABASE_SERVICE_ROLE_KEY` requirement was added
without a value. No secret is printed, committed, or prefixed with
`NEXT_PUBLIC_`.

## 19. Staging fixture package

Status: `AVAILABLE` as a non-secret package.

`docs/staging/STAGING_CASES.example.json` and
`docs/staging/STAGING_CASES_SPEC.md` define deterministic benign, invalid,
suspicious, partial, insufficient-evidence, and operator-controlled failure
cases. The existing staging runner now requires the invalid case and rejects
invalid input before provider execution. Failure must be a real controlled
429/502/503/timeout in isolated staging, not a browser mock or uncontrolled
malicious URL.

## 20. Storage-state strategy

Status: `NOT_CONFIGURED`; procedure prepared.

The staging runner accepts `STUDENTHUB_STAGING_STORAGE_STATE` as an optional
absolute path. Once test identities exist, sign in through the current staging
UI, generate Playwright state outside Git, restrict file access, use a short
TTL, invalidate it on credential rotation, and delete it after the run. No
cookies or tokens are committed.

## 21. Security headers

Status: local coverage fix `AVAILABLE`; HTTPS deployment proof pending.

Security header application now covers the canonical landing, Trust,
Community, Expert, Cases, dashboard, account, auth, onboarding, legacy, and API
path families through the proxy matcher. The common header fabric includes
frame restriction, MIME sniffing protection, referrer policy, permissions
policy, and no-store behavior for health/error boundaries. HSTS remains an
HTTPS deployment concern and must be verified on current staging.

## 22. CSP

Status: local hardening `AVAILABLE`; provider-origin review pending.

The CSP now builds a narrow `connect-src` list from same-origin plus configured
public Supabase/API origins rather than allowing all HTTPS origins. The local
proxy applies the policy to canonical page families. Inline/script behavior
must be checked against the current Next.js deployment and any approved media
or provider origins. No provider origin is added merely because it is unknown.

## 23. Readiness route

Status: local boundary `AVAILABLE`; live dependencies `NOT_CONFIGURED`.

`GET /api/health/live` is an anonymous liveness route that returns `LIVE` and
does not inspect dependencies. `GET /api/health/ready` safely reports runtime,
database, Supabase Auth configuration, durable session configuration, optional
live-provider configuration, and optional screenshot-storage configuration.
It returns 200 only when required checks pass and 503 otherwise, with no-store
headers and no raw connection details. The readiness flags allow staging to
turn provider/storage requirements on only after those dependencies are truly
configured; readiness is not a substitute for RLS or provider contract tests.

## 24. Rate limiting

Status: local improvement `AVAILABLE`; distributed protection `NOT_PROVEN`.

429 security responses now include a bounded numeric `Retry-After` when the
typed error supplies a retry duration. Existing limiting is process-local, so
multi-instance/Vercel distribution, identity/IP strategy, and provider-cost
protection remain deployment concerns. No distributed guarantee is claimed.

## 25. Observability

Status: `PARTIAL`.

Existing request/correlation boundaries and safe error envelopes are preserved.
The operator evidence plan records request ID, route, result/state, provider
status/latency, database latency where available, rate-limit state, readiness,
and typed error code. It excludes screenshot bodies, raw message content, OTPs,
tokens, query secrets, API keys, and raw provider bodies. A staging log sink
and retention policy still require operator configuration.

## 26. Backup/restore preparation

Status: plan `AVAILABLE`; execution `HUMAN_AUTHORIZATION_REQUIRED`.

`docs/operations/BACKUP_RESTORE_REHEARSAL.md` defines a disposable-target
snapshot/restore rehearsal with controlled Trust/Passport/screenshot data,
checksums, relationship validation, append-only history validation, private
object access validation, and RLS rerun. No RPO/RTO numbers are repeated as
verified; they remain unknown until a real operator-run rehearsal records them.

## 27. Incident preparation

Status: checklist `AVAILABLE`.

`docs/operations/STAGING_INCIDENT_CHECKLIST.md` covers database/provider/Auth/
storage outages, credential exposure, and RLS misconfiguration. It preserves
`UNAVAILABLE`/`PARTIAL`/`ERROR`, stops promotion on privacy or authorization
failures, and explicitly forbids fake success or weakening negative tests.

## 28. Firefox plan

Status: `BLOCKED_BY_ENV`, intentionally non-blocking for this phase.

The local Windows Firefox process cannot spawn. Firefox assurance is deferred to
a supported CI Linux runner or another approved environment after current
staging exists. The local limitation does not justify altering the golden
baseline.

## 29. Lighthouse plan

Status: `BLOCKED_BY_ENV`, intentionally not run.

The Lighthouse tool is not available locally, and the stale preview is not a
valid Trust v5 target. After current staging exists, run lab checks for `/`,
`/trust`, `/community`, and `/expert`, recording URL, SHA, build, device,
network profile, and metrics.

## 30. GPU/device plan

Status: `BLOCKED_BY_ENV`, intentionally deferred.

Exact GPU/device telemetry is lower priority than provisioning the database,
identities, storage, providers, and staging target. Run the device/performance
gate only against the current deployment after the core environment is proven.

## 31. Files changed

Phase-owned source/config/test changes:

- `frontend/src/lib/security/hardening/SecurityHeaders.js`
- `frontend/src/proxy.js`
- `frontend/src/lib/security/SecurityFabric.js`
- `frontend/src/lib/server/health/readiness.js`
- `frontend/src/app/api/health/live/route.js`
- `frontend/src/app/api/health/ready/route.js`
- `frontend/.env.local.example`
- `database/migrations/202609010001_private_screenshot_storage.sql`
- `frontend/tests/db/phase3_live_postgres_rls.test.mjs`
- `frontend/tests/db/feature_freeze_cross_system_migration.test.mjs`
- `frontend/tests/security/security_fabric_integration.test.mjs`
- `frontend/tests/platform/canonical_api_runtime.test.mjs`
- `frontend/tests/staging/cases.ts`
- `frontend/tests/staging/trust.staging.spec.ts`
- `frontend/tests/staging/README.md`

Phase-owned contracts/runbooks/reports:

- `docs/contracts/LAYER3_REQUIRED_CONTRACT.md`
- `docs/contracts/LAYER4_CONTRACT_GAP.md`
- `docs/contracts/SCREENSHOT_STORAGE_CONTRACT.md`
- `docs/staging/STAGING_CASES.example.json`
- `docs/staging/STAGING_CASES_SPEC.md`
- `docs/staging/STAGING_ENVIRONMENT_MATRIX.md`
- `docs/staging/STAGING_IDENTITY_RUNBOOK.md`
- `docs/security/STAGING_RLS_POLICY_MATRIX.md`
- `docs/operations/BACKUP_RESTORE_REHEARSAL.md`
- `docs/operations/STAGING_INCIDENT_CHECKLIST.md`
- `docs/reports/ENVIRONMENT_PROVISIONING_INVENTORY.md`
- `docs/reports/LUNA_ENVIRONMENT_PROVISIONING_REPORT.md`

The repository was already dirty with unrelated/prior phase work. No reset,
checkout, commit, push, remote migration, secret write, or deployment was
performed.

## 32. Commands run

The following bounded checks were run or prepared without printing secret
values:

- repository/env/tooling inventory and safe file/hash checks — completed;
- bounded Supabase Auth/REST/Storage probes — completed; no remote writes;
- Vercel CLI availability/auth/linkage inspection — no usable authenticated
  project control plane;
- `npx tsc --noEmit --pretty false` from `frontend` — passed with 0 errors;
- focused security, canonical runtime, and migration contract tests — 16/16
  passed;
- legacy four-layer adapter and orchestrator tests — 23/23 passed;
- changed-file ESLint — passed with 0 errors;
- production build — passed; TypeScript completed with 0 errors and Next.js
  generated 119/119 static pages. The two-page increase over the 117/117
  golden-build count is the intentional addition of the required live/ready
  health boundaries, not a product-route expansion;
- executable RLS harness — skipped with the explicit
  `STUDENTHUB_RLS_TEST_DATABASE_URL` environment blocker;
- staging E2E — stopped with the explicit missing
  `STUDENTHUB_STAGING_BASE_URL` and `STUDENTHUB_STAGING_CASES_PATH` blocker;
- `git diff --check` — no whitespace errors; Git emitted only existing
  line-ending normalization warnings;
- golden report SHA-256 — unchanged at
  `97770E16D180D6963733627D6FAA9D7CBA4AC64435730C32B55284D546A59169`.

The immutable golden report remains unchanged. The complete 55-section live
assurance suite was intentionally not rerun while the environment was
obviously incomplete.

## 33. Human actions required

1. Confirm the independent StudentHub-owned disposable Supabase project
   reference and ownership.
2. Provide a disposable database/direct or pooler URL and authorize migration
   inspection/application.
3. Generate and store a per-environment session pepper and, if needed, a
   service-role key in the approved server secret store.
4. Create User A, User B, Expert, and Moderator staging identities and assign
   roles through the approved server/operator path.
5. Review/apply the private screenshot migration and execute the RLS/storage
   harness against the disposable target.
6. Supply authoritative Layer 3/Layer 4 provider schemas, staging endpoint(s),
   credentials, and controlled fixtures; keep fail-closed behavior until then.
7. Identify and authorize one current Trust v5 Vercel staging project,
   configure its environment matrix, and deploy the current SHA.
8. Generate secure Playwright storage state and set the staging fixture path.

## 34. Remaining blockers

- No verified StudentHub-owned Supabase project reference.
- No disposable database connection or executable RLS evidence.
- No service-role key or session pepper.
- No staging Auth identities or storage state.
- Private screenshot migration has not been applied or live-tested.
- Layer 2 endpoint is not configured; Layer 3 contract is unavailable; Layer
  4 request drift is unresolved.
- No approved current Trust v5 staging URL/deployment manifest.
- No Vercel linkage/authenticated project control plane.
- Local Firefox and Lighthouse tooling remain unavailable.

## 35. Readiness for live assurance rerun

Status: `NOT_READY`.

Do not run `LIVE_ASSURANCE_RERUN_AFTER_ENVIRONMENT_PROVISIONING` yet. The
required order is database and migrations, test identities/session secret, RLS
execution, private storage, provider contracts/fixtures, current Trust v5
staging deployment, storage state, then the blocked live gates. Once those
artifacts exist, compare every result independently against the golden baseline
and classify any degradation as `POST_INTEGRATION_REGRESSION`.
