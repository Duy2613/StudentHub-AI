# UI Regression Ledger

| Finding | Severity | Evidence | Change | Retest / status |
|---|---|---|---|---|
| Onboarding visible carousel linked to stale `/dashboard` and `/forum` paths and showed fabricated dashboard/trust metrics. | P1 content/navigation defect | Code review plus route-contract scan; onboarding itself is not in the current browser screenshot matrix. | Replaced cards with current Trust, Expert, Community, and Profile destinations and capability-accurate descriptions. | Static contract test passes; no dedicated before/after browser capture. Fix is code-complete; visual evidence remains partial. |
| Trust, Community, Expert, and Omni audited responsive/accessibility states | No new defect found | Three-core E2E: 100 passed, 2 intentional skips, 0 failed across Chromium, Firefox, WebKit. 239 deterministic screenshots. | No new UI patch required. | PASS for exercised states; not every screenshot-required route or live-auth state was covered. |

Known UI defects: 1 found, 1 fixed. `P0_UI_OPEN=0`; `P1_UI_OPEN=0`. Overall `UI_UX=PARTIAL` because the onboarding before/after visual evidence and the full 25-page screenshot matrix are absent. The screenshot manifest points to isolated deterministic captures, never live user data.
