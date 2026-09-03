# Friend Backend Source Reconciliation

**Status:** `SOURCE_RECONCILED_WITH_SECURITY_BLOCKER`

**Authority:** StudentHub canonical architecture and Trust v5 remain authoritative.

**Source:** [`FRIEND_BACKEND_SOURCE_SNAPSHOT.md`](./FRIEND_BACKEND_SOURCE_SNAPSHOT.md)

**Pinned commit:** `0625b1b950f29edd714507e485284208207039fb`

**Audit date:** `2026-09-02`

## Executive conclusion

The pinned friend backend contains useful provider capability that can be retained behind StudentHub's existing `LegacyVerificationAdapter`, but it is not a canonical backend and must not be merged directly. The source is a small ASP.NET/EF Core service with three anonymous verification endpoints, a Supabase JWT profile path, a single `Users` table, and provider calls embedded in Layer 2–4 services.

The source-derived migration boundary is:

```text
StudentHub frontend
  → canonical StudentHub API / Trust v5
  → TrustOrchestrator
  → capability provider port
  → LegacyVerificationAdapter
  → pinned friend contract
  → Google Safe Browsing / Tavily / Gemini / Groq
  → normalized evidence observations
  → deterministic StudentHub Trust policy
```

The friend backend must not own the final verdict, canonical Passport, TrustGraph, Community, Expert, Supabase schema, or user identity semantics.

The source contains a tracked database credential and is classified `SECRET_ROTATION_REQUIRED` until an operator revokes and rotates it and completes history/deployment review.

## Source-derived technical map

| Area | Pinned implementation | Useful behavior | Reconciliation decision |
| --- | --- | --- | --- |
| Runtime | `net10.0` ASP.NET Web API, EF Core PostgreSQL, `AddHttpClient`, controller DI | Small, understandable service boundary | Treat as a legacy transport; do not merge its application host into StudentHub's canonical runtime |
| Startup/auth | `Program.cs` builds a Supabase issuer from configuration and validates JWT issuer, lifetime, signing key, and `sub` | Server derives the principal from the token in `AuthController` | Preserve the server-derived identity principle; reimplement under StudentHub auth/session contracts and add audience, rotation, revocation, CSRF, and cookie gates where applicable |
| CORS | One hard-coded Vercel origin, any header, any method | Restricts the listed browser origin | Replace with environment-scoped allowlists and explicit credential policy; never make this the canonical browser boundary |
| Profile API | `GET /api/auth/me` and authenticated `POST /api/auth/sync` | Profile lookup/upsert by Supabase subject; email is read from JWT rather than request body | Preserve only as a compatibility behavior; StudentHub profile ownership and schema remain canonical |
| User listing | Anonymous `GET /api/users` returns all user DTOs | None that is safe for the product boundary | Reject; require authorization, projection, pagination, and privacy filtering or remove the capability |
| Layer 2 | Anonymous `POST /api/verify/layer2`; URL dispatches to Google Safe Browsing v4; image/text return `UNKNOWN` | Useful reputation-provider integration and explicit unsupported input | Reuse behind `GoogleSafeBrowsingAdapter`; no-match becomes a provider observation such as `NO_KNOWN_THREAT`, never canonical `SAFE` |
| Layer 3 | Anonymous `POST /api/verify/layer3`; Tavily search with up to 8 results and an answer | Useful retrieval acquisition; Layer 3 can continue to Layer 4 | Retain retrieved evidence only after normalization, bounds, provenance, injection marking, and provider-state mapping; keyword counting cannot decide truth |
| Layer 4 | Anonymous `POST /api/verify/layer4`; receives a Layer 3 envelope, performs independent Tavily research, then calls Gemini or Groq by mode | Independent retrieval principle and capability split between user/pro/expert modes | Preserve independent observations and capability intent; move model selection into the StudentHub provider gateway and keep AI advisory |
| Persistence | `AppDbContext` exposes only `Users`; one initial EF migration | Demonstrates the collaborator's profile persistence assumption | Reject as canonical storage; StudentHub Supabase owns Trust cases, evidence, Passport, Community, Expert, audit, storage, and sessions |
| Deployment | Dockerfiles publish ASP.NET and expose port 10000 in the backend image | Reproducible container shape | Reuse only as an integration fixture; add health, secret, supply-chain, and environment gates before any staging use |

