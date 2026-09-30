# STUDENTHUB AI — COMMUNITY V4.2 CLOSURE REPORT

Date: 2026-09-27
Branch: `frontend/v4-three-core-redesign`
HEAD: `80351be4a57111d6d1ac1f518827fd5b2e81d550`
Worktree: 305 dirty entries before this continuation; no staging or commit performed.

# 1 COMMUNITY_V4_2_CLOSURE_VERDICT

**BLOCKED**
`COMMUNITY_V4_2_BLOCKED_BY_UNVERIFIED_MAIN_TEST_SIDE_EFFECT`

Local disposable verification now passes its authenticated Community → Trust → Expert path, direct local readback, targeted regression, screenshot/axe suite, build, typecheck, and lint. The gate cannot close because two Expert database tests were accidentally run against the configured canonical Main `DATABASE_URL`. Their dispatch transaction commits before a later dossier query fails. Test cleanup ran in `finally`, but the helper suppresses delete errors. I did not inspect or alter Main afterward, so cleanup and any append-only restricted realtime metadata event remain unverified. This is an integrity/operations blocker; no real-user content leak was observed.

# 2 ORIGINAL COMMUNITY VERDICT

The original report, `docs/reports/COMMUNITY_V4_2_EXECUTION_REPORT.md`, remains **PARTIAL**. The prior closure report was **BLOCKED_BY_ENV** because local PostgreSQL was unavailable at that earlier probe. The local authenticated E2E run subsequently succeeded; this report supersedes that environment finding while preserving the unresolved Main side-effect blocker.

# 3 CLOSURE GAP

| Requirement | Previous status | Current evidence | Current status |
|---|---|---|---|
| Ordinary post without Trust | Fixture only | Authenticated local E2E and Playwright; normal post contains no Trust case/revision and makes no Trust case request | PASS |
| Trust is optional | PARTIAL | Normal Discussion/Question and Source publish without Trust; Verify remains a separate mode | PASS |
| Canonical Expert request Sheet | Static/fixture | Feed and detail open the same request Sheet; local authenticated request binds contribution, case and revision | PASS |
| Production demo gate | Earlier PASS | Current production build runs the demo gate | PASS |
| Trust revision integrity | Scoped PASS | Stale Expert submission for revision 2 against revision 1 is rejected with `409 STALE_CASE_REVISION`; edit-after-run freshness was not exercised | PARTIAL |
| ORPHAN_CASE_CHECK | NOT_RUN | Local inventory and authenticated synthetic flow in §6 | PASS for implemented Trust origin |
| Database/RLS readback | NOT_RUN | Local case/revision/contribution/request/assignment readback and schema metadata in §7 | PASS — local only |
| Authorized and unauthorized access | NOT_RUN | Local authenticated Expert discovery and negative normal-user/unassigned-Expert checks | PASS — local only |
| Realtime | NOT_RUN | Owner and assigned Expert SSE delivery; normal-user exclusion; durable metadata readback | PARTIAL — reconnect/missed-event browser recovery not exercised |
| Manual accessibility | INCOMPLETE | Chromium screenshot matrix and serious/critical axe checks pass; manual screen reader, zoom, text spacing, and reduced-motion checks remain | INCOMPLETE |
| Main-side-effect reconciliation | Not applicable previously | Two unscoped DB Expert tests reached commit; cleanup failures were swallowed and Main was not re-read | BLOCKED |

# 4 TEST ENVIRONMENT

- **Verified target:** Local disposable Supabase/PostgreSQL loopback runtime.
- **Safety classification:** `APPROVED_ISOLATED`; Main/local separation was asserted by the authenticated E2E runner. It recorded zero Main Auth, DB, or Storage writes for that run.
- **Write authorization:** Explicit disposable-db acknowledgement was used for the local runtime. Main write authorization was absent.
- **Incident:** Two separate `node --test` files used `getPostgresPool()` without the disposable overlay. They therefore inherited canonical `DATABASE_URL`, identified in the workspace as Main. No Main connection or cleanup was attempted after discovering the routing error.
- No DB URL, host, account identifier, case ID, or private content is recorded here.

# 5 APPLICABLE TRUST ORIGINS

- Supported Trust-origin path: authenticated owner selects an existing Trust case in Verify and publishes a redacted, revision-bound Community contribution.
- Ordinary Discussion/Question and Source posts are non-Trust origins.
- Comments, replies, counterarguments, AI/Omni, moderation, and Expert re-analysis were not established as Community Trust-case creation origins in the contract audit and remain out of scope for this matrix.

