# StudentHubAI Release Checklist

Release candidate: current local `develop` worktree
Freeze rule: no feature additions after this checklist begins
Commit/push: intentionally not performed

## Local gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Feature freeze preserved | PASS | No new product scope added during audit; changes are hardening, tests, docs, or release metadata |
| Discovered regression suite | PASS | `npm run test:all-discovered` — 250/250 files |
| Final audit hardening tests | PASS | `npm run test:final-audit` — 6/6 |
| Security regression/attack/session/firewall/fabric | PASS | `npm run test:security` — 7/7, 10/10, 9/9, 3/3, 8/8 |
| Auth phase 2 | PASS | `npm run test:phase2-auth` — 9/9 |
| RLS migration contract | PASS | `npm run test:phase3-contract` — 5/5 |
| Typecheck | PASS | `npx tsc --noEmit` from `frontend/` |
| Production build | PASS | `npm run build`; 115/115 routes generated |
| Lint | PASS WITH WARNINGS | exit 0; 359 legacy warnings, 0 errors |
| Dependency audit | PASS | `npm audit --audit-level=high` and production-only audit report 0 vulnerabilities |
| Bundle budget | PASS | `npm run audit:bundle`; core route budgets under 500,000 bytes |
| API authorization inventory | PASS | `npm run audit:api-auth`; 135 handlers, 0 unprotected mutations requiring P0 review |
| Secret scan | PASS | High-confidence scan of tracked/pending text files: no keys, tokens, service-role JWTs, DB credentials, private keys, or hard-coded bearer tokens |
| Accidental artifact review | PASS | `.codex-temp` and `.github/skills` moved to recovery; approved AI Drive, CI, docs, source, and visual test snapshots retained |
| Diff whitespace | PASS | `git diff --check` |

## Browser and visual gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Chromium functional/a11y/responsive/visual | PASS | 51 passed, 3 explicit demo skips in 54-test project run |
| Explicit Demo Mode Trust fixtures | PASS | `NEXT_PUBLIC_COMPETITION_DEMO=true npx playwright test tests/e2e/trust-demo.spec.ts --project=chromium` — 3/3 |
| WebKit functional/a11y/responsive | PASS | 48 passed, 3 explicit demo skips in 51-test non-visual run |
| Mobile Chromium navigation/responsive | PASS | 13/13 |
| Visual baselines | PASS | current frozen shell baselines refreshed after stale-dimension review; visual target 3/3 |
| Firefox | BLOCKED_BY_ENV | Playwright Firefox launch fails Windows `spawn UNKNOWN`/side-by-side runtime |

## External gates

| Gate | Status | Required next proof |
| --- | --- | --- |
| Live PostgreSQL/Supabase migration and RLS | BLOCKED_BY_ENV | Provide disposable `STUDENTHUB_RLS_TEST_DATABASE_URL`; run `npm run test:phase3-live` |
| Staging deployment and E2E | BLOCKED_BY_ENV | Provide `STUDENTHUB_STAGING_BASE_URL` and `STUDENTHUB_STAGING_CASES_PATH`; run `cd frontend; npm run test:e2e:staging` |
| Live AI/search/OCR/provider health and cost | BLOCKED_BY_PROVIDER | Provide fresh approved secrets/terms and run provider-specific live suites |
| Rollback/backup rehearsal | BLOCKED_BY_ENV | Execute `docs/ROLLBACK-REHEARSAL.md` against the deployment target with an approved disposable snapshot |

## Sign-off rule

The local release gate is complete when all PASS rows remain reproducible and the external rows are attached to an owner and environment. Do not relabel an external blocker as PASS. The current recommendation is `STUDENTHUBAI RC READY WITH EXTERNAL LIMITATIONS`; production certification waits for the external proof above.