## Actual endpoint and DTO contract

The source-derived Layer 4 request is:

```text
POST /api/verify/layer4
{
  "type": string,
  "content": string,
  "mode": "user" | "pro" | "expert",
  "layer3": {
    "verdict": string,
    "confidence": number,
    "reason": string,
    "evidence": [{ "title": string, "url": string, "content": string | null }],
    "sources": [{ "title": string, "url": string }]
  }
}
```

The request is defined by `DTOs/Verification/Layer4VerifyRequest.cs`, not by the frontend or historical documentation. The controller defaults an omitted mode to `pro` and the service normalizes an unrecognized mode to `user`; this is contract ambiguity that Phase B must remove with a versioned adapter contract.

The source service returns a Layer 4 envelope containing `Verdict`, `Confidence`, `EvidenceAgreement`, `SourceQuality`, `Stop`, `CanContinueToLayer4`, `Mode`, model names, `Reason`, contradictory evidence strings, and sources. The `Layer2VerifyResponse` DTO is not used by the controller/service path; the interface-local records are the effective Layer 2 response shape.

## Provider map

| Capability | Source adapter location | Configuration | Observed behavior | Canonical target |
| --- | --- | --- | --- | --- |
| URL threat lookup | `Layer2VerificationService` | `GoogleSafeBrowsing:ApiKey` | Raw v4 REST call; threat match returns `DANGEROUS`; empty match returns `SAFE` | `UrlThreatProvider` → `GoogleSafeBrowsingAdapter` → provider observation → deterministic policy |
| Web evidence acquisition | `Layer3VerificationService` and `Layer4VerificationService.ResearchAsync` | `TAVILY_API_KEY` | Two independent-looking searches, but no retrieval identity/fingerprint model | `WebSearchProvider` → normalized `EvidenceObservation` records with run/layer/provider identity |
| Deep analysis | `TryGeminiWithFallbackAsync` | `GEMINI_API_KEY` | Hard-coded Gemini model names and raw JSON deserialization | `EvidenceAnalysisProvider` / `FinalSynthesisProvider` selected by capability, with strict schema and evidence-ID validation |
| Fast/user analysis | `TryGroqAsync` | `GROQ_API_KEY` | Hard-coded Groq model and raw JSON deserialization | Capability route in the StudentHub provider gateway; vendor names stay inside adapters |
| Email / Google client | `MailKit`, `Smtp`, `Google:ClientId` | Configuration exists, no verified product path in the audited source | No migration value established | Do not copy without a real canonical use case and secret/data-class review |

## Detailed findings

### 1. Persistence and schema drift

`Models/User.cs` requires `SupabaseUserId`, but `Migrations/20260808064703_InitialCreate.cs` creates no such column. The migration instead creates nullable `PasswordHash` and `GoogleId` columns that are absent from the current model. `AuthController.SyncProfile` queries and inserts by `SupabaseUserId`, so a database created from the checked-in migration is incompatible with the current application model.

The migration also has no Trust case, evidence, source document, provider observation, Passport event, Community, Expert, audit, session, or storage model. It cannot become StudentHub's canonical data plane.

**Decision:** reject direct schema merge. Derive a compatibility fixture only; design StudentHub-owned migrations and RLS separately.

### 2. Identity and privacy boundary

`AuthController` correctly takes the subject and email from validated claims for its profile path, but `UsersController.GetUsers` has no `[Authorize]` attribute and returns `Id`, Supabase subject, email, full name, role, TrustScore, verification status, and creation time for every user.

