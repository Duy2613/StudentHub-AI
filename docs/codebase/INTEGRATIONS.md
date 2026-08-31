# External Integrations

## 1) Integration Inventory

| System | Type | Purpose | Auth model | Criticality | Evidence |
|---|---|---|---|---|---|
| Supabase | Auth/data API | Identity and configured data access | anon key + user session/OIDC | High | `frontend/src/lib/supabase/client.js` |
| StudentHub backend | HTTP API | Same-origin proxied application APIs | bearer/session boundary | High | `frontend/src/app/api/[...path]/route.js` |
| PostgreSQL | Database | Durable repositories and sessions | server `DATABASE_URL` | High | `frontend/src/lib/server/database/PostgresPool.js` |
| Gemini | Model provider | Semantic/trust reasoning when configured | server API key | Medium | `frontend/src/lib/ai-trust/layer2/providers/`, `layer4/providers/` |
| URLhaus | Threat-intelligence API | URL reputation evidence | provider contract | Medium | `frontend/src/lib/ai-trust/threat-intel/urlhausClient.js` |
| HCMUTE sources | HTTP documents/RSS | Official academic evidence | public HTTP, authority registry | Medium | `frontend/src/lib/intelligence/academic/academicSourceRegistry.js` |

## 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|---|---|---|---|---|
| PostgreSQL | Durable production records/sessions | `PostgresPool`, repositories | live RLS proof needs dedicated env | `frontend/src/lib/server/database/` |
| Supabase | Identity and optional data adapter | Supabase provider proof in page memory; application identity in HttpOnly cookie | live browser refresh/restart proof pending | `frontend/src/lib/supabase/client.js` |
| `.data` JSON | Local/test persistence | domain stores/DatabaseAdapter | unsuitable for multi-instance production | `frontend/src/lib/db/DatabaseAdapter.js` |
| In-memory stores | deterministic tests/dev escape hatch | injected adapters | restart loss if enabled outside test/dev | `frontend/src/lib/db/DatabaseAdapter.js` |

## 3) Secrets and Credentials Handling

- Credentials come from environment variables documented in `frontend/.env.local.example`.
- Static filename/pattern and npm production audits found no exposed credential; `.env.local` is ignored and untracked.
- Rotation ownership and secrets-manager lifecycle are `[TODO]`.

## 4) Reliability and Failure Behavior

- Trust UI maps 401/403/429/503, invalid JSON/schema and out-of-order requests to explicit recoverable states.
- Academic fetching uses AbortController timeout and a 5 MB response cap; provider-specific retry is partial.
- No repository-wide circuit breaker was found.

## 5) Observability for Integrations

- Auth/security/provider modules emit contextual logs and correlation references in tested API failures.
- Central production metrics/tracing backend is `[TODO]`; lab Lighthouse and browser traces are local evidence only.

## 6) Evidence

- `frontend/.env.local.example`
- `frontend/src/app/api/[...path]/route.js`
- `frontend/src/lib/intelligence/academic/academicDocumentFetcher.js`
- `frontend/tests/e2e/trust.spec.ts`
