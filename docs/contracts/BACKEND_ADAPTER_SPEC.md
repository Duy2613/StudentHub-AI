# StudentHub AI — Backend Adapter Specification

**Phase:** Stages 00–24 continuous engineering program  
**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01

## Purpose

This specification freezes the frontend/backend boundary and records the current local implementation across the continuous engineering program. It allows the frontend to work with deterministic fixtures now and a future ASP.NET/Supabase/live-provider implementation later without moving domain semantics into transport code or visual components.

## Boundary decision

    Feature use case
        → ProviderPort (domain-safe interface)
        → Adapter (mode/error/schema translation)
        → Transport client
        → Same-origin route handler / approved backend

`frontend/src/lib/api/client.ts` remains the current transport seam. It owns HTTP timeout, abort propagation, credentials, response parsing, trace ID, and typed transport errors. The adapter layer owns provider selection, domain normalization, provenance, and mapping into the UI state model. Leaf UI components do not call `fetch`, Supabase, provider SDKs, or raw route handlers.

## Canonical provider modes

| Mode | Availability | Behavior | Prohibited behavior |
| --- | --- | --- | --- |
| `DEMO` | Available without external backend | Deterministic fixture, stable IDs, explicit `DEMO_FIXTURE` provenance | Must not appear live or be used after an unrequested failure |
| `LIVE` | Available only when configured and contract-verified | Calls approved live adapter/provider | Must not expose secrets or undocumented backend assumptions |
| `UNAVAILABLE` | Backend/provider not configured, unreachable, or disabled | Return typed `UNAVAILABLE`/configuration state | Must not silently select DemoProvider |

The current explicit `NEXT_PUBLIC_COMPETITION_DEMO=true` boundary may select Trust demo mode. Future UI selection must be explicit and visible. Provider mode is never inferred from a blank response.

## Provider port

The canonical port is conceptual and must be implemented with typed schemas at its boundary:

    TrustProvider
      investigate(input, options, signal)

    CommunityProvider
      listObservations(query, signal)
      getObservation(observationId, signal)
      submitObservation(command, idempotencyKey, signal)

    ExpertProvider
      listExperts(query, signal)
      getExpert(expertId, signal)
      requestAssessment(command, idempotencyKey, signal)
      getAssessment(assessmentId, signal)

    PassportProvider
      getPassport(caseId, signal)
      createPassport(command, idempotencyKey, signal)
      appendRevision(command, idempotencyKey, signal)
      listRevisions(passportId, signal)

The public feature facade may combine these methods into use cases, but it must not leak transport `Response`, raw JSON, provider SDK types, or backend-specific status strings.

## Domain contract minimums

### Trust investigation

Input must contain a typed mode (`URL`, `TEXT`, `IMAGE`, or `QR_READY`), bounded payload/reference, request/run identity, and optional user-confirmed entities. Output must contain:

- `caseId`, `runId`, case revision, and generated-at timestamps;
- decision/verdict with explicit semantics;
- independent risk, confidence, evidence coverage, source agreement, and unresolved signals;
- reasons, recommended action, and unknowns;
- stage/provider statuses with completed/missing scope;
- evidence items with source/provenance and timestamps;
- optional Community/Expert links as events, not direct verdict mutation;
- demo/live provenance and contract version.

Image/entity coordinates are optional contract data. The client may render a box only when a valid provider entity includes coordinates tied to the source image; it may not invent coordinates.

### Community observation

An observation must carry an ID, case linkage if any, source/context, observed-at time, submitted-at time, evidence references, freshness/moderation status, contributor privacy projection, and corroboration/conflict relation. An observation is not a verdict.

### Expert assessment

An assessment must carry assessment ID, expert identity projection, scope, verification status, case ID/revision, evidence-reviewed IDs, confidence, limitations, status, assessment/revision timestamps, and disagreement/withdrawal semantics. An expert is not global authority.

### Evidence Passport

A Passport must carry passport ID, case ID, owner/privacy projection, immutable revision IDs, append-only events, evidence provenance, source mode, retention metadata, and current-view linkage. A client-side optimistic card is not a revision.

## Adapter responsibilities

An adapter must:

