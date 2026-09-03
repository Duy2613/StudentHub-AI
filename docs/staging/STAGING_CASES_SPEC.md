# StudentHub AI — Staging Case Fixture Specification

This fixture is deterministic, non-secret, and intended for an operator-owned Trust v5 staging backend. It must not be pointed at production and must not rely on uncontrolled malicious URLs.

| Case | Input | Required staging behavior |
| --- | --- | --- |
| suspicious | Text fixture SUSPICIOUS_V1 | Return a Trust v5 report with an explicit suspicious/high-risk finding and provider provenance |
| benign | Text fixture BENIGN_V1 | Return a bounded report that is not forced into HIGH or CRITICAL risk |
| invalid | not-a-valid-url | Return typed input validation; no provider call |
| partial | Text fixture PARTIAL_V1 | Preserve provider PARTIAL/UNKNOWN/UNAVAILABLE states distinctly |
| insufficient | Text fixture INSUFFICIENT_EVIDENCE_V1 | Never render a clean/safe conclusion without evidence |
| failure | Text fixture FAILURE_V1 | Exercise an operator-controlled real timeout, 429, 502, or 503; do not fake it in the browser |

The provider must recognize these fixture identifiers only in the isolated staging environment. A staging case file is supplied to the existing runner through STUDENTHUB_STAGING_CASES_PATH and is never committed with cookies, tokens, or passwords.
