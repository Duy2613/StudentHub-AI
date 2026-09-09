# StudentHub AI — Disposable Database G1, G2, G4 Status & Readiness Report

**Date:** 2026-09-09  
**Authority:** Staff PostgreSQL/Supabase Engineer & Test Architect  
**Status:** BLOCKED_BY_ENV (Safe Non-Destructive Posture Enforced)  
**Target Variable:** `STUDENTHUB_RLS_TEST_DATABASE_URL`  

---

## 1. Executive Summary & Section 104 Invariant

Under **Section 104 (Disposable DB Absolute Rule)**:
> *"Never run DROP, migration reset, restore rehearsal, chaos, race-heavy destructive tests, or RLS destructive fixtures against the owner's main database. Use dedicated disposable target. If missing: BLOCKED_BY_ENV. Continue safe checks."*

A thorough environment audit of [`frontend/.env.local`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/.env.local) confirms that:
- `DATABASE_URL` points to the owner's live Supabase instance (`aws-0-ap-northeast-1.pooler.supabase.com:6543`).
- `STUDENTHUB_RLS_TEST_DATABASE_URL` is **EMPTY / ABSENT**.

In strict adherence to the project invariants, destructive schema drop/re-creation (G1), multi-role destructive RLS bypass testing (G2), and live restore rehearsal (G4) were **withheld from execution on the production database**.

---

## 2. Distinction Between Application Authorization and Live RLS

Per Section 2 and Section 6 of the mission directives, authorization evidence is explicitly separated into two independent defense-in-depth layers:

### Layer A: Application-Level Object Authorization (`APPLICATION_AUTHORIZATION_LIVE`)
- **Status:** **`VERIFIED` (100% on Live Supabase)**
- **Evidence:** Executed live on Supabase via `frontend/tests/db/beta_user_database_proof.test.mjs`:
  - *Proof 1:* USER_A creates durable trust execution with idempotency key (`PASS`).
  - *Proof 2:* Cross-Tenant Isolation & IDOR Defense (`PASS`): USER_B cannot read or access USER_A's trust executions or report jobs, even when accessing through the server connection pool.
  - *Proof 3:* Idempotency Replay Verification (`PASS`): Same payload returns identical result; differing payload produces HTTP 409 conflict.
  - *Proof 4:* Durable Report Jobs Isolation (`PASS`).

### Layer B: PostgreSQL Row Level Security (`RLS_LIVE`)
- **Status:** **`RLS_STATIC_ONLY`**
- **Evidence:** Verified via static SQL contract tests in `phase3_migration_rls_contract.test.mjs` (5/5 PASS).
- **Reason for withholding live tests:** Requires executing `SET ROLE` as unprivileged roles (`anon`, `authenticated_user_a`, `authenticated_user_b`) and injecting test rows that could pollute the live production tables. Full live verification requires a dedicated disposable database.

---

## 3. Exact Resource Requirements for G1, G2, G4 Execution

To advance G1, G2, and G4 to `VERIFIED`, the following disposable environment is required:

1. **Disposable Database Instance:**
   - Provider: Ephemeral Supabase Project Branch, Neon branching DB, or local Dockerized PostgreSQL 17 container.
   - Required Environment Variable: `STUDENTHUB_RLS_TEST_DATABASE_URL=postgresql://postgres:password@localhost:54322/studenthub_test`
   - Privileges Required: Superuser / `postgres` role capable of executing `CREATE EXTENSION`, `CREATE SCHEMA`, `DROP SCHEMA`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, and `CREATE POLICY`.

2. **G1 Empty-State Migration Protocol:**
   - Execute all 9 migrations from scratch on a clean, empty database.
   - Verify zero errors, verify extension availability (`pgcrypto`, `uuid-ossp`), and compute final schema checksum.

3. **G2 Multi-Role RLS Protocol:**
   - Provision test actors in `auth.users`:
     - `USER_A` (Student)
     - `USER_B` (Student)
     - `EXPERT_IN_SCOPE` (Verified domain)
     - `EXPERT_OUT_OF_SCOPE` (Unverified domain)
     - `MODERATOR`
     - `ANON`
   - Execute test queries under `SET ROLE anon` and `SET request.jwt.claim.sub = 'user_id'`.
   - Prove RLS policy blocks cross-user reads at the database engine level.

4. **G4 Restore Drill Protocol:**
   - Populate database with deterministic Trust, Community, Expert, and Passport fixtures.
   - Record SHA-256 digests of all rows.
   - Execute `pg_dump -Fc -f studenthub_backup.dump`.
   - Restore into a brand-new target database: `pg_restore -d studenthub_restored studenthub_backup.dump`.
   - Re-point application to restored DB, boot Next.js, verify all artifacts read back identically, and measure:
     - **RTO (Recovery Time Objective):** Time to boot and serve after restore.
     - **RPO (Recovery Point Objective):** Zero transactions lost before dump.

---

## 4. Final Verdicts

- **G1 (SQL Compatibility):** `BLOCKED_BY_ENV` (Disposable DB required)
- **G2 (RLS Live):** `RLS_STATIC_ONLY` (Static contracts verified; live test requires disposable DB)
- **G4 (Restore):** `RESTORE_BLOCKED_BY_ENV` (Disposable restore instance required)
- **RLS OVERALL:** **`RLS_STATIC_ONLY`**
- **RESTORE OVERALL:** **`RESTORE_BLOCKED_BY_ENV`**
- **PILOT OVERALL:** **`PILOT_BACKEND_PARTIAL`** *(Cannot declare PILOT_BACKEND_READY while mandatory G1/G2/G4 remain blocked by environment).*
