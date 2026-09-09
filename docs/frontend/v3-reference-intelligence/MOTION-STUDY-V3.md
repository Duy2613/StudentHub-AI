# MOTION STUDY V3: MEANING-DRIVEN DYNAMICS & KINETIC CHOREOGRAPHY
**Document ID:** `STU-V3-REF-MOTION-001`  
**Classification:** Frontend Experience Architecture & Interaction Kinetic Engineering  
**Role Scope:** Principal Experience Director, Motion Director, Interaction Designer  
**Status:** Canonical Reference Intelligence for V3 Handoff  

---

## 1. Executive Motion Thesis: "Gesture-as-Meaning & Kinetic Evidence"

In StudentHub V2, animations functioned primarily as ambient ornament—CSS keyframe floats, decorative particle drift, and generic accordion slides. This violated core digital art direction principles: animation that does not communicate cognitive state or spatial causality is visual noise that dilutes academic credibility.

In **V3 — Khai Minh The Evidence Journey**, motion is re-architected under the doctrine of **Kinetic Causality**:
1. **Motion is Meaning, Not Decoration:** Every vector translation, scale transformation, and opacity modulation must directly visualize an epistemic event: focusing attention, decomposing an academic claim, retrieving disparate evidence, illuminating contradictions, or crystallizing a verified conclusion.
2. **Native Scroll Integrity:** Unlike proprietary award sites (e.g., *Why Zero*) that employ virtual scroll-jacking (`lenis`, `locomotive-scroll` virtual canvas locks) which destroy keyboard navigability and mobile swipe predictability, StudentHub preserves 100% native browser scrolling. Motion is synchronized through hardware-accelerated CSS sticky stages, performant `IntersectionObserver` thresholds, and explicit state-machine triggers.
3. **Stage Lifecycle Discipline:** Borrowing from BUNQ LABS' *Why Zero* architecture, UI regions are treated as stateful scenes governed by an immutable lifecycle: `{ enter, scrub, update, teardown }`.

---

## 2. Why Zero Stage Lifecycle Translation

### 2.1 The BUNQ LABS Formalism
*Why Zero* divides its narrative into isolated canvas scenes with explicit lifecycle hooks:
*   **Scene Mount (`enter`):** Pre-allocates memory, buffers textures, initializes shader uniforms, and brings foreground typography into view via tight cubic bezier curves.
*   **Progressive Scrub (`scrub`):** Maps scroll deltas directly to camera frustum position and mesh deformation.
*   **Interaction Gate (`update`):** Halts forward progression until the user executes an explicit gesture (e.g., drag slider, hold key, rotate object), proving intellectual engagement.
*   **Scene Unmount (`teardown`):** Completely disposes of geometry, detaches event listeners, and releases WebGL framebuffers to prevent memory leaks and maintain a steady 60fps.

### 2.2 Product-Safe Translation for StudentHub V3
We translate this lifecycle into a pure Web-Standards architecture that operates without WebGL lock-in or scroll interception:

| Lifecycle Phase | StudentHub V3 Implementation Mechanism | Cognitive & Visual Purpose |
| :--- | :--- | :--- |
| **`enter`** | CSS `will-change: transform, opacity` primed via `IntersectionObserver` (100px lookahead). Initial state set to `translateY(16px) scale(0.98) opacity(0)`. | Eliminates layout thrashing before components enter the active visual frustum. |
| **`scrub`** | Pure CSS Scroll-Driven Animations (`animation-timeline: view()` / `scroll()`) with zero JS thread overhead. For legacy browsers, passive `requestAnimationFrame` with linear interpolation (`lerp(0.08)`). | Environmental media and sticky investigation rails move with subtle optical depth relative to viewport progress. |
| **`gate`** | **State Machine Gate:** Analysis input submission or source filter selection locks background scroll context and triggers `ANALYSIS_FOCUS_MODE`. | Narrows cognitive field; collapses extraneous marketing and community clutter. |
| **`teardown`** | Elements outside the active investigation stage are transitioned to `opacity: 0; pointer-events: none` and collapsed to `max-height: 0` with `contain: strict`. | Frees GPU compositing layers, clears visual distractions, guarantees 60fps mobile performance. |

---

## 3. The Five Kinetic Semantics of Khai Minh V3

```
[ USER CLAIM ] ─────────► [ FOCUS ] ─────────► [ ARRIVAL ] 
                                                   │
[ RESOLUTION ] ◄───────── [ CONTRADICTION ] ◄─────┴──► [ RELATIONSHIP ]
```

