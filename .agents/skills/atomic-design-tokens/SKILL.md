---
name: atomic-design-tokens
description: Atomic Design Tokens and component architecture inspired by shadcn-ui/ui. Enforces semantic layer tokens, systematic radius math, harmonious HSL palettes, and accessible component composition.
---

# Atomic Design Tokens (shadcn-ui/ui)

## 1. Design Token Primitives
- **Color Layers**:
  - `Background`: Deep void `#06060a`
  - `Card / Surface`: Cyber glass `rgba(17, 21, 34, 0.75)`
  - `Primary Accent`: Trust Teal `#34e7c4`
  - `Secondary Accent`: Cyber Indigo `#6366f1` / Electric Violet `#818cf8`
  - `Warning / Risk Accent`: Crimson Rose `#f43f5e` & Amber Gold `#f59e0b`
- **Border Radii Math**:
  - Inner Elements: `rounded-xl` ($12\text{px}$)
  - Medium Containers: `rounded-2xl` ($16\text{px}$)
  - Outer Hero / Card Shells: `rounded-3xl` ($24\text{px}$) or `rounded-[32px]`
- **Typography Scale**:
  - Display Hero Serif: `text-5xl` to `text-8xl`, `font-serif-editorial`, `leading-[1.05]`
  - Section Title: `text-2xl` to `text-4xl`, `font-sans`, `font-black`, `tracking-tight`
  - Metadata Annotations: `text-[10px]` to `text-xs`, `font-mono`, `uppercase`, `tracking-[0.2em]`
  - Body Prose: `text-sm` to `text-base`, `text-gray-300`, `leading-relaxed`
