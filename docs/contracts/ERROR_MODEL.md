# StudentHub AI — Safe Frontend Error Model

**Phase:** Stages 00–24 continuous engineering program  
**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01

## Purpose

This is the single error contract exposed from the frontend transport and provider boundary. It separates safe user guidance from HTTP/provider internals and gives the UI enough information to choose a truthful state and next action.

Runtime implementation:

- `frontend/src/lib/api/errors.ts` — `ApiError`, `SafeFrontendError`, code schema, safe messages, retryability;
- `frontend/src/lib/api/client.ts` — same-origin request lifecycle, response/request identity, JSON/schema validation;
- `frontend/src/lib/ui-state/model.ts` — error-to-UI-state mapping and envelope validation;
- `frontend/src/lib/backend/ports.ts` — provider failure/unavailable normalization.

## Safe shape

The UI receives only this shape:

```ts
{
  code: ApiErrorCode,
  userMessage: string,
  requestId: string | null,
  retryable: boolean,
  details?: {
    issues?: string[],
    field?: string,
    dependency?: string
  }
}
```

`details` is bounded and allow-listed. HTTP status, retry-after, trace ID, and raw validation objects remain `ApiError` metadata for transport/control flow; they are not copied into the frontend error payload unless represented by the safe fields above.

## Canonical codes and state mapping

| Code | Meaning | UI state | Retryable by default |
| --- | --- | --- | --- |
| `UNAUTHORIZED` | Session is required or expired | `AUTH_REQUIRED` | No |
| `FORBIDDEN` | Access is denied | `FORBIDDEN` | No |
| `NOT_FOUND` | Requested resource is absent | `ERROR` at generic transport boundary; feature may map to `EMPTY` only by contract | No |
| `CONFLICT` | Revision/idempotency/scope conflict | `CONFLICTING_EVIDENCE` | No |
| `PAYLOAD_TOO_LARGE` | Input exceeds boundary | `ERROR` | No |
| `VALIDATION` | Input is invalid | `ERROR` | No |
| `RATE_LIMITED` | Server rate limit | `ERROR` with retry metadata | Yes |
| `SERVER_ERROR` | Unexpected server/runtime failure | `ERROR` | No |
| `UPSTREAM_UNAVAILABLE` | Upstream source unavailable | `UNAVAILABLE` | Yes |
| `SERVICE_UNAVAILABLE` | Requested service unavailable | `UNAVAILABLE` | Yes |
| `NETWORK_ERROR` | Client could not reach the service | `OFFLINE` | Yes |
| `TIMEOUT` | Bounded request exceeded its deadline | `UNAVAILABLE` | Yes |
| `ABORTED` | User/lifecycle cancelled work | `CANCELLED` | No |
| `INVALID_RESPONSE` | Response was not valid JSON/transport data | `ERROR` | No |
| `SCHEMA_MISMATCH` | Response failed the approved runtime schema | `ERROR` | No |
| `PROVIDER_PARTIAL` | Provider returned incomplete scope | `PARTIAL` | Yes |

`UNKNOWN`, `INSUFFICIENT_EVIDENCE`, and `CONFLICTING_EVIDENCE` are domain/UI meanings, not replacements for transport failures. A transport failure cannot be converted into a positive Trust result.

## Request identity

- `apiRequest` accepts an optional bounded `requestId` and sends it as `X-Request-ID` for same-origin requests.
- Response identity is read from `x-request-id`, `x-correlation-id`, or approved response metadata (`requestId`/`traceId`).
- The caller's request ID is retained as the primary UI correlation ID when available; the response ID is retained as trace metadata.
- Trust sequential streaming preserves request identity through fetch, stream parsing, and typed failures.

## Redaction rules

The client must not expose or forward to UI state:

- raw backend `message` fields when they may contain internals;
- stack traces, SQL/provider diagnostics, tokens, credentials, cookies, or secret configuration;
- raw response bodies, unbounded input, private contributor fields, or provider SDK objects;
- a server error as a Trust finding, confidence value, or safe verdict.

Only an explicitly safe `userMessage` from a backend response may replace the generic localized message. Validation issues are bounded to five short path/message strings and must not contain raw payload values.

## Envelope invariants

- `ERROR`, `AUTH_REQUIRED`, and `FORBIDDEN` carry a `SafeFrontendError`.
- `UNAVAILABLE` carries an unavailable dependency and never carries a synthetic success result.
- `OFFLINE` preserves local safe state and carries no persistence claim.
- `ABORTED` becomes `CANCELLED`; a late response is ignored by request/run identity checks.
- `SCHEMA_MISMATCH` is a contract failure, not evidence.

## Continuous program evidence

The local foundation suite (`4/4` files, including `18` adapter assertions) asserts raw-message redaction, request ID propagation, retryability, timeout, abort, schema mismatch, unavailable mapping, and no live-to-demo fallback. Full discovered tests (`265/265`) and the Chromium browser suite (`67 passed`, `3 skipped`) also pass. Live backend, auth, and RLS evidence remains `BLOCKED_BY_ENV` until the approved integration environment exists.
