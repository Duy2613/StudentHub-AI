# Coding Conventions

## 1) Naming Rules

| Item | Rule | Example | Evidence |
|---|---|---|---|
| Files | PascalCase components; camelCase services/utilities | `ActionCenter.jsx`, `safeExternalUrl.js` | `frontend/src/` |
| Functions/methods | camelCase; handlers use `handle*` | `handleExecuteAction` | `frontend/src/components/academic/ActionCenter.jsx` |
| Types/interfaces | PascalCase where TypeScript is used | Playwright config types inferred | `frontend/playwright.config.ts` |
| Constants/env vars | UPPER_SNAKE_CASE | `FETCH_MAX_BYTES`, `DATABASE_URL` | `frontend/src/lib/intelligence/academic/academicDocumentFetcher.js` |

## 2) Formatting and Linting

- Formatter: no repository formatter config found (`[TODO]` team formatter policy).
- Linter: ESLint 9 with Next Core Web Vitals and TypeScript configs.
- Relevant rules: Hooks correctness/purity, unused variables, exhaustive dependencies, Next image guidance; currently warnings.
- Commands: `npm run lint`; `npx --no-install tsc --noEmit`.

## 3) Import and Module Conventions

- External imports precede project imports in representative files, but no explicit sort rule is configured.
- Prefer `@/` for source imports; tests use relative paths where Node resolves source directly.
- No universal barrel-export policy is evident.

## 4) Error and Logging Conventions

- Domain/API code returns typed error states or throws at explicit boundaries; malformed Trust responses fail closed.
- Auth logs use `[AUTH_ERROR]` / `[AUTH_INFO]`; security modules have contextual audit loggers.
- Secret values must not be logged; current static scan found no tracked credential file other than the allowlisted example.

## 5) Testing Conventions

- Node tests use `*.test.mjs` under domain folders; browser tests use `*.spec.ts` under `tests/e2e`.
- Isolation uses injected providers/transports, route interception and deterministic fixtures.
- No coverage percentage threshold is configured; risk-based gates are lint/typecheck/build/regression/E2E/Lighthouse.

## 6) Evidence

- `frontend/eslint.config.mjs`
- `frontend/tsconfig.json`
- `frontend/tests/security/safe_external_url.test.mjs`
- `frontend/tests/e2e/trust.spec.ts`
