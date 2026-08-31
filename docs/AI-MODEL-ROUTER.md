# AI Model Router — StudentHubAI AI Gateway

> Vault cross-reference: this document is the authoritative spec for
> `frontend/src/lib/ai-gateway/*`. It supersedes the historical single-vendor
> `GEMINI_API_KEY`-only pattern that previously existed (and never actually
> ran, since no `GEMINI_API_KEY` was ever configured — see
> `docs/PROVIDER-REGISTRY.md` §3 for the audit).

## 1. Why this exists

The Master Prompt (Section R) forbids hard-coding the application to one AI
vendor/model:

> "Do not hard-code the application to one AI vendor/model... Create ONE
> server-side AI Gateway. No random direct LLM calls from UI components."

Before this change, `Layer2SemanticService` and `Layer4TrustService` each
called a single hard-coded vendor (`GeminiSemanticModelProvider`,
`GeminiTrustReasoningProvider`) that required `GEMINI_API_KEY`. That variable
was never set anywhere in the repo or CI, so in practice **100% of requests
silently used the deterministic fallback** — the "AI" path was dead code.
`GeminiTrustReasoningProvider.reason()` did not even perform a network call;
it built a prompt string and immediately returned the deterministic result.

This AI Gateway replaces that with a capability-based **ModelRouter** that can
rotate across configured providers with automatic fallback, timeout handling,
and structured-output validation. Provider adapters are contract-tested, but
live provider success is not claimed when the required secrets are absent;
every deterministic engine remains the default and authoritative path (see §5).

## 2. Architecture

```
Layer2SemanticService / Layer4TrustService / /api/chat (AI Mentor)
                │  (opt-in: options.useAIGateway)
                ▼
     AIGatewayService  (frontend/src/lib/ai-gateway/AIGatewayService.js)
        - generateText({ capability, systemPrompt, userPrompt })
        - generateStructured({ capability, ..., validate })
        - describeRoute(capability)              [diagnostics only]
                │
                ▼
        ModelRouter (frontend/src/lib/ai-gateway/ModelRouter.js)
        - walks AI_GATEWAY_CONFIG.CAPABILITY_ROUTES[capability]
        - skips any (provider, model) whose secrets are not configured
        - retries transient errors once per candidate (429/5xx/timeout)
        - for structured requests: parses and validates each candidate before
          accepting it; deterministic parse/schema failures advance to the
          next candidate without retrying the same model
        - records every attempt for provenance/audit
                │
                ▼
   IModelProvider adapters (frontend/src/lib/ai-gateway/providers/*)
        - OpenAICompatibleProvider  (GenSpark LLM proxy, chat.completions)
        - GeminiProvider            (Google Generative Language API)
        - (future adapters implement the same interface)
```

Nothing outside `frontend/src/lib/ai-gateway/` performs a `fetch()` call to
an AI vendor. Every Layer/Engine that wants AI enrichment goes through
`AIGatewayService`.

## 3. Capability taxonomy

Domain code never requests a model by name — it requests a **capability**
(`AI_CAPABILITY` in `types.js`):

| Capability            | Used by                                   | Purpose                                             |
|------------------------|--------------------------------------------|------------------------------------------------------|
| `FAST_CLASSIFICATION`  | quick triage (future use)                 | cheap/low-latency intent/claim heuristics            |
| `CLAIM_EXTRACTION`     | `AIGatewayModelProvider` (Layer 2)         | structured claim/entity/context-signal extraction    |
| `DEEP_REASONING`       | `AIGatewayReasoningProvider` (Layer 4), AI Mentor chat | narrative synthesis, multi-step explanation |
| `MULTIMODAL`           | reserved for image/OCR-aware reasoning     | requires a configured multimodal provider (Gemini)   |
| `DOCUMENT`             | reserved for long-document/PDF analysis    | high-context models                                  |
| `EMBEDDING`            | reserved (no provider configured yet)      | vector embedding generation                          |
| `RERANKING`            | reserved                                   | relevance re-ranking of retrieved evidence           |
| `SUMMARIZATION`        | reserved                                   | grounded summarization with citation preservation    |

## 4. Model catalog & fallback chains

See `frontend/src/lib/ai-gateway/config/AIGatewayConfig.js` for the
authoritative table. Summary (as researched against `get_external_api_docs`
at implementation time — 2026-08-29):

| Catalog entry | Provider | Model | Tier | Requires |
|---|---|---|---|---|
| `GPT_5_NANO`  | `openai_compatible` | `gpt-5-nano`  | FAST_CHEAP | `OPENAI_API_KEY` + `OPENAI_BASE_URL` |
| `GPT_5_MINI`  | `openai_compatible` | `gpt-5-mini`  | BALANCED   | same |
| `GPT_5_1`     | `openai_compatible` | `gpt-5.1`     | DEEP       | same |
| `GPT_5_2`     | `openai_compatible` | `gpt-5.2`     | DEEP       | same |
| `GEMINI_FLASH`| `gemini`             | `gemini-2.5-flash` | MULTIMODAL | `GEMINI_API_KEY` |

Fallback chains (`CAPABILITY_ROUTES`):

