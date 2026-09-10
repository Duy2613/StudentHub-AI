# STUDENTHUB AI — KHAI MINH MASTER VISUAL SYSTEM
## PRODUCTION DESIGN SPECIFICATION (POST-PHASE C INTEGRATION)
**Version:** 2.0.0 (Production Verified)
**Date:** 2026-09-10

---

### 1. Brand Philosophy & Core Ratio
**"KHAI MINH — HIỂU ĐÚNG. ĐI XA."**
- **70% Editorial Calm:** Clean typography, generous white/dark space, mineral surfaces.
- **20% Product Precision:** Bounded micro-springs, razor-sharp borders, exact citation metadata.
- **10% Cinematic Wonder:** Optical prism refractions, spectral sweeps, 2.5D orbital SVG maps.

---

### 2. Design Tokens & CSS Architecture
All tokens are defined in `frontend/src/app/globals.css`:
```css
:root {
  --motion-instant: 100ms;
  --motion-feedback: 150ms;
  --motion-component: 250ms;
  --motion-panel: 350ms;
  --motion-section: 500ms;
  --motion-hero: 800ms;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --ease-emphasis: cubic-bezier(0.05, 0.7, 0.1, 1);
}
```

### 3. Glassmorphism Guardrails (Knowledge Glass)
- Standard blur ceiling: `4px` to `8px`.
- Mobile fallback: `0px` to `4px` or opaque mineral surface.
- Nested blurs: Strictly forbidden.
- Contrast: Background `rgba(15, 23, 42, 0.65)` on dark mineral base with `rgba(255, 255, 255, 0.08)` border.

### 4. Media Primitives & Derivatives
- Component: `<KhaiMinhMedia />`
- Formats: WebP (Desktop 1440w, Tablet 1024w, Mobile 640w, OG 1200w).
- Sizing budget: ~82 KB average per asset variant.
- Focal point alignment: Controlled via `object-position` metadata from `khaiMinhRegistry.ts`.

### 5. Accessibility & Reduced Motion
- `@media (prefers-reduced-motion: reduce)` overrides:
  - All transforms set to 0.
  - All parallax, magnetic springs, and continuous orbits disabled.
  - Transitions capped at 150ms.
- High-contrast text: Contrast ratios exceed WCAG AA on all routes.
- Touch target sizing: All interactive elements maintain >= 44x44px target bounds.
