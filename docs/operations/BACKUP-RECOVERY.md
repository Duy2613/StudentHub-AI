# StudentHub AI — Platform Backup & Recovery Architecture

## 1. Owner Supabase PostgreSQL Strategy

- **Target Database**: Supabase PostgreSQL 17.6 (`kytdomflmjytzyaabogi`).
- **Physical Backups**: Managed Point-in-Time Recovery (PITR) and daily automated WAL archiving enabled on the Supabase Pro infrastructure.
- **RPO (Recovery Point Objective)**: <= 5 minutes (WAL stream replication).
- **RTO (Recovery Time Objective)**: <= 30 minutes for automated point-in-time restore.

## 2. Forward-Only Migration Discipline

- All database schema evolutions MUST be applied via immutable numbered migrations in `database/migrations/`:
  - `202608270001_v2_authority_foundation.sql`
  - `202608290001_feature_freeze_cross_system.sql`
  - `202609010001_v2_evidence_indexes.sql`
- Destructive operations (`DROP TABLE`, `ALTER TABLE ... DROP COLUMN`) are strictly forbidden without an explicit two-phase deprecation cycle.
- Each migration is idempotent (`IF NOT EXISTS`, `OR REPLACE`).

## 3. Disaster Recovery Procedures

1. **Database Degradation / Transient Failure**:
   - `PostgresPool` automatically reconnects with connection pool retry and bounded acquisition timeouts.
   - External provider requests fail-closed to native deterministic evaluation.
2. **Total Instance Failure**:
   - Initiate PITR from Supabase Project Settings > Backups.
   - Update `DATABASE_URL` in Vercel environment variables.
   - Trigger Vercel redeployment to establish fresh connection pool.