**Decision:** reject the listing behavior. StudentHub identity must remain server-derived, and every read must have explicit authorization, ownership/privacy projection, pagination, and negative tests.

### 3. Layer 2 semantic error

`Layer2VerificationService` returns `SAFE` with `0.95` when Google Safe Browsing returns no matches (`Layer2VerificationService.cs:236-246`). A no-match result only means that the provider reported no known threat for that query; it is not evidence that the URL is safe.

The same service embeds the API key in the query string, has no explicit request cancellation or bounded response read, exposes the upstream response body on HTTP failure (`:180`), and returns `ex.Message` (`:264`). It catches all exceptions into a provider result but does not distinguish timeout, rate limit, authentication failure, malformed response, or unavailable state.

**Decision:** retain the Google integration principle, reject its result semantics and error surface, and adapt through a typed `UrlThreatProvider`.

### 4. Layer 3 epistemic and boundary problems

`Layer3VerificationService` sends `TAVILY_API_KEY` in the JSON request body and accepts the provider's `answer` and result content as strings. It counts occurrences of words such as `false`, `fake`, `debunked`, `true`, and `verified` to produce a `FAKE` stop decision (`:187-233`). The service returns the provider answer in the user-facing reason and includes `ex.Message` on unexpected failure (`:280-283`).

There is no canonical source-document identity, observation identity, retrieval run, content fingerprint, prompt-injection flag, source allowlist, URL normalization, or bounded result-content policy in this service.

**Decision:** Tavily may acquire evidence; it may not own truth. Keyword counts may at most survive as a low-authority `LEGACY_HEURISTIC_SIGNAL`.

### 5. Layer 4 contract and provenance problems

`Layer4VerificationService` performs a second Tavily search, which is a useful independent-retrieval idea, but it groups both Layer 3 and Layer 4 records by URL (`:120-126` and `:148-154`). This collapses separate observations and prevents the required provenance distinction when the same document is seen by multiple layers.

The service sends bounded text excerpts but has no strict request/result schema, no response-size guard, no evidence-ID allowlist, no validation that model-returned sources are supplied sources, and no typed provider-state record. It accepts AI `confidence`, `evidenceAgreement`, and `sourceQuality`, clamps them, and uses them to determine `Stop` (`:1039-1078`). That is not a deterministic StudentHub decision policy. Research and model failures are mostly swallowed into `null`/`UNKNOWN`, which loses operational state such as timeout, rate limit, malformed response, or authentication failure.

**Decision:** preserve Layer 3/Layer 4 independence as observations, but put both calls behind capability ports and make canonical policy independent of raw provider confidence.

### 6. Authentication and runtime hardening gaps

The host disables JWT audience validation (`Program.cs:51`), uses one hard-coded CORS origin, exposes all verification routes anonymously, has no visible global exception boundary, no health endpoints, no rate limiting, no circuit breaker, no bulkhead, no correlation/trace contract, and no RLS model. Anonymous provider-backed verification can therefore be used as an unbounded cost and abuse surface unless the canonical StudentHub API applies its own controls.

**Decision:** the friend host can be an isolated test target only. It is not an approved production ingress.

### 7. Dependency finding

`dotnet list package --vulnerable --include-transitive` reports high-severity advisory `GHSA-v5pm-xwqc-g5wc` for transitive package `Microsoft.OpenApi` version `2.0.0`. The source also reports an unused/unprunable `Microsoft.Extensions.Identity.Core` reference.

**Decision:** no package fix is applied to the friend repository. The issue is a promotion blocker and must be resolved or explicitly risk-accepted before any staging/live use.

## Preserve, adapt, reject

### Preserve as bounded capability

- Google Safe Browsing threat lookup as a provider observation.
- Tavily as evidence acquisition, with retrieval metadata and bounded content.
- Independent Layer 3 and Layer 4 retrieval attempts.
- Explicit `user`, `pro`, and `expert` request intent after contract versioning.
- Server-side provider credentials and an HTTP transport boundary.

