# UI Regression Ledger

| Finding | Severity | Evidence | Change | Retest / status |
|---|---|---|---|---|
| Onboarding visible carousel linked to stale `/dashboard` and `/forum` paths and showed fabricated dashboard/trust metrics. | P1 content/navigation defect | Code review plus route-contract scan; onboarding itself is not in the current browser screenshot matrix. | Replaced cards with current Trust, Expert, Community, and Profile destinations and capability-accurate descriptions. | Static contract test passes; no dedicated before/after browser capture. Fix is code-complete; visual evidence remains partial. |
| Trust, Community, Expert, and Omni audited responsive/accessibility states | No new defect found | Three-core E2E: 100 passed, 2 intentional skips, 0 failed across Chromium, Firefox, WebKit. 239 deterministic screenshots. | No new UI patch required. | PASS for exercised states; not every screenshot-required route or live-auth state was covered. |

Known UI defects: 1 found, 1 fixed. `P0_UI_OPEN=0`; `P1_UI_OPEN=0`. Overall `UI_UX=PARTIAL` because the onboarding before/after visual evidence and the full 25-page screenshot matrix are absent. The screenshot manifest points to isolated deterministic captures, never live user data.

## 2026-10-01 Trust four-layer presentation continuation

| Finding | Severity | Evidence | Change | Retest / status |
|---|---|---|---|---|
| Active Trust UI modeled five public stages while the canonical render backend publishes four `l1/l2/l3/l4` layers and a separate deterministic `finalPredict`; completed backend L2/L4 could appear waiting. | P1 contract comprehension | Compared the screenshot/video request, canonical render-backend commits `3d52e6c`, `4bfd4e9`, `554e8e7`, `80351be`, and real `FOUR_LAYER` response shape. | Keep the existing `OwnBackendTrustOrchestrator` and map its public stage IDs to four named UI layers; expose Final Predict only when published; keep evidence separate from source; preserve unavailable provider states. | Targeted contracts 28/28, changed-file ESLint PASS, isolated Trust Playwright 9/9, and production build/type PASS. Fixture only; no live provider or persistence claim. |
| Compact Trust composer retained a two-column layout; provider badge defaulted to `LIVE` without backend provenance; image/QR submit control was enabled before file selection. | P1 truthfulness and P2 responsive/input usability | First isolated screenshot review and browser assertions. | One-column compact composition, provenance-driven provider state defaults to `UNAVAILABLE`, and image/QR submit stays disabled until a supported file exists. | Included in Trust 9/9 isolated suite; responsive mobile 390 and upload states pass. |

The dedicated continuation screenshots are stored under `D:\StudentHub-CodexRuns\TRUST_VIDEO_REFERENCE_20261001\after\`; they are deterministic fixture captures. This supplements the earlier 239-capture manifest; it does not satisfy live-auth, production data, or all-surface visual sign-off.

The full run at `D:\StudentHub-CodexRuns\FULL_V4_THREE_CORE_20261001\2026-10-01T06-59-17-209Z-36960\` then passed 100/102 browser checks across Chromium, Firefox, and WebKit; the two skips are the Community screenshot-only matrix intentionally configured for Chromium. It generated 239 feature screenshots (33 Trust, 35 Community, 85 Expert, 85 Omni, 1 release smoke) plus traces. All screenshots are deterministic fixtures, not live user data.
