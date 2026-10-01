# Database schema drift matrix — pre-reconciliation observations 2026-10-01

This records the read-only metadata snapshot before applying reconciliation. It is historical evidence, not a post-migration readback. The baseline contains 26 canonical repository migrations and 87 application tables. New forward migrations added by the parent runner require a separate post-application artifact.

## Explicit target identity

| Environment | Supabase project ref | Database target | Evidence source |
| --- | --- | --- | --- |
| STAGING | `bniwtkjtramqaozrrtrk` | Supabase public/private schemas of this exact project | Project-specific read-only list_tables(verbose=true) + list_migrations from parent |
| PRODUCTION | `kytdomflmjytzyaabogi` | Supabase public/private schemas of this exact project; official deployed app bound to this ref | Project-specific read-only list_tables(verbose=true) + parent verified deployment/config |

No hostname or demo account naming was used to infer environment. No SQL execution or remote mutation was performed by this artifact task. Tavily remained unused.

## Observed structural divergence

| Metric | Staging | Production |
| --- | --- | --- |
| public/private tables returned | 102 | 65 |
| Canonical application tables present | 82/87 | 65/87 |
| Canonical application tables absent | 5 | 22 |
| Canonical columns absent on present canonical tables | 19 | 6 |
| Tables outside canonical26 | 20 | 0 |
| Canonical present tables with RLS flag disabled | 0 | 0 |
| Complete policy/index/grant/function/trigger match | UNVERIFIED | UNVERIFIED |
| Complete schema fingerprint | NOT ESTABLISHED | NOT ESTABLISHED |

Table counts cannot certify Auth identities, qualification/provisioning, runtime authorization or database backup/recovery. RLS flags alone cannot certify row policies or grants.

## Critical drift and canonical remediation

| Object | Staging observation | Production observation | Reviewed canonical path | Effect / safety condition |
| --- | --- | --- | --- | --- |
| public.community_comments | Absent | Absent | 20260926111838_community_nested_comments.sql | Feed count/subquery and nested thread SELECT fail. Missing table explains existing canonical feed 42P01. Existing migration creates table, same-contribution parent FK, depth/idempotency, indexes and service-only boundary. |
| private.expert_review_requests.community_contribution_id | Present nullable UUID + FK | Absent; 573 review-request rows | 20260926112754_community_expert_request_linkage.sql | Current blind dossier SELECT references column. Existing additive migration preserves requests and adds partial lookup index. |
| public.trust_stage_runs.stage_id | Seven IDs; l2 excluded; 0 reported stage rows | Seven IDs; l2 excluded; 1366 reported stage rows | 20260927032100_trust_four_layer_stage_constraint.sql | Canonical four-layer path requires l2. Existing migration widens named CHECK; existing IDs remain valid, no row rewriting. |
| private.expert_v5_* / expert_mission_* / expert_room_* / expert_verification_rooms / expert_daily_missions | 21 V5 tables present; one question + one room reported | All 21 V5 tables absent | 20260929135354_studenthub_expert_v5_missions_rooms.sql; 20260929135553_expert_v5_trigger_path_and_fk_indexes.sql | Missions/rooms fail with explicit migration-required errors. Existing V5 DDL supplies source/snapshots/questions/missions/room package/adjudication and context; policy seeds are configuration, no demo-content seed. |
| private.reputation_events.context | jsonb NOT NULL DEFAULT {} present | Absent; 328 reputation rows | 20260929135354_studenthub_expert_v5_missions_rooms.sql | Room scoring cap, settlement provenance/idempotency context unavailable until existing additive column is applied. |
| private.reputation_events.idempotency_key | Absent; 0 reputation rows | Nullable unique text present | 202609180001_reputation_events_idempotency.sql | Current ledger writers require unique idempotency. Existing migration adds column+UNIQUE and user lookup index. Table-level metadata does not prove unique index validity. |
| public.academic_workflow_plans/tasks/task_events | All three absent | All three present | 202609170001_durable_academic_workflows.sql | Current task/notification repositories require durable plan/task/event columns and owner/assignee scoping. Existing migration covers the absent tables and notification extension. |
| public.notifications extended columns | 18 absent; base 10 present | All 18 present | 202609170001_durable_academic_workflows.sql | Queries filter status, task_id, notification_key/dedupe_key and schedule timestamps; base table existence alone is insufficient. |
| private.demo_entitlements | Absent | Present | 202609170002_demo_entitlements.sql | Session lookup safely falls back to no QA entitlements when table absent. Existing migration creates an empty legitimate entitlement ledger; it does not reprovision accounts. |
| private.integration_outbox lease/shadow contract | 4 cols + six-state status present; 0 rows | 4 cols absent; status permits only four states; 372 rows | Historical 202609060002 changed after deployed shape; NEW FORWARD MIGRATION REQUIRED | Current dispatch reads lease_count and writes lease_token/lease_count/shadow_count/shadowed_at plus SHADOW/CONFLICT. Additive, guarded forward migration warranted; do not rely on history-version replay. |
| public.profiles.major CHECK | NULL or length<=160 | length<=180 | Existing170003 ADD IF NOT EXISTS cannot change existing CHECK; GUARDED FORWARD RECONCILIATION REQUIRED | Application accepts 180, canonical allows180. Guard constraint provenance/definition before widening to180; retain column/user rows. |
| public.profiles.avatar_id CHECK | NULL or regex ^[a-z0-9-]{1,80}$ | length<=80 | Existing200001 ADD IF NOT EXISTS cannot change existing CHECK; GUARDED FORWARD RECONCILIATION REQUIRED | Canonical presentation contract is length80. Exact constraint names not exposed; do not guess names or remove unrelated checks. Preserve data/roles. |
| public.profiles.academic_year CHECK | NULL or length<=80 | length<=80 | No semantic reconciliation required | Both accept NULL via SQL CHECK semantics and reject text longer than80. Expression formatting differs only. |
| V5 four identity sequence workload privileges | Sequence grants/default privileges UNVERIFIED | V5 sequences not present yet | Existing V5 migration lacks explicit grants; FORWARD EXPLICIT SEQUENCE GRANTS JUSTIFIED | Owner-run DDL success cannot prove workload insert. Grant only backend workload USAGE/SELECT for exact4 sequences after confirming existence/type; no browser grant. |

