# StudentHub AI — Provider / Model Matrix

**Date:** 2026-09-09  
**Status:** `LOCAL_ROUTE_INSPECTED; LIVE_CONFIGURATION_NOT_ATTESTED`

| Component | Local evidence | Live status |
|---|---|---|
| `MOD_FRAUD_MULTIHEAD_V1_4` | In-process domain-specialist advisory path exists | Local only; not final authority |
| OpenAI-compatible route | Model catalog and fallback route are present | No live provider response established |
| Gemini route | Model catalog and Gemini-first multimodal route are present | No live provider response established |
| Deterministic policy | Used as bounded fallback and critic policy | Available locally |

The gateway contract tests cover routing, one bounded retry per candidate, fallback and all-provider-down abstention with mock providers. Model names in the catalog do not prove account access. See [`STUDENTHUB_LIVE_PROVIDER_EVIDENCE.md`](STUDENTHUB_LIVE_PROVIDER_EVIDENCE.md) for the evidence boundary.

