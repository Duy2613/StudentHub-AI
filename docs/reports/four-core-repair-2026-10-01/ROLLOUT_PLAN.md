# StudentHub four-core repair — production rollout plan

- **Candidate:** eea55564ebaef4dc2edc7af14586fe8f04324114
- **Current production SHA:** 595a99110367aefb545b02dab4b9f9a5a6106ab6
- **Package state:** READY_FOR_PRODUCTION_ROLLOUT_PENDING_APPROVAL
- **Execution state:** HOLD — preflight evidence incomplete; production was not mutated.

This plan is intentionally ordered around data recovery and environment identity. Do not start the production migration/deployment sequence until the gates below have evidence and the production action is explicitly approved.

## Gate 0 — required before scheduling production

1. **Prove the actual runtime targets.** Through an operator-approved, secret-safe Vercel inspection, record only the Supabase project refs for production database, Auth and durable session backing. The health route does not expose these refs. The prior temporary Vercel env inspection was rejected before execution by automatic command review, so runtime target remains unknown.
2. **Create and restore a database backup.** For the Supabase Free project, create an encrypted offsite pg_dump, record the SHA-256 and retention location without exposing credentials, and restore it to a disposable Supabase-compatible project. Prove schema, data counts, RLS and critical read paths after restore. Supabase database backups documentation notes scheduled daily backups are available on paid plans; Storage objects require a separate object backup.
3. **Reconcile migration history.** Compare each repository file, migration version/name and statement hash with the production and staging ledgers. Resolve aliases from source/control-plane history. Never stamp or repair the ledger merely to suppress a mismatch.
4. **Approve a maintenance window and operator.** Define the write freeze or acceptable write behavior, monitoring owner, abort threshold and decision maker. Preserve the old Vercel deployment for immediate application rollback.
5. **Close staging gaps.** Apply/rehearse the exact migration set on staging only after backup and ledger reconciliation; run the post-migration catalog checks and the staging integration/browser suite again. Confirm storage, cloud grants/policies/functions/triggers, Expert request/assignment and search freshness.

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

These are ordered lists from migration-rehearsal-final.json, not instructions to run blindly. Staging and production ledgers differ; recalculate the pending set after ledger provenance review. After staging migration, verify migration ledger, constraints, indexes, functions/triggers, grants, policy definitions, RLS, preserved pre-existing rows and representative owner-scoped reads/writes. Then run candidate SHA eea55564ebaef4dc2edc7af14586fe8f04324114 against staging and re-export fresh evidence.

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
