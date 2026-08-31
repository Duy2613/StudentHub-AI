# StudentHub AI — Visual Sources & Motion Architecture Attribution

This document records the architectural and interaction references, licensing evaluations, and internal rebuild decisions for StudentHub AI's **Academic Futurism** design system.

---

## 1. Reference Ecosystem & License Audit

| Source / Pattern | License | Dependencies | Runtime Cost | Decision | Adaptation Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear App** (Architectural Dark Surface) | Proprietary (Inspiration) | None (Pure CSS) | Zero | **REFERENCE ONLY** | Adopted the principle of deep subtle canvas temperatures (`#07090e`), crisp hairline borders (`rgba(255,255,255,0.09)`), and high-contrast semantic typography. |
| **Vercel / Next.js** (Minimalist Data Presentation) | Proprietary (Inspiration) | None (Pure CSS) | Zero | **REFERENCE ONLY** | Adopted clean tabular numbers, monotonic font weights for metrics, and calm state layouts without unnecessary glow. |
| **Raycast** (Floating Command Surface) | Proprietary (Inspiration) | None | Low | **REBUILD INTERNALLY** | Rebuilt instant Command Palette (`Ctrl+K`) with zero-latency filter, keyboard trap, and accessible dialog semantics. |
| **Magic UI / Motion Primitives** (Animated Beam, Reveal) | MIT | Motion / Framer Motion | Low | **REBUILD INTERNALLY** | Implemented lightweight SVG knowledge trace paths (`TracePath`) and masked reveals (`MaskReveal`) directly using standard SVG and Framer Motion primitives. |
| **shadcn/ui** (Accessible Component Composition) | MIT | Radix UI / Tailwind | Zero | **ADAPT** | Preserved accessible semantic HTML attributes (`aria-expanded`, `aria-selected`, `role="status"`), focus-visible outlines, and skip-link landmarks. |
| **Tympanus / Codrops** (Architectural Scrollytelling) | MIT / Open Source | Framer Motion / CSS | Low | **REBUILD INTERNALLY** | Adapted architectural parallax and living atlas image choreography with strict `prefers-reduced-motion` fallbacks. |

---

## 2. Architectural Design Principles

1. **Originality over Imitation**: Every visual moment is filtered through StudentHub's core identity: institutional credibility, brutalist academic photography, and multi-source evidence reasoning.
2. **Visual Intensity Calibration**:
   - **Landing**: 10/10 (Cinematic Living Campus Atlas)
   - **Trust Engine**: 7/10 (4-Layer dynamic evidence graph)
   - **Expert Network**: 6/10 (Editorial dossier & citation trail)
   - **Community Intelligence**: 5/10 (Human experiences & consensus signals)
   - **Command Center Dashboard**: 4/10 (Calm operational clarity)
   - **Settings & Profile**: 3/10 (Quiet luxury & data precision)
3. **Hardware Acceleration & Zero Slop**: All animations use compositor-only properties (`transform`, `opacity`), avoiding layout thrashing. No ambient audio or decorative distractions.
