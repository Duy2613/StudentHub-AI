# StudentHub AI — Public API, Model and Topic Plan

## Decision

StudentHub now has a bounded server-side Public Source Hub. The hub uses a
small set of public APIs selected from the [public-apis catalog](https://github.com/public-apis/public-apis)
and the providers' own documentation. The catalog is a discovery aid, not an
authority source and not a reason to enable every API listed there.

All outputs are explicitly marked `isAuthoritative: false`. They can provide
context, candidate discovery and metadata; they cannot produce a Trust verdict,
prove an institution policy, or replace the evidence/policy pipeline.

## Selected API surface

| API | StudentHub role | Evidence boundary |
| --- | --- | --- |
| [OpenAlex](https://help.openalex.org/api/) | Search scholarly works, institutions and topics; bounded institution homepage discovery | Academic metadata/index only; not official university policy evidence; homepage output is discovery-only |
| [Crossref REST](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | DOI metadata, publication dates, update/retraction signals | Publisher-submitted metadata; verify the publisher or official source before relying on it |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | Turn a campus/place name into bounded coordinates | Location context, not address ownership or identity proof |
| [Open-Meteo Forecast](https://open-meteo.com/en/docs) | Current and short-range weather context for travel/campus flows | Model forecast, not an emergency alert or field observation |
| [GDELT DOC 2.0](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) | Secondary news and scam-topic discovery | Discovery only; not an independent official source or consensus proof |

The MOET accreditation pages remain official discovery seeds only. They are
kept separate from public API output and do not hard-block retrieval when the
directory is unavailable. Opening and validating an official page is a later
evidence step.

The dedicated `PublicApiInstitutionDiscoveryAdapter` uses OpenAlex institution
metadata to widen entity/domain recall. It extracts only a bounded homepage,
domain, title and digest. Querying prefers resolver-confirmed institution names,
splits multi-entity claims into separate bounded queries, deduplicates repeated
queries, and skips claims without an institution signal.

## Topics for product routing

The registry maps API capabilities to these StudentHub topics:

`ADMISSIONS`, `SCHOLARSHIPS`, `TUITION_FINANCIAL_AID`,
`ACADEMIC_CALENDAR`, `COURSES_PREREQUISITES`, `GRADUATION_CREDENTIALS`,
`RESEARCH_TOPICS`, `INTERNSHIPS_CAREER`, `HOUSING_CAMPUS_LIFE`,
`CAMPUS_SAFETY`, `SCAM_PHISHING`, `WEATHER_TRAVEL`, and
`PUBLIC_POLICY_REGULATION`.

Academic APIs are limited to research-oriented topics. GDELT is limited to
secondary discovery. Weather APIs are limited to environmental context. This
prevents a generic public result from being silently promoted into a school,
government or safety authority.

## Model roles

The existing AI Gateway remains the model authority. The public catalog exposes
capabilities, not credentials:

- `FAST_CLASSIFICATION`: `gpt-5-nano`, with existing Gemini/deterministic fallback.
- `CLAIM_EXTRACTION`: `gpt-5-mini`, with Gemini/deterministic fallback.
- `DEEP_REASONING`: existing `gpt-5.6-luna`, with existing Gemini/GPT fallback.
- `MULTIMODAL_INSPECTION`: existing `gemini-3.8-flash`, with `gemini-3.6-flash` and local OCR fallback.
- `EMBEDDING`: intentionally `NOT_CONFIGURED`; deterministic lexical retrieval remains the honest fallback until a separately evaluated embedding provider is enabled.

No new paid model or secret is added by this integration. Provider keys remain
server-only in the existing AI Gateway configuration.

## Runtime contract

The implementation is under `frontend/src/lib/server/public-api/` and is
exposed through these anonymous, rate-limited Node.js routes:

- `GET /api/public/catalog`
- `GET /api/public/research?q=...&type=works|institutions|topics`
- `GET /api/public/discovery?q=...&topic=...&official=1` (`official=1` bật fetch official-source opt-in)
- `GET /api/public/weather?place=...` or `?lat=...&lon=...`

The outbound client enforces an origin allowlist, GET-only requests, bounded
paths and query parameters, a timeout, response byte limit, no redirect
following, typed upstream failures, and a provider-specific in-memory cache.
Raw upstream bodies and exception text do not cross the client boundary.

Trust integration remains explicit opt-in:
`TrustV5Engine.verify({ includePublicApiDiscovery: true, publicApiDiscoveryAdapter })`.
The resulting candidates carry `allowedUse: ENTITY_DISCOVERY_ONLY`,
`discoveryOnly: true`, `isPrimary: false` and `isAuthoritative: false`. A narrow
entity-match ordering boost may surface a useful candidate, but it never changes
the `UNKNOWN` authority tier or makes the candidate eligible to authorize a
Trust verdict.

## Acceptance and promotion gates

The adapter contract tests use deterministic fixtures. They prove normalization,
allowlisting, caching, size/rate-limit handling, partial-provider behavior,
minimal official-page extraction and the no-authority invariant. They do not
claim live uptime, latency percentiles, cost, or production API-key
availability.

Before public metadata can participate in Trust retrieval, the next evaluation
must separately establish:

1. official-source extraction and provenance for the MOET/university discovery path;
2. a fresh, OOD final retrieval holdout after the institution-discovery ranking freeze;
3. live provider evidence with rate-limit and failure observations;
4. no regression in source independence, privacy and security gates.
