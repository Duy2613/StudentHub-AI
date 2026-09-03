# StudentHub AI — Layer 4 Contract Gap

**Status:** CONTRACT_DRIFT / PROVIDER_OWNER_INPUT_REQUIRED  
**Observed date:** 2026-09-01  
**Owner:** Luna Max

## Current StudentHub adapter request

The server-only anti-corruption adapter posts JSON to /api/verify/layer4:

- requestId;
- input: type and bounded content;
- layers.layer1: status and bounded signals;
- layers.layer2: finding, provider status, and raw verdict;
- layers.layer2Semantic: status;
- layers.layer2Domain: classification;
- layers.layer3: status, legacy verdict, and bounded evidence references containing evidenceId, relation, and sourceId;
- unresolvedSignals: bounded strings.

The request is emitted only from the server-side Trust pipeline. The browser does not call the legacy provider.

## Observed reference response

The safe bounded probe on 2026-09-01 returned:

- HTTP 400;
- content type application/problem+json; charset=utf-8;
- 369-byte response;
- top-level keys: errors, status, title, traceId, type;
- no accepted Layer 4 verdict, sources, or evidence.

The raw response body is intentionally not reproduced because it is untrusted provider content.

StudentHub normalized this response to:

- status UNAVAILABLE;
- providerStatus derived from the HTTP failure;
- rawVerdict null;
- stop true;
- canContinueToLayer4 false;
- no sources;
- errorCode LEGACY_LAYER4_HTTP_400.

## Missing information

The provider owner must specify:

1. Required request fields and exact type/mode enum.
2. Expected Layer 3 envelope and whether Layer 4 requires a completed Layer 3 result.
3. Authentication and required headers.
4. Success response schema, version, casing, and nesting.
5. Verdict and confidence semantics.
6. Source/evidence/provenance requirements.
7. Problem-details error mapping and retryability.
8. Idempotency and trace correlation behavior.
9. Safe staging fixtures for success, partial, conflict, timeout, 4xx, 5xx, malformed JSON, and schema mismatch.

## Canonical decision

No adapter mapping is changed from this evidence. The current fail-closed behavior is retained. A future change must occur only inside the anti-corruption adapter, after the authoritative provider contract is received and contract tests are added.
