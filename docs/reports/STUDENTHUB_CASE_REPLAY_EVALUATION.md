# StudentHub AI — Case Replay & Provenance Lineage Report
**Candidate**: `studenthub-v5-pilot-rc1`  
**Evaluation Date**: 2026-09-09  
**Test Suite**: `frontend/tests/evidence/case_replay_multicase.test.mjs`  
**CLI Tool**: `scripts/studenthub-replay.mjs`  
**Status**: `CASE_REPLAY_VERIFIED`  

---

## 1. Executive Summary & Immutability Directives

Sections 52, 53, and 54 mandate rigorous historical replay across diverse case archetypes:
1. **Historical Immutability (Section 53)**: Replay must NEVER query the live web by default. Historical results remain permanently bound to historical snapshot digests.
2. **Re-investigation Protocol**: If new web evidence is discovered, the engine MUST generate a NEW revision (e.g. `revision: 2`) with a distinct Merkle passport, preserving the immutable record of `revision: 1`.
3. **Evidence Passport (Section 54)**: Every adjudication is sealed with a cryptographic Merkle root combining input digest, source snapshot hashes, canonical entity IDs, and policy applied.

---

## 2. Multi-Case Replay Verification Matrix

| Case ID | Verdict Taxonomy Archetype | Input Text Summary | Adjudicated Verdict | Source Snapshot IDs | Passport Hash | Immutability Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `CASE-REPLAY-SAFE` | **SAFE** | Kế hoạch tuyển sinh Bách khoa 2026 | `SUPPORTED` | `s-safe-01` | `e7a7298030f2...` | **100% Bitwise Match** |
| `CASE-REPLAY-HIGHRISK` | **HIGH_RISK** | Yêu cầu nộp phí bảo lãnh học bổng vào STK | `HIGH_RISK` | `s-risk-01` | `99f6d36beda1...` | **100% Bitwise Match** |
| `CASE-REPLAY-ABSTAINED` | **ABSTAINED** | Tin đồn tài trợ 100% học phí UEH không hoàn lại | `INSUFFICIENT_EVIDENCE`| (0 sources) | `3425e156fb52...` | **100% Bitwise Match** |
| `CASE-REPLAY-CONFLICTED`| **CONFLICTED** | Số tín chỉ tối đa đăng ký học kỳ hè (8 vs 12) | `CONFLICTED_EVIDENCE`| `s-conf-01`, `s-conf-02` | `57d6fa9b7902...` | **100% Bitwise Match** |
| `CASE-REPLAY-COUNTERSEARCH`| **COUNTER_SEARCH**| Thông tư 09/2020 vẫn áp dụng cho 2026 | `CONTRADICTED` | `s-count-01` | `9f9c834fcb84...` | **100% Bitwise Match** |

---

## 3. Provenance Coverage Audit (Section 54)

- **Decision Drivers with Cryptographic Citations**: **100.0% (5/5 cases)**.
- **Source Records with Canonical URL & Snapshot Hash**: **100.0% (5/5 sources)**.
- **Retrieval Timestamp & Parser Version Attached**: **100.0%**.
- **Bitwise Passport Reproducibility**: Confirmed identical SHA-256 hash when executing duplicate replay passes without network connectivity.
- **New Revision Independence**: Re-investigation with incremented revision counter produces distinct passport hash (`e7a72980...` $\neq$ `4b8f102c...`), verifying that historical artifacts are tamper-evident and append-only.
