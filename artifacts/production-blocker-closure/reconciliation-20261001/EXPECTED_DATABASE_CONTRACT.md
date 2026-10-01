# Expected database contract — canonical baseline 2026-10-01

Scope: the 26 canonical migrations present at reconciliation start plus current application callers in the isolated integration worktree. Production project: `kytdomflmjytzyaabogi`; staging project: `bniwtkjtramqaozrrtrk`. Environment identity is supplied by project-specific read-only Supabase calls, not inferred from account names.

This artifact is a static application contract and an evidence map. It does not authorize SQL execution. No remote database mutation, account provisioning, credential export, role/progression edit, or provider request was performed while preparing it.

## Evidence boundaries

- All 26 migration files were read. They create 87 application tables in `public`/`private`; Supabase-owned Auth/Storage objects are external prerequisites.
- The parent run passed those 26 migrations on disposable PostgreSQL 17.6 with minimal Auth/Storage bootstrap. That proves SQL execution on the disposable substrate. It does not prove a complete Supabase installation, remote RLS behavior, browser grants, default privileges, trigger identity, or production upgrade compatibility.
- Read-only `list_tables(verbose=true)` provides table/column names, types, nullable flags, defaults, selected CHECK expressions, primary keys, foreign-key identities, RLS-enabled flags and reported row counts. These counts are observations, not immutable snapshots.
- Remote policy bodies, indexes/partial predicates, uniqueness beyond reported column flags, table/column/sequence grants, function ownership/search paths/EXECUTE grants, trigger attachment/enabled state, default privileges, and Storage policies are **UNVERIFIED**. No complete remote schema fingerprint is claimed.
- Qualified identifier callers below are a static trace of current source files; a reference alone is not proof the route executes in a deployed build. Tables without a current caller remain preserved schema, not cleanup candidates.

## Application authority contract

| Area | Canonical authority and required invariants |
| --- | --- |
| Auth / sessions | `auth.users.id` is the identity join key; `private.user_roles + private.roles` provide authorization; `private.server_sessions` stores only token/JTI hashes and explicit idle/absolute expiry/revocation. Role or scope authority never comes from user metadata. Session lookup updates last-seen; it is a controlled auth mutation even when an application GET is used. |
| Profiles / onboarding | `public.profiles` presentation fields are separate from role/trust/Expert authority. Canonical limits: display_name 1–120, bio <=1000, university/major <=180, avatar_id/academic_year <=80. `onboarded` is a server-controlled boolean. Compatibility for legacy full_name/github_username is conditional on column discovery and does not make either a mandatory canonical column. |
| Trust graph | Owner-scoped case, inputs, entities, evidence, claims and source relations; content/payload digests and confidence bounds are required. Browser grants on private graph objects must remain revoked despite the public schema name. |
| Trust runs / provenance | Unique owner/idempotency-key for non-null keys, unique case/revision, unique run/stage/attempt. `trust_stage_runs.stage_id` must include `l2` after 20260927032100 as well as legacy l2a/l2b/l2c; stage_index remains 0–6. Revisions pin run identity; historical revision replay must not silently overwrite another run. |
| Community | Current feed reads `community_contributions` with case visibility and exact case revision; feed comment count and nested thread reads require `community_comments`. Legacy `posts/comments/votes` and canonical contributions are distinct tables. Comments are server-owned, maximum depth 3, same-contribution composite parent FK and owner/idempotency uniqueness. |
| Trust ↔ Expert bridge | Review requests pin case revision/claim/domain, private requester key/digest and state machine; assignment is a separate coordinator operation. `community_contribution_id` links the redacted Community dossier and is required by current blind-review SQL. |
| Expert authority | ACTIVE application plus `EXPERT` role, durable Expert profile and verified/unsuspended/unexpired DOMAIN_VERIFIED scopes. Verification and assignment revisions feed immutable assessment snapshots; scope, assignment, COI, evidence revisions and qualification policy must be preserved. |
| Expert reputation | `private.reputation_events` is the canonical reputation ledger; current own profile sums delta. Idempotency_key must be unique; V5 `context` stores settlement/source provenance. `expert_quality_events` is a distinct scope quality ledger. Mission_level is separate from reputation stars. No direct-edit test values are allowed. |
| Source/question bank | Registry host/policy quotas → immutable SUCCESS/BLOCKED/UNAVAILABLE snapshots → versioned questions with real evidence refs/content hash/editorial activation → mission attempts. Source absence/blocking never fabricates content or authority. Answer keys remain private. |
| Daily missions | Unique user/date/type/domain, pinned question version, server deadlines and one mission/user attempt. Correctness and progression are server-owned; append-only answers/events and idempotency prevent duplicate progression. Current GET getDailyMissions is read-only; expiry belongs to assignment POST. |
| Live Room | Server-selected qualified supervisor, leased presence, participant role/state and COI; server-owned round timer, one answer/expert/round, private responses until allowed projection, immutable Evidence Package, evidence-backed supervisor proposal/confirmation, Host acknowledgement or dispute, idempotent settlement and daily cap via ledger context. TEXT/URL/IMAGE/QR use the same Trust boundary. |
| Realtime | `private.realtime_events` is append-only; event_id + channel/idempotency uniqueness and ordered sequence enable reconnect replay/deduplication. SSE/broadcast authorization remains application-side, not proven by schema existence. |
| Reports | Private job state + artifact + sequenced events; immutable revision/owner-pinned evidence snapshot and owner/idempotency uniqueness. A READY row cannot be assumed without hash/artifact verification. |
| Notifications / academic | Current repositories require all 18 notification extension columns and durable plans/tasks/events; owner/assignee scoping and notification dedupe/revision are required. Timetable entry/reminder composite FKs bind the owner to the timetable. |
| Demo access | Dedicated private demo entitlements are additional authorized test access, not authorization role replacement. Missing entitlements have a compatibility fallback to absent access, never inferred from an email name. |
| Outbox | event_id/payload_hash uniqueness; delivery lease_token protects stale worker writes, lease_count tracks acquisition, shadow_count/shadowed_at track suppressed exercises; status accepts PENDING/IN_FLIGHT/DELIVERED/FAILED/SHADOW/CONFLICT. Existing non-LABBE INTERNAL events stay local. |
| Screenshots / files | Screenshot metadata owner/case FK, private bucket, allowed image MIME and <=8MiB bounds, digest/object-key/retention; private community original object keys are excluded from public DTOs. Actual remote Storage config/policies remain UNVERIFIED. |

## Foreign-key and index assumptions that must be tested

- Composite comment parent `(parent_comment_id, contribution_id)` references `community_comments(id, contribution_id)`; a parent in another contribution must fail.
- Timetable `(timetable_id,user_id)` and reminder `(entry_id,user_id)` references prevent cross-owner rows.
- Versioned V5 questions use composite `(question_id,question_version)` PK/FKs across question events, missions and attempts.
- Room current_round/evidence_package FKs are added after dependent tables; round/package uniqueness supports one canonical record per round.
- Partial unique indexes are integral: active quiz/application, owner/idempotency, active assignment, reaction claim/revision/kind, one quality reversal, active timetable, reminder offsets, source content hash and active review-request scope. `list_tables` does not expose these predicates; their remote existence is UNVERIFIED.
- Existing unique/index names do not guarantee equivalent definitions. Upgrade assurance must check definition, validity, NULL handling and expected conflict target before relying on ON CONFLICT.

## RLS, grants, functions and triggers

All 87 canonical application tables must have RLS enabled. The source definitions below are the intended contract. A remote `rls_enabled=true` flag is only one part of assurance; policies and grants must be checked separately.

Browser grants are deliberately narrow: own profile presentation; redacted legacy forum columns; public Expert profile projection; owner qualification/runs/revisions/passport/decision/notification reads; owner/assignee academic reads; owner-scoped timetable CRUD. Canonical Community contributions/comments/reactions, assessments, graph inputs/evidence/claims and all private authority/ledgers are server-controlled. Private schema usage and browser table privileges are revoked. Backend service-role grants appearing in migration DDL document the intended workload contract and do not authorize using that role as a testing bypass.

Trigger expectations include Auth new-user profile/STUDENT initialization; Expert verification/assignment revision bumps; Promax history mutation rejection; realtime update/delete rejection; review-request-event immutability; V5 source snapshot/source event/mission answer/room answer/package/room event/mission event/question event immutability. Remote function definitions, owners, search paths, EXECUTE grants and trigger state are UNVERIFIED.

**Privilege gap requiring assurance:** V5 creates four identity sequences (`expert_v5_source_events_id_seq`, `expert_v5_question_events_id_seq`, `expert_mission_events_id_seq`, `expert_room_events_id_seq`) and grants table DML in a dynamic loop but contains no explicit sequence USAGE/SELECT grant. Foundation's earlier ALL SEQUENCES grant does not cover subsequently created sequences. Supabase default privileges may cover them; this must be proven, not assumed. Owner-only fresh migration execution cannot demonstrate workload-role inserts.

Some historical trigger functions are SECURITY DEFINER with `search_path=private`; the V5 follow-up pins its trigger to `pg_catalog`. Private schema browser revocation is expected to contain private function reachability, but default EXECUTE privileges and actual ownership remain separate unverified properties.

## Full table and caller map

Column names below are the union of CREATE TABLE definitions and forward ADD COLUMN statements in the 26-file baseline, in replay order. Exact types/defaults/CHECK/FK/index/security definitions are captured in the source contract appendix; they are not reconstructed from deployed metadata. Current source references are included for every table where found.

