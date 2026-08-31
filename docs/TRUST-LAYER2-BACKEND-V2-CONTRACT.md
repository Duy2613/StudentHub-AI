# Trust Layer 2 backend v2 contract

Status: proposed compatibility contract. The frontend adapter currently
accepts the deployed v1 response shape and normalizes it into this boundary;
the backend is not changed by this document.

## Request

`POST /api/verify/layer2`

```json
{
  "type": "url",
  "content": "https://target.example/path",
  "requestId": "opaque-correlation-id"
}
```

The caller must send JSON and the URL is bounded and validated before the
request is made. `requestId` is an opaque correlation value and must not carry
secrets.

## Response

```json
{
  "schemaVersion": "2.0",
  "requestId": "opaque-correlation-id",
  "verdict": "NO_KNOWN_THREAT",
  "enforcement": "ALLOW_WITH_CAUTION",
  "reason": "No known threat was returned by the configured provider.",
  "threatTypes": [],
  "checkedAt": "2026-01-01T00:00:00.000Z",
  "cache": {
    "hit": false,
    "ttlMs": 0,
    "expiresAt": null
  },
  "providerStatus": "SUCCESS",
  "finding": "NO_KNOWN_THREAT",
  "latencyMs": 0,
  "errorCode": null,
  "message": null,
  "providers": []
}
```

Allowed `verdict` values are `NO_KNOWN_THREAT`, `DANGEROUS`, and `UNKNOWN`.
`DANGEROUS` must include a threat finding and is normalized to
`THREAT_MATCH`/`MALICIOUS`/`BLOCK`. `NO_KNOWN_THREAT` means only that the
configured lookup returned no known match; it is never proof of safety and is
normalized to `NO_KNOWN_THREAT`/`ALLOW_WITH_CAUTION`. Any timeout, dependency
failure, rate limit, malformed response, contract violation, or missing
provider result is normalized to `UNKNOWN`/`REVIEW`.

## Boundary requirements

- The server must return a stable schema version and a correlation identifier.
- Provider messages and errors must be bounded and must not contain secrets.
- Provider confidence is optional. A missing or invalid score is `null`; the
  adapter must not manufacture confidence.
- Provider entries must be unique by provider identity and must not contradict
  a dangerous finding without the contradiction being preserved.
- Cache metadata may describe only bounded `THREAT_MATCH` or
  `NO_KNOWN_THREAT` results. Failures are not cacheable.
- Rate-limit behavior should expose `Retry-After` where available, but the
  frontend must still map the result to `UNKNOWN`/`REVIEW`.
- The backend must not accept a client claim that a target is verified safe.

## Current frontend adapter

The current deployment is consumed through
`frontend/src/lib/ai-trust/layer2a/RenderLayer2AProvider.js`, configured by the
server-only `STUDENTHUB_LAYER2_BASE_URL` variable. The BFF endpoint is
`frontend/src/app/api/ai-trust/reputation/route.js`. No test canary result is
hard-coded in production code.

When the external backend is unavailable, the test-only
`MockReputationProvider` emits `UNKNOWN` and `NOT_CONFIGURED` solely to allow
pipeline failure-path tests. That mock output is explicitly excluded from M3
evidence.
