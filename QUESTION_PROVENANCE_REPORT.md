# Question Provenance Report

## Result

`QUESTION_BANK=PARTIAL`; live Expert V5 question-bank persistence and provenance remain unverified because the staging database security gate is open. No generated question was marked human-approved.

The current run did not create, ingest, approve, or mutate a live source/question record. Browser checks used deterministic fixtures in an isolated copy. The Expert V5 live readonly suite was not run.

## Required lineage for a usable question

The product acceptance contract remains: `questionId`, version, domain, difficulty, source, snapshot, evidence, answer/rubric, review state, retrieval time, and content/hash lineage must resolve. A draft fixture or question count alone is insufficient.

## Domain corpus readiness

The required threshold of ten legitimate questions per active Expert domain, spanning Easy/Medium/Hard, is not established by the evidence collected in this run. Human editorial review remains a separate gate and cannot be inferred from automated evaluation.
