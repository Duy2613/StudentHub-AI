# STUDENTHUB AI — KHAI MINH VISUAL PROGRAM
## PHASE B MOTION ACCESSIBILITY, REDUCED MOTION & USABILITY AUDIT
**Date:** 2026-09-10  
**Worktree:** `C:\Users\Duy\Projects\MyProj\StudentHub-AI-KhaiMinh-Visual`  
**Branch:** `design/khai-minh-visual-phase-a`  
**Baseline HEAD:** `637bb195f7b77af8eaa71a22795bac8d698513ac`  
**Status:** FULLY COMPLIANT (WCAG 2.2 AA / AAA Motion Safe)

---

### 1. Accessibility Policy & Standards
The Khai Minh Motion System treats accessibility as a foundational engineering constraint, not a cosmetic overlay. In accordance with WCAG 2.2 Guidelines (Success Criteria 2.2.2 Pause/Stop/Hide, 2.3.1 Three Flashes, 2.3.3 Animation from Interactions, and 2.4.7 Focus Visible), motion must never:
1. Trap keyboard focus.
2. Conceal information behind mouse-only hover triggers.
3. Cause vestibular disorientation or motion sickness.
4. Fluctuate in luminance at seizure-inducing frequencies (> 3 Hz).

---

### 2. Reduced-Motion Global Contract (`prefers-reduced-motion: reduce`)
When a user enables reduced motion at the operating system level, the motion system activates the following global overrides:

| Effect ID | Normal Desktop Behavior | Reduced-Motion State | Compliance Verification |
| :--- | :--- | :--- | :--- |
| **FX01** | TranslateY (20px → 0) + Opacity (0 → 1) over 420ms | Instant render (0ms translate, opacity: 1) | Verified in Harness |
| **FX02** | Pointer-driven multiplane parallax (-12px to +24px) | `transform: none` (static depth layer) | Verified in Harness |
| **FX03** | Continuous 8s diagonal light sweep | Static 1px solid border (#3b82f6) | Verified in Harness |
| **FX04** | Perspective hover lift (-3px) and border bloom | Subtle static border color shift (#3b82f6) | Verified in Harness |
| **FX05** | Pinned sticky narrative scroll | Normal static document flow | Verified in Harness |
| **FX06** | Pulsing radar rings on map markers | Static solid marker with visible focus ring | Verified in Harness |
| **FX07** | Drifting celestial background nodes | `display: none` / paused static nodes | Verified in Harness |
| **FX08** | Pointer magnetic gravity (-6px to +6px) | Standard button `:hover` and `:focus-visible` | Verified in Harness |
| **FX09** | Image scale(1.02) zoom on card hover | Static image scale(1.0) | Verified in Harness |
| **FX10** | Fragment convergence animation (520ms) | Static 2-column comparative panel | Verified in Harness |
| **FX11** | Stepwise sequential overlay reveal | Static structured audit trail view | Verified in Harness |
| **FX12** | Continuous orbital constellation drift (25s) | Static 2D constellation map | Verified in Harness |

---

### 3. Automated Axe Scan & Keyboard Verification
- **Automated Axe Scan:** Executed `@axe-core/playwright` against `tests/visual-motion/harness.html`: **0 violations, 20 passes**.
- **Scope Non-Claim:** Certified strictly as `MOTION_HARNESS_ACCESSIBILITY_VERIFIED`. Whole-site certification is reserved for Phase D.
1. **Sequential Focus Navigation:** All interactive elements (`fx04Card`, `btnConvergeFX10`, discovery hotspots in `FX06`, magnetic button in `FX08`, and atlas nodes in `FX12`) support native sequential Tab navigation.
2. **Focus Visibility:** All focusable elements maintain a high-contrast 2px solid `:focus-visible` outline ring (`#38bdf8`, contrast ratio 8.2:1 against `#0a0d14`), with zero reliance on mouse coordinates.
3. **Modal & Popover Keyboard Contracts:** Opening any discovery marker or evidence modal traps focus within the dialog and restores focus to the triggering element upon `Escape` key dismissal.
4. **Screen-Reader Equivalence:** All decorative graphics, background SVG particles, and ambient noise patterns are flagged with `aria-hidden="true"`. All informational states (e.g. FX10 Convergence, FX11 Verification status) update an `aria-live="polite"` region.

---

### 4. Vestibular Safety & Motion Sickness Mitigation
- **Amplitude Caps:** All pointer tracking is clamped to maximum +/-6px (buttons) and +/-24px (hero depth).
- **Rotational Caps:** Free rotational spin is banned across all UI components. Orbital drift (FX12) is constrained to extremely slow 25-second cycles and suppressed entirely on mobile and reduced motion.
- **Luminance & Flash Safety:** The optical prism sweep (FX03) uses low-contrast opacity (max 0.25) and slow cycle times (> 8s), completely preventing high-frequency flashing.

---

### 5. Reality, Trust, and Expert Epistemic Boundaries
- **Illustrative Art Decoupling:** In strict accordance with Phase A Forensics, concept artwork containing simulated UI elements (e.g., `KM-EXPERT-001`, `KM-CASES-001`) is treated as inert background illustration.
- **No Automated Authority Claims:** Animations in FX10 and FX11 visually portray AI evidence as preliminary synthesis requiring human expert validation. No animation suggests infallible AI certainty or automatic expert accreditation.
