# StudentHub Owner Promax — Luna Forensic Baseline

Captured: 2026-09-04 (Asia/Bangkok)

This is a pre-application-edit snapshot for the owner hardening branch. Secret
values are intentionally omitted. Counts and gate results below are evidence
from this checkout, not claims about production or staging.

## Repository safety

| Field | Evidence |
| --- | --- |
| Repository | `Duy2613/StudentHub-AI` (`origin` is `https://github.com/Duy2613/StudentHub-AI.git`) |
| Base branch | `integration/citadel-staging-preflight` |
| Base SHA | `3084f9fa4fc188a7421fb0db03686d6d2749f791` |
| Luna branch | `luna/studenthub-owner-final-staging-hardening` |
| Branch lineage | Created locally from the fetched `origin/integration/citadel-staging-preflight` at the base SHA |
| Initial working tree | Clean before baseline commands |
| Main modified | No |
| Production modified | No |

`git fetch origin` completed before branch creation. No reset, merge, push, or
production operation was performed.

## Surface inventory

- Next.js App Router build output: 122 generated routes (the baseline
  `npm run build` output reported `122/122` static-page generation).
- API handler files: 116 `frontend/src/app/api/**/route.js` handlers, plus the
  dynamic `/api/[...path]` handler included in that count.
- Page and route source: `frontend/src/app`.
- Current primary product surfaces: `/trust`, `/community`, `/expert`, with
  `/dashboard`, `/settings`, landing, auth, onboarding, and Case Lab as
  supporting surfaces.

## Trust Engine modules

The canonical trust implementation is under `frontend/src/lib/ai-trust`:

- L1 deterministic screening: `layer1/` and `Layer1ScreenService.js`.
- L2 semantic/claim analysis: `layer2/`.
- L2A reputation boundary: `layer2a/`.
- L3 evidence/provenance: `layer3/` and `evidence/MasterEvidenceGraph.js`.
- L4 deterministic policy: `layer4/`.
- L5 downgrade-only assurance and cross-layer orchestration: `v5/`,
  `TrustOrchestrator.js`, and `v5/TrustPipelineOrchestrator.js`.
- Durable product projections: `integrations/canonicalTrustProjection.js`.

## Authentication and session modules

- Browser auth boundary: `frontend/src/lib/auth/AuthContext.jsx` and
  `frontend/src/lib/auth/authService.js`.
- Security gateway: `frontend/src/lib/security/SecurityFabric.js`.
- Identity and token verification: `security/identity/IdentityResolver.js`,
  `OidcTokenVerifier.js`, `TokenValidator.js`, and
  `SessionExchangeService.js`.
- Durable session lifecycle: `DurableSessionService.js`,
  `PostgresSessionRepository.js`, and `SessionManager.js`.
- Authorization: `security/authorization/{AuthorizationEngine,RBACPolicy,ABACPolicy,ReBACPolicy}.js`.
- Request hardening: `security/hardening/{CsrfGuard,RateLimiter,SafeRemoteUrl,SecurityHeaders}.js`.

## Database adapters and migrations

Database/runtime adapters currently include:

- `PostgresPool.js`
- `CommunityRepository.js`
- `DurableTrustRepository.js`
- `ExpertRepository.js`
- `TrustPersistenceService.js`
- `TrustGraphService.js`
- `outbox/SecurityOutboxRepository.js`
- `outbox/SecurityOutboxWorker.js`

Migration inventory at baseline:

1. `202608270001_v2_authority_foundation.sql`
2. `202608290001_feature_freeze_cross_system.sql`
3. `202609010001_private_screenshot_storage.sql`
4. `202609040001_security_outbox.sql`
5. `202609040002_security_outbox_hardening.sql`

No migration history was rewritten.

## Tests and local gates

- Discovered test runner: 299 `*.test.mjs` files.
- Approximate assertion/test declaration inventory: 1,280 matches from the
  source scan; this is an inventory signal, not a pass count.
- `npm run lint`: PASS, 0 errors and 352 warnings.
- `npm run build`: PASS, Next.js 16.3.0, TypeScript completed, and static page
  generation completed `122/122`.
- `npm test`: FAIL at the staging auth-bootstrap contract file after earlier
  discovered tests passed. Four auth-bootstrap scenarios returned HTTP 500
  because the local runtime attempted PostgreSQL writes with synthetic/nonexistent
  UUID fixtures (`profiles_id_fkey` / invalid UUID). This is retained as a
  baseline finding; it was not converted into a pass.

The baseline build temporarily rewrote the generated `frontend/next-env.d.ts`
references from `.next/types` to `.next/dev/types`; that generated-only change
was restored before this baseline artifact was created.