# 6 ORPHAN_CASE_CHECK MATRIX

| Origin | Community entity | Trust relation | Expert workflow | Unauthorized access | Community readback | Result |
|---|---|---|---|---|---|---|
| Existing owner-selected Verify contributions in local disposable DB | 10 published contributions | Each had an existing Trust case and exact revision; zero missing case/revision links | No owner-initiated Expert requests existed for these records; under the opt-in policy no queued review was expected | No private content was queried in this inventory | Public contribution projection remained linked to the exact revision | PASS — no orphaned relationship; Expert request is N/A until the owner opts in |
| Synthetic authenticated local contribution | Published contribution | Canonical case and revision read back from PostgreSQL | Owner request created; server-selected domain-verified Expert received assignment and dossier | Normal user and unassigned Expert were denied protected dossier access | Contribution, request, assignment, case, revision, and publication state were read back | PASS |
| Generic Discussion/Question | Normal post | No Trust case created | N/A | N/A | Published and commented through fixture/local authenticated path | N/A — no Trust origin |
| Source mode | ACADEMIC post with HTTPS source | No Trust case created | N/A | N/A | Published with `caseId` and `caseRevision` absent | N/A — no Trust origin |
| Comment/reply/AI/Omni/moderation/Expert re-analysis | No supported Trust-origin contract found | N/A | N/A | N/A | N/A | N/A — unsupported origin |

# 7 DATABASE READBACK EVIDENCE

Local disposable database only:

- Aggregate readback found 10 published Community contributions with valid Trust case and exact revision relationships; zero missing cases and zero missing revisions.
- Those 10 contributions had no owner-initiated Expert review request and no unassigned queued request. This is consistent with the explicit owner opt-in flow.
- Authenticated local E2E read back the synthetic Community contribution, case revision, private review request, assigned Expert, assignment state, and publication state.
- Schema readback confirmed the Expert request foreign key to Community contribution, Community link column, Trust `l2` stage constraint, and reputation idempotency constraint.
- `community_contributions` RLS was enabled with three policies. `expert_assessments` and private Expert/realtime tables had RLS enabled and service-role-only access in the inspected local schema.
- The successful local E2E artifact is `artifacts/community-v4-2-local-auth-e2e-2026-09-27-full-12.json`; it records `mainAuthWrites=0`, `mainDbWrites=0`, `mainStorageWrites=0`, and successful exact-ID cleanup. These counts apply only to that isolated E2E run, not the two misrouted tests.

# 8 AUTHORIZED EXPERT RESULT

**PASS — local synthetic flow.** A domain-qualified, assigned Expert discovered the owner-requested Community contribution, read its bounded dossier, and saw the canonical contribution/case/revision linkage. The request did not choose its own reviewer.

# 9 UNAUTHORIZED ACCESS RESULT

**PASS — local synthetic flow.** A normal user and an unassigned Expert were denied direct dossier access. The normal-user realtime stream did not receive the protected assignment/request identifiers or claim text.

# 10 COMMUNITY → TRUST → EXPERT TRACE

**PASS for request and linkage; PARTIAL for freshness-after-edit.** The local authenticated trace bound the published Community contribution to its Trust case and revision, then bound the owner-initiated request and server-selected assignment to the same identity. A stale revision submission was rejected with `409 STALE_CASE_REVISION`. No separate edit-after-run scenario verified that an older result is no longer represented as current.

# 11 REALTIME EVIDENCE

**PARTIAL.** The authenticated local E2E captured the authorized Expert assignment SSE event and the Trust-owner review-state SSE event. Durable readback showed restricted metadata classification. An ordinary user's stream received neither protected event nor its identifiers/content. Pure transport tests cover cursor replay and subject scoping. Live reconnect and missed-event convergence were not exercised in this closure.

# 12 PRIVACY RESULT

**PASS within the isolated local flow.** Community public projections omit raw account fields; the blind dossier is assignment-scoped; unauthorized direct access is denied; realtime event payloads omit claim/evidence content. The two accidental Main-directed test runs used synthetic claims and demo-account fixtures. No real Community body was used. Main-side cleanup and any restricted metadata event remain unverified, so this privacy result does not remove the overall BLOCKED verdict.

# 13 TEST COMMANDS / EXIT CODES

