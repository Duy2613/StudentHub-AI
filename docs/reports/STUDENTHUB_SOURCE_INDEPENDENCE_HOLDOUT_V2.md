# StudentHub AI — Source Independence V2 Evidence

**N:** 150 challenge units  
**Classification:** `SOURCE_INDEPENDENCE_VALIDATION_V1` (generated challenge labels; final independently annotated holdout not established)

The runtime input is blind to `claimedOrigin`, `clusterId` and true-origin fields. Content digests are recomputed from observable text before `EvidenceForensicsService.clusterSources` runs.

| Metric | Result | Target |
|---|---:|---:|
| Pairwise precision / recall / F1 | 100.0% / 100.0% / 100.0% | F1 ≥93% |
| False merge rate | 0.00% | ≤2% |
| False split rate | 0.00% | — |
| Exact origin-count accuracy | 150/150 (100.0%) | ≥90% |

**Status:** `SOURCE_INDEPENDENCE_VALIDATION_V2_VERIFIED`. Human origin adjudication and a truly untouched final split remain open.

