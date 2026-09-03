# Provider Contract Versioning and Drift Policy

Status: `IMPLEMENTED_FOR_LEGACY_BOUNDARY`

## Version anchors

The friend-derived compatibility contracts are pinned to:

- repository: `https://github.com/anhkt015/StudentHub-AI`
- branch: `develop`
- inspected commit: `0625b1b950f29edd714507e485284208207039fb`
- sanitized fixture set: `frontend/tests/fixtures/legacy-provider-contracts.v1.json`

The canonical StudentHub runtime contract is versioned independently of that
source. A change to the friend repository does not silently change the
canonical contract.

## Required versioning rules

1. Every provider adapter declares a contract version and provider identity.
2. Request and response DTOs are allowlisted and bounded at the adapter edge.
3. Unknown required enums, missing required fields, contradictory continuation
   flags, invalid URLs, out-of-range numbers, oversized content, or malformed
   JSON fail closed.
4. Additive optional fields may be ignored only when the required contract
   remains valid; incompatible changes require a new adapter/contract version.
5. Contract drift is observable through a typed `MALFORMED` or
   `INVALID_RESPONSE` provider state and a safe error code. It never becomes a
   positive verdict.
6. Fixtures contain no keys, database URLs, personal data, or live canaries.

## Compatibility matrix

| Boundary | Version | Required request shape | Required response behavior |
| --- | --- | --- | --- |
| Layer 2 legacy | source-derived v1 | `{ type: "url", content: string }` | `SAFE`, `DANGEROUS`, or `UNKNOWN` plus provider records; no-match maps to `NO_KNOWN_THREAT` |
| Layer 3 legacy | source-derived v1 | `{ type: "url" | "text", content: string }` | verdict/confidence/stop/continuation/reason/evidence/sources; response is normalized as evidence observation |
| Layer 4 legacy | source-derived v1 | `{ type, content, mode, layer3 }` | verdict/confidence/agreement/quality/stop/continuation/models/reason/contradictions/sources |
| Provider Gateway | `studenthub-trust-provider-gateway-v1` | capability-specific method input | typed provider result plus separate health observation |
| Provenance | `trust.provenance.v1` | normalized evidence records | source document, retrieval run, observation, provider observation, links, revisions |

## Drift test matrix

The sanitized fixture file covers the required source-derived L2/L3/L4
success, unknown, unavailable, timeout, authorization, rate-limit, server
failure, unsupported-input, contradictory, oversized, and malformed cases.
The executable adapter suite validates request keys, response shape, bounds,
redaction, and typed resilience. Any live contract update must first add a
fixture and a focused contract test before changing the adapter.

## Change procedure

1. Record the upstream provider version/commit without copying implementation.
2. Update the relevant contract document and sanitized fixture.
3. Add a contract test for each changed required field and failure mode.
4. Run the focused adapter and affected Trust regression suites.
5. Review data classification, cost, privacy, rollback, and migration impact.
6. Only then update the gateway registry and staging enablement record.

