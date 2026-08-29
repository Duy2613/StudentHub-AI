# Provider Registry — AI Gateway

Tracks every external AI provider adapter wired into
`frontend/src/lib/ai-gateway/`. Update this file whenever a provider is
added, its terms/pricing change, or it is retired. Cross-referenced by
`docs/AI-MODEL-ROUTER.md`.

---

## 1. GenSpark OpenAI-Compatible LLM Proxy

| Field | Value |
|---|---|
| Adapter | `frontend/src/lib/ai-gateway/providers/OpenAICompatibleProvider.js` |
| Official docs | Retrieved at implementation time via the platform's `get_external_api_docs("openai")` tool — base URL `https://www.genspark.ai/api/llm_proxy/v1`, OpenAI Chat Completions-compatible schema. |
| Purpose | Primary text/JSON reasoning provider for `FAST_CLASSIFICATION`, `CLAIM_EXTRACTION`, `DEEP_REASONING`, `DOCUMENT`, `SUMMARIZATION`, `RERANKING`. |
| Models used | `gpt-5-nano` (FAST_CHEAP), `gpt-5-mini` (BALANCED), `gpt-5.1` / `gpt-5.2` (DEEP). Only these platform-allowed model identifiers are used — no other model name is permitted per the platform's usage terms. |
| Secrets required | `OPENAI_API_KEY`, `OPENAI_BASE_URL` (server-only, injected by the platform when the project owner configures an LLM API key in the GenSpark project's API Keys panel). |
| Pricing / quota | Managed by the GenSpark platform's LLM proxy billing; not billed directly to a third-party vendor account. Cost class recorded per-model in `AI_GATEWAY_CONFIG.MODEL_CATALOG[...].costClass` (`LOW`/`MEDIUM`/`HIGH`). |
| Data handling | Requests pass through the GenSpark LLM proxy. Only the minimal system/user prompt text built by the calling Layer is sent — no raw user PII beyond what the Layer already includes in its prompt (claim text, URL, OCR text). No conversation history is persisted by the gateway itself. |
| Rate limits | Not independently documented by the proxy; the Gateway's own `AI_GATEWAY_CONFIG.RETRY` treats `429` as retryable once per candidate before falling through to the next model in the chain. |
| Fallback | On failure, `ModelRouter` falls through to the next entry in the capability's chain (see `docs/AI-MODEL-ROUTER.md` §4); if the whole chain is exhausted, callers (`AIGatewayModelProvider`, `AIGatewayReasoningProvider`, `/api/chat`) fall back to the deterministic engine or an explicit `LIVE_PROVIDER_NOT_CONFIGURED` response. |
| Verified working | Yes — manually verified end-to-end during implementation (2026-08-29): `generateText` and `generateStructured` both returned valid responses; observed the router correctly skip an unconfigured Gemini candidate and rotate `gpt-5-mini` → `gpt-5.1` after two simulated timeouts. |
| Status | **ACTIVE** |

## 2. Google Gemini (Generative Language API)

| Field | Value |
|---|---|
| Adapter | `frontend/src/lib/ai-gateway/providers/GeminiProvider.js` |
| Official docs | `https://ai.google.dev/gemini-api/docs` (direct REST `generateContent` endpoint). |
| Purpose | Historical multimodal provider referenced in the `atudent.pdf` Trust Engine seed; kept as an optional multimodal candidate for `MULTIMODAL` capability and as a secondary candidate in `FAST_CLASSIFICATION`/`CLAIM_EXTRACTION` chains. |
| Models used | `gemini-2.5-flash` |
| Secrets required | `GEMINI_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`) — server-only. |
| Pricing / quota | Not provisioned in this environment; requires the project owner to supply their own Google AI Studio API key if this provider should participate in routing. |
| Data handling | Prompt text sent directly to Google's API over HTTPS; no additional persistence by this adapter. |
| Rate limits | Governed by the caller's Google AI Studio quota tier; not independently tracked by this repo. |
| Fallback | Same `ModelRouter` fallback chain mechanism as above. |
| Verified working | **Not currently configured in this environment** — `GEMINI_API_KEY` is unset, so `GeminiProvider.isConfigured()` returns `false` and the router transparently skips it in every chain (confirmed via `AIGatewayService.describeRoute(...)` — see `docs/AI-MODEL-ROUTER.md` §2). The adapter code itself reuses the same request logic validated for `OpenAICompatibleProvider` (timeout via `AbortController`, HTTP-status/empty-response classification) and was retained from the pre-existing `GeminiSemanticModelProvider`/`GeminiTrustReasoningProvider` implementations, which used an equivalent REST call shape. |
| Status | **CONFIGURED_BUT_INACTIVE** (participates automatically the moment `GEMINI_API_KEY` is set — no code change required) |

## 3. Legacy single-vendor providers (retained, not part of the router)

`GeminiSemanticModelProvider` (Layer 2) and `GeminiTrustReasoningProvider`
(Layer 4) are the original single-vendor adapters from the historical
`atudent.pdf` Trust Engine seed. They are **retained unmodified** for
backward compatibility (`options.useGemini`) but are **not** part of the
`ModelRouter` fallback chains and are not the recommended integration path
going forward — use `options.useAIGateway` instead, which routes through
the multi-vendor `AIGatewayModelProvider` / `AIGatewayReasoningProvider`.

- `GeminiTrustReasoningProvider.reason()` in particular never performed a
  real network call even when `GEMINI_API_KEY` was set (it built a prompt
  string and immediately delegated to the deterministic fallback). This is
  documented here rather than silently fixed in place, because Master
  Prompt Section A instructs preserving historical behavior unless the
  current spec requires otherwise — the new `AIGatewayReasoningProvider` is
  the corrected, functional replacement.

## 4. Providers considered but not integrated

| Provider | Reason not integrated |
|---|---|
| Dedicated embedding provider | No `EMBEDDING` capability route configured yet — no current Layer/Engine in this codebase performs vector search that would need it (retrieval in Layer 3 uses `KnowledgeBaseRetriever`/`WebSearchRetriever`, not embeddings). Add when a genuine RAG/embedding use case is implemented, per Master Prompt Section S ("use retrieval only where justified"). |
| Anthropic Claude | Not currently provisioned with credentials in this environment; can be added as a new `IModelProvider` adapter following the pattern in §7 of `docs/AI-MODEL-ROUTER.md` if the project owner requests it and supplies an API key. |
