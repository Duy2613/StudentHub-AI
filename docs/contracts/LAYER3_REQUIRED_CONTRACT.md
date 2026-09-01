# StudentHub AI — Layer 3 Required Provider Contract

**Status:** CONTRACT_REQUIRED / NOT_AUTHORIZED_TO_GUESS  
**Owner:** Luna Max  
**Purpose:** Define the minimum authoritative contract needed before the legacy Layer 3 provider can be treated as a live Trust v5 dependency.

## Current adapter request

The server-only adapter posts JSON to /api/verify/layer3 with:

- requestId: bounded request identifier;
- type: text, url, image, or provider-supported input type;
- content: bounded normalized input;
- claims: candidate claim records;
- candidateSources: bounded records containing id, url, and title;
- layer2Result: status and finding;
- layer2CResult: classification.

The browser must never call this provider directly.

## Adapter-accepted response shape

The current anti-corruption adapter can accept an object or a data-wrapped object containing:

- verdict: TRUE, FALSE, UNKNOWN, SUPPORTED, CONTRADICTED, MIXED, UNVERIFIED, INSUFFICIENT_EVIDENCE, or UNAVAILABLE;
- optional confidence in the inclusive range 0 to 1;
- optional stop and canContinueToLayer4 booleans, which must not contradict each other;
- optional sources and evidence arrays;
- optional reason, sourceAgreement, sourceQuality, verificationCompleteness, conflicts, and externalEvidence.

These are parser capabilities, not proof that the provider actually implements the contract.

## Required authoritative provider answers

Before enablement, the provider owner must specify:

1. Authentication method and required headers.
2. Request schema, field limits, enum casing, and content encoding.
3. Response schema and version identifier.
4. Whether a response is synchronous, queued, or streamed.
5. Source and evidence identity rules.
6. Required live-evidence markers, retrieval outcome, source fingerprint, and observed timestamps.
7. Meaning of verdict, confidence, stop, and canContinueToLayer4.
8. Error envelope for 400, 401, 403, 408/timeout, 429, 500, and 503.
9. Retry, idempotency, and request-correlation behavior.
10. Data retention, logging, and prompt-injection handling guarantees.

## Acceptance boundary

Layer 3 may be configured only after a versioned schema, safe staging endpoint, controlled fixture set, and positive/negative contract tests are supplied. Missing or unavailable provider data must remain PARTIAL or UNAVAILABLE and must not become VERIFIED or authorize Layer 4 continuation.