## Environment variable names observed in source

`BASE_URL`, `CAPABILITY_SECRET`, `CI`, `CITADEL_ASSURANCE_URL`,
`CITADEL_INGESTION_URL`, `CITADEL_WORKLOAD_TOKEN`, `DATA_ADAPTER_MODE`,
`DATA_MODE`, `DATABASE_POOL_MAX`, `DATABASE_SSL`, `DATABASE_SSL_CA`,
`DATABASE_SSL_REJECT_UNAUTHORIZED`, `DATABASE_URL`, `DEBUG_SECURITY`,
`JWT_AUDIENCE`, `JWT_ISSUER`, `JWT_SECRET`, `LEGACY_VERIFICATION_BASE_URL`,
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_COMPETITION_DEMO`,
`NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NODE_ENV`, `NODE_OPTIONS`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`,
`STUDENTHUB_ALLOW_LEGACY_SESSIONS`, `STUDENTHUB_ALLOWED_ORIGINS`,
`STUDENTHUB_BACKEND_URL`, `STUDENTHUB_LEGACY_VERIFICATION_BASE_URL`,
`STUDENTHUB_PERSISTENCE_ADAPTER`, `STUDENTHUB_READINESS_REQUIRE_LIVE_PROVIDERS`,
`STUDENTHUB_READINESS_REQUIRE_SCREENSHOT_STORAGE`,
`STUDENTHUB_RLS_TEST_DATABASE_URL`, `STUDENTHUB_SCREENSHOT_STORAGE_BUCKET`,
`STUDENTHUB_SESSION_PEPPER`, `STUDENTHUB_STAGING_BASE_URL`,
`STUDENTHUB_STAGING_CASES_PATH`, `STUDENTHUB_STAGING_STORAGE_STATE`,
`SUPABASE_JWT_AUDIENCE`, `SUPABASE_SERVICE_ROLE_KEY`,
`TRUST_ENGINE_PRIVATE_TARGET`, `TRUST_ENGINE_PUBLIC_TARGET`,
`TRUST_ENGINE_SENSITIVE_TARGET`, `TRUST_ENGINE_TEST_EVIDENCE_URL`,
`TRUST_ENGINE_TEST_HOST`, `TRUST_ENGINE_TEST_TARGET`,
`TRUST_INITIAL_JS_BUDGET_BYTES`.

The shell environment did not expose values for the key staging/runtime
variables during this capture. No values or secrets are recorded here.

## CI and staging context

- Current CI workflow: `.github/workflows/competition-quality.yml`.
- The workflow runs install, lint, production build, discovered tests, security
  tests, API inventory, bundle budget, dependency audit, and Chromium/Firefox
  Case Lab gates.
- Owner brief reports the canonical staging project as
  `StudentHub-AI-Staging` (`bniwtkjtramqaozrrtrk`) and a Vercel Preview
  lineage from `integration/citadel-staging-preflight`. This workspace has no
  staging runtime credentials, deployment URL, or approved live identity
  fixtures, so those claims remain `BLOCKED_BY_ENV` until independently checked.
- Reported live blocker at capture: onboarding/profile completion returns the
  generic Vietnamese 403 message `Bạn không có quyền thực hiện thao tác này`.
- Initial code trace indicates durable-session principals do not carry the
  verified email needed by the current profile and institutional-email routes;
  exact route-level repair and regression proof are the next work item.

## Baseline disposition

This file is the evidence boundary for subsequent changes. Local correctness,
CI behavior, live staging behavior, and production isolation must be reported
separately in the final assurance report.

## Post-hard-stop continuation

The operator later supplied the ignored `frontend/.env.staging.local` with the
canonical staging configuration and corrected only `DATABASE_SSL_CA` to a
single value containing literal backslash-n escapes. The certificate body is not
recorded in this vault.

The exact TLS unblock sequence passed without exposing credentials:

- metadata guard: PASS for Supabase project `bniwtkjtramqaozrrtrk`;
- synthetic production-target rejection: PASS, refused before connection;
- CA parse: PASS, one X.509 certificate reconstructed as PEM;
- `DATABASE_SSL_REJECT_UNAUTHORIZED`: `true`;
- safe staging pooler TLS handshake: PASS, hostname verification enabled,
  TLS 1.3, no query beyond the handshake probe;
- live staging database gate: PASS, all five selected checks passed.

The subsequent live authority/onboarding gate also passed its controlled
profile, verification, ownership, private-storage, and health checks. Remote
CI and browser evidence remain separate final-report items.