- `FAST_CLASSIFICATION` → `GPT_5_NANO` → `GEMINI_FLASH` → `GPT_5_MINI`
- `CLAIM_EXTRACTION` → `GPT_5_MINI` → `GEMINI_FLASH` → `GPT_5_1`
- `DEEP_REASONING` → `GPT_5_1` → `GPT_5_2` → `GPT_5_MINI`
- `MULTIMODAL` → `GEMINI_FLASH` → `GPT_5_MINI`
- `DOCUMENT` → `GPT_5_1` → `GPT_5_2`
- `EMBEDDING` → *(none configured — returns `NOT_CONFIGURED`)*
- `RERANKING` → `GPT_5_MINI`
- `SUMMARIZATION` → `GPT_5_MINI` → `GPT_5_1`

Any entry whose `envKey` is unset at request time is **skipped** by the
router (never attempted, never counted as a failure) — this is how Gemini
silently drops out of every chain when `GEMINI_API_KEY` is not configured,
without needing a code change.

## 5. Deterministic engines remain authoritative

Per Master Prompt Section J1 / G3 ("AI may explain. AI must not determine
deterministic rule satisfaction" / "absence of detection ≠ proof of safety"):

- **Layer 2** (`Layer2SemanticService.verify`): defaults to
  `DeterministicSemanticProvider`. Passing `options.useAIGateway: true`
  swaps in `AIGatewayModelProvider`, which itself falls back to the
  deterministic engine on any Gateway failure or schema-invalid output.
- **Layer 4** (`Layer4TrustService.evaluate`): defaults to
  `DeterministicTrustPolicyProvider`. Passing `options.useAIGateway: true`
  swaps in `AIGatewayReasoningProvider`, which **always** runs the
  deterministic policy first to get the authoritative
  classification/risk/action, and only asks the AI Gateway to rewrite the
  Vietnamese `userExplanation.why` narrative. Hard-blocked
  (`hardRuleTriggered`) and abstained (`INSUFFICIENT_EVIDENCE`) verdicts are
  never narratively "softened" by AI.
- **AI Mentor** (`/api/chat`): previously returned hard-coded canned replies
  regardless of user input (a "no demo fiction" violation). It now always
  calls the AI Gateway and returns an explicit
  `providerStatus: "LIVE_PROVIDER_NOT_CONFIGURED"` degraded response instead
  of fabricating a confident answer when no provider is available.

Because both integrations are strictly opt-in via `options.useAIGateway`, the
deterministic path remains stable. The current closure run confirms
`npm run test:all-discovered`: 250/250 discovered test files pass, with live
provider proof kept separate and explicitly blocked when secrets are absent.

## 6. Resilience & observability

Every `AIGatewayService` call returns a normalized result (`types.js
createGatewayResult`) including:

- `ok`, `provider`, `model` actually used (or `null` if none succeeded)
- `attempts[]` — one record per (provider, model) tried, with
  `errorType` (`NOT_CONFIGURED | TIMEOUT | HTTP_ERROR | NETWORK_ERROR |
  INVALID_JSON | SCHEMA_VALIDATION_FAILED | EMPTY_RESPONSE`), latency, and a
  safe error message. For structured generation, a provider response is only
  successful after JSON parsing and the caller validator both pass. A parse
  failure records `INVALID_JSON`; a parsed response rejected by the validator
  records `SCHEMA_VALIDATION_FAILED` and moves to the next candidate without a
  deterministic retry.
- `totalLatencyMs`, `requestId`, `timestamp`, `schemaVersion`

This provenance is attached by callers (`gatewayAttempts`,
`aiNarrativeStatus`, etc.) so audit trails always show whether a result was
AI-enriched or purely deterministic, and which vendor/model served it.

Retry policy: only `429/500/502/503/504` and client-side `TIMEOUT` are
retried, and only once per candidate, before moving to the next candidate in
the fallback chain (`AI_GATEWAY_CONFIG.RETRY`).

## 7. How to add a new provider

1. Research the current official API docs (do not guess model names).
2. Add an entry to `docs/PROVIDER-REGISTRY.md` (purpose, docs link, quota,
   data-handling, secrets required, fallback).
3. Implement `IModelProvider` in `frontend/src/lib/ai-gateway/providers/`.
4. Register the model(s) in `AI_GATEWAY_CONFIG.MODEL_CATALOG` and add it to
   the relevant `CAPABILITY_ROUTES` fallback chains.
5. Add `.env.local.example` entries (server-only, no `NEXT_PUBLIC_` prefix).
6. Add a mocked unit test in `frontend/tests/ai-gateway/` (no live network
   calls in CI — see `docs/AI-MODEL-ROUTER.md` §8).

No Layer/Engine file should ever need to change to add a new vendor.

## 8. Testing policy

`frontend/tests/ai-gateway/ai_gateway_router.test.mjs` exercises the
`ModelRouter` and `AIGatewayService` with **injected fake providers**
(`IModelProvider` test doubles) — it never makes a real network call, so it
is safe and fast to run in CI regardless of whether real API keys are
configured. Coverage includes:

- capability with zero configured providers → `NOT_CONFIGURED`
- first candidate configured but fails → falls through to next candidate
- transient error retried once then fallback → attempt count matches policy
- malformed JSON → `INVALID_JSON`, then fallback to the next candidate
- schema validation failure → `SCHEMA_VALIDATION_FAILED`, then fallback to the
  next candidate
- all structured candidates invalid → fail closed without repeating a
  deterministic candidate
- Gemini trusted system instruction and untrusted user/evidence content are
  serialized into separate request fields
- successful structured output → `json` populated, `ok: true`

Live end-to-end verification against a real provider is **BLOCKED_BY_PROVIDER**
in this closure environment because fresh approved secrets, terms, quotas, and
data-handling approval are not configured. The automated suite uses injected
provider doubles and does not spend live credits.
