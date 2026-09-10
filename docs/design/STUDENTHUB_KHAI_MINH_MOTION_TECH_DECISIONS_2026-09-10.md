# 🏛️ StudentHub AI — Khai Minh Motion Technology Decision Record
> **Date**: 2026-09-10 | **Authority**: Phase B Motion Architecture | **Status**: APPROVED & LOCKED

---

## 1. Architectural Philosophy & Technology Hierarchy

To achieve the benchmark aesthetics of high-end award-winning sites (Hobro Digital, Árstraumur, Overworld Audio) without falling into the common traps of severe GPU lag, high battery drain, and poor accessibility, StudentHub AI enforces a strict **Technology Restraint Ladder**:

```
LEVEL 1: Native CSS / CSS Variables / Hardware Compositor (Default Winner)
    ↓ (If dynamic coordination or step state requires it)
LEVEL 2: DOM Interaction / Native HTML Semantics + SVG
    ↓ (If scroll synchronization across multi-element timelines requires it)
LEVEL 3: Existing Project Motion Library (Framer Motion / GSAP scoped to desktop only)
    ↓ (Strictly PROHIBITED unless proven by measured benchmark failure)
LEVEL 4: HTML5 Canvas 2D
    ↓ (STRICTLY PROHIBITED in Phase C Production)
LEVEL 5: Three.js / WebGL Shaders
```

---

## 2. FX01–FX12 Technology Decision Matrix

| Effect ID | Effect Name | Preferred Technology | Candidate Technologies Evaluated | Rejection Rationale for Heavier Alternatives | Production Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FX01** | Cinematic Reveal | **CSS + IntersectionObserver** | CSS, Framer Motion, GSAP | Framer/GSAP add unnecessary runtime overhead to standard section entry. Native CSS class toggle has 0ms JS cost. | **CSS** |
| **FX02** | Depth Parallax | **CSS (transform in rAF)** | CSS, Framer Motion, Three.js | Three.js adds 600KB+ and GPU context switches for simple layer offset. CSS translateY in rAF is 60fps compositor-safe. | **CSS (Desktop Only)** |
| **FX03** | Prism Light Sweep | **CSS (Mask/Gradient)** | CSS, SVG, WebGL Caustics Shader | Full GLSL caustics shaders drain mobile batteries and cause GPU context loss. CSS linear-gradient sweep achieves identical optical brilliance. | **CSS** |
| **FX04** | Knowledge Glass | **CSS (backdrop-filter)** | CSS, Framer Motion, VanillaTilt | JS tilt scripts cause layout jank and focus-outline clipping. Standard CSS hover lift & blur is instant and accessible. | **CSS** |
| **FX05** | Editorial Scroll Choreography | **CSS sticky + scroll-snap** | CSS, GSAP ScrollTrigger | GSAP introduces scroll hijacking risk. Native CSS sticky handles narrative pinning safely; GSAP reserved as desktop-only fallback. | **CSS (GSAP Fallback)** |
| **FX06** | Discovery Markers | **DOM / HTML Hotspots + SVG** | DOM/HTML, Canvas, WebGL | Canvas/WebGL hotspots cannot be read by screen readers or navigated via Tab key. Native HTML `<button>` is mandatory for accessibility. | **DOM / HTML** |
| **FX07** | Ambient Field | **SVG + CSS Keyframes** | SVG/CSS, Canvas Particles | Canvas requires continuous JS loop. SVG with hardware-accelerated CSS keyframe animation pauses cleanly and costs 0ms main thread. | **SVG / CSS** |
| **FX08** | Magnetic CTA | **CSS + Light Pointer Listener** | CSS, GSAP, Custom Canvas | Canvas or global magnetics trap cursor focus. A light pointer proximity listener on 1 primary CTA is lightweight and non-blocking. | **CSS + Micro Listener** |
| **FX09** | Media Frame | **CSS (aspect-ratio & borders)** | CSS, JS Cropper | CSS standard properties preserve aspect ratio and focal points with zero runtime calculation. | **CSS** |
| **FX10** | Noise to Knowledge | **CSS / SVG (Scroll-driven)** | CSS/SVG, GSAP, WebGL Convergence | WebGL simulation is overkill for 3 converging rays. SVG stroke-dashoffset and transform achieve smooth convergence on scroll progress. | **CSS / SVG** |
| **FX11** | Human in the Loop | **DOM State Component** | React DOM, Canvas Animation | Real verification requires legible, accessible textual proof. A clean semantic step component outperforms decorative canvas drawing. | **DOM / React Component** |
| **FX12** | Knowledge Atlas | **SVG Constellation** | SVG, Canvas 2D, Three.js 3D | 5-node planetary orrery is completely achievable with declarative SVG orbital paths and CSS rotation. Three.js rejected as redundant. | **SVG** |

---

## 3. Technology Verdict Summary

* **GSAP Required**: **NO**. (Benchmarked prototype proves CSS sticky and SVG scroll-driven progress satisfy all narrative requirements. GSAP remains documented as an optional fallback for complex desktop pin-decks, but is **NOT** mandatory for Phase C).
* **Canvas Required**: **NO**. (All 12 visual effects benchmarked cleanly in SVG and modern CSS).
* **WebGL Required**: **NO (STRICTLY PROHIBITED)**. (Eliminates GPU crashes, 1MB+ bundle bloat, and mobile thermal throttling).