| Table | Canonical columns | Defining migration | Current caller evidence |
| --- | --- | --- | --- |
| `public.institutions` | `id`, `slug`, `name`, `verified_domains`, `created_at`, `updated_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | No qualified current source caller found; preserve |
| `public.profiles` | `id`, `institution_id`, `display_name`, `avatar_url`, `bio`, `created_at`, `updated_at`, `onboarded`, `university`, `major`, `avatar_id`, `academic_year` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [route.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/app/api/community/social/route.js:88); [AuthContext.jsx](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/auth/AuthContext.jsx:74); [authService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/auth/authService.js:409); [PostgresForumRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/forum/PostgresForumRepository.js:52); [PostgresSessionRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/security/identity/PostgresSessionRepository.js:22); [UserProfileRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/UserProfileRepository.js:64) |
| `private.roles` | `id`, `code`, `description` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [PostgresSessionRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/security/identity/PostgresSessionRepository.js:64); [CommunityExpertScope.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityExpertScope.js:57); [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:1170); [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:657) |
| `private.user_roles` | `user_id`, `role_id`, `granted_by`, `granted_at`, `revoked_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [OidcTokenVerifier.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/security/identity/OidcTokenVerifier.js:82); [PostgresSessionRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/security/identity/PostgresSessionRepository.js:64); [CommunityExpertScope.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityExpertScope.js:57); [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:1170); [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:657) |
| `private.server_sessions` | `token_hash`, `user_id`, `auth_provider`, `upstream_jti_hash`, `created_at`, `last_seen_at`, `idle_expires_at`, `expires_at`, `revoked_at`, `revocation_reason`, `session_version`, `user_agent_hash` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [PostgresSessionRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/security/identity/PostgresSessionRepository.js:37) |
| `private.audit_events` | `id`, `event_type`, `actor_id`, `target_type`, `target_id`, `request_id`, `occurred_at`, `metadata` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [PostgresSessionRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/security/identity/PostgresSessionRepository.js:43); [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:233); [TrustPersistenceService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/TrustPersistenceService.js:251) |
| `public.posts` | `id`, `author_id`, `title`, `content`, `category`, `location_tag`, `images`, `links`, `status`, `created_at`, `updated_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [route.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/app/api/community/social/route.js:87); [PostgresForumRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/forum/PostgresForumRepository.js:30); [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:319); [UserProfileService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/profile/UserProfileService.js:274) |
| `public.comments` | `id`, `post_id`, `author_id`, `content`, `status`, `created_at`, `updated_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [route.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/app/api/community/social/route.js:90); [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:348); [UserProfileService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/profile/UserProfileService.js:278) |
| `public.votes` | `post_id`, `user_id`, `value`, `created_at`, `updated_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [route.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/app/api/community/social/route.js:89); [PostgresForumRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/forum/PostgresForumRepository.js:53); [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:362) |
| `public.trust_cases` | `id`, `owner_id`, `state`, `visibility`, `created_at`, `updated_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [CommunityExpertScope.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityExpertScope.js:14); [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:543); [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:84); [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:734); [TrustGraphService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/TrustGraphService.js:31); [TrustPersistenceService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/TrustPersistenceService.js:245); [ExpertBlindReviewDispatcher.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewDispatcher.js:71); [ExpertBlindReviewService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewService.js:87); [ExpertProfileService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/profile/ExpertProfileService.js:115); [UserProfileService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/profile/UserProfileService.js:232); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:201) |
| `public.case_inputs` | `id`, `case_id`, `input_type`, `object_key`, `content_hash`, `created_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:105); [TrustGraphService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/TrustGraphService.js:32); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:243) |
| `public.entities` | `id`, `entity_type`, `normalized_value`, `value_hash`, `created_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:128); [TrustGraphService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/TrustGraphService.js:36) |
| `public.case_entities` | `case_id`, `entity_id`, `relation_type`, `confidence` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:142); [TrustGraphService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/TrustGraphService.js:35) |
| `public.evidence` | `id`, `case_id`, `source_type`, `source_identifier`, `observed_at`, `extractor_version`, `confidence`, `provenance`, `created_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [CommunityExpertScope.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityExpertScope.js:23); [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:164); [TrustGraphService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/TrustGraphService.js:44); [ExpertBlindReviewService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewService.js:217); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:248) |
| `public.claims` | `id`, `creator_id`, `statement`, `status`, `valid_from`, `valid_to`, `superseded_by`, `created_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:191); [TrustGraphService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/TrustGraphService.js:42); [ExpertBlindReviewService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewService.js:212); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:256) |
| `public.claim_sources` | `claim_id`, `evidence_id`, `relation` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [CommunityExpertScope.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityExpertScope.js:23); [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:214); [TrustGraphService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/TrustGraphService.js:43); [ExpertBlindReviewService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewService.js:216); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:257) |
| `public.expert_profiles` | `user_id`, `public_title`, `public_bio`, `created_at`, `updated_at` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:124); [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:824); [ExpertProfileService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/profile/ExpertProfileService.js:80) |
| `private.expert_domains` | `user_id`, `domain_code`, `evidence_count` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | No qualified current source caller found; preserve |
| `private.expert_verifications` | `id`, `user_id`, `domain_code`, `status`, `verified_by`, `verified_at`, `evidence_ref`, `expires_at`, `suspended_at`, `qualification_state`, `revision` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:125); [ExpertBlindReviewDispatcher.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewDispatcher.js:129); [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:144); [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:546); [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:164) |
| `public.expert_assessments` | `id`, `expert_id`, `case_id`, `domain_code`, `assessment`, `confidence`, `created_at`, `assignment_id`, `case_revision`, `claim_id`, `evidence_revision_ids`, `assessment_state`, `conclusion_within_scope`, `reasoning`, `uncertainty`, `missing_evidence`, `coi_declared`, `policy_version`, `idempotency_key`, `request_digest`, `verification_id`, `verification_revision`, `verified_domain`, `verification_status`, `verification_qualification_state`, `verification_expires_at`, `verification_suspended_at`, `assignment_revision`, `coi_state`, `coi_declaration_ref`, `qualification_policy_version`, `submitted_at`, `authority_snapshot_version`, `authority_snapshot_digest`, `authority_snapshot` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:221); [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:555); [ExpertBlindReviewDispatcher.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewDispatcher.js:292); [ExpertBlindReviewService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewService.js:246); [ExpertProfileService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/profile/ExpertProfileService.js:114) |
| `private.reputation_events` | `id`, `user_id`, `domain_code`, `event_type`, `delta`, `reason`, `actor_id`, `created_at`, `idempotency_key`, `context` | [202608270001_v2_authority_foundation.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608270001_v2_authority_foundation.sql:1) | [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:712); [ExpertBlindReviewService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewService.js:558); [ExpertReputationPolicy.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertReputationPolicy.js:33); [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:931); [ExpertProfileService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/profile/ExpertProfileService.js:125) |
| `public.evidence_passports` | `id`, `owner_id`, `title`, `subject_type`, `subject_id`, `current_status`, `revision`, `demo`, `created_at`, `updated_at` | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) | [PostgresCrossSystemRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/intelligence/crossSystem/PostgresCrossSystemRepository.js:42); [TrustCasePassportBinder.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/intelligence/passport/TrustCasePassportBinder.js:8) |
| `public.evidence_passport_events` | `id`, `passport_id`, `revision`, `event_type`, `provenance_class`, `summary`, `previous_status`, `new_status`, `material`, `change_reason`, `source_references`, `metadata`, `occurred_at`, `created_at` | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) | [PostgresCrossSystemRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/intelligence/crossSystem/PostgresCrossSystemRepository.js:58); [TrustCasePassportBinder.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/intelligence/passport/TrustCasePassportBinder.js:8) |
| `public.decision_scenarios` | `id`, `owner_id`, `title`, `current_state`, `evaluation_method`, `recommendation_state`, `recommended_option_key`, `unknowns`, `demo`, `created_at` | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) | [PostgresCrossSystemRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/intelligence/crossSystem/PostgresCrossSystemRepository.js:138) |
| `public.decision_options` | `id`, `scenario_id`, `option_key`, `label`, `summary`, `next_action`, `factors`, `consequences`, `total_cost`, `rank` | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) | [PostgresCrossSystemRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/intelligence/crossSystem/PostgresCrossSystemRepository.js:148) |
| `public.case_follows` | `owner_id`, `passport_id`, `created_at` | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:377) |
| `public.notifications` | `id`, `owner_id`, `notification_type`, `subject_type`, `subject_id`, `material_change_revision`, `title`, `body`, `read_at`, `created_at`, `notification_key`, `dedupe_key`, `task_id`, `status`, `priority`, `source_type`, `source_id`, `action_url`, `due_at`, `scheduled_at`, `expires_at`, `sent_at`, `acknowledged_at`, `metadata`, `history`, `payload`, `revision`, `updated_at` | [202608290001_feature_freeze_cross_system.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202608290001_feature_freeze_cross_system.sql:1) | [PostgresCrossSystemRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/intelligence/crossSystem/PostgresCrossSystemRepository.js:115); [AcademicNotificationRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/AcademicNotificationRepository.js:109) |
| `public.screenshot_objects` | `id`, `owner_id`, `case_id`, `bucket_id`, `object_key`, `mime_type`, `byte_size`, `sha256`, `created_at`, `expires_at`, `deleted_at` | [202609010001_private_screenshot_storage.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609010001_private_screenshot_storage.sql:1) | [MediaArtifactService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/media/MediaArtifactService.js:256) |
| `public.expert_applications` | `id`, `user_id`, `status`, `profile_snapshot`, `requested_domains`, `approved_domains`, `created_at`, `updated_at`, `reviewed_at`, `reviewed_by` | [202609060001_expert_qualification.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060001_expert_qualification.sql:1) | [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:290); [readiness.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/health/readiness.js:62) |
| `public.expert_quiz_attempts` | `id`, `application_id`, `user_id`, `quiz_version`, `question_ids`, `status`, `started_at`, `deadline_at`, `submitted_at`, `score`, `max_score`, `created_at` | [202609060001_expert_qualification.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060001_expert_qualification.sql:1) | [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:270); [readiness.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/health/readiness.js:63) |
| `public.expert_quiz_answers` | `attempt_id`, `user_id`, `question_id`, `answer`, `answered_at` | [202609060001_expert_qualification.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060001_expert_qualification.sql:1) | [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:258); [readiness.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/health/readiness.js:64) |
| `private.expert_qualification_reviews` | `id`, `application_id`, `user_id`, `reviewer_id`, `decision`, `approved_domains`, `reason`, `created_at` | [202609060001_expert_qualification.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060001_expert_qualification.sql:1) | [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:712) |
| `private.integration_outbox` | `id`, `event_id`, `integration`, `aggregate_type`, `aggregate_id`, `event_type`, `schema_version`, `occurred_at`, `produced_at`, `producer`, `environment`, `correlation_id`, `causation_id`, `subject`, `classification`, `payload`, `payload_hash`, `status`, `attempts`, `available_at`, `leased_until`, `lease_token`, `lease_count`, `shadow_count`, `shadowed_at`, `last_error`, `created_at`, `updated_at`, `delivered_at` | [202609060002_integration_outbox.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060002_integration_outbox.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:173); [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:324); [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:101); [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:76); [readiness.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/health/readiness.js:65); [LabbeOutboxService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/integrations/LabbeOutboxService.js:68) |
| `public.trust_runs` | `id`, `case_id`, `owner_id`, `request_id`, `idempotency_key`, `input_fingerprint`, `status`, `pipeline_version`, `started_at`, `completed_at`, `created_at` | [202609060003_trust_runs_revisions.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060003_trust_runs_revisions.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:687); [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:248); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:225) |
| `public.trust_stage_runs` | `id`, `run_id`, `case_id`, `owner_id`, `stage_id`, `stage_index`, `status`, `attempt`, `request_id`, `started_at`, `completed_at`, `latency_ms`, `result_digest`, `summary`, `created_at` | [202609060003_trust_runs_revisions.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060003_trust_runs_revisions.sql:1) | [continuation.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/app/api/v1/trust/continue/continuation.js:80); [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:266); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:237) |
| `public.trust_case_revisions` | `id`, `case_id`, `owner_id`, `revision`, `run_id`, `state`, `snapshot`, `created_at` | [202609060003_trust_runs_revisions.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060003_trust_runs_revisions.sql:1) | [CommunityExpertScope.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityExpertScope.js:20); [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:683); [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:280); [ExpertBlindReviewDispatcher.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewDispatcher.js:263); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:211) |
| `public.trust_verdict_revisions` | `id`, `case_id`, `owner_id`, `revision`, `run_id`, `verdict`, `decision_digest`, `created_at` | [202609060003_trust_runs_revisions.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060003_trust_runs_revisions.sql:1) | [DurableTrustRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/DurableTrustRepository.js:295); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:231) |
| `private.report_jobs` | `id`, `owner_id`, `report_type`, `subject_type`, `subject_id`, `snapshot_revision`, `status`, `template_version`, `policy_version`, `request_fingerprint`, `idempotency_key`, `artifact_hash`, `failure_code`, `generated_at`, `created_at`, `updated_at` | [202609060004_reports.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060004_reports.sql:1) | [readiness.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/health/readiness.js:66); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:311) |
| `private.report_artifacts` | `report_id`, `snapshot_revision`, `document`, `artifact_hash`, `created_at` | [202609060004_reports.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060004_reports.sql:1) | [readiness.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/health/readiness.js:67); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:103) |
| `private.report_job_events` | `report_id`, `sequence`, `from_status`, `to_status`, `metadata`, `occurred_at` | [202609060004_reports.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609060004_reports.sql:1) | [readiness.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/health/readiness.js:68); [ReportService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/reports/ReportService.js:192) |
| `private.realtime_events` | `sequence`, `event_id`, `channel`, `event_type`, `subject_id`, `classification`, `producer`, `environment`, `correlation_id`, `causation_id`, `payload`, `payload_hash`, `idempotency_key`, `occurred_at`, `recorded_at`, `expires_at` | [202609070001_realtime_event_log.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609070001_realtime_event_log.sql:1) | [readiness.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/health/readiness.js:69); [DurableRealtimeRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/realtime/DurableRealtimeRepository.js:249) |
| `public.community_source_clusters` | `id`, `canonical_locator`, `publisher`, `independence_key`, `content_digest`, `source_count`, `created_at`, `updated_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:282) |
| `public.community_contributions` | `id`, `author_id`, `case_id`, `case_revision`, `claim_id`, `contribution_type`, `publication_state`, `evidence_state`, `review_state`, `revision`, `statement`, `public_statement`, `evidence_revision_ids`, `source_refs`, `source_cluster_id`, `content_digest`, `privacy_findings`, `idempotency_key`, `created_at`, `updated_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:431); [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:286); [TrustPersistenceService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/TrustPersistenceService.js:179); [ExpertBlindReviewDispatcher.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewDispatcher.js:246); [ExpertBlindReviewService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewService.js:85) |
| `public.community_contribution_revisions` | `id`, `contribution_id`, `revision`, `statement`, `public_statement`, `evidence_revision_ids`, `source_refs`, `content_digest`, `privacy_findings`, `created_by`, `created_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:457) |
| `private.community_file_objects` | `id`, `contribution_id`, `owner_id`, `case_id`, `case_revision`, `original_object_key`, `public_derivative_object_key`, `scan_state`, `mime_type`, `byte_size`, `sha256`, `metadata`, `created_at`, `updated_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | No qualified current source caller found; preserve |
| `public.community_reactions` | `id`, `user_id`, `contribution_id`, `claim_id`, `case_revision`, `kind`, `value`, `idempotency_key`, `created_at`, `updated_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:701) |
| `private.community_quality_events` | `id`, `subject_id`, `actor_id`, `contribution_id`, `case_id`, `case_revision`, `event_type`, `point_delta`, `reason`, `idempotency_key`, `request_digest`, `created_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:198) |
| `private.community_reaction_events` | `id`, `event_id`, `user_id`, `contribution_id`, `claim_id`, `case_revision`, `kind`, `value`, `idempotency_key`, `request_digest`, `created_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:1006) |
| `private.expert_assignments` | `id`, `expert_id`, `case_id`, `case_revision`, `claim_id`, `domain_code`, `status`, `assigned_by`, `conflict_of_interest`, `conflict_reason`, `expires_at`, `idempotency_key`, `request_digest`, `created_at`, `updated_at`, `revision`, `review_request_id` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:403); [ExpertBlindReviewDispatcher.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewDispatcher.js:7); [ExpertBlindReviewService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewService.js:83); [ExpertProfileService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/profile/ExpertProfileService.js:89) |
| `private.expert_practice_submissions` | `id`, `application_id`, `user_id`, `domain_code`, `prompt_version`, `prompt_snapshot`, `response`, `evidence_revision_ids`, `state`, `idempotency_key`, `request_digest`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:333) |
| `private.expert_practice_decisions` | `id`, `submission_id`, `application_id`, `user_id`, `reviewer_id`, `decision`, `rubric_version`, `reason`, `idempotency_key`, `request_digest`, `created_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [ExpertQualificationService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQualificationService.js:675) |
| `private.expert_quality_events` | `id`, `user_id`, `domain_code`, `case_id`, `case_revision`, `claim_id`, `incident_cluster_id`, `event_type`, `outcome`, `weight`, `idempotency_key`, `request_digest`, `reason`, `policy_version`, `created_at`, `actor_id`, `supersedes_event_id`, `evidence_revision_ids` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:231); [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:944) |
| `private.expert_review_decisions` | `id`, `assessment_id`, `reviewer_id`, `assignment_id`, `case_id`, `case_revision`, `claim_id`, `decision`, `reasoning`, `idempotency_key`, `request_digest`, `created_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:1123); [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:826) |
| `public.case_appeals` | `id`, `case_id`, `case_revision`, `claim_id`, `assessment_id`, `requester_id`, `reason`, `idempotency_key`, `request_digest`, `status`, `supersedes_appeal_id`, `created_at`, `updated_at`, `resolved_by`, `resolution`, `resolution_reason`, `resolved_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:1115) |
| `private.case_appeal_reviews` | `id`, `appeal_id`, `case_id`, `case_revision`, `reviewer_id`, `decision`, `reason`, `idempotency_key`, `request_digest`, `created_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:1189) |
| `public.case_corrections` | `id`, `case_id`, `case_revision`, `claim_id`, `correction_type`, `statement`, `evidence_revision_ids`, `created_by`, `idempotency_key`, `request_digest`, `created_at` | [202609090001_community_expert_promax.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609090001_community_expert_promax.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:1262) |
| `private.expert_review_requests` | `id`, `requester_id`, `case_id`, `case_revision`, `claim_id`, `domain_code`, `question`, `context_refs`, `status`, `idempotency_key`, `request_digest`, `created_at`, `updated_at`, `community_contribution_id` | [202609150004_expert_review_requests.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609150004_expert_review_requests.sql:1) | [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:301); [ExpertBlindReviewDispatcher.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewDispatcher.js:85); [ExpertBlindReviewService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewService.js:84); [UserProfileService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/profile/UserProfileService.js:245) |
| `private.expert_review_request_events` | `id`, `request_id`, `status`, `actor_id`, `metadata`, `created_at` | [202609150004_expert_review_requests.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609150004_expert_review_requests.sql:1) | [ExpertRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/ExpertRepository.js:338); [ExpertBlindReviewDispatcher.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertBlindReviewDispatcher.js:339) |
| `public.academic_workflow_plans` | `id`, `owner_id`, `revision`, `payload`, `created_at`, `updated_at` | [202609170001_durable_academic_workflows.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170001_durable_academic_workflows.sql:1) | [AcademicTaskRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/AcademicTaskRepository.js:119) |
| `public.academic_workflow_tasks` | `id`, `plan_id`, `owner_id`, `assignee_id`, `task_type`, `status`, `trust_case_id`, `trust_case_revision`, `revision`, `idempotency_key`, `payload`, `completed_at`, `created_at`, `updated_at` | [202609170001_durable_academic_workflows.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170001_durable_academic_workflows.sql:1) | [AcademicTaskRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/AcademicTaskRepository.js:184) |
| `public.academic_workflow_task_events` | `event_id`, `task_id`, `owner_id`, `event_type`, `from_state`, `to_state`, `payload`, `created_at` | [202609170001_durable_academic_workflows.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170001_durable_academic_workflows.sql:1) | [AcademicTaskRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/AcademicTaskRepository.js:276) |
| `private.demo_entitlements` | `user_id`, `entitlement_code`, `source`, `granted_at`, `expires_at`, `revoked_at`, `metadata` | [202609170002_demo_entitlements.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170002_demo_entitlements.sql:1) | [PostgresSessionRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/security/identity/PostgresSessionRepository.js:77) |
| `public.user_timetables` | `id`, `user_id`, `name`, `academic_term`, `source_type`, `status`, `is_active`, `source_artifact_id`, `idempotency_key`, `request_digest`, `created_at`, `updated_at` | [202609170004_academic_timetables.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170004_academic_timetables.sql:1) | [AcademicTimetableRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/AcademicTimetableRepository.js:119) |
| `public.timetable_entries` | `id`, `timetable_id`, `user_id`, `course_name`, `course_code`, `day_of_week`, `start_time`, `end_time`, `period_start`, `period_end`, `room`, `building`, `lecturer`, `class_group`, `week_range`, `notes`, `created_at`, `updated_at` | [202609170004_academic_timetables.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170004_academic_timetables.sql:1) | [AcademicTimetableRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/AcademicTimetableRepository.js:102) |
| `public.timetable_reminders` | `id`, `user_id`, `timetable_id`, `entry_id`, `task_id`, `offset_minutes`, `is_active`, `created_at`, `updated_at` | [202609170004_academic_timetables.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/202609170004_academic_timetables.sql:1) | [AcademicTimetableRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/AcademicTimetableRepository.js:439) |
| `public.community_comments` | `id`, `contribution_id`, `parent_comment_id`, `author_id`, `content`, `depth`, `status`, `idempotency_key`, `request_digest`, `created_at`, `updated_at` | [20260926111838_community_nested_comments.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260926111838_community_nested_comments.sql:1) | [CommunityRepository.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/database/CommunityRepository.js:672) |
| `private.expert_v5_config` | `config_key`, `config_value`, `updated_at`, `updated_by` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:134); [ExpertQuestionBankService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQuestionBankService.js:359); [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:58) |
| `private.expert_mission_level_policy` | `mission_level`, `completed_missions_required`, `allowed_difficulties`, `enabled`, `updated_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:163) |
| `private.expert_v5_source_registry` | `id`, `canonical_host`, `domain_code`, `category`, `fetch_policy`, `license_notes`, `enabled`, `max_requests_per_day`, `min_request_interval_seconds`, `requests_in_window`, `window_started_at`, `last_request_at`, `created_by`, `created_at`, `updated_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:187); [ExpertQuestionBankService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQuestionBankService.js:268) |
| `private.expert_v5_source_events` | `id`, `source_id`, `actor_id`, `event_type`, `payload`, `idempotency_key`, `created_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertQuestionBankService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQuestionBankService.js:97) |
| `private.expert_v5_source_snapshots` | `id`, `source_id`, `requested_url`, `canonical_url`, `title`, `publisher`, `published_at`, `retrieved_at`, `source_type`, `content_hash`, `retrieval_status`, `blocked_reason`, `ingestion_key`, `evidence_items`, `provider_metadata`, `created_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:186); [ExpertQuestionBankService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQuestionBankService.js:233) |
| `private.expert_v5_ingestion_requests` | `ingestion_key`, `source_id`, `requested_url`, `state`, `lease_expires_at`, `snapshot_id`, `created_at`, `updated_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertQuestionBankService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQuestionBankService.js:363) |
| `private.expert_v5_questions` | `question_id`, `question_version`, `source_snapshot_id`, `domain_code`, `question_type`, `difficulty`, `prompt`, `choices`, `answer_key`, `explanation`, `evidence_refs`, `difficulty_features`, `source_content_hash`, `status`, `valid_until`, `editorial_reviewer_id`, `reviewed_at`, `created_by`, `created_at`, `updated_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:185); [ExpertQuestionBankService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQuestionBankService.js:231) |
| `private.expert_v5_question_events` | `id`, `question_id`, `question_version`, `actor_id`, `event_type`, `payload`, `idempotency_key`, `created_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertQuestionBankService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertQuestionBankService.js:223) |
| `private.expert_mission_progression` | `user_id`, `completed_missions`, `mission_level`, `updated_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:158) |
| `private.expert_daily_missions` | `id`, `user_id`, `mission_date`, `timezone`, `mission_type`, `domain_code`, `mission_level`, `question_id`, `question_version`, `difficulty`, `status`, `assigned_at`, `started_at`, `completed_at`, `idempotency_key` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:200) |
| `private.expert_mission_attempts` | `id`, `mission_id`, `user_id`, `question_id`, `question_version`, `status`, `started_at`, `deadline_at`, `submitted_at`, `score`, `is_correct`, `result`, `idempotency_key` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:401) |
| `private.expert_mission_answers` | `attempt_id`, `user_id`, `answer`, `submitted_at`, `answer_hash` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:457) |
| `private.expert_mission_events` | `id`, `mission_id`, `user_id`, `event_type`, `payload`, `idempotency_key`, `created_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:125) |
| `private.expert_room_presence` | `user_id`, `heartbeat_at`, `expires_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:243); [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:163) |
| `private.expert_verification_rooms` | `id`, `host_user_id`, `domain_code`, `input_type`, `challenge_payload`, `status`, `supervisor_user_id`, `supervisor_offer_expires_at`, `current_round_id`, `trust_case_id`, `trust_revision`, `evidence_package_id`, `revision`, `idempotency_key`, `request_hash`, `created_at`, `updated_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:212) |
| `private.expert_room_participants` | `room_id`, `user_id`, `role`, `state`, `conflict_declaration`, `conflict_declared_at`, `joined_at`, `left_at`, `last_seen_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertMissionService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertMissionService.js:250); [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:141) |
| `private.expert_room_rounds` | `id`, `room_id`, `round_number`, `status`, `round_started_at`, `answer_deadline_at`, `answer_locked_at`, `trust_started_at`, `trust_completed_at`, `eligible_expert_ids`, `created_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:224) |
| `private.expert_room_answers` | `round_id`, `room_id`, `expert_user_id`, `response`, `answer_hash`, `submitted_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:463) |
| `private.expert_room_evidence_packages` | `id`, `room_id`, `round_id`, `trust_case_id`, `trust_revision`, `retrieval_state`, `trust_analysis_state`, `package`, `package_hash`, `created_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:483) |
| `private.expert_room_adjudications` | `id`, `room_id`, `round_id`, `expert_user_id`, `supervisor_user_id`, `rubric_version`, `rubric_ratings`, `evidence_ids`, `proposed_score`, `reason`, `proposal_hash`, `supervisor_confirmed_at`, `host_acknowledged_at`, `host_acknowledged_by`, `state`, `created_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:490) |
| `private.expert_room_events` | `id`, `room_id`, `round_id`, `actor_id`, `event_type`, `payload`, `idempotency_key`, `created_at` | [20260929135354_studenthub_expert_v5_missions_rooms.sql](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql:1) | [ExpertVerificationRoomService.js](D:/StudentHub-CodexRuns/MASTER_INTEGRATION_20260930/integration-worktree/frontend/src/lib/server/expert/ExpertVerificationRoomService.js:119) |

## Optional / legacy adapters outside the canonical SQL contract

`frontend/src/lib/db/DatabaseAdapter.js` contains dynamic Supabase collection access. Its four repository wrappers name `ai_memories`, `devices`, `device_sync_states`, `user_goals`, and `early_warnings`; these five tables are absent from the 26 migrations and both inspected projects. A repository-wide identifier search found no imports of those wrapper classes outside their own definitions. The active personalization routes instead call existing in-memory engines/guards. These are disconnected legacy adapters, not sufficient evidence to create five speculative tables. If a release path begins using them, a canonical tenant/authorization/schema contract is required first.

Auth-owned `auth.users` fields used by session code (`id`, `email`, `email_confirmed_at`, `raw_user_meta_data`) and Storage `buckets/objects/foldername` are external prerequisites. Their complete schemas/policies were not inspected by the public/private list_tables calls.

## Expected static contract status

```ini
CANONICAL_BASELINE_MIGRATIONS=26
CANONICAL_APPLICATION_TABLES=87
STATIC_APPLICATION_DB_CONTRACT=DOCUMENTED
DISPOSABLE_POSTGRES_FRESH_SQL_CHAIN=PASS_PARENT_EVIDENCE
FULL_SUPABASE_FRESH_INSTALL=UNVERIFIED
REMOTE_POLICY_INDEX_GRANT_FUNCTION_TRIGGER_CONTRACT=UNVERIFIED
REMOTE_SCHEMA_FINGERPRINT_COMPLETE=NO
PRODUCTION_SCHEMA_MATCHES_CANONICAL=NO
STAGING_SCHEMA_MATCHES_CANONICAL=NO
```

The source appendix preserves the baseline's intended DDL rather than modifying history. New forward reconciliation migrations require their own review/test provenance and must be added to the release manifest by the parent runner.



## Source contract appendix — exact baseline SQL

These files are replay-ordered reference text, not a migration command. Later ALTER, DROP/CREATE POLICY and CREATE OR REPLACE FUNCTION statements supersede earlier definitions. Dynamic V5 RLS/grant loops and all constraint/index/FK/function/trigger statements are retained verbatim to avoid omitting their contract.

<details>
<summary>202608270001_v2_authority_foundation.sql</summary>

```sql
begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  verified_domains text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 120),
  avatar_url text,
  bio text check (bio is null or char_length(bio) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Upgrade the legacy profiles table without trusting or reusing its privileged
-- role/trust/verification columns as V2 authority.
alter table public.profiles add column if not exists institution_id uuid references public.institutions(id) on delete set null;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
update public.profiles p
set display_name = coalesce(p.display_name, nullif(to_jsonb(p)->>'full_name', ''), nullif(to_jsonb(p)->>'email', ''), 'StudentHub member')
where display_name is null;
alter table public.profiles alter column display_name set not null;

create table if not exists private.roles (
  id smallserial primary key,
  code text not null unique check (code in ('STUDENT','EXPERT','MODERATOR','ADMIN','SERVICE')),
  description text not null
);
insert into private.roles(code, description) values
  ('STUDENT','Standard authenticated user'),
  ('EXPERT','Domain-scoped verified expert'),
  ('MODERATOR','Community moderation operator'),
  ('ADMIN','Security and platform administrator'),
  ('SERVICE','Non-human workload identity')
on conflict (code) do nothing;

create table if not exists private.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id smallint not null references private.roles(id) on delete restrict,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, role_id)
);

