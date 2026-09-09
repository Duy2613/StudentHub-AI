# StudentHub AI — Calibration Evaluation

**Date:** 2026-09-09  
**Status:** `VALIDATION_ONLY; NO_FINAL_HOLDOUT_FIT`

On the controlled synthetic AI TEVV (N=210), the current deterministic verdict policy produced:

- Brier score: `0.0055` (target ≤0.15)
- ECE: `0.0719` (target ≤0.10)

These metrics are computed from binary correctness confidence and equal-width bins. They are not a field calibration result. `VerdictPolicyEngine` still contains bounded policy scores rather than a fitted calibration model, and no final holdout was used to fit thresholds or probabilities. Product copy should emphasize Evidence Sufficiency, Source Agreement and Uncertainty; numeric confidence remains secondary until independent outcome-labelled calibration data exists.

