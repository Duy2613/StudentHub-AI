# StudentHub AI — Gemini multi-model AI Gateway

Status: production routing policy `GEMINI_ONLY` · revision 2026-09-17

`frontend/src/lib/ai-gateway/config/AIGatewayConfig.js` is the single source
of truth for active capability routing. Google Gemini is the only active
external provider; model failover is ordered, per-model, and uses the existing
canonical `GEMINI_API_KEY`.

## Runtime policy

| Item | Contract |
|---|---|
| Active provider | Google Gemini |
| Active chain | `gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.6-flash` → `gemini-2.5-flash` |
| Canonical secret | `GEMINI_API_KEY` only |
| Key rotation | Forbidden; quota failover is model-specific |
| OpenAI runtime | `DISABLED_INTENTIONALLY` |
| Gemma | Shadow-only until the exact compatibility gate passes |
| L4 budget | 10,000 ms total; 2,200 ms per model attempt |

The key is read only server-side. It never appears in telemetry, DTOs,
browser bundles, or reports. A public model catalog or Google-wide model list
does not prove that the current project has quota or access to that model.

## Architecture

```text
TrustPipelineOrchestrator
          │ deterministic L1–L3 data
          ▼
Layer4TrustService
  deterministic policy first
          │ advisory request only
          ▼
   AIGatewayService
          ▼
     ModelRouter ── ordered chain + health/cooldown + trace
          ▼
    GeminiProvider ── Interactions API, explicit 405/501 transport fallback
```

The UI and domain engines do not construct vendor requests directly. L4 AI
output is advisory and cannot set security, truth, enforcement, confidence, or
the L5 decision.

## Active capability routes

Every externally routed capability uses the same ordered Gemini chain:

| Capability | Ordered candidates |
|---|---|
| `FAST_CLASSIFICATION` | 3.8 → 3.7 → 3.6 → 2.5 Flash |
| `CLAIM_EXTRACTION` | 3.8 → 3.7 → 3.6 → 2.5 Flash |
| `DEEP_REASONING` | 3.8 → 3.7 → 3.6 → 2.5 Flash |
| `MULTIMODAL` | 3.8 → 3.7 → 3.6 → 2.5 Flash |
| `DOCUMENT` | 3.8 → 3.7 → 3.6 → 2.5 Flash |
| `RERANKING` / `SUMMARIZATION` | 3.8 → 3.7 → 3.6 → 2.5 Flash |
| `EMBEDDING` | none; explicit `NOT_CONFIGURED` |

There is no ensemble, averaging, consensus score, or duplicate client request.
The router stops on the first valid result.

## Failover and cooldown policy

The router advances to the next model only for:

- HTTP 429 / `RATE_LIMITED` / `RESOURCE_EXHAUSTED` / quota exhaustion;
- HTTP 503 / `SERVICE_UNAVAILABLE`;
- provider timeout or network timeout;
- HTTP 404 / `MODEL_NOT_FOUND` or temporary model unavailability;
- an explicit `MODEL_INCOMPATIBLE` result from the fixed structured contract.

HTTP 400 invalid request/schema errors, 401 authentication failures, and 403
permission failures stop the sequence immediately. They are configuration or
application problems, not reasons to cascade across models.

`ModelHealthStore` keeps bounded process-local state keyed by provider/model.
Transient failures create an expiring cooldown; successful use clears that
model’s state. Google `Retry-After` and explicit quota-reset metadata are
honored. A daily-quota signal receives a longer bounded cooldown without
pretending to know a reset time that Google did not provide. No model is
permanently disabled.

## Structured output contract

Layer 4 sends every active candidate the same current schema and prompt
contract:

```json
{
  "verdictSignal": "SUPPORTS|CONTRADICTS|MIXED|UNCERTAIN|NO_SIGNAL",
  "supportReasons": [],
  "contradictionReasons": [],
  "missingEvidence": [],
  "uncertainty": "string",
  "citationsUsed": [{ "id": "evidence-id", "url": "https://…" }],
  "provider": "gemini",
  "model": "one of the active Gemini chain models"
}
```

`GeminiTrustVerificationDTO.js` keeps only real HTTP(S) citations already
present in the supplied evidence, rejects unapproved model IDs, and does not
invent confidence or citations. Malformed output is recorded as
`MODEL_INCOMPATIBLE` and the next candidate may be tried without weakening the
schema.

## Model trace

Each candidate record contains only bounded public-safe fields:

```json
{
  "model": "gemini-3.7-flash",
  "attemptNumber": 2,
  "startedAt": "2026-09-17T00:00:00.000Z",
  "durationMs": 412,
  "httpStatus": 200,
  "providerErrorCode": null,
  "result": "SUCCESS"
}
```

The final gateway/L4 metadata also reports `requestedPrimaryModel`,
`executedModel`, `fallbackUsed`, `fallbackReason`, `providerStatus`, and
`operationStatus`. No raw response body, stack, prompt, or key enters the
trace.

## Gemma safety gate

`gemma-4-31b-it` and `gemma-4-26b-a4b-it` remain shadow candidates. They are not
in `CAPABILITY_ROUTES`. Before activation, the exact current L4 prompt/schema
must pass endpoint, structured-output, Vietnamese reasoning, evidence
grounding, latency, quota, safety, and parser checks. Until every required
check is evidenced, the report is `GEMMA_COMPATIBLE=NO`.

## Trust and L5 boundary

- L1–L3 produce deterministic/local signals and evidence records.
- L4 executes deterministic Trust Policy first, then optionally enriches the
  explanation with one successful Gemini advisory result.
- If every Gemini candidate fails, L4 is `UNAVAILABLE`/`PARTIAL` with the
  exact model trace; the pipeline continues and L5 still runs.
- L5 remains deterministic assurance/final authority and is not modified by
  provider availability.

## UI behavior

When fallback succeeds, the L4 panel shows `AI Verification — Hoàn tất`,
Google Gemini, the model used, the primary model, and a human-readable fallback
reason. This is not rendered as an error. When all models fail, it shows
`AI Verification — Không khả dụng`, the models attempted, and that Decision
Intelligence continued using deterministic Trust policy without AI advisory.

## Verification commands

Hermetic fault tests never spend provider quota:

```text
cd frontend
node --test tests/ai-gateway/ai_gateway_router.test.mjs
node --test tests/gateway/provider_failure_cost_latency.test.mjs
```

The one-shot real probe is separate and secret-free:

```text
node scripts/gemini-model-router-probe.mjs
```

It skips a candidate already recorded as exhausted with HTTP 429, makes at most
one bounded request per other candidate, and writes a JSON report under
`docs/reports/`. Use `--probe-gemma` only for an explicitly authorized shadow
compatibility gate; Gemma remains inactive unless all checks pass.