create table if not exists private.server_sessions (
  token_hash bytea primary key check (octet_length(token_hash) = 32),
  user_id uuid not null references auth.users(id) on delete cascade,
  auth_provider text not null default 'supabase',
  upstream_jti_hash bytea check (upstream_jti_hash is null or octet_length(upstream_jti_hash) = 32),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  idle_expires_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revocation_reason text,
  session_version integer not null default 1 check (session_version > 0),
  user_agent_hash bytea,
  constraint session_expiry_order check (created_at < expires_at and last_seen_at <= expires_at)
);
create index if not exists server_sessions_user_active_idx
  on private.server_sessions(user_id, expires_at desc) where revoked_at is null;
create unique index if not exists server_sessions_upstream_jti_unique
  on private.server_sessions(upstream_jti_hash) where upstream_jti_hash is not null;

create table if not exists private.audit_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  target_type text,
  target_id text,
  request_id text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  check (jsonb_typeof(metadata) = 'object')
);
create index if not exists audit_events_actor_time_idx on private.audit_events(actor_id, occurred_at desc);
create index if not exists audit_events_type_time_idx on private.audit_events(event_type, occurred_at desc);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(title) between 5 and 200),
  content text not null check (char_length(content) between 20 and 20000),
  category text not null default 'GENERAL',
  location_tag text not null default 'CAMPUS',
  images text[] not null default '{}',
  links text[] not null default '{}',
  status text not null default 'PUBLISHED' check (status in ('DRAFT','PUBLISHED','PENDING_REVIEW','HIDDEN','REMOVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists posts_author_idx on public.posts(author_id, created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  content text not null check (char_length(content) between 1 and 5000),
  status text not null default 'PUBLISHED' check (status in ('PUBLISHED','PENDING_REVIEW','HIDDEN','REMOVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments(post_id, created_at);

create table if not exists public.votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.trust_cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'INSUFFICIENT_EVIDENCE',
  visibility text not null default 'PRIVATE' check (visibility in ('PRIVATE','ANONYMIZED','PUBLIC')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.case_inputs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  input_type text not null,
  object_key text,
  content_hash bytea,
  created_at timestamptz not null default now()
);
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  normalized_value text not null,
  value_hash bytea not null,
  created_at timestamptz not null default now(),
  unique(entity_type, value_hash)
);
create table if not exists public.case_entities (
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  relation_type text not null,
  confidence numeric(5,4) check (confidence between 0 and 1),
  primary key(case_id, entity_id, relation_type)
);
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  source_type text not null,
  source_identifier text,
  observed_at timestamptz not null,
  extractor_version text,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete set null,
  statement text not null check (char_length(statement) between 1 and 10000),
  status text not null default 'UNVERIFIED',
  valid_from timestamptz,
  valid_to timestamptz,
  superseded_by uuid references public.claims(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.claim_sources (
  claim_id uuid not null references public.claims(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  relation text not null check (relation in ('SUPPORTS','CONTRADICTS','CONTEXT')),
  primary key(claim_id, evidence_id)
);

create table if not exists public.expert_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_title text,
  public_bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists private.expert_domains (
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_code text not null,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  primary key(user_id, domain_code)
);
create table if not exists private.expert_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_code text not null,
  status text not null check (status in ('PENDING','VERIFIED','REJECTED','REVOKED')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  evidence_ref text,
  unique(user_id, domain_code)
);
create table if not exists public.expert_assessments (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references auth.users(id) on delete restrict,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  domain_code text not null,
  assessment jsonb not null,
  confidence numeric(5,4) check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique(expert_id, case_id, domain_code)
);
create table if not exists private.reputation_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_code text not null,
  event_type text not null,
  delta numeric(10,4) not null,
  reason text not null,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;
alter table public.trust_cases enable row level security;
alter table public.case_inputs enable row level security;
alter table public.entities enable row level security;
alter table public.case_entities enable row level security;
alter table public.evidence enable row level security;
alter table public.claims enable row level security;
alter table public.claim_sources enable row level security;
alter table public.expert_profiles enable row level security;
alter table public.expert_assessments enable row level security;
alter table private.server_sessions enable row level security;
alter table private.user_roles enable row level security;
alter table private.expert_verifications enable row level security;
alter table private.expert_domains enable row level security;
alter table private.reputation_events enable row level security;
alter table private.audit_events enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists profiles_own_select on public.profiles;
create policy profiles_own_select on public.profiles for select using (auth.uid() = id);
drop policy if exists profiles_own_insert on public.profiles;
create policy profiles_own_insert on public.profiles for insert with check (auth.uid() = id);
drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select using (status = 'PUBLISHED' or auth.uid() = author_id);
drop policy if exists posts_own_insert on public.posts;
create policy posts_own_insert on public.posts for insert with check (auth.uid() = author_id);
drop policy if exists posts_own_update on public.posts;
create policy posts_own_update on public.posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments for select using (status = 'PUBLISHED' or auth.uid() = author_id);
drop policy if exists comments_own_insert on public.comments;
create policy comments_own_insert on public.comments for insert with check (auth.uid() = author_id);
-- Vote rows contain user_id and are never exposed directly to browser roles.
-- Public vote counts are produced by server-side aggregate queries instead.
drop policy if exists votes_public_read on public.votes;
drop policy if exists votes_own_write on public.votes;
create policy votes_own_write on public.votes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists trust_cases_own on public.trust_cases;
create policy trust_cases_own on public.trust_cases for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists case_inputs_own on public.case_inputs;
create policy case_inputs_own on public.case_inputs for all using (exists(select 1 from public.trust_cases c where c.id=case_id and c.owner_id=auth.uid())) with check (exists(select 1 from public.trust_cases c where c.id=case_id and c.owner_id=auth.uid()));
drop policy if exists evidence_own on public.evidence;
create policy evidence_own on public.evidence for all using (exists(select 1 from public.trust_cases c where c.id=case_id and c.owner_id=auth.uid())) with check (exists(select 1 from public.trust_cases c where c.id=case_id and c.owner_id=auth.uid()));

revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.roles, private.user_roles, private.server_sessions,
  private.expert_domains, private.expert_verifications, private.reputation_events to service_role;
grant select, insert on private.audit_events to service_role;
grant usage, select on all sequences in schema private to service_role;
grant usage on schema public to anon, authenticated;
-- Browser roles may read the public forum projection, but author_id is an
-- identity join key and must never be exposed through direct PostgREST reads.
-- Server-side repository queries use service_role and can perform the private
-- join needed to build the redacted DTO.
revoke select on public.posts, public.comments from anon, authenticated;
grant select(id, category, location_tag, title, content, images, links, status, created_at, updated_at) on public.posts to anon, authenticated;
grant select(id, post_id, content, status, created_at, updated_at) on public.comments to anon, authenticated;
revoke all on public.profiles from public, anon, authenticated;
grant select(id, institution_id, display_name, avatar_url, bio, created_at, updated_at) on public.profiles to authenticated;
grant insert(id, institution_id, display_name, avatar_url, bio) on public.profiles to authenticated;
grant update(display_name, avatar_url, bio, institution_id) on public.profiles to authenticated;
grant insert, update, delete on public.posts, public.comments, public.votes to authenticated;

create or replace function public.handle_new_user_v2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'StudentHub member'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  insert into private.user_roles(user_id, role_id)
  select new.id, id from private.roles where code = 'STUDENT'
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_v2 on auth.users;
create trigger on_auth_user_created_v2 after insert on auth.users
for each row execute function public.handle_new_user_v2();
revoke execute on function public.handle_new_user_v2() from public, anon, authenticated;

commit;
```

</details>

<details>
<summary>202608290001_feature_freeze_cross_system.sql</summary>

```sql
begin;

create table if not exists public.evidence_passports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  subject_type text not null check (char_length(subject_type) between 1 and 80),
  subject_id text not null check (char_length(subject_id) between 1 and 160),
  current_status text not null check (current_status in (
    'UNKNOWN','INSUFFICIENT_EVIDENCE','SUPPORTED','SAFE_WITHIN_SCOPE','SUSPICIOUS',
    'HIGH_RISK','DANGEROUS','DISPUTED','RESOLVED'
  )),
  revision integer not null default 1 check (revision > 0),
  demo boolean not null default false check (demo = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, subject_type, subject_id)
);
create index if not exists evidence_passports_owner_updated_idx
  on public.evidence_passports(owner_id, updated_at desc);

create table if not exists public.evidence_passport_events (
  id text primary key check (char_length(id) between 1 and 180),
  passport_id uuid not null references public.evidence_passports(id) on delete cascade,
  revision integer not null check (revision > 0),
  event_type text not null check (event_type in (
    'CREATED','USER_NOTE','TRUST_RESULT','COMMUNITY_UPDATE','EXPERT_REVIEW','OFFICIAL_UPDATE','RESULT_CHANGED','RESOLVED'
  )),
  provenance_class text not null check (provenance_class in (
    'OFFICIAL','TRUST_ENGINE','COMMUNITY','EXPERT','DETERMINISTIC_RULE','MODEL_ESTIMATE','USER_SUBMISSION'
  )),
  summary text not null check (char_length(summary) between 1 and 600),
  previous_status text not null,
  new_status text not null,
  material boolean not null default false,
  change_reason text check (change_reason is null or char_length(change_reason) <= 600),
  source_references jsonb not null default '[]'::jsonb check (jsonb_typeof(source_references) = 'array'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(passport_id, revision)
);
create index if not exists evidence_passport_events_timeline_idx
  on public.evidence_passport_events(passport_id, revision);

create table if not exists public.decision_scenarios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  current_state text not null check (char_length(current_state) between 1 and 800),
  evaluation_method text not null default 'DETERMINISTIC_WEIGHTED_FACTORS_V1',
  recommendation_state text not null check (recommendation_state in ('RECOMMENDED','REVIEW_REQUIRED')),
  recommended_option_key text,
  unknowns jsonb not null default '[]'::jsonb check (jsonb_typeof(unknowns) = 'array'),
  demo boolean not null default false check (demo = false),
  created_at timestamptz not null default now()
);
create index if not exists decision_scenarios_owner_created_idx
  on public.decision_scenarios(owner_id, created_at desc);

create table if not exists public.decision_options (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.decision_scenarios(id) on delete cascade,
  option_key text not null check (char_length(option_key) between 1 and 160),
  label text not null check (char_length(label) between 1 and 160),
  summary text not null check (char_length(summary) between 1 and 500),
  next_action text not null check (char_length(next_action) between 1 and 400),
  factors jsonb not null check (jsonb_typeof(factors) = 'object'),
  consequences jsonb not null check (jsonb_typeof(consequences) = 'array'),
  total_cost numeric(12,4) not null,
  rank integer not null check (rank > 0),
  unique(scenario_id, option_key),
  unique(scenario_id, rank)
);

create table if not exists public.case_follows (
  owner_id uuid not null references auth.users(id) on delete cascade,
  passport_id uuid not null references public.evidence_passports(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(owner_id, passport_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  subject_type text not null,
  subject_id text not null,
  material_change_revision integer,
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 1000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(owner_id, subject_type, subject_id, material_change_revision)
);
create index if not exists notifications_owner_unread_idx
  on public.notifications(owner_id, created_at desc) where read_at is null;

alter table public.evidence_passports enable row level security;
alter table public.evidence_passport_events enable row level security;
alter table public.decision_scenarios enable row level security;
alter table public.decision_options enable row level security;
alter table public.case_follows enable row level security;
alter table public.notifications enable row level security;

drop policy if exists evidence_passports_own_select on public.evidence_passports;
create policy evidence_passports_own_select on public.evidence_passports
  for select using (auth.uid() = owner_id);
drop policy if exists evidence_passports_own_insert on public.evidence_passports;
create policy evidence_passports_own_insert on public.evidence_passports
  for insert with check (auth.uid() = owner_id and demo = false);

drop policy if exists evidence_passport_events_own_select on public.evidence_passport_events;
create policy evidence_passport_events_own_select on public.evidence_passport_events
  for select using (exists (
    select 1 from public.evidence_passports passport
    where passport.id = passport_id and passport.owner_id = auth.uid()
  ));
drop policy if exists evidence_passport_events_own_insert on public.evidence_passport_events;
create policy evidence_passport_events_own_insert on public.evidence_passport_events
  for insert with check (exists (
    select 1 from public.evidence_passports passport
    where passport.id = passport_id and passport.owner_id = auth.uid() and passport.demo = false
  ));

drop policy if exists decision_scenarios_own_select on public.decision_scenarios;
create policy decision_scenarios_own_select on public.decision_scenarios
  for select using (auth.uid() = owner_id);
drop policy if exists decision_scenarios_own_insert on public.decision_scenarios;
create policy decision_scenarios_own_insert on public.decision_scenarios
  for insert with check (auth.uid() = owner_id and demo = false);
drop policy if exists decision_options_own_select on public.decision_options;
create policy decision_options_own_select on public.decision_options
  for select using (exists (
    select 1 from public.decision_scenarios scenario
    where scenario.id = scenario_id and scenario.owner_id = auth.uid()
  ));

drop policy if exists case_follows_own on public.case_follows;
create policy case_follows_own on public.case_follows
  for all using (auth.uid() = owner_id) with check (
    auth.uid() = owner_id and exists (
      select 1 from public.evidence_passports passport
      where passport.id = passport_id and passport.owner_id = auth.uid()
    )
  );
drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications
  for select using (auth.uid() = owner_id);

revoke all on public.evidence_passports, public.evidence_passport_events,
  public.decision_scenarios, public.decision_options, public.case_follows,
  public.notifications from public, anon, authenticated;

grant select on public.evidence_passports, public.evidence_passport_events,
  public.decision_scenarios, public.decision_options to authenticated;
grant select, insert, delete on public.case_follows to authenticated;
grant select on public.notifications to authenticated;

grant select, insert, update on public.evidence_passports to service_role;
grant select, insert on public.evidence_passport_events to service_role;
grant select, insert on public.decision_scenarios, public.decision_options to service_role;
grant select, insert, delete on public.case_follows to service_role;
grant select, insert, update on public.notifications to service_role;

commit;
```

</details>

<details>
<summary>202609010001_private_screenshot_storage.sql</summary>

```sql
begin;

-- Review-only migration for the StudentHub-owned private screenshot boundary.
-- Do not execute against a remote project without explicit approval.

create table if not exists public.screenshot_objects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.trust_cases(id) on delete cascade,
  bucket_id text not null default 'trust-screenshots-private'
    check (bucket_id = 'trust-screenshots-private'),
  object_key text not null unique
    check (object_key ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.(png|jpg|jpeg|webp)$'),
  mime_type text not null
    check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  byte_size integer not null check (byte_size between 1 and 8388608),
  sha256 bytea not null check (octet_length(sha256) = 32),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  deleted_at timestamptz
);

create index if not exists screenshot_objects_owner_created_idx
  on public.screenshot_objects(owner_id, created_at desc);
create index if not exists screenshot_objects_case_idx
  on public.screenshot_objects(case_id)
  where case_id is not null;

alter table public.screenshot_objects enable row level security;
revoke all on public.screenshot_objects from public, anon, authenticated;
grant select on public.screenshot_objects to authenticated;
grant select, insert, update, delete on public.screenshot_objects to service_role;

drop policy if exists screenshot_objects_owner_select on public.screenshot_objects;
create policy screenshot_objects_owner_select on public.screenshot_objects
  for select to authenticated
  using (owner_id = auth.uid() and deleted_at is null);

-- Metadata writes stay server-controlled so the client cannot forge hashes,
-- ownership, case linkage, or retention timestamps.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trust-screenshots-private',
  'trust-screenshots-private',
  false,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1
    from storage.buckets
    where id = 'trust-screenshots-private'
      and public = true
  ) then
    raise exception 'trust-screenshots-private must remain private';
  end if;
end;
$$;

drop policy if exists screenshot_storage_authenticated_insert on storage.objects;
create policy screenshot_storage_authenticated_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'trust-screenshots-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists screenshot_storage_owner_select on storage.objects;
create policy screenshot_storage_owner_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'trust-screenshots-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists screenshot_storage_owner_delete on storage.objects;
create policy screenshot_storage_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'trust-screenshots-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
```

</details>

<details>
<summary>202609060001_expert_qualification.sql</summary>

```sql
begin;

-- Expert qualification is a server-owned workflow.  The browser may read its
-- own progress, but it can never promote itself or write a verification row.
create table if not exists public.expert_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'IDENTITY_REVIEW' check (status in (
    'IDENTITY_REVIEW','QUIZ_ELIGIBLE','QUIZ_IN_PROGRESS','DOMAIN_REVIEW',
    'ACTIVE','REJECTED','APPEALED'
  )),
  profile_snapshot jsonb not null check (jsonb_typeof(profile_snapshot) = 'object'),
  requested_domains jsonb not null check (jsonb_typeof(requested_domains) = 'array'),
  approved_domains jsonb not null default '[]'::jsonb check (jsonb_typeof(approved_domains) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create index if not exists expert_applications_status_updated_idx
  on public.expert_applications(status, updated_at desc);

create table if not exists public.expert_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.expert_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_version text not null check (char_length(quiz_version) between 1 and 120),
  question_ids jsonb not null check (jsonb_typeof(question_ids) = 'array'),
  status text not null default 'IN_PROGRESS' check (status in (
    'IN_PROGRESS','SUBMITTED','PASSED','FAILED','EXPIRED','CANCELLED'
  )),
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  submitted_at timestamptz,
  score numeric(7,4) check (score is null or score between 0 and 1),
  max_score integer not null check (max_score > 0),
  created_at timestamptz not null default now(),
  unique(id, user_id)
);
create index if not exists expert_quiz_attempts_user_created_idx
  on public.expert_quiz_attempts(user_id, created_at desc);
create unique index if not exists expert_quiz_attempts_one_active_idx
  on public.expert_quiz_attempts(application_id)
  where status = 'IN_PROGRESS';

create table if not exists public.expert_quiz_answers (
  attempt_id uuid not null references public.expert_quiz_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null check (question_id ~ '^[a-z0-9][a-z0-9._:-]{1,119}$'),
  answer jsonb not null check (
    jsonb_typeof(answer) = 'string' and char_length(answer #>> '{}') between 1 and 320
  ),
  answered_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);
create index if not exists expert_quiz_answers_user_idx
  on public.expert_quiz_answers(user_id, answered_at desc);

create table if not exists private.expert_qualification_reviews (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.expert_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('APPROVE_QUIZ','ACTIVATE','REJECT','APPEAL_REVIEW')),
  approved_domains jsonb not null default '[]'::jsonb check (jsonb_typeof(approved_domains) = 'array'),
  reason text check (reason is null or char_length(reason) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists expert_qualification_reviews_application_idx
  on private.expert_qualification_reviews(application_id, created_at desc);

alter table public.expert_applications enable row level security;
alter table public.expert_quiz_attempts enable row level security;
alter table public.expert_quiz_answers enable row level security;
alter table private.expert_qualification_reviews enable row level security;

drop policy if exists expert_applications_own_select on public.expert_applications;
create policy expert_applications_own_select on public.expert_applications
  for select using (auth.uid() = user_id);
drop policy if exists expert_quiz_attempts_own_select on public.expert_quiz_attempts;
create policy expert_quiz_attempts_own_select on public.expert_quiz_attempts
  for select using (auth.uid() = user_id);
drop policy if exists expert_quiz_answers_own_select on public.expert_quiz_answers;
create policy expert_quiz_answers_own_select on public.expert_quiz_answers
  for select using (auth.uid() = user_id);

revoke all on public.expert_applications, public.expert_quiz_attempts,
  public.expert_quiz_answers from public, anon, authenticated;
grant select on public.expert_applications, public.expert_quiz_attempts,
  public.expert_quiz_answers to authenticated;
grant select, insert, update on public.expert_applications,
  public.expert_quiz_attempts, public.expert_quiz_answers to service_role;

revoke all on private.expert_qualification_reviews from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert on private.expert_qualification_reviews to service_role;
grant usage, select on sequence private.expert_qualification_reviews_id_seq to service_role;

commit;
```

</details>

<details>
<summary>202609060002_integration_outbox.sql</summary>

```sql
begin;

create schema if not exists private;

-- Outbox rows are the durable hand-off between a committed StudentHub case and
-- an optional external security system.  Delivery is at-least-once and the
-- receiver's event_id/payload_hash contract makes retries safe.
create table if not exists private.integration_outbox (
  id bigint generated always as identity primary key,
  event_id text not null unique check (char_length(event_id) between 1 and 180),
  integration text not null check (integration in ('LABBE')),
  aggregate_type text not null check (char_length(aggregate_type) between 1 and 80),
  aggregate_id text not null check (char_length(aggregate_id) between 1 and 160),
  event_type text not null check (char_length(event_type) between 1 and 160),
  schema_version text not null check (char_length(schema_version) between 1 and 80),
  occurred_at timestamptz not null,
  produced_at timestamptz not null,
  producer text not null check (char_length(producer) between 1 and 80),
  environment text not null check (char_length(environment) between 1 and 80),
  correlation_id text not null check (char_length(correlation_id) between 1 and 160),
  causation_id text,
  subject text not null check (char_length(subject) between 1 and 160),
  classification text not null check (classification in ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  payload_hash bytea not null check (octet_length(payload_hash) = 32),
  status text not null default 'PENDING' constraint integration_outbox_status_check
    check (status in ('PENDING','IN_FLIGHT','DELIVERED','FAILED','SHADOW','CONFLICT')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  leased_until timestamptz,
  lease_token uuid,
  lease_count integer not null default 0 check (lease_count >= 0),
  shadow_count integer not null default 0 check (shadow_count >= 0),
  shadowed_at timestamptz,
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);
alter table private.integration_outbox add column if not exists schema_version text;
alter table private.integration_outbox add column if not exists occurred_at timestamptz;
alter table private.integration_outbox add column if not exists produced_at timestamptz;
alter table private.integration_outbox add column if not exists producer text;
alter table private.integration_outbox add column if not exists environment text;
alter table private.integration_outbox add column if not exists correlation_id text;
alter table private.integration_outbox add column if not exists causation_id text;
alter table private.integration_outbox add column if not exists subject text;
alter table private.integration_outbox add column if not exists classification text;
alter table private.integration_outbox add column if not exists lease_token uuid;
alter table private.integration_outbox add column if not exists lease_count integer not null default 0;
alter table private.integration_outbox add column if not exists shadow_count integer not null default 0;
alter table private.integration_outbox add column if not exists shadowed_at timestamptz;
alter table private.integration_outbox drop constraint if exists integration_outbox_status_check;
alter table private.integration_outbox add constraint integration_outbox_status_check
  check (status in ('PENDING','IN_FLIGHT','DELIVERED','FAILED','SHADOW','CONFLICT'));
create index if not exists integration_outbox_delivery_idx
  on private.integration_outbox(integration, status, available_at, created_at);

alter table private.integration_outbox enable row level security;
revoke all on private.integration_outbox from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update on private.integration_outbox to service_role;
grant usage, select on sequence private.integration_outbox_id_seq to service_role;

commit;
```

</details>

<details>
<summary>202609060003_trust_runs_revisions.sql</summary>

```sql
begin;

-- A Trust case is the durable subject.  A run is one execution, stage runs are
-- its bounded observations, and revisions keep the case/verdict history
-- append-only for replay, audit, and realtime consumers.
create table if not exists public.trust_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id text check (request_id is null or char_length(request_id) between 1 and 160),
  idempotency_key text,
  input_fingerprint bytea check (input_fingerprint is null or octet_length(input_fingerprint) = 32),
  status text not null check (status in ('RUNNING','QUEUED','FOLLOWING','COMPLETED','PARTIAL','FAILED','CANCELLED')),
  pipeline_version text not null check (char_length(pipeline_version) between 1 and 120),
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(case_id, id)
);
alter table public.trust_runs add column if not exists idempotency_key text;
alter table public.trust_runs drop constraint if exists trust_runs_idempotency_key_length;
alter table public.trust_runs add constraint trust_runs_idempotency_key_length
  check (idempotency_key is null or char_length(idempotency_key) between 1 and 160);
create unique index if not exists trust_runs_owner_idempotency_idx
  on public.trust_runs(owner_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists trust_runs_owner_created_idx on public.trust_runs(owner_id, created_at desc);
create index if not exists trust_runs_case_created_idx on public.trust_runs(case_id, created_at desc);

create table if not exists public.trust_stage_runs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.trust_runs(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  stage_id text not null check (stage_id in ('l1','l2a','l2b','l2c','l3','l4','l5')),
  stage_index integer not null check (stage_index between 0 and 6),
  status text not null check (status in ('NOT_STARTED','IDLE','VALIDATING','QUEUED','RUNNING','FOLLOWING','INSPECTING','DEGRADED','RECONNECTING','COMPLETED','CANCEL_REQUESTED','CANCELLED','FAILED','PARTIAL','BLOCKED')),
  attempt integer not null default 1 check (attempt > 0),
  request_id text check (request_id is null or char_length(request_id) between 1 and 160),
  started_at timestamptz,
  completed_at timestamptz,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  result_digest bytea check (result_digest is null or octet_length(result_digest) = 32),
  summary jsonb not null default '{}'::jsonb check (jsonb_typeof(summary) = 'object'),
  created_at timestamptz not null default now(),
  unique(run_id, stage_id, attempt)
);
create index if not exists trust_stage_runs_owner_created_idx on public.trust_stage_runs(owner_id, created_at desc);
create index if not exists trust_stage_runs_run_index_idx on public.trust_stage_runs(run_id, stage_index, attempt);

create table if not exists public.trust_case_revisions (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null check (revision > 0),
  run_id uuid not null references public.trust_runs(id) on delete restrict,
  state text not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz not null default now(),
  unique(case_id, revision)
);
create index if not exists trust_case_revisions_owner_idx on public.trust_case_revisions(owner_id, case_id, revision desc);

create table if not exists public.trust_verdict_revisions (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null check (revision > 0),
  run_id uuid not null references public.trust_runs(id) on delete restrict,
  verdict jsonb not null check (jsonb_typeof(verdict) = 'object'),
  decision_digest bytea check (decision_digest is null or octet_length(decision_digest) = 32),
  created_at timestamptz not null default now(),
  unique(case_id, revision)
);
create index if not exists trust_verdict_revisions_owner_idx on public.trust_verdict_revisions(owner_id, case_id, revision desc);

alter table public.trust_runs enable row level security;
alter table public.trust_stage_runs enable row level security;
alter table public.trust_case_revisions enable row level security;
alter table public.trust_verdict_revisions enable row level security;

drop policy if exists trust_runs_own_select on public.trust_runs;
create policy trust_runs_own_select on public.trust_runs for select using (auth.uid() = owner_id);
drop policy if exists trust_stage_runs_own_select on public.trust_stage_runs;
create policy trust_stage_runs_own_select on public.trust_stage_runs for select using (auth.uid() = owner_id);
drop policy if exists trust_case_revisions_own_select on public.trust_case_revisions;
create policy trust_case_revisions_own_select on public.trust_case_revisions for select using (auth.uid() = owner_id);
drop policy if exists trust_verdict_revisions_own_select on public.trust_verdict_revisions;
create policy trust_verdict_revisions_own_select on public.trust_verdict_revisions for select using (auth.uid() = owner_id);

revoke all on public.trust_runs, public.trust_stage_runs,
  public.trust_case_revisions, public.trust_verdict_revisions from public, anon, authenticated;
grant select on public.trust_runs, public.trust_stage_runs,
  public.trust_case_revisions, public.trust_verdict_revisions to authenticated;
grant select, insert, update on public.trust_runs, public.trust_stage_runs to service_role;
grant select, insert on public.trust_case_revisions, public.trust_verdict_revisions to service_role;
grant usage, select on sequence public.trust_case_revisions_id_seq to service_role;
grant usage, select on sequence public.trust_verdict_revisions_id_seq to service_role;

commit;
```

</details>

<details>
<summary>202609060004_reports.sql</summary>

```sql
begin;

-- Reports are immutable, revision-pinned artifacts.  The job row is metadata
-- and lifecycle; the document itself stays in the private schema so the
-- browser can only receive it after the API has checked the owner's scope.
create schema if not exists private;

create table if not exists private.report_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in ('TRUST_CASE','EXPERT_QUALIFICATION','COMMUNITY_CASE','AI_EVALUATION','OPS_LABBE')),
  subject_type text not null check (subject_type in ('TRUST_CASE','EXPERT_APPLICATION','COMMUNITY_CASE','EVALUATION_RUN','OPS_SNAPSHOT')),
  subject_id uuid not null,
  snapshot_revision integer not null check (snapshot_revision > 0),
  status text not null check (status in ('REQUESTED','SNAPSHOTTING','GENERATING','VALIDATING','READY','PARTIAL','FAILED','SUPERSEDED','REVOKED')),
  template_version text not null check (char_length(template_version) between 1 and 120),
  policy_version text,
  request_fingerprint bytea not null check (octet_length(request_fingerprint) = 32),
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 160),
  artifact_hash bytea check (artifact_hash is null or octet_length(artifact_hash) = 32),
  failure_code text check (failure_code is null or char_length(failure_code) between 1 and 120),
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists report_jobs_owner_idempotency_idx
  on private.report_jobs(owner_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists report_jobs_owner_created_idx
  on private.report_jobs(owner_id, created_at desc);
create index if not exists report_jobs_subject_created_idx
  on private.report_jobs(subject_type, subject_id, created_at desc);

create table if not exists private.report_artifacts (
  report_id uuid primary key references private.report_jobs(id) on delete cascade,
  snapshot_revision integer not null check (snapshot_revision > 0),
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  artifact_hash bytea not null check (octet_length(artifact_hash) = 32),
  created_at timestamptz not null default now()
);

create table if not exists private.report_job_events (
  report_id uuid not null references private.report_jobs(id) on delete cascade,
  sequence integer not null check (sequence > 0),
  from_status text,
  to_status text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now(),
  primary key (report_id, sequence)
);
create index if not exists report_job_events_report_idx
  on private.report_job_events(report_id, sequence);

alter table private.report_jobs enable row level security;
alter table private.report_artifacts enable row level security;
alter table private.report_job_events enable row level security;

revoke all on private.report_jobs, private.report_artifacts, private.report_job_events from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update on private.report_jobs to service_role;
grant select, insert on private.report_artifacts, private.report_job_events to service_role;

commit;
```

</details>

<details>
<summary>202609070001_realtime_event_log.sql</summary>

```sql
begin;

-- The event log is the recovery source for realtime projections.  Broadcast
-- delivery is still at-least-once; consumers resume from sequence and
-- deduplicate by event_id/idempotency_key.
create schema if not exists private;

create table if not exists private.realtime_events (
  sequence bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  channel text not null check (channel ~ '^[a-z][a-z0-9._:-]{0,127}$'),
  event_type text not null check (event_type ~ '^[a-z][a-z0-9._:-]{0,127}$'),
  subject_id uuid references auth.users(id) on delete set null,
  classification text not null default 'INTERNAL'
    check (classification in ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED')),
  producer text not null check (char_length(producer) between 1 and 120),
  environment text not null check (char_length(environment) between 1 and 80),
  correlation_id text not null check (char_length(correlation_id) between 1 and 160),
  causation_id text check (causation_id is null or char_length(causation_id) between 1 and 160),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  payload_hash bytea not null check (octet_length(payload_hash) = 32),
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  expires_at timestamptz,
  check (expires_at is null or expires_at > recorded_at),
  unique(channel, idempotency_key)
);

create index if not exists realtime_events_channel_sequence_idx
  on private.realtime_events(channel, sequence);
create index if not exists realtime_events_subject_channel_sequence_idx
  on private.realtime_events(subject_id, channel, sequence);
create index if not exists realtime_events_recorded_idx
  on private.realtime_events(recorded_at, sequence);

alter table private.realtime_events enable row level security;
revoke all on private.realtime_events from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert on private.realtime_events to service_role;
grant usage, select on sequence private.realtime_events_sequence_seq to service_role;

-- Event history is append-only. Retention is handled by partition/drop policy
-- owned by the platform operator, not by a request-scoped web role.
create or replace function private.reject_realtime_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
begin
  raise exception 'realtime event log is append-only';
end;
$$;

drop trigger if exists realtime_events_no_update on private.realtime_events;
create trigger realtime_events_no_update
before update on private.realtime_events
for each row execute function private.reject_realtime_event_mutation();

drop trigger if exists realtime_events_no_delete on private.realtime_events;
create trigger realtime_events_no_delete
before delete on private.realtime_events
for each row execute function private.reject_realtime_event_mutation();

revoke execute on function private.reject_realtime_event_mutation() from public, anon, authenticated;

commit;
```

</details>

<details>
<summary>202609090001_community_expert_promax.sql</summary>

```sql
begin;

-- Promax keeps Community signals, objective evidence, expert assessments, and
-- reputation quality separate.  All writes are made by server-side services;
-- browser roles receive only the public projection permitted by RLS.
create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.community_source_clusters (
  id uuid primary key default gen_random_uuid(),
  canonical_locator text not null,
  publisher text,
  independence_key text not null,
  content_digest bytea check (content_digest is null or octet_length(content_digest) = 32),
  source_count integer not null default 1 check (source_count >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(canonical_locator, independence_key)
);
create unique index if not exists community_source_clusters_digest_idx
  on public.community_source_clusters(content_digest, independence_key)
  where content_digest is not null;

create table if not exists public.community_contributions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete restrict,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  contribution_type text not null check (contribution_type in (
    'DIRECT_EXPERIENCE','FOUND_SOURCE','NEEDS_VERIFICATION',
    'SUPPORTING_EVIDENCE','CONTRADICTING_EVIDENCE','CONTEXT','CRITIQUE'
  )),
  publication_state text not null default 'DRAFT' check (publication_state in (
    'DRAFT','PRIVACY_SCAN_PENDING','PREVIEW_READY','PUBLISHED',
    'EDITED','WITHDRAWN','MODERATED','BLOCKED'
  )),
  evidence_state text not null default 'UNKNOWN' check (evidence_state in (
    'UNKNOWN','INSUFFICIENT','SUPPORTING','CONTRADICTORY','MIXED','STALE','SUPERSEDED'
  )),
  review_state text not null default 'UNASSIGNED' check (review_state in (
    'UNASSIGNED','ASSIGNED','IN_REVIEW','CONFLICT','NEEDS_THIRD_REVIEW',
    'RESOLVED','APPEALED','SUPERSEDED'
  )),
  revision integer not null default 1 check (revision >= 1),
  statement text not null check (char_length(statement) between 20 and 20000),
  public_statement text not null check (char_length(public_statement) between 20 and 20000),
  evidence_revision_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_revision_ids) = 'array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  source_cluster_id uuid references public.community_source_clusters(id) on delete set null,
  content_digest bytea not null check (octet_length(content_digest) = 32),
  privacy_findings jsonb not null default '[]'::jsonb check (jsonb_typeof(privacy_findings) = 'array'),
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(author_id, idempotency_key)
);
create index if not exists community_contributions_case_idx
  on public.community_contributions(case_id, case_revision, claim_id, created_at desc);
create index if not exists community_contributions_public_idx
  on public.community_contributions(publication_state, review_state, created_at desc);

create table if not exists public.community_contribution_revisions (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  revision integer not null check (revision >= 1),
  statement text not null check (char_length(statement) between 20 and 20000),
  public_statement text not null check (char_length(public_statement) between 20 and 20000),
  evidence_revision_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_revision_ids) = 'array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  content_digest bytea not null check (octet_length(content_digest) = 32),
  privacy_findings jsonb not null default '[]'::jsonb check (jsonb_typeof(privacy_findings) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(contribution_id, revision)
);
create index if not exists community_contribution_revisions_lookup_idx
  on public.community_contribution_revisions(contribution_id, revision desc);

-- File metadata is private by construction. The object keys point to a
-- private bucket and the redacted derivative is a separate revision; neither
-- key is included in public DTOs, search documents, notifications, or logs.
create table if not exists private.community_file_objects (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.community_contributions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  original_object_key text not null check (char_length(original_object_key) between 1 and 500),
  public_derivative_object_key text check (public_derivative_object_key is null or char_length(public_derivative_object_key) between 1 and 500),
  scan_state text not null default 'PRIVACY_SCAN_PENDING' check (scan_state in ('PRIVACY_SCAN_PENDING','PREVIEW_READY','PUBLISHED','BLOCKED','DELETED')),
  mime_type text not null check (char_length(mime_type) between 1 and 120),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 8388608),
  sha256 bytea not null check (octet_length(sha256) = 32),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_file_objects_scope_idx
  on private.community_file_objects(owner_id, case_id, case_revision, scan_state);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete set null,
  case_revision integer not null check (case_revision >= 1),
  kind text not null check (kind in ('HELPFUL','ADD_EVIDENCE','CHALLENGE','INSUFFICIENT_INFORMATION','REPORT_ABUSE')),
  value smallint not null default 1 check (value in (-1, 1)),
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, contribution_id, kind)
);
create index if not exists community_reactions_claim_idx
  on public.community_reactions(contribution_id, claim_id, case_revision, kind);

-- The contributor track record is an auditable quality-event ledger. It is a
-- qualification signal only; it never writes Trust verdicts or expert
-- authority. The current score is projected from durable contributions and
-- reactions, while this append-only ledger preserves why the projection
-- changed.
create table if not exists private.community_quality_events (
  id bigint generated always as identity primary key,
  subject_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  contribution_id uuid references public.community_contributions(id) on delete set null,
  case_id uuid references public.trust_cases(id) on delete set null,
  case_revision integer check (case_revision is null or case_revision >= 1),
  event_type text not null check (event_type in (
    'CONTRIBUTION_PUBLISHED','CONTRIBUTION_REVISED','REACTION_RECORDED',
    'CORRECTION_RECORDED','MODERATION_RECORDED','MANUAL_CORRECTION'
  )),
  point_delta integer not null default 0 check (point_delta between -100 and 100),
  reason text not null check (char_length(reason) between 1 and 1000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(subject_id, idempotency_key)
);
create index if not exists community_quality_events_subject_idx
  on private.community_quality_events(subject_id, created_at desc);

-- Append-only reaction history gives idempotent retries without treating a
-- reaction as a truth vote or as an author reputation mutation.
create table if not exists private.community_reaction_events (
  id bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete set null,
  case_revision integer not null check (case_revision >= 1),
  kind text not null check (kind in ('HELPFUL','ADD_EVIDENCE','CHALLENGE','INSUFFICIENT_INFORMATION','REPORT_ABUSE')),
  value smallint not null check (value in (-1, 1)),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

create table if not exists private.expert_assignments (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  domain_code text not null check (char_length(domain_code) between 1 and 80),
  status text not null default 'ASSIGNED' check (status in ('ASSIGNED','IN_REVIEW','COMPLETED','CANCELLED')),
  assigned_by uuid not null references auth.users(id) on delete restrict,
  conflict_of_interest boolean not null default false,
  conflict_reason text,
  expires_at timestamptz,
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  request_digest bytea check (request_digest is null or octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists expert_assignments_subject_idx
  on private.expert_assignments(expert_id, case_id, case_revision, status);
create unique index if not exists expert_assignment_active_once
  on private.expert_assignments(expert_id, case_id, case_revision, claim_id, domain_code)
  where status in ('ASSIGNED','IN_REVIEW');

-- Evidence-based practice is a separate qualification projection.  The
-- applicant response is private, the reviewer decision is append-only, and
-- neither table grants domain authority until an authorized activation writes
-- DOMAIN_VERIFIED to expert_verifications.
create table if not exists private.expert_practice_submissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.expert_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_code text not null check (char_length(domain_code) between 1 and 80),
  prompt_version text not null check (char_length(prompt_version) between 1 and 120),
  prompt_snapshot jsonb not null check (jsonb_typeof(prompt_snapshot) = 'object'),
  response jsonb not null check (jsonb_typeof(response) = 'object'),
  evidence_revision_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_revision_ids) = 'array'),
  state text not null default 'SUBMITTED' check (state in ('SUBMITTED','UNDER_REVIEW','PASSED','FAILED','EXPIRED')),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(application_id, domain_code),
  unique(user_id, idempotency_key)
);
create index if not exists expert_practice_submissions_review_idx
  on private.expert_practice_submissions(state, created_at asc);

create table if not exists private.expert_practice_decisions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references private.expert_practice_submissions(id) on delete cascade,
  application_id uuid not null references public.expert_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('PASS','FAIL','REQUEST_REVISION')),
  rubric_version text not null check (char_length(rubric_version) between 1 and 120),
  reason text not null check (char_length(reason) between 20 and 4000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(reviewer_id, idempotency_key),
  unique(reviewer_id, submission_id)
);
create index if not exists expert_practice_decisions_submission_idx
  on private.expert_practice_decisions(submission_id, created_at asc);

alter table private.expert_qualification_reviews drop constraint if exists expert_qualification_reviews_decision_check;
alter table private.expert_qualification_reviews add constraint expert_qualification_reviews_decision_check
  check (decision in ('APPROVE_QUIZ','ACTIVATE','REJECT','APPEAL_REVIEW','PRACTICE_PASS','PRACTICE_FAIL','PRACTICE_REQUEST_REVISION'));

create table if not exists private.expert_quality_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_code text not null,
  case_id uuid references public.trust_cases(id) on delete set null,
  case_revision integer check (case_revision is null or case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  incident_cluster_id text check (incident_cluster_id is null or char_length(incident_cluster_id) between 1 and 180),
  event_type text not null check (event_type in ('ADJUDICATION','REVERSE_ADJUDICATION','MANUAL_CORRECTION')),
  outcome text not null check (outcome in ('SUPPORT','CONTRADICT','CORRECT','INCORRECT','ABSTAIN','MIXED')),
  weight numeric(10,4) not null default 1 check (weight > 0 and weight <= 10),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  reason text not null,
  policy_version text not null default 'expert-quality-v1',
  created_at timestamptz not null default now(),
  unique(user_id, domain_code, idempotency_key)
);
create index if not exists expert_quality_events_lookup_idx
  on private.expert_quality_events(user_id, domain_code, created_at desc);

create table if not exists private.expert_review_decisions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.expert_assessments(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  assignment_id uuid references private.expert_assignments(id) on delete restrict,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  decision text not null check (decision in ('AGREE','DISAGREE','ABSTAIN')),
  reasoning text not null check (char_length(reasoning) between 20 and 4000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(reviewer_id, idempotency_key)
);
create index if not exists expert_review_decisions_assessment_idx on private.expert_review_decisions(assessment_id, created_at asc);
create unique index if not exists expert_review_one_per_reviewer_assessment
  on private.expert_review_decisions(reviewer_id, assessment_id);

create table if not exists public.case_appeals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  assessment_id uuid references public.expert_assessments(id) on delete set null,
  requester_id uuid not null references auth.users(id) on delete restrict,
  reason text not null check (char_length(reason) between 20 and 4000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  status text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','RESOLVED','REJECTED','SUPERSEDED')),
  supersedes_appeal_id uuid references public.case_appeals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, idempotency_key)
);
create index if not exists case_appeals_case_idx on public.case_appeals(case_id, case_revision, created_at desc);
alter table public.case_appeals add column if not exists resolved_by uuid references auth.users(id) on delete set null;
alter table public.case_appeals add column if not exists resolution text;
alter table public.case_appeals add column if not exists resolution_reason text;
alter table public.case_appeals add column if not exists resolved_at timestamptz;

create table if not exists private.case_appeal_reviews (
  id uuid primary key default gen_random_uuid(),
  appeal_id uuid not null references public.case_appeals(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('UPHOLD','OVERTURN','REQUEST_EVIDENCE')),
  reason text not null check (char_length(reason) between 20 and 4000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(reviewer_id, idempotency_key),
  unique(reviewer_id, appeal_id)
);
create index if not exists case_appeal_reviews_appeal_idx on private.case_appeal_reviews(appeal_id, created_at asc);

create table if not exists public.case_corrections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  correction_type text not null check (correction_type in ('EVIDENCE_UPDATE','SOURCE_RETRACTION','CLAIM_SPLIT','CLAIM_MERGE','CONTEXT_UPDATE')),
  statement text not null check (char_length(statement) between 20 and 10000),
  evidence_revision_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_revision_ids) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now()
);
alter table public.case_appeals add column if not exists idempotency_key text;
alter table public.case_appeals add column if not exists request_digest bytea;
create unique index if not exists case_appeals_idempotency_idx on public.case_appeals(requester_id, idempotency_key) where idempotency_key is not null;
alter table public.case_corrections add column if not exists idempotency_key text;
alter table public.case_corrections add column if not exists request_digest bytea;
create unique index if not exists case_corrections_idempotency_idx on public.case_corrections(created_by, idempotency_key);

-- Extend the existing assessment row rather than creating a second expert
-- authority table.  Existing rows remain readable for compatibility, while
-- new Promax assessments carry the full revision/assignment contract.
alter table public.expert_assessments add column if not exists assignment_id uuid references private.expert_assignments(id) on delete restrict;
alter table public.expert_assessments add column if not exists case_revision integer;
alter table public.expert_assessments add column if not exists claim_id uuid references public.claims(id) on delete set null;
alter table public.expert_assessments add column if not exists evidence_revision_ids jsonb not null default '[]'::jsonb;
alter table public.expert_assessments add column if not exists assessment_state text not null default 'SUBMITTED';
alter table public.expert_assessments add column if not exists conclusion_within_scope text;
alter table public.expert_assessments add column if not exists reasoning text;
alter table public.expert_assessments add column if not exists uncertainty text;
alter table public.expert_assessments add column if not exists missing_evidence jsonb not null default '[]'::jsonb;
alter table public.expert_assessments add column if not exists coi_declared boolean not null default false;
alter table public.expert_assessments add column if not exists policy_version text not null default 'expert-quality-v1';
alter table public.expert_assessments add column if not exists idempotency_key text;
alter table public.expert_assessments add column if not exists request_digest bytea;
alter table public.expert_assessments drop constraint if exists expert_assessments_evidence_array_check;
alter table public.expert_assessments add constraint expert_assessments_evidence_array_check
  check (jsonb_typeof(evidence_revision_ids) = 'array');
alter table public.expert_assessments drop constraint if exists expert_assessments_state_check;
alter table public.expert_assessments add constraint expert_assessments_state_check
  check (assessment_state in ('DRAFT','SUBMITTED','REVIEWED','CONFLICT','STALE','SUPERSEDED','WITHDRAWN'));
create unique index if not exists expert_assessments_idempotency_idx
  on public.expert_assessments(expert_id, idempotency_key) where idempotency_key is not null;

-- Each assessment is immutable history, including across claims/revisions.
alter table public.expert_assessments drop constraint if exists expert_assessments_expert_id_case_id_domain_code_key;
create unique index if not exists expert_assessment_assignment_once on public.expert_assessments(assignment_id) where assignment_id is not null;
alter table private.expert_verifications add column if not exists expires_at timestamptz;
alter table private.expert_verifications add column if not exists suspended_at timestamptz;
alter table private.expert_assignments add column if not exists idempotency_key text;
alter table private.expert_assignments add column if not exists request_digest bytea;
alter table private.expert_assignments drop constraint if exists expert_assignments_request_digest_check;
alter table private.expert_assignments add constraint expert_assignments_request_digest_check
  check (request_digest is null or octet_length(request_digest) = 32);
create unique index if not exists expert_assignment_idempotency_idx
  on private.expert_assignments(assigned_by, idempotency_key)
  where idempotency_key is not null;
-- Qualification is a separate progression from domain verification status.  It
-- keeps applicant, practice review, trainee, expiry, suspension, and revocation
-- transitions auditable without overloading the legacy status column.
alter table private.expert_verifications add column if not exists qualification_state text not null default 'APPLICANT';
alter table private.expert_verifications drop constraint if exists expert_verifications_qualification_state_check;
alter table private.expert_verifications add constraint expert_verifications_qualification_state_check
  check (qualification_state in ('APPLICANT','IDENTITY_CHECKED','QUIZ_PASSED','PRACTICE_REVIEW','TRAINEE','DOMAIN_VERIFIED','SUSPENDED','EXPIRED','REVOKED'));
update private.expert_verifications
   set qualification_state = case
     when status = 'VERIFIED' and suspended_at is null and (expires_at is null or expires_at > now()) then 'DOMAIN_VERIFIED'
     when status = 'REVOKED' then 'REVOKED'
     when suspended_at is not null then 'SUSPENDED'
     when expires_at is not null and expires_at <= now() then 'EXPIRED'
     else qualification_state
   end
 where qualification_state = 'APPLICANT';
alter table private.expert_quality_events add column if not exists actor_id uuid references auth.users(id);
alter table private.expert_quality_events add column if not exists supersedes_event_id bigint references private.expert_quality_events(id);
alter table private.expert_quality_events add column if not exists evidence_revision_ids jsonb not null default '[]'::jsonb;
alter table private.expert_quality_events add column if not exists incident_cluster_id text;
alter table private.expert_quality_events drop constraint if exists expert_quality_events_incident_cluster_length;
alter table private.expert_quality_events add constraint expert_quality_events_incident_cluster_length
  check (incident_cluster_id is null or char_length(incident_cluster_id) between 1 and 180);
alter table private.expert_quality_events drop constraint if exists expert_quality_events_evidence_array_check;
alter table private.expert_quality_events add constraint expert_quality_events_evidence_array_check
  check (jsonb_typeof(evidence_revision_ids) = 'array');
create unique index if not exists quality_one_reversal on private.expert_quality_events(supersedes_event_id) where supersedes_event_id is not null;
create unique index if not exists reaction_one_claim_revision_kind on public.community_reactions(user_id, claim_id, case_revision, kind) where claim_id is not null;

-- Internal outbox events are durable and replayable but are not sent to Labbe.
alter table private.integration_outbox drop constraint if exists integration_outbox_integration_check;
alter table private.integration_outbox add constraint integration_outbox_integration_check
  check (integration in ('LABBE','INTERNAL'));

alter table public.community_source_clusters enable row level security;
alter table public.community_contributions enable row level security;
alter table public.community_contribution_revisions enable row level security;
alter table public.community_reactions enable row level security;
alter table private.community_quality_events enable row level security;
-- Assessments retain a public table name for Trust compatibility, but the
-- rows are server-owned and contain reviewer reasoning/identity links.
alter table public.expert_assessments enable row level security;
alter table private.community_reaction_events enable row level security;
alter table private.community_file_objects enable row level security;
alter table private.expert_assignments enable row level security;
alter table private.expert_practice_submissions enable row level security;
alter table private.expert_practice_decisions enable row level security;
alter table private.case_appeal_reviews enable row level security;
alter table private.expert_quality_events enable row level security;
alter table private.expert_review_decisions enable row level security;
alter table public.case_appeals enable row level security;
alter table public.case_corrections enable row level security;

drop policy if exists community_source_clusters_read on public.community_source_clusters;
create policy community_source_clusters_read on public.community_source_clusters for select using (true);
drop policy if exists community_contributions_read on public.community_contributions;
create policy community_contributions_read on public.community_contributions for select
  using (publication_state = 'PUBLISHED' or author_id = auth.uid());
drop policy if exists community_contributions_owner_insert on public.community_contributions;
create policy community_contributions_owner_insert on public.community_contributions for insert
  with check (author_id = auth.uid());
drop policy if exists community_contributions_owner_update on public.community_contributions;
create policy community_contributions_owner_update on public.community_contributions for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists community_contribution_revisions_read on public.community_contribution_revisions;
create policy community_contribution_revisions_read on public.community_contribution_revisions for select
  using (exists (select 1 from public.community_contributions c join public.trust_cases tc on tc.id = c.case_id where c.id = contribution_id and (tc.visibility = 'PUBLIC' or c.author_id = auth.uid())));
drop policy if exists community_reactions_read on public.community_reactions;
create policy community_reactions_read on public.community_reactions for select using (true);
drop policy if exists community_reactions_owner_write on public.community_reactions;
create policy community_reactions_owner_write on public.community_reactions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists case_appeals_owner_read on public.case_appeals;
create policy case_appeals_owner_read on public.case_appeals for select using (requester_id = auth.uid());
drop policy if exists case_corrections_read on public.case_corrections;
create policy case_corrections_read on public.case_corrections for select using (true);

revoke all on private.community_reaction_events, private.community_file_objects, private.expert_assignments, private.expert_quality_events, private.expert_practice_submissions, private.expert_practice_decisions, private.case_appeal_reviews, private.expert_review_decisions, private.community_quality_events from public, anon, authenticated;
revoke all on public.community_source_clusters, public.community_contributions, public.community_contribution_revisions, public.community_reactions, public.case_appeals, public.case_corrections from public, anon, authenticated;
revoke all on public.expert_assessments from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert on private.community_quality_events to service_role;
grant select, insert on private.community_reaction_events to service_role;
grant select, insert, update on private.community_file_objects to service_role;
grant select, insert, update on private.expert_assignments to service_role;
grant select, insert, update on private.expert_practice_submissions to service_role;
grant select, insert on private.expert_practice_decisions to service_role;
grant select, insert on private.case_appeal_reviews to service_role;
grant select, insert on private.expert_quality_events to service_role;
grant select, insert on private.expert_review_decisions to service_role;
grant usage, select on sequence private.community_quality_events_id_seq, private.community_reaction_events_id_seq, private.expert_quality_events_id_seq to service_role;
grant select, insert, update on public.community_source_clusters, public.community_contributions, public.community_reactions to service_role;
grant select, insert on public.community_contribution_revisions to service_role;
grant select, insert, update on public.case_appeals to service_role;
grant select, insert on public.case_corrections to service_role;
grant select, insert, update on public.expert_assessments to service_role;

-- Private event/quality histories are append-only.  Corrections are new rows
-- with a new revision; no prior assessment or reaction is overwritten.
create or replace function private.reject_promax_history_mutation()
returns trigger language plpgsql security definer set search_path = private as $$
begin raise exception 'Promax history is append-only'; end;
$$;
drop trigger if exists community_reaction_events_no_update on private.community_reaction_events;
create trigger community_reaction_events_no_update before update or delete on private.community_reaction_events
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists community_quality_events_no_update on private.community_quality_events;
create trigger community_quality_events_no_update before update or delete on private.community_quality_events
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists expert_quality_events_no_update on private.expert_quality_events;
create trigger expert_quality_events_no_update before update or delete on private.expert_quality_events
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists expert_practice_decisions_no_update on private.expert_practice_decisions;
create trigger expert_practice_decisions_no_update before update or delete on private.expert_practice_decisions
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists case_appeal_reviews_no_update on private.case_appeal_reviews;
create trigger case_appeal_reviews_no_update before update or delete on private.case_appeal_reviews
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists expert_qualification_reviews_no_update on private.expert_qualification_reviews;
create trigger expert_qualification_reviews_no_update before update or delete on private.expert_qualification_reviews
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists expert_review_decisions_no_update on private.expert_review_decisions;
create trigger expert_review_decisions_no_update before update or delete on private.expert_review_decisions
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists expert_assessments_no_update on public.expert_assessments;
create trigger expert_assessments_no_update before update or delete on public.expert_assessments
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists case_corrections_no_update on public.case_corrections;
create trigger case_corrections_no_update before update or delete on public.case_corrections
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists community_contribution_revisions_no_update on public.community_contribution_revisions;
create trigger community_contribution_revisions_no_update before update or delete on public.community_contribution_revisions
for each row execute function private.reject_promax_history_mutation();

commit;
```

</details>

<details>
<summary>202609100001_expert_authority_snapshot.sql</summary>

```sql
begin;

-- Forward-only closure for the Expert -> Trust authority boundary.
-- Existing rows remain readable as legacy history (snapshot version 0). New
-- submissions written by the Promax repository must carry version 1 below.
-- This migration never drops, truncates, resets, or seeds application data.

alter table private.expert_verifications
  add column if not exists revision integer not null default 1;
alter table private.expert_verifications
  drop constraint if exists expert_verifications_revision_check;
alter table private.expert_verifications
  add constraint expert_verifications_revision_check check (revision >= 1);

create or replace function private.bump_expert_verification_revision()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
begin
  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status
       or new.qualification_state is distinct from old.qualification_state
       or new.domain_code is distinct from old.domain_code
       or new.verified_by is distinct from old.verified_by
       or new.verified_at is distinct from old.verified_at
       or new.evidence_ref is distinct from old.evidence_ref
       or new.expires_at is distinct from old.expires_at
       or new.suspended_at is distinct from old.suspended_at then
      new.revision := old.revision + 1;
    else
      new.revision := old.revision;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists expert_verifications_revision_bump on private.expert_verifications;
create trigger expert_verifications_revision_bump
before update on private.expert_verifications
for each row execute function private.bump_expert_verification_revision();

alter table private.expert_assignments
  add column if not exists revision integer not null default 1;
alter table private.expert_assignments
  drop constraint if exists expert_assignments_revision_check;
alter table private.expert_assignments
  add constraint expert_assignments_revision_check check (revision >= 1);

create or replace function private.bump_expert_assignment_revision()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
begin
  if tg_op = 'UPDATE' then
    if new.expert_id is distinct from old.expert_id
       or new.case_id is distinct from old.case_id
       or new.case_revision is distinct from old.case_revision
       or new.claim_id is distinct from old.claim_id
       or new.domain_code is distinct from old.domain_code
       or new.status is distinct from old.status
       or new.assigned_by is distinct from old.assigned_by
       or new.conflict_of_interest is distinct from old.conflict_of_interest
       or new.conflict_reason is distinct from old.conflict_reason
       or new.expires_at is distinct from old.expires_at then
      new.revision := old.revision + 1;
    else
      new.revision := old.revision;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists expert_assignments_revision_bump on private.expert_assignments;
create trigger expert_assignments_revision_bump
before update on private.expert_assignments
for each row execute function private.bump_expert_assignment_revision();

alter table public.expert_assessments
  add column if not exists verification_id uuid references private.expert_verifications(id) on delete restrict;
alter table public.expert_assessments
  add column if not exists verification_revision integer;
alter table public.expert_assessments
  add column if not exists verified_domain text;
alter table public.expert_assessments
  add column if not exists verification_status text;
alter table public.expert_assessments
  add column if not exists verification_qualification_state text;
alter table public.expert_assessments
  add column if not exists verification_expires_at timestamptz;
alter table public.expert_assessments
  add column if not exists verification_suspended_at timestamptz;
alter table public.expert_assessments
  add column if not exists assignment_revision integer;
alter table public.expert_assessments
  add column if not exists coi_state text not null default 'LEGACY_UNKNOWN';
alter table public.expert_assessments
  add column if not exists coi_declaration_ref text;
alter table public.expert_assessments
  add column if not exists qualification_policy_version text not null default 'expert-qualification-v1';
alter table public.expert_assessments
  add column if not exists submitted_at timestamptz;
alter table public.expert_assessments
  add column if not exists authority_snapshot_version integer not null default 0;
alter table public.expert_assessments
  add column if not exists authority_snapshot_digest bytea;
alter table public.expert_assessments
  add column if not exists authority_snapshot jsonb not null default '{}'::jsonb;

alter table public.expert_assessments
  drop constraint if exists expert_assessments_verification_revision_check;
alter table public.expert_assessments
  add constraint expert_assessments_verification_revision_check
  check (verification_revision is null or verification_revision >= 1);
alter table public.expert_assessments
  drop constraint if exists expert_assessments_assignment_revision_check;
alter table public.expert_assessments
  add constraint expert_assessments_assignment_revision_check
  check (assignment_revision is null or assignment_revision >= 1);
alter table public.expert_assessments
  drop constraint if exists expert_assessments_coi_state_check;
alter table public.expert_assessments
  add constraint expert_assessments_coi_state_check
  check (coi_state in ('LEGACY_UNKNOWN','DECLARED_NO_CONFLICT','CONFLICT_DECLARED','NOT_DECLARED'));
alter table public.expert_assessments
  drop constraint if exists expert_assessments_qualification_policy_check;
alter table public.expert_assessments
  add constraint expert_assessments_qualification_policy_check
  check (char_length(qualification_policy_version) between 1 and 120);
alter table public.expert_assessments
  drop constraint if exists expert_assessments_authority_snapshot_digest_check;
alter table public.expert_assessments
  add constraint expert_assessments_authority_snapshot_digest_check
  check (authority_snapshot_digest is null or octet_length(authority_snapshot_digest) = 32);
alter table public.expert_assessments
  drop constraint if exists expert_assessments_authority_snapshot_check;
alter table public.expert_assessments
  add constraint expert_assessments_authority_snapshot_check
  check (jsonb_typeof(authority_snapshot) = 'object');
alter table public.expert_assessments
  drop constraint if exists expert_assessments_authority_snapshot_version_check;
alter table public.expert_assessments
  add constraint expert_assessments_authority_snapshot_version_check
  check (
    authority_snapshot_version = 0
    or (
      authority_snapshot_version = 1
      and verification_id is not null
      and verification_revision is not null
      and verified_domain is not null
      and verification_status = 'VERIFIED'
      and verification_qualification_state = 'DOMAIN_VERIFIED'
      and assignment_id is not null
      and assignment_revision is not null
      and coi_declared = true
      and coi_state = 'DECLARED_NO_CONFLICT'
      and coi_declaration_ref is not null
      and submitted_at is not null
      and authority_snapshot_digest is not null
      and authority_snapshot->>'snapshotVersion' = '1'
      and authority_snapshot->>'verificationId' = verification_id::text
      and authority_snapshot->>'assignmentId' = assignment_id::text
      and authority_snapshot->>'verifiedDomain' = verified_domain
    )
  );

create index if not exists expert_assessments_verification_lineage_idx
  on public.expert_assessments(verification_id, verification_revision);
create index if not exists expert_assessments_assignment_lineage_idx
  on public.expert_assessments(assignment_id, assignment_revision);

commit;
```

</details>

<details>
<summary>202609150001_auth_profile_session_hardening.sql</summary>

```sql
-- StudentHub AI — Auth/profile reconciliation and RLS hardening
--
-- Forward-safe and non-destructive. Apply this migration to a disposable
-- database first, then to the intended Supabase project through the owner's
-- migration workflow. It does not delete, truncate, or rewrite user data.

begin;

-- The application-owned first-run state must not live in user-editable Auth
-- metadata. Existing rows keep the safe default until onboarding completes.
alter table if exists public.profiles
  add column if not exists onboarded boolean not null default false;

-- Reconcile historical Auth users that predate the profile trigger. The
-- identity key is auth.users.id; no email-based merge is attempted.
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(
    nullif(left(regexp_replace(u.raw_user_meta_data->>'full_name', '[[:cntrl:]]', '', 'g'), 120), ''),
    nullif(left(regexp_replace(u.raw_user_meta_data->>'name', '[[:cntrl:]]', '', 'g'), 120), ''),
    nullif(left(split_part(coalesce(u.email, ''), '@', 1), 120), ''),
    'StudentHub member'
  ),
  nullif(left(regexp_replace(u.raw_user_meta_data->>'avatar_url', '[[:cntrl:]]', '', 'g'), 1000), '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Give historical Auth users an explicit least-privilege application role.
-- The role is selected from the server-owned role catalog, never from Auth
-- metadata or a client-supplied field.
insert into private.user_roles (user_id, role_id)
select u.id, r.id
from auth.users u
join private.roles r on r.code = 'STUDENT'
left join private.user_roles ur on ur.user_id = u.id and ur.role_id = r.id
where ur.user_id is null
on conflict do nothing;

-- Make the browser-facing RLS contract explicit. Policies scoped to PUBLIC
-- are easy to misread and accidentally broaden when grants change.
drop policy if exists profiles_own_select on public.profiles;
create policy profiles_own_select on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists profiles_own_insert on public.profiles;
create policy profiles_own_insert on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts
  for select to anon, authenticated using (status = 'PUBLISHED' or auth.uid() = author_id);

drop policy if exists posts_own_insert on public.posts;
create policy posts_own_insert on public.posts
  for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists posts_own_update on public.posts;
create policy posts_own_update on public.posts
  for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments
  for select to anon, authenticated using (status = 'PUBLISHED' or auth.uid() = author_id);

drop policy if exists comments_own_insert on public.comments;
create policy comments_own_insert on public.comments
  for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists votes_own_write on public.votes;
create policy votes_own_write on public.votes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists trust_cases_own on public.trust_cases;
create policy trust_cases_own on public.trust_cases
  for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Expert directory rows contain only the public projection. Qualification and
-- role authority remain server/private and are not granted to browser roles.
drop policy if exists expert_profiles_public_read on public.expert_profiles;
create policy expert_profiles_public_read on public.expert_profiles
  for select to anon, authenticated using (true);

-- Remove inherited table privileges that are not needed by the browser roles,
-- especially TRUNCATE/REFERENCES/TRIGGER. RLS does not protect TRUNCATE.
revoke all on public.profiles, public.posts, public.comments, public.votes,
  public.trust_cases, public.expert_profiles
  from public, anon, authenticated;

grant select(id, institution_id, display_name, avatar_url, bio, onboarded, created_at, updated_at)
  on public.profiles to authenticated;
grant insert(id, display_name, avatar_url, bio)
  on public.profiles to authenticated;
grant update(display_name, avatar_url, bio)
  on public.profiles to authenticated;

grant select(id, category, location_tag, title, content, images, links, status, created_at, updated_at)
  on public.posts to anon, authenticated;
grant insert(author_id, title, content, category, location_tag, images, links)
  on public.posts to authenticated;
grant update(title, content, category, location_tag, images, links)
  on public.posts to authenticated;

grant select(id, post_id, content, status, created_at, updated_at)
  on public.comments to anon, authenticated;
grant insert(post_id, author_id, content) on public.comments to authenticated;

grant insert(post_id, user_id, value) on public.votes to authenticated;
grant update(value) on public.votes to authenticated;
grant delete on public.votes to authenticated;
-- Trust cases and their state transitions are server-owned. The RLS policy
-- remains explicit for controlled service-side sessions, but browser roles
-- receive no table privilege for this private resource.
grant select(user_id, public_title, public_bio, created_at, updated_at)
  on public.expert_profiles to anon, authenticated;

commit;
```

</details>

<details>
<summary>202609150002_auth_private_browser_boundary_hardening.sql</summary>

```sql
-- StudentHub AI — Explicit browser boundary for private trust/expert state
--
-- Forward-only and non-destructive. This closes legacy inherited browser
-- grants left by earlier feature migrations; server-side PostgreSQL/service
-- access is unchanged. No user/application rows are deleted or rewritten.

begin;

-- Expert assessments contain reviewer/qualification authority and are
-- server-owned. In particular, RLS is not a substitute for revoking
-- TRUNCATE, REFERENCES, and TRIGGER privileges.
revoke all on public.expert_assessments from public, anon, authenticated;

-- Qualification progress is readable by the owning authenticated user only;
-- all writes and privilege-bearing transitions remain server-side.
revoke all on public.expert_applications, public.expert_quiz_attempts,
  public.expert_quiz_answers
  from public, anon, authenticated;

grant select on public.expert_applications, public.expert_quiz_attempts,
  public.expert_quiz_answers to authenticated;

drop policy if exists expert_applications_own_select on public.expert_applications;
create policy expert_applications_own_select on public.expert_applications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists expert_quiz_attempts_own_select on public.expert_quiz_attempts;
create policy expert_quiz_attempts_own_select on public.expert_quiz_attempts
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists expert_quiz_answers_own_select on public.expert_quiz_answers;
create policy expert_quiz_answers_own_select on public.expert_quiz_answers
  for select to authenticated using (auth.uid() = user_id);

-- Trust execution history is owner-readable but append/update authority is
-- service-side. Make the existing intended read path explicit instead of
-- relying on policies scoped to PUBLIC.
revoke all on public.trust_runs, public.trust_stage_runs,
  public.trust_case_revisions, public.trust_verdict_revisions
  from public, anon, authenticated;
grant select on public.trust_runs, public.trust_stage_runs,
  public.trust_case_revisions, public.trust_verdict_revisions to authenticated;

drop policy if exists trust_runs_own_select on public.trust_runs;
create policy trust_runs_own_select on public.trust_runs
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists trust_stage_runs_own_select on public.trust_stage_runs;
create policy trust_stage_runs_own_select on public.trust_stage_runs
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists trust_case_revisions_own_select on public.trust_case_revisions;
create policy trust_case_revisions_own_select on public.trust_case_revisions
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists trust_verdict_revisions_own_select on public.trust_verdict_revisions;
create policy trust_verdict_revisions_own_select on public.trust_verdict_revisions
  for select to authenticated using (auth.uid() = owner_id);

commit;
```

</details>

<details>
<summary>202609150003_auth_public_trust_boundary_hardening.sql</summary>

```sql
-- StudentHub AI — Remove inherited browser grants from Trust graph/public catalog
--
-- Forward-only and non-destructive. Core Trust graph rows are server-owned;
-- institution rows expose only a public directory projection. Existing
-- user-facing Passport/follow/decision policies remain owner-scoped but are
-- explicitly limited to the authenticated role.

begin;

-- Trust graph inputs, evidence, claims, and entity links are persisted by the
-- server repositories. RLS alone is not enough because TRUNCATE and other
-- table privileges are checked before row policies.
revoke all on public.case_inputs, public.entities, public.case_entities,
  public.evidence, public.claims, public.claim_sources
  from public, anon, authenticated;
grant select, insert, update, delete on public.case_inputs, public.entities,
  public.case_entities, public.evidence, public.claims, public.claim_sources
  to service_role;

drop policy if exists case_inputs_own on public.case_inputs;
drop policy if exists evidence_own on public.evidence;

-- Institution data is a public directory projection. Verified-domain details
-- remain server-side and are not included in browser column privileges.
revoke all on public.institutions from public, anon, authenticated;
grant select(id, slug, name, created_at, updated_at)
  on public.institutions to anon, authenticated;
grant select, insert, update, delete on public.institutions to service_role;

drop policy if exists institutions_read_public on public.institutions;
create policy institutions_read_public on public.institutions
  for select to anon, authenticated using (true);

-- These feature tables already grant only the listed authenticated reads or
-- follow mutations. Make the policy role explicit and do not leave mutation
-- policies available to the pseudo-role PUBLIC.
drop policy if exists evidence_passports_own_select on public.evidence_passports;
create policy evidence_passports_own_select on public.evidence_passports
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists evidence_passports_own_insert on public.evidence_passports;

drop policy if exists evidence_passport_events_own_select on public.evidence_passport_events;
create policy evidence_passport_events_own_select on public.evidence_passport_events
  for select to authenticated using (exists (
    select 1 from public.evidence_passports passport
    where passport.id = evidence_passport_events.passport_id
      and passport.owner_id = auth.uid()
  ));

drop policy if exists evidence_passport_events_own_insert on public.evidence_passport_events;

drop policy if exists decision_scenarios_own_select on public.decision_scenarios;
create policy decision_scenarios_own_select on public.decision_scenarios
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists decision_scenarios_own_insert on public.decision_scenarios;

drop policy if exists decision_options_own_select on public.decision_options;
create policy decision_options_own_select on public.decision_options
  for select to authenticated using (exists (
    select 1 from public.decision_scenarios scenario
    where scenario.id = decision_options.scenario_id
      and scenario.owner_id = auth.uid()
  ));

drop policy if exists case_follows_own on public.case_follows;
create policy case_follows_own on public.case_follows
  for all to authenticated using (auth.uid() = owner_id) with check (
    auth.uid() = owner_id and exists (
      select 1 from public.evidence_passports passport
      where passport.id = case_follows.passport_id
        and passport.owner_id = auth.uid()
    )
  );

drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications
  for select to authenticated using (auth.uid() = owner_id);

commit;
```

</details>

<details>
<summary>202609150004_expert_review_requests.sql</summary>

```sql
-- StudentHub AI — durable Trust -> Expert review-request handoff.
-- A requester creates a bounded question.  Assignment remains a separate,
-- coordinator-controlled authority transition in private.expert_assignments.
create schema if not exists private;

create table if not exists private.expert_review_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  domain_code text not null check (char_length(domain_code) between 1 and 80),
  question text not null check (char_length(question) between 20 and 4000),
  context_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(context_refs) = 'array'),
  status text not null default 'REQUESTED' check (status in (
    'REQUESTED','MATCHING','ASSIGNED','IN_REVIEW','COMPLETED','CANCELLED','EXPIRED'
  )),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, idempotency_key)
);

create index if not exists expert_review_requests_requester_idx
  on private.expert_review_requests(requester_id, created_at desc);
create index if not exists expert_review_requests_case_idx
  on private.expert_review_requests(case_id, case_revision, claim_id, created_at desc);
create unique index if not exists expert_review_requests_active_scope_idx
  on private.expert_review_requests(
    requester_id,
    case_id,
    case_revision,
    coalesce(claim_id, '00000000-0000-0000-0000-000000000000'::uuid),
    domain_code
  )
  where status in ('REQUESTED','MATCHING','ASSIGNED','IN_REVIEW');

create table if not exists private.expert_review_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references private.expert_review_requests(id) on delete cascade,
  status text not null check (status in (
    'REQUESTED','MATCHING','ASSIGNED','IN_REVIEW','COMPLETED','CANCELLED','EXPIRED'
  )),
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists expert_review_request_events_lookup_idx
  on private.expert_review_request_events(request_id, created_at asc);

alter table private.expert_assignments
  add column if not exists review_request_id uuid references private.expert_review_requests(id) on delete set null;
create index if not exists expert_assignments_review_request_idx
  on private.expert_assignments(review_request_id, created_at asc)
  where review_request_id is not null;

alter table private.expert_review_requests enable row level security;
alter table private.expert_review_request_events enable row level security;

revoke all on private.expert_review_requests, private.expert_review_request_events from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update on private.expert_review_requests to service_role;
grant select, insert on private.expert_review_request_events to service_role;

-- Request history is append-only.  The request projection itself may advance
-- through the state machine; only its event ledger is immutable.
create or replace function private.reject_expert_review_request_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'EXPERT_REVIEW_REQUEST_EVENT_IMMUTABLE' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists expert_review_request_events_no_mutation on private.expert_review_request_events;
create trigger expert_review_request_events_no_mutation
before update or delete on private.expert_review_request_events
for each row execute function private.reject_expert_review_request_event_mutation();
```

</details>

<details>
<summary>202609160001_private_roles_service_rls.sql</summary>

```sql
begin;

-- private.roles is a server-owned lookup table.  Browser roles never need
-- direct access; the server-side service_role path already has the explicit
-- table grants used by the auth/profile/session repositories.  Keep that
-- contract while closing the Supabase RLS-disabled advisor finding.
alter table private.roles enable row level security;

drop policy if exists roles_service_only on private.roles;
create policy roles_service_only on private.roles
  for all
  to service_role
  using (true)
  with check (true);

revoke all on private.roles from public, anon, authenticated;
grant select, insert, update, delete on private.roles to service_role;

commit;
```

</details>

<details>
<summary>202609170001_durable_academic_workflows.sql</summary>

```sql
begin;

-- Academic workflow state is server-owned. The browser receives read-only
-- projections; all writes go through the authenticated server repository.
create table if not exists public.academic_workflow_plans (
  id text primary key check (char_length(id) between 1 and 180),
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null default 1 check (revision >= 1),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academic_workflow_plans_owner_idx
  on public.academic_workflow_plans(owner_id, updated_at desc);

create table if not exists public.academic_workflow_tasks (
  id text primary key check (char_length(id) between 1 and 180),
  plan_id text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  assignee_id uuid references auth.users(id) on delete set null,
  task_type text not null check (char_length(task_type) between 1 and 120),
  status text not null check (char_length(status) between 1 and 80),
  trust_case_id uuid references public.trust_cases(id) on delete set null,
  trust_case_revision integer check (trust_case_revision is null or trust_case_revision >= 1),
  revision integer not null default 1 check (revision >= 1),
  idempotency_key text,
  payload jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academic_workflow_tasks_owner_idx
  on public.academic_workflow_tasks(owner_id, updated_at desc);
create index if not exists academic_workflow_tasks_assignee_idx
  on public.academic_workflow_tasks(assignee_id, updated_at desc)
  where assignee_id is not null;
create index if not exists academic_workflow_tasks_plan_idx
  on public.academic_workflow_tasks(owner_id, plan_id, updated_at desc);
create unique index if not exists academic_workflow_tasks_idempotency_idx
  on public.academic_workflow_tasks(owner_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.academic_workflow_task_events (
  event_id text primary key check (char_length(event_id) between 1 and 180),
  task_id text not null references public.academic_workflow_tasks(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 120),
  from_state text,
  to_state text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists academic_workflow_task_events_task_idx
  on public.academic_workflow_task_events(task_id, created_at asc);

-- Extend the canonical notification projection without replacing its existing
-- Evidence Passport contract. Legacy rows remain valid and keep their UUID id.
alter table public.notifications add column if not exists notification_key text;
alter table public.notifications add column if not exists dedupe_key text;
alter table public.notifications add column if not exists task_id text;
alter table public.notifications add column if not exists status text not null default 'SCHEDULED';
alter table public.notifications add column if not exists priority text not null default 'MEDIUM';
alter table public.notifications add column if not exists source_type text;
alter table public.notifications add column if not exists source_id text;
alter table public.notifications add column if not exists action_url text;
alter table public.notifications add column if not exists due_at timestamptz;
alter table public.notifications add column if not exists scheduled_at timestamptz;
alter table public.notifications add column if not exists expires_at timestamptz;
alter table public.notifications add column if not exists sent_at timestamptz;
alter table public.notifications add column if not exists acknowledged_at timestamptz;
alter table public.notifications add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists history jsonb not null default '[]'::jsonb;
alter table public.notifications add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists revision integer not null default 1;
alter table public.notifications add column if not exists updated_at timestamptz not null default now();

create unique index if not exists notifications_owner_notification_key_idx
  on public.notifications(owner_id, notification_key)
  where notification_key is not null;
create index if not exists notifications_owner_task_idx
  on public.notifications(owner_id, task_id, created_at desc)
  where task_id is not null;
create index if not exists notifications_owner_status_idx
  on public.notifications(owner_id, status, scheduled_at asc);

alter table public.academic_workflow_plans enable row level security;
alter table public.academic_workflow_tasks enable row level security;
alter table public.academic_workflow_task_events enable row level security;
alter table public.notifications enable row level security;

drop policy if exists academic_workflow_plans_own_select on public.academic_workflow_plans;
create policy academic_workflow_plans_own_select on public.academic_workflow_plans
  for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists academic_workflow_tasks_scoped_select on public.academic_workflow_tasks;
create policy academic_workflow_tasks_scoped_select on public.academic_workflow_tasks
  for select to authenticated
  using ((select auth.uid()) = owner_id or (select auth.uid()) = assignee_id);

drop policy if exists academic_workflow_task_events_scoped_select on public.academic_workflow_task_events;
create policy academic_workflow_task_events_scoped_select on public.academic_workflow_task_events
  for select to authenticated
  using (
    (select auth.uid()) = owner_id
    or exists (
      select 1
        from public.academic_workflow_tasks task
       where task.id = public.academic_workflow_task_events.task_id
         and task.assignee_id = (select auth.uid())
    )
  );

drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications
  for select to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on public.academic_workflow_plans,
  public.academic_workflow_tasks,
  public.academic_workflow_task_events,
  public.notifications from public, anon, authenticated;

grant select on public.academic_workflow_plans,
  public.academic_workflow_tasks,
  public.academic_workflow_task_events,
  public.notifications to authenticated;

grant select, insert, update, delete on public.academic_workflow_plans,
  public.academic_workflow_tasks,
  public.academic_workflow_task_events,
  public.notifications to service_role;

commit;
```

</details>

<details>
<summary>202609170002_demo_entitlements.sql</summary>

```sql
begin;

-- QA/product access is not an identity claim and is never stored in auth
-- metadata.  The user UUID is the only identity join key; the exact email
-- allowlist remains in the server-owned provisioning policy.
create table if not exists private.demo_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_code text not null check (entitlement_code in (
    'DEMO_FULL_USER_ACCESS',
    'DEMO_FULL_EXPERT_ACCESS',
    'QA_STUDENT_FEATURE_ACCESS'
  )),
  source text not null default 'QA_PROVISIONED' check (source = 'QA_PROVISIONED'),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  primary key (user_id, entitlement_code),
  check (expires_at is null or expires_at > granted_at)
);

create index if not exists demo_entitlements_active_user_idx
  on private.demo_entitlements(user_id, entitlement_code)
  where revoked_at is null;

alter table private.demo_entitlements enable row level security;
drop policy if exists demo_entitlements_service_only on private.demo_entitlements;
create policy demo_entitlements_service_only on private.demo_entitlements
  for all to service_role
  using (true)
  with check (true);

revoke all on private.demo_entitlements from public, anon, authenticated;
grant select, insert, update on private.demo_entitlements to service_role;

commit;
```

</details>

<details>
<summary>202609170003_profile_presentation_columns.sql</summary>

```sql
-- StudentHub AI — Add presentation columns to public.profiles
--
-- Safe, additive migration for student education profile presentation fields.
-- Only presentation fields (university, major) are added.
-- Authority, roles, and reputation remain strictly server-owned in private schema.

begin;

alter table if exists public.profiles
  add column if not exists university text check (char_length(university) <= 180),
  add column if not exists major text check (char_length(major) <= 180);

grant select(university, major) on public.profiles to authenticated;
grant update(university, major) on public.profiles to authenticated;

commit;
```

</details>

<details>
<summary>202609170004_academic_timetables.sql</summary>

```sql
begin;

-- Canonical academic timetable state. Images are intentionally not retained:
-- the server keeps the upload in memory long enough to obtain an editable
-- draft, then only a user-confirmed timetable is persisted.
create table if not exists public.user_timetables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Thời khóa biểu'
    check (char_length(name) between 1 and 180),
  academic_term text
    check (academic_term is null or char_length(academic_term) between 1 and 120),
  source_type text not null default 'MANUAL'
    check (source_type in ('MANUAL', 'IMAGE')),
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'ARCHIVED')),
  is_active boolean not null default false,
  source_artifact_id uuid,
  idempotency_key text
    check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  request_digest text
    check (request_digest is null or request_digest ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index if not exists user_timetables_one_active_idx
  on public.user_timetables(user_id)
  where is_active = true;

create unique index if not exists user_timetables_idempotency_idx
  on public.user_timetables(user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists user_timetables_user_idx
  on public.user_timetables(user_id, updated_at desc);

create index if not exists user_timetables_user_active_idx
  on public.user_timetables(user_id, is_active);

create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_name text not null check (char_length(course_name) between 1 and 240),
  course_code text
    check (course_code is null or char_length(course_code) between 1 and 80),
  day_of_week smallint not null check (day_of_week between 1 and 7),
  start_time time,
  end_time time,
  period_start smallint check (period_start is null or period_start between 1 and 99),
  period_end smallint check (period_end is null or period_end between 1 and 99),
  room text check (room is null or char_length(room) between 1 and 120),
  building text check (building is null or char_length(building) between 1 and 120),
  lecturer text check (lecturer is null or char_length(lecturer) between 1 and 180),
  class_group text check (class_group is null or char_length(class_group) between 1 and 120),
  week_range text check (week_range is null or char_length(week_range) between 1 and 120),
  notes text check (notes is null or char_length(notes) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (timetable_id, user_id)
    references public.user_timetables(id, user_id)
    on delete cascade
);

create index if not exists timetable_entries_user_idx
  on public.timetable_entries(user_id, updated_at desc);
create index if not exists timetable_entries_timetable_idx
  on public.timetable_entries(timetable_id, day_of_week, start_time);
create index if not exists timetable_entries_day_idx
  on public.timetable_entries(day_of_week, start_time);

-- A reminder is an explicit user intention, not an inferred university
-- deadline. Notification delivery can consume this durable intent later.
create table if not exists public.timetable_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timetable_id uuid not null references public.user_timetables(id) on delete cascade,
  entry_id uuid references public.timetable_entries(id) on delete cascade,
  task_id text,
  offset_minutes integer not null check (offset_minutes between 0 and 10080),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (entry_id is not null or task_id is not null),
  foreign key (timetable_id, user_id)
    references public.user_timetables(id, user_id)
    on delete cascade,
  foreign key (entry_id, user_id)
    references public.timetable_entries(id, user_id)
    on delete cascade
);

create unique index if not exists timetable_reminders_entry_offset_idx
  on public.timetable_reminders(user_id, timetable_id, entry_id, offset_minutes)
  where entry_id is not null;
create unique index if not exists timetable_reminders_task_offset_idx
  on public.timetable_reminders(user_id, timetable_id, task_id, offset_minutes)
  where task_id is not null;
create index if not exists timetable_reminders_user_idx
  on public.timetable_reminders(user_id, is_active, updated_at desc);

alter table public.user_timetables enable row level security;
alter table public.timetable_entries enable row level security;
alter table public.timetable_reminders enable row level security;

drop policy if exists user_timetables_own_select on public.user_timetables;
create policy user_timetables_own_select on public.user_timetables
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_timetables_own_insert on public.user_timetables;
create policy user_timetables_own_insert on public.user_timetables
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists user_timetables_own_update on public.user_timetables;
create policy user_timetables_own_update on public.user_timetables
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_timetables_own_delete on public.user_timetables;
create policy user_timetables_own_delete on public.user_timetables
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists timetable_entries_own_select on public.timetable_entries;
create policy timetable_entries_own_select on public.timetable_entries
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_timetables timetable
      where timetable.id = timetable_entries.timetable_id
        and timetable.user_id = (select auth.uid())
    )
  );

drop policy if exists timetable_entries_own_insert on public.timetable_entries;
create policy timetable_entries_own_insert on public.timetable_entries
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_timetables timetable
      where timetable.id = timetable_entries.timetable_id
        and timetable.user_id = (select auth.uid())
    )
  );

drop policy if exists timetable_entries_own_update on public.timetable_entries;
create policy timetable_entries_own_update on public.timetable_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_timetables timetable
      where timetable.id = timetable_entries.timetable_id
        and timetable.user_id = (select auth.uid())
    )
  );

