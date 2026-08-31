# Architecture

## 1) Architectural Style

- Primary style: product-domain modules behind Next.js App Router, with layered domain/security/persistence libraries.
- Evidence: canonical pages compose domain views, while `src/lib/intelligence`, `src/lib/security`, `src/lib/server` and `src/lib/db` own non-visual logic.
- Constraints: the repository is JavaScript-heavy with strict TS checking enabled; browser and server concerns coexist in one app; local file/memory adapters exist alongside PostgreSQL/Supabase paths.

## 2) System Flow

```text
App Router page -> domain view -> same-origin API route -> validated domain/provider layer -> repository/integration -> typed response -> explicit UI state
```

1. `/trust`, `/community` and `/expert` pages mount their product views.
2. Views validate local input and call same-origin API contracts.
3. route handlers validate identity/input and dispatch into domain services.
4. services combine deterministic engines, providers and evidence stores.
5. adapters reach PostgreSQL/Supabase, local persistence or approved external providers.
6. UI renders loading, partial, error or result states; UNKNOWN is not converted to success.

## 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|---|---|---|---|
| Product pages/views | User flow and presentation state | Authorization truth | `frontend/src/components/trust/AiTrustStudioView.jsx` |
| API routes | HTTP/auth/validation boundary | Long-lived UI state | `frontend/src/app/api/` |
| Intelligence modules | Claims, evidence, verdict and academic rules | Route layout | `frontend/src/lib/intelligence/` |
| Security fabric | Token/session/capability validation | Client visibility policy alone | `frontend/src/lib/security/` |
| Persistence adapters | Durable or local storage contracts | Product copy | `frontend/src/lib/db/DatabaseAdapter.js` |

## 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---|---|---|
| Adapter/strategy | `DatabaseAdapter.js`, provider folders | Select real/test/local implementations behind contracts |
| Repository/store | `src/lib/intelligence/**/**Store.js` | Isolate domain persistence |
| Runtime schema | API contracts using Zod | Fail closed on malformed responses |
| Registry | `academicSourceRegistry.js` | Centralize source authority metadata |
| Capability/identity services | `src/lib/security/` | Keep authorization server-side |

## 5) Known Architectural Risks

- Raw browser fetch and auth storage responsibilities remain distributed; cookie-only session cutover is incomplete.
- File/memory adapters are useful for deterministic tests but must be fail-closed in production and do not replace live RLS evidence.
- Large JavaScript domain/UI files increase review cost despite strong regression coverage.

## 6) Evidence

- `frontend/src/app/api/[...path]/route.js`
- `frontend/src/lib/intelligence/`
- `frontend/src/lib/security/identity/IdentityResolver.js`
- `frontend/src/lib/db/DatabaseAdapter.js`
