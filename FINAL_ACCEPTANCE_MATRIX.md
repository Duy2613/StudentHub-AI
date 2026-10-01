# Final Acceptance Matrix

Candidate base: `af1953147ee5b89ea9d58acdfa67c7f1416ae469` on `codex/studenthub-final-unified-20260930`. Final candidate SHA is recorded after commit in `RELEASE_SHA_MANIFEST.md`.

| Area | Result | Evidence / boundary |
|---|---|---|
| Build | PASS | Isolated production webpack build completed; 139 static pages generated. |
| TypeScript | PASS | `npx tsc --noEmit` passed before isolated E2E; generated config-only changes were discarded. |
| Lint | PASS with inherited warning | 0 errors on changed files; one known R3F `useFrame` camera mutation warning in `RobinPayotRoadCanvas.jsx`. |
| Hermetic suite | PASS with explicit gates | 383/389 discovered files; 1,479 tests: 1,443 pass, 0 fail, 36 skipped. Six files are separately classified below. |
| Targeted Trust tests | PASS | Relation safety and retrieval relevance tests; G8 produced 20/20 truthful outcomes (10 source candidates, 10 explicit insufficient-evidence outcomes). |
| AI challenge evaluation | PASS | N=200; 100% accuracy and macro F1, zero false reassurance, Brier 0.0051, ECE 0.0690, 100% citation validity. Evaluation is hermetic, not live provider assurance. |
| Three-core browser suite | PASS | Isolated copied frontend; 100 passed, 2 intentional screenshot-matrix skips, 0 failed across Chromium/Firefox/WebKit (102 total; 24.3 minutes). |
| Responsive matrix | PARTIAL | Current Omni, Trust, and Expert checks cover 360/390/768/1024/1280/1440/1920 across browser projects, with theme/a11y variants. Community screenshot matrix covers 390/768/1440. Full 9-surface × 7-width matrix is not proven on final SHA. |
| Staging database / RLS | BLOCKED | No verifiable credential rotation and old-password invalidation proof after prior staging DB credential exposure. No staging DB connection attempted in this continuation. |
| Expert V5 live readonly | BLOCKED | Requires verified staging identity and database connectivity; not run while rotation evidence is absent. |
| Retrieval holdouts | FAIL target gates | V3/V4/V5 executed with Tavily disabled; see release report for metrics. Test harness exits normally but thresholds are not met. |
| Public live retrieval golden flow | PASS with honest limited result | Public Wikipedia retrieval returned candidates; claim-specific relation remained unknown and final result was `INSUFFICIENT_EVIDENCE`. This does not close provider-quality gates. |
| Tavily | BLOCKED, OFF | `NON_TAVILY_IMPLEMENTATION_READY=NO`; planned/attempted/successful/failed/cache hits all 0. |
| Production promotion | NOT READY | No main push, deployment, or production canary. Critical acceptance is not PASS. |
| Secret scan | PARTIAL | Candidate source, explicit staged diff, and isolated client bundle scans pass. Old staging password rotation/invalidation is still unverified. |

## Six formerly external-gated test files

| File | Executed | Result |
|---|---:|---|
| `frontend/tests/evidence/fresh_retrieval_holdout_v3.test.mjs` | Yes | Metrics computed; V3 release targets not established. |
| `frontend/tests/evidence/fresh_retrieval_holdout_v4.test.mjs` | Yes | Metrics computed; V4 release targets not established. |
| `frontend/tests/evidence/fresh_retrieval_holdout_v5_public_api.test.mjs` | Yes | Metrics computed; V5 release targets not established. |
| `frontend/tests/evidence/live_web_retrieval.test.mjs` | Yes | 4/4 passed after discovery-only contract correction; includes real public search and SSRF safety checks. |
| `frontend/tests/evidence/real_world_live_search_golden_flow.test.mjs` | Yes | 3/3 passed; returned honest insufficient-evidence verdict. |
| `frontend/tests/expert/expert_v5_live_readonly.test.mjs` | No | Unsafe until staging DB credential rotation/invalidation and project identity are independently verified. |

`SILENTLY_IGNORED=0` for the 208 route/file inventory rows. This is not an exhaustive control-level UI inventory; see `ACTIVE_FEATURE_INVENTORY.md`.

## 2026-10-01 Trust reference unification continuation

| Area | Result | Evidence / boundary |
|---|---|---|
| Trust structure | PASS | Four visible backend-driven layers `l1/l2/l3/l4` plus separately published deterministic Final Predict. Preserves canonical `OwnBackendTrustOrchestrator` and the user's four reference commits; no second persistence/runtime pipeline. |
| Trust UI defects found and fixed | PASS | Five-stage/waiting-state mismatch; compact composer; unproven `LIVE` provider badge; upload submit before file select; light-panel text contrast. Covered by targeted contracts and screenshots. |
| Targeted Trust | PASS | 28/28 contracts, changed-file ESLint, isolated Trust Playwright 9/9, production build and TypeScript pass. |
| Full three-core browsers | PASS | 100 passed, 2 intentional screenshot-only skips, 0 failed/flaky across Chromium/Firefox/WebKit; 33.1 minutes. Rebuilt isolated production candidate, fixture-only. 239 feature screenshots; artifacts external to checkout. |
| Package unit/domain suite | PASS | `npm run test:all` exited 0 with Tavily mode OFF and call budget 0. |
| Expert V4/V5, DB guards, Trust/Omni/Community targeted set | PASS | 86/86 Node tests from the correct repository root. |
| Security contracts | PASS | 30/30; full ESLint `--quiet` 0 errors; 91 client bundles had none of 16 server-only identifiers. No configured secret values were present in the isolated worktree for value comparison. |
| Live identities, persistence, Realtime, providers | BLOCKED / NOT RUN | No demo auth, staging role/scope or persistence readback, live RLS, multi-client Realtime, retrieval holdout rerun, or final provider gate in this continuation. Existing release report records the known staging and retrieval blockers. |
| Production readiness | PARTIAL | 22 active tables and 6 columns absent in production; backup/PITR UNKNOWN. No production DDL, Main promotion, deployment or canary. Tavily remains OFF, budget 0. |

Current whole-product verdict remains `STUDENTHUB_PRODUCTION_RELEASE_PARTIAL`; the local UI and contract tests do not close live database, persona, retrieval, or recovery gates.
