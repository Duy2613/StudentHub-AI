# StudentHub Domain Evaluation Harness

Implementation: `frontend/src/lib/ai-trust/v5/l2c/evaluationHarness.js`
Evaluation version: `studenthub-domain-evaluation-1.0.0`

## Metrics

The harness reports per-class precision, recall, F1, false-positive rate, false-negative rate and support; macro and micro aggregates; coverage; abstention rate; confusion matrix; and high-risk false-negative rate. Calibration error and Brier score remain `null` while the baseline emits an uncalibrated model score rather than a probability.

## Fixture scope

Fixtures include fake scholarships, tuition payment scams, fake internships/jobs, advance fees, university/faculty/student-organization impersonation, account takeover/credential harvesting, QR payment, benign university/scholarship/internship controls, Vietnamese slang, mixed language and obfuscation.

The fixture suite is a regression harness, not a claim of real-world accuracy. Production rollout requires independently sourced, privacy-reviewed and human-resolved data, a held-out evaluation split, calibration analysis where probabilities are intended, and a model-card update.

## Failure gates

High-risk false negatives receive priority. A change that increases a high-risk FNR, creates false-safe wording, drops model/taxonomy version metadata, or turns an unknown input into a clear finding must fail review.
