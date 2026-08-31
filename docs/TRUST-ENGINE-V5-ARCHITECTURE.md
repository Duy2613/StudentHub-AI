# StudentHubAI Trust Engine V5 — Architecture

Status: implementation contract for the `trust.v5` cycle. This document does not claim government certification, a calibrated probability model, or a fine-tuned proprietary model.

## Authority and scope

The V5 pipeline is a sequential, evidence-bound safety workflow. L4 is the only component that owns the deterministic security/truth/enforcement policy. L5 is an adversarial assurance auditor and may only preserve or downgrade the L4 presentation.

The seven execution stages are always represented, in this order:

`L1 → L2A → L2B → L2C → L3 → L4 → L5`

| Stage | Architectural role | Output boundary |
| --- | --- | --- |
| L1 | Local Security Screening | `LOCAL_BLOCK`, `LOCAL_SUSPICIOUS`, `LOCAL_CLEAR`, or `LOCAL_UNKNOWN` |
| L2A | Threat Intelligence | `THREAT_MATCH`, `NO_KNOWN_THREAT`, `UNKNOWN`, or `NOT_APPLICABLE` |
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
L1 local screen ──hard negative──┐
    │                            │
    ▼                            │
L2A threat intelligence ─hard────┤
    │                            │
    ▼                            │
L2B semantic ──► L2C domain ──► L3 provenance
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

A L1 block does not cause the orchestrator to fabricate or silently skip downstream analysis. It immediately protects interaction, while later stages run only through their own safe adapters. A threat match is retained as a hard negative through L4 and L5.

## Authority rules

- L1 owns local interaction blocking.
- L2A owns only provider observations. A no-match is not proven safety.
- L2B and L2C are advisory intelligence. They can add suspicion, never erase a hard negative.
- L3 owns provenance statements, not truth by assertion.
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
- A new request aborts the old request. Late transitions cannot be used as the current result.
- Pipeline completion is not a safety assertion.
- If L5 is absent, malformed, or non-pass, final presentation is held or downgraded to review/recheck.

## Versioned implementation

- Stage and pipeline contract: `frontend/src/lib/ai-trust/v5/contracts.js`.
- Sequential execution: `frontend/src/lib/ai-trust/v5/TrustPipelineOrchestrator.js`.
- L2C baseline: `frontend/src/lib/ai-trust/v5/l2c/StudentDomainRiskModel.js`.
- L5 auditor: `frontend/src/lib/ai-trust/v5/l5/AdversarialAssuranceAuditor.js`.
- Public API entries: `frontend/src/app/api/v1/trust/analyze/route.js` and the legacy-compatible `frontend/src/app/api/v1/trust/route.js`; V5 requests use `version: "v5"` and SSE transitions.
