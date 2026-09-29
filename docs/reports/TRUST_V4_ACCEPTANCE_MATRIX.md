# Trust V4.2 acceptance matrix

Status: PARTIAL overall. Local assertions below use contract-validated fixture responses and an isolated production build; they do not assert live persistence or provider readiness. Full results: `artifacts/visual/TRUST_V4/2026-09-28/`.

| ID | Scenario / expected behavior | Method |
|---|---|---|
| C1 | Null/unknown metrics and enums remain unknown | PASS · projection tests |
| C2 | Source-only records never become supporting evidence | PASS · projection test |
| C3 | Claim/evidence/source identity and contradictions preserved | PASS · projection and rendered browser evidence |
| A1 | Late/foreign run cannot overwrite result; submission is guarded while pending | PASS for identity/monotonic guards; double-click/tabs have no separate automated assertion |
| A2 | Draft edit/new failed request preserves labeled old result | PASS · browser |
| A3 | Viewer change clears private state | Implemented as principal-keyed remount; multi-account browser switch not exercised |
| I1 | Canonical Expert sheet opens with exact case and revision; old assessment is labelled | PASS · isolated browser; assessment rows synthetic |
| I2 | Canonical Community preview uses exact case and revision | PASS · preview only; no publish request sent |
| F1 | Fixture markers rejected; external/DB/provider writes absent from browser harness | PASS · unit marker rejection and API interception |
| U1 | Keyboard escape, Axe severe/critical, zoom and text spacing | PASS for keyboard and Axe serious/critical scan; manual zoom/AT not certified |
| U2 | 360/390/768/1024/1280/1440/1920, light/midnight/system | PASS · 21 viewport/theme combinations, no horizontal overflow |
| P1 | Five-sample LAB measurements against declared targets | PASS · medians 267.5 ms input, 641.5 ms result, 124.7 ms interaction, 389,836 script bytes; LAB proxies, not field INP/CWV |
| R1 | Relevant Community/Expert regressions | PASS · 9/9 scoped contract tests |
| B1 | Build, TypeScript, task lint | Build + TypeScript PASS; lint 0 errors, 6 warnings (5 shared image warnings, 1 post-hydration theme state sync) |

Trust model and anti-tamper tests: PASS · 10/10. Isolated production Playwright suite: PASS · 8/8. See `artifacts/visual/TRUST_V4/2026-09-28/` for logs, status, screenshots and measurement samples.