1. validate caller input before transport;
2. select only the explicitly requested provider mode;
3. call the approved transport/facade;
4. validate response against the versioned schema;
5. normalize backend-specific fields into domain fields;
6. preserve unknown, partial, conflict, unavailable, and provider status semantics;
7. map failures to the shared error model and safe user state;
8. attach request/run/trace identity without exposing secrets;
9. support abort and timeout;
10. return typed domain data or a typed failure, never a guessed result.

## Transport mapping

The current contract inventory in `docs/API-CONTRACTS.md` is the endpoint reference. Canonical versioned targets include:

| Domain | Target transport family | Adapter rule |
| --- | --- | --- |
| Trust | `POST /api/v1/trust` | Validate `trust.v1`/approved stream schema; preserve stage/provider states |
| Community | `GET|POST /api/v1/community` | Validate observation schema; legacy endpoints may be compatibility-only |
| Expert | `GET /api/v1/experts` plus assessment command | Validate scope/authority/assessment fields |
| Passport | `GET|POST/PATCH /api/v1/passports` family | Writes are authenticated, idempotent, append-only by revision |
| Search | `GET /api/v1/search` | Scope and privacy filter server-side; no fake entity search in nav overlay |
| Dashboard/notifications | versioned dashboard/notification families | Personal data requires session and projection |

The future ASP.NET endpoint shape is not invented here. `FutureLiveProvider` is implemented as an explicit unavailable boundary; `ApiProviderAdapter` only wraps currently approved same-origin transport capabilities. A live provider is not considered integration-ready until the collaborator contract, environment, auth, and integration tests are available.

## Error mapping

Transport errors from `frontend/src/lib/api/errors.ts` map as follows:

| Transport/domain condition | UI state | Required behavior |
| --- | --- | --- |
| 400/validation/payload | `ERROR` | Explain correction; no provider call/result |
| 401 | `AUTH_REQUIRED` | Preserve safe return context; no private data |
| 403 | `FORBIDDEN` | Do not leak resource existence |
| 404 | `EMPTY` or `ERROR` by contract | Never treat absent resource as safe |
| 409/idempotency/stale revision | `CONFLICTING_EVIDENCE` or `ERROR` | Reconcile/reload; no duplicate write |
| 413 | `ERROR` | Show size boundary |
| 429 | `ERROR` with retry metadata | Respect server retry window |
| 5xx/upstream unavailable | `UNAVAILABLE` or `PARTIAL` | Identify missing dependency/scope |
| network/timeout | `OFFLINE`, `UNAVAILABLE`, or `ERROR` | Preserve no-write/no-finding truth |
| invalid JSON/schema | `ERROR` | Treat as contract failure, not domain evidence |
| provider disagreement | `CONFLICTING_EVIDENCE` | Preserve each source/value |

Error messages are safe, localizable, and user-readable. Trace IDs are useful support metadata, not evidence.

## Authentication and authorization

- The adapter receives session context from the approved auth boundary; it does not parse or mint tokens in leaf UI.
- Supabase service-role credentials and provider secrets are server-only.
- Case, Passport, profile, observation, and assessment IDs are untrusted input.
- Authorization is enforced server-side for every read/write; client visibility is not authorization.
- Public projections omit private contributor, image, contact, and retention data.
- Cross-pillar commands include case/revision scope and cannot update Trust verdict directly.

## Input and SSRF boundary

URL input is data, not a browser navigation instruction. The browser never fetches the submitted target as part of the Trust scan. Server-side URL fetching, DNS, redirect, file, image, QR, and document analysis must enforce allow/deny policy, size/time limits, egress controls, content-type validation, and audit logging. The adapter does not weaken those controls.

## Caching, retries, and concurrency

- Read caching must respect ownership, freshness, provider mode, and case revision.
- Mutation retries require idempotency keys; do not blindly retry an append or submission.
- Requests accept an abort signal and bounded timeout.
- `runId`/`requestId` is checked before state commit.
- A stale response cannot overwrite a newer Trust scan or Passport revision.
- `DEMO` data must not enter a live cache namespace.

## DemoProvider requirements

DemoProvider fixtures must be deterministic, versioned, local or explicitly fixture-backed, and easy to identify in tests and UI. Every response includes demo provenance, fixture ID/version, and a disclosure. Demo fixtures may exercise success, partial, unknown, conflict, unavailable, and error states. They must not be described as provider verification.