## Exact observed CHECK differences

Constraint **names are not exposed** by list_tables; these are expressions, not inferred constraint names.

| Column | Staging expression | Production expression | Interpretation |
| --- | --- | --- | --- |
| profiles.major | `major IS NULL OR char_length(major) <= 160` | `char_length(major) <= 180` | Meaningful contract mismatch; canonical/current service permits180. |
| profiles.avatar_id | `avatar_id IS NULL OR avatar_id ~ '^[a-z0-9-]{1,80}$'::text` | `char_length(avatar_id) <= 80` | Meaningful domain restriction mismatch; guard widening against exact known legacy CHECK. |
| profiles.academic_year | `academic_year IS NULL OR char_length(academic_year) <= 80` | `char_length(academic_year) <= 80` | Equivalent for nullable column under SQL CHECK semantics. |
| integration_outbox.status | `status = ANY (ARRAY['PENDING','IN_FLIGHT','DELIVERED','FAILED','SHADOW','CONFLICT'])` | `status = ANY (ARRAY['PENDING','IN_FLIGHT','DELIVERED','FAILED'])` | Production does not accept current SHADOW/CONFLICT writes. |

The static canonical outbox CREATE defines both lease counters nonnegative. Adding columns via historical ADD IF NOT EXISTS statements alone does not prove legacy counter CHECKs exist. A guarded forward migration should check datatype/nullability/default and add/verify exact nonnegative constraints, widening the status set without resetting rows or delivery state.

## Missing canonical columns on present tables

| Environment | Table | Missing columns | Expected source |
| --- | --- | --- | --- |
| STAGING | private.reputation_events | idempotency_key | [202609180001_reputation_events_idempotency.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609180001_reputation_events_idempotency.sql:1) |
| STAGING | public.notifications | notification_key, dedupe_key, task_id, status, priority, source_type, source_id, action_url, due_at, scheduled_at, expires_at, sent_at, acknowledged_at, metadata, history, payload, revision, updated_at | [202609170001_durable_academic_workflows.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170001_durable_academic_workflows.sql:1) |
| PRODUCTION | private.reputation_events | context | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| PRODUCTION | private.integration_outbox | lease_token, lease_count, shadow_count, shadowed_at | New guarded forward migration; historical intent [202609060002_integration_outbox.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060002_integration_outbox.sql:1) |
| PRODUCTION | private.expert_review_requests | community_contribution_id | [20260926112754_community_expert_request_linkage.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260926112754_community_expert_request_linkage.sql:1) |

