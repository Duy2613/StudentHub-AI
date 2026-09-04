# StudentHub Owner Promax — Staging Runbook

This runbook is intentionally credential-free. The operator must obtain
staging-only values from the approved secret store or Supabase/Vercel staging
environment. Never copy from `frontend/.env.local`.

## Provision the local staging file

Create the ignored file `frontend/.env.staging.local` with these variable
names, using staging values only. The operator-provided file must keep
`DATABASE_SSL_REJECT_UNAUTHORIZED=true` and store `DATABASE_SSL_CA` as one
environment-variable value with literal backslash-n escapes. Never print the file or
the certificate body.

```text
NEXT_PUBLIC_SUPABASE_URL=https://bniwtkjtramqaozrrtrk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging publishable/anon key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<staging publishable key when used>
SUPABASE_SERVICE_ROLE_KEY=<staging service-role key>
DATABASE_URL=<staging PostgreSQL URL whose user/options expose bniwtkjtramqaozrrtrk>
STUDENTHUB_RLS_TEST_DATABASE_URL=<staging disposable RLS URL, if enabled>
STUDENTHUB_SESSION_PEPPER=<staging-only pepper, at least 32 characters>
SUPABASE_JWT_AUDIENCE=authenticated
DATABASE_SSL_REJECT_UNAUTHORIZED=true
DATABASE_SSL_CA=<complete staging CA PEM with literal backslash-n escapes>
STUDENTHUB_SCREENSHOT_STORAGE_BUCKET=trust-screenshots-private
STUDENTHUB_LIVE_STAGING_TESTS=1
```

The file must remain untracked:

```powershell
git check-ignore -v -- frontend/.env.staging.local
```

Expected result is a matching `.env.*.local` ignore rule. Do not paste the
file contents into the terminal output.

## Prove TLS, target, and run controlled live tests

From the repository root:

```powershell
npm run test:phase3-live
```

Before any live gate, run the metadata guard and the safe staging-only
PostgreSQL TLS probe. Confirm privately that the CA reconstructs a PEM
certificate beginning with `-----BEGIN CERTIFICATE-----` and ending with
`-----END CERTIFICATE-----`, and that reject-unauthorized remains enabled.
The probe may report hostname, port, pooler mode, TLS authorization, and the
staging ref, but must not print a URL, password, key, pepper, or CA body.

Current unblock evidence: staging ref `bniwtkjtramqaozrrtrk`, pooler port
`6543`, transaction-pooler mode, TLS 1.3, hostname verification enabled, and
the canonical live staging DB gate `5/5`.

The launcher fails closed with `STAGING_LOCAL_SECRETS_REQUIRED` when the file
is absent, and with `REFUSING_PRODUCTION_DATABASE_IN_STAGING_TEST` when any
configured Supabase/DB target resolves to production. It never falls back to
`.env.local`.

## Staging browser proof

Supply an operator-owned case file and, if needed, Playwright storage state via
the staging-only environment variables documented in
`frontend/tests/staging/README.md`, then run:

```powershell
cd frontend
npm run test:e2e:staging
```

Capture the deployment URL, project ref, test-user identity class, and cleanup
evidence—not credentials—in the assurance report.

## Stop conditions

Stop immediately and preserve logs without secrets if:

- a guard reports the production ref or an unknown DB ref;
- a credential is printed or appears in an artifact;
- a fixture is not synthetic or cleanup cannot be proven;
- a response shows another user's profile/session/trust data;
- staging credentials are unavailable.

When credentials are unavailable, report the exact status
`STAGING_LOCAL_SECRETS_REQUIRED` and do not substitute production. If TLS
fails, report only the safe TLS error code, host, port, connection mode, CA
PEM parse result, reject-unauthorized state, and staging ref.
