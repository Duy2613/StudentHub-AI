# Creative Feature Charter — Knowledge Prism (EFX-01)

**Feature:** Knowledge Prism Signature Visual Asset  
**Owner:** StudentHub Creative Engineering & Design  
**Route:** `/`, `/knowledge`  
**Version:** 3.0  
**Feature Flag:** `NEXT_PUBLIC_ENABLE_L3_PRISM` (default: true with graceful fallback)

---

## 1. Product
- **User Goal:** Immediately recognize StudentHub as a serious, high-end academic intelligence platform rather than a generic SaaS dashboard or plain chatbot.
- **Problem:** Students land on platforms expecting either childish gamified widgets or dull corporate templates.
- **Meaning Hypothesis:** A crystalline optical prism splits raw information into verifiable spectral knowledge, embodying deep inquiry and truth.
- **StudentHub Verb:** EXPLORE / REVEAL.

---

## 2. Policy
- **Layer:** L3 (Landing Hero, Knowledge Universe Entry).
- **Scroll Grade:** SG3 (Spatial camera responds to native scroll without locking).
- **Pointer Grade:** PG1 (Gentle optical reaction, max 4px parallax shift).
- **Transition Class:** TC2 (Cinematic hero entry -> calm content scroll).
- **Cost Class:** M.

---

## 3. Data & State Boundary
- **Backend/Store Contract:** Purely visual identity asset.
- **States:** `IDLE_STABLE`, `EXPLORING`, `REVEAL_SPECTRUM`.
- **What Frontend MUST NOT Infer:**
  - MUST NOT represent verification status or claim truth.
  - MUST NOT be used as a success or verification badge.

---

## 4. Reference & IP Path
- **Reference Cards:** REF-01 (Segment Lifecycle), REF-02 (DOM-WebGL Fusion).
- **IP Path:** Clean-room procedural Three.js geometry and custom shaders. Zero third-party proprietary meshes.
- **Dependencies:** `three`, `@react-three/fiber`, `@react-three/drei`.

---

## 5. Rendering & Fallbacks
- **Renderer:** R-WEBGL2 (with R-WEBGPU experimental detection).
- **Capability Profiles:**
  - `CAP-FULL`: Procedural frosted acrylic transmission + spectral dispersion.
  - `CAP-BALANCED`: Fake fresnel reflection + cubemap lighting.
  - `CAP-MINIMAL`: Low-poly geometric prism with CSS gradient rim.
  - `CAP-STATIC`: R-POSTER (High-resolution WebP/SVG vector graphic).
- **Reduced Motion Behavior:** Zero continuous spin or camera rotation. Renders static pristine angle.

---

## 6. Performance & Budgets
- **LCP Target:** < 2.5s (DOM content + R-POSTER image load first; WebGL hydrates progressively).
- **SFMF (Scene First Meaningful Frame):** < 1.2s on desktop, < 2.0s on mobile.
- **Initial 3D Payload:** < 250KB compressed geometry/shader.
- **Frame Time Target:** ≤ 16.7ms (60 FPS on desktop, 30+ on mid mobile).

---

## 7. Accessibility Matrix (C-28)
- **Keyboard:** Core hero CTA button and navigation are 100% accessible via Tab and Enter before WebGL initializes.
- **Screen Reader:** Canvas marked with `aria-hidden="true"`. Accessible heading H1 and description provided in semantic DOM.
- **Contrast:** Background bloom strictly limited to 6–10% opacity, preserving > 7:1 contrast on white/midnight body text.
- **Motion Pause:** Pause/Stop control available if ambient rotation exceeds 5 seconds.

---

## 8. Approvals
- **Creative / Product:** Approved (Design System Lead)
- **Frontend Engineering:** Approved (Frontend Lead)
- **Accessibility:** Approved (WCAG 2.2 AA Verified)
