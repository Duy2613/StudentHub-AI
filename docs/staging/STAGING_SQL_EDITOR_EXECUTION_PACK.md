# STUDENTHUB AI — STAGING SQL EDITOR MANUAL EXECUTION PACK
**Target Staging Project**: `StudentHub-AI-Staging`  
**Project Ref**: `bniwtkjtramqaozrrtrk`
**Strict Safety Directive**: **DO NOT execute against Production (`kytdomflmjytzyaabogi`)**. Execution is strictly manual via the Supabase Dashboard SQL Editor for staging project `bniwtkjtramqaozrrtrk`.

---

## 1. Execution Overview & Strict Order

All migrations must be executed sequentially in **5 distinct steps**. Do not execute steps out of order. Each step corresponds to a canonical repository file in `database/migrations/`.

| Step | Source File | Schema / Area | Key Deliverable |
|---|---|---|---|
| **1** | `database/migrations/202608270001_v2_authority_foundation.sql` | `public`, `private`, `auth` | Core domain tables, V2 profiles, RBAC roles & sessions, RLS, user trigger |
| **2** | `database/migrations/202608290001_feature_freeze_cross_system.sql` | `public` | Evidence passports, decision scenarios, case follows, notifications |
| **3** | `database/migrations/202609010001_private_screenshot_storage.sql` | `public`, `storage` | Screenshot metadata table, private bucket `trust-screenshots-private`, storage RLS |
| **4** | `database/migrations/202609040001_security_outbox.sql` | `public` | Transactional security outbox boundary for Citadel |
| **5** | `database/migrations/202609040002_security_outbox_hardening.sql` | `private`, `public` | Relocates outbox to `private` schema, state machine transition trigger, hardening |

---

## 2. Migration Step-by-Step Instructions

---

### Step 1: V2 Authority Foundation
- **Source File**: `database/migrations/202608270001_v2_authority_foundation.sql`
- **Preconditions**:
  - Connected to Supabase Project `bniwtkjtramqaozrrtrk` in the SQL Editor.
  - Supabase default schemas (`auth`, `storage`, `extensions`, `public`) exist.
  - Project is a newly initialized staging database or existing staging baseline.
- **Action**: Copy the entire text of `database/migrations/202608270001_v2_authority_foundation.sql` and run it in the Supabase SQL Editor.
- **Expected Success Evidence**:
  - `Success. No rows returned` or transaction committed successfully.
  - Schema `private` created.
  - Tables created: `public.institutions`, `public.profiles`, `public.posts`, `public.comments`, `public.votes`, `public.trust_cases`, `public.case_inputs`, `public.entities`, `public.case_entities`, `public.evidence`, `public.claims`, `public.claim_sources`, `public.expert_profiles`, `public.expert_assessments`.
  - Private authority tables created: `private.roles`, `private.user_roles`, `private.server_sessions`, `private.audit_events`, `private.expert_domains`, `private.expert_verifications`, `private.reputation_events`.
  - Roles seeded in `private.roles`: `STUDENT`, `EXPERT`, `MODERATOR`, `ADMIN`, `SERVICE`.
  - Trigger `on_auth_user_created_v2` created on `auth.users`.
- **Post-Check SQL**:
```sql
-- Step 1 Verification
select table_schema, table_name, rowsecurity
from information_schema.tables t
join pg_tables p on p.schemaname = t.table_schema and p.tablename = t.table_name
where table_schema in ('public', 'private')
order by table_schema, table_name;

-- Check seeded roles
select * from private.roles order by id;

-- Check trigger on auth.users
select trigger_name, event_manipulation, event_object_table, action_statement
from information_schema.triggers
where event_object_schema = 'auth' and trigger_name = 'on_auth_user_created_v2';
```

---

### Step 2: Feature Freeze Cross-System
- **Source File**: `database/migrations/202608290001_feature_freeze_cross_system.sql`
- **Preconditions**:
  - Step 1 completed successfully.
  - `auth.users` exists.
