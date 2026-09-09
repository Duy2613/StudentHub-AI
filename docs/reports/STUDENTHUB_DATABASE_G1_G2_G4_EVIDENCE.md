# StudentHub V5 — Database G1–G8 Live Evidence Report

- **Target Database:** Supabase PostgreSQL 17.6 (Tokyo AWS Pooler, Port 6543)
- **Environment Class:** Production Read/Write (Protected under Section 104)
- **Disposable DB Variable:** `STUDENTHUB_RLS_TEST_DATABASE_URL` (Status: `ABSENT`)
- **Inspection Script:** [`scripts/inspect-live-schema-drift.mjs`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/scripts/inspect-live-schema-drift.mjs)
- **Schema Drift Report:** [`docs/reports/STUDENTHUB_SCHEMA_DRIFT_REPORT_2026-09-09.md`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/reports/STUDENTHUB_SCHEMA_DRIFT_REPORT_2026-09-09.md)

---

## 1. Live Database Gates Assessment (G1–G8)

| Gate | Title | Target Condition | Live Observed Status | Evidence & Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **G1** | Clean Migration | Clean DB → run all 9 migrations → 0 errors | **`BLOCKED_BY_ENV`** | `STUDENTHUB_RLS_TEST_DATABASE_URL` is unset. Main DB cannot be dropped under Section 104 protection. |
| **G2** | Live RLS Matrix | Real roles (Anon, User A/B, Expert) enforced at DB level | **`RLS_STATIC_ONLY`** | Static RLS contracts pass. Live cross-role destructive DDL testing is blocked without disposable DB. |
| **G3** | Concurrency & Idempotency | Retry, concurrent edits, stale revision handling | **`VERIFIED`** | Outbox deduplication, transactional advisory locks (`hashtextextended`), and idempotency keys verified in test suites. |
| **G4** | Backup & Restore Readback | Backup → New DB → Restore → Boot → SHA-256 match | **`RESTORE_BLOCKED_BY_ENV`** | Physical restoration requires disposable target database to avoid overwriting production data. |
| **G5** | Private Storage & Signed URLs | Non-public bucket + short TTL signed URL + revoke | **`VERIFIED`** | Bucket `trust-screenshots-private` verified private (`public: false`). Unauthenticated public access returns 400. Signed URLs return 200 OK. |
| **G6** | Connection & Logging | TLS / Pooler / Logging | **`VERIFIED`** | Connected via TLS to Supabase pooler on port 6543 with SSL enabled. |
| **G7** | Application Authorization | BOLA / IDOR protection across API endpoints | **`VERIFIED`** | Scoped role verification rejects unauthorized modifications even when executed via backend service paths. |
| **G8** | Passport Replayability | Claim → Source → Hash → Verdict → Passport lineage | **`VERIFIED`** | Proven via [`scripts/studenthub-replay.mjs`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/scripts/studenthub-replay.mjs) across case runs. |

---

## 2. Live Migration State & Schema Drift Matrix

Live inspection against PostgreSQL 17.6 executed via:
```bash
node scripts/inspect-live-schema-drift.mjs
```
Yielded the following verifiable facts:
1. **Migrations 1 through 7 are LIVE and APPLIED:**
   - `public.screenshot_objects` exists (verified live).
   - `public.trust_runs` exists (verified live).
   - Tables for authority foundations, feature freeze, and qualification exist.
2. **Migrations 8 and 9 are PENDING:**
   - Migration 8 (`202609070001_realtime_event_log.sql`): `public.realtime_event_log` table and notify trigger.
   - Migration 9 (`202609090001_community_expert_promax.sql`): 14 objects across `public.community_source_clusters`, `public.community_contributions`, `private.expert_evaluations`, etc.
3. **Forward-Only Deployment Package:**
   - Checksums recorded in [`artifacts/candidate/STUDENTHUB_V5_CANDIDATE_MANIFEST.json`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/artifacts/candidate/STUDENTHUB_V5_CANDIDATE_MANIFEST.json).
   - Can be applied forward-only without data loss whenever authorized by the repository owner.

---

## 3. Disaster Recovery & Restoration Plan (G4 Protocol)

Supabase documentation emphasizes that **database backups do NOT contain object storage binaries**. PostgreSQL only stores file metadata (object keys, bucket IDs, MIME types).
Therefore, StudentHub V5 requires two independent recovery procedures:
1. **PostgreSQL Relational State Recovery:**
   - Point-in-time recovery (PITR) or pg_dump/pg_restore into a target database.
   - Boot application pointing to restored DB.
   - Read back: Trust Case, Run, Stages, Evidence Passport, Decision Twin, Expert Review.
   - Verify Merkle root SHA-256 matches pre-backup state.
2. **Object Storage Recovery:**
   - Mirroring of `trust-screenshots-private` bucket to cold S3/GCS secondary storage.
   - Re-attachment of storage volumes and re-signing of object pointers.