| Command/check | Result |
|---|---|
| Targeted fixture regression command below, from repository root | exit 0; 86 tests, 72 pass, 0 fail, 14 live Expert DB tests skipped with `DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV` |
| `npx playwright test tests/e2e/community-v4-2.spec.ts --config=playwright.config.ts --project=chromium --reporter=line` | exit 0; 4 passed, including 390/768/1440 screenshot/axe matrix |
| `node scripts/run-local-authenticated-e2e.mjs` artifact run | exit 0 as recorded in `community-v4-2-local-auth-e2e-2026-09-27-full-12.json`; isolated local cleanup verified |
| Static syntax and whitespace command below | exit 0; Git printed line-ending normalization warnings for already-dirty workspace files |

The 14 skipped live Expert DB tests were not counted as PASS. Their local-authenticated end-to-end equivalent is covered by the successful isolated browser E2E artifact, and their direct DB suite still requires an explicit safe invocation.

Exact targeted fixture regression command:

```text
node --test frontend/tests/realtime/realtime_durable_event_log.test.mjs frontend/tests/realtime/realtime_transport_contract.test.mjs frontend/tests/community/community_social_realtime.test.mjs frontend/tests/community/community_authorization.test.mjs frontend/tests/community/community_identity_privacy.test.mjs frontend/tests/community/community_demo_mode_gate.test.mjs frontend/tests/community/community_policy_boundary.test.mjs frontend/tests/community_expert/authority_stale_contract.test.mjs frontend/tests/community_expert/expert_review_request_contract.test.mjs frontend/tests/community_expert/promax_route_contract.test.mjs frontend/tests/db/community_expert_promax_migration_contract.test.mjs frontend/tests/db/expert_qualification_migration_contract.test.mjs frontend/tests/db/phase3_migration_rls_contract.test.mjs frontend/tests/db/disposable_db_guard_contract.test.mjs frontend/tests/trust/trust_persistence_revision_contract.test.mjs frontend/tests/trust/trust_v5_golden_flow.test.mjs frontend/tests/integration/trust_orchestrator_render_backend.test.mjs frontend/tests/security/expert_api_authorization_contract.test.mjs frontend/tests/privacy/pii_benchmark.test.mjs frontend/tests/expert/blind_expert_16_pair_matrix.test.mjs frontend/tests/expert/blind_expert_ai_hidden.test.mjs frontend/tests/expert/blind_expert_authorization.test.mjs frontend/tests/expert/blind_expert_concurrency.test.mjs frontend/tests/expert/blind_expert_evidence.test.mjs frontend/tests/expert/blind_expert_idempotency.test.mjs frontend/tests/expert/blind_expert_l1_dispatch.test.mjs frontend/tests/expert/blind_expert_l5_reveal_gate.test.mjs frontend/tests/expert/blind_expert_offline_recovery.test.mjs frontend/tests/expert/blind_expert_other_votes_hidden.test.mjs frontend/tests/expert/blind_expert_privacy.test.mjs frontend/tests/expert/blind_expert_realtime.test.mjs frontend/tests/expert/blind_expert_reputation_calibration.test.mjs frontend/tests/expert/blind_expert_submission_lock.test.mjs frontend/tests/expert/blind_expert_widget_contract.test.mjs frontend/tests/expert/expert_qualification_quiz.test.mjs frontend/tests/expert/expert_reputation_policy.test.mjs frontend/tests/expert/expert_store_serverless_fallback.test.mjs frontend/tests/expert/expert_visual_presentation.test.mjs
```

Exact static syntax and whitespace command:

```powershell
$files=Get-ChildItem -LiteralPath 'frontend/tests/expert' -Filter 'blind_expert_*.test.mjs'; foreach($f in $files){node --check $f.FullName;if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}}; node --check frontend/tests/expert/test_helpers.mjs; node --check frontend/tests/helpers/disposableDbGuard.mjs; git diff --check
```

# 14 BUILD / TYPE / LINT RESULT

- `npm run build` — exit 0. Production demo gate PASS, Next build PASS, TypeScript PASS, 142 static pages generated.
- Targeted ESLint command below — exit 0, no warnings.
- Static `node --check` and `git diff --check` — exit 0.

Exact ESLint command, from `frontend/`:

