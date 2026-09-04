# STUDENTHUB OWNER PROMAX — ENVIRONMENT SAFETY + FINAL LUNA REPORT

Audit date: 2026-09-04 (Asia/Bangkok)

## Scope and safety

- Branch: `luna/studenthub-owner-final-staging-hardening`.
- Base SHA: `3084f9fa4fc188a7421fb0db03686d6d2749f791`.
- `frontend/.env.local` remains production-bound and untouched.
- `frontend/.env.staging.local` is ignored, operator-provided, and was never
  printed, committed, or copied. No URL, password, service key, session
  pepper, or certificate body is recorded here.
- No production connection, migration rerun, Citadel change, main merge,
  branch reset, discard, or production deployment was performed.

## Exact TLS unblock sequence

The operator corrected only `DATABASE_SSL_CA` in the staging env file to one
value containing literal backslash-n escapes. The required sequence then passed:

1. Environment metadata guard: PASS; Supabase ref
   `bniwtkjtramqaozrrtrk`.
2. Synthetic production-target rejection: PASS; refused before connection.
3. CA validation: PASS; reconstructed one X.509 certificate as PEM with the
   required begin/end markers. The body was not printed.
4. `DATABASE_SSL_REJECT_UNAUTHORIZED`: `true`.
5. Safe staging PostgreSQL TLS probe: PASS; pooler transaction mode, port
   `6543`, TLS 1.3, hostname verification enabled, TLS authorized, no write.
6. Live target confirmation: staging ref remained
   `bniwtkjtramqaozrrtrk`.

## Live staging evidence

- Canonical live staging DB gate: PASS, `5/5` selected checks.
- Controlled onboarding authority gate: PASS, including server-owned profile
  fields, verified-education boundary, anonymous denial, cross-user denial,
  role assignment from the database, and exact cleanup.
- Private screenshot storage gate: PASS for owner access and foreign/anonymous
  denial.
- Health live gate: PASS for `/api/health/live` and `/api/health/ready`.
- Controlled live phase gates recorded as passing: phases 2, 3, 5, 6, 7, and 8.
- No blind migration was run. The additive profile-onboarding migration was
  applied once in staging inside a guarded transaction and then exercised by
  the live gate.

## Onboarding 403 repair

The repaired root cause was the durable-session identity contract: it carried
roles and subject identity but not the verified email state needed by the
profile and education-verification routes after reload.

The repair now:

- hydrates verified email state from the authoritative auth user record;
- derives role and authority from the server-side durable session and RBAC;
- permits only own-profile reads/writes through the profile route;
- restricts profile persistence to safe presentation/onboarding fields;
- rejects or ignores browser-supplied role, trust, expert, owner, and
  verification authority fields;
- keeps signup metadata and browser profile state non-authoritative;
- removes the canonical browser dependency on the legacy backend sync path,
  avoiding one-time-proof replay during session exchange;
- preserves the explicit legacy compatibility routes without a hardcoded
  external backend fallback.

The live profile, education-verification, ownership, storage, and health
assertions passed after the repair.

## Local quality evidence

- Pure discovered suite: PASS, `289/289` test files.
- Production build: PASS; Next.js 16.3.0, `122/122` static pages.
- Full lint: PASS, `0` errors and `353` warnings. Targeted changed-file lint:
  `0` errors and `10` warnings; these are existing React/style warnings.
- Production dependency audit: PASS, `0` vulnerabilities reported.
- API authorization inventory: PASS, `143` handlers; `0` unprotected mutations
  requiring P0 review.
- Environment safety contracts and synthetic production rejection: PASS.

## Production impact audit

The historical pre-hardening runner implicitly loaded the production-bound
local environment and reached the auth-sync database path with synthetic
fixtures. Its captured failures establish attempted access, but no authorized
read-only production audit exists to prove final persisted state or exhaustively
account for every old-runner process.

Required verdict: `PRODUCTION_IMPACT_INCONCLUSIVE`.

The hardened pure runner now scrubs database, Supabase, service-role, session,
and provider variables. The live launcher loads only the explicit staging file,
checks both Supabase and database metadata, and fails closed before connection
creation on production or unknown targets.

## Remaining evidence boundary

- Remote GitHub Actions has not yet completed; the quality workflow now also
  triggers for `luna/**` so the pushed branch can receive the same gate.
- Staging browser E2E, Axe/accessibility, performance, and observability proof
  remain pending because no approved staging case file/deployment evidence was
  supplied for those surfaces.
- No production deployment or promotion is authorized by this report.

## Final verdict

`STUDENTHUB_OWNER_PROMAX_STAGING_PARTIAL`
