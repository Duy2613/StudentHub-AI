# StudentHub AI — Phase F.3 External Live Assurance

Date: 2026-09-11
Candidate branch: feature/expert-trust-network-v3
Evidence baseline SHA: 48d381375c45f6d387d8c7afea66e3ae16c978b9
Final verdict: EXPERT_V3_BLOCKED_BY_LIVE_WEB

## Executive result

The candidate was audited from a fresh disposable checkout at the exact remote SHA. No new Expert product feature was added. Local static gates, the targeted Phase F matrix, the broader Community/Expert/Trust contracts, authenticated local E2E, staging migration, staging schema integrity, and direct staging authorization probes passed.

The two live-web suites passed when run individually with public retrieval authorized, but the authorized repository-wide fail-fast run was red inside live_web_retrieval.test.mjs and stopped after 161 of 359 discovered files. The remaining 198 files were not reached, so this is not a full-regression pass and no PR was opened. Google and GitHub OAuth also remain EXTERNAL_CONFIG_REQUIRED; no provider configuration or OAuth secret was invented.

No merge to develop, Main Supabase migration, Main Supabase write, or production deployment was performed. No force push was used.

## Exact-SHA and worktree integrity

Fresh F.3 checkout:

C:\Users\Duy\Projects\MyProj\StudentHub-AI-Expert-V3-F3

- Detached at 48d381375c45f6d387d8c7afea66e3ae16c978b9.
- git status --short --branch was clean before the assurance run and is clean after generated build/test output was restored or quarantined.
- origin/feature/expert-trust-network-v3 resolved to the same SHA at audit time.
- No Main database, Supabase service-role credential, .env file, secret, or browser credential was copied into the checkout.

Primary owner worktree was not modified:

- Path: C:\Users\Duy\Projects\MyProj\StudentHub-AI
- Branch: implementation/academic-cinematic-v1-f00
- HEAD: b78f90fb6e8f475c0b36a6116aa6ff0a01975882
- Full untracked-status signature remained 298 lines, 19,757 LF-normalized UTF-8 bytes, SHA-256 2537c8cb607d9fda81b2e2de37a43715df851a96556264caaad0ecd85df79c5c.

The pre-existing feature owner worktree was also not used for edits or tests:

- Path: C:\Users\Duy\Projects\MyProj\StudentHub-AI-Expert-V3
- Branch: feature/expert-trust-network-v3
- HEAD remained bbabf87514e9201f963896cb97999e73c5c8afc6; its pre-existing dirty files and generated artifacts were preserved.

F.3 generated material was excluded: node_modules, .next, local logs, .env files, secrets, disposable database artifacts, browser/test caches, and the fail-fast runner's artifacts/ai-eval and artifacts/retrieval outputs. The temporary staging probe script was deleted; the two generated benchmark directories were moved to an explicit OS temp quarantine outside the worktree. No source diff was introduced by F.3.

## Static and release gates

| Gate | Result |
| --- | --- |
| git diff --check | PASS |
| TypeScript in frontend, TypeScript 5.9.3 | PASS |
| npm run lint | PASS; no lint errors |
| Production build | PASS; Next.js 16.3.0, 162/162 static pages |
| Secret scan | PASS; 83 client bundle files, zero active server-secret leaks |
| Canonical bundle budget | PASS; all 7 core routes below 500,000 B |

The first build attempt correctly failed closed because the fresh checkout had no DATABASE_URL; the successful build used only a loopback dummy URL and made no database connection. The secret scan found no OPENAI_API_KEY, GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, or STUDENTHUB_SESSION_PEPPER in client bundles.

Bundle sizes from the successful build:

| Route | Bytes |
| --- | ---: |
| / | 272,831 |
| /trust | 160,230 |
| /community | 126,149 |
| /expert | 126,143 |
| /cases | 278,782 |
| /dashboard | 158,725 |
| /settings | 454,635 |

## Targeted contracts and authenticated local E2E

- Phase F target set: 10 suites, observed 39/39 tests passed, 0 failed, 0 skipped. The older implementation note called this 38/38; the current repository contains four moderation assertions rather than three, so the observed count is recorded without alteration.
- npm run test:security: 37/37 passed.
- npm run test:phase2-auth: 10/10 passed.
- Curated relevant Community/Expert/Trust contracts: 159/159 passed across 26 suites.

The authenticated local run produced:

FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED

with mainAuthWrites=0, mainDbWrites=0, mainStorageWrites=0, loopback-only server networking, cloud Supabase rejected by the browser guard, zero network guard violations, and LOCAL_SYNTHETIC_DATA_AND_AUTH_CLEANED.