```text
npx eslint tests/e2e/community-v4-2.spec.ts tests/e2e/community-expert-local-auth.spec.ts tests/db/phase3_migration_rls_contract.test.mjs tests/db/disposable_db_guard_contract.test.mjs tests/helpers/disposableDbGuard.mjs tests/expert/test_helpers.mjs tests/expert/blind_expert_16_pair_matrix.test.mjs tests/expert/blind_expert_ai_hidden.test.mjs tests/expert/blind_expert_authorization.test.mjs tests/expert/blind_expert_concurrency.test.mjs tests/expert/blind_expert_evidence.test.mjs tests/expert/blind_expert_idempotency.test.mjs tests/expert/blind_expert_l1_dispatch.test.mjs tests/expert/blind_expert_l5_reveal_gate.test.mjs tests/expert/blind_expert_offline_recovery.test.mjs tests/expert/blind_expert_other_votes_hidden.test.mjs tests/expert/blind_expert_privacy.test.mjs tests/expert/blind_expert_realtime.test.mjs tests/expert/blind_expert_reputation_calibration.test.mjs tests/expert/blind_expert_submission_lock.test.mjs
```

# 15 FILES CHANGED

- `frontend/tests/e2e/community-v4-2.spec.ts` — fixture routes fail closed with 501 for unknown APIs; auth/profile and comment responses are awaited; screenshot matrix timeout is bounded at 120 seconds.
- `frontend/tests/e2e/community-expert-local-auth.spec.ts` — typed PostgreSQL realtime readback rows.
- `frontend/tests/helpers/disposableDbGuard.mjs` and `frontend/tests/db/disposable_db_guard_contract.test.mjs` — reject a disposable URL equal to canonical Main and cover Expert DB test gates.
- `frontend/tests/expert/test_helpers.mjs` plus 14 `blind_expert_*.test.mjs` files — Expert DB tests skip without explicit disposable DB configuration; cleanup failures now surface; fixed L1 test uses a random case and fixture owner.
- `frontend/tests/db/phase3_migration_rls_contract.test.mjs` — align the contract with the current shared Community demo gate.
- `docs/reports/COMMUNITY_V4_2_CLOSURE_REPORT_2026-09-27.md` — this evidence update.
- `artifacts/community-v4.2-review-20260927/` — deterministic UI screenshot evidence for 390, 768, and 1440px.

No Community product UI source file was changed in this closure continuation. No files were staged or committed. Existing unrelated dirty state was preserved.

# 16 TEST DATA CREATED

- Successful local authenticated E2E: 9 synthetic accounts, 6 Trust cases, 7 Community contributions, 8 reactions, 1 Expert application, 2 Expert verifications, 1 practice submission, 3 assignments, 1 assessment, and 3 passports. The artifact reports all synthetic accounts/cases/contributions/realtime events cleaned.
- Main-directed incident: two Expert test invocations attempted up to three synthetic private Trust cases in total and dispatched two synthetic review requests; assignment count is unknown. Test cleanup was invoked by each `finally`. No concrete identifiers or private content are reproduced here.

# 17 CLEANUP RESULT

- Local disposable E2E: `LOCAL_SYNTHETIC_DATA_AND_AUTH_CLEANED`; remaining synthetic users, cases, contributions, and realtime events were all zero.
- Main-directed Expert tests: cleanup was attempted by the test helper. Its SQL errors are swallowed, so successful deletion cannot be confirmed. The dispatcher also starts a restricted, identifier-only realtime publication after commit; its persistence is unverified. No further Main read or write was performed.

# 18 REMAINING COMMUNITY BLOCKERS

1. A database owner must reconcile the two synthetic Expert test runs against Main and confirm their Trust cases, review requests, assignments, and any restricted realtime metadata event were cleaned or otherwise handled. This agent did not inspect or mutate Main after discovering the routing error.
2. Exercise a local edit-after-Trust-run freshness scenario and confirm the earlier Trust result is displayed as stale.
3. Exercise live reconnect/missed-event convergence for the Community/Trust/Expert realtime flow.
4. Complete the manual screen-reader, zoom, text-spacing, and reduced-motion checks required by the prior quality gate.
5. Run the 14 direct Expert DB tests only through the newly guarded disposable-local harness; they were safely skipped in the unconfigured regression invocation.

# 19 UPDATED COMMUNITY VERDICT

**BLOCKED — remains below PASS.** Local functional and visual evidence improved, but the unverified Main test side effect and remaining freshness/realtime/accessibility checks prevent a release-grade closure. Do not edit the original Community execution report to PASS.

# 20 EXPERT V4 PRECONDITION

**EXPERT_V4_STILL_BLOCKED**

Community V4.2 is not verifiably PASS. Expert V4 work has not started; its next permitted entry point remains E0 contract audit after Community blockers are resolved.