## Complete canonical table presence matrix

`PRESENT` means table and canonical column names were observed; it does not imply indexes, CHECK/FK semantics, policies, grants or runtime contract are fully matched. Missing columns are reported explicitly. Counts are from read-only metadata and are not application row content.

| Canonical table | Staging observation | Production observation | Canonical defining file |
| --- | --- | --- | --- |
| `public.institutions` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=1; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.profiles` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=20; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `private.roles` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=5; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `private.user_roles` | PRESENT; rows=1; RLS=true; column names complete | PRESENT; rows=24; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `private.server_sessions` | PRESENT; rows=58; RLS=true; column names complete | PRESENT; rows=527; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `private.audit_events` | PRESENT; rows=14; RLS=true; column names complete | PRESENT; rows=1376; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.posts` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=3; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.comments` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=3; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.votes` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=2; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.trust_cases` | PRESENT; rows=7; RLS=true; column names complete | PRESENT; rows=1025; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.case_inputs` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=202; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.entities` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=88; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.case_entities` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=46; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.evidence` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=3; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.claims` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=1; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.claim_sources` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.expert_profiles` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=4; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `private.expert_domains` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=20; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `private.expert_verifications` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=20; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.expert_assessments` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=465; RLS=true; column names complete | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `private.reputation_events` | PRESENT; rows=0; RLS=true; missing: idempotency_key | PRESENT; rows=328; RLS=true; missing: context | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) |
| `public.evidence_passports` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=203; RLS=true; column names complete | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) |
| `public.evidence_passport_events` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=203; RLS=true; column names complete | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) |
| `public.decision_scenarios` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) |
| `public.decision_options` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) |
| `public.case_follows` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) |
| `public.notifications` | PRESENT; rows=0; RLS=true; missing: notification_key, dedupe_key, task_id, status, priority, source_type, source_id, action_url, due_at, scheduled_at, expires_at, sent_at, acknowledged_at, metadata, history, payload, revision, updated_at | PRESENT; rows=0; RLS=true; column names complete | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) |
| `public.screenshot_objects` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=1; RLS=true; column names complete | [202609010001_private_screenshot_storage.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609010001_private_screenshot_storage.sql:1) |
| `public.expert_applications` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=4; RLS=true; column names complete | [202609060001_expert_qualification.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060001_expert_qualification.sql:1) |
| `public.expert_quiz_attempts` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=4; RLS=true; column names complete | [202609060001_expert_qualification.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060001_expert_qualification.sql:1) |
| `public.expert_quiz_answers` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609060001_expert_qualification.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060001_expert_qualification.sql:1) |
| `private.expert_qualification_reviews` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609060001_expert_qualification.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060001_expert_qualification.sql:1) |
| `private.integration_outbox` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=372; RLS=true; missing: lease_token, lease_count, shadow_count, shadowed_at | [202609060002_integration_outbox.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060002_integration_outbox.sql:1) |
| `public.trust_runs` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=584; RLS=true; column names complete | [202609060003_trust_runs_revisions.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060003_trust_runs_revisions.sql:1) |
| `public.trust_stage_runs` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=1366; RLS=true; column names complete | [202609060003_trust_runs_revisions.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060003_trust_runs_revisions.sql:1) |
| `public.trust_case_revisions` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=564; RLS=true; column names complete | [202609060003_trust_runs_revisions.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060003_trust_runs_revisions.sql:1) |
| `public.trust_verdict_revisions` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=202; RLS=true; column names complete | [202609060003_trust_runs_revisions.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060003_trust_runs_revisions.sql:1) |
| `private.report_jobs` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609060004_reports.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060004_reports.sql:1) |
| `private.report_artifacts` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609060004_reports.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060004_reports.sql:1) |
| `private.report_job_events` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609060004_reports.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060004_reports.sql:1) |
| `private.realtime_events` | PRESENT; rows=2; RLS=true; column names complete | PRESENT; rows=2379; RLS=true; column names complete | [202609070001_realtime_event_log.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609070001_realtime_event_log.sql:1) |
| `public.community_source_clusters` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `public.community_contributions` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `public.community_contribution_revisions` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `private.community_file_objects` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `public.community_reactions` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `private.community_quality_events` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `private.community_reaction_events` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `private.expert_assignments` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=2230; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `private.expert_practice_submissions` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=20; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `private.expert_practice_decisions` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `private.expert_quality_events` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `private.expert_review_decisions` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `public.case_appeals` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `private.case_appeal_reviews` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `public.case_corrections` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) |
| `private.expert_review_requests` | PRESENT; rows=7; RLS=true; column names complete | PRESENT; rows=573; RLS=true; missing: community_contribution_id | [202609150004_expert_review_requests.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609150004_expert_review_requests.sql:1) |
| `private.expert_review_request_events` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=328; RLS=true; column names complete | [202609150004_expert_review_requests.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609150004_expert_review_requests.sql:1) |
| `public.academic_workflow_plans` | ABSENT | PRESENT; rows=0; RLS=true; column names complete | [202609170001_durable_academic_workflows.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170001_durable_academic_workflows.sql:1) |
| `public.academic_workflow_tasks` | ABSENT | PRESENT; rows=0; RLS=true; column names complete | [202609170001_durable_academic_workflows.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170001_durable_academic_workflows.sql:1) |
| `public.academic_workflow_task_events` | ABSENT | PRESENT; rows=0; RLS=true; column names complete | [202609170001_durable_academic_workflows.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170001_durable_academic_workflows.sql:1) |
| `private.demo_entitlements` | ABSENT | PRESENT; rows=20; RLS=true; column names complete | [202609170002_demo_entitlements.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170002_demo_entitlements.sql:1) |
| `public.user_timetables` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=3; RLS=true; column names complete | [202609170004_academic_timetables.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170004_academic_timetables.sql:1) |
| `public.timetable_entries` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=6; RLS=true; column names complete | [202609170004_academic_timetables.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170004_academic_timetables.sql:1) |
| `public.timetable_reminders` | PRESENT; rows=0; RLS=true; column names complete | PRESENT; rows=0; RLS=true; column names complete | [202609170004_academic_timetables.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170004_academic_timetables.sql:1) |
| `public.community_comments` | ABSENT | ABSENT | [20260926111838_community_nested_comments.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260926111838_community_nested_comments.sql:1) |
| `private.expert_v5_config` | PRESENT; rows=13; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_mission_level_policy` | PRESENT; rows=5; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_v5_source_registry` | PRESENT; rows=2; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_v5_source_events` | PRESENT; rows=9; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_v5_source_snapshots` | PRESENT; rows=7; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_v5_ingestion_requests` | PRESENT; rows=7; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_v5_questions` | PRESENT; rows=1; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_v5_question_events` | PRESENT; rows=2; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_mission_progression` | PRESENT; rows=0; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_daily_missions` | PRESENT; rows=0; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_mission_attempts` | PRESENT; rows=0; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_mission_answers` | PRESENT; rows=0; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_mission_events` | PRESENT; rows=0; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_room_presence` | PRESENT; rows=0; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_verification_rooms` | PRESENT; rows=1; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_room_participants` | PRESENT; rows=1; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_room_rounds` | PRESENT; rows=0; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_room_answers` | PRESENT; rows=0; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_room_evidence_packages` | PRESENT; rows=0; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_room_adjudications` | PRESENT; rows=0; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |
| `private.expert_room_events` | PRESENT; rows=2; RLS=true; column names complete | ABSENT | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) |

