# StudentHub AI — Frontend Foundation API Contracts

**Phase:** Stages 00–24 continuous engineering program  
**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01

## Scope

This document records the frontend-facing contract implemented in the continuous program. The authoritative server endpoint inventory remains [`docs/API-CONTRACTS.md`](<C:/Users/Duy/Projects/MyProj/StudentHub-AI/docs/API-CONTRACTS.md>). The frontend work does not add, rename, or claim ownership of a backend endpoint.

The runtime boundary is:

```text
feature/domain use case
  → Provider port (`frontend/src/lib/backend/ports.ts`)
  → explicit adapter/provider
  → existing `frontend/src/lib/api` transport
  → same-origin route
```

## Runtime modules

| Concern | Runtime source | Contract responsibility |
| --- | --- | --- |
| Safe HTTP request | `frontend/src/lib/api/client.ts` | Credentials, timeout, abort, JSON/schema validation, request/trace ID, safe errors |
| UI state | `frontend/src/lib/ui-state/model.ts` | Canonical state envelope, transitions, uncertainty invariant, stale work guard |
| Provider ports | `frontend/src/lib/backend/ports.ts` | Trust, Community, Expert, Passport domain inputs/results and provenance |
| Explicit selection | `frontend/src/lib/backend/providerFactory.ts` | `DEMO` or `LIVE`; no implicit mode or fallback |
| Fixture source | `frontend/src/lib/backend/providers/DemoProvider.ts` | Deterministic local data with `DEMO_FIXTURE` disclosure |
| Future live boundary | `frontend/src/lib/backend/providers/FutureLiveProvider.ts` | Typed `UNAVAILABLE` until live contract/environment is approved |
| Current API adapter | `frontend/src/lib/backend/adapters/ApiProviderAdapter.ts` | Validate/normalize approved transport DTOs into provider results |

## Domain coverage

| Domain | Current transport compatibility | F02 behavior |
| --- | --- | --- |
| Trust | `POST /api/v1/trust` and existing V5/legacy compatibility parser | URL/text/image/screenshot inputs normalize through the adapter; `QR_READY` sends explicit QR content via the approved text transport with metadata, without claiming QR decoding; V5 response is runtime-validated; partial/unknown/insufficient/conflict remain explicit |
| Community | Existing same-origin community posts and experience compatibility paths | List, detail, and create are normalized to observations; unsupported query scope or missing response scope returns typed partial/unavailable rather than inventing routes or truth |
| Expert | `GET /api/v1/experts` plus existing compatibility assessment/detail paths | Public list/detail DTOs and assessments are normalized; credentials, scope, evidence-reviewed IDs, limitations, and status remain nullable when not returned; no global authority or fabricated rating is added |
| Evidence Passport | Existing `/api/v1/passports` compatibility route family | Typed list/read/create/append operations validate case and exact revision scope; live auth/ownership/persistence is environment-gated and no client confirmation is shown before the server response |

The adapter may return a valid `EMPTY` result for a valid read with no items. It returns `UNAVAILABLE` for a capability that the current transport does not support. It never changes an unsupported capability into demo data.

## Canonical Trust four-layer compatibility projection

The canonical Trust transport remains `POST /api/v1/trust`. When the server-only
legacy verification base URL is configured, the route's `TrustOrchestrator`
may call the approved compatibility endpoints through
`frontend/src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js`:

| Legacy call | Canonical layer | Authority after normalization |
| --- | --- | --- |
| `POST /api/verify/layer2` | L2 provider observation | StudentHub L2A finding contract; no-match is not safety proof |
| `POST /api/verify/layer3` | L3 web-evidence observation | StudentHub evidence/status contract; explicit stop/continuation |
| `POST /api/verify/layer4` | L4 independent synthesis | Advisory assessment only; local deterministic policy remains authoritative |

The compatibility base URL is server-only and must be supplied by
`STUDENTHUB_LEGACY_VERIFICATION_BASE_URL` (the legacy alias
`LEGACY_VERIFICATION_BASE_URL` is accepted). The browser never calls these
paths directly. Invalid/private/local targets, non-JSON responses, oversized
bodies, malformed payloads, timeouts, rate limits, and outages map to explicit
unavailable/unknown states; no demo fallback is permitted.

The canonical V5 response may include the following bounded projections:

- `layers`: public stage status, finding, provider status, and evidence references;
- `decision`: deterministic security/truth/action output and separate evidence metrics;
- `evidence`: normalized records with explicit layer origin;
- `graph`: nodes and edges derived only from those records;
- `passport`: append-only event descriptors with `NOT_PERSISTED` status when the
  anonymous Trust request has no authenticated case owner and revision scope.

Legacy Layer 3 `confidence` and Layer 4 `confidence` are retained as provider
assessment metadata. They are not converted into StudentHub safety probability
or final decision confidence. Legacy Layer 4 verdicts, model names, and source
records cannot override the deterministic final decision.

## Canonical result metadata

Every provider result carries:

- requested mode (`DEMO` or `LIVE`);
- provider status (`AVAILABLE`, `PARTIAL`, `UNKNOWN`, `ERROR`, `UNAVAILABLE`, `OFFLINE`, `CANCELLED`, `AUTH_REQUIRED`, `FORBIDDEN`);
- source provenance (`DEMO_FIXTURE`, `COMMUNITY`, `EXPERT`, `LIVE_PROVIDER`, or `UNAVAILABLE`);
- canonical UI state, safe error, unknowns, missing scope, request/run identity, and safe next actions.

Cross-pillar commands require `caseId` plus non-negative `caseRevision`; mutating commands also require `requestId` and `idempotencyKey`. Community and Expert events do not directly mutate a Trust verdict.

## Non-claims

The continuous program does not claim:

- an ASP.NET topology, Supabase schema/RLS behavior, production credentials, or provider availability;
- that same-origin compatibility routes are production truth without the approved backend environment;
- live verification, production expert authority, QR decoding, or synthetic Trust evidence;
- production auth/ownership/RLS behavior, deployment readiness, or final visual implementation.

Those capabilities require an approved contract and the phase/environment gates defined in the roadmap.
