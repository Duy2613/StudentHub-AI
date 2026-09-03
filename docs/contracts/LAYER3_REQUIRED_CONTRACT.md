# StudentHub AI — Layer 3 Required Provider Contract

**Status:** `SOURCE_PINNED_ADAPTER_CONTRACT`
**Owner:** Luna Max  
**Purpose:** Define the source-derived `friend.layer3.v1` wire contract and the stricter StudentHub boundary required before the legacy Layer 3 provider can be treated as a live Trust v5 dependency.

## Source pin and effective DTO

The contract is pinned to friend commit `0625b1b950f29edd714507e485284208207039fb`. The source files are `Controllers/Verification/Layer3VerificationController.cs`, `DTOs/Verification/Layer3VerifyRequest.cs`, `Services/Verification/ILayer3VerificationService.cs`, and `Layer3VerificationService.cs`.

The source endpoint is anonymous `POST /api/verify/layer3` with `application/json`. The effective request DTO contains exactly `type` and `content`:

```json
{
  "type": "url",
  "content": "https://example.test/claim"
}
```

The controller accepts only `url` and `text`, returns `400` for missing/unsupported input, and does not define request ID, idempotency, authentication, size, or cancellation fields. The current StudentHub adapter may carry bounded context internally, but the wire payload sent to `friend.layer3.v1` must remain compatible with this DTO.

The effective success response is:

```json
{
  "verdict": "UNKNOWN",
  "confidence": 0.5,
  "stop": false,
  "canContinueToLayer4": true,
  "reason": "Web evidence was collected for later analysis.",
  "evidence": [
    { "title": "Example source", "url": "https://example.test/source", "content": "Bounded excerpt" }
  ],
  "sources": [
    { "title": "Example source", "url": "https://example.test/source" }
  ]
}
```

The source service also emits `FAKE` based on lexical counts of words such as `false`, `fake`, `hoax`, `debunked`, `true`, and `verified`. This is legacy behavior only. It must not become canonical truth or a final Trust verdict.

The source uses Tavily with the API key in the JSON body, up to eight results, a 30-second client timeout, and unbounded response reading. It can return provider-derived answer text in `reason` and exception messages on unexpected failures. StudentHub must treat external text as untrusted, capture evidence/provenance separately, and map failures to typed provider states.

## Source-derived field contract

| Field | Type | Nullability | StudentHub rule |
| --- | --- | --- | --- |
| `verdict` | string | required in service result | Retain as legacy assessment metadata; normalize unknown values to unavailable/malformed |
| `confidence` | number | required in service result | Validate `[0,1]`; never use as final decision confidence |
| `stop` | boolean | required in record | Reject contradiction with `canContinueToLayer4=true` |
| `canContinueToLayer4` | boolean | required in record | Advisory legacy flag; canonical policy decides continuation |
| `reason` | string | required | Bound, redact, and never treat provider prose as policy |
| `evidence` | array | required | Validate every URL/content bound; attach layer/provider/retrieval identity |
| `sources` | array | required | Validate URL/title; do not use URL as evidence identity |

## HTTP and failure behavior

| Condition | Friend endpoint behavior | StudentHub normalization |
| --- | --- | --- |
| Missing request/type/content | `400` | `INVALID_INPUT` |
| Unsupported type | `400` | `INVALID_INPUT` |
| Missing Tavily key | `200` `UNKNOWN` result | `NOT_CONFIGURED` |
| No usable sources | `200` `UNKNOWN`, empty arrays, continue flag true | `PARTIAL`/`INSUFFICIENT_EVIDENCE`; continuation remains policy-controlled |
| Search timeout | `200` `UNKNOWN` result from catch path | `TIMEOUT`/`UNAVAILABLE` provider state |
| HTTP 429/5xx | `200` `UNKNOWN` with a generic or unsafe reason | `RATE_LIMITED`/`UNAVAILABLE`; preserve retry metadata only |
| Malformed provider JSON | exception path or unhandled parse failure | `MALFORMED`; discard the projection |

The previous section below records the current adapter parser capabilities. Those capabilities are broader than the source DTO and must not be mistaken for evidence that the friend service implements those fields.

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

The sanitized source-derived cases are in [`legacy-provider-contracts.v1.json`](../../frontend/tests/fixtures/legacy-provider-contracts.v1.json) under `layer3`.
