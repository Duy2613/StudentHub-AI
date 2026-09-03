# StudentHub Domain Dataset Schema

Dataset contract version: `studenthub-domain-dataset-contract-1.0.0`
Taxonomy version: `studenthub-student-risk-taxonomy-1.0.0`

## Required fields

Each case contains:

`caseId`, `inputType`, `sanitizedContent`, `features`, `label`, `secondaryLabels`, `evidenceRefs`, `labelAuthority`, `resolutionStatus`, `resolutionTimestamp`, `reviewerScope`, `sourceTypes`, `language`, `institutionContext`, `modelEligible`, `privacyReview`, and `datasetVersion`.

`label` must be a taxonomy ID. `labelAuthority` distinguishes unknown/community/AI suggestions from verified human review or an official source. `resolutionStatus` records unresolved, resolved, disputed or retracted state.

## Eligibility gate

`modelEligible` is accepted only when the case has a verified human resolved label, evidence references, approved privacy review and a bounded reviewer scope. A sanitized case may remain in the audit/review pool without being eligible for fine-tuning.

## Privacy boundary

The sanitizer redacts email addresses, phone numbers, student identifiers and query credentials/tokens. Raw personal content must not be used as a training shortcut. Privacy review records status, redaction classes and reviewer identity without making a safety claim.
