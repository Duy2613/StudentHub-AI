# StudentHub AI — Final Closure Report

**Decision: `STUDENTHUB_PRODUCTION_RELEASE_PARTIAL`**
**Promotion ready: NO**
**Tavily: OFF; no calls**
**Candidate:** `codex/studenthub-final-unified-20260930`, based on `af1953147ee5b89ea9d58acdfa67c7f1416ae469`
**Integration source/audit commit:** `11bfc70945113bbe0f8ac0f25b4ba9e7f02a4067` (pushed to `origin`; fast-forward)
**Run:** isolated browser run `2026-09-30T17-58-17-958Z-5428`

## Summary

The final source changes make Trust evidence relationships more conservative and topic-specific, keep discovery candidates unclassified until forensic assessment, prevent hermetic verification from reaching uncontrolled live search, and remove stale/fabricated onboarding carousel content. Tests and the isolated production build passed as recorded below. This is not production acceptance: broad retrieval quality targets failed, staging credential rotation is unverified, and live Expert V5/RLS/realtime/progression evidence is unavailable.

No staging or production database connection, write, account mutation, main promotion, deployment, or production canary occurred in this continuation. The isolated browser run copied the frontend without environment files, used deterministic fixtures, blocked external origins, and blocked non-GET API requests.

## Final candidate checks

| Gate | Result | Evidence |
|---|---|---|
| Isolated production build | PASS | Next.js 16.3.7 webpack build; TypeScript phase passed; 139 static pages generated. |
| TypeScript | PASS | `npx tsc --noEmit` passed. Generated `next-env.d.ts`/`tsconfig.json` changes were restored and excluded. |
| Changed-file lint | PASS with one known warning | 0 errors; 1 existing React Three Fiber `useFrame` camera-position warning in `RobinPayotRoadCanvas.jsx`. No new actionable warning in changed critical logic. |
| Hermetic discovered suite | PASS with explicit external gates | 383/389 discovered test files passed the runner gate; 6 are itemized below. Aggregated result: 1,479 tests, 1,443 pass, 0 fail, 36 skip. |
| Changed Trust / G8 targeted tests | PASS | 9/9; G8 returned 20/20 truthful outcomes: 10 retained source candidates and 10 explicit insufficient-evidence cases. |
| AI challenge | PASS (hermetic) | N=200; accuracy 100%, macro F1 100%, false reassurance 0, Brier 0.0051, ECE 0.0690, citation validity 100%. This does not prove live provider quality. |
| Three-core E2E | PASS | 100 pass, 2 intentional screenshot-matrix skips, 0 fail across Chromium, Firefox, WebKit; elapsed 24.3 minutes. |
| E2E production build | PASS | Built in isolated copied frontend; no env files; no live DB/provider assurance. |
| Browser screenshots | CAPTURED | 239 files across Trust, Community, Expert, Omni, and release smoke; all manifest paths exist. Fixture evidence, not live account evidence. |
| Accessibility / responsive | PASS for audited surfaces; overall PARTIAL | E2E includes keyboard, axe, focus, reduced motion, text spacing/200%-zoom-equivalent reflow, themes, and responsive checks. Omni, Trust, Expert exercised at 360–1920; Community screenshot matrix at 390/768/1440. Not every one of 25 screenshot-required pages has a full matrix. |
| Secret scan | Changed/staged/client PASS; incident closure PARTIAL | Zero secret-pattern hits in staged additions; 269 isolated client bundle files scanned with 0 credential-pattern hits and no env files. A broad tracked-source heuristic produced 7 historical URL/test/local-development matches; all were triaged as false positives, placeholders, or local-only defaults. The old exposed staging DB password's rotation/invalidation remains unverified. |
| Staging / RLS / live product | BLOCKED | No safe proof that the old staging DB credential was invalidated. Do not reconnect until owner rotation is verified. |
| Main / production | NOT RUN | Critical gates are not satisfied, so promotion and canary are withheld. |

## Retrieval holdout results (Tavily disabled)

| Holdout | N | Recall@5 / NDCG@5 | Official source Top-5 | Irrelevant Top-1 | Entity resolution | Outcome |
|---|---:|---:|---:|---:|---:|---|
| V3 | 165 | 22.4% / 22.2% | 63.0% (target ≥90%) | 19.4% (target ≤7%) | Superseded: legacy scorer could credit unrelated matches | Targets not established |
| V4 | 150 | 18.7% / 18.7% | 18.7% (target ≥90%) | 38.0% (target ≤7%) | Superseded: legacy scorer could credit unrelated matches | Targets not established |
| V5 | 150 | Hybrid 34.0% / 32.3%; static Recall@5 12.7%; live Recall@5 0.0% | 12.7% (target ≥90%) | 27.3% (target ≤7%) | Superseded: legacy scorer could credit unrelated matches | Targets not established |

