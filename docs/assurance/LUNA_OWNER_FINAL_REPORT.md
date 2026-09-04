# STUDENTHUB OWNER PROMAX — ENVIRONMENT SAFETY + FINAL LUNA REPORT

Audit date: 2026-09-04 (Asia/Bangkok)

## Scope and safety

- Branch: `luna/studenthub-owner-final-staging-hardening`.
- Base SHA: `3084f9fa4fc188a7421fb0db03686d6d2749f791`.
- Application hardening commit: `143a9827c295b702ea701750602fe86c27e3aef3`.
- `frontend/.env.local` remains production-bound and untouched.
- `frontend/.env.staging.local` is ignored, operator-provided, and was never
  printed, committed, or copied. No URL, password, service key, session
  pepper, or certificate body is recorded here.
- No production connection, migration rerun, Citadel change, main merge,
  branch reset, discard, or production deployment was performed.

## Current-head closure evidence

- Current branch HEAD: `5ced206aadd2b7f8f5c53dee1e3f260e48b1639b`.
- Current-head GitHub Actions Competition Quality Gate: PASS, run
  `33880306784`, for the exact HEAD SHA above.
- Vercel Preview deployment: READY at the platform level for the exact branch
  and SHA; deployment `dpl_33SVhjjCKMN13JtzDTBZWsW3bpqD`, URL
  `student-hub-ai-weje-gi4wxuoei-vi-be-city.vercel.app`.
- Current Preview `/api/health/live`: HTTP 200, `LIVE`.
- Current Preview `/api/health/ready`: HTTP 503, `NOT_READY`; database and
  durable-session checks report `NOT_CONFIGURED`.
- Redacted Preview/Production Vercel env metadata contains only
  `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `NEXT_PUBLIC_SUPABASE_URL`; no database or durable-session configuration is
  present. The served CSP advertises noncanonical Supabase ref
  `yeoxxbmufgbsikytr` and the legacy Render host.
- Result: current Preview identity and readiness are `BLOCKED_BY_ENV`.
  Authenticated browser onboarding, trust, cross-user, storage, admin, mobile,
  Axe, performance, and browser-observability closure were not attempted after
  this failed environment gate.

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
- Local/live staging health gate: PASS for `/api/health/live` and
  `/api/health/ready` under the guarded staging launcher. The separate current
  Vercel Preview readiness result is recorded above as `BLOCKED_BY_ENV`.
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
- Remote GitHub Actions Competition Quality Gate: PASS for the current exact
  HEAD `5ced206a` (run `33880306784`), including lint, build, regression,
  security/API, dependency, bundle, and Chromium/Firefox browser checks. The
  application-hardening ancestor `143a9827` also passed run `33879663048`.

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

## Evidence status and remaining boundary

- `VERIFIED_LOCAL`: guarded staging TLS, live DB/onboarding gates, pure suite,
  build, lint, audit, and authorization inventory.
- `VERIFIED_CI`: current exact-head GitHub Actions quality gate run
  `33880306784`.
- `VERIFIED_STAGING`: canonical staging DB and controlled live phase gates.
- `BLOCKED_BY_ENV`: current Vercel Preview identity/readiness and all dependent
  authenticated browser, trust, cross-user, storage, admin, mobile, Axe,
  performance, CSP/console, and runtime-observability evidence.
- `HISTORICAL_INCONCLUSIVE`: production impact remains unresolved as described
  below; no production deployment or promotion is authorized by this report.
- The quality workflow now also triggers for `luna/**` so future Luna commits
  receive the same gate.

## Final verdict

`STUDENTHUB_OWNER_PROMAX_STAGING_PARTIAL`