drop policy if exists timetable_entries_own_delete on public.timetable_entries;
create policy timetable_entries_own_delete on public.timetable_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists timetable_reminders_own_select on public.timetable_reminders;
create policy timetable_reminders_own_select on public.timetable_reminders
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists timetable_reminders_own_insert on public.timetable_reminders;
create policy timetable_reminders_own_insert on public.timetable_reminders
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_timetables timetable
      where timetable.id = timetable_reminders.timetable_id
        and timetable.user_id = (select auth.uid())
    )
    and (entry_id is null or exists (
      select 1 from public.timetable_entries entry
       where entry.id = timetable_reminders.entry_id
         and entry.timetable_id = timetable_reminders.timetable_id
         and entry.user_id = (select auth.uid())
    ))
  );

drop policy if exists timetable_reminders_own_update on public.timetable_reminders;
create policy timetable_reminders_own_update on public.timetable_reminders
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_timetables timetable
       where timetable.id = timetable_reminders.timetable_id
         and timetable.user_id = (select auth.uid())
    )
    and (entry_id is null or exists (
      select 1 from public.timetable_entries entry
       where entry.id = timetable_reminders.entry_id
         and entry.timetable_id = timetable_reminders.timetable_id
         and entry.user_id = (select auth.uid())
    ))
  );

