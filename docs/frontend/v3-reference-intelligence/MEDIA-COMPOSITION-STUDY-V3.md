# MEDIA COMPOSITION STUDY V3: SPATIAL ARCHITECTURE & STATEFUL MEDIA
**Document ID:** `STU-V3-REF-MEDIA-001`  
**Classification:** Digital Art Direction, Visual Synthesis & Media Engineering  
**Role Scope:** Principal Digital Art Director, Creative Director, WebGL Experience Designer  
**Status:** Canonical Reference Intelligence for V3 Handoff  

---

## 1. Executive Diagnosis: Eradicating "Wallpaper Media"

### 1.1 The Owner's Direct Mandate
> *"Video/images technically exist but do not visibly transform the experience. They behave too much like background decoration."*

In StudentHub V2, video files (`VID-PRISM-01`, `VID-OPTIC-01`) were mounted in fixed full-screen containers (`position: fixed; inset: 0; opacity: 0.15; z-index: -1`) underneath heavy opaque background fills. This rendered them visually inert—dim, washed out, and disconnected from the semantic layout. They functioned as glorified desktop wallpaper rather than active storytelling instruments.

### 1.2 The V3 Paradigm Shift: The 6 Active Media Roles
In **V3**, media is elevated to an active structural participant in the DOM:
1.  **Spatial Composition:** Media anchors the visual grid, establishes optical margins, breaks rectangular bounding boxes via organic masks, and serves as an asymmetrical counterweight to dense typography.
2.  **Transition Material:** Media frames morph, dissolve, and compress dynamically across state changes (e.g., from an ambient refractive field into a razor-sharp telephoto inspection lens).
3.  **Focus Device:** Selective depth blur, radial clipping masks, and caustic vignettes actively guide the user's foveal vision directly to the active claim or disputed metric.
4.  **Depth Device:** Media participates in multi-plane z-index layering—partially occluded by large editorial serif headings while casting subtle chromatic caustics over foreground data cards.
5.  **State Response:** Media responds directly to runtime state machines (idle, scanning, conflicting evidence, verified synthesis).
6.  **Story Element:** Grounding abstract algorithmic claims in tangible academic and human realities.

---

## 2. Master Media Inventory & Choreography Matrix

All assets are strictly verified and locked in `frontend/public/media/studenthub-vnext/`:

| Asset ID | Source File | Specs & Footprint | Primary Route | Role & Architectural Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **`VID-PRISM-01`** | `landing-prism-atmosphere-desktop.mp4` | 435 KB (AV1/MP4), 1080p, 60fps | Landing (`/`) | **Environmental Spatial Anchor:** Embedded within an asymmetric 7:5 editorial grid. Occluded by Cormorant Garamond display headline. Uses `mix-blend-mode: screen` over deep slate tone. |
| **`VID-OPTIC-01`** | `trust-refraction-inspection-desktop.mp4` | 1.04 MB, 1080p, loop | Trust Workbench (`/trust`) | **Dynamic Optical Inspection Lens:** Transforms across 4 states (`IDLE` $\rightarrow$ `ANALYSIS` $\rightarrow$ `EVIDENCE` $\rightarrow$ `RESULT`). Tightens viewport vignette during active search. |
| **`VID-OPTIC-02`** | `trust-result-prism-desktop.mp4` | 274 KB, 1080p, 60fps | Trust Workbench (`/trust`) | **Result Synthesis Caustic:** Dormant until `RESULT_REVEAL`. Projects crystalline prism light behind the Monumental Verdict Headline. |
| **`VID-HUMAN-01`** | `landing-human-evidence-desktop.mp4` | 323 KB, 1080p, loop | Landing (`/`) | **Editorial Human Grounding:** Masks into an irregular pill/arch window alongside student testimonials and academic circular citations. |
| **`VID-HUMAN-02`** | `community-human-research-desktop.mp4` | 518 KB, 1080p, loop | Trust Post-Result | **Community Verification Anchor:** Stays 100% unmounted/dormant until user explicitly clicks "Xem kinh nghiệm cộng đồng". |
| **`VID-PRISM-02`** | `community-prism-corroboration-desktop.mp4`| 432 KB, 1080p, loop | Trust Post-Result | **Corroboration Multi-Source Transition:** Provides luminous background feedback when cross-referencing university registrar records. |
| **`HDRI-01`** | `hdri-monochrome-studio-1k.hdr` | 1.57 MB, 1024x512 | WebGL Canvas | **Light Studio Environment Map:** Supplies monochrome studio reflections to 3D prism nodes without requiring dynamic point lights. |

---

## 3. Detailed Choreography: VID-OPTIC-01 State Transformation Lifecycle

`VID-OPTIC-01` is the crown jewel of the Trust Workbench experience. Instead of a static loop, it undergoes a 4-stage optical metamorphosis:

```
[ STAGE 1: IDLE ]
Wide Refraction Field
scale(1.0), mask-radius: 85%, opacity: 0.35, blur: 0px
         │
         ▼ (User submits claim: "Cmd + Enter")
[ STAGE 2: ANALYSIS_FOCUS ]
Telephoto Optical Lens
scale(1.2), mask-radius: 38% (centered on query), opacity: 0.7, chromatic edge dispersion
         │
         ▼ (Backend streams incoming evidence nodes)
[ STAGE 3: EVIDENCE_ARRIVAL ]
Constellation Illumination
scale(1.05), mask-radius: 65%, opacity: 0.4, radial focus tracks incoming source clusters
         │
         ▼ (Synthesis engine completes verdict)
[ STAGE 4: RESULT_REVEAL ]
Yield & Crossfade
crossfade to VID-OPTIC-02 (274 KB) over 600ms, crystallizing behind verdict typography
```

