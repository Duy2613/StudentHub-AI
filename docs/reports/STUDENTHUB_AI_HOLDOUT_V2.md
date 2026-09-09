# StudentHub AI — AI V2 Evidence

**Dataset:** `docs/evaluation/ai_challenge_holdout_v2_dataset.json`  
**N:** 210 cases  
**Classification:** `CONTROLLED_SYNTHETIC_TEVV` (generated labels; no independent human-final holdout claim)

| Metric | FULL_MINUS_CRITIC | FULL |
|---|---:|---:|
| Accuracy | 88.1% | 100.0% |
| Macro F1 | 80.5% | 100.0% |
| False reassurance | 0/25; CP upper 13.72% | 0/25; CP upper 13.72% |
| Citation ID validity | — | 100.0% |
| ECE / Brier | — | 0.0719 / 0.0055 |
| Abstention / coverage | — | 35.7% / 64.3% |

The paired critic comparison had 25 FULL-only corrections, 0 MINUS-only corrections; exact McNemar `p=5.960e-8` on this controlled fixture. This supports `CRITIC_CAUSAL_VALUE_VERIFIED_CONTROLLED_TEVV`, not an independently generalizable production claim.

**Status:** `CONTROLLED_SYNTHETIC_AI_TEVV_VERIFIED`; final AI holdout V2 remains open until the dataset has independent label provenance and is frozen after all harness changes.

