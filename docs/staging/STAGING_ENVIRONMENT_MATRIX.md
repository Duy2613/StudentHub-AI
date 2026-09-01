# StudentHub AI — Staging Environment Variable Matrix

This is the operator-facing variable contract for one disposable, non-production
StudentHub AI staging environment. Values are intentionally omitted. Populate
the target secret store only after the project, deployment, and provider owners
are confirmed.

## Public runtime variables

| Variable | Required | Current repository state | Staging handling |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Present in the local file; value not printed | Use only the approved StudentHub-owned project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Present in the local file; value not printed | Use the approved project's anon key; safe for browser exposure, subject to RLS |
| `NEXT_PUBLIC_API_URL` | Yes for explicit API origin | Present in the local file; value not printed | Point to the current staging frontend/API topology |
| `NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE` | Yes | Example defaults to `LIVE` | Keep `LIVE`; do not silently fall back to demo data |
| `NEXT_PUBLIC_COMPETITION_DEMO` | No | Example defaults to `false` | Keep `false` for assurance |

No provider credential, database URL, session pepper, service-role key, cookie,
or raw storage URL belongs in a `NEXT_PUBLIC_*` variable.

## Server-only variables

| Variable | Required | Current repository state | Staging handling |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes for durable state | Not configured in the current process | Use the approved staging Postgres direct or pooler URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for service-controlled writes and migration operations | Not configured in the current process | Store only in the server secret store; never ship to the client |
| `STUDENTHUB_SESSION_PEPPER` | Yes for durable session exchange | Not configured | Generate a separate cryptographically random value of at least 32 characters |
| `SUPABASE_JWT_AUDIENCE` | Yes when verifying Supabase JWTs | Example defaults to `authenticated` | Confirm against the approved project |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Environment-dependent | Example defaults to `true` | Keep certificate verification enabled unless the database owner documents an exception |
| `STUDENTHUB_LAYER2_BASE_URL` | Yes when Layer 2 live assurance is enabled | Blank | Provide the approved Layer 2 endpoint origin |
| `STUDENTHUB_LAYER2_TIMEOUT_MS` | No | Example defaults to `4000` | Keep within the adapter's bounded range |
| `STUDENTHUB_LEGACY_VERIFICATION_BASE_URL` | Yes for the current Layer 3/4 compatibility adapter | Blank | Provide only after the owner supplies the current contract and staging endpoint |
| `STUDENTHUB_LEGACY_VERIFICATION_TIMEOUT_MS` | No | Example defaults to `8000` | Keep within the adapter's bounded range |
| `STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS` | No | Example defaults to `true` | Keep enabled unless the network owner documents why not |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | Provider-specific | Blank | Add only when the approved AI Gateway contract requires them |
| `OPENAI_BASE_URL` | Provider-specific | Blank | Add only for an approved server-side gateway origin |
| `STUDENTHUB_SCREENSHOT_STORAGE_BUCKET` | Yes when screenshot storage is enabled | Example defaults to `trust-screenshots-private` | Must match the private bucket migration |
| `STUDENTHUB_READINESS_REQUIRE_LIVE_PROVIDERS` | Staging gate | Example defaults to `false` | Set `true` only after Layer 2/3/4 are contract-verified |
| `STUDENTHUB_READINESS_REQUIRE_SCREENSHOT_STORAGE` | Staging gate | Example defaults to `false` | Set `true` only after the private bucket and access tests pass |

Layer 2 has its own base URL. The current legacy compatibility adapter keeps
Layer 3 and Layer 4 as distinct endpoint paths under one server-only legacy
base (`/api/verify/layer3` and `/api/verify/layer4`). Separate origins are not
invented until the provider owner supplies that contract.

## Test-only variables

| Variable | Purpose | Handling |
| --- | --- | --- |
| `STUDENTHUB_RLS_TEST_DATABASE_URL` | Disposable PostgreSQL target for executable RLS tests | Never point at production; do not commit |
| `STUDENTHUB_STAGING_BASE_URL` | Current Trust v5 staging origin | Do not use the stale preview URL |
| `STUDENTHUB_STAGING_CASES_PATH` | Local/CI path to non-secret staging cases | Generated or controlled artifact; no credentials |
| `STUDENTHUB_STAGING_STORAGE_STATE` | Optional Playwright auth state | Generated, ignored, access-restricted, and deleted after its TTL |

## Provisioning rule

An unset variable is an honest unavailable/not-configured state. It must not
trigger demo data, guessed provider responses, or a false readiness result.
