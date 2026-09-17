# Gemini Multi-Model Router Architecture & Availability Verification — 2026-09-17

## Verdict

`VERDICT: GEMINI_MULTI_MODEL_ROUTER_VERIFIED`

The health-aware Gemini multi-model router, server-owned model provenance, remaining-budget reservation, and failover error classification architecture are fully verified. Under current production health conditions (3.8 cooldown, 3.7 cooldown), the router skips known-unhealthy candidates in 0ms, preserves the reserved 6,800ms budget for healthy terminal candidate `gemini-3.6-flash`, validates the structured L4 DTO, stamps authoritative provenance server-side, and completes the full L1–L5 Trust pipeline. Retired candidate `gemini-2.5-flash` is permanently excluded from active production routing.

## Required Report Fields

| Field | Result |
|---|---|
| `GEMINI_API_KEY_PRESENT` | `YES` — presence only; secret value is never logged, leaked, or persisted |
| `MODEL_3_8` | `COOLDOWN` — HTTP `429` quota exhausted; skipped in `0 ms` without outbound call |
| `MODEL_3_7` | `COOLDOWN` — HTTP `503` high demand / `429` quota limit; skipped in `0 ms` without outbound call |
| `MODEL_3_6` | `HEALTHY` — HTTP `200` operational; reserved `6,800 ms` budget protected; structured DTO validated |
| `MODEL_2_5` | `RETIRED` — HTTP `404` `PROJECT_MODEL_UNAVAILABLE` / `UNAVAILABLE_TO_NEW_USERS`; active: false |
| `SERVER_OWNED_PROVENANCE` | `YES` — server authoritatively stamps `provider = "google"` and `model = entry.model` |
| `BUDGET_RESERVATION` | `YES` — `6,800 ms` preserved for terminal healthy model; prevents upstream budget starvation |
| `MODEL_ROUTER_RESULT` | Health-aware preference catalog `[gemini-3.8-flash, gemini-3.7-flash, gemini-3.6-flash]` verified |
| `MODEL_COOLDOWN_RESULT` | `PROCESS_LOCAL_PER_MODEL_COOLDOWN_ENABLED` (`HEALTHY`, `RATE_LIMITED`, `HIGH_DEMAND`, `TEMPORARILY_UNAVAILABLE`, `INCOMPATIBLE`, `RETIRED`) |
| `MAX_L4_BUDGET` | `10,000 ms` total; `7,000 ms` per model; `6,800 ms` reserved healthy budget; `3` maximum attempts |
| `FAILOVER_CLASSIFICATION` | Strict split enforced: failover YES (429, 503, timeouts, incompatible, 404) vs NO (401, 403, 400 schema, config errors) |
| `GEMMA_31B_COMPATIBILITY` | `NOT_RUN_SHADOW_ONLY`; compatible `NO` |
| `GEMMA_26B_COMPATIBILITY` | `NOT_RUN_SHADOW_ONLY`; compatible `NO` |
| `GEMMA_COMPATIBLE` | `NO` |
| `ACTIVE_FALLBACK_CHAIN` | `gemini-3.8-flash → gemini-3.7-flash → gemini-3.6-flash` (`gemini-2.5-flash` retired) |
| `L4_ALL_MODELS_FAIL_TEST` | `PASS` — exact trace and `UNAVAILABLE/PARTIAL` result in hermetic fault coverage |
| `L5_AFTER_ALL_MODELS_FAIL` | `PASS` — deterministic V5 pipeline reaches L5 after degraded L4 |
| `ZERO_RERUN` | `PASS` — one routing sequence; at most one outbound call per healthy candidate; cooling candidates skipped in `0 ms` |
| `NO_GROQ` | `YES` |
| `NO_SEQUENTIAL` | `YES` |
| `TRUST_AUTHORITY_CHANGED` | `NO` |

The machine-readable record is [`gemini_multi_model_router_probe_2026-09-17.json`](gemini_multi_model_router_probe_2026-09-17.json).

## Fault, Health, and Regression Evidence

- **Architecture Corrections**:
  - `ModelRouter`: Implements preference catalog routing. Cooldown entries are skipped in 0ms without hitting the network.
  - `Server-Owned Provenance`: Server overrides LLM output with authoritative `provider = "google"` and `model = entry.model`.
  - `Remaining-Budget Reservation`: Protects 6,800ms for terminal healthy candidate `gemini-3.6-flash` so it cannot be starved.
  - `Error Classification`: Strict failover YES/NO matrix blocks burning candidates on global 400/401/403 request defects.
  - `gemini-2.5-flash`: Retired to `RETIRED_GEMINI_MODEL_IDS` (`UNAVAILABLE_TO_NEW_USERS`, `active: false`, `shadowOnly: true`).
- **Test Suite Results**:
  - `frontend/tests/ai-gateway/*.test.mjs`: 29/29 tests passed (including dedicated ACCEPTANCE test).
  - `frontend/tests/gateway/provider_failure_cost_latency.test.mjs`: 4/4 tests passed.
  - `frontend/tests/trust/trust_engine_v5_sequential.test.mjs`: 99/99 tests passed.
  - `frontend/tests/trust/*.test.mjs` & `layer4/*.test.mjs`: 183/183 tests passed.


