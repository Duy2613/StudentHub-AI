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