### 3.1 FOCUS (Attentional Narrowing)
*   **Trigger:** User presses `Cmd+Enter` or clicks "Kiểm chứng ngay" on the claim input stage.
*   **Kinetic Behavior:**
    *   Primary viewport immediately establishes a sticky focus frame around `#trust-workbench`.
    *   Ambient background media (`VID-OPTIC-01`) transforms from a broad, dispersed refractive field to a concentrated, circular telephoto vignette around the active query box (zoom `1.0` $\rightarrow$ `1.15`, radial mask radius `80%` $\rightarrow$ `35%`).
    *   Extraneous peripheral elements (landing hero text, secondary feature cards, community callouts) execute a synchronized teardown: `opacity: 0`, `translateY(32px)`, `margin-bottom: 0` over 480ms.
*   **Easing Curve:** `--ease-focus: cubic-bezier(0.19, 1, 0.22, 1)` (Expo Out).
*   **Duration:** 480ms.

### 3.2 ARRIVAL (Evidence Node Ingress)
*   **Trigger:** Backend streaming API emits `EVIDENCE_DISCOVERED` events.
*   **Kinetic Behavior:**
    *   Evidence nodes enter not as generic grid items, but as kinetic source packets radiating inward from the peripheral margin toward the central Claim Decomposition node.
    *   Staggered entry interval: $80\text{ms}$ delta per node, maximum 6 concurrent nodes in first cohort.
    *   Each node lands with physical momentum: overshoot of 4px before snapping to its designated coordinate in the Evidence Constellation / Stage with a damped spring response.
*   **Easing Curve:** `--ease-spring-snap: cubic-bezier(0.34, 1.56, 0.64, 1)`.
*   **Duration:** 420ms per node.

### 3.3 RELATIONSHIP (Semantic Proximity & Affinity)
*   **Trigger:** Evidence nodes categorized into thematic/claim clusters.
*   **Kinetic Behavior:**
    *   Connecting filaments (SVG bezier splines or 2D canvas strokes) draw themselves from the extracted Claim sub-token to the Source Node (`stroke-dashoffset` animated from `path-length` to `0`).
    *   Filament line tension correlates with semantic confidence: high corroboration ($>0.85$) produces a taut, glowing emerald/cyan line (`#10b981`); contextual reference produces an ethereal dashed gray line (`rgba(255,255,255,0.2)`).
    *   Hovering over any citation tag (`[1]`) triggers a magnetic attraction pulse: all related nodes pull 6px toward the citation origin, while unrelated nodes desaturate to 30% opacity.
*   **Easing Curve:** `--ease-fluid: cubic-bezier(0.25, 1, 0.5, 1)`.
*   **Duration:** 350ms.

### 3.4 CONTRADICTION (Tension & Phase Opposition)
*   **Trigger:** Detection of conflicting evidence (`supportsClaims` vs. `contradictsClaims`).
*   **Kinetic Behavior:**
    *   Conflicting evidence nodes exhibit lateral vector divergence: nodes supporting Claim A shift toward the left quadrant ($-24\text{px}$), while contradicting nodes shift toward the right quadrant ($+24\text{px}$).
    *   The connecting filament between conflicting sources undergoes a high-frequency, low-amplitude chromatic pulse (amber-red hue `#f59e0b` $\leftrightarrow$ `#ef4444`, stroke width vibrating between `1px` and `2.5px` over two cycles).
    *   A micro-haptic warning ripple radiates outward from the contradiction junction, drawing immediate ocular focus to the disputed metric.
*   **Easing Curve:** `--ease-tension: cubic-bezier(0.68, -0.6, 0.32, 1.6)`.
*   **Duration:** 520ms.

### 3.5 RESOLUTION (Synthesis & Verdict Reveal)
*   **Trigger:** AI synthesis engine concludes analysis (`RESULT_REVEAL`).
*   **Kinetic Behavior:**
    *   Disparate evidence nodes lock into a stabilized, architectural bento constellation.
    *   Optical video background switches to `VID-OPTIC-02` (`trust-result-prism`) with a subtle 600ms crossfade, projecting crystalline refraction caustics across the verdict header.
    *   Monumental Verdict Typography ("XÁC THỰC CÓ ĐIỀU KIỆN" / "THÔNG TIN SAI LỆCH") reveals via an editorial character-stagger mask (`clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)`, sliding up from `translateY(100%)`).
    *   Evidence synthesis cards cascade into view in top-down hierarchy: Primary Conclusion $\rightarrow$ Evidentiary Foundation $\rightarrow$ Contradiction Matrix $\rightarrow$ Actionable Next Steps.
*   **Easing Curve:** `--ease-reveal: cubic-bezier(0.16, 1, 0.3, 1)` (Quart Out).
*   **Duration:** 850ms total sequence.

---

## 4. Codrops ImageToGridTransition Adaptation (FLIP Claim Decomposition)

### 4.1 Concept Origin
Codrops' open-source *ImageToGridTransition* demonstrates how a singular focal image can seamlessly expand, fracture into grid cells, and rearrange into an editorial layout using First-Last-Invert-Play (FLIP) geometry calculations.

