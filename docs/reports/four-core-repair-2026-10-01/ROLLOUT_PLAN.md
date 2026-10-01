# StudentHub candidate verification and production rollout plan

## Current recorded state

- **Source candidate:** `cc2a31069dfab6dd4fa112335f930c3639719fe6`
- **Release branch:** `codex/studenthub-four-core-repair-20261001`
- **Production project:** `StudentHub-AI`; expected Supabase ref `kytdomflmjytzyaabogi`
- **Current production deployment:** `dpl_ED91sTmSbtDS3xTzhgCeeiJqeRh7`, SHA `595a99110367aefb545b02dab4b9f9a5a6106ab6`
- **Package status:** candidate source repaired and locally verified; production HOLD
- **Production writes/deployments:** none

The user confirmed the Vercel project, environment, current deployment ID/SHA and expected Supabase project. Runtime Auth, database, Storage, Realtime and durable-session refs remain UNKNOWN because no approved runtime metadata establishes them. The operator read-only ref is not substituted for runtime proof. Production authorization does not waive these technical preconditions.

## Release gates, in order

### 1. Prove the runtime targets

Use the approved Vercel/operator workflow to return only safe metadata: deployment ID/SHA, environment, component purpose and Supabase project ref. Prove every production component targets `kytdomflmjytzyaabogi` and none targets staging `bniwtkjtramqaozrrtrk`. The earlier `vercel env pull` attempt was rejected by automatic command review with exact reason `blocked by policy`; that block was not bypassed. Until approved runtime identity evidence exists, stop before production reads requiring credentials, backup, migration, deploy or canary.

### 2. Close migration and data-recovery gates

The earlier read-only migration comparison on the operator project recorded 4 `NOT_APPLIED`, 15 `UNKNOWN`, zero hash mismatches, and no proof that this operator ref is the Vercel runtime. Treat those counts as historical until runtime identity is proven. Resolve all 29 migration classifications against the proven runtime, including the target list in `migration-ledger-reconciliation.json`. Require zero `UNKNOWN` and zero `HASH_MISMATCH`; do not stamp/repair the ledger or reapply `APPLIED_EXACT`/`APPLIED_EQUIVALENT` migrations.

Create an encrypted production database backup and separate Storage object backup only after identity matches. Record timestamp, source ref, database version, size and SHA-256. Restore into a compatible disposable database and verify schema, representative rows, FKs, indexes, RLS, policies, grants, functions and triggers. Require checksum and restore PASS before writes.

The candidate introduces **no new migration** for Room media. It reuses the existing private Trust bucket and its metadata table contract. The unchanged existing migrations rehearsed locally for this media path are:

1. `202609010001_private_screenshot_storage.sql`
2. `20260929135354_studenthub_expert_v5_missions_rooms.sql`
3. `20260929135553_expert_v5_trigger_path_and_fk_indexes.sql`
4. `202610010003_expert_v5_event_sequence_permissions.sql`

Their hashes and local rehearsal result are in `room-media-local-assurance.json`. A separate 29-file migration chain and observed-schema fixture rehearsal is recorded in `migration-rehearsal-final.json` for baseline `eea55564ebaef4dc2edc7af14586fe8f04324114`; the candidate's `database/migrations` tree is unchanged from that baseline. These local runs are not cloud migration approval or backup restore proof. Before deployment, inventory existing Room challenge payloads for legacy inline bytes and define a reviewed migration/backfill mapping; never bulk-copy staging rows or assign media ownership from unverified data.

### 3. Establish canonical schema and permissions

Derive active objects from current source, tracked migrations and product contracts; do not copy staging's 42 extra tables. Reconcile the prior cloud inventory against the proven runtime and classify every required object `ACTIVE_REQUIRED`, `SUPPORT_REQUIRED`, `LEGACY`, `STAGING_ONLY`, `TEST_ONLY` or `SUPERSEDED`. The older production observation recorded 65 tables/694 columns and a repair-scope delta of 22 tables/six columns; these are not a current runtime pass. Verify zero active required missing tables/columns, critical FKs/indexes, RLS, policies, grants, functions and triggers before deployment.

### 4. Finish non-Tavily functional acceptance

Run real production-like Auth/profile, Community, Trust, Expert, Question Bank, Quiz, missions, progression, reputation, Room, Realtime, Storage, search and security flows with approved demo identities. Verify all eight persona mappings and role/scope boundaries. Prove Trust L1–L4 with real claim extraction, actual retrieval/evidence graph and provenance; verify OpenAlex live and a genuinely unseen retrieval/Final Predict corpus with N, accuracy, macro F1, per-class precision/recall, false reassurance, citation validity, evidence coverage, and Brier/ECE where probabilistic. V3/V4/V5 historical fixtures do not count as fresh holdout evidence. Keep Tavily OFF until every non-Tavily gate passes.

### 5. Run Room media acceptance

Use the real Room UI and authenticated host. Run IMAGE and QR through R01–R17: upload to durable private Storage, verify one canonical media ID and SHA across Room, canonical Trust intake and Evidence Package, prove Trust L1–L4, authorized participant reload/reconnect, outsider and anonymous denial, then remove only run-owned media and verify deletion. Record candidate/deployment SHA and environment with each result. Local service evidence in `ROOM_MEDIA_STORAGE_ACCEPTANCE.md` covers implementation and isolation but does not replace the production UI/provider run.

### 6. Publish, promote and accept exact source

After critical preproduction gates pass, publish the frozen source on the user-designated release branch. Fetch `origin` and race-check main. If main moved, integrate deliberately and rerun affected checks; never force-push. Promote only the reviewed exact source after the gates pass. Wait for Vercel `READY` and require the production deployment SHA equals the promoted main SHA. Run all eight persona UI journeys and cross-browser Chromium, Firefox, WebKit, responsive and accessibility checks against that deployment. Capture health and acceptance evidence.

No deployment/main promotion is authorized by this plan while runtime identity, migration classification, backup/restore, live Trust/provider, holdout or persona acceptance remains unresolved.

## Rollback and recovery

- Keep the existing production deployment available. If an authorized candidate deployment later fails application checks, restore the production alias to the previously verified deployment and confirm health.
- Prefer a forward corrective migration. Database restore requires a verified backup, write accounting and the already authorized recovery procedure.
- Restore Storage objects from the separate Storage backup; database backup alone cannot restore uploaded files.
- Stop on wrong project ref, unknown migration classification, backup/restore failure, unexpected destructive SQL, RLS/grant drift, integrity loss, cross-owner access, or persistent realtime failure.

## Evidence limits

The 31 Room media checks and eight cleanup confirmations ran only against a disposable local Supabase 17.6 environment. Its Evidence Package checks used a synthetic terminal Trust response; provider calls were zero. Candidate build, lint and secret scan passed; six test files were blocked by external gates. No production migration, backup, restore, release deployment, browser matrix or production user acceptance was performed. See [the current unification report](CANONICAL_PRODUCTION_UNIFICATION_2026-10-01.md) for exact statuses.
