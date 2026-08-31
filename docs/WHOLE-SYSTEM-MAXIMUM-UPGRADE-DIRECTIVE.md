# StudentHub AI — Whole-System Maximum Upgrade Directive

Version: 1.0
Owner: repository-controlled engineering directive
Scope: the entire StudentHub AI repository, with priority on security, truthfulness, durability, and production operability.

## 1. Mission

Upgrade the remaining system capabilities to the highest evidence-backed level that can be achieved in the current repository and runtime. Improve real behavior, not marketing language. Preserve existing user-facing flows unless a change is required to remove a security or truthfulness defect.

The system must:

- fail closed for identity, authorization, provenance, provider, parsing, and persistence failures;
- never convert missing, stale, malformed, untrusted, or unavailable data into a positive security/truth claim;
- keep demo fixtures visibly separate from live data;
- keep server authority separate from browser claims;
- keep every external dependency optional only where the affected contract explicitly exposes a degraded state;
- expose correlation IDs and bounded typed errors without leaking secrets or personal data;
- remain deterministic and testable without network credentials;
- preserve PR #2 as Draft and never merge `main`.

## 2. Priority order

1. Security and authority boundaries.
2. Durable state and privacy.
3. Honest provider/dependency degradation.
4. SSRF, resource, parser, and concurrency hardening.
5. API contract consistency and observability.
6. Performance, accessibility, and UI resilience.
7. Cleanup and developer ergonomics.

## 3. Explicit state matrices

### 3.1 Browser authentication

| State | Trigger | Server/system action | Client behavior | Error/boundary |
| --- | --- | --- | --- | --- |
| SIGNED_OUT | No valid durable session | Return 401 for protected routes | Render signed-out state | Never read bearer material from Web Storage |
| EXCHANGE_PENDING | Verified upstream credential exists | Verify once, create opaque durable session, set HttpOnly cookie | Use credential only for one exchange/sync call | Bound body/rate/origin; no raw token in response or logs |
| AUTHENTICATED | Valid opaque session cookie | Resolve principal from server session | Use same-origin credentialed requests | Server derives user, role, owner, and scope |
| REVOKED_OR_EXPIRED | Session invalid/revoked/idle/absolute expiry | Return 401 and no private data | Clear local profile cache and show re-authentication | Never fall back to client identity |
| STORAGE_UNAVAILABLE | Browser storage throws | Keep non-sensitive UI preferences in memory or disable them | Do not downgrade auth security | No token persistence fallback |

### 3.2 Academic source fetching

| State | Trigger | Server/system action | Client behavior | Error/boundary |
| --- | --- | --- | --- | --- |
| SOURCE_INVALID | Missing/unknown source metadata | Reject before network | Show unavailable source | No request |
| AUTHORITY_INVALID | Initial or redirected host is not registered for source tier | Reject before request or next hop | Mark source unverified | No open-web bypass |
| SSRF_TARGET | Private, loopback, link-local, metadata, encoded, or DNS-rebound destination | Reject | Preserve prior evidence; do not verify | No redirect follow |
| FETCHING | Valid registered source | Bounded GET with timeout, size, type, and redirect caps | Show loading | Abort on timeout/oversize |
| FETCHED | Valid response and authority | Normalize body and metadata | Allow downstream parser | Preserve ETag/Last-Modified only as metadata |
| STALE_OR_CONFLICTED | Old, missing-date, or contradictory source | Mark stale/mixed/partial | Require review | Never promote to official truth |

### 3.3 IDs, correlation, and audit

| State | Trigger | System action | Output |
| --- | --- | --- | --- |
| SERVER_RUNTIME | Node/Edge request or durable write | Use cryptographic randomness or platform UUID | Opaque bounded ID |
| BROWSER_RUNTIME | Client-only correlation | Use `crypto.randomUUID()` when available | Opaque bounded ID |
| RNG_UNAVAILABLE | Secure generator unavailable | Use a bounded non-authoritative process-local fallback only for diagnostics | Never use as credential or authorization key |
| INVALID_INCOMING_ID | Header/query ID fails grammar/length | Generate a new ID | Do not echo attacker-controlled value |
| AUDIT_EVENT | Security-sensitive operation | Log event type, actor class, correlation, result, and redacted metadata | Never log token/password/OTP/raw PII |

