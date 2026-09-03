# Codebase Structure

## 1) Top-Level Map

| Path | Purpose | Evidence |
|---|---|---|
| `frontend/` | Deployable Next.js application and its tests | `frontend/package.json` |
| `frontend/src/app/` | App Router pages, layouts and route handlers | `frontend/src/app/layout.tsx`, `frontend/src/app/api/` |
| `frontend/src/components/` | UI grouped mainly by product domain | `frontend/src/components/trust/`, `community/`, `expert/` |
| `frontend/src/lib/` | Domain engines, security, data and integration adapters | `frontend/src/lib/intelligence/`, `security/`, `server/` |
| `frontend/tests/` | Node regression, security, integration and browser suites | `frontend/tests/e2e/`, `frontend/tests/security/` |
| `ai/` | Datasets and trained model artefacts | `ai/dataset/`, `ai/models/` |
| `docs/` | Architecture, release evidence and permanent vault | `docs/vault/Index.md` |
| `.agents/`, `.github/skills/` | Project agent/design rules and reviewed skills | `.agents/DESIGN.md`, `docs/ai/skill-registry.md` |

## 2) Entry Points

- Main runtime entry: `frontend/src/app/layout.tsx` plus App Router pages.
- Server entry points: route handlers beneath `frontend/src/app/api/`.
- Secondary CLI/jobs: root `scripts/run-discovered-tests.mjs`; frontend staging, bundle and Lighthouse scripts/config.
- Selection: npm scripts in root and frontend manifests delegate to Next or Node.

## 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|---|---|---|
| `src/app` | Routing, page composition, HTTP boundary | Deep domain algorithms |
| `src/components/<domain>` | Product UI and local interaction state | Database credentials or authorization decisions |
| `src/lib/intelligence` | Trust, community, expert and academic domain logic | Route-specific presentation |
| `src/lib/security` | Identity, capability and validation boundaries | Visual state |
| `src/lib/server` / `src/lib/db` | Persistence and server-only adapters | Browser-only APIs |
| `tests` | Contracts, fixtures and browser journeys | Production fallbacks |

## 4) Naming and Organization Rules

- React components use PascalCase; services/stores/utilities generally camelCase or PascalCase classes.
- Directories mix product-domain organization with technical sublayers.
- `@/*` resolves to `frontend/src/*`; nearby tests often use relative imports.

## 5) Evidence

- `docs/vault/01 - 🏗️ System Architecture/System-Architecture.md`
- `frontend/tsconfig.json`
- `frontend/src/app/api/[...path]/route.js`
- `frontend/src/components/trust/AiTrustStudioView.jsx`