### 4.2 StudentHub Implementation: Document-to-Evidence Decomposition
When an academic syllabus, university circular PDF, or scholarship screenshot is submitted via drop-zone:

```
[ Uploaded Document Card ]
         │ (FLIP Step 1: Record Bounding Rect)
         ▼
[ Full-Bleed Inspection Stage ] (Zoom 1.4x, Optical Scan Line)
         │ (FLIP Step 2: Optical Slice OCR)
         ▼
┌──────────────┬──────────────┬──────────────┐
│  Claim 01    │  Claim 02    │  Claim 03    │ (Discrete Tokens)
└──────────────┴──────────────┴──────────────┘
         │ (FLIP Step 3: Dispatch to Constellation)
         ▼
[ Evidence Constellation Nodes & Source Verification Rails ]
```

1. **First:** Compute original coordinates of the uploaded preview thumbnail (`getBoundingClientRect()`).
2. **Last:** Compute target coordinates of the three decomposed claim chips in the Investigation Rail.
3. **Invert:** Apply CSS `transform: translate(dx, dy) scale(dw, dh)` to simulate seamless physical detachment.
4. **Play:** Animate to target state using `--ease-out-expo` (560ms). As the document fractures, optical scan lines shimmer across the bounding box, providing instant tactile feedback that OCR extraction and claim tokenization have succeeded.

---

## 5. Tokenized Motion System Architecture

### 5.1 Cubic-Bezier Timing Tokens
```css
:root {
  /* Editorial & Cinematic Stage Reveals */
  --ease-editorial-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-editorial-in-out: cubic-bezier(0.76, 0, 0.24, 1);
  
  /* Focus & Attentional Shifts */
  --ease-focus-snap: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-focus-collapse: cubic-bezier(0.7, 0, 0.84, 0);
  
  /* Physical Object Physics (Nodes, Cards, Modals) */
  --ease-spring-gentle: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-spring-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-tension-recoil: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 5.2 Duration Tokens
```css
:root {
  --duration-micro: 120ms;    /* Toggle states, hover highlights, tooltip fades */
  --duration-subtle: 240ms;   /* Button clicks, tag expansion, tab switches */
  --duration-normal: 360ms;   /* Card ingress, drawer slide-out, modal open */
  --duration-macro: 540ms;    /* Focus mode collapse, stage transitions */
  --duration-cinematic: 850ms;/* Monumental typography reveal, verdict reveal wave */
}
```

---

## 6. Accessibility & `prefers-reduced-motion` Enforcement

In accordance with WCAG 2.2 Success Criterion 2.3.3 (Animation from Interactions), users with vestibular disorders or motion sensitivity must not experience jarring parallax, multi-axis translations, or forced zooms.

### 6.1 Deterministic Fallback Rules
When `@media (prefers-reduced-motion: reduce)` is detected:
1. **Zero Translation/Scale:** All `translateY`, `translateX`, and `scale()` values are strictly clamped to `0` or `1.0`.
2. **Opacity-Only Dissolve:** State transitions execute as instantaneous or gentle crossfades (`opacity` transitions $\le 150\text{ms}$).
3. **Instant Focus Collapse:** In `ANALYSIS_FOCUS_MODE`, secondary sections below the workspace collapse instantly (`transition: none; max-height: 0; display: none`).
4. **Constellation Map Fallback:** The 2D/3D kinetic particle canvas automatically disables its physics loop and renders a static, high-contrast SVG topological graph or structured semantic HTML list with full screen-reader table markup.
5. **Video Playback Suspension:** Background refractive videos pause on their first high-legibility poster frame, eliminating persistent strobe or motion in peripheral vision.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .evidence-node,
  .trust-focus-stage,
  .verdict-reveal-headline {
    transform: none !important;
    clip-path: none !important;
    opacity: 1 !important;
  }
  
  .canvas-constellation-container {
    display: none !important;
  }
  
  .constellation-accessible-fallback {
    display: block !important;
  }
}
```

---

## 7. Performance Guardrails: 60fps Mobile Guarantee
1. **Compositor-Only Properties:** No animations on `width`, `height`, `margin`, `padding`, or `top/left/bottom/right`. Only `transform` and `opacity` are animated during active runtime loops.
2. **Layer Budget:** No more than 12 active GPU compositing layers active simultaneously on mobile viewports ($\le 768\text{px}$).
3. **Passive Listeners:** All scroll and pointer tracking event handlers must be declared with `{ passive: true }`.
4. **Visibility Culled Loops:** Any RAF loops powering canvas filaments or optical shaders must check `document.visibilityState` and `IntersectionObserver.isIntersecting`; if off-screen, tick frequency drops to 0Hz.