drop policy if exists timetable_reminders_own_delete on public.timetable_reminders;
create policy timetable_reminders_own_delete on public.timetable_reminders
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.user_timetables, public.timetable_entries, public.timetable_reminders
  from public, anon;
grant select, insert, update, delete
  on public.user_timetables, public.timetable_entries, public.timetable_reminders
  to authenticated;
grant select, insert, update, delete
  on public.user_timetables, public.timetable_entries, public.timetable_reminders
  to service_role;

commit;
```

</details>

<details>
<summary>202609180001_reputation_events_idempotency.sql</summary>

```sql
-- StudentHub AI — Migration: Reputation Events Idempotency Constraint
-- Enforces database-level uniqueness on idempotency_key for append-only reputation ledger.

alter table if exists private.reputation_events
  add column if not exists idempotency_key text unique;

create index if not exists idx_reputation_events_user_id
  on private.reputation_events(user_id);
```

</details>

<details>
<summary>202609200001_profile_onboarding_fields.sql</summary>

```sql
-- StudentHub AI — Persist onboarding presentation fields
--
-- Avatar selection and academic year are presentation data, not authority.
-- This migration is additive and does not alter existing user identity data.

begin;

alter table if exists public.profiles
  add column if not exists avatar_id text check (char_length(avatar_id) <= 80),
  add column if not exists academic_year text check (char_length(academic_year) <= 80);