## Staging-only legacy/schema objects preserved

The following 20 tables are outside the canonical26 creation set. The parent provenance task attributes them to earlier CommunityMax/ExpertV3/security history. This matrix does not classify them as garbage, does not authorize removal, and does not require copying them into production.

| Staging-only extra table | Rows reported | RLS flag | Action |
| --- | --- | --- | --- |
| `private.security_outbox` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `public.expert_progression_projections` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `public.community_perception_votes` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `private.community_perception_events` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `private.moderation_cases` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `private.moderation_votes` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `private.moderation_events` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `public.moderation_appeals` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `public.community_source_references` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `public.community_source_change_events` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `public.community_verification_projections` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `public.community_claim_discussions` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `public.community_discussion_summaries` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `private.community_review_candidates` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `private.community_expert_requests` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `public.community_campus_contexts` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `private.community_risk_clusters` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `private.community_risk_cluster_members` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `public.community_correction_records` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |
| `private.community_data_candidates` | 0 | true | PRESERVE; confirm historical code/schema provenance and active dependency before any cleanup |

Staging also has `public.profiles.institution_label` (nullable text; CHECK null or length<=200). It is absent from canonical26/prod and should be preserved. Its presence does not replace the canonical `university` column.

## Foreign-key evidence and limitations

list_tables includes both incoming and outgoing FK entries for a table. Entries were compared by source/target column tuple rather than by array order. The shared canonical tables' reported FK differences are attributable to environment-only tables or the missing Community→Expert linkage. In particular:
- Staging reports `expert_review_requests(community_contribution_id) → community_contributions(id)`; production lacks the column/FK.
- Production reports `academic_workflow_tasks(trust_case_id) → trust_cases(id)`; staging lacks that workflow table.
- Legacy staging tables add incoming institution/claim/contribution/verification FKs; they are preserved.
- Metadata exposes FK column identities, not ON DELETE/ON UPDATE action or deferrability. Those complete remote semantics remain UNVERIFIED.
- Canonical community_comments composite parent FK and V5 question/version FKs must be demonstrated after applying missing migrations; table existence alone is insufficient.

