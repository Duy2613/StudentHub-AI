# StudentHub V5 — Retrieval DEV / Oracle Benchmark Report

> Historical development evidence only. This 84-query set was inspected while tuning aliases and corpus coverage, so it is not an untouched release holdout. The canonical RC2 retrieval evidence is [`STUDENTHUB_RETRIEVAL_HOLDOUT_V3.md`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/reports/STUDENTHUB_RETRIEVAL_HOLDOUT_V3.md).

- **Evaluation Script:** [`frontend/tests/evidence/retrieval_benchmark.test.mjs`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/frontend/tests/evidence/retrieval_benchmark.test.mjs)
- **Benchmark Dataset:** [`docs/evaluation/retrieval_benchmark_dataset.json`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/evaluation/retrieval_benchmark_dataset.json)
- **Dataset SHA-256:** `2ba2d9dfc784224f52cef28cefa5099a2be5aaaba43fc2f361a958a85c75563c`
- **Results Artifact:** [`artifacts/retrieval/retrieval_benchmark_results.json`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/artifacts/retrieval/retrieval_benchmark_results.json)
- **Results SHA-256:** `77bef29fda1debc7b2a7983ebd23b4d669c2ef99d173b1e561e6dd6bbd94a35a`
- **Status Classification:** **`RETRIEVAL_DEV`** (metrics preserved; not release-gate eligible)

---

## 1. Benchmark Design & 12 Evaluated Domains

The benchmark consists of **84 human-reviewed Vietnamese queries** evaluated against institutional authority discovery and counter-rumor retrieval.

The queries span 12 distinct academic and student life domains:
1. **Scholarship:** (Học bổng OISP, Học bổng tài năng UEH, học bổng thủ khoa...)
2. **Admissions:** (Điểm chuẩn, phương thức xét tuyển kết hợp...)
3. **Tuition:** (Biểu phí, điều chỉnh học phí lộ trình tự chủ...)
4. **University Notices:** (Thời khóa biểu, lịch thi, nghỉ lễ...)
5. **Internships:** (Quy định thực tập tốt nghiệp doanh nghiệp...)
6. **Recruitment:** (Ngày hội việc làm, đối tác tuyển dụng...)
7. **Housing / Dormitory:** (Ký túc xá ĐHQG, đăng ký phòng...)
8. **Phishing:** (SMS mạo danh ngân hàng, giả link VCB Digibank...)
9. **Payment Scams:** (Yêu cầu nạp tiền giữ suất học bổng, chuyển tiền tài khoản cá nhân...)
10. **Fake Organizations:** (Viện đào tạo quốc tế mạo danh, trung tâm du học giả...)
11. **Expired Policies:** (Văn bản hết hiệu lực từ năm 2022...)
12. **Contradictory Notices:** (Thông báo mâu thuẫn giữa diễn đàn và cổng thông tin chính thức...)

---

## 2. Quantitative Results & Release Target Comparison

| Metric | Before Iteration 1 | After Iteration 1 (Measured) | Pilot Release Target | Gate Status |
| :--- | :--- | :--- | :--- | :--- |
| **Entity Resolution Rate** | 75.0% | **91.7%** (100% in context) | ≥ 90.0% | **`PASS`** |
| **Recall@5** | 25.0% | **96.4%** | ≥ 95.0% | **`PASS`** |
| **NDCG@5** | 67.0% | **99.3%** | ≥ 90.0% | **`PASS`** |
| **Official Source Hit Rate** | 94.0% | **100.0%** | ≥ 90.0% | **`PASS`** |
| **Official Source Top-3 Rate** | 94.0% | **100.0%** | ≥ 85.0% | **`PASS`** |
| **Irrelevant Top-1 Rate** | 3.6% | **2.4%** | ≤ 5.0% | **`PASS`** |
| **Duplicate-Origin Inflation** | 0 | **0** | 0 | **`PASS`** |

---

## 3. Retrieval Ablation Analysis (Recall@5 Delta)

Evaluating identical queries across 3 candidate retrieval configurations:
- **[System A] Keyword Matching Only:** 53.6% Recall@5
- **[System B] Entity-Aware Candidate Retrieval:** 97.6% Recall@5 (+44.0% Gain)
- **[System C] Full Candidate with Authority Ladder Ranking:** 96.4% Recall@5 (**+42.9% Gain**)

### Development Signal (Not Release Evidence):
By expanding the curated institutional knowledge base to cover the 12 core academic evaluation domains and improving canonical alias resolution, Recall@5 achieved **96.4%** (exceeding the ≥95.0% target) and NDCG@5 achieved **99.3%** (exceeding the ≥90.0% target). Irrelevant Top-1 was reduced to **2.4%**, satisfying all Section 31 quality gates.
