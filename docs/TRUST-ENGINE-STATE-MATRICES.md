# Trust Engine M3 State Matrices

This document is the implementation contract for the high-assurance Trust Engine remediation. It is intentionally explicit about state transitions so provider failure, missing evidence, and malformed input cannot inherit an optimistic default.

## Layer 1 — local deterministic screening

| State | Trigger | Action | Output scope | Error/boundary handling |
| --- | --- | --- | --- | --- |
| `INPUT_INVALID` | Empty, malformed, unsupported type, invalid bytes, or over bound | Stop local inspection | `LOCAL_UNKNOWN` or `LOCAL_BLOCK` when the boundary itself is unsafe | No outbound request; typed reason; preserve only bounded/redacted evidence |
| `LOCAL_HARD_BLOCK` | Deterministic malicious file, SSRF target, credential harvest, executable, or equivalent hard rule | Stop pipeline | `LOCAL_BLOCK`; authoritative hard-negative | Later layers cannot erase it |
| `LOCAL_SUSPICIOUS` | Material anomaly without a deterministic hard-block | Continue to Layer 2 | `LOCAL_SUSPICIOUS`; local-only | Never final `SAFE`/`ALLOW` |
| `LOCAL_CLEAR` | No local material signal | Continue to Layer 2 | `LOCAL_CLEAR` with `LOCAL_SCREEN_ONLY` scope and `providerIndependent=true` | It is not proof of safety |
| `LOCAL_FAILURE` | Detector or internal dependency throws | Stop the affected local operation | `LOCAL_UNKNOWN` | Fail closed; no synthetic confidence or safe status |

## Layer 2A — external URL reputation

| State | Trigger | Action | Finding | Enforcement implication |
| --- | --- | --- | --- | --- |
| `NOT_CONFIGURED` | Provider base URL is absent/invalid | Do not call a provider | `UNKNOWN`, confidence `null` | Layer 4 must abstain; never `SAFE` |
| `SUCCESS_THREAT` | Valid provider response contains a threat match | Preserve authoritative finding and threat types | `THREAT_MATCH`, security `MALICIOUS` | Hard `BLOCK` |
| `SUCCESS_NO_MATCH` | Valid provider response explicitly reports no match | Preserve provider provenance and TTL | `NO_KNOWN_THREAT`, confidence only if provider supplied it | Candidate evidence only; not verified safe |
| `TIMEOUT`/`UNAVAILABLE`/`RATE_LIMITED` | Network/provider failure or breaker open | Return typed degradation | `UNKNOWN`, confidence `null` | Layer 4 must `REVIEW` or warn based on local signals |
| `INVALID_RESPONSE`/`CONTRADICTION` | Schema violation or mutually inconsistent fields | Record contract violation; reject response | `UNKNOWN`, confidence `null` | Never choose the optimistic interpretation |
| `CACHE_HIT` | Only a still-valid provider result with explicit provider TTL | Return the stored result with age metadata | Same finding as cached result | Failure results are never cached as no-match |

## Layer 2B — semantic analysis

| State | Trigger | Action | Authority | Error/boundary handling |
| --- | --- | --- | --- | --- |
| `DETERMINISTIC` | Normal input or AI unavailable | Run bounded deterministic semantic analyzers | Semantic context only | Cannot override Layer 1/2A hard negatives |
| `AI_VALIDATED` | Configured model returns bounded schema-valid output | Use only validated semantic fields | Non-authoritative semantic signal | Model confidence is not security confidence |
| `AI_INVALID` | Malformed JSON, wrong enum, oversized output, or injection-shaped output | Discard model result; use deterministic path | No AI evidence | Typed fallback; no safe upgrade |
| `AI_UNAVAILABLE` | Timeout, rate limit, network, dependency outage | Use deterministic path | Provider status degraded | Preserve failure metadata; no synthetic confidence |
| `UNTRUSTED_CONTENT` | User/OCR/QR/retrieved text contains instructions | Treat as data, never instructions | No authority escalation | No tools, secrets, policy, or privilege changes |

## Layer 3 — external evidence and provenance

| State | Trigger | Action | Evidence label | Result |
| --- | --- | --- | --- | --- |
| `NO_CLAIMS` | Semantic layer yields no claims | Do not infer verification | No evidence | `INSUFFICIENT_EVIDENCE` |
| `LOCAL_FALLBACK` | External retrieval is unavailable and local corpus is used | Preserve source class and limitation | `LOCAL_KNOWLEDGE_BASE` | Never `EXTERNAL_VERIFIED` |
| `VALID_EVIDENCE` | Bounded content, valid provenance, claim alignment, freshness, and source scope | Extract minimal passage and hash/fingerprint | Source-specific | `VERIFIED` only for supported claim evidence, not pipeline completion |
| `STALE`/`UNKNOWN_DATE` | Evidence is outside policy window or has no reliable date | Retain but downgrade | `STALE`/`UNKNOWN_DATE` | `INSUFFICIENT_EVIDENCE` or `PARTIAL` |
| `CONFLICTING` | Independent sources disagree without authoritative resolution | Preserve both sides and lineage | `CONFLICTING` | `CONTESTED`/`REVIEW`; no winner by popularity |
| `RETRIEVAL_REJECTED` | SSRF, redirect abuse, script/binary/polyglot, prompt injection, content mismatch, or size limit | Discard source | No citation | Completeness decreases; never safe |

## Layer 4 — final deterministic policy

| Precedence | Trigger | Security classification | Truth status | Enforcement |
| --- | --- | --- | --- | --- |
| 1 | Authoritative Layer 2A threat match | `MALICIOUS` | `SUPPORTED`/`MIXED` as applicable | `BLOCK` |
| 2 | Layer 1 local hard security block | `MALICIOUS` | Separate factual assessment | `BLOCK` |
| 3 | Material local suspicion plus valid provider no-match | `SUSPICIOUS` | Evidence-dependent | `WARN` |
| 4 | Material local suspicion plus provider unknown/failure | `SUSPICIOUS` | `INSUFFICIENT_EVIDENCE` | `WARN`/`REVIEW` |
| 5 | Local clear plus provider no-match | `NO_KNOWN_THREAT` | `INSUFFICIENT_EVIDENCE` unless claims are independently supported | `ALLOW_WITH_CAUTION` |
| 6 | Provider unknown, missing, invalid, or insufficient evidence | `UNKNOWN` | `INSUFFICIENT_EVIDENCE` | `REVIEW` |

AI may enrich an evidence-bound explanation after this policy decision. It cannot change classification, truth status, risk, enforcement, confidence, or recommended action.

## Cross-boundary invariants

- `UNKNOWN`, provider failure, no local signal, no-match, and completed execution are never `SAFE` or verified safety.
- A lower-authority signal cannot erase an authoritative hard-negative.
- Every external result carries provider status, request ID, checked time, bounded latency, and provenance.
- Failures are typed and visible to the caller; fallback is not disguised as live provider success.