## Migration history cannot substitute for shape

The remote histories use different versions/names than repository files for several foundation/hardening objects. A missing matching repository version in list_migrations does not prove the corresponding objects are absent; conversely an applied logical migration name does not prove current source content matches the executed historical file.

Safe paths:
1. Existing additive canonical migrations for actual absent tables/columns: academic workflows+notification extension, demo entitlements, reputation idempotency, nested comments, review-request linkage, Trust l2 and Expert V5 with follow-up.
2. A new forward outbox migration is justified because actual production shape demonstrably lacks functionality now present in historically edited 202609060002.
3. A new guarded profile CHECK reconciliation is justified because ADD IF NOT EXISTS cannot update staging's existing160/regex restrictions.
4. An explicit guarded V5 sequence-grant migration is justified to make intended backend workload privilege independent of unknown default grants.
5. Any existing column/type/counter/check incompatibility outside these known shapes is a stop condition for that migration; do not blindly coerce or drop data.

Fresh PostgreSQL bootstrap PASS is not a complete production-like upgrade test. Staging must be reconciled and verified first. Production mutation remains gated on disposable upgrade passes, migration risk review, backup/recovery protection and staging live evidence as specified by the user's release prompts.

## Unverified metadata matrix

| Property | Repository intended definition | Staging remote proof | Production remote proof |
| --- | --- | --- | --- |
| Table/column existence and reported PK/FK identity | Recorded in EXPECTED_DATABASE_CONTRACT | OBSERVED; drift above | OBSERVED; drift above |
| Column types/default/nullable and exposed CHECKs | Exact baseline SQL in contract appendix | Partially observed; critical deltas recorded | Partially observed; critical deltas recorded |
| All CHECKs including multi-column constraints | Exact baseline SQL | UNVERIFIED | UNVERIFIED |
| Index definitions, uniqueness, predicates, validity | Exact baseline SQL | UNVERIFIED | UNVERIFIED |
| RLS enabled flags | Enabled for87 canonical tables | TRUE on all82 present canonical tables | TRUE on all65 present canonical tables |
| Policy role targets/USING/WITH CHECK | Exact baseline SQL | UNVERIFIED | UNVERIFIED |
| Browser table/column/private schema grants | Exact baseline SQL | UNVERIFIED | UNVERIFIED |
| Backend workload table/sequence/default privileges | Exact baseline SQL; V5 explicit sequence gap identified | UNVERIFIED | UNVERIFIED |
| Function ownership/security/search_path/EXECUTE | Exact baseline SQL | UNVERIFIED | UNVERIFIED |
| Trigger presence/attachment/enabled state | Exact baseline SQL | UNVERIFIED | UNVERIFIED |
| Storage bucket/policies/private object access | Screenshot/private file boundary | UNVERIFIED | UNVERIFIED |
| Backup/restore/PITR/recovery success | External release gate | UNVERIFIED | UNVERIFIED |
| Live RLS multi-principal tests | User-role canonical flow required | NOT ESTABLISHED BY THIS TASK | NOT ESTABLISHED BY THIS TASK |

## Verdict at this snapshot

