# StudentHub Owner Promax — Staging Test Safety

## Non-negotiable target

All live local verification in this repository must target Supabase project
`bniwtkjtramqaozrrtrk` only. Production project `kytdomflmjytzyaabogi` is
never a valid staging target. The guard compares the public Supabase project
ref and the PostgreSQL URL metadata before a database client is created.

## State transition matrix

| State | Trigger | System response | Boundary/error path |
| --- | --- | --- | --- |
| Pure offline | `npm test`, CI, or discovered runner without live opt-in | Remove DB/Supabase/service-role/session/provider variables from child env; run contract tests only | Live gates see no DB URL and skip; no env file is loaded |
| Live requested | `STUDENTHUB_LIVE_STAGING_TESTS=1` | Require `STUDENTHUB_STAGING_ENV_FILE`; load only that file; inspect targets | Missing file/credentials returns `STAGING_LOCAL_SECRETS_REQUIRED` |
| Target inspection | Explicit staging file is loaded | Parse Supabase host and DB host/user/query metadata without connecting | Production or unknown ref exits nonzero before child process/pool creation |
| Staging proven | Exact Supabase and DB refs match; CA parses as PEM; rejectUnauthorized is true | Allow the explicitly requested live suite | Fixture writes remain controlled and must have cleanup/assertion evidence |
| Any mismatch | Production ref, unknown DB ref, malformed URL, or missing opt-in | Refuse the command | `REFUSING_PRODUCTION_DATABASE_IN_STAGING_TEST` or a specific fail-closed guard code |

## Forbidden patterns

- Do not load `frontend/.env.local` for tests; it is classified as
  production-bound local configuration.
- Do not set `DATABASE_URL` or `STUDENTHUB_RLS_TEST_DATABASE_URL` to a URL that
  cannot expose the staging project ref.
- Do not use `NODE_ENV=test` as the only safety control.
- Do not put service-role keys, session peppers, storage state, or passwords in
  tracked files, issue comments, logs, or test reports.
- Do not run schema migrations or fixture cleanup against production.

## Guard entry points

- `scripts/run-discovered-tests.mjs` is offline by default.
- `scripts/run-live-staging-tests.mjs` is the only supported local live-test
  launcher.
- `frontend/src/lib/server/database/PostgresPool.js` refuses non-production
  pool creation unless local/staging metadata proves the approved target.
- `frontend/tests/db/phase3_live_postgres_rls.test.mjs` repeats the guard for
  direct invocation.

## Current unblock evidence

The operator-provided staging env file is ignored and was not printed. The
metadata guard and synthetic production rejection passed. The CA privately
reconstructed one PEM certificate, `DATABASE_SSL_REJECT_UNAUTHORIZED` remained
`true`, and the safe staging pooler TLS handshake passed with hostname
verification enabled. The canonical live staging DB gate passed `5/5`; the
onboarding authority/storage/health gate passed its controlled assertions.