grant select(avatar_id, academic_year) on public.profiles to authenticated;
grant update(avatar_id, academic_year) on public.profiles to authenticated;

commit;
```

</details>

<details>
<summary>20260926111838_community_nested_comments.sql</summary>

```sql
begin;

-- Community discussion is server-owned.  Browser roles cannot query this
-- table directly; the API returns a public, identity-minimized projection.
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  parent_comment_id uuid,
  author_id uuid not null references auth.users(id) on delete restrict,
  content text not null check (char_length(content) between 1 and 4000),
  depth smallint not null default 0 check (depth between 0 and 3),
  status text not null default 'PUBLISHED' check (status in ('PUBLISHED', 'DELETED', 'MODERATED')),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, idempotency_key),
  unique (id, contribution_id),
  foreign key (parent_comment_id, contribution_id)
    references public.community_comments(id, contribution_id) on delete cascade
);

create index if not exists community_comments_thread_idx
  on public.community_comments(contribution_id, created_at asc, id asc)
  where status = 'PUBLISHED';
create index if not exists community_comments_parent_idx
  on public.community_comments(parent_comment_id, created_at asc, id asc)
  where status = 'PUBLISHED';

alter table public.community_comments enable row level security;
drop policy if exists community_comments_service_only on public.community_comments;
create policy community_comments_service_only on public.community_comments
  for all to service_role using (true) with check (true);
