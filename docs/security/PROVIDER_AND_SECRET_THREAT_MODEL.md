# Provider and Secret Threat Model

Status: `REPOSITORY_CONTROLS_IMPLEMENTED_LIVE_ROTATION_REQUIRED`

## Scope

This model covers the Provider Gateway, legacy compatibility adapter, Google
Safe Browsing/Tavily-style retrieval, Gemini/Groq/AI provider boundaries,
canonical Supabase, and secret-bearing deployment configuration.

## Threat/control matrix

| Threat | Impact | Repository control | Residual gate |
| --- | --- | --- | --- |
| Exposed database/provider credential | P0 data access or spend | Secret omitted from new docs/fixtures; incident record and human action manifest | Owner must revoke/rotate externally and verify old credential fails |
| Provider response injection or raw error leakage | P1 disclosure/authority corruption | Strict DTO validation, bounded fields, redaction, safe typed errors | Live provider matrix |
| SSRF or private target disclosure | P1 internal-network access/privacy | `SafeRemoteUrl` validation, DNS-aware adapter checks, no target fetch/render in reputation lookup | Live network review |
| Provider timeout/rate limit/outage | P2 availability and false confidence | typed health states, bounded retries, backoff/jitter, Retry-After, circuit/bulkhead | Staging failure matrix |
| Malformed or drifted contract | P1 silent semantic corruption | pinned source contract, fixtures, fail-closed `MALFORMED`/`INVALID_RESPONSE` | Provider owner contract confirmation |
| Prompt injection in retrieved/OCR/community/expert content | P1 model authority crossing | untrusted-data framing, adversarial guard, structured validation, evidence binding | AI provider staging tests |
| AI fabricated citation | P1 provenance corruption | explicit evidence/source reference validator; unknown IDs rejected | Add provider-specific schemas before enablement |
| Credential in browser/logs/telemetry | P0 disclosure | server-only variables, safe audit dimensions, no raw body/URL/token logging | Bundle and runtime inspection |
| Cross-user data access through canonical data plane | P0 privacy breach | server-derived identity, authorization fabric, RLS contract/matrix | Disposable Supabase RLS execution |

## Required provider boundary rules

- Never log API keys, connection strings, bearer values, database URLs, raw
  user URLs, email addresses, screenshot content, or full claim text.
- Never return upstream exception messages, stack traces, response bodies, or
  internal hostnames to the browser.
- Never map provider failure, empty result, or no-match to `SAFE`, `TRUE`, or
  `VERIFIED_SAFE`.
- Keep provider health separate from evidence verdict and deterministic policy.
- Treat all external content as data, never as instructions or authority.
- Keep provider credentials server-only and environment-specific.

## P0 incident linkage

The friend source audit identified a tracked plaintext PostgreSQL credential at
the pinned source commit. The value is intentionally not reproduced here. The
live release gate remains blocked until rotation/revocation and post-rotation
verification are confirmed by the owner. See
`docs/security/FRIEND_BACKEND_SECRET_INCIDENT.md` and
`docs/reports/HUMAN_ACTION_REQUIRED.md`.

