# StudentHub AI — Privacy V2 Evidence

**Dataset:** `docs/evaluation/privacy_holdout_v2_dataset.json`  
**N:** 420 samples  
**Classification:** `PRIVACY_VALIDATION_V1` (synthetic/generated labels; final human holdout not established)

The corrected run executes `PrivacyPipelineService.scanPII`, `redactText`, the full PNG derivative pipeline and post-redaction scan. It also runs 840 metamorphic checks (case transformation and zero-width insertion).

| Metric | Result | Target |
|---|---:|---:|
| Recall | 100.00% | ≥97% |
| Precision | 100.00% | ≥94% |
| Critical leakage | 0/300; CP 95% CI 0.00%–1.22% | 0 observed |
| High-risk modality recall | 100.0% | ≥95% |
| Metamorphic failures | 0/840 | 0 |
| Full pipeline post-scan failures | 0/420 | 0 |

**Status:** `PRIVACY_VALIDATION_V2_VERIFIED`. The result is strong local validation, not proof of an independently annotated production holdout.

