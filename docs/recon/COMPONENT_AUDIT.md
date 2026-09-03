# 03 — UI Component & Design Token Drift Audit

**Audit Date:** September 1, 2026  
**Auditor:** Antigravity 3.7 Flash High  
**Operating Mode:** `MODE A — RECONNAISSANCE`  
**Claim Discipline:** Mixed evidence. `docs/recon/EVIDENCE-CLEANUP.md` is authoritative; statements below are historical observations and proposals unless individually labelled.

---

## 1. UI Component Inventory & Taxonomy

The frontend contains **171 component files** across 22 subdirectories; **168 are code files** after excluding non-code assets. The corrected directory counts are:

```text
frontend/src/components/
├── academic/     (17 files) - Academic 360, Planner, Execution, Drawers
├── ai/           (1 file)   - Generic Chat/Mentor interface
├── animations/   (1 file)   - Canvas animation utilities
├── auth/         (9 files)  - Saffron Auth, Settigation OTP Orbit, Entropy HUD
├── canvas/       (4 files)  - Creative canvas wrappers
├── command/      (3 files)  - Personal Command Center, Briefing, Palette
├── community/    (3 files)  - Community Intelligence Views & Studios
├── competition/  (2 files / 1 code) - Evidence Case Lab studio
├── expert/       (3 files)  - Expert Intelligence, Graph View, Authority
├── fusion/       (1 file)   - Knowledge Object Studio
├── home/         (2 files)  - Hero3DCanvas, CommandCenterDashboard
├── intelligence/ (10 files) - Unified Intelligence Studio & Lens views
├── landing/      (14 files) - LivingCampusAtlas sections, Hero, Footers
├── layout/       (5 files)  - ModernNavbar, CollapsibleSidebar, AppShells
├── margin/       (4 files)  - Editorial margin notes & annotations
├── providers/    (2 files)  - Auth, SmoothScroll, Background providers
├── settings/     (5 files)  - Settings view
├── social/       (1 file)   - Social signal connector views
├── trust/        (16 files) - Layer 1-4 HUDs, TrustStudio, RiskMeter, Graph
├── ui/           (44 files) - Primitive buttons, badges, cards, 3D canvases, tickers
├── ultra/        (17 files) - Ultra showcase sections & effects lab
└── visual/       (6 files)  - AmbientField, KnowledgeCore, Reveal, TracePath

The remaining component file is the root-level `AvatarDisplay.jsx`; the total therefore reconciles to 171 files and 168 code files.
```

---

## 2. Identified Component Drift & Redundancies

### 2.1 Background & Canvas Primitives (8 Named Systems)
```text
[FINDING-COMP-01] [SEVERITY: HIGH]
REQUIREMENT: Background effects must be lightweight, hardware-accelerated, and respect prefers-reduced-motion.
FILES: 
  - frontend/src/components/ui/AuroraParticleCanvas.jsx
  - frontend/src/components/ui/MohsinFluidCanvas.jsx
  - frontend/src/components/ui/constellation-wave-canvas.jsx
  - frontend/src/components/ui/SparklingStardustCanvas.jsx
  - frontend/src/components/home/Hero3DCanvas.jsx
  - frontend/src/components/ui/creative-shader-canvas.jsx
  - frontend/src/components/ui/AeroMissionControlBackdrop.jsx
  - frontend/src/components/ui/floating-forcefield-orbs.jsx
OBSERVED BEHAVIOR: 8 distinct WebGL/2D canvas systems exist in the source tree. Simultaneous runtime loading across routes was not measured.
EXPECTED BEHAVIOR: A single consolidated AmbientField component with automatic GPU throttling and mobile fallback.
USER IMPACT: Severe GPU fan noise, battery drain on laptops, and mobile browser lag.
MINIMAL FIX: Consolidate all canvas backgrounds into a unified AmbientField.jsx using CSS radial gradients and lightweight particles.
```

### 2.2 App Shell Adoption Gap
```text
[FINDING-COMP-02] [SEVERITY: MEDIUM]
REQUIREMENT: All internal app routes must share a single responsive App Shell.
FILES:
  - frontend/src/components/layout/GlobalAppShell.jsx
  - frontend/src/components/layout/StudentHubOSShell.jsx
  - frontend/src/components/layout/UnifiedAppShell.jsx
OBSERVED BEHAVIOR: `/trust` mounts `UnifiedAppShell`; `/academic` mounts `StudentHubOSShell`, which currently delegates to `UnifiedAppShell`. Legacy/deferred pages still mount `ModernNavbar` or `CollapsibleSidebar` directly.
EXPECTED BEHAVIOR: 100% of internal routes use UnifiedAppShell with consistent sidebar and header navigation.
USER IMPACT: Disorienting layout shifts and navigation jumping when moving between pages.
MINIMAL FIX: Standardize the route composition on `UnifiedAppShell.jsx` while preserving wrapper names as compatibility aliases until their consumers are migrated and tested.
```

### 2.3 Navigation Link Duplication in Headers & Sidebars
```text
[FINDING-COMP-03] [SEVERITY: HIGH]
REQUIREMENT: Navigation must present only active canonical pillars.
FILES:
  - frontend/src/components/layout/ModernNavbar.jsx (Line 24: { label: "Diễn Đàn", href: "/forum" })
  - frontend/src/components/layout/CollapsibleSidebar.jsx (Line 83: { label: "Diễn Đàn & Tín Hiệu", href: "/forum" })
OBSERVED BEHAVIOR: Both ModernNavbar and CollapsibleSidebar link directly to deprecated /forum alongside /community.
EXPECTED BEHAVIOR: Only /community is presented in the navigation hierarchy.
USER IMPACT: Fractured user traffic between old forum and new community intelligence.
MINIMAL FIX: Remove /forum navigation entries and redirect route to /community.
```
