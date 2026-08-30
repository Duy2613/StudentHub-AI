# Frontend Verification and Contract State Specification

Date: 2026-08-28

This specification freezes the current product design and defines the observable states that automated tests must prove. It does not authorize backend, database, RLS or session changes.

## Trust scan state matrix

| State | Trigger | System action | User-visible contract | Boundary / error path |
|---|---|---|---|---|
| `IDLE` | `/trust` loads | No API call | Input modes and disabled submit are visible | Empty input cannot submit |
| `VALIDATING` | User chooses text, URL or image | Validate non-empty input, URL syntax, MIME and 8 MB limit | Field/file error is specific | Invalid URL, unsupported MIME and oversized file never enter the pipeline |
| `OCR_RUNNING` | Valid image scan starts | Lazy-load browser OCR | Pipeline says browser OCR and later labels `CLIENT_OCR_HINT` | OCR timeout/unavailable produces a recoverable error, never “verified server OCR” |
| `L1_RUNNING` | Valid normalized input exists | Request Layer 1 | Local analysis is `RUNNING` | Abort or API error becomes typed error state |
| `EARLY_BLOCK` | Layer 1 returns `BLOCK` | Skip semantic/evidence, request final reasoning | External evidence says `SKIPPED`; final verdict may complete | Skipped is never displayed as clean or successful evidence |
| `L2_RUNNING` | Layer 1 does not block | Request semantic analysis | Current pipeline step advances | Invalid response is `SCHEMA_MISMATCH` |
| `L3_RUNNING` | Layer 2 completes | Request evidence | Evidence step is `RUNNING` | Provider `unknown/error/unavailable` remain distinct from `clean` |
| `PARTIAL` | Some evidence providers fail | Preserve valid provider results | Page displays `PARTIAL` and identifies unavailable providers | Partial is not collapsed into success or safe |
| `L4_RUNNING` | Prior required layers settle | Request final reasoning | Reasoning step is `RUNNING` | Timeout/abort is recoverable and cannot crash the React tree |
| `COMPLETE` | Layer 4 validates | Render verdict/evidence/timeline | Risk, confidence, evidence sufficiency and source agreement are separate | Insufficient evidence cannot be labeled safe |
| `CANCELLED` | New scan starts or component unmounts | Abort prior requests | New scan remains authoritative | Late Scan A cannot overwrite Scan B |
| `RATE_LIMITED` | API returns 429 | Preserve `Retry-After` | Clear retry guidance | No automatic request storm |
| `UNAUTHORIZED` | API returns 401 | Surface re-auth state | Authentication-required copy | No infinite redirect loop |
| `FORBIDDEN` | API returns 403 | Surface permission state | Permission copy | User is not logged out automatically |
| `SERVICE_UNAVAILABLE` | API returns 502/503 or timeout | Stop affected step | Temporary-unavailable copy and support reference | Do not claim a clean provider result |
| `CONTRACT_ERROR` | Invalid JSON/schema mismatch | Fail closed | Safe generic error and trace/reference if present | Raw payload and internals are not rendered |

## API client state matrix

| Boundary | Normalized error code | Required metadata |
|---|---|---|
| 400 | `VALIDATION` | status, safe message |
| 401 | `UNAUTHORIZED` | status, trace ID if present |
| 403 | `FORBIDDEN` | status, trace ID if present |
| 404 | `NOT_FOUND` | status |
| 409 | `CONFLICT` | status |
| 413 | `PAYLOAD_TOO_LARGE` | status |
| 422 | `VALIDATION` | status |
| 429 | `RATE_LIMITED` | status, parsed Retry-After |
| 500 | `SERVER_ERROR` | status, trace ID |
| 502 | `UPSTREAM_UNAVAILABLE` | status, trace ID |
| 503 | `SERVICE_UNAVAILABLE` | status, trace ID |
| Timeout | `TIMEOUT` | timeout duration |
| Abort by caller | `ABORTED` | no alarming user message |
| Network failure | `NETWORK_ERROR` | safe message |
| Invalid JSON | `INVALID_RESPONSE` | status, trace ID |
| Schema mismatch | `SCHEMA_MISMATCH` | issue summary for telemetry only |

## TrustGraph state matrix

| State | Trigger | Visible contract |
|---|---|---|
| Loading | Valid verdict renders graph island | Labeled graph-loading state |
| Graph | Module resolves | Nodes are buttons; zoom, search and filters are keyboard usable |
| Selected | Node activated | Inspector exposes label, type, detail and relationships |
| Filtered empty | Search/filter excludes all nodes | Empty result text, not a blank canvas |
| List fallback | User selects list mode | Each item exposes node label, type, detail and relationships |
| Reduced motion | OS requests reduced motion | No continuous animation; transforms/transitions are disabled globally |

## Test data policy

Browser tests may intercept API routes with deterministic payloads only inside Playwright. Such payloads are test fixtures, never production fallbacks. Production components must continue to render only real API responses and explicit empty/error states.

## Competition RC1 verification matrix

| State / gate | Trigger | Required action | Visible or recorded result | Boundary / failure path |
| --- | --- | --- | --- | --- |
| Cross-browser local | Run deterministic suite in Chromium, Firefox or WebKit | Use the same contracts and assertions | Exact per-browser pass/fail matrix | Never hide a failing browser with a skip |
| Mobile local | Run mobile Chromium project | Preserve touch layout and no horizontal overflow | Mobile project result and screenshots | Desktop success does not imply mobile success |
| Staging ready | `STUDENTHUB_STAGING_BASE_URL` and explicit case inputs exist | Run real requests without route interception | Contract/rendering result per staging case | Missing environment exits with `STAGING_E2E_BLOCKED_BY_ENV` |
| Staging partial | Real staging response contains mixed providers | Preserve findings/unknown/unavailable independently | Three distinct provider states | Frontend staging tests do not score model accuracy |
| Lighthouse local | Production server is available | Audit Trust, Community and Expert | Per-route scores, LCP and CLS with environment label | Local lab metrics are not field/staging metrics |
| Graph failure | TrustGraph render throws | Catch inside graph boundary | Local graph-unavailable panel; verdict/evidence remain | Error is reported without content or token payloads |
| Slow pipeline | A layer response is delayed | Keep completed prior layers and current running state | Progressive pipeline truth | Timeout preserves earlier completed evidence |
| Scan replacement | Scan B starts while A is active | Abort A and transfer ownership to B | Final UI always belongs to B | Test both A-first and B-first completion order |
| Route departure | Scan runs while navigation unmounts Trust | Abort in cleanup | Destination renders without stale Trust writes | No unmounted update warning |
| Demo disabled | Normal production/local mode | Use real configured API path only | No demo badge or fixture access | Network failure never auto-enables demo data |
| Demo enabled | Operator explicitly sets public demo flag | Offer exactly three labeled deterministic cases | Persistent `CHẾ ĐỘ TRÌNH DIỄN · DEMO DATA` disclosure | Fixtures remain isolated from production API modules |
| Print report | Completed result and user chooses print | Use browser print stylesheet | Verdict, metrics, evidence, actions and disclaimer | Hide controls/internal references/private debug data |
| Frontend telemetry | Timeout/schema/partial/graph failure occurs | Emit allowlisted metadata only | Event name, duration/status, safe reference | Never emit input text, image, token, cookie, OTP or bank data |

## RC1 freeze policy

After all available gates settle, allowed changes are limited to competition blockers, accessibility/security corrections, verified browser defects, and measured performance regressions. Navigation, design system, large animation, and unrelated product features remain frozen.
