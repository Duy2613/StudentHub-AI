# StudentHub four-core repair — production rollout plan

- **Candidate:** eea55564ebaef4dc2edc7af14586fe8f04324114
- **Current production SHA:** 595a99110367aefb545b02dab4b9f9a5a6106ab6
- **Package state:** STAGING_VERIFIED_PRODUCTION_HOLD
- **Execution state:** HOLD — runtime identity and backup/restore are unverified; production was not mutated.

This plan is intentionally ordered around data recovery and environment identity. Do not start the production migration/deployment sequence until the gates below have evidence and the production action is explicitly approved.

## Gate 0 — required before scheduling production

1. **Prove the actual runtime targets.** Through an operator-approved, secret-safe Vercel inspection, record only the Supabase project refs for production database, Auth and durable session backing. The health route does not expose these refs. The attempted `vercel env pull` was rejected before execution by automatic command review (`blocked by policy`); runtime target remains unknown and the block was not bypassed.
2. **Create and restore a database backup.** Back up the proven production runtime DB to encrypted offsite storage, record SHA-256/retention metadata, and restore into a disposable Supabase-compatible project. Verify schema, data counts, RLS and critical read paths. This is not done: runtime identity is unknown, `pg_dump` is not installed on PATH, and no verified backup/restore target is available. Docker is installed but was not used to guess a production target. Storage objects need a separate backup.
3. **Reconcile migration history.** Read-only comparison found on operator ref `kytdomflmjytzyaabogi`: 10 APPLIED_EQUIVALENT, 4 NOT_APPLIED, 15 UNKNOWN, 0 mismatched hashes and 0 APPLIED_EXACT across 29 files. Staging ref `bniwtkjtramqaozrrtrk`: 4 APPLIED_EXACT, 10 APPLIED_EQUIVALENT, 1 NOT_APPLIED, 14 UNKNOWN; all 8 staging-plan migrations have exact/equivalent ledger entries. This operator target is not proven to be the Vercel runtime DB. Resolve remaining aliases/provenance; never stamp or repair the ledger to suppress uncertainty.
4. **Approve a maintenance window and operator.** Define the write freeze or acceptable write behavior, monitoring owner, abort threshold and decision maker. Preserve the old Vercel deployment for immediate application rollback.
5. **Close residual staging gates.** The planned staging migrations are already represented in the ledger exactly or by equivalent stored SQL, so do not apply them again. Integration is 17 PASS/1 PARTIAL/0 FAIL; storage Trust image/QR is PASS; OpenAlex is AVAILABLE. Residual checks: live Trust provider/independent unseen holdout, configured avatar and room-media storage, Community unaccented search/author filter, and broader cloud grant/policy/function/trigger review.

If any of these checks fails or remains unknown, stop before production.

## Gate 1 — staging migration and application verification

Use the existing migration files selected by the observed-schema rehearsal. The local fixture rehearsal is not the staging migration approval.

**Production fixture plan (8 files):**

1. 20260926111838_community_nested_comments.sql
2. 20260926112754_community_expert_request_linkage.sql
3. 20260927032100_trust_four_layer_stage_constraint.sql
4. 20260929135354_studenthub_expert_v5_missions_rooms.sql
5. 20260929135553_expert_v5_trigger_path_and_fk_indexes.sql
6. 202610010001_integration_outbox_forward_reconciliation.sql
7. 202610010002_profile_presentation_check_reconciliation.sql
8. 202610010003_expert_v5_event_sequence_permissions.sql

**Staging fixture plan (8 files):**

1. 202609170001_durable_academic_workflows.sql
2. 202609170002_demo_entitlements.sql
3. 202609180001_reputation_events_idempotency.sql
4. 20260926111838_community_nested_comments.sql
5. 20260927032100_trust_four_layer_stage_constraint.sql
6. 202610010001_integration_outbox_forward_reconciliation.sql
7. 202610010002_profile_presentation_check_reconciliation.sql
8. 202610010003_expert_v5_event_sequence_permissions.sql

These are ordered lists from migration-rehearsal-final.json, not instructions to run blindly. migration-ledger-reconciliation.json now shows all eight staging-plan files already applied exactly or equivalently; no staging migration was run or is needed. Verify the extant staging ledger, constraints, indexes, functions/triggers, grants, policy definitions, RLS and representative owner-scoped reads/writes from fresh evidence. Candidate SHA eea55564ebaef4dc2edc7af14586fe8f04324114 was run against staging and the evidence is in staging-integration.json, staging-storage.json and openalex-smoke.json.

## Gate 2 — production change sequence, after approval

1. Reconfirm the backup checksum/restore result, target project ref, migration plan hash, current deployed SHA and operator approval immediately before the window.
2. Take a final offsite database backup and separate Storage object backup.
3. Apply only the reviewed additive migrations in reconciled ledger order. Capture command output and before/after catalog fingerprints. Stop on any unexpected row rewrite, lock duration, constraint failure, grant/policy delta or identity mismatch.
4. Run post-migration checks before deploying: Community comments/linkage; Expert V5 relations and private answer boundaries; Trust constraints and owner-scoped case/revision readback; Profile columns/checks; outbox/reputation grants and event sequence; RLS and service/user permissions.
5. Promote/deploy the exact candidate source SHA eea55564ebaef4dc2edc7af14586fe8f04324114. Record Vercel deployment ID and confirm production reports that SHA.
6. Run post-deploy checks with real user sessions and two separate browser identities:
   - /api/health/live and /api/health/ready, with runtime identity checked out-of-band.
   - /api/v1/community, Community posts/search, Expert directory/request/assignment/assessment, Trust text/URL/image/QR persistence, Profile owner/public route behavior.
   - Reload/readback, cross-owner denial, Community nested comments, Expert realtime reconnect/replay and Trust revision boundaries.
   - Chromium/Firefox/WebKit route matrix at 360/390/768/1440, especially Community mobile overflow.
   - Confirm the provider state is explicit and run live provider gates only under approved budget.
7. Compare production catalog/data invariants with the staging-approved manifest; publish the candidate SHA, deployment ID, migration ledger and redacted post-deploy evidence. Do not report FULL_FIX_ACCEPTED until every required production gate passes.

## Rollback and recovery

- **Application rollback:** return the Vercel production alias to the recorded previous deployment running SHA 595a99110367aefb545b02dab4b9f9a5a6106ab6 if the candidate causes application failure. Validate that the old application remains compatible with additive schema changes during staging rehearsal first.
- **Database rollback:** prefer a forward corrective migration. Do not drop new tables/columns or roll back/delete post-migration data. Restore the database only from the verified backup, under a separate explicit recovery decision, after accounting for writes since backup.
- **Storage recovery:** restore object data and metadata from the separate Storage backup; database dump alone does not restore uploaded files.
- **Abort conditions:** wrong project ref; unknown migration alias; backup/restore failure; unexpected destructive SQL; unreviewed RLS/grant/policy changes; integrity loss; unexplained 5xx; cross-owner access; persistent realtime or mobile failure.

## Rehearsal limitations

The candidate rehearsal used local disposable PostgreSQL 17.6 with minimal Supabase Auth/Storage compatibility and synthetic rows generated from read-only observed catalogs. It passed a fresh 29-file migration chain, forward idempotency, both observed-schema fixture upgrades and data-preservation assertions. It was not a production/staging dump restore and does not validate Supabase cloud IAM, all live policies/functions/triggers or Vercel runtime database identity. No production migration or deployment was run.
