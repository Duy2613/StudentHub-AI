# StudentHub Domain Risk Model Card

Version: `studenthub-domain-rule-baseline-1.0.0`
Type: `BASELINE_RULE_MODEL`
Taxonomy: `studenthub-student-risk-taxonomy-1.0.0`
Dataset: `NO_VERIFIED_TRAINING_DATASET`

## Intended use

This capability provides advisory domain-risk signals for Vietnamese student contexts: scholarships, tuition payments, university/faculty/student-organization impersonation, internships/jobs, advance fees, KTX/housing, tickets, certificates, account recovery/takeover, phishing, QR/payment redirection, refunds/rewards/support, money-mule recruitment, urgency and social proof.

It is a deterministic baseline for routing and evidence requests. L4 remains authoritative. L2C cannot clear a threat, assert truth, or convert a hard negative into safety.

## Model and output semantics

The baseline uses bounded Unicode normalization, zero-width removal, Vietnamese diacritic/leet normalization, word-boundary phrase matching, and a prompt-injection input guard. It emits a taxonomy classification, matched signals, a `modelScore`, and `calibratedRisk: null`.

`modelScore` is explicitly `MODEL_SCORE_UNCALIBRATED`; it is not a probability. No confidence claim is emitted when calibration is absent.

## Evaluation evidence

The repository harness evaluates 14 bounded synthetic/curated fixtures spanning high-risk categories, benign controls, Vietnamese slang, mixed language and obfuscation. The harness reports precision, recall, F1, FPR, FNR, macro/micro metrics, coverage, abstention, confusion matrix and null calibration fields. A passing fixture result is implementation evidence only; it is not evidence of production prevalence or generalization.

The required baseline gate is: all high-risk fixture cases must be represented, no benign control may be promoted to a high-risk class without its rule evidence, and high-risk false-negative rate must be reviewed before any release.

## Training and fine-tuning status

No trained or fine-tuned proprietary artifact is present in this cycle. Fine-tuning is blocked until cases have verified human/resolved labels, source/evidence references, privacy approval and an explicit dataset version. The eligible dataset contract is implemented in `frontend/src/lib/ai-trust/v5/l2c/datasetSchema.js`.

## Limitations and monitoring

The baseline is vulnerable to novel wording, missing context, adversarial paraphrase and distribution shift. It can produce advisory signals for legitimate messages that mention payment or urgency. Scores must not be calibrated by display formatting. New labeled cases require re-evaluation, data quality review and an explicit model-card update.

## Release and rollback

The model version and taxonomy version are included in the L2C stage. A regression or false-safe finding requires returning to the previous version or disabling L2C; L4 still operates with unknown/insufficient evidence rather than treating missing L2C as safe.
