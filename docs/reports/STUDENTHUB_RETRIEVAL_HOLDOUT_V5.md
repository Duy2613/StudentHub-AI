# StudentHub AI — Retrieval Holdout V5 / Public API Institution Lane

**Date:** 2026-09-09  
**Status:** `POST_REMEDIATION_RERUN_PENDING_PROVIDER_QUOTA_RESET`  
**Evidence class:** Preliminary diagnostic only; not a final generalization proof

## Scope and hygiene

V5 is a new 150-case dataset created after the dedicated OpenAlex institution
discovery lane was implemented. It contains 120 institution/entity queries and
30 policy, scam and corporate-context queries. The runtime sends only query
text and resolver output to retrieval and OpenAlex. `canonicalEntity` and
`knownOfficialDomains` are held back for scoring after retrieval.

Dataset: `docs/evaluation/retrieval_fresh_holdout_v5_dataset.json`  
Dataset SHA-256: `A29A3014D0779494CEDBC750D40909F62DF0CB7184E9151BB7588E3FD2C3F671`

## First diagnostic run

The first live run was completed before the final query-deduplication,
SSRF-homepage validation and discovery-entity ordering refinements were
applied. Its artifact is retained only to show the observed boundary:

Artifact: `artifacts/retrieval/fresh_retrieval_holdout_v5_results.json`

| Mode | Recall@5 | MRR | NDCG@5 | Precision@5 | Entity resolution | Public API target hit@5 |
|---|---:|---:|---:|---:|---:|---:|
| STATIC_KB | 11.3% | 0.102 | 10.8% | 5.6% | 80.0% | 0.0% |
| LIVE_WEB | 0.0% | 0.000 | 0.0% | 0.0% | 80.0% | 0.0% |
| HYBRID | 11.3% | 0.102 | 10.8% | 5.6% | 80.0% | 0.0% |

OpenAlex returned 108 discovery candidates in this run. The target hit was
zero because the old ranking still tied exact public-API discovery candidates
with generic official discovery seeds, so this artifact must not be used to
judge the current ranking implementation.

The safety invariants did pass: candidate-pool integrity, zero deletion of
unknown-entity live candidates, and Hybrid-minus-Live Recall@5 `+11.3pp`.

## Current rerun blocker

After the diagnostic run, OpenAlex returned a typed `429` with
`retry-after: 31607` seconds and `dailyRemainingUsd: 0`. This is provider quota
state, not a repository failure. The current live test is deliberately opt-in:

```powershell
$env:STUDENTHUB_RUN_LIVE_RETRIEVAL_HOLDOUT = "1"
$env:STUDENTHUB_PERSIST_LIVE_HOLDOUT = "1"
node --test frontend/tests/evidence/fresh_retrieval_holdout_v5_public_api.test.mjs
```

The post-refinement artifact should only be persisted after quota reset and a
successful rerun. Until then, V5 remains `PENDING`, and RC5 cannot claim
retrieval convergence.

## Boundary decision

The new lane is safe to include as discovery metadata, not as proof:

- `SAFE_DEDUP(STATIC ∪ LIVE ∪ OFFICIAL_DISCOVERY ∪ PUBLIC_API_DISCOVERY)`;
- OpenAlex homepage/domain metadata is `ENTITY_DISCOVERY_ONLY`;
- exact resolver/entity matching can affect ordering only;
- `authorityTier` remains `UNKNOWN`, with `isPrimary=false` and
  `isAuthoritative=false`;
- official-page fetch, provenance, policy validation and legal review remain
  separate steps.

Next gate: rerun V5 after provider quota reset, then review retrieval,
privacy/security/source-independence and remaining database gates together.
