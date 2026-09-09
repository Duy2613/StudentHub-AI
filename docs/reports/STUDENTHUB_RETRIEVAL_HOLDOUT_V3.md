# StudentHub AI — Retrieval V3 Evidence

**Dataset:** `docs/evaluation/retrieval_fresh_holdout_v3_dataset.json`  
**N:** 165 queries  
**Classification:** `RETRIEVAL_VALIDATION_V1` (generated dataset; not independent human-final holdout)  
**Run:** corrected real `EvidenceDiscoveryService` path on 2026-09-09

| Mode | Recall@1 | Recall@3 | Recall@5 | MRR | NDCG@5 | Precision@5 | Official top-5 | Irrelevant top-1 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| STATIC_KB | 16.4% | 21.2% | 21.2% | .186 | 19.7% | 12.5% | — | — |
| LIVE_WEB | 6.7% | 9.1% | 9.1% | .078 | 8.3% | 5.7% | — | — |
| HYBRID | 16.4% | 21.2% | 21.2% | .186 | 19.7% | 12.5% | 100.0% | 0.6% |

Entity resolution accuracy was 93.3%. Candidate-pool integrity and the Hybrid-vs-Live monotonic invariant passed. Retrieval targets Recall@5 ≥92% and NDCG@5 ≥88% were **not established**; this is not a release approval.

The prior oracle-based V3 PASS is reclassified as contaminated validation and is not used in the RC2 status registry.

