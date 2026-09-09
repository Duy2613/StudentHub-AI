# StudentHub AI — RC3 Retrieval Holdout V4

**Date:** 2026-09-09  
**Status:** `RETRIEVAL_HOLDOUT_V4_TARGETS_NOT_ESTABLISHED`  
**Evidence class:** New RC3 retrieval validation; not promoted as final generalization proof

## Scope and hygiene

This is a new 150-query dataset generated after the RC3 public-source boundary was implemented. It covers regional institutions, major universities, ambiguous abbreviations, multi-entity comparisons, regulatory/policy queries, scam alerts, and corporate student opportunities.

The runtime claim contains only query text and resolver output. `knownOfficialDomains`, `canonicalEntity`, and difficulty labels are read only after retrieval for scoring. They are never sent to a provider and never used to create a candidate.

Dataset: `docs/evaluation/retrieval_fresh_holdout_v4_dataset.json`  
Dataset SHA-256: `601BDDF95EE2BC6728626B4F57C56DCCA27AF60D6EA532C20E9AB543EB7C622D`  
Result artifact: `artifacts/retrieval/fresh_retrieval_holdout_v4_results.json`

## Results

| Mode | Recall@5 | MRR | NDCG@5 | Precision@5 | Entity resolution | Official source hit | Irrelevant top-1 |
|---|---:|---:|---:|---:|---:|---:|---:|
| STATIC_KB | 17.3% | 0.154 | 17.0% | 9.2% | 92.7% | 17.3% | 0.0% |
| LIVE_WEB | 6.7% | 0.057 | 6.4% | 3.9% | 92.7% | 6.7% | 75.3% |
| HYBRID | 17.3% | 0.154 | 17.0% | 9.2% | 92.7% | 17.3% | 0.0% |

The Hybrid-minus-Live Recall@5 delta is `+10.7pp`, so the monotonic recall invariant passes. The candidate-pool integrity invariant also passes: `SAFE_DEDUP(STATIC ∪ LIVE ∪ OFFICIAL_DISCOVERY)`, UNKNOWN candidates retained, and zero live candidates deleted because of unresolved entities.

## Official discovery lane

The real `OfficialDiscoveryAdapter` fetched the allowlisted MOET sources successfully and returned 63 minimal link/provenance records. It produced a `0.0%` target-domain hit in this holdout. That result is informative: the current public MOET pages provide useful discovery context but do not yet form a complete institution-domain index for this OOD mix. The adapter does not download or parse the linked RAR archive, and it does not promote any seed to authority. Legal access, snapshot, redistribution, and provenance review remain separate.

## Gate decision

| Gate | Result |
|---|---|
| Recall@5 >= 92% | FAIL |
| NDCG@5 >= 88% | FAIL |
| Entity resolution >= 85% | PASS |
| Official-source hit >= 90% | FAIL |
| Irrelevant top-1 <= 7% | PASS |
| Hybrid recall >= Live recall - 1pp | PASS |

Decision: keep RC3 in validation and do not promote retrieval convergence. The next work is a dedicated institution/entity discovery lane and a subsequent independently reviewed holdout; no rerun of V4 may be described as untouched after implementation changes.
