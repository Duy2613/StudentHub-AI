# StudentHub AI — `friend.layer4.v1` Required Contract

**Status:** `SOURCE_PINNED_ADAPTER_CONTRACT`

**Source commit:** `0625b1b950f29edd714507e485284208207039fb`

**Source files:** `Controllers/Verification/Layer4VerificationController.cs`, `DTOs/Verification/Layer4VerifyRequest.cs`, `Services/Verification/ILayer4VerificationService.cs`, and `Layer4VerificationService.cs`

## Boundary

The friend Layer 4 service is a temporary provider subsystem. It may receive a bounded Layer 3 observation through the server-only compatibility adapter, but its verdict and confidence cannot override StudentHub's deterministic Trust policy.

```text
Canonical Trust API
  → TrustOrchestrator
  → LegacyVerificationAdapter
  → POST /api/verify/layer4
```

The pinned controller is anonymous. StudentHub must not expose this endpoint to the browser or treat the endpoint's anonymous status as a canonical authorization decision.

## Exact request DTO

**Method:** `POST`

**Path:** `/api/verify/layer4`

**Content type:** `application/json`

```json
{
  "type": "url",
  "content": "https://example.test/claim",
  "mode": "user",
  "layer3": {
    "verdict": "UNKNOWN",
    "confidence": 0.5,
    "reason": "Evidence requires further assessment.",
    "evidence": [
      {
        "title": "Example source",
        "url": "https://example.test/source",
        "content": "Bounded excerpt"
      }
    ],
    "sources": [
      {
        "title": "Example source",
        "url": "https://example.test/source"
      }
    ]
  }
}
```

Field rules derived from the C# DTO/controller:

| Field | Type | Nullability | Source rule |
| --- | --- | --- | --- |
| `type` | string | required | Controller checks non-empty; service normalizes lower case but does not enforce a complete enum |
| `content` | string | required | Controller checks non-empty; service trims it |
| `mode` | string | required by DTO, defaulted by controller | `user`, `pro`, `expert`; omitted/blank defaults to `pro` in controller |
| `layer3` | object | required | Missing object returns `400` |
| `layer3.verdict` | string | required by DTO | Passed to the service without enum validation |
| `layer3.confidence` | number | required by DTO | Passed without range validation |
| `layer3.reason` | string | required by DTO | Passed into model prompt; external/untrusted text boundary applies |
| `layer3.evidence` | array | required by DTO | Each item requires `title`, `url`, nullable `content` in the DTO |
| `layer3.sources` | array | required by DTO | Each item requires `title`, `url` |

The DTO has no request ID, idempotency key, schema version, content limit, or cancellation field. The adapter may send correlation in `X-Request-ID`, but must not claim it is part of the pinned request body.

## Effective response DTO

```json
{
  "verdict": "UNKNOWN",
  "confidence": 0.73,
  "evidenceAgreement": 0.70,
  "sourceQuality": 0.65,
  "stop": false,
  "canContinueToLayer4": true,
  "mode": "user",
  "geminiModel": "none",
  "groqModel": "openai/gpt-oss-120b",
  "reason": "Bounded evidence-based explanation.",
  "contradictoryEvidence": [],
  "sources": []
}
```

The source allows legacy verdict values `TRUE`, `FAKE`, `MISLEADING`, and `UNKNOWN` from the model normalizer. The interface response has `CanContinueToLayer4`, which is a legacy naming artifact: Layer 4 is already running, so StudentHub must not use it as a recursive orchestration command.

The friend service performs a second Tavily search, groups Layer 3 and Layer 4 evidence/sources by URL, then calls exactly one model: Groq for `user`, Gemini for `pro`/`expert`. This is useful evidence about intended capability separation but is not the canonical StudentHub provider architecture. URL grouping loses independent observation identity and must be rejected at the canonical boundary.

## HTTP and failure behavior

| Condition | Friend endpoint behavior | StudentHub normalization |
| --- | --- | --- |
| Missing type/content/layer3 | `400` JSON message | `INVALID_INPUT` |
| Invalid mode | `400` | `INVALID_INPUT` |
| Missing Tavily key | `200` `UNKNOWN` result | `NOT_CONFIGURED`/partial provider state |
| Missing selected model key | `200` `UNKNOWN` result | `NOT_CONFIGURED` |
| Tavily research failure | silently returns empty research | Preserve `UNAVAILABLE`/`PARTIAL`; never fabricate evidence |
| Gemini/Groq 400/401/403/429/5xx | model helper returns null; outer service returns `UNKNOWN` | Typed `AUTH_FAILED`, `RATE_LIMITED`, or `UNAVAILABLE` where status evidence exists |
| Malformed model JSON/schema | helper returns null or throws into null path | `MALFORMED`; discard result |
| Provider score outside `[0,1]` | source clamps it | Reject/retain as invalid provider metadata; do not clamp into canonical truth |

## Required StudentHub adapter rules

- Emit the exact root-level DTO above, not the historical `{ requestId, input, layers }` envelope.
- Bound the Layer 3 evidence/source arrays and excerpt sizes before serialization.
- Validate every URL, content type, enum, nullability, numeric interval, and source reference.
- Maintain separate Layer 3 and Layer 4 `EvidenceObservation` records even when URLs match.
- Treat model verdict/confidence/agreement/quality as advisory provider observations.
- Validate model-returned sources against the supplied allowlist or discard them.
- Never expose raw model/provider bodies, exception messages, prompts, keys, or hidden chain-of-thought.
- Preserve provider-state dimensions independently from truth, risk, and final decision.

## Sanitized fixtures

Required cases are in [`legacy-provider-contracts.v1.json`](../../frontend/tests/fixtures/legacy-provider-contracts.v1.json) under `layer4`.