revoke all on public.community_comments from public, anon, authenticated;
grant select, insert, update, delete on public.community_comments to service_role;

commit;
```

</details>

<details>
<summary>20260926112754_community_expert_request_linkage.sql</summary>

```sql
begin;

-- Keep the Community-to-Expert bridge private.  The assigned reviewer receives
-- only the already-published, redacted contribution through the blind dossier.
alter table private.expert_review_requests
  add column if not exists community_contribution_id uuid
  references public.community_contributions(id) on delete set null;

create index if not exists expert_review_requests_community_contribution_idx
  on private.expert_review_requests(community_contribution_id)
  where community_contribution_id is not null;

commit;
```

</details>

<details>
<summary>20260927032100_trust_four_layer_stage_constraint.sql</summary>

```sql
BEGIN;

ALTER TABLE public.trust_stage_runs
  DROP CONSTRAINT IF EXISTS trust_stage_runs_stage_id_check;

ALTER TABLE public.trust_stage_runs
  ADD CONSTRAINT trust_stage_runs_stage_id_check
  CHECK (stage_id IN ('l1', 'l2', 'l2a', 'l2b', 'l2c', 'l3', 'l4', 'l5'));

COMMIT;
```

</details>

<details>
<summary>20260929135354_studenthub_expert_v5_missions_rooms.sql</summary>

```sql
-- Expert V5: real-source missions and evidence-based verification rooms.
-- This migration defines durable contracts only. It contains no synthetic
-- source/question/room/reputation data and must be applied by the approved
-- staging migration owner before any live assurance run.

alter table if exists private.reputation_events
  add column if not exists context jsonb not null default '{}'::jsonb;

create table if not exists private.expert_v5_config (
  config_key text primary key check (char_length(config_key) between 1 and 100),
  config_value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Five mission levels are an explicit learning progression. They are separate
-- from professional credentials and from ExpertReputationPolicy stars.
create table if not exists private.expert_mission_level_policy (
  mission_level smallint primary key check (mission_level between 1 and 5),
  completed_missions_required integer not null unique check (completed_missions_required >= 0),
  allowed_difficulties text[] not null check (cardinality(allowed_difficulties) > 0),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  check (allowed_difficulties <@ array['EASY','MEDIUM','HARD']::text[])
);

insert into private.expert_mission_level_policy
  (mission_level, completed_missions_required, allowed_difficulties)
values
  (1, 0,  array['EASY']::text[]),
  (2, 5,  array['EASY','MEDIUM']::text[]),
  (3, 15, array['MEDIUM']::text[]),
  (4, 30, array['MEDIUM','HARD']::text[]),
  (5, 50, array['HARD']::text[])
on conflict (mission_level) do nothing;

insert into private.expert_v5_config(config_key, config_value)
values
  ('mission_timezone', '"Asia/Ho_Chi_Minh"'::jsonb),
  ('question_validity_days', '30'::jsonb),
  ('mission_attempt_seconds', '180'::jsonb),
  ('room_answer_seconds', '30'::jsonb),
  ('room_participant_limit', '6'::jsonb),
  ('room_presence_lease_seconds', '45'::jsonb),
  ('room_supervisor_offer_seconds', '90'::jsonb),
  ('room_daily_reputation_cap', '5'::jsonb),
  ('room_score_threshold_earned', '70'::jsonb),
  ('room_score_threshold_excellent', '95'::jsonb),
  ('room_reputation_delta_earned', '1'::jsonb),
  ('room_reputation_delta_excellent', '2'::jsonb),
  ('room_ingestion_lease_seconds', '180'::jsonb)
on conflict (config_key) do nothing;

create table if not exists private.expert_v5_source_registry (
  id uuid primary key default gen_random_uuid(),
  canonical_host text not null unique check (char_length(canonical_host) between 1 and 253),
  domain_code text not null check (char_length(domain_code) between 2 and 80),
  category text not null check (char_length(category) between 2 and 80),
  fetch_policy text not null default 'TRUST_PUBLIC_RETRIEVAL' check (fetch_policy in ('TRUST_PUBLIC_RETRIEVAL')),
  license_notes text not null check (char_length(license_notes) between 1 and 1000),
  enabled boolean not null default false,
  max_requests_per_day integer not null default 10 check (max_requests_per_day between 1 and 1000),
  min_request_interval_seconds integer not null default 60 check (min_request_interval_seconds between 1 and 86400),
  requests_in_window integer not null default 0 check (requests_in_window between 0 and 1000),
  window_started_at timestamptz not null default now(),
  last_request_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists expert_v5_source_registry_creator_idx
  on private.expert_v5_source_registry(created_by);

create table if not exists private.expert_v5_source_events (
  id bigint generated always as identity primary key,
  source_id uuid not null references private.expert_v5_source_registry(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'REGISTERED','POLICY_UPDATED','ENABLED','DISABLED',
    'INGEST_SUCCEEDED','INGEST_BLOCKED','INGEST_UNAVAILABLE'
  )),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 16384),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now()
);
create index if not exists expert_v5_source_events_lookup_idx
  on private.expert_v5_source_events(source_id, created_at desc);
create index if not exists expert_v5_source_events_actor_idx
  on private.expert_v5_source_events(actor_id, created_at desc);