### 3.4 API and persistence

| State | Trigger | System action | Client behavior |
| --- | --- | --- | --- |
| VALID_REQUEST | Schema, auth, purpose, and ownership pass | Execute bounded operation | Render typed success |
| INVALID_REQUEST | Shape/size/type failure | 400 safe envelope | Correct input only |
| UNAUTHENTICATED | Missing/invalid session | 401 | Re-authenticate |
| FORBIDDEN | Permission/owner/purpose failure | 403 or anti-enumeration 404 | No private details |
| RATE_LIMITED | Bounded limiter rejects | 429 with safe retry metadata | Back off |
| DATABASE_UNAVAILABLE | Durable store unavailable | 503 typed dependency failure | Do not claim persistence |
| DEMO_FIXTURE | Explicit demo route/state | Return fixture with visible demo provenance | Never write to live stores |
| PARTIAL | One non-authoritative dependency fails | Return partial result with dependency state | Never synthesize missing fields |

### 3.5 UI and client state

| State | Trigger | System action | UI behavior |
| --- | --- | --- | --- |
| IDLE | Route loaded | No network side effect until intent | Accessible input and clear scope |
| SUBMITTING | User action | Abort prior stale request; create correlation | Progress with bounded stages |
| SUCCESS | Valid server contract | Render only server-authoritative fields | Show source/status/freshness |
| UNKNOWN | Missing/failed/insufficient evidence | Preserve uncertainty | Never show SAFE/VERIFIED |
| ERROR | 4xx/5xx/invalid JSON/network loss | Map stable error | Retry only when safe |
| STALE_RESPONSE | Older request resolves late | Discard by request sequence | Keep newest result |
| REDUCED_MOTION | OS preference | Disable decorative motion | Preserve meaning and controls |

## 4. Required implementation outcomes

- Replace client bearer persistence with opaque HttpOnly session use for same-origin server contracts. Any remaining browser cache must contain no access/refresh/session secret.
- Enforce academic source authority on the initial URL before any transport call, not only on redirects.
- Replace predictable `Math.random()` identifiers in security/correlation/persistence paths with a shared cryptographic ID utility.
- Add regression tests for each boundary state and for malicious/malformed input.
- Add an `npm test` entry that points to the repository's deterministic discovered test gate, so the canonical test command cannot fail only because the script is absent.
- Add runtime/version metadata to the package manifest and document the supported Node/npm contract.
- Preserve explicit external blockers for live PostgreSQL/RLS, approved provider credentials, staging, and host-specific browser runtimes.
- Keep lint/build/typecheck and browser evidence honest; warnings are debt, not passes hidden by configuration.

## 5. Forbidden shortcuts

- No fake provider, fake confidence, fake VERIFIED/SAFE, hard-coded canary URL, synthetic production evidence, silent memory persistence, client-authoritative role/owner, or “success” envelope after a durable write failure.
- No broad lint suppression, test deletion, snapshot weakening, destructive reset, or merge to `main`.
- No claim of production readiness, national certification, or live integration without fresh environment evidence.

## 6. Exit gate

The upgrade is complete only when:

1. Focused boundary tests pass with named raw counts.
2. Existing repository regression passes without removing coverage.
3. Build, TypeScript, lint, dependency, API-authorization, and bundle gates pass.
4. Browser/a11y checks remain green or an exact host blocker is recorded.
5. The worktree is clean, implementation is committed and pushed to `develop`, and PR #2 remains Draft.
6. A final report identifies exactly what is improved, what is proven, and what remains externally blocked.
