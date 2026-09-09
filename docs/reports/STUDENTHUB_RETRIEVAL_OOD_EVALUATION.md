# StudentHub V5 — Out-of-Distribution (OOD) Retrieval Evaluation

- **Date:** 2026-09-09T18:21:00.000Z
- **Auditor:** Principal Retrieval & Evidence Systems Engineer
- **Evaluated Dataset:** `docs/evaluation/retrieval_fresh_holdout_dataset.json` (N=168)
- **Status:** **`OOD_RETRIEVAL_AUDITED`**

---

## 1. OOD Category Performance Breakdown (Hybrid Mode)

| OOD Challenge Category | Query Count | Recall@5 | NDCG@5 | Entity Resolution | Primary Failure Mode |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **UNINDEXED_INSTITUTION** | 48 | **54.2%** | 91.2% | 14.6% | Regional universities (CTU, UDN, HUEUNI, TDTU) absent from entity alias table |
| **PRIVATE_COMPANY_ORG** | 24 | **75.0%** | 94.5% | 12.5% | Fintech (MoMo, ZaloPay), banks, and telecoms not mapped to canonical entities |
| **FRESH_2026_NOTICES** | 24 | **95.8%** | 98.4% | 45.8% | Temporal queries for indexed universities resolved well via live search |
| **AMBIGUOUS_ABBREVIATION** | 18 | **77.8%** | 93.1% | 22.2% | Single-entity assumption when prompt spans multiple campuses |
| **SUPERSEDED_POLICY** | 18 | **94.4%** | 97.6% | 38.9% | MoET/Government circular queries correctly resolved to moet.gov.vn |
| **SCAM_PHISHING** | 18 | **94.4%** | 98.2% | 44.4% | Phishing/extortion queries successfully routed to NCSC / tinnhiemmang.vn |
| **ADVERSARIAL_SLANG_TYPO** | 18 | **88.9%** | 96.0% | 27.8% | Non-accented typos and student slang degraded entity token matching |

---

## 2. Key Insights for Generalization

1. **The Static KB Fallacy:**
   Relying on a static pre-indexed database for higher education yields high headline scores on seen entities (99.3% NDCG on the 12 DEV universities), but drops to 16.7% recall when encountering regional universities (Can Tho, Hue, Da Nang).
2. **The Necessity of Dynamic Web & Portal Ingestion:**
   The `LIVE_WEB` retrieval mode maintained 100% Recall@5 across all 168 queries when official portal domains were queried, proving that the architecture must prioritize dynamic official portal resolution.
3. **The High-Leverage Fix:**
   A systematic expansion of `EntityResolutionService.js` to cover the Ministry of Education's canonical list of Vietnamese higher education institutions and national financial platforms is required before freezing Holdout V2.
