# StudentHub AI Model Registry

Status: `GOVERNED_ADAPTERS_NOT_LIVE_CONFIGURED`

This is the operational registry for the server-side AI Gateway. The existing
historical MLOps inventory at `docs/models/model_registry.md` remains useful for
model/evaluation history; this document governs runtime provider selection and
release readiness.

## Registry

| Provider family | Model/catalog ID | Capability | Structured schema | Privacy class | Cost class | Max context | Allowed input classes | Fallback | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OpenAI-compatible proxy | `GPT_5_NANO` / `gpt-5-nano` | Fast classification | Caller schema required | `USER_PRIVATE_MINIMIZED_REVIEW` | LOW | Not verified in this repo | PUBLIC, INTERNAL, minimized USER_PRIVATE | Gemini or `GPT_5_MINI` by route | Adapter ready; key/base URL not configured |
| OpenAI-compatible proxy | `GPT_5_MINI` / `gpt-5-mini` | Claim extraction, summarization, reranking | Layer-specific validator required | `USER_PRIVATE_MINIMIZED_REVIEW` | MEDIUM | Not verified in this repo | PUBLIC, INTERNAL, minimized USER_PRIVATE | Gemini or deep candidate by route | Adapter ready; key/base URL not configured |
| OpenAI-compatible proxy | `GPT_5_1` / `gpt-5.1` | Deep reasoning, claim extraction, document | Layer-specific validator required | `USER_PRIVATE_MINIMIZED_REVIEW` | HIGH | Not verified in this repo | PUBLIC, INTERNAL, minimized USER_PRIVATE | `GPT_5_2` or `GPT_5_MINI` | Adapter ready; key/base URL not configured |
| OpenAI-compatible proxy | `GPT_5_2` / `gpt-5.2` | Deep reasoning, document | Layer-specific validator required | `USER_PRIVATE_MINIMIZED_REVIEW` | HIGH | Not verified in this repo | PUBLIC, INTERNAL, minimized USER_PRIVATE | `GPT_5_MINI` | Adapter ready; key/base URL not configured |
| Google Gemini | `GEMINI_FLASH` / `gemini-2.5-flash` | Multimodal, fast classification, claim extraction | Layer-specific validator required | `USER_PRIVATE_MINIMIZED_REVIEW` | LOW | Not verified in this repo | PUBLIC, INTERNAL, approved minimized USER_PRIVATE | Capability route fallback | Adapter ready; key not configured |
| Groq | Friend-reported mode/model | Legacy Layer 4 candidate synthesis | Legacy DTO validator only | `USER_PRIVATE_REVIEW_REQUIRED` | Not registered | Not verified | Only approved minimized inputs | Legacy adapter rollback path | Legacy-only evidence; no native gateway registration |

Cost classes are relative routing controls, not a vendor invoice or price
claim. Context limits, data-processing terms, quotas, and model availability
must be confirmed against current provider documentation before staging.

## Governance rules

- Domain code requests capability, not model/vendor.
- A structured response is usable only after JSON parsing, schema validation,
  bounds checks, and evidence-reference validation.
- Explicit citations must refer to IDs present in the current evidence scope;
  fabricated/unknown IDs are rejected.
- AI may explain or enrich a bounded narrative. It cannot determine Trust
  truth, security risk, action, or decision confidence.
- Prompt injection and retrieved text remain untrusted data.
- Provider absence is `NOT_CONFIGURED`, not a synthetic answer.
- A model name is not considered current merely because it appears in a
  historical source; registry review is required before enabling it.

## Enablement checklist

1. Confirm official API contract, model ID, context, quota, terms, and data
   handling.
2. Add/update the adapter and capability route.
3. Add sanitized structured fixtures, schema/evidence-binding tests, timeout,
   rate-limit, auth, malformed, and fallback tests.
4. Confirm data classification and cost budget.
5. Run staging shadow/differential tests without changing user-visible policy.
6. Record the exact release configuration and rollback flag.

Live AI success is not claimed in this repository state because approved
provider credentials and staging evidence are absent.