create table if not exists private.expert_v5_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references private.expert_v5_source_registry(id) on delete restrict,
  requested_url text not null check (char_length(requested_url) between 9 and 2048),
  canonical_url text check (canonical_url is null or char_length(canonical_url) between 9 and 2048),
  title text check (title is null or char_length(title) <= 500),
  publisher text check (publisher is null or char_length(publisher) <= 300),
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  source_type text not null default 'PUBLIC_WEB' check (source_type in ('PUBLIC_WEB','OFFICIAL_DOCUMENTATION','GOVERNMENT','UNIVERSITY','RESEARCH','PUBLIC_DATASET')),
  content_hash text check (content_hash is null or content_hash ~ '^[a-fA-F0-9]{64}$'),
  retrieval_status text not null check (retrieval_status in ('SUCCESS','BLOCKED','UNAVAILABLE')),
  blocked_reason text check (blocked_reason is null or char_length(blocked_reason) <= 120),
  ingestion_key text not null unique check (char_length(ingestion_key) between 1 and 180),
  evidence_items jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_items) = 'array'),
  provider_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_metadata) = 'object'),
  created_at timestamptz not null default now(),
  check (pg_column_size(evidence_items) <= 16384),
  check ((retrieval_status = 'SUCCESS' and canonical_url is not null and content_hash is not null)
      or retrieval_status <> 'SUCCESS')
);
create index if not exists expert_v5_source_snapshots_source_retrieved_idx
  on private.expert_v5_source_snapshots(source_id, retrieved_at desc);
create unique index if not exists expert_v5_source_snapshots_hash_idx
  on private.expert_v5_source_snapshots(source_id, content_hash)
  where content_hash is not null;

create table if not exists private.expert_v5_ingestion_requests (
  ingestion_key text primary key check (char_length(ingestion_key) between 1 and 180),
  source_id uuid not null references private.expert_v5_source_registry(id) on delete restrict,
  requested_url text not null check (char_length(requested_url) between 9 and 2048),
  state text not null default 'PROCESSING' check (state in ('PROCESSING','COMPLETED')),
  lease_expires_at timestamptz not null,
  snapshot_id uuid references private.expert_v5_source_snapshots(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((state = 'PROCESSING' and snapshot_id is null) or (state = 'COMPLETED' and snapshot_id is not null))
);
create index if not exists expert_v5_ingestion_requests_lease_idx
  on private.expert_v5_ingestion_requests(state, lease_expires_at);
create index if not exists expert_v5_ingestion_requests_source_idx
  on private.expert_v5_ingestion_requests(source_id, created_at desc);
create index if not exists expert_v5_ingestion_requests_snapshot_idx
  on private.expert_v5_ingestion_requests(snapshot_id) where snapshot_id is not null;

create table if not exists private.expert_v5_questions (
  question_id uuid not null default gen_random_uuid(),
  question_version integer not null default 1 check (question_version > 0),
  source_snapshot_id uuid not null references private.expert_v5_source_snapshots(id) on delete restrict,
  domain_code text not null check (char_length(domain_code) between 2 and 80),
  question_type text not null check (question_type in ('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE')),
  difficulty text not null check (difficulty in ('EASY','MEDIUM','HARD')),
  prompt text not null check (char_length(prompt) between 20 and 1200),
  choices jsonb not null default '[]'::jsonb check (jsonb_typeof(choices) = 'array'),
  answer_key jsonb not null,
  explanation text not null check (char_length(explanation) between 20 and 2400),
  evidence_refs jsonb not null check (jsonb_typeof(evidence_refs) = 'array' and jsonb_array_length(evidence_refs) > 0),
  difficulty_features jsonb not null default '{}'::jsonb check (jsonb_typeof(difficulty_features) = 'object'),
  source_content_hash text not null check (source_content_hash ~ '^[a-fA-F0-9]{64}$'),
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','REVALIDATION_REQUIRED','RETIRED')),
  valid_until timestamptz,
  editorial_reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (question_id, question_version),
  check ((status <> 'ACTIVE') or (editorial_reviewer_id is not null and reviewed_at is not null))
);
create index if not exists expert_v5_questions_active_domain_difficulty_idx
  on private.expert_v5_questions(domain_code, difficulty, created_at desc)
  where status = 'ACTIVE';
create index if not exists expert_v5_questions_source_snapshot_idx
  on private.expert_v5_questions(source_snapshot_id);
create index if not exists expert_v5_questions_reviewer_idx
  on private.expert_v5_questions(editorial_reviewer_id) where editorial_reviewer_id is not null;
create index if not exists expert_v5_questions_creator_idx
  on private.expert_v5_questions(created_by) where created_by is not null;

create table if not exists private.expert_v5_question_events (
  id bigint generated always as identity primary key,
  question_id uuid not null,
  question_version integer not null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('DRAFT_CREATED','ACTIVATED','REVALIDATION_REQUIRED','RETIRED')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 16384),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now(),
  foreign key (question_id, question_version) references private.expert_v5_questions(question_id, question_version) on delete restrict
);
create index if not exists expert_v5_question_events_lookup_idx
  on private.expert_v5_question_events(question_id, question_version, created_at);
create index if not exists expert_v5_question_events_actor_idx
  on private.expert_v5_question_events(actor_id, created_at desc);

create table if not exists private.expert_mission_progression (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_missions integer not null default 0 check (completed_missions >= 0),
  mission_level smallint not null default 1 check (mission_level between 1 and 5),
  updated_at timestamptz not null default now()
);

create table if not exists private.expert_daily_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_date date not null,
  timezone text not null check (char_length(timezone) between 1 and 80),
  mission_type text not null check (mission_type in ('SOURCE_QUIZ','LIVE_ROOM','SUPERVISOR_REVIEW')),
  domain_code text not null check (char_length(domain_code) between 2 and 80),
  mission_level smallint not null check (mission_level between 1 and 5),
  question_id uuid,
  question_version integer,
  difficulty text check (difficulty is null or difficulty in ('EASY','MEDIUM','HARD')),
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE','IN_PROGRESS','COMPLETED','EXPIRED','UNRESOLVED')),
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  foreign key (question_id, question_version) references private.expert_v5_questions(question_id, question_version) on delete restrict,
  unique(user_id, mission_date, mission_type, domain_code)
);
create index if not exists expert_daily_missions_user_date_idx
  on private.expert_daily_missions(user_id, mission_date desc, assigned_at desc);
create index if not exists expert_daily_missions_question_idx
  on private.expert_daily_missions(question_id, question_version) where question_id is not null;

create table if not exists private.expert_mission_attempts (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references private.expert_daily_missions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null,
  question_version integer not null,
  status text not null default 'IN_PROGRESS' check (status in ('IN_PROGRESS','SUBMITTED','EVALUATED','REVIEW_REQUIRED','EXPIRED')),
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  submitted_at timestamptz,
  score numeric(5,2) check (score is null or score between 0 and 100),
  is_correct boolean,
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result) = 'object'),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  foreign key (question_id, question_version) references private.expert_v5_questions(question_id, question_version) on delete restrict,
  unique(mission_id, user_id)
);
create index if not exists expert_mission_attempts_user_started_idx
  on private.expert_mission_attempts(user_id, started_at desc);
create index if not exists expert_mission_attempts_question_idx
  on private.expert_mission_attempts(question_id, question_version);

create table if not exists private.expert_mission_answers (
  attempt_id uuid primary key references private.expert_mission_attempts(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer jsonb not null,
  submitted_at timestamptz not null default now(),
  answer_hash text not null check (answer_hash ~ '^[a-fA-F0-9]{64}$')
);
create index if not exists expert_mission_answers_user_idx
  on private.expert_mission_answers(user_id, submitted_at desc);

create table if not exists private.expert_mission_events (
  id bigint generated always as identity primary key,
  mission_id uuid not null references private.expert_daily_missions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null check (event_type in ('ASSIGNED','STARTED','ANSWER_SUBMITTED','EVALUATED','EXPIRED','SOURCE_REVALIDATION_REQUIRED')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 16384),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now()
);
create index if not exists expert_mission_events_user_created_idx
  on private.expert_mission_events(user_id, created_at desc);
create index if not exists expert_mission_events_mission_idx
  on private.expert_mission_events(mission_id, created_at desc);

create table if not exists private.expert_room_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  heartbeat_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (expires_at > heartbeat_at and expires_at <= heartbeat_at + interval '2 minutes')
);
create index if not exists expert_room_presence_online_idx on private.expert_room_presence(expires_at);

create table if not exists private.expert_verification_rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete restrict,
  domain_code text not null check (char_length(domain_code) between 2 and 80),
  input_type text not null check (input_type in ('TEXT','URL','IMAGE','QR')),
  challenge_payload jsonb not null check (jsonb_typeof(challenge_payload) = 'object' and pg_column_size(challenge_payload) <= 12582912),
  status text not null default 'WAITING_FOR_SUPERVISOR' check (status in ('WAITING_FOR_SUPERVISOR','LOBBY','QUESTION_ACTIVE','ANSWER_LOCKED','TRUST_ANALYZING','ADJUDICATION','SUPERVISOR_CONFIRMATION','HOST_ACKNOWLEDGEMENT','DISPUTED','SETTLED','CLOSED','CANCELLED','TRUST_UNAVAILABLE','ADJUDICATION_BLOCKED')),
  supervisor_user_id uuid references auth.users(id) on delete set null,
  supervisor_offer_expires_at timestamptz,
  current_round_id uuid,
  trust_case_id uuid,
  trust_revision integer,
  evidence_package_id uuid,
  revision bigint not null default 1 check (revision > 0),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  request_hash text not null check (request_hash ~ '^[a-fA-F0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists expert_verification_rooms_open_domain_idx
  on private.expert_verification_rooms(domain_code, status, created_at desc);
create index if not exists expert_verification_rooms_host_created_idx
  on private.expert_verification_rooms(host_user_id, created_at desc);
create index if not exists expert_verification_rooms_supervisor_idx
  on private.expert_verification_rooms(supervisor_user_id, created_at desc) where supervisor_user_id is not null;
create index if not exists expert_verification_rooms_current_round_idx
  on private.expert_verification_rooms(current_round_id) where current_round_id is not null;
create index if not exists expert_verification_rooms_package_idx
  on private.expert_verification_rooms(evidence_package_id) where evidence_package_id is not null;

create table if not exists private.expert_room_participants (
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('HOST','PARTICIPANT_EXPERT','SUPERVISOR_EXPERT')),
  state text not null default 'JOINED' check (state in ('JOINED','LEFT','DISCONNECTED')),
  conflict_declaration text not null default 'NOT_REQUIRED' check (conflict_declaration in ('NOT_REQUIRED','NO_KNOWN_CONFLICT','CONFLICT_DECLARED')),
  conflict_declared_at timestamptz,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  last_seen_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique(room_id, user_id, role)
);
create index if not exists expert_room_participants_user_active_idx
  on private.expert_room_participants(user_id, last_seen_at desc) where state = 'JOINED';

create table if not exists private.expert_room_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  round_number integer not null check (round_number > 0),
  status text not null default 'LOBBY' check (status in ('LOBBY','QUESTION_ACTIVE','ANSWER_LOCKED','TRUST_ANALYZING','ADJUDICATION','SUPERVISOR_CONFIRMATION','HOST_ACKNOWLEDGEMENT','DISPUTED','SETTLED','CLOSED','TRUST_UNAVAILABLE','ADJUDICATION_BLOCKED')),
  round_started_at timestamptz,
  answer_deadline_at timestamptz,
  answer_locked_at timestamptz,
  trust_started_at timestamptz,
  trust_completed_at timestamptz,
  eligible_expert_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(eligible_expert_ids) = 'array'),
  created_at timestamptz not null default now(),
  unique(room_id, round_number),
  check ((status not in ('QUESTION_ACTIVE','ANSWER_LOCKED','TRUST_ANALYZING','ADJUDICATION','SUPERVISOR_CONFIRMATION','HOST_ACKNOWLEDGEMENT','DISPUTED','SETTLED'))
      or (round_started_at is not null and answer_deadline_at is not null))
);

alter table private.expert_verification_rooms
  drop constraint if exists expert_verification_rooms_current_round_fk;
alter table private.expert_verification_rooms
  add constraint expert_verification_rooms_current_round_fk
  foreign key (current_round_id) references private.expert_room_rounds(id) on delete set null;

create table if not exists private.expert_room_answers (
  round_id uuid not null references private.expert_room_rounds(id) on delete restrict,
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  expert_user_id uuid not null references auth.users(id) on delete restrict,
  response jsonb not null,
  answer_hash text not null check (answer_hash ~ '^[a-fA-F0-9]{64}$'),
  submitted_at timestamptz not null default now(),
  primary key(round_id, expert_user_id)
);
create index if not exists expert_room_answers_room_idx
  on private.expert_room_answers(room_id, round_id);

create table if not exists private.expert_room_evidence_packages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  round_id uuid not null unique references private.expert_room_rounds(id) on delete restrict,
  trust_case_id uuid,
  trust_revision integer,
  retrieval_state text not null check (retrieval_state in ('SUCCESS','BLOCKED','UNAVAILABLE','NOT_APPLICABLE')),
  trust_analysis_state text not null check (trust_analysis_state in ('COMPLETE','PARTIAL','N/A')),
  package jsonb not null check (jsonb_typeof(package) = 'object' and pg_column_size(package) <= 1048576),
  package_hash text not null check (package_hash ~ '^[a-fA-F0-9]{64}$'),
  created_at timestamptz not null default now()
);
create index if not exists expert_room_evidence_packages_room_idx
  on private.expert_room_evidence_packages(room_id, created_at desc);
alter table private.expert_verification_rooms
  drop constraint if exists expert_verification_rooms_package_fk;
alter table private.expert_verification_rooms
  add constraint expert_verification_rooms_package_fk
  foreign key (evidence_package_id) references private.expert_room_evidence_packages(id) on delete set null;

create table if not exists private.expert_room_adjudications (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  round_id uuid not null references private.expert_room_rounds(id) on delete restrict,
  expert_user_id uuid not null references auth.users(id) on delete restrict,
  supervisor_user_id uuid not null references auth.users(id) on delete restrict,
  rubric_version text not null,
  rubric_ratings jsonb not null check (jsonb_typeof(rubric_ratings) = 'object'),
  evidence_ids jsonb not null check (jsonb_typeof(evidence_ids) = 'array' and jsonb_array_length(evidence_ids) > 0),
  proposed_score numeric(5,2) not null check (proposed_score between 0 and 100),
  reason text not null check (char_length(reason) between 20 and 4000),
  proposal_hash text not null check (proposal_hash ~ '^[a-fA-F0-9]{64}$'),
  supervisor_confirmed_at timestamptz,
  host_acknowledged_at timestamptz,
  host_acknowledged_by uuid references auth.users(id) on delete set null,
  state text not null default 'PROPOSED' check (state in ('PROPOSED','SUPERVISOR_CONFIRMED','HOST_ACKNOWLEDGED','DISPUTED','SETTLED','REVIEW_REQUIRED')),
  created_at timestamptz not null default now(),
  unique(round_id, expert_user_id)
);
create index if not exists expert_room_adjudications_room_idx
  on private.expert_room_adjudications(room_id, created_at);
create index if not exists expert_room_adjudications_expert_idx
  on private.expert_room_adjudications(expert_user_id, created_at desc);
create index if not exists expert_room_adjudications_supervisor_idx
  on private.expert_room_adjudications(supervisor_user_id, created_at desc);

create table if not exists private.expert_room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  round_id uuid references private.expert_room_rounds(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('ROOM_CREATED','SUPERVISOR_OFFERED','SUPERVISOR_ACCEPTED','PARTICIPANT_JOINED','PARTICIPANT_LEFT','ROUND_STARTED','ANSWER_SUBMITTED','ANSWERS_LOCKED','TRUST_STARTED','TRUST_COMPLETED','TRUST_BLOCKED','ADJUDICATION_PROPOSED','SUPERVISOR_CONFIRMED','HOST_ACKNOWLEDGED','ROUND_DISPUTED','ROOM_SETTLED','ROOM_CLOSED')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 16384),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now()
);
create index if not exists expert_room_events_room_created_idx on private.expert_room_events(room_id, created_at);
create index if not exists expert_room_events_round_idx
  on private.expert_room_events(round_id, created_at desc) where round_id is not null;
create index if not exists expert_room_events_actor_idx
  on private.expert_room_events(actor_id, created_at desc) where actor_id is not null;

create or replace function private.expert_v5_reject_immutable_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Expert V5 audit records are append-only' using errcode = '55000';
end;
$$;

drop trigger if exists expert_v5_source_snapshot_immutable on private.expert_v5_source_snapshots;
create trigger expert_v5_source_snapshot_immutable before update or delete on private.expert_v5_source_snapshots
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_source_event_immutable on private.expert_v5_source_events;
create trigger expert_v5_source_event_immutable before update or delete on private.expert_v5_source_events
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_mission_answer_immutable on private.expert_mission_answers;
create trigger expert_v5_mission_answer_immutable before update or delete on private.expert_mission_answers
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_room_answer_immutable on private.expert_room_answers;
create trigger expert_v5_room_answer_immutable before update or delete on private.expert_room_answers
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_room_package_immutable on private.expert_room_evidence_packages;
create trigger expert_v5_room_package_immutable before update or delete on private.expert_room_evidence_packages
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_room_event_immutable on private.expert_room_events;
create trigger expert_v5_room_event_immutable before update or delete on private.expert_room_events
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_mission_event_immutable on private.expert_mission_events;
create trigger expert_v5_mission_event_immutable before update or delete on private.expert_mission_events
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_question_event_immutable on private.expert_v5_question_events;
create trigger expert_v5_question_event_immutable before update or delete on private.expert_v5_question_events
  for each row execute function private.expert_v5_reject_immutable_mutation();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'expert_v5_config', 'expert_mission_level_policy', 'expert_v5_source_registry', 'expert_v5_source_events',
    'expert_v5_source_snapshots', 'expert_v5_ingestion_requests', 'expert_v5_questions', 'expert_v5_question_events', 'expert_mission_progression',
    'expert_daily_missions', 'expert_mission_attempts', 'expert_mission_answers', 'expert_mission_events',
    'expert_room_presence', 'expert_verification_rooms', 'expert_room_participants',
    'expert_room_rounds', 'expert_room_answers', 'expert_room_evidence_packages',
    'expert_room_adjudications', 'expert_room_events'
  ] loop
    execute format('alter table private.%I enable row level security', table_name);
    execute format('revoke all on private.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on private.%I to service_role', table_name);
  end loop;
end
$$;

revoke all on function private.expert_v5_reject_immutable_mutation() from public, anon, authenticated;

-- No source or question seed is included here: content must be genuinely
-- retrieved, provenance-backed, editorially reviewed and available to serve.
```

</details>

<details>
<summary>20260929135553_expert_v5_trigger_path_and_fk_indexes.sql</summary>

```sql
-- Follow-up hardening after the first approved staging advisor pass.
-- The immutable trigger references only built-in PL/pgSQL operations; pin its
-- search path to pg_catalog and cover remaining user foreign-key lookups.

create or replace function private.expert_v5_reject_immutable_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'Expert V5 audit records are append-only' using errcode = '55000';
end;
$$;

create index if not exists expert_v5_config_updated_by_idx
  on private.expert_v5_config(updated_by) where updated_by is not null;
create index if not exists expert_room_answers_expert_idx
  on private.expert_room_answers(expert_user_id, round_id);
create index if not exists expert_room_adjudications_host_ack_idx
  on private.expert_room_adjudications(host_acknowledged_by)
  where host_acknowledged_by is not null;
```

</details>
