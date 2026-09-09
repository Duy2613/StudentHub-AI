# StudentHub V5 — Fresh Retrieval Holdout Report (Holdout V1)

- **Date:** 2026-09-09T18:21:00.000Z
- **Auditor:** Principal Retrieval & Evidence Systems Engineer
- **Evaluated Dataset:** `docs/evaluation/retrieval_fresh_holdout_dataset.json` (N=168 Queries, SHA-256: `9329872e02a402defef9fe7a36503e9ee75a1545550c1e63c6f582e22dd60cce`)
- **Test Runner:** `frontend/tests/evidence/fresh_retrieval_holdout.test.mjs`
- **Output Artifact:** `artifacts/retrieval/fresh_retrieval_holdout_results.json`
- **Status:** **`FRESH_RETRIEVAL_HOLDOUT_PARTIAL` (FROZEN AS VALIDATION EVIDENCE)**

---

## 1. Executive Summary & Scientific Integrity Statement

Per Section 3 & 16 of the Autonomous Assurance Convergence Protocol:
> *"The current 84-query retrieval benchmark has already influenced implementation... retrieval_benchmark_dataset.json must now be classified as: DEV / VALIDATION EVIDENCE. It is NOT an untouched final holdout anymore."*
> *"If the new holdout fails: FREEZE the result. Do NOT immediately change code and rerun the same set as final. That holdout becomes validation evidence. Implement improvements. Then generate/freeze: HOLDOUT_V2 for the next final candidate."*

The candidate was evaluated against an untouched, un-leaked fresh holdout of **168 queries** spanning 7 OOD challenge categories (unindexed universities, private fintech/platforms, fresh 2026 notices, ambiguous abbreviations, superseded policies, novel scams, and student slang/typos).

The evaluation separately measured **STATIC_KB**, **LIVE_WEB**, and **HYBRID** production modes.

**Empirical Result:**
The previous 99.3% NDCG@5 score did not generalize to unindexed regional universities. Hybrid Recall@5 dropped to **76.8%** (Gate: $\ge 92.0\%$) and Entity Resolution dropped to **25.6%** (Gate: $\ge 90.0\%$).

Per Section 16 rule, this result is **FROZEN** as validation evidence. No benchmark gaming or tuning on this set is permitted.

---

## 2. Independent Mode Evaluation Results

| Metric | STATIC_KB | LIVE_WEB | HYBRID Candidate | Gate Target | Gate Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Recall@1** | 16.7% | 76.8% | **76.8%** | — | Evaluated |
| **Recall@3** | 16.7% | 76.8% | **76.8%** | — | Evaluated |
| **Recall@5** | 16.7% [11.3% - 22.6%] | 100.0% | **76.8% [70.2% - 83.3%]** | $\ge 92.0\%$ | **FAIL (Gap: -15.2%)** |
| **MRR** | 0.1667 | 0.7679 | **0.7679** | — | Evaluated |
| **NDCG@5** | 84.3% | 100.0% | **95.3% [94.1% - 96.5%]** | $\ge 88.0\%$ | **PASS (+7.3%)** |
| **Official Hit Rate** | 100.0% | 76.8% | **100.0%** | $\ge 90.0\%$ | **PASS** |
| **Official Top-3** | 100.0% | 76.8% | **100.0%** | $\ge 85.0\%$ | **PASS** |
| **Irrelevant Top-1** | 0.0% | 0.0% | **0.0%** | $\le 7.0\%$ | **PASS** |
| **Entity Resolution** | 25.6% | 25.6% | **25.6% [19.0% - 32.7%]** | $\ge 90.0\%$ | **FAIL (Gap: -64.4%)** |

---

## 3. Root-Cause Diagnosis of Error Buckets

1. **Unindexed Regional & Specialized Universities (48 queries):**
   - Entities such as CTU (ĐH Cần Thơ), UDN (ĐH Đà Nẵng), HUEUNI (ĐH Huế), FPT, RMIT, TDTU, PTIT, DAV, BAV, HMU, UMP, HLU, ULAW had zero recognition in `EntityResolutionService.js`.
   - Result: System defaulted to generic domain search without boosting their specific official portals.
2. **Private Entities & Telecoms (24 queries):**
   - MoMo, ZaloPay, Viettel, VNPT, FPT Shop, Grab, MB Bank, Techcombank were not in the canonical entity registry.
3. **Ambiguous Abbreviations (18 queries):**
   - Queries mentioning "ĐHBK", "ĐHQG", "ĐHSP", "UEH vs UEL" were mapped to a single hardcoded institution rather than returning multi-campus candidate portals.

---

## 4. Next Step: Freeze & HOLDOUT_V2 Pipeline

1. **Status:** This report and its artifact (`fresh_retrieval_holdout_results.json`) are frozen as `HOLDOUT_V1_VALIDATION`.
2. **Remediation:** Expand `EntityResolutionService.js` to encompass national regional universities, specialized academies, and private education providers.
3. **Generation:** Create an untouched `HOLDOUT_V2` ($N=150$) with completely fresh distinct queries to evaluate final convergence.
