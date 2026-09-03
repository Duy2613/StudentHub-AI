# Testing Patterns

## 1) Test Stack and Commands

- Primary test frameworks: Node built-in test runner and Playwright 1.62.1; axe-core augments browser accessibility tests.
- Assertions/mocking: `node:assert/strict`, Playwright `expect`, injected providers/transports and network route interception.

```bash
node scripts/run-discovered-tests.mjs
node --test tests/security/safe_external_url.test.mjs
npm run test:e2e
npm run test:e2e:staging
npm run lighthouse
```

## 2) Test Layout

- Node tests: `frontend/tests/<domain>/*.test.mjs`.
- Browser tests: `frontend/tests/e2e/*.spec.ts`; visual snapshots are browser/platform specific.
- Playwright setup, projects, server and retries: `frontend/playwright.config.ts`; staging is separate.

## 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|---|---|---|---|
| Unit | Yes | validators, engines, stores, security utilities | Node runner |
| Integration | Yes | API/data/security/domain pipelines | mostly deterministic providers/adapters |
| E2E | Yes | Trust, Community, Expert, navigation, responsive, a11y | Chromium/Firefox/WebKit |
| Live staging | Configured, unverified locally | approved real provider cases | requires staging URL/case inputs |

## 4) Mocking and Isolation Strategy

- Domain services accept injected transports/providers; Playwright intercepts HTTP for deterministic failure paths.
- Stores expose reset/test adapters where required; production fallback behavior is separately guarded.
- Common failure mode: excessive parallel browsers saturate Next dev on-demand compilation; local config now runs one worker.

## 5) Coverage and Quality Signals

- Coverage tool/threshold: `[TODO]`; no percentage gate found.
- Current signals: 240/240 discovered test files, build/typecheck pass, isolated browser suites pass, Lighthouse assertions pass.
- Known gaps: live staging/provider and live PostgreSQL/RLS require unavailable environments; Firefox default cache path is blocked on this host, while a clean temp cache passes.

## 6) Evidence

- `scripts/run-discovered-tests.mjs`
- `frontend/playwright.config.ts`
- `frontend/playwright.staging.config.ts`
- `frontend/tests/e2e/accessibility.spec.ts`
