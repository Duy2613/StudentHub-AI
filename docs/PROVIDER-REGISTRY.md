# StudentHub AI — Provider Registry

Status: canonical Google multi-model routing policy · 2026-09-17

This registry records public-safe provider/model metadata. Runtime route
selection is owned by `frontend/src/lib/ai-gateway/config/AIGatewayConfig.js`;
the registry never contains secret values.

## Active production chain

| Order | Provider | Model | Role | Structured L4 DTO | Status |
|---:|---|---|---|---|---|
| 1 | Google Gemini | `gemini-3.8-flash` | primary advisory reasoning/multimodal | verified contract in code; project availability runtime-checked | ACTIVE |
| 2 | Google Gemini | `gemini-3.7-flash` | model-specific fallback | same fixed contract | ACTIVE |
| 3 | Google Gemini | `gemini-3.6-flash` | model-specific fallback | same fixed contract | ACTIVE |
| 4 | Google Gemini | `gemini-2.5-flash` | final approved fallback | same fixed contract | ACTIVE |

All four candidates use the existing canonical `GEMINI_API_KEY`. A 429 on one
model does not imply a 429 on the others because quota is evaluated per model;
the router may advance without rotating keys. A public model catalog does not
prove current project access.

## Runtime controls

- Model identifiers are allow-listed and checked at provider initialization.
- L4 has a 10,000 ms total provider budget and 2,200 ms per-model timeout.
- One model call is made per routing sequence; the first valid DTO ends it.
- 429, 503, timeout/network timeout, and 404 model-unavailable failures may
  advance the chain. 400, 401, and 403 stop immediately.
- `ModelHealthStore` maintains bounded, expiring provider/model cooldown state,
  honors `Retry-After`, and does not permanently disable models.
- Every attempt records model, sequence number, start time, duration, HTTP
  status, provider error code, and bounded result status. API keys and raw
  provider bodies are never recorded.

## Gemma shadow candidates

| Provider | Model | Status | Activation rule |
|---|---|---|---|
| Google Gemma | `gemma-4-31b-it` | SHADOW | exact Layer 4 compatibility gate must pass |
| Google Gemma | `gemma-4-26b-a4b-it` | SHADOW | exact Layer 4 compatibility gate must pass |

The gate must evidence endpoint compatibility, structured output, Vietnamese
reasoning, evidence grounding, latency, project quota, safety behavior, and
parser compatibility. Until all required checks pass, `GEMMA_COMPATIBLE=NO` and
neither Gemma model is in the production route.

## Compatibility metadata — not active

| Provider | Status | Rule |
|---|---|---|
| OpenAI-compatible adapter | `DISABLED_INTENTIONALLY` | retained for old imports; never selected by active routes |
| `FraudRiskEngine_v1` | local advisory | may provide signals, never final truth/security authority |

## Layer boundary

The deterministic Trust Policy owns security classification, truth status,
enforcement, confidence, and the L5 final decision. Gemini Layer 4 returns the
validated existing advisory DTO only. It cannot create evidence, fabricate
citations/confidence, or override policy. If every candidate fails, L4 exposes
`UNAVAILABLE`/`PARTIAL` plus the exact trace and the V5 pipeline still runs L5.

