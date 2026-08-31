# Frontend Performance Verification

Verified: 2026-08-28

## Production bundle evidence

Measured from Next.js production client-reference manifests after `npm run build`.

| Route | Initial JavaScript | Initial chunks | Result |
| --- | ---: | ---: | --- |
| `/trust` | 360,164 bytes | 4 | PASS — below the 500,000-byte competition budget |
| `/community` | 325,808 bytes | 3 | PASS — informational baseline |
| `/expert` | 327,837 bytes | 4 | PASS — informational baseline |

Command: `node scripts/check-bundle-budget.mjs`.

The runtime Zod contract validator is loaded only when a Trust scan or Expert assessment starts. TrustGraph is also a client-only dynamic island. This keeps the route shell and primary input visible without front-loading analysis-only code.

## Responsive and motion evidence

- Playwright checks `/trust`, `/community`, and `/expert` at 360×800, 390×844, 768×1024, 1280×800, and 1440×900.
- All measured pages have no document-level horizontal overflow.
- `prefers-reduced-motion: reduce` collapses transition/animation duration to 0.01 ms and disables interactive transforms.
- Failure-only trace, screenshot, and video collection are enabled; the responsive suite also writes full-page screenshots into ignored test artifacts.

## Known performance debt

- The largest emitted shared CSS asset is 338,843 bytes. It contains broad legacy application styles and is the clearest remaining frontend payload target.
- These measurements are uncompressed file sizes from build artifacts, not network transfer sizes.
- No Lighthouse CI or field Core Web Vitals source is configured, so LCP/INP/CLS are not claimed.
- Browser OCR intentionally has bounded initialization/extraction timeouts. In this verification environment its language worker timed out and the UI failed safely with `CLIENT_OCR_HINT`; OCR accuracy and warm-cache latency were not re-benchmarked here.
