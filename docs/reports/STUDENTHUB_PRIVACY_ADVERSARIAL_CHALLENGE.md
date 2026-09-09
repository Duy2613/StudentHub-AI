# StudentHub AI — Adversarial Privacy Challenge Report
> HISTORICAL VALIDATION V1 — this set was inspected during remediation and is not the untouched RC2 holdout. Canonical release evidence is [`STUDENTHUB_PRIVACY_HOLDOUT_V2.md`](file:///c:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/reports/STUDENTHUB_PRIVACY_HOLDOUT_V2.md).

**Candidate**: `studenthub-v5-pilot-rc1`  
**Evaluation Date**: 2026-09-09  
**Dataset**: `docs/evaluation/privacy_adversarial_dataset.json` (SHA-256: `6dbc5ca0444e49bffe437cf485bfd23ea6da2ac21ee047641c8b1d9d093a3054`)  
**Status**: `PRIVACY_VALIDATION_V1` (not release-gate eligible)  

---

## 1. Executive Summary & Benchmark Reclassification

Previous privacy assertions reported 100/100 based on a 1,300-case synthetic dataset. Under the Non-Database Convergence Mandate (Sections 19–24), that historical dataset has been formally reclassified as **`CLEAN_CONTROLLED_PRIVACY_BENCHMARK`**.

To eliminate confirmation bias, an adversarial evaluation challenge was generated containing **407 samples** across 7 distinct modalities, incorporating:
- Noisy OCR character substitutions (`0` $\leftrightarrow$ `O`, `1` $\leftrightarrow$ `l` $\leftrightarrow$ `I`)
- Spaced, dotted, and hyphenated CCCD / Bank Account formatting
- Parenthesized area codes and Vietnamese telecommunications patterns
- Unaccented and teencode phrasing (`thu huong`, `cá nhân`, `chuyển khoản gấp`)
- EMVCo VietQR payload extraction
- 47 hard negative lookalike cases (course codes, room numbers, dates, student scores, decree numbers, order IDs, postal codes)

### Forensic Evolution:
| Milestone | Samples | Overall Recall | Overall Precision | Critical Leaks (CCCD/TK) | Post-Redaction Leaks | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Initial Baseline** | 407 | 80.28% | 98.63% | **51** | 71 | `PRIVACY_ADVERSARIAL_PARTIAL` |
| **Hardened Candidate** | 407 | **100.00%** | **100.00%** | **0** | **0** | **`PRIVACY_VALIDATION_V1`** |

---

## 2. Modality-Specific Performance Matrix

| Modality | Sample Count (N) | True Positives | False Negatives | True Negatives | False Positives | Recall | Precision | Critical Leaks | Target Gate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **NOISY_SYNTHETIC** | 72 | 72 | 0 | 0 | 0 | **100.0%** | **100.0%** | **0** | $\ge 95.0\%$, Leak=0 |
| **OCR_IMAGE** | 26 | 26 | 0 | 0 | 0 | **100.0%** | **100.0%** | **0** | $\ge 95.0\%$, Leak=0 |
| **DOCUMENT** | 26 | 26 | 0 | 0 | 0 | **100.0%** | **100.0%** | **0** | $\ge 95.0\%$, Leak=0 |
| **TEXT** | 79 | 67 | 0 | 12 | 0 | **100.0%** | **100.0%** | **0** | $\ge 95.0\%$, Leak=0 |
| **METADATA** | 29 | 24 | 0 | 5 | 0 | **100.0%** | **100.0%** | **0** | $\ge 95.0\%$, Leak=0 |
| **CLEAN_SYNTHETIC** | 150 | 120 | 0 | 30 | 0 | **100.0%** | **100.0%** | **0** | $\ge 95.0\%$, Leak=0 |
| **QR (EMVCo VietQR)** | 25 | 25 | 0 | 0 | 0 | **100.0%** | **100.0%** | **0** | $\ge 95.0\%$, Leak=0 |
| **TOTAL / OVERALL** | **407** | **360** | **0** | **47** | **0** | **100.0%** | **100.0%** | **0** | **PASSED** |

---

## 3. Root Causes & Mechanical Fixes

### Error Bucket A: Spaced / Hyphenated CCCD & Old 9-Digit CMND
- **Symptom**: `079-204-001234`, `079 204 001 234`, and `Số CMND 9 số cũ: 204001234` leaked.
- **Root Cause**: Rigid regex `\b0\d{11}\b` required contiguous digits and failed when punctuation, spaces, or descriptive prefixes (`9 số cũ`) were present.
- **Resolution**: Enhanced `PII_CATEGORIES.NATIONAL_ID` pattern with boundary-tolerant hyphen/space matching and CMND prefix capture:
  ```regex
  \b(?:CCCD|CMND|PASSPORT|ID\s*CARD|ĐỊNH\s*DANH(?:\s*CÁ\s*NHÂN)?|CAN\s*CUOC|CĂN\s*CƯỚC)[:# -]*[A-Za-z0-9- ]{6,22}\b
  |\b(?:CMND|CHỨNG\s*MINH(?:\s*NHÂN\s*DÂN)?|SO\s*CMND|SỐ\s*CMND)(?:(?:\s+9\s+số(?:\s+cũ)?)|[^0-9\n]){0,40}\b\d{9}\b
  |(?<!\w)[0O][\dOlI]{2}[- ]?[\dOlI]{3}[- ]?[\dOlI]{6}(?!\w)
  ```

### Error Bucket B: OCR Substitution (`0` $\rightarrow$ `O`, `1` $\rightarrow$ `l`, `I`)
- **Symptom**: `O792O4OOl234` and `STK: I23456789O` bypassed detection.
- **Root Cause**: Character classes only accepted `[0-9]`.
- **Resolution**: Integrated homoglyph and OCR substitution classes `[0-9OlI]` across high-risk numeric extractors.

### Error Bucket C: Modifiers in Bank Account Phrases
- **Symptom**: `STK cá nhân 102876543210` leaked because `cá nhân` was between label and digits.
- **Root Cause**: PII pattern only allowed non-alphanumeric punctuation `[ :#-]*` between the keyword and digits.
- **Resolution**: Permitted context modifiers `[^0-9\n]{0,35}` while preserving strict length boundaries.

### Error Bucket D: Regex Stateful `/g` Flag Pointer Bleed
- **Symptom**: Intermittent false negative leaks when iterating across large corpora.
- **Root Cause**: Global regular expressions retain `lastIndex` state across sequential `.test()` or `.replace()` invocations.
- **Resolution**: Guaranteed explicit `pattern.regex.lastIndex = 0` reset before every evaluation pass in `PrivacyPipelineService.js`.

---

## 4. Hard Negative Non-PII Safeguards

To prevent over-redaction, 47 non-PII lookalike samples were tested:
- **Academic Course Codes**: `CS101`, `MATH201`, `ENG101`, `PHYS102`, `IT3040` $\rightarrow$ **0 False Positives**
- **Room Numbers**: `P.201`, `H4-302` $\rightarrow$ **0 False Positives**
- **Standard Exam Scores**: `8.5/10`, `850/990` $\rightarrow$ **0 False Positives**
- **Historical Dates**: `20/11/2023`, `01/01/2026` $\rightarrow$ **0 False Positives**
- **Order IDs**: `ORDER-2026-9912` $\rightarrow$ **0 False Positives**
- **Legal Decrees**: `157/2007/QĐ-TTg`, `Thông tư 08/2022` $\rightarrow$ **0 False Positives**
- **Postal Codes**: `700000`, `100000` $\rightarrow$ **0 False Positives**

**Overall False Positive Rate**: **0.0% (47/47 TN)**.

---

## 5. Final Assurance Verification
- Test Command: `node frontend/tests/privacy/adversarial_privacy_benchmark.test.mjs`
- Test Output: `407 passed, 0 failed, 0 critical leaks`
- Historical validation classification: **`PRIVACY_VALIDATION_V1`** (Section 24 metrics preserved; not an untouched release gate).
