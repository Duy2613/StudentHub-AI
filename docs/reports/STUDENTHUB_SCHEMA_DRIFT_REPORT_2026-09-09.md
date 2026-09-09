# StudentHub AI — Live Schema Drift & Migration Audit Report

**Date:** 2026-09-09  
**Authority:** Staff PostgreSQL/Supabase Engineer & Principal Backend Architect  
**Status:** SCHEMA_DRIFT_FOUND (Live DB Safe Audit Complete)  
**Database Host (Masked):** `aws-0-ap-northeast-1.pooler.supabase.com:6543`  
**Database Version:** PostgreSQL 17.6 on AWS Tokyo (ap-northeast-1)  

---

## 1. Executive Summary

A comprehensive, non-destructive audit was performed comparing all 9 repository migrations against the live Supabase PostgreSQL schema. 

### Key Findings:
1. **Migrations 1–7 are APPLIED & LIVE**:
   - `202608270001_v2_authority_foundation.sql`: `public.institutions`, `public.profiles`, `public.case_inputs`, `public.trust_cases`, `public.evidence_passports` exist and are live.
   - `202608290001_feature_freeze_cross_system.sql`: `public.decision_scenarios` exists and is live.
   - `202609010001_private_screenshot_storage.sql`: `public.screenshot_objects` exists and is live. (Clarification: An earlier report noted `private.trust_evidence_files` as pending; forensic inspection reveals migration `202609010001` creates `public.screenshot_objects`, which is verified present).
   - `202609060001_expert_qualification.sql`: `private.expert_verifications` exists and is live.
   - `202609060002_integration_outbox.sql`: `private.integration_outbox` exists and is live.
   - `202609060003_trust_runs_revisions.sql`: `public.trust_runs`, `public.trust_stage_runs`, `public.trust_case_revisions`, `public.trust_verdict_revisions` all exist and are live. (Clarification: An earlier report noted `public.case_runs` as pending; forensic inspection proves the canonical table name is `public.trust_runs`, which is verified present).
   - `202609060004_reports.sql`: `private.report_jobs` exists and is live.

2. **Migrations 8 & 9 are PENDING on Live DB (Schema Drift)**:
   - `202609070001_realtime_event_log.sql`: `private.realtime_events` (1 table).
   - `202609090001_community_expert_promax.sql`: 14 tables in `public` and `private` schemas.

Total expected tables/views in migrations: **58**  
Verified live on Supabase: **40**  
Missing live on Supabase: **15**  
Extra unexpected tables: **0**  

---

## 2. Object-Level Drift Matrix

| Object Name | Type | Migration File | Live Status | RLS Enabled | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `public.screenshot_objects` | TABLE | `202609010001_private_screenshot_storage.sql` | **VERIFIED** | TRUE | Private evidence metadata table |
| `public.trust_runs` | TABLE | `202609060003_trust_runs_revisions.sql` | **VERIFIED** | TRUE | Canonical trust execution runs |
| `public.trust_stage_runs` | TABLE | `202609060003_trust_runs_revisions.sql` | **VERIFIED** | TRUE | Granular stage observations |
| `public.trust_case_revisions` | TABLE | `202609060003_trust_runs_revisions.sql` | **VERIFIED** | TRUE | Append-only case revisions |
| `public.trust_verdict_revisions`| TABLE | `202609060003_trust_runs_revisions.sql` | **VERIFIED** | TRUE | Append-only verdict revisions |
| `private.expert_verifications` | TABLE | `202609060001_expert_qualification.sql` | **VERIFIED** | TRUE | Expert domain verification records |
| `private.integration_outbox` | TABLE | `202609060002_integration_outbox.sql` | **VERIFIED** | TRUE | Leased transactional outbox |
| `private.report_jobs` | TABLE | `202609060004_reports.sql` | **VERIFIED** | TRUE | Async report generation jobs |
| `private.realtime_events` | TABLE | `202609070001_realtime_event_log.sql` | **MISSING** | PENDING | Event log recovery source |
| `public.community_source_clusters` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | PR syndicate deduplication |
| `public.community_contributions` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Student contributions |
| `public.community_contribution_revisions` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Revision history |
| `private.community_file_objects` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Pre-publish attachment objects |
| `public.community_reactions` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Typed forum reactions |
| `private.community_reaction_events` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Reaction audit log |
| `private.expert_assignments` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Scoped expert case assignment |
| `private.expert_practice_submissions` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Qualification practice sandbox |
| `private.expert_practice_decisions` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Supervised qualification review |
| `private.expert_quality_events` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Expert quality ledger |
| `private.expert_review_decisions` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Supervised review decisions |
| `public.case_appeals` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Dispute and appeal cases |
| `private.case_appeal_reviews` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Independent appeal review |
| `public.case_corrections` | TABLE | `202609090001_community_expert_promax.sql` | **MISSING** | PENDING | Claim correction log |

---

## 3. Forward-Only Migration Reconciliation Plan

Under Section 4 and Section 104, no schema modifications are applied to the owner's live production Supabase instance during this audit pass.

### Safe Application Order:
1. **Prerequisite:** Validate migrations against a clean disposable database (`STUDENTHUB_RLS_TEST_DATABASE_URL`).
2. **Step 1:** Apply `database/migrations/202609070001_realtime_event_log.sql`:
   - Creates `private.realtime_events` with sequence generator, append-only trigger, and RLS policies.
   - Zero dependencies on Promax.
3. **Step 2:** Apply `database/migrations/202609090001_community_expert_promax.sql`:
   - Dependencies: Requires `public.trust_cases`, `public.profiles`, and `auth.users` (all verified present).
   - Creates Community and Expert Promax tables, indexes, and RLS policies.
4. **Step 3:** Re-run `scripts/inspect-live-schema-drift.mjs` to verify 58/58 objects aligned.

---

## 4. Verdict

**SCHEMA: `SCHEMA_DRIFT_FOUND`**  
*(Migrations 1–7 verified live on Supabase. Migrations 8 & 9 identified and prepared for forward-only application upon owner authorization).*
