# StudentHub AI — Metric Forensics

**Date:** 2026-09-09  
**Status:** `IMPLEMENTATION_VERIFIED; CALIBRATION_VALIDATION_ONLY`

## Findings

- `MetricForensics.clopperPearsonCI(k, n)` now uses the exact beta-quantile bounds for every `0 <= k <= n`; it no longer substitutes Wilson for interior counts. Examples: `0/45 → 0.00%–7.87%`, `1/10 → 0.25%–44.50%`, and `45/45 → 92.13%–100.00%`.
- `computeNDCGAtK` requires a query-specific relevance judge and gold relevant count. Authority (`.edu.vn`/`.gov.vn`) alone is not relevance.
- Recall@K, Precision@K, MRR, ECE, Brier and Macro F1 are covered by executable tests. Macro F1 includes predicted-only classes rather than silently omitting them.

## Calibration boundary

The current verdict policy still emits bounded deterministic policy scores. The measured ECE/Brier values from the controlled synthetic AI TEVV are evidence about that fixture, not a calibration fit or production field calibration. No final holdout was used to fit thresholds or probabilities. Numeric confidence should remain secondary to evidence sufficiency, source agreement and uncertainty.

## Verification commands

```text
node --test frontend/tests/evidence/metric_forensics.test.mjs
node --test frontend/tests/ai-eval/fresh_ai_challenge_holdout_v2.test.mjs
```