The previous V3/V4/V5 entity-resolution percentages are not valid acceptance evidence. Their scorers could count an unrelated resolved entity, any ambiguous result, or some empty/unknown outcomes as a match. V3/V4/V5 now share an exact canonical-identity scorer; topical, policy, and scenario labels are excluded from entity accuracy and reported as unscored coverage. This corrected scorer has not been run as a fresh release holdout, so no new entity-resolution target is claimed. Retrieval targets remain failed independently of this correction.

The earlier 84-query benchmark is not used to override these broader failing holdouts. Live public retrieval did return real Wikipedia candidates; the golden flow correctly left claim relation unknown and returned `INSUFFICIENT_EVIDENCE`. Retrieval must improve before any provider campaign.

### Current continuation update — 2026-10-01

- Added 12 canonical institution identities to the resolver and regressions for exact identity/domain selection: [EPU](https://epu.edu.vn), [HUNRE](https://hunre.edu.vn), [IUH](https://iuh.edu.vn), [DLU](https://dlu.edu.vn), [TDU](https://tdu.edu.vn), [VGU](https://vgu.edu.vn), [VHU](https://vhu.edu.vn), [LHU](https://lhu.edu.vn), [TDMU](https://tdmu.edu.vn), [BDU](https://bdu.edu.vn), [Dong Nai University](https://dongnaiuni.edu.vn) ([alternate school site](https://dnpu.edu.vn)), and [HANU](https://hanu.vn). The Dong Nai entry does not trust the dataset's unverified `dnu.edu.vn` label.
- Corrected the V3/V4/V5 entity-resolution metric: unrelated entities, generic ambiguity, and topic/scenario labels cannot count as correct canonical identities. Each runner records scored-case count and coverage, with a minimum 80% coverage gate.
- The previous V3/V4/V5 entity-resolution percentages are historical and superseded. No fresh release holdout was run with the corrected scorer, so that target remains unestablished.
- Verification: targeted resolver/public API/Trust tests `29/29`; changed-file ESLint `0 errors / 0 warnings`; V3/V4/V5 syntax checks passed; `git diff --check` passed. No Tavily, staging, Supabase, database, Main, or production operation ran.
- Remaining release blockers are unchanged: retrieval recall/official-source thresholds still fail, and the owner has not verified staging credential rotation and old-password invalidation.

## Six files previously excluded by the aggregate runner

| FILE | TEST AREA | WHY BLOCKED / LIMIT | REQUIRED ENVIRONMENT | REQUIRED DATABASE | REQUIRED USERS | SAFE STAGING STRATEGY | EXECUTED | RESULT |
|---|---|---|---|---|---|---|---|---|
| `frontend/tests/evidence/fresh_retrieval_holdout_v3.test.mjs` | 165-case production discovery holdout | Aggregate runner classifies broad retrieval evaluation separately; execution is local/read-only, but metric targets fail. | Node runtime and checked-in V3 dataset; no credential; Tavily OFF. | None. | None. | Run as local non-mutating evaluation; never seed candidates with scorer gold labels. | YES | Metrics computed; release targets not established. |
| `frontend/tests/evidence/fresh_retrieval_holdout_v4.test.mjs` | 150-case RC3 retrieval holdout | Same separate metric gate; no DB dependency; target failure is not converted to test failure. | Node runtime and checked-in V4 dataset; Tavily OFF. | None. | None. | Local non-mutating evaluation with gold data used only by scorer. | YES | Metrics computed; release targets not established. |
| `frontend/tests/evidence/fresh_retrieval_holdout_v5_public_api.test.mjs` | 150-case static/live/hybrid public API retrieval holdout | Separate provider/retrieval evaluation; metrics fail release thresholds. | Node runtime, V5 dataset, public network only for enabled public API path; Tavily OFF. | None. | None. | Read-only public discovery; no account or database access. | YES | Metrics computed; release targets not established. |
| `frontend/tests/evidence/live_web_retrieval.test.mjs` | Real public search contract and SSRF boundary | External network test is separately classified by aggregate runner. | Node runtime and public Internet access to the configured Wikipedia live API; no secrets. | None. | None. | Read-only public retrieval plus local unsafe-URL assertions. | YES | 4/4 pass. |
| `frontend/tests/evidence/real_world_live_search_golden_flow.test.mjs` | Public university claim through live Trust pipeline | External network test is separately classified by aggregate runner. | Node runtime and public Internet access; Tavily OFF. | None used in this run. | None; non-sensitive public claim. | Read-only public retrieval with no personal input; accept honest insufficient evidence. | YES | 3/3 pass; sources found, relation unknown, `INSUFFICIENT_EVIDENCE`. |
| `frontend/tests/expert/expert_v5_live_readonly.test.mjs` | Expert V5 live database read-only table/state assurance | Staging credential exposure has no verified rotation/invalidation proof; current session/project identity also not established. | Rotated staging-only `DATABASE_URL`, matching Supabase URL/ref `bniwtkjtramqaozrrtrk`, owner-confirmed security state. | `StudentHub-AI-Staging`, read-only; no Main/production; guarded project/database identity. | No mutation persona; any API assertions require dedicated staging demo identities, not real users. | After owner rotation and identity proof, run only the read-only guarded suite; stop on identity mismatch. No service-role bypass/direct SQL mutation. | NO | UNSAFE_TO_RUN until credential rotation/invalidation is verified. |

## Feature coverage (route/file inventory, not every control)

`DISCOVERED_ACTIVE_FEATURES=208` route/file rows: 49 page entrypoints plus 159 API route handlers. The control-level census of every button, menu, tab, server action, and role-specific mutation remains partial.

| Count | Classification |
|---:|---|
| 208 | Discovered route/file rows |
| 198 | Rows with some test or browser evidence (11 removed-route assertions, 155 aggregate hermetic coverage rows, 32 selected current/prior responsive page rows) |
| 11 | PASS: removed product routes return 404 under the current browser suite |
| 187 | PARTIAL: aggregate, contract, or selected UI coverage without full live feature acceptance |
| 0 | Confirmed route-level failures in the current candidate suites |
| 4 | Unsafe/deferred: live mutation assurance blocked by staging credential incident |
| 6 | Unverified owner role/scope disposition, included within unsafe/deferred rows above; route/caller authorization review remains required |
| 25 | User-facing page routes marked screenshot-required in the inventory |
| 239 | Current isolated screenshot files, across five evidence surfaces; not 239 distinct pages |
| 1 / 1 | UI defect found / code fix made: stale onboarding carousel links and fabricated metrics |
| 0 / 0 | Known P0 / P1 UI defects open after E2E |
| 0 | Silently ignored route/file rows |

The onboarding code fix has a static route-contract assertion but no dedicated before/after browser screenshot. It remains an evidence gap, not a known open visual defect. No unsupported feature was reported as live/pass.

## Staging security, release gates, and promotion

- `STAGING_DB_PASSWORD_ROTATED=UNVERIFIED`; `OLD_PASSWORD_INVALIDATED=UNVERIFIED`. This is the blocking security incident gate. No password was requested, printed, or reused.
- `SOURCE_SECRET_SCAN=PASS` after triage; `STAGED_SECRET_SCAN=PASS` (0 added-line matches); `CLIENT_SECRET_SCAN=PASS` (269 files, 0 credential-pattern matches) for this candidate before push. The isolated bundle was built without environment files. These do not establish old-password invalidation.
- `AUTH=PARTIAL`, `PROFILE=PARTIAL`, `TRUST=PARTIAL`, `COMMUNITY=PARTIAL`, `EXPERT=PARTIAL`.
- `QUESTION_BANK=BLOCKED`, `QUIZ=BLOCKED`, `MISSIONS=BLOCKED`, `STAR_LEVEL=BLOCKED`, `REPUTATION=BLOCKED`, `LIVE_ROOM=BLOCKED`, `SUPERVISOR=BLOCKED`, `EXPERT_PRESENCE=BLOCKED`, `REALTIME=BLOCKED`, `RLS=BLOCKED` for live staging acceptance.
- `OMNI=PASS` for deterministic isolated UI contract; live provider behavior remains partial/unproven.
- `CSRF=PASS` and `SSRF=PASS` for the exercised hermetic/public tests; broader production security assurance remains partial.
- `UI_UX=PARTIAL`, `MOBILE=PASS` for selected audited surfaces only, `ACCESSIBILITY=PASS` for audited surfaces, `CHROMIUM=PASS`, `FIREFOX=PASS`, `WEBKIT=PASS`, `BUILD=PASS`, `TYPE=PASS`, `SECRET_SCAN=PARTIAL` because the credential incident is unresolved.
- `TAVILY_FINAL_LIVE=BLOCKED`; planned/attempted/success/failed/cache hits = 0; final mode OFF. `NON_TAVILY_IMPLEMENTATION_READY=NO` because retrieval targets fail.
- `STAGING_ACCEPTANCE=PARTIAL`; `PRODUCTION_CANARY=BLOCKED`; `PROMOTION_READY=NO`.

Do not push `main`, trigger production deployment, or run production canaries from this candidate. Re-open live assurance only after a legitimate owner workflow confirms staging password rotation and invalidation; then re-establish staging identity, run RLS/Expert V5/realtime and progression matrices, fix retrieval quality to threshold, and only then reconsider the one-shot Tavily gate.

## Repository artifacts

- `ACTIVE_FEATURE_INVENTORY.md`
- `FINAL_ACCEPTANCE_MATRIX.md`
- `TEST_ACCOUNT_MATRIX.md`
- `QUESTION_PROVENANCE_REPORT.md`
- `REALTIME_ASSURANCE_REPORT.md`
- `TAVILY_CALL_LEDGER.md`
- `UI_REGRESSION_LEDGER.md`
- `SCREENSHOT_MANIFEST.json` (239 entries; files live in the local isolated run artifact directory)
- `CLEANUP_INVENTORY.md`
- `RELEASE_SHA_MANIFEST.md`
- `SECURITY_ASSURANCE_REPORT.md`
- `SCREENSHOT_MANIFEST_20261001.json` (current 239-image continuation)

`11bfc70945113bbe0f8ac0f25b4ba9e7f02a4067` is the tested integration source/audit commit. A follow-up commit records this SHA in the manifest and changes release metadata only. The final branch tip is returned in the closure response. `origin/main` is intentionally not changed.

## Trust reference and full local verification continuation — 2026-10-01

The user identified four existing Trust commits as the desired canonical structure: `3d52e6c` render-backend wiring, `4bfd4e9` Layer 2 provider settlement, `554e8e7` safe L4 classification, and `80351be` gated demo presentation. This continuation keeps `OwnBackendTrustOrchestrator` and its four public `l1/l2/l3/l4` response stages as the authority, maps the active Trust UI to those four layers, and renders deterministic Final Predict separately only after it is published. No competing pipeline or persistence contract was added.

Implemented Trust UI fixes:

- Replaced the five-stage public journey with the four canonical backend stages and separate Final Predict; completed `l2/l4` public statuses now render correctly.
- Kept sources distinct from evidence, removed fabricated live provider defaults, kept missing provider status unavailable, corrected compact/mobile input layout, and disabled IMAGE/QR submission until a supported file is selected.
- Fixed result/provenance panel text contrast and preserved case/revision-bound Community and Expert handoffs.

Verification:

- Trust targeted contracts: 28/28; isolated Trust Playwright: 9/9; changed-file ESLint and TypeScript/build passed.
- Full isolated V4 three-core browser suite: 100 passed, 2 intentional screenshot-only skips, 0 failed/flaky across Chromium, Firefox and WebKit. Production build was rebuilt in an isolated copy; no env files, live account, database or provider assurance. Run manifest: `D:\StudentHub-CodexRuns\FULL_V4_THREE_CORE_20261001\2026-10-01T06-59-17-209Z-36960\run-manifest.json`.
- `npm run test:all`: PASS with `TAVILY_MODE=OFF`, call budget `0`, and the Tavily/OpenAlex/OpenAI/Gemini, Supabase service/session, and database environment variables explicitly unset in the test process. Expert V4/V5, database guards and Trust/Omni/Community root-run contracts: 86/86. Security/product-scope/Trust render contracts: 30/30. Full ESLint `--quiet`: exit 0.
- The package threat-intelligence tests exercised URLhaus's offline/timeout path with a synthetic example URL. Tavily was not called; no Tavily key was read or exposed.
- Three-core feature folders contain 239 fixture screenshot images (Trust 33, Community 35, Expert 85, Omni 85, release smoke 1). They and the Playwright report/traces are retained outside the repository; `SCREENSHOT_MANIFEST.json` links to the companion file manifest. They are not live-user screenshots.

Release remains `STUDENTHUB_PRODUCTION_RELEASE_PARTIAL`. Production schema is still missing 22 canonical tables and 6 columns, backup/PITR is UNKNOWN, staging credential rotation/invalidation is not independently evidenced, and retrieval quality targets remain unestablished after scorer correction. No production migration, final Tavily campaign, Main promotion, deployment, or production canary was performed. Tavily remains OFF with budget 0.