### 3.1 CSS Masking & Dynamic Transform Specification
```css
/* Container enclosing the Trust Workbench Optical Lens */
.trust-optic-viewport {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100vw;
  max-width: 1440px;
  height: 640px;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

/* Base Video with CSS Mask */
.trust-optic-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: 
    transform var(--duration-macro) var(--ease-editorial-out),
    opacity var(--duration-macro) var(--ease-editorial-out),
    mask var(--duration-macro) var(--ease-editorial-out);
  
  /* STAGE 1: IDLE MASK */
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%);
  opacity: 0.35;
  transform: scale(1.0);
}

/* STAGE 2: ANALYSIS FOCUS MODE */
[data-workbench-state="ANALYSIS_FOCUS"] .trust-optic-video {
  opacity: 0.75;
  transform: scale(1.18);
  mask-image: radial-gradient(circle 360px at 50% 32%, black 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(circle 360px at 50% 32%, black 30%, transparent 75%);
  filter: contrast(1.15) saturate(1.1);
}

/* STAGE 4: RESULT CROSSFADE */
[data-workbench-state="RESULT_REVEAL"] .trust-optic-video {
  opacity: 0;
  transform: scale(0.95);
}
[data-workbench-state="RESULT_REVEAL"] .trust-result-video {
  opacity: 0.65;
  transform: scale(1.0);
  mask-image: radial-gradient(ellipse 80% 50% at 50% 25%, black 25%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 25%, black 25%, transparent 85%);
}
```

---

## 4. Typographic & Media Collision Techniques (Hobro Translation)

To solve Owner Feedback C and F, media must not sit politely inside a rounded gray card. It must collide aggressively with monumental typography:

```
┌──────────────────────────────────────────────────────────────────┐
│  H I E U   D U N G .                                             │
│  ┌─────────────────────────────┐                                 │
│  │   [ VID-PRISM-01 ]          │   D I   X A .                   │
│  │   Asymmetrical Video Box    │                                 │
│  │   Edge-cropped 16:9         │   Cormorant Garamond Display    │
│  │   mix-blend-mode: screen    │   120px / Line-height 0.95      │
│  └─────────────────────────────┘                                 │
│                                                                  │
│  KIỂM CHỨNG BẰNG CHỨNG ĐỘC LẬP CHO SINH VIÊN VIỆT NAM            │
└──────────────────────────────────────────────────────────────────┘
```

1.  **Optical Overlap:** The video container is positioned with negative margin (`margin-top: -48px`) so that the descenders and italic flourishes of the monumental serif title float directly over the moving refractive caustics.
2.  **Double-Matte Framing:** Videos are enclosed in a two-stage matte:
    *   Outer border: `1px solid rgba(255, 255, 255, 0.12)` with high-precision corner chamfers (`clip-path: polygon(...)`).
    *   Inner bevel: `inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.6)`.
3.  **Grain & Texture Interleaving:** A lightweight SVG noise layer (`feTurbulence`) is applied over all video elements at 4% opacity. This eliminates digital video compression artifacts and unifies the video footage with the editorial paper aesthetic.

---

## 5. Mobile Responsive Media Rules & Resource Discipline

On mobile screens ($\le 768\text{px}$), full-resolution video playback can cause severe thermal throttling, GPU exhaustion, and battery drain:

1.  **Automatic Poster Substitution on Low Bandwidth:**
    *   If `navigator.connection.saveData === true` or network downlink is $< 1.5\text{ Mbps}$, video tags are automatically replaced with ultra-optimized WebP posters (`landing-prism-mobile.webp` at 1.8 KB).
2.  **Viewport Culling (`IntersectionObserver`):**
    *   Any video element that scrolls out of the visible viewport ($< 0.05$ threshold) is immediately paused via `.pause()`.
    *   Playback resumes only when the element re-enters the active visual frame ($> 0.20$ threshold).
3.  **Single Video Concurrency Limit:**
    *   At no point in the user journey may more than **one** `<video>` element be actively decoding frames simultaneously. When transitioning between `VID-OPTIC-01` and `VID-OPTIC-02`, the former is paused the exact millisecond the crossfade opacity drops below 0.05.
4.  **Hardware-Accelerated Attributes:**
    *   Every video tag must strictly declare: `autoplay loop muted playsinline disablepictureinpicture preload="metadata"`.

---

## 6. Verification & Quality Acceptance Criteria

- [ ] **No Wallpaper Media:** Zero video elements are mounted as plain full-screen `z-index: -1` backgrounds with uniform opacity.
- [ ] **State Responsiveness:** Submitting a claim visibly narrows the `VID-OPTIC-01` refractive lens into a focused beam within 480ms.
- [ ] **Zero Layout Shift (CLS = 0):** All media containers define explicit CSS `aspect-ratio` or fixed dimensional envelopes before media loads.
- [ ] **Performance Pass:** Memory usage remains $< 35\text{ MB}$ additional footprint; Chrome DevTools Performance panel confirms steady 60fps during media transitions.
