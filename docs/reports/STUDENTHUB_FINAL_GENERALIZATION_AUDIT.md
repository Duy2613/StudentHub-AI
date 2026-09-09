# StudentHub AI — Final Generalization Audit

**Candidate:** `studenthub-v5-pilot-rc2`  
**Date:** 2026-09-09  
**Overall status:** `PILOT_BACKEND_PARTIAL`

## Evidence state

| Area | Current state |
|---|---|
| Metric implementation | Exact CP, query-specific NDCG and metric tests verified |
| Hybrid retrieval | Candidate union/monotonic invariant verified; V3 recall/NDCG targets not established |
| Privacy | Local validation V2 verified; independent final holdout not established |
| Security | Local boundary validation V2 verified; staging/external fuzz not established |
| Source independence | Blind-feature validation verified; independent final annotation not established |
| AI path | Production-path contract and synthetic TEVV verified; live provider/final human labels open |
| Calibration | Synthetic validation passes; field calibration not established |
| Provider cost/latency | Failure matrix local verified; cost estimate only and live p95 open |
| Database gates | Frozen: `BLOCKED_BY_ENV`, `RLS_STATIC_ONLY`, `RESTORE_BLOCKED_BY_ENV`, backend/database partial |

The old oracle retrieval result, 407 privacy set, security 50-vector set and source N=100 set are reclassified as validation/historical evidence and are not treated as untouched final holdouts. RC2 is not promoted to `NON_DB_GENERALIZATION_CONVERGED` because retrieval targets and independent final holdouts remain open. No external legal, human-label, provider, database or storage authority was invented.

The public MOET quality-management notice may be used as a discovery seed; it is not a hard blocker and does not remove the need for source provenance/licensing and an independently frozen evaluation boundary.

