# StudentHub AI — Provider Registry

Status: canonical production policy as of 2026-09-16

This file records the provider boundary implemented in
`frontend/src/lib/ai-gateway/`. It never contains secret values.

## Active production provider

| Provider | Model | Role | Transport | Status |
|---|---|---|---|---|
| Gemini | `gemini-3.8-flash` | structured advisory reasoning, claims, multimodal/document analysis | Interactions API first | ACTIVE |

Environment precedence is exact:

1. `GEMINI_API_KEY` — canonical secret;
2. `GEMINI_KEY_1` — legacy fallback only when the canonical key is absent.

`GEMINI_MODEL` is diagnostic metadata only; the catalog model is authoritative.
The adapter uses `store: false`, bounded timeouts/output, safe response-size
limits, and never logs the key.

## Compatibility metadata — not active

| Provider | Model | Status | Rule |
|---|---|---|---|
| OpenAI-compatible adapter | historical catalog models | `DISABLED_INTENTIONALLY` | retained for imports only; active routing never selects it |
| Gemini Lite | `gemini-3.5-flash-lite` | compatibility fallback metadata | not in the active production route for this release |
| Local specialist | `FraudRiskEngine_v1` | advisory local engine | may provide signals, never the final truth/security decision |

OpenAI availability, quota, 401/403 responses, and credit exhaustion are not
release blockers because the OpenAI runtime is deliberately disabled. No
production code in this release attempts an OpenAI request.

## Trust boundary

The deterministic Trust Policy owns security classification, truth status,
enforcement, confidence, and the L5 final decision. Gemini Layer 4 returns
only the validated DTO below:

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

The schema requires real HTTP(S) URLs for citations. Invalid output is retried
once and then reported as `AI verification unavailable`; deterministic Trust
still completes. The public UI shows `AI VERIFICATION — GEMINI`, actual
provider/model/status, evidence references, and uncertainty. It does not show
AI-agreement percentages.

## Permitted advisory uses

Gemini may assist with community classification, summaries, duplicate or
evidence suggestions, expert evidence-packet summaries, assignment
suggestions, and review summaries. It may not set reputation, ban a user,
decide truth, perform irreversible moderation, qualify an Expert, assign
authority, approve an assessment, or resolve an appeal alone.

## Multimodal support

The Gemini adapter accepts image, screenshot, QR, PDF, and document fixture
parts through the provider-neutral gateway interface. The canonical
Interactions request is attempted first; `generateContent` is used only for an
explicit 404/405/501 compatibility response. Real multimodal evidence belongs
in the smoke report, not in source control as a secret.

## Historical note

Older provider records, direct-provider names, and the legacy
`MultiModelVerifier` class may remain in the repository for compatibility and
audit traceability. They are not the canonical production route. The current
entrypoint is `TrustPipelineOrchestrator` through `TrustOrchestrator`, with
Gemini explicitly enabled for the production Trust API.
