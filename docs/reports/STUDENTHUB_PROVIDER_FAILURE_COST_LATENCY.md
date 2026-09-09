# StudentHub AI — Provider Failure, Cost and Latency Evidence

**Date:** 2026-09-09  
**Status:** `FAILURE_MATRIX_LOCAL_VERIFIED; COST_ESTIMATE_ONLY; LIVE_P95_NOT_ESTABLISHED`

## Failure matrix

The local gateway test exercises five mocked failure conditions: OpenAI unavailable, OpenAI 429, Gemini unavailable, Gemini 429, and both external providers unavailable. All five routed safely; the all-down case ended in truthful deterministic abstention without a fabricated verdict.

This is resilience evidence for the router and mock providers. It is not proof that an external provider account, endpoint, billing account or production secret is configured.

## Cost model

The FAST/NORMAL/DEEP figures in `frontend/tests/gateway/provider_failure_cost_latency.test.mjs` are calculated from assumed input/output token counts and assumed unit prices. They are explicitly estimates:

| Mode | Modelled input/output tokens | Modelled cost |
|---|---:|---:|
| FAST | 250 / 60 | $0.000073 |
| NORMAL | 850 / 220 | $0.000259 |
| DEEP | 2,400 / 650 | $0.000750 |

No verified price snapshot, provider usage response or billing export was available. These numbers must be displayed as `COST_ESTIMATE_ONLY`.

## Latency model

The p50/p90/p95 values are from 50 deterministic synthetic latency samples per mode. They are not observed provider p95, server p95 or user-perceived latency and must not be used as an SLA attestation.

**Next evidence required:** a bounded live run with provider/model, UTC timestamp, observed prompt/completion tokens, response status, and an approved billing/price source. Until then, retain the status above.

