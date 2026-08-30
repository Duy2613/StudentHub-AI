# StudentHub AI V2 Migration Map

## Dependency order

```text
P0 handler correctness
  -> route authorization inventory
  -> single identity authority + secure BFF session
  -> PostgreSQL/RLS canonical persistence
  -> TrustGraph relational schema
  -> Trust/Community/Expert canonical APIs
  -> provider and worker infrastructure
  -> scientific ML evaluation
  -> consolidated V2 experience
  -> release gates and observability
```

## Current-to-target mapping

| Current component | Target role | Migration action | Removal gate |
| --- | --- | --- | --- |
| `lib/ai-trust` and `lib/intelligence/trust` | Trust domain | Choose canonical contracts; adapt the second tree | Contract, parity, and regression tests pass |
| `/api/ai-trust` and `/api/ai/trust` | `/api/v1/trust` | Add compatibility adapters and deprecation telemetry | No active callers on legacy namespace |
| `/api/expert` and `/api/intelligence/experts` | `/api/v1/experts` | Consolidate around domain-scoped proof of expertise | Public DTO and assessment flows pass |
| `/api/community` and `/api/intelligence/community` | `/api/v1/community` | Consolidate posts, claims, evidence, moderation | Migration and data parity verified |
| Security Fabric | BFF/API policy gateway | Retain, fix contracts, move state to distributed/durable stores | Never removed; implementation evolves |
| Supabase + ASP.NET + demo auth | One OIDC identity authority | Adopt Supabase/OIDC as authority unless backend evidence overturns ADR | HttpOnly/JWKS/revocation/E2E gates pass |
| Memory/file repositories | PostgreSQL + RLS repositories | Dual-write only during controlled migration | Clean migrations and parity tests pass |
| Browser OCR/model inference | Worker/server inference | Lazy-load OCR; isolate or server-host model weights | Trust shell bundle budget passes |
| Static knowledge retriever | TrustGraph + pgvector | Preserve fixtures only as explicit test data | Retrieval quality/provenance tests pass |
| Deterministic Layer 4 fallback | Structured model jury | Retain as degraded mode, never label as live LLM | Provider integration and schema tests pass |
| Multiple app shells | One V2 shell: Trust, Community, Experts | Migrate routes incrementally | Keyboard/mobile/accessibility E2E passes |

## Repository decision

The accessible workspace contains one frontend-led repository and references an external ASP.NET deployment whose source is not present here. No blind repository merge is justified. Backend integration remains an explicit boundary until ownership, source, license, API contract, and deployment state can be inspected.

## Immediate ADR queue

- ADR-001: Supabase/OIDC as sole identity authority; accepted, with production cutover gates outstanding.
- ADR-002: durable opaque PostgreSQL session store behind the Next.js BFF.
- ADR-003: PostgreSQL authority and tested RLS; schema accepted, live proof outstanding.
- ADR-004: pgvector as the default vector extension, subject to measured query needs.
- ADR-005: structured evidence orchestration with deterministic fail-safe policy.
- ADR-006: domain-scoped Bayesian/calibration-aware expert reputation.
- ADR-007: authorized ingestion through quarantine, provenance, review, and revocation.
- ADR-008: server/worker model serving with explicit degraded deterministic mode.
