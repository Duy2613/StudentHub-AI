# 📊 Confidence Engine & Brier Score Calibration V1

> **Document Version**: `1.0.0` | **Status**: `PRODUCTION-READY LOCKED`  
> **Core Principle**: *Confidence is not certainty. Epistemic probabilities must be calibrated against historical empirical outcomes.*

---

## 1. Multidimensional Confidence Formulation

Confidence is composed of 5 distinct components:

$$\text{Raw Score} = 0.40 \cdot C_{\text{evi}} + 0.25 \cdot C_{\text{src}} + 0.20 \cdot C_{\text{temp}} + 0.15 \cdot C_{\text{cons}} - P_{\text{contra}}$$

$$\text{Overall Confidence} = \min(0.95, \max(0.10, \text{Raw Score}))$$

> Note: Overall confidence is strictly bounded $< 0.98$ to prevent mathematical false certainty.

---

## 2. Empirical Brier Score Calibration Framework

For historical claim assessments, the `ConfidenceCalibrationEngine` records predicted confidence ($f_t$) against observed ground-truth outcome ($o_t \in \{0, 1\}$):

$$BS = \frac{1}{N} \sum_{t=1}^N (f_t - o_t)^2$$

| Brier Score Range | Calibration Quality | Interpretation |
|---|---|---|
| $BS < 0.10$ | **Rất Tốt (Well Calibrated)** | $80\%$ confidence closely matches $80\%$ true outcomes |
| $0.10 \le BS \le 0.20$ | **Chấp Nhận Được (Acceptable)** | Minor overconfidence/underconfidence divergence |
| $BS > 0.25$ | **Kém (Poor Calibration)** | System systematically misestimates probabilities |

---

## 3. Snapshot Reproducibility

Using `SnapshotReproducibilityStore`, every claim assessment can be reproduced given:
- `claimId`
- `modelVersion` (e.g. `fusion-v2`)
- `policyVersion` (e.g. `1.0.0`)
- `timestamp`
- Cryptographic state digest.
