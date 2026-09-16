# StudentHub AI — Gemini-only AI Gateway

Status: production policy `GEMINI_ONLY` · revision 2026-09-16

`frontend/src/lib/ai-gateway/config/AIGatewayConfig.js` is the single source
of truth for active capability routing. Gemini is the only active external AI
provider in this release, using `gemini-3.8-flash` and the Interactions API as
the canonical transport.

## Runtime policy

| Item | Contract |
|---|---|
| Active provider | Gemini |
| Active model | `gemini-3.8-flash` |
| Canonical secret | `GEMINI_API_KEY` |
| Legacy fallback | `GEMINI_KEY_1`, used only when the canonical key is absent |
| OpenAI runtime | `DISABLED_INTENTIONALLY` |
| OpenAI compatibility code | Retained for old imports; never selected by active routes |
| Production UX | `AI VERIFICATION — GEMINI` |

The key value is read only server-side and never appears in telemetry, DTOs,
browser bundles, or reports. The router does not call OpenAI, even if an old
OpenAI environment variable is present.

## Architecture

```text
Trust / Community / Expert advisory caller
                 │
                 ▼
        AIGatewayService
                 │
                 ▼
          ModelRouter
          │ active route table
          ▼
       GeminiProvider
       Interactions API
```

All provider traffic is isolated in `frontend/src/lib/ai-gateway/providers/`.
The UI and domain engines do not construct vendor requests directly. A
compatibility OpenAI adapter remains available only to prevent import breakage;
its runtime is fail-closed unless a future release explicitly re-enables it.

## Active capability routes

| Capability | Active entry | Model | Use |
|---|---|---|---|
| `FAST_CLASSIFICATION` | `GEMINI_FLASH` | `gemini-3.8-flash` | bounded triage |
| `CLAIM_EXTRACTION` | `GEMINI_FLASH` | `gemini-3.8-flash` | claims/entities/context |
| `DEEP_REASONING` | `GEMINI_FLASH` | `gemini-3.8-flash` | advisory explanation and Trust L4 |
| `MULTIMODAL` | `GEMINI_FLASH` | `gemini-3.8-flash` | image, screenshot, QR |
| `DOCUMENT` | `GEMINI_FLASH` | `gemini-3.8-flash` | PDF/document input |
| `RERANKING` | `GEMINI_FLASH` | `gemini-3.8-flash` | advisory evidence ordering |
| `SUMMARIZATION` | `GEMINI_FLASH` | `gemini-3.8-flash` | grounded summaries |
| `EMBEDDING` | none | — | explicit `NOT_CONFIGURED` |

The catalog may contain historical compatibility metadata, but
`CAPABILITY_ROUTES` is intentionally Gemini-only. The route table does not
represent provider agreement or a consensus percentage.

## Structured output contract

Trust Layer 4 requests and validates this DTO:

```json
{
  "verdictSignal": "SUPPORTS|CONTRADICTS|MIXED|UNCERTAIN|NO_SIGNAL",
  "supportReasons": [],
  "contradictionReasons": [],
  "missingEvidence": [],
  "uncertainty": "string",
  "citationsUsed": [{ "id": "evidence-id", "url": "https://…" }],
  "provider": "gemini",
  "model": "gemini-3.8-flash"
}
```

`GeminiTrustVerificationDTO.js` requires all fields, bounds all lists/text,
and accepts only real HTTP(S) citation URLs. Invalid JSON or schema output is
retried once for the same Gemini candidate, then the call becomes
`AI verification unavailable`; the deterministic Trust Policy still completes.

## Trust L1–L5 boundary

- L1 extracts claims and local safety signals.
- L2 discovers candidate evidence and creates verification tasks.
- L3 performs evidence forensics and requires real source URLs.
- L4 runs deterministic policy first, then optionally asks Gemini for the
  structured advisory DTO. Gemini cannot set truth, security, enforcement, or
  confidence.
- L5 makes the deterministic final decision and applies assurance gates.

The UI exposes actual provider/model/status, evidence references, and
uncertainty. Fake AI-agreement percentages are not part of the contract.

## Community and Expert boundaries

Gemini is advisory for community classification, summaries, duplicate
suggestions, evidence suggestions, expert evidence-packet summaries,
assignment suggestions, and review summaries. Gemini never sets reputation,
bans a user, decides truth, moderates irreversibly, qualifies an Expert,
assigns authority, approves an assessment, or resolves an appeal alone.

## Multimodal boundary

`GeminiProvider` accepts provider-neutral `inputParts` and sends image,
screenshot, QR, PDF, and document parts through the Gemini adapter. The
canonical transport is Interactions; `generateContent` is an explicit
compatibility fallback only for 404/405/501 responses. The multimodal smoke
script records the fixture type, model, transport, latency, status, and parsed
result without recording secrets.

## Failure and observability contract

Every gateway result includes `ok`, provider/model when successful,
`attempts[]`, safe error type, `requestId`, `totalLatencyMs`, and safe provider
metadata (`transport`, `thinkingLevel`). Timeout, 429, 5xx, invalid JSON, and
schema-invalid responses are bounded. No provider error body or secret is
persisted.

When Gemini is unavailable, the public status is `AI verification unavailable`
and the deterministic result remains visible. A failed Gemini call is never
converted into fake Gemini success.

## Verification commands

Deterministic CI contracts use injected providers and never spend credits:

```text
cd frontend
node --test tests/ai-gateway/ai_gateway_router.test.mjs
node --test tests/gateway/provider_failure_cost_latency.test.mjs
```

The real provider gate is separate:

```text
node scripts/gemini-only-provider-smoke.mjs
```

The provider smoke includes text, image, screenshot, QR, and PDF/document
fixtures. It loads server-only environment variables, makes no OpenAI call,
makes no secret-containing output, and must be run only when the owner has
authorized spending the configured Gemini quota.

## Adding another provider later

An independent provider may be added only in a future release after its
official API, data handling, quota, and secret boundary are documented. It
must receive a new adapter, mocked contract tests, and an explicit routing
change. Until then, product wording remains `AI VERIFICATION — GEMINI`, not
`MULTI-AI`.
