# Community × Expert Promax evaluation specification

Ngày: 09/09/2026  
Trạng thái: **DATASET_NOT_YET_LOCKED**

This is the evaluation protocol and starter fixture contract for the Promax
Community and Expert paths. It does not report product performance. The starter
cases at [`promax_starter_cases.json`](../../frontend/tests/community_expert/fixtures/promax_starter_cases.json)
are controlled synthetic fixtures for exercising contracts; they are not facts
about a university, scholarship, employer, bank, or landlord.

## Dataset and annotation

The proposed locked corpus is 360 source-grounded cases: 180 development, 60
validation, and 120 held-out test cases. The split must be by incident/source
cluster and time so copies of one event cannot cross partitions. Each case must
carry `caseId`, `revision`, claim-level labels, evidence IDs, source lineage,
privacy annotations, and an allowed-use record.

Two independent readers annotate each claim, supporting and contradicting
evidence, missing evidence, source independence, and the correct next action.
Disagreements go to a third reader; if they remain unresolved, the gold label is
`UNRESOLVED` or `INSUFFICIENT`, never a model-generated decision. Annotators do
not use the system output as their own gold truth.

## Comparisons and ablations

Run the same cases, sources, device/network budget, and task wording through:

* A — keyword search plus a basic forum ordered by popularity;
* B — the current Trust/AI pipeline;
* C — Trust + claim-level Community + scoped Expert Promax.

For C, repeat ablations removing source clustering, scope/assignment checks,
and correction history one at a time. Record configuration, policy versions,
sample counts, confidence intervals, latency, cost, and unresolved cases.

## Measures and acceptance targets

* Retrieval: NDCG@10, claim relevance, primary-source availability, new-user
  fairness, and the stale-expert scenario.
* Privacy: precision, recall, false positives, and false negatives per PII
  category on at least 1,000 controlled samples when feasible. Design targets
  are recall ≥98% and precision ≥95%; they are not achieved results.
* Manipulation: coordinated activity at 10%, 30%, and 50%; ranking distortion,
  false blocking, and proof that reactions never change Trust truth directly.
* Quality ledger: retry idempotency, one incident-cluster weight cap, reversal
  recalculation, sample-size uncertainty, and no score on submission.
* Durability/security: restart, two instances, outbox replay, stale revision,
  revoked-expert race, User A/B private-evidence isolation, and authorization
  denials.
* User value: correct next action, relevant evidence found, task completion
  time including reviewer wait, and cost. The product target is a 15-point
  improvement and roughly 25% median-time reduction; both remain hypotheses.
* Accessibility/performance: keyboard/focus and screen-reader checks for the
  core flow, mobile reflow, and p50/p95 API, queue, storage, and bundle data.

Every run must preserve raw case/revision references and a machine-readable
result. Do not aggregate repeated answers from one participant as independent
samples. Keep real and synthetic cases labelled separately.

## Current evidence

Local contract coverage exists for domain states, PII failure paths, source
clustering, ranking explanations, assignment and COI boundaries, review
disagreement, appeal history, idempotency, outbox composition, and the three
starter fixture shapes. The locked corpus, independent human annotations, pilot
participants, and live database/staging measurements are not present in this
worktree, so no NDCG, PII recall, user-value lift, or production durability
claim is made.
