# StudentHub AI Provider Gateway Architecture

Status: `REPOSITORY_IMPLEMENTED_WITH_NATIVE_PROVIDER_GATES`

This document defines the canonical provider boundary for Trust v5. It is an
independent StudentHub contract; the friend backend remains a temporary
provider subsystem and is never the canonical API, identity authority,
database, or decision authority.

## Boundary

```text
Canonical Trust API
        |
        v
TrustOrchestrator
        |
        v
ProviderGateway
   |       |       |       |       |
  L2      L3      L4    analysis synthesis
UrlThreat WebEvidence Independent Evidence  Final
Provider Provider  Research   Analysis   Synthesis
        |
        +--> native StudentHub adapters (cutover target)
        +--> LegacyVerificationAdapter (compatibility only)
        +--> shadow provider (comparison only; never decision authority)
        |
        v
Normalized observations -> deterministic Trust policy -> Report/Graph/Passport
```

The implementation lives in:

- `frontend/src/lib/ai-trust/providerGateway/ProviderGateway.js`
- `frontend/src/lib/ai-trust/providerGateway/types.js`
- `frontend/src/lib/ai-trust/providerGateway/ProviderSelection.js`
- `frontend/src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js`

## Capability ports

| Port | Method | Scope | May decide final Trust? |
| --- | --- | --- | --- |
| `UrlThreatProvider` | `check` | Known-threat/reputation observation for a disclosed URL | No; `NO_KNOWN_THREAT` is not safe proof |
| `WebEvidenceProvider` | `verify` | Evidence acquisition and source observations | No; retrieval is not truth |
| `IndependentResearchProvider` | `synthesize` | Independent retrieval/research candidate | No; deterministic policy remains authoritative |
| `EvidenceAnalysisProvider` | `analyze` | Bounded analysis over normalized evidence | No |
| `FinalSynthesisProvider` | `synthesize` | User-visible explanation/candidate synthesis | No; no hidden chain-of-thought or verdict override |

Domain callers request a capability, never a vendor or model name. The gateway
maps capability to a provider method and returns typed unavailable status when
the capability is missing. Provider health is kept separate from evidence
relations and final decision fields.

## Provider health

The canonical health vocabulary is:

`NOT_CONFIGURED`, `READY`, `DEGRADED`, `RATE_LIMITED`, `TIMEOUT`,
`AUTH_FAILED`, `MALFORMED`, `UNAVAILABLE`, `CIRCUIT_OPEN`.

None of these values is a verdict. A provider outage can only produce an
unknown/partial/blocked investigation state, never `SAFE`, `TRUE`, or an
optimistic confidence value.

## Selection and strangler migration

The gateway supports server-side modes through `L2_PROVIDER`, `L3_PROVIDER`,
`L4_PROVIDER`, `EVIDENCE_ANALYSIS_PROVIDER`, and
`FINAL_SYNTHESIS_PROVIDER`. Accepted values are `auto`, `legacy`, `native`,
and `shadow`.

- `auto`: use an explicitly supplied native capability, otherwise enabled legacy.
- `legacy`: use only the compatibility provider for that capability.
- `native`: use only the native capability; no silent legacy fallback.
- `shadow`: keep legacy active while retaining native as a non-user-visible comparison target.

The default is `auto`, preserving compatibility in a configured environment.
Shadow execution is intentionally an explicit integration point; it must be
enabled only after data-classification and duplicate-outbound-request review.

## Legacy anti-corruption boundary

The only allowed legacy route is:

`Canonical API -> TrustOrchestrator -> ProviderGateway -> LegacyVerificationAdapter -> friend backend`.

The adapter enforces exact request DTOs, strict bounded response validation,
SSRF-safe endpoint checks, timeout/cancellation, bounded retry/backoff/jitter,
`Retry-After`, circuit breaker, bulkhead, correlation IDs, and redaction. Raw
provider bodies, exception text, stacks, hosts, credentials, and database
secrets do not enter public results.

## Truth invariants

- Google/Safe Browsing no-match is represented as `NO_KNOWN_THREAT`, never `VERIFIED_SAFE`.
- Tavily/search is evidence acquisition only; legacy keyword heuristics are diagnostic metadata at most.
- Provider confidence is assessment metadata, not safety probability or decision confidence.
- Layer 3 and Layer 4 observations remain distinct even when their URL is identical.
- AI output is schema-validated, evidence-bound, bounded, and advisory.

## Current status

Repository contracts and compatibility behavior are implemented and locally
tested. Native external provider success, shadow comparison, and production
cutover are `NOT_VERIFIED` until approved staging endpoints, credentials,
terms, and live evidence exist. See
`docs/architecture/NATIVE_PROVIDER_MIGRATION_PLAN.md` and
`docs/reports/HUMAN_ACTION_REQUIRED.md`.

