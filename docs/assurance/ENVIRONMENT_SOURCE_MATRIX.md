# StudentHub Owner Promax — Environment Source Matrix

Captured during the Luna environment-safety closure on 2026-09-04. This
matrix records source names and target metadata only; it contains no secrets,
passwords, tokens, or connection strings.

| Execution context | Environment source | DB target | Supabase target | May mutate DB | Production allowed | Guard present | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `npm test` / `npm run test:all-discovered` | Inherited process environment only; `scripts/run-discovered-tests.mjs` no longer loads `.env.local` | None: DB and provider variables are scrubbed from child tests | None in child tests | No | No | Pure-runner scrub plus `PostgresPool` guard | SAFE / offline |
| `npm run test:quality` | `lint`, `build`, then the pure discovered runner | None for discovered tests; build has no DB command | Next may read framework env files during build, but no DB operation is invoked | No observed build mutation | No CI production secret dependency | Pure-runner scrub; pool guard if a route unexpectedly requests a pool | SAFE / offline |
| `npm run test:phase3-live` | Explicit operator-provided `frontend/.env.staging.local`, loaded only by `scripts/run-live-staging-tests.mjs` | Staging pooler metadata resolves to `bniwtkjtramqaozrrtrk` | Exact staging project `bniwtkjtramqaozrrtrk` | Yes, controlled fixture rows are created and cleaned | No | Env-file requirement, opt-in, ref comparison before child process, direct RLS-file guard, TLS verification | PASS: live staging DB gate 5/5 |
| `npm run test:e2e:staging` | Explicit process environment consumed by `run-staging-e2e.mjs` and `playwright.staging.config.ts` | No local DB is required by the browser contract | Remote staging base URL; live app target must be operator-proven | Remote suite may mutate only where its cases require it | No | Required base URL/case file; local DB pool guard protects accidental local calls | BLOCKED until operator case file and target are supplied |
| `next dev` | Next.js framework `.env*` loading, including ignored `frontend/.env.local` | No local run is authorized with the production-bound file | Do not run against production ref | Potentially, through app routes or browser Supabase calls | No | Use the explicit staging file and target guard for local verification | DO NOT RUN with `.env.local`; use proven staging config |
| `next build` | Next.js framework `.env*` loading; CI has no ignored local secret file | No DB-aware command is part of the build | No live Supabase operation is part of the build | No | No CI production secret dependency | Pool guard applies if build-time code unexpectedly opens a pool | PASS baseline; live target not claimed |
| GitHub Actions `competition-quality` | Repository files plus CI-provided non-secret defaults; no staging secret environment | None | None | No | No | Pure runner removes live variables; workflow has no production secret reference | SAFE / offline |
| `node scripts/assert-staging-environment.mjs` | Caller-supplied process environment; never loads an env file | Optional, metadata-only parse | Exact staging ref required when run | No | No | Fail-closed metadata guard | PASS for staging; synthetic production rejected |

## Classification decisions

- `frontend/.env.local` is **PRODUCTION-BOUND LOCAL CONFIG** because its
  Supabase URL resolves to `kytdomflmjytzyaabogi` and it contains server-only
  database/service-role/session material. It remains ignored and untouched.
- `frontend/.env.staging.local` is ignored by the existing `.env.*.local`
  rule. It is operator-provided staging configuration; its values are never
  printed, committed, or copied into tracked files.
- `frontend/.vercel/.env.preview.local` contains preview metadata and a
  Render-compatible backend URL, not approved staging Supabase/database
  credentials. It is not a staging test source.
- A pure test is never made live merely because `DATABASE_URL` exists in the
  parent shell. Live execution requires an explicit staging env file and
  `STUDENTHUB_LIVE_STAGING_TESTS=1`.
- `DATABASE_SSL_CA` is parsed privately and must reconstruct one PEM
  certificate; `DATABASE_SSL_REJECT_UNAUTHORIZED=true` remains required.
