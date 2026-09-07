# Frontend Performance Verification

Verified: 2026-09-06 (Asia/Bangkok)

This page records evidence for the current working-tree release candidate. Local synthetic measurements are evidence for this machine and profile only; they do not prove field Core Web Vitals.

## Production build and bundle evidence

`npm run build` completed with Next.js 16.3.0/Turbopack, TypeScript validation, and 135/135 static pages generated. The canonical bundle check also passed:

| Route | Initial JavaScript | Initial chunks | Result |
| --- | ---: | ---: | --- |
| `/` | 204,993 bytes | 5 | PASS — below the 500,000-byte budget |
| `/learn/cs101/fullstack-intro` | 129,995 bytes | 5 | PASS — quiet lesson route |
| `/roadmap` | 140,563 bytes | 5 | PASS — roadmap route |
| `/trust` | 142,244 bytes | 5 | PASS — analysis island remains interaction-driven |
| `/community` | 124,458 bytes | 5 | PASS — informational baseline |
| `/expert` | 124,452 bytes | 5 | PASS — informational baseline |

Command: `npm run audit:bundle`. Each route is checked against a 500,000-byte limit.

The landing Knowledge Universe starts with a semantic SVG fallback and upgrades to WebGL after the interaction/idle boundary. Trust analysis, OCR, command palette, auth bootstrap, Lenis enhancement, and other optional graphs remain deferred until their trigger. Video and card media use lazy loading and bounded readiness fallbacks.

## Fresh canonical Lighthouse evidence

The latest build was served locally on port 3200 and measured with Lighthouse CLI 13.4.1 using one fresh synthetic mobile run per route: 360×640 viewport, device scale factor 2, DevTools mobile throttling, headless Chromium, and Vietnamese locale. The helper deletes each output before starting a run, so missing output cannot silently reuse a stale artifact. JSON files are under `frontend/.lighthouseci/academic-mobile/final-canonical/`.

| Route | Performance | Accessibility | Best practices | SEO | LCP | FCP | CLS | TBT | Gate interpretation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 0.90 | 1.00 | 0.96 | 1.00 | 2,771.6 ms | 2,771.6 ms | 0.000 | 76.8 ms | LCP over 2,500 ms target |
| `/learn/cs101/fullstack-intro` | 0.90 | 0.98 | 0.96 | 1.00 | 2,630.2 ms | 2,630.2 ms | 0.000 | 131.1 ms | LCP over 2,500 ms target |
| `/roadmap` | 0.93 | 0.98 | 0.96 | 1.00 | 2,572.1 ms | 2,572.1 ms | 0.000 | 37.2 ms | LCP over 2,500 ms target |
| `/trust` | 0.90 | 1.00 | 0.92 | 1.00 | 2,706.8 ms | 2,706.8 ms | 0.000 | 166.6 ms | LCP over 2,500 ms target |

The four JSON reports are valid and contain the metrics above (`LIGHTHOUSE_METRICS_VALID`). The helper exits 1 after every run because Lighthouse cannot remove its temporary Chrome profile on Windows (`EPERM`); this is recorded separately as `LIGHTHOUSE_RUNNER_TEARDOWN_FAIL_WINDOWS_EPERM`. The assertion profile still treats LCP over 2,500 ms as a failure. The current sample is `n=1`, so no stability claim is made from a median of multiple runs.

Lighthouse reports unused JavaScript estimates of about 124–230 KiB depending on route. That is optimization debt, not a runtime correctness failure. TBT stays below the 200 ms local target in this sample, and CLS is zero on all four routes.

## CSS, fonts, and media

The production build emits one shared CSS asset of 408,895 raw bytes (53,278 bytes gzip) plus route assets of 6,402–14,865 raw bytes. The shared file contains Tailwind utilities, theme tokens, global layout/margin rules, and shared component styles. It is the clearest remaining payload target, but it was not blindly split during the feature freeze because route ownership and cascade behavior still need a measured follow-up.

Runtime font declarations contain only Be Vietnam Pro, Lora, and JetBrains Mono. Instrument Serif, Plus Jakarta Sans, and Inter Tight are absent from `frontend/src`. Fonts use a fallback-safe display policy, and no route depends on a font resource to form its text LCP candidate.

The canonical route traces contain no `/wallpapers/` requests. The previous wallpaper flood is therefore not competing with first paint. Cinematic video readiness is bounded by an idle timeout and falls back to the static layer when media is unavailable.

## Interaction and accessibility evidence

Chromium and WebKit each passed 37/37 tests covering:

- command palette, Knowledge Atlas, quiet Lesson, repeated WebGL navigation, and console stability;
- 14 axe/keyboard checks, including the completed Trust result;
- hydration, deferred UI, TOC, AI drawer, Trust activation, and Atlas filter User Timing marks;
- Trust V5 seven-stage rendering with explicit meaning, non-proof, evidence, limitation, and next-stage boundaries;
- invalid URL/file validation, insufficient-evidence fail-closed behavior, 401/403/429/503 recovery, print gating, and scan idempotency;
- the late Scan A versus Scan B race, with the latest draft preserved and the result bound to the latest submission;
- SSR/client auth capability copy stability on `/login` with no hydration error.

The release-assurance marks show hydration, media, navigation, TOC, AI drawer, Trust, and Atlas timings. Chromium exposes Event Timing entries; WebKit reports the API as unavailable on one navigation, so this is instrumentation evidence rather than a field INP measurement. Real-device input and field INP remain unverified.

## Quality and evidence boundaries

- `npm run lint`: PASS with 0 errors and 404 warnings. Warnings are existing test/component debt, primarily unused test symbols and a small number of hook dependency/set-state warnings.
- `npm run test:all`: PASS (exit 0). Targeted security, auth, Trust, integration, and migration contract suites also pass.
- Firefox: BLOCKED_BY_ENVIRONMENT — Playwright executable launch returns `spawn UNKNOWN` for the installed Firefox binary.
- Real mobile hardware: NOT TESTED (`REAL_DEVICE_NOT_VERIFIED`).
- Field/RUM Core Web Vitals: NOT TESTED (`FIELD_CWV_NOT_AVAILABLE`).
- Screen-reader pass: NOT TESTED.
- Live PostgreSQL/RLS: BLOCKED when `STUDENTHUB_RLS_TEST_DATABASE_URL` is absent; the contract suite remains green, but this is not live database evidence.
- Staging provider/Labbe: BLOCKED when the required staging URL, token, scope, and test database variables are absent. No remote or deployment action was performed.
- Rollback: defined in the release procedure, NOT EXECUTED (`ROLLBACK_DEFINED_NOT_EXECUTED`).
- Local liveness/readiness probes and production restart: PASS. Staging restart persistence and external observability sink: NOT TESTED.
- Browser OCR worker timeout remains a bounded client hint (`CLIENT_OCR_HINT`); the UI fails safely, while OCR accuracy and warm-cache latency are not release evidence.

The current local pass closes the reproducible UI, hydration, Trust race, bundle, and contract defects found in this assurance cycle. It does not clear the release gate while the Lighthouse LCP target, Firefox, real-device/field data, staging/provider, live PostgreSQL/RLS, rollback execution, and external observability evidence remain open.
