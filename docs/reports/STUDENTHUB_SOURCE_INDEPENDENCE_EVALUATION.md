# StudentHub V5 — Historical Source Independence Validation V1

> Historical validation only. The N=60 set was inspected during remediation and is not an untouched final annotation. The canonical RC2 release evidence is [`STUDENTHUB_SOURCE_INDEPENDENCE_HOLDOUT_V2.md`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/reports/STUDENTHUB_SOURCE_INDEPENDENCE_HOLDOUT_V2.md).

- **Evaluation Script:** [`frontend/tests/evidence/source_independence_benchmark.test.mjs`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/tests/evidence/source_independence_benchmark.test.mjs)
- **Benchmark Dataset:** [`docs/evaluation/source_independence_dataset.json`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/evaluation/source_independence_dataset.json)
- **Dataset SHA-256:** `e91b5ed6e5bb40dc89e8d03d54711a25981c498cc2289b343bf32c6131d32d14`
- **Results Artifact:** [`artifacts/retrieval/source_independence_benchmark_results.json`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/artifacts/retrieval/source_independence_benchmark_results.json)
- **Status Classification:** **`SOURCE_INDEPENDENCE_VALIDATION_V1`** (not release-gate eligible)

---

## 1. Objective & Threat Model

In trust verification, counting 5 identical syndicated press releases from 5 different news domains as 5 independent corroborating sources creates artificial consensus inflation (**False Consensus Attack**).
StudentHub V5's **Source Independence Engine** (`EvidenceForensicsService.js`) enforces:
1. **Content Digest Matching:** Cryptographic SHA-256 equality collapses verbatim copies.
2. **Wire Attribution Extraction:** Dispatches citing "TTXVN", "VGP", "Bộ GD&ĐT", "Bộ Công an" collapse to the original wire agency.
3. **Token Jaccard Similarity:** Near-duplicate articles (Jaccard ≥ 0.70) collapse into 1 origin group.
4. **False Merge Prevention:** Different university domains reporting different notices are strictly kept as distinct independent origins.

---

## 2. Quantitative Benchmark Results (N=60 Units)

| Metric | Measured Observed | Target | Gate Status |
| :--- | :--- | :--- | :--- |
| **Same-Origin Precision** | **100.0%** | ≥ 95.0% | **`PASS`** |
| **Same-Origin Recall** | **95.8%** | ≥ 90.0% | **`PASS`** |
| **Cluster F1 Score** | **97.9%** | ≥ 90.0% | **`PASS`** |
| **False Merge Rate** | **0.00%** | < 2.0% | **`PASS`** |
| **Missed Syndication Rate** | **4.17%** | < 10.0% | **`PASS`** |
| **Exact Origin Count Match** | **96.7%** (58/60) | ≥ 90.0% | **`PASS`** |

---

## 3. Real Demonstration Example

In Unit `IND-01` (4 news websites publishing the same TTXVN dispatch on university tuition policies):
- **Input:** 4 URLs from `baotintuc.vn`, `vietnamplus.vn`, `dantri.com.vn`, and `vtv.vn`.
- **Observed Origin:** `TTXVN`
- **Output:**
  > *"Đã gộp 4 bài viết có cùng nội dung/nguồn cấp gốc vào 1 nhóm nguồn độc lập duy nhất."*
- **Effective Weight in Verdict:** **1** (Consensus inflation eliminated).