- **Action**: Copy the entire text of `database/migrations/202608290001_feature_freeze_cross_system.sql` and run it in the Supabase SQL Editor.
- **Expected Success Evidence**:
  - `Success. No rows returned` or transaction committed successfully.
  - Tables created: `public.evidence_passports`, `public.evidence_passport_events`, `public.decision_scenarios`, `public.decision_options`, `public.case_follows`, `public.notifications`.
  - RLS enabled on all 6 tables with granular policies.
  - Permissions granted to `authenticated` and `service_role` per spec.
- **Post-Check SQL**:
```sql
-- Step 2 Verification
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'evidence_passports',
    'evidence_passport_events',
    'decision_scenarios',
    'decision_options',
    'case_follows',
    'notifications'
  );

-- Verify policy presence
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('evidence_passports', 'decision_scenarios', 'notifications')
order by tablename, policyname;
```

---

### Step 3: Private Screenshot Storage
- **Source File**: `database/migrations/202609010001_private_screenshot_storage.sql`
- **Preconditions**:
  - Step 1 and Step 2 completed successfully.
  - Table `public.trust_cases` exists (created in Step 1).
  - Schema `storage` and table `storage.buckets` exist.
- **Action**: Copy the entire text of `database/migrations/202609010001_private_screenshot_storage.sql` and run it in the Supabase SQL Editor.
- **Expected Success Evidence**:
  - `Success. No rows returned` or transaction committed successfully.
  - Table created: `public.screenshot_objects` with FK to `auth.users` and `public.trust_cases`.
  - Storage bucket `trust-screenshots-private` inserted with `public = false`.
  - Anonymous verification block passes without raising an exception.
  - RLS policies on `storage.objects` created: `screenshot_storage_authenticated_insert`, `screenshot_storage_owner_select`, `screenshot_storage_owner_delete`.
- **Post-Check SQL**:
```sql
-- Step 3 Verification: Bucket presence and privacy
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'trust-screenshots-private';

-- Verify table public.screenshot_objects
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'screenshot_objects';

-- Verify storage.objects policies
select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'screenshot_storage_%';
```

---

### Step 4: Security Outbox Initial Setup
- **Source File**: `database/migrations/202609040001_security_outbox.sql`
- **Preconditions**:
  - Step 1, 2, 3 completed successfully.
- **Action**: Copy the entire text of `database/migrations/202609040001_security_outbox.sql` and run it in the Supabase SQL Editor.
- **Expected Success Evidence**:
  - `Success. No rows returned` or transaction committed successfully.
  - Table created: `public.security_outbox`.
  - Indexes created: `idx_security_outbox_claim`, `idx_security_outbox_lease`.
  - RLS enabled; public/anon/authenticated revoked; permissions granted to `service_role`.
- **Post-Check SQL**:
```sql
-- Step 4 Verification
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'security_outbox';

select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'security_outbox';
```

---

### Step 5: Security Outbox Hardening & Isolation
- **Source File**: `database/migrations/202609040002_security_outbox_hardening.sql`
- **Preconditions**:
  - Step 4 completed (or clean baseline).
  - Schema `private` exists.
- **Action**: Copy the entire text of `database/migrations/202609040002_security_outbox_hardening.sql` and run it in the Supabase SQL Editor.
- **Expected Success Evidence**:
  - `Success. No rows returned` or transaction committed successfully.
  - Table `public.security_outbox` successfully relocated to `private.security_outbox`.
  - Function created: `private.validate_security_outbox_transition()`.
  - Trigger created: `trg_security_outbox_state_transition` on `private.security_outbox`.
  - Indexes updated: `idx_security_outbox_claim`, `idx_security_outbox_lease_recovery` on `private.security_outbox`.
  - Permissions revoked from public/anon/authenticated; granted to `service_role`.
