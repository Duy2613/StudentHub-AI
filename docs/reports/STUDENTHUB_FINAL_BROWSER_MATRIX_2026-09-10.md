# StudentHub AI — Final Browser Matrix

Date: 2026-09-10
Local target: isolated development server with loopback-only local Supabase overlay

## Results

| Runtime | Result | Notes |
|---|---:|---|
| Chromium desktop | `99 passed`, `3 skipped` | Full current RC matrix; three skips are the intentionally disabled competition demo tests. |
| Firefox desktop | `95 passed`, `3 skipped` | Full matrix plus focused post-fix accessibility test `1/1`. |
| WebKit desktop | `95 passed`, `3 skipped` | Full matrix plus focused post-fix Expert directory tests `3/3`. |
| Chromium mobile | `27/27 passed` | Navigation and responsive matrix; narrow/mobile-large coverage included. |
| agent-browser | `PASS` | Landing content, evidence chapter, command dialog, screenshot, and empty console-error capture. |

The three intentional skips in each desktop matrix are the competition-demo cases disabled by the local environment. They are not counted as passes. The authenticated local Expert journey is recorded separately in `artifacts/local-authenticated-e2e-2026-09-10.json` and its dedicated report.

## Covered behavior

- Core navigation and canonical redirects.
- Trust input/result/graph states and typed evidence controls.
- Community and Expert honest empty states.
- Expert authority-boundary UI.
- Keyboard/focus and dialog semantics.
- Reduced-motion behavior and responsive layout checks across mobile, tablet, desktop, and wide viewport assertions.
- Vietnamese typography and diacritic rendering contracts.
- Current visual-regression baselines for Trust, TrustGraph, Community, and Expert.

## Console/network boundary

The required agent-browser landing capture recorded no `console.error`. Local authenticated testing used `LOOPBACK_ONLY` server networking and rejected cloud Supabase hosts in the browser guard; violations were `[]`. Dev-only informational/HMR and non-blocking image/LCP warnings are not release errors.

## Scope limi

This report does not claim a fresh browser crawl of every dynamic/legacy route, field Core Web Vitals, or a deployed preview/production environment. `preview-qa.spec.ts` remains an external-target check and was not converted into a local pass.

\n