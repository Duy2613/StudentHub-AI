# 🌐 Intelligence Fabric API Reference V1

> **Document Version**: `1.0.0` | **Status**: `PRODUCTION-READY LOCKED`  
> **Security Guard**: All endpoints wrapped with `SecurityFabric.wrapHandler`.

---

## Endpoints Taxonomy

| Method | Route | Permission / Scope | Description |
|---|---|---|---|
| `GET` | `/api/intelligence/trust/{subjectId}` | `TRUST.READ` / `trust:read` | Multidimensional trust profile and plain language explanation |
| `GET` | `/api/intelligence/reputation/{subjectId}` | `TRUST.READ` / `trust:read` | Topic-specific dynamic reputation graph and mutation history |
| `GET` | `/api/intelligence/experts` | `EXPERT.READ` / `expert:read` | Multi-signal expert search & ranking by topic/domain |
| `GET` | `/api/intelligence/experts/{expertId}` | `EXPERT.READ` / `expert:read` | Expert profile, verification badge, and historical claim reliability |
| `GET` | `/api/intelligence/claims/{claimId}` | `TRUST.READ` / `trust:read` | First-class claim entity with lineage trace and snapshots |
| `GET` | `/api/intelligence/contradictions/{claimId}` | `TRUST.READ` / `trust:read` | Contradiction classification and authority-aware conflict resolution |
| `GET` | `/api/intelligence/recommendations` | `ACADEMIC.PLAN_OWN` / `academic:plan` | Grounded AI recommendations with uncertainty and alternatives |
| `GET` | `/api/intelligence/health` | `TRUST.READ` / `trust:read` | Multi-dimensional data quality and calibration metrics |