- **Post-Check SQL**:
```sql
-- Step 5 Verification: Confirm migration to private schema
select table_schema, table_name
from information_schema.tables
where table_name = 'security_outbox';

-- Confirm trigger presence
select trigger_name, event_manipulation, event_object_schema, event_object_table, action_statement
from information_schema.triggers
where event_object_schema = 'private' and event_object_table = 'security_outbox';

-- Confirm function exists
select routine_schema, routine_name, security_type
from information_schema.routines
where routine_schema = 'private' and routine_name = 'validate_security_outbox_transition';
```

---

## 3. Comprehensive Post-Migration Verification Suite (Read-Only)

Run the following complete, safe, read-only diagnostic SQL block in the Supabase SQL Editor after executing all 5 migrations:

```sql
-- ==============================================================================
-- STUDENTHUB AI — POST-MIGRATION COMPLETE READ-ONLY VERIFICATION SUITE
-- Target: Staging project bniwtkjtramqaozrrtrk
-- Safe, non-destructive audit queries.
-- ==============================================================================

-- 1. SCHEMAS VERIFICATION
select schema_name
from information_schema.schemata
where schema_name in ('public', 'private', 'storage', 'auth', 'extensions')
order by schema_name;

-- 2. ALL APPLICATION TABLES & RLS STATUS
select 
  p.schemaname,
  p.tablename,
  p.rowsecurity as rls_enabled,
  p.tableowner
from pg_tables p
where p.schemaname in ('public', 'private')
order by p.schemaname, p.tablename;

-- 3. SPECIFIC CRITICAL TABLES EXISTENCE & SCHEMA LOCATION
select 
  table_schema,
  table_name,
  (select count(*) from information_schema.columns c where c.table_schema = t.table_schema and c.table_name = t.table_name) as column_count
from information_schema.tables t
where (table_schema = 'private' and table_name in ('security_outbox', 'server_sessions', 'audit_events', 'roles', 'user_roles'))
   or (table_schema = 'public' and table_name in ('profiles', 'institutions', 'posts', 'trust_cases', 'screenshot_objects', 'evidence_passports', 'decision_scenarios'))
order by table_schema, table_name;

-- 4. CONFIRM OUTBOX DOES NOT EXIST IN PUBLIC SCHEMA
select count(*) as public_outbox_count
from information_schema.tables
where table_schema = 'public' and table_name = 'security_outbox';
-- Expected: 0

-- 5. ROLES SEED VERIFICATION
select id, code, description
from private.roles
order by id;
-- Expected: 5 rows (STUDENT, EXPERT, MODERATOR, ADMIN, SERVICE)

-- 6. CRITICAL TRIGGERS AUDIT
select 
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_statement
from information_schema.triggers
where (event_object_schema = 'auth' and trigger_name = 'on_auth_user_created_v2')
   or (event_object_schema = 'private' and trigger_name = 'trg_security_outbox_state_transition');

-- 7. INDEXES AUDIT ON CRITICAL TABLES
select 
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname in ('public', 'private')
  and tablename in ('security_outbox', 'server_sessions', 'audit_events', 'screenshot_objects', 'evidence_passports')
order by schemaname, tablename, indexname;

-- 8. STORAGE BUCKET VERIFICATION
select 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
from storage.buckets
where id = 'trust-screenshots-private';
-- Expected: 1 row, public = false, file_size_limit = 8388608

-- 9. STORAGE POLICIES AUDIT
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- 10. POSTGREST SCHEMA EXPOSURE PERMISSIONS AUDIT
-- Confirms that anon and authenticated roles have NO direct table privileges on private schema
select 
  grantee,
  table_schema,
  table_name,
  privilege_type
from information_schema.table_privileges
where table_schema = 'private'
  and grantee in ('anon', 'authenticated', 'public')
order by table_name, privilege_type;
-- Expected: 0 rows
```
