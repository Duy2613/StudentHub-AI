# StudentHubAI Trust Engine V5 — Architecture

Status: architecture closure-pass contract for the `trust.v5` cycle. This document does not claim government certification, a calibrated probability model, or a fine-tuned proprietary model.

## Authority and scope

The V5 pipeline is a sequential, evidence-bound safety workflow. L4 is the only component that owns the deterministic security/truth/enforcement policy. L5 is an adversarial assurance auditor and may only preserve or downgrade the L4 presentation.

The seven execution stages are always represented, in this order:

`L1 → L2A → L2B → L2C → L3 → L4 → L5`

| Stage | Architectural role | Output boundary |
| --- | --- | --- |
| L1 | Local Security Screening | `LOCAL_BLOCK`, `LOCAL_SUSPICIOUS`, `LOCAL_CLEAR`, or `LOCAL_UNKNOWN` |
| L2A | Threat Intelligence | `THREAT_MATCH`, `NO_KNOWN_THREAT`, `UNKNOWN`, `SKIPPED_PRIVACY_SAFETY`, or `NOT_APPLICABLE` |
| L2B | Semantic Intelligence | intent/claim/context signals; never a threat-intelligence match or SAFE |
| L2C | StudentHub Domain AI | Vietnamese student-domain taxonomy signal from a versioned baseline |
| L3 | Evidence & Provenance | source authority, freshness, conflict, independence and completeness |
| L4 | Deterministic Trust Policy | separate SECURITY, TRUTH and ENFORCEMENT axes |
| L5 | Adversarial Assurance | pass, review, recheck, inconclusive, or missing-evidence assurance |

## Data flow

The server route accepts a bounded input and starts one request-scoped orchestrator. Each stage receives the prior stage's bounded result. The browser receives public stage envelopes and transition snapshots; server-only `rawMetadata` is removed before serialization.

```text
bounded input
    │
    ▼
L1 local screen ──hard negative────────────────────┐
    │                                              │
    ▼                                              │
L2A disclosure policy ─► reputation observation ──┤
    │                 (ALLOW/REDACT/SKIP)          │
    ▼                                              │
L2B semantic ──► L2C domain AI                     │
                         │                         │
                         └─ candidate claims/tasks │
                              (never evidence)     │
                                                   ▼
                       L3 independent provenance/evidence
                                                   │
                                                   ▼
                                            L4 deterministic policy
                                                   │
                                                   ▼
                                            L5 adversarial audit
                                                   │
                                                   ▼
                                            cautious final presentation
```

A L1 block immediately protects interaction, but it does not by itself decide whether a URL may be disclosed to reputation intelligence. The typed L2A lookup policy is evaluated independently:

| Target condition | Lookup policy | L2A behavior |
| --- | --- | --- |
| Valid public security target | `ALLOW` | Reputation lookup may run; the target is never fetched, rendered, or executed by the Trust Engine. |
| Public target with sensitive query/fragment | `REDACT` | Query/fragment is removed before reputation lookup; the original sensitive value is not sent to the provider. |
| Private, local, link-local, metadata, or SSRF-sensitive target | `SKIP` | No external lookup; L2A reports `SKIPPED_PRIVACY_SAFETY` and preserves the L1 hard negative. |
| Invalid or unsupported target | `SKIP` | No external lookup; L2A reports an invalid/unknown boundary result. |

The L1 hard negative remains authoritative input to L4 regardless of the L2A result, including `NO_KNOWN_THREAT`. A provider no-match is not a safety assertion.

L2C follows an explicit evidence bridge. Its domain classification is advisory and produces a bounded `verificationPackage`, not evidence:

```text
L2C domain classification
    → verification tasks / candidate claims
    → L3 source-scoped independent checks
    → actual evidence with provenance
    → L4 deterministic policy
```

L3 merges L2B and L2C tasks with fixed-type deduplication, count bounds, source scope, and candidate-only markers. Model output, task text, and a requested citation never become evidence. Only retrieved/validated evidence can enter the L3 evidence collection. A high-impact L2C classification with missing L3 evidence remains reviewable and cannot become SAFE.

## Authority rules

- L1 owns local interaction blocking.
- L2A owns only provider observations. A no-match is not proven safety.
- L2A disclosure policy owns the external boundary. `ALLOW`, `REDACT`, and `SKIP` are explicit and observable; private/metadata/SSRF-sensitive targets never reach the provider.
- L2B and L2C are advisory intelligence. They can add suspicion, never erase a hard negative. L2C high-impact classifications request bounded verification rather than directly determining policy.
- L3 owns provenance statements and independent evidence, not truth by assertion. It merges L2B/L2C candidate tasks but does not treat them as evidence.
- L4 owns the final deterministic policy axes.
- L5 checks the pipeline and may downgrade confidence/action; it cannot upgrade safety, change `MALICIOUS` to a safer class, or erase hard-negative evidence.

## Runtime dependency states

The deployment state is recorded at audit time and limits only the affected claim:

| Dependency | Current state | Honest consequence |
| --- | --- | --- |
| L2A backend | `LIVE` when the configured backend returns its valid schema | Provider findings may be reported with provider scope; no-match remains bounded |
| AI Gateway | `DETERMINISTIC_FALLBACK_ONLY` when credentials/reachability are absent | L2B/L5 do not claim live AI capability |
| Retrieval provider | `LOCAL_KNOWLEDGE_BASE_ONLY` when no search provider is configured | L3 local evidence is not externally verified |

The exact runtime probe and raw response are kept in `docs/TRUST-ENGINE-V5-FINAL-REPORT.md` after the release audit. External outage never blocks independent L1/L4 work.

## Failure and retry policy

- L1 is deterministic and is not retried.
- Transient L2A/L3 failures may receive one bounded retry.
- Timeout, malformed response, circuit open, provider error, stale evidence and insufficient evidence remain typed and visible.
- A reputation lookup may be skipped for privacy/security reasons; this is an explicit operation outcome, not a provider no-match and not SAFE.
- L2C evidence requirements that are not observed by L3 are surfaced as a verification gap and remain reviewable.
- A new request aborts the old request. Late transitions cannot be used as the current result.
- Pipeline completion is not a safety assertion.
- If L5 is absent, malformed, or non-pass, final presentation is held or downgraded to review/recheck.

## Versioned implementation

- Stage and pipeline contract: `frontend/src/lib/ai-trust/v5/contracts.js`.
- Sequential execution: `frontend/src/lib/ai-trust/v5/TrustPipelineOrchestrator.js`.
- L2A disclosure policy: `frontend/src/lib/ai-trust/layer2a/ReputationLookupPolicy.js` and `frontend/src/lib/ai-trust/layer2a/Layer2AReputationService.js`.
- L2C baseline: `frontend/src/lib/ai-trust/v5/l2c/StudentDomainRiskModel.js`.
- L2C verification package: `frontend/src/lib/ai-trust/v5/l2c/verificationPackage.js`.
- L2B/L2C evidence bridge: `frontend/src/lib/ai-trust/layer3/Layer3EvidenceService.js` and `frontend/src/lib/ai-trust/layer3/query/QueryGenerator.js`.
- L5 auditor: `frontend/src/lib/ai-trust/v5/l5/AdversarialAssuranceAuditor.js`.
- Public API entries: `frontend/src/app/api/v1/trust/analyze/route.js` and the legacy-compatible `frontend/src/app/api/v1/trust/route.js`; V5 requests use `version: "v5"` and SSE transitions.