## Live-web assurance

Public retrieval was explicitly authorized with STUDENTHUB_ALLOW_EXTERNAL_LIVE_TESTS=1. No Main or Supabase service-role credential was injected, and no synthetic live-web result was substituted.

### Individual live suites

| Suite | Result |
| --- | --- |
| frontend/tests/evidence/live_web_retrieval.test.mjs | PASS; 6/6 |
| frontend/tests/evidence/real_world_live_search_golden_flow.test.mjs | PASS; 1/1 |

Observed live evidence:

- DNS resolved vi.wikipedia.org to 103.102.166.224 and hcmut.edu.vn to 14.238.125.84.
- Live provider: WIKIPEDIA_LIVE_API. A real URL included https://vi.wikipedia.org/wiki/Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.
- A live HCMUT fetch returned the real title ĐHBK HCM - Trường Đại học Bách khoa ĐHQG HCM, parser 2.1.0-live-html, 2,865 bytes, digest 70875df04b716477699201c7f76e49001032ea52c968eb8acb10e6b8f4838678.
- Live discovery returned REAL_WEB_RETRIEVAL_VERIFIED with real Wikipedia source URLs and content digests.
- The golden flow returned CONFLICTED_EVIDENCE, 44 retained sources, 6 citation IDs bound to source records, a populated Decision Twin with drivers and reversal conditions, and an Evidence Passport. One observed passport digest was 55f39e3a540c9b6eb9b2a79bca4cc98c6e49e028d73a49caf2975c00f908b515.

### Authorized full discovered run

The exact command npm run test:all-discovered was run with the authorized external-live flag. Its fail-fast accounting is:

| Metric | Count |
| --- | ---: |
| discovered | 359 |
| executed, including the failing file | 161 |
| passed files | 160 |
| failed files | 1 |
| skipped files | 0 |
| blocked_by_env | 0 |
| not reached after fail-fast | 198 |

The first failing file was frontend/tests/evidence/live_web_retrieval.test.mjs: 3 internal live tests passed and 3 failed. The failures included unsuccessful search requests and an actual INSUFFICIENT_EVIDENCE result where the test expected REAL_WEB_RETRIEVAL_VERIFIED. The runner stopped before reaching the later golden live-search file. Individual suite success therefore does not override the red, incomplete repository-wide run.

## Staging Supabase identity and migration

The staging project was read from the dedicated staging configuration and was proven distinct from Main before any write-capable session:

| | Staging | Main |
| --- | --- | --- |
| Project ref | bniwtkjtramqaozrrtrk | kytdomflmjytzyaabogi |
| API host | bniwtkjtramqaozrrtrk.supabase.co | kytdomflmjytzyaabogi.supabase.co |
| Database host | aws-0-ap-southeast-2.pooler.supabase.com | aws-0-ap-northeast-1.pooler.supabase.com |
| Pooler port | 6543 | 6543 |

STAGING != MAIN was verified by project ref, API host, database host, and database connection string. No Main connection was opened for migration or probe writes.

Before migration, staging was PostgreSQL 17.6 with no application migration ledger relation and baseline schema fingerprint c9ea13658f98e1508d5eef38f107b2999ef52232ebdbd958f3f0921eceadd249; counts were 225 columns, 145 constraints, 57 indexes, 29 RLS entries, 22 policies, and 367 grants. The required pre-existing authority tables were present; the Community contribution table was not.

The first write attempt stopped at the first migration because a transaction pooler session retained default_transaction_read_only=on, producing 25006 cannot execute CREATE EXTENSION in a read-only transaction. No migration write was applied by that failed attempt. The session was discarded, write mode was explicitly reset, and the canonical chain was then applied in order:

1. 202608270001_v2_authority_foundation.sql
2. 202608290001_feature_freeze_cross_system.sql
3. 202609010001_private_screenshot_storage.sql
4. 202609060001_expert_qualification.sql
5. 202609060002_integration_outbox.sql
6. 202609060003_trust_runs_revisions.sql
7. 202609060004_reports.sql
8. 202609070001_realtime_event_log.sql
9. 202609090001_community_expert_promax.sql
10. 202609100001_expert_authority_snapshot.sql
11. 202609110001_expert_trust_network_v3.sql
12. 202609110002_expert_v3_integrity_closure.sql

Result: STAGING_CANONICAL_MIGRATION_CHAIN_APPLIED.

