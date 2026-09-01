# 07 — Performance and React Architecture Gaps

**Audit date:** 2026-09-01  
**Scope:** existing performance evidence, bundle shape, media/effects, loading, and React/Next risk areas. No optimization was implemented.

## Current evidence

| Measure | Recorded evidence | Interpretation |
| --- | --- | --- |
| Trust route chunk | 379,110 bytes in the release audit | Below the documented 500 KB route budget |
| Community route chunk | 335,899 bytes in the release audit | Below budget, but the feed is long and seeded |
| Expert route chunk | 337,882 bytes in the release audit | Below budget, but the dossier and shell share broad styling |
| Older performance snapshot | Trust 360,164; Community 325,808; Expert 327,837 bytes on 2026-08-28 | Useful trend data, but not interchangeable with the later release-audit numbers |
| Shared CSS | 338,843 bytes recorded in frontend performance notes | Shared cost is more important than route-only chunk numbers |
| Global CSS | Approximately 82.6 KB / 2,013 lines | Large cascade and token surface |
| Atlas module CSS | Approximately 42.4 KB / 203 lines | Large, effect-rich landing surface |
| Fonts | Four loaded families in root layout | Multiple font downloads and typography drift |
| Dynamic loading | TrustGraph and OCR are dynamically loaded | Good direction; verify loading/error/fallback behavior |
| Lighthouse | Configuration exists with performance, accessibility, best-practices, SEO, LCP, CLS, and TBT assertions | Configuration is not a measured Lighthouse result; no field CWV evidence was found |

The release audit also records successful route/build/test evidence, but it does not establish LCP, CLS, INP, font cost, image cost, or mobile low-end performance.

## Performance risks

### Shared shell and CSS

The canonical app imports a large global stylesheet with multiple token families, legacy styles, gradients, shadows, and effect helpers. This creates both download cost and style recalculation/cascade risk. The Atlas adds a substantial CSS module with image backgrounds, 3D visual layers, and motion rules. A design-system phase should remove unused surface families only after route disposition is frozen.

### Fonts and visual identity

The root layout loads Plus Jakarta Sans, JetBrains Mono, Instrument Serif, and Inter Tight. Atlas also names Bodoni/Didot fallbacks. The brief asks for one main family plus an optional editorial family; the current four-family setup is a measurable performance and consistency decision.

### Canvas/WebGL inventory

The repository contains Aurora, fluid, constellation, Stardust, Hero3D, shader, forcefield, and other canvas/Three.js visual components. The dependency inventory alone does not prove that all are in the initial bundle, but it creates a high-risk path for landing and showcase work. The brief’s guardrail is sound: reserve 3D for the landing/key story, and keep Trust, Community, and Expert readable and predictable.

### Long pages and seeded content

The browser run measured approximate page heights of 8,416 px for the landing, 4,705 px for Trust, 8,055 px for Community, and 1,415 px for Expert at desktop. The long Community height is primarily repeated seeded observations; the long Trust height is the dense staged report. These are UX and interaction-cost issues as well as paint/scroll issues.

### Media

Landing imagery is referenced as local CSS backgrounds rather than a purpose-built responsive image/video system. Trust image uploads use local preview/OCR, but screenshot annotations and evidence-image lifecycle are not implemented. Before adding video or richer media, freeze poster, responsive crop, lazy loading, reduced-data fallback, and privacy rules.

## React and Next.js best-practice findings

- Trust uses abort controllers and a scan sequence guard, which is a good protection against stale async responses.
- The Trust clipboard listener effect has no dependency array. It cleans up, but the effect lifecycle should be made intentional in a future React pass.
- The UnifiedAppShell keydown listener has a stable empty dependency array and cleanup; this is a sound baseline.
- Community and Expert use local seeded stores, so initial data is deterministic, but this can hide production loading/error/empty behavior unless the provider boundary is explicit.
- Dynamic TrustGraph/OCR loading should expose a measured loading fallback and a failure path, especially on mobile and offline conditions.
- The command dialog, graph, and rich visual effects should not force large client boundaries into pages that could remain server-rendered. This needs a component-level bundle trace before implementation.
- Avoid adding GSAP to button-level interactions; use the existing motion router principle and keep GSAP to landing/trust storytelling only.

## Existing budget checks and their limits

The bundle budget script reports a PASS after summing static chunks. It does not calculate a true per-route dependency budget by itself. The documented route numbers therefore need to be paired with:

- initial JS by route and by shell;
- shared CSS and font transfer;
- image/video transfer and decoded dimensions;
- TrustGraph/OCR deferred chunk size;
- mobile CPU and memory behavior;
- measured LCP, CLS, and INP.

## Performance budgets to freeze

Recommended product-level budgets for the next specification:

| Asset or signal | Gate |
| --- | --- |
| Initial route JS | Keep current core route budget at or below 500 KB, then set a stricter target after trace data |
| Shared CSS | Track the current 338,843-byte recorded baseline and reduce before adding another visual system |
| Fonts | One body plus one editorial family; subset/preload only where measured |
| TrustGraph/OCR | Deferred, independently measured, cancellable, with list/text fallback |
| Landing effects | One primary cinematic effect; no automatic download of unused heavy canvas systems |
| Images | Responsive dimensions, modern formats, poster/fallback, lazy loading below the fold |
| Video | Muted/playsinline, poster, lazy, reduced-data fallback, no autoplay 4K |
| Core Web Vitals | Measure LCP, CLS, and INP on representative mobile and desktop runs |
| Error/auth noise | Separate expected unauthenticated 401 telemetry from actual request failures |

## Release posture

The current numbers support “under the known bundle budget,” not “performance complete.” The missing mobile clipping gate, field CWV data, route-level trace, and media budget prevent a performance-ready design handoff.
