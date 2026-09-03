# StudentHub AI Cost and Investigation Governance

Status: `BOUNDED_LOCAL_ACCOUNTING_EXTERNAL_BILLING_NOT_VERIFIED`

## Scope

Cost governance covers Google threat lookups, Tavily/search retrieval, legacy
provider calls, AI Gateway model attempts, retries, and durable investigation
work. Provider billing is external; this document does not invent prices or
claim production spend telemetry.

## Request-scoped limits

`frontend/src/lib/ai-trust/v5/investigationBudget.js` defines the bounded
default ledger:

| Dimension | Default limit |
| --- | ---: |
| Elapsed time | 30,000 ms |
| Provider-bearing stage calls | 12 |
| Search requests | 8 |
| Retrieved results | 80 |
| Evidence bytes | 1 MiB |
| AI tokens | 4,096 |
| Retries | 4 |
| Estimated cost | 25 relative cents/units |

These are safety ceilings, not measured provider quotas. The Trust pipeline
enforces elapsed time, provider-bearing stage calls, search/results/evidence
budgets, retry budgets, and AI token/cost reservations; it exposes a sanitized
budget snapshot in the audit envelope. Provider adapters and the AI Gateway
also maintain their own bounded response, retry, and output limits.

## Accounting dimensions

Record only safe operational dimensions:

- `requestId`, `traceId`, and `investigationId`;
- layer/capability and provider family;
- provider call count, retry count, duration, and typed outcome;
- model catalog ID, bounded upstream or estimated input/output token count when
  available;
- search request/result count and evidence byte count;
- relative cost class/unit and bounded attempt usage, never a secret or invoice
  credential. The ledger also has provider-family counters for future native
  Google/Tavily adapters.

Do not use raw URLs, email, screenshot content, full claims, tokens, keys, or
provider request bodies as metric labels.

## Admission and fallback policy

1. Deterministic Trust policy runs independently of optional AI enrichment.
2. A budget rejection returns a typed partial/blocked state; it never triggers
   a demo answer or positive verdict.
3. Retry only bounded transient failures. Do not blindly retry malformed,
   unauthorized, or invalid-input responses.
4. A fallback model must remain within the same approved capability, privacy,
   and cost policy; no user/expert-to-vendor hard-coding is permitted.
5. Shadow calls are disabled by default and require duplicate-dispatch/privacy
   review.

## Evidence required for cost claims

The repository can verify limits and simulated retry/fallback behavior. Actual
provider prices, token usage, quota exhaustion, and per-investigation currency
cost remain `NOT_VERIFIED` until approved staging credentials and provider
telemetry are available.