```ini
REPOSITORY_CANONICAL_BASELINE=26_MIGRATIONS_87_APPLICATION_TABLES
STAGING_SCHEMA_DRIFT=CONFIRMED
PRODUCTION_SCHEMA_DRIFT=CONFIRMED
STAGING_SCHEMA_SYNC=NOT_YET_PASS
PRODUCTION_SCHEMA_SYNC=NOT_YET_PASS
FULL_REMOTE_SCHEMA_FINGERPRINT=UNVERIFIED
PRODUCTION_MIGRATION_GATE=NOT_SATISFIED_BY_THIS_ARTIFACT
MAIN_PROMOTION_GATE=NOT_SATISFIED_BY_THIS_ARTIFACT
```

## Current production/staging readback — 2026-10-01

Read-only Supabase project metadata and verbose `list_tables` were queried again
for the exact refs below. This section supersedes earlier counts in this
historical matrix. The tool exposes table/column details, primary keys and
foreign keys; it does not return the complete indexes, policy/grant, function,
or trigger catalog. Those categories remain `UNKNOWN`, not zero.

| Environment | Project ref | Tables | Columns | Tables with RLS enabled | Migration ledger entries |
|---|---|---:|---:|---:|---:|
| Production | `kytdomflmjytzyaabogi` | 65 | 694 | 65/65 | 10 |
| Staging | `bniwtkjtramqaozrrtrk` | 107 | 1,157 | 107/107 | 16 |
| Canonical source fingerprint | n/a | 87 | 918 | 87 expected | 29 tracked files |

Production has no extra table names relative to the current 87-table source
fingerprint. It is missing these 22 canonical tables:

`private.expert_daily_missions`, `private.expert_mission_answers`,
`private.expert_mission_attempts`, `private.expert_mission_events`,
`private.expert_mission_level_policy`, `private.expert_mission_progression`,
`private.expert_room_adjudications`, `private.expert_room_answers`,
`private.expert_room_events`, `private.expert_room_evidence_packages`,
`private.expert_room_participants`, `private.expert_room_presence`,
`private.expert_room_rounds`, `private.expert_v5_config`,
`private.expert_v5_ingestion_requests`, `private.expert_v5_question_events`,
`private.expert_v5_questions`, `private.expert_v5_source_events`,
`private.expert_v5_source_registry`, `private.expert_v5_source_snapshots`,
`private.expert_verification_rooms`, `public.community_comments`.

On tables that do exist in production, these six canonical columns are absent:

| Table | Missing column |
|---|---|
| `private.expert_review_requests` | `community_contribution_id` |
| `private.integration_outbox` | `lease_count` |
| `private.integration_outbox` | `lease_token` |
| `private.integration_outbox` | `shadow_count` |
| `private.integration_outbox` | `shadowed_at` |
| `private.reputation_events` | `context` |

The 918-versus-694 total column delta includes every column on the 22 missing
tables; it must not be reported as only six missing columns. The FK metadata
also confirms the missing contribution-link FK on
`private.expert_review_requests`; FKs owned by absent tables cannot be present.
The canonical fingerprint contains 185 FK constraints, including 46 whose
source tables are among the 22 absent tables. Of the 139 expected FKs on tables
that are present, the one missing link above is not reported, so the observed
expected-FK gap is 47 in total.

RLS enabled on a table is only metadata. It does not establish that the required
policies, grants, ownership predicates, or role behavior are correct. No policy
behavior test, production persona login, API mutation, production migration, or
storage/realtime data scenario was run. Staging's 107-table/1,157-column shape
also differs in count from the 87-table/918-column canonical fingerprint; its
extra objects have not been classified in this production-only campaign.

```ini
PRODUCTION_TABLE_COLUMN_MATCH = NO
PRODUCTION_MISSING_TABLES = 22
PRODUCTION_MISSING_COLUMNS_ON_PRESENT_TABLES = 6
PRODUCTION_EXPECTED_FK_GAP = 47 (46 owned by missing tables, 1 on a present table)
PRODUCTION_MISSING_INDEXES = UNKNOWN
PRODUCTION_MISSING_POLICIES = UNKNOWN
PRODUCTION_MISSING_GRANTS = UNKNOWN
PRODUCTION_MISSING_FUNCTIONS = UNKNOWN
PRODUCTION_MISSING_TRIGGERS = UNKNOWN
STAGING_EXACT_SCHEMA_MATCH = NOT_ESTABLISHED
```

A post-reconciliation readback must record the new migration history and re-evaluate every confirmed delta; it must retain UNVERIFIED labels for metadata not actually observed.
