# Technology Stack

## 1) Runtime Summary

| Area | Value | Evidence |
|---|---|---|
| Primary language | JavaScript/JSX with a smaller strict TypeScript surface | `frontend/src/`, `frontend/tsconfig.json` |
| Runtime + version | Node.js 24.x | `.nvmrc`, root/frontend `package.json`, CI workflow |
| Package manager | npm 11.x | root/frontend `package.json`, `frontend/package-lock.json` |
| Module/build system | ES modules, Next.js App Router and Turbopack build | `frontend/package.json`, `frontend/next.config.ts` |

## 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|---|---:|---|---|
| Next.js | 16.3.0 | Application framework, routing, server routes | `frontend/package.json` |
| React / React DOM | 19.2.8 | UI runtime | `frontend/package.json` |
| Tailwind CSS | 4.x | Styling toolchain | `frontend/package.json`, `frontend/postcss.config.mjs` |
| Supabase JS | ^2.112.3 | Authentication and Supabase access | `frontend/src/lib/supabase/client.js` |
| pg | ^8.23.0 | PostgreSQL access | `frontend/src/lib/server/database/PostgresPool.js` |
| Zod | ^4.4.3 | Runtime contracts | `frontend/package.json` |
| jose | ^6.2.10 | JWT/OIDC verification | `frontend/src/lib/security/identity/` |
| Tesseract.js / jsQR | ^7.0.0 / ^1.4.0 | Client-side OCR and QR hints | `frontend/package.json` |

## 3) Development Toolchain

| Tool | Purpose | Evidence |
|---|---|---|
| TypeScript 5.9.3 resolved | Strict type checking with JS allowed | `frontend/tsconfig.json`, `npm ls --depth=0` |
| ESLint 9 + Next config | Lint/Core Web Vitals rules | `frontend/eslint.config.mjs` |
| Playwright 1.62.1 + axe | E2E, visual and accessibility checks | `frontend/playwright.config.ts` |
| LHCI 0.15.1 (ephemeral) | Lab performance gates | `frontend/lighthouserc.cjs`, `frontend/package.json` |

## 4) Key Commands

```bash
npm ci
npm run build
npm test
npm run lint
npm run test:e2e
npm run lighthouse
```

## 5) Environment and Config

- Config sources: `frontend/next.config.ts`, `frontend/tsconfig.json`, `frontend/eslint.config.mjs`, `frontend/vercel.json`.
- Declared variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, `STUDENTHUB_SESSION_PEPPER`, `SUPABASE_JWT_AUDIENCE`, `DATABASE_SSL_REJECT_UNAUTHORIZED`, `STUDENTHUB_RLS_TEST_DATABASE_URL`.
- Deployment/runtime constraint: staging E2E additionally requires `STUDENTHUB_STAGING_BASE_URL`; supported runtime is Node 24.x with npm 11.x.

## 6) Evidence

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/.env.local.example`
- `frontend/next.config.ts`