Post-migration schema fingerprint was b69c1cba42c4a36cd1fc54ebbee77404545adfa50b0bf435c476a1f3f703d9de; counts were 685 columns, 506 constraints, 168 indexes, 64 RLS entries, 41 policies, and 540 grants. All seven Phase F tables exist. Readback verified:

- Expert progression primary key is exactly (user_id, domain_code).
- Perception target-consistency checks are present.
- All seven Phase F tables have RLS enabled and are not forced.
- Authenticated perception insert/update is denied; private moderation and perception-event reads are denied; service-role writes are explicit.
- Authenticated appeal/progression reads are allowed while direct inserts are denied.
- Server-derived expert flag and append-only perception/moderation event triggers are present.
- Moderation target scope is exactly COMMUNITY_CONTRIBUTION.
- Moderation case, event, vote, and appeal identity snapshots are present.

No pg_dump executable was available on the workstation and no Supabase backup/snapshot API was invoked. Therefore a pre-migration backup is not claimed. The operator must take an approved staging snapshot/PITR backup or confirm a disposable reset path before reusing this project. The direct live probe intentionally left two resolved synthetic audit cases (4 votes, 6 audit events) and eight synthetic users in staging because append-only retention triggers reject cleanup with P0001; the audit history was not bypassed.

## Staging live security probes

All probes used staging fixtures and returned the required result:

| Probe | Result |
| --- | --- |
| Authenticated student direct perception insert | DENIED, SQLSTATE 42501 |
| Spoofed voter_is_expert_at_vote=true | Stored value forced to false |
| Five-star projection without verification | Projection present; no qualification and no authority role |
| Moderator role without eligibility | Denied: qualification, quality, and training required |
| Self moderation | Denied: SELF_MODERATION_FORBIDDEN |
| Reporter moderation | Denied: REPORTER_MODERATION_FORBIDDEN |
| Conflict of interest | Denied: CONFLICT_OF_INTEREST |
| One eligible vote finalization | Denied: MODERATION_QUORUM_NOT_REACHED |
| Two independent eligible votes | Finalization succeeded with KEEP 2/2 |
| Unrelated appeal | Denied: APPEAL_OWNER_REQUIRED |

The live security probe status was STAGING_SECURITY_PROBES_VERIFIED.

## OAuth and authenticated staging E2E

The staging Auth settings endpoint was reachable over HTTPS and returned both providers disabled: Google false, GitHub false. No OAuth client secret was printed or configured.

Required operator configuration remains:

- Google callback: https://bniwtkjtramqaozrrtrk.supabase.co/auth/v1/callback. Configure a real Google Web Client in Supabase Auth Providers and use the staging app callback https://<STAGING_APP_HOST>/callback.
- GitHub callback: https://bniwtkjtramqaozrrtrk.supabase.co/auth/v1/callback. Configure a real GitHub OAuth App with only read:user and user:email, then configure the staging provider.

There was no proven current staging application host, SMTP/OTP setup, Google round trip, or GitHub round trip. Consequently:

- GOOGLE_OAUTH_LIVE_VERIFIED was not asserted.
- GITHUB_OAUTH_LIVE_VERIFIED was not asserted.
- Authenticated staging browser E2E and the full Expert V3 browser journey remain not verified.

## Rollback and forward-fix strategy

No downgrade was attempted. The migration chain is forward-only. If staging exposes a defect, stop before later migrations, preserve the evidence, restore the approved staging snapshot/PITR backup or reset the explicitly disposable project, and ship a reviewed corrective forward migration. Route/feature availability may be disabled while the forward fix is reviewed. No rollback, restore, or migration operation is authorized against Main Supabase.

## CI and PR truth

.github/workflows/competition-quality.yml triggers on every pull_request and on direct push only for develop. A normal feature-branch push does not run it. Because the authorized full regression is red and incomplete, no PR was created, no Competition Quality Gate run exists, and no CI SHA is claimed.

The evidence states are kept separate:

- LIVE_WEB_ASSURANCE: individual live suites passed, but the authorized full discovered run is red and incomplete.
- HERMETIC_CI: not executed because opening a PR while the required gate is red would be misleading.

## Final decision

EXPERT_V3_BLOCKED_BY_LIVE_WEB

Stop boundary honored: do not merge develop, migrate Main Supabase, or deploy production. Re-run the authorized full discovered suite until all 359 files complete with zero failures, then configure and prove real staging OAuth and browser E2E, create the feature-to-develop PR, and verify CI on that exact PR SHA before considering a PR-ready verdict.