## FutureLiveProvider requirements

FutureLiveProvider is a port implementation, not a promise that live infrastructure exists. It may be enabled only after:

- backend endpoint and schema contract are approved;
- auth/session and RLS checks are available;
- provider failure/partial/unavailable behavior is tested;
- secrets are server-side and environment-scoped;
- observability and rollback exist;
- no demo fallback occurs on live failure.

Until then, selecting live returns `UNAVAILABLE` or a typed configuration error.

## Optional legacy four-layer compatibility adapter

The reference backend is integrated only behind the canonical server-side
Trust orchestrator. `frontend/src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js`
owns the three legacy calls (`/api/verify/layer2`, `/api/verify/layer3`, and
`/api/verify/layer4`) and maps their responses into the existing L2A/L3/L4
contracts. Browser code has no legacy endpoint dependency.

The adapter is disabled when no server-only base URL is configured. The
preferred variable is `STUDENTHUB_LEGACY_VERIFICATION_BASE_URL`; the
`LEGACY_VERIFICATION_BASE_URL` alias is accepted for compatibility. A
configured but invalid, unreachable, timed-out, oversized, or malformed
backend response is represented as `UNAVAILABLE`/`INVALID_RESPONSE`; it never
selects `DemoProvider` or produces a positive finding.

Layer 3 and Layer 4 sources carry explicit origins (`LAYER_3_WEB_EVIDENCE`
and `LAYER_4_INDEPENDENT_RESEARCH`) and are not merged. Legacy confidence is
stored as assessment confidence only. Layer 4 synthesis is advisory evidence
for the canonical response and cannot override the StudentHub deterministic
security/truth/action policy. Layer 3 `stop` and `canContinueToLayer4` are
validated by the server orchestrator; a contradictory combination is a
contract failure.

The canonical V5 response additionally exposes bounded `evidence`, `graph`,
and append-only `passport` projections. The Passport projection is explicitly
`NOT_PERSISTED` until an authenticated case owner/revision scope is available;
it is not a client-side write confirmation.

## Continuous program implementation evidence

Runtime files:

- `frontend/src/lib/backend/ports.ts` — schemas, provider ports, result/provenance/error mapping;
- `frontend/src/lib/backend/providerFactory.ts` — explicit mode selection and bundle-mode guard;
- `frontend/src/lib/backend/providers/DemoProvider.ts` — deterministic no-network fixture provider;
- `frontend/src/lib/backend/providers/FutureLiveProvider.ts` — live-mode `UNAVAILABLE` boundary;
- `frontend/src/lib/backend/adapters/ApiProviderAdapter.ts` — current API transport normalization.

The current adapter supports Trust URL/text/image/screenshot compatibility transport and QR-ready input by sending the user-provided QR content through the approved text transport with explicit input metadata; it does not claim to decode QR or to have a provider-side QR contract. Community list/detail/create, Expert list/detail/assessment, and Passport list/read/create/append are normalized through existing same-origin compatibility routes where their response shape is approved. Missing scope, unsupported query capabilities, auth failures, live persistence, and backend/provider unavailability remain typed `PARTIAL`, `AUTH_REQUIRED`, `FORBIDDEN`, `UNAVAILABLE`, or `ERROR`; no new endpoint or synthetic success is introduced.

## Tests required before live integration is accepted

- schema fixtures for success, empty, partial, unknown, insufficient, conflict, unavailable, malformed, and demo responses;
- DemoProvider determinism and no-network tests;
- live-unavailable/no-fallback tests;
- auth/forbidden/privacy projection tests;
- SSRF/input bounds tests at the server boundary;
- timeout/abort/stale-run/idempotency tests;
- route-to-provider ownership tests;
- live integration and RLS tests when environment is available; otherwise explicitly `BLOCKED_BY_ENV`.

Local verification includes foundation `4/4 files PASS` with `18` adapter assertions, full discovered suite `265/265 PASS`, Chromium `67 passed` with `3` explicit-demo skips, typecheck/build pass, full lint `0` errors, bundle budgets pass, and dependency audit `0` vulnerabilities. Live ASP.NET, Supabase/PostgreSQL/RLS, production provider credentials, and deployment verification remain `BLOCKED_BY_ENV`.