### Adapt inside the anti-corruption layer

- Request and response DTOs into `friend.layer2.v1`, `friend.layer3.v1`, and `friend.layer4.v1` fixtures.
- Provider failures into `CONFIGURED`, `READY`, `DEGRADED`, `RATE_LIMITED`, `TIMEOUT`, `UNAVAILABLE`, `MALFORMED`, and `AUTH_FAILED` states.
- Legacy verdicts/confidence into advisory provider metadata only.
- Sources/evidence into `SourceDocument`, `EvidenceObservation`, `RetrievalRun`, `ProviderObservation`, and `ClaimEvidenceLink` records.
- Model selection into StudentHub capability routing.

### Reject as canonical behavior

- `NO MATCH => SAFE`.
- Keyword counting as the final truth decision.
- Raw exception messages or upstream response bodies in API output.
- URL-only evidence identity.
- AI/provider confidence as final Trust authority.
- The collaborator's global `TrustScore` field as expert authority.
- Anonymous direct frontend access to the friend service.
- Friend `Users` schema or Supabase database as StudentHub persistence.

## State transition matrix for the compatibility boundary

This matrix is the minimum state contract to use before Phase B/C implementation. Provider health and epistemic truth remain separate dimensions.

| State | Trigger | Action / system response | User-visible feedback | Error / boundary handling |
| --- | --- | --- | --- | --- |
| `NOT_CONFIGURED` | Legacy base URL or required provider is absent | Do not call the friend service; return typed unavailable metadata | “Legacy provider is not configured” | Never switch to demo or claim success |
| `VALIDATING_INPUT` | Canonical Trust request enters the adapter | Bound type/content, validate URL safety, create request/run identity | Loading state without a fabricated report | Reject empty, oversized, malformed, local/private, or unsupported input |
| `PROVIDER_CALLED` | Valid request is dispatched | Send only the approved DTO through the server adapter with timeout/cancellation | Stage is active | Do not expose URL, claim text, token, or upstream body in ordinary logs |
| `PROVIDER_SUCCESS` | Response is 2xx and matches the pinned schema | Normalize provider observation, source, evidence, timestamp, and provenance | Evidence collected / assessment available | Validate every enum, unit interval, array bound, URL, and evidence reference |
| `NO_KNOWN_THREAT` | Safe Browsing returns no threat match | Record the provider observation as no known threat | No known provider threat; further assessment may continue | Must not map to canonical `SAFE` by itself |
| `PARTIAL` | Retrieval returns some evidence but not a complete/verifiable answer | Preserve evidence and missing scope; continue only under canonical policy | Partial evidence / unresolved | `PARTIAL != COMPLETE`; no confidence promotion |
| `TIMEOUT` / `RATE_LIMITED` | Provider exceeds timeout or returns a rate-limit status | Map to typed provider state; apply bounded retry policy if allowed | Provider temporarily unavailable | Respect cancellation and `Retry-After`; enforce cost/elapsed budgets |
| `MALFORMED` | Non-JSON, oversized, schema-invalid, or untrusted response | Discard the invalid projection and append an audit event | Evidence unavailable / response could not be verified | Never pass raw provider data into Trust policy |
| `CANONICAL_PROJECTION` | Normalized observations reach TrustOrchestrator | Run deterministic StudentHub policy and append Passport event when authorized | Final state is truthfully labeled | Provider success cannot override policy; graph projection failure cannot corrupt decision |

## Phase A disposition

Phase A is complete as a repository-side audit and source pin. It is not a production-readiness claim. The active security incident means the overall program remains:

`MAXIMUM_PLATFORM_EVOLUTION_PARTIAL_HUMAN_ACTION_REQUIRED`

The next implementation phase is contract extraction from the exact DTOs, but it must not begin any remote deployment or database mutation. Operator action is required first for credential revocation/rotation and history/deployment review.
