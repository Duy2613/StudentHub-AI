# STUDENTHUB OS — PRODUCTION OPERATIONS RUNBOOK

**Target Environment**: Next.js 16 + Node.js 24 + Supabase/PostgreSQL Multi-Instance Deployment  
**Security Standard**: Zero-Trust Security Fabric + T1–T4 Connected Intelligence

---

## 1. System Requirements & Environment Variables

| Variable | Description | Production Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `DATABASE_URL` | PostgreSQL connection string | Required for distributed multi-instance clustering |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase endpoint | Required for Supabase Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend service key | Kept server-side only; never expose to client |
| `DATA_ADAPTER_MODE` | Database adapter driver | `POSTGRES_SUPABASE` in production (`DURABLE_FILE` fallback for single-instance/dev) |
| `PORTAL_GATEWAY_URL` | HCMUTE SIS / PDT Gateway | Verified institutional endpoint |

---

## 2. Deployment & Build Procedures

### Production Build
```bash
# 1. Clean install dependencies
npm ci

# 2. Compile & optimize Next.js 16 App Router bundle
npm run build

# 3. Start production server
npm run start
```

### Zero Data Loss Database Migration
```bash
# Verify integrity checksums across all 7 collections
node scripts/migrate-json-to-db.mjs
```

---

## 3. Disaster Recovery & Backup Protocols

- **RPO (Recovery Point Objective)**: < 5 minutes (via automated PostgreSQL WAL replication).
- **RTO (Recovery Time Objective)**: < 15 minutes.
- **Backup Verification**:
  1. Automated daily snapshots of Supabase tables.
  2. Crash-safe atomic local journals (`.tmp` write + rename) preserved in container volume mount (`/.data`).

---

## 4. Observability & Health Probes

- **Liveness Probe**: `GET /api/intelligence/health`
- **Readiness Probe**: Checks Supabase DB connection + Zero-Trust token validator readiness.
- **Security Audit Stream**: Real-time append to `SecurityAuditRepository` with correlation IDs.
