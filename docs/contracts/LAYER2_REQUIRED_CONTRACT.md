# StudentHub AI — `friend.layer2.v1` Required Contract

**Status:** `SOURCE_PINNED_ADAPTER_CONTRACT`

**Source commit:** `0625b1b950f29edd714507e485284208207039fb`

**Source file:** `backend/StudentHub.API/Controllers/Verification/VerificationController.cs`, `DTOs/Verification/Layer2VerifyRequest.cs`, `Services/Verification/ILayer2VerificationService.cs`, and `Layer2VerificationService.cs`

## Boundary

This document freezes the observed wire contract of the friend backend. It is an interoperability contract, not canonical Trust semantics. The browser must never call this endpoint directly.

```text
StudentHub Trust API
  → TrustOrchestrator
  → LegacyVerificationAdapter
  → POST /api/verify/layer2
```

## Request

**Method:** `POST`

**Path:** `/api/verify/layer2`

**Authentication:** anonymous in the pinned source. StudentHub must call it only from a server-side adapter and apply its own authorization, rate, cost, and privacy policy.

**Content type:** `application/json`

```json
{
  "type": "url",
  "content": "https://example.test/claim"
}
```

The controller accepts `type` values `url`, `image`, and `text` after trimming/lower-casing. The service has a provider only for `url`; `image` and `text` return an explicit `UNKNOWN` result with no provider records. Empty or unsupported values return HTTP `400` before the service call.

The source does not define request IDs, idempotency keys, size limits, or cancellation fields. StudentHub may carry request identity in an adapter header, but must not pretend it is part of the pinned DTO.

## Effective response

The controller returns HTTP `200` with the interface-local service record. Under ASP.NET web JSON defaults, the wire form is expected to be lower camel case:

```json
{
  "verdict": "SAFE",
  "confidence": 0.95,
  "reason": "No known Safe Browsing threat was returned.",
  "providers": [
    {
      "provider": "Google Safe Browsing",
      "success": true,
      "verdict": "SAFE",
      "confidence": 0.95,
      "message": "No known Safe Browsing threat was returned."
    }
  ]
}
```

Effective fields:

| Field | Type | Nullability | Source meaning |
| --- | --- | --- | --- |
| `verdict` | string | required | `SAFE`, `DANGEROUS`, or `UNKNOWN` in normal service paths |
| `confidence` | number | required | Unbounded source-produced score; StudentHub must treat it as provider metadata only |
| `reason` | string | required | Source-generated explanation; untrusted and must be bounded/redacted |
| `providers` | array | required | Provider records; source does not declare a maximum |
| `providers[].provider` | string | required | Provider display/name string |
| `providers[].success` | boolean | required | Transport/provider success indicator |
| `providers[].verdict` | string | required | Provider-level verdict |
| `providers[].confidence` | number | required | Provider score; not canonical safety probability |
| `providers[].message` | string | nullable | Provider message; may contain unsafe upstream material in error paths |

## Source provider behavior

For URL input, the service calls Google Safe Browsing v4 through a raw HTTP request. A threat match returns `DANGEROUS`. An empty or missing `matches` array returns `SAFE` with `0.95`; this is explicitly rejected by StudentHub and must normalize to `NO_KNOWN_THREAT`, never `VERIFIED_SAFE`.

The Google API key is read from `GoogleSafeBrowsing:ApiKey` and placed in the upstream query string. The source has no explicit timeout/cancellation, retry, response-size bound, typed provider state, or safe error envelope. Upstream non-2xx response bodies and exception messages can enter the returned provider message.

## HTTP and failure behavior observed from source

| Condition | Friend endpoint behavior | StudentHub normalization |
| --- | --- | --- |
| Missing request/type/content | `400` JSON message | `INVALID_INPUT` |
| Unsupported image/text | `200` with `UNKNOWN` and empty providers | `UNAVAILABLE`/`UNKNOWN` capability state, never demo |
| Missing Google key | `200` with `UNKNOWN`, provider `success=false` | `NOT_CONFIGURED` |
| Invalid URL | `200` with `UNKNOWN`, provider `success=false` | `INVALID_INPUT` |
| Threat match | `200` with `DANGEROUS` | `THREAT_MATCH` provider observation |
| No threat match | `200` with `SAFE` | `NO_KNOWN_THREAT`; not safety proof |
| Upstream 4xx/5xx or rate limit | Usually `200` with `UNKNOWN` provider failure; raw body may be included | `UNAVAILABLE`, `RATE_LIMITED`, or `AUTH_FAILED` based on adapter evidence |
| Timeout/cancellation | No source-specific contract; broad catch returns `UNKNOWN` | Typed `TIMEOUT`/`CANCELLED` in the adapter |
| Malformed upstream JSON shape | May be treated as no match | Fail closed as `MALFORMED`; never promote to safe |

## Required StudentHub adapter rules

- Keep the request and response parser pinned to `friend.layer2.v1`.
- Bound request, response, provider-message, and provider-array sizes.
- Remove API keys from URLs and ordinary logs; use server-side secret injection.
- Validate HTTP content type, JSON shape, verdicts, score ranges, and provider records.
- Preserve provider health separately from `NO_KNOWN_THREAT`, `DANGEROUS`, and canonical Trust decisions.
- Hash/redact disclosed URLs according to the existing reputation lookup policy.
- Never return raw upstream bodies, exception messages, stack traces, or credentials.
- Preserve `Retry-After` and correlation metadata when available without making them truth claims.

## Sanitized fixtures

Required cases are in [`legacy-provider-contracts.v1.json`](../../frontend/tests/fixtures/legacy-provider-contracts.v1.json) under `layer2`.
