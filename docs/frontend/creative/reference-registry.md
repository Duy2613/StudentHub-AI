# StudentHub AI — Creative Reference Registry v3.0

**Status:** RATIFIED & ACTIVE  
**Last Reviewed:** 2026-09-24  
**Governing Authority:** MASTER FRONTEND CONSTITUTION v3.0 (C-01, C-03)

---

## 1. Governance & Evidence Model

Per **C-03**, every creative reference is evaluated on two separate axes:

### Source Provenance
- **P1 Primary:** Official site/docs, author/team case study, repository, direct StudentHub observation.
- **P2 Secondary:** Reputable independent reporting or standards commentary.
- **P3 Unverified:** Marketing claim, inaccessible observation, rumor, unsourced gallery claim.

### Claim Confidence
- **Confirmed:** Directly supported by P1 evidence.
- **Corroborated:** Supported by multiple credible sources.
- **Provisional:** Plausible but not yet verified.

> **Principle:** Reference ≠ Endorsement. Every reference card records both what StudentHub may learn and what it must reject.

---

## 2. Reference Cards

### REF-01 · Why Zero / Zero University
- **Review Date:** 2026-09-24
- **Reviewer:** StudentHub Creative Engineering
- **Source Provenance:** P1
- **Claim Confidence:** Confirmed
- **Directly Observed:**
  - Multi-chapter narrative web experience with adaptive quality tiers.
  - Granular asset discipline and segment lifecycle management.
- **What StudentHub May Learn:**
  - Interaction model as carrier of meaning.
  - Strict segment lifecycle (loading, active, unloading GPU resources).
  - Adaptive capability degradation (CAP-FULL -> CAP-BALANCED -> CAP-MINIMAL -> CAP-STATIC).
- **What StudentHub Rejects:**
  - Mandatory virtual scroll / scroll-jacking.
  - Gesture gate before critical content can be read.
  - Text rendered into `<canvas>` for primary UI and reading.
  - Game-like gating of ordinary educational tasks.
- **Technique Mapping:**
  - Segment lifecycle -> `SceneLifecycleController`.
  - Capability tiers -> `AdaptiveQualityContext`.
- **Accessibility Concerns:** WCAG 2.2 AA non-compliance on forced scroll and canvas-rendered text.
- **Performance Concerns:** High memory footprint if textures are not explicitly disposed.
- **Promotion Decision:** Canonical (Restricted to L3 narrative architecture).

---

### REF-02 · Robin Payot Portfolio & Experiments
- **Review Date:** 2026-09-24
- **Reviewer:** StudentHub Creative Engineering
- **Source Provenance:** P1
- **Claim Confidence:** Confirmed
- **Directly Observed:**
  - Fluid fusion between DOM typography and WebGL displacement planes.
  - Clean shader-based image transitions and liquid reveals.
- **What StudentHub May Learn:**
  - Media Plane / DOM-WebGL fusion (C-13): DOM holds semantics/text; WebGL mirrors geometry for optical refraction and grain.
  - Restrained pointer-reactive lighting and fresnel edge shimmer.
- **What StudentHub Rejects:**
  - Copying exact portfolio composition or layout.
  - Unlicensed shader code (must be clean-room implemented per C-04).
  - Heavy continuous post-processing stack on content surfaces.
- **Technique Mapping:**
  - DOM-WebGL Media Plane -> `MediaPlaneFusion`.
  - Restrained chromatic edge -> `SemanticSurfaceTreatment`.
- **Accessibility Concerns:** Reduced motion must disable plane distortion and fallback to CSS cross-fade.
- **Performance Concerns:** Screen-space refraction requires high fill rate on mobile; use glass ladder tier 2 (fake fresnel) on mobile.
- **Promotion Decision:** Lab (Qualified for L2/L3 expressive moments only).

---

### REF-03 · Hobro Digital
- **Review Date:** 2026-09-24
- **Reviewer:** StudentHub Creative Engineering
- **Source Provenance:** P2 / P3
- **Claim Confidence:** Provisional
- **Directly Observed:**
  - Asymmetric editorial grid, high typographic scale contrast, full-bleed imagery.
- **What StudentHub May Learn:**
  - Editorial layout rhythm (Lora Display paired with clean sans-serif UI).
  - Wide margins and intentional negative space.
- **What StudentHub Rejects:**
  - Low text contrast ratios (< 4.5:1).
  - Extreme minimalism that hides functional controls.
  - Unverified site-analysis claims without dated observation notes.
- **Technique Mapping:**
  - Editorial rhythm -> `AcademicEditorialLayout`.
- **Accessibility Concerns:** Low contrast and missing focus indicators in reference. StudentHub enforces WCAG 2.2 AA.
- **Performance Concerns:** Unoptimized full-bleed media; StudentHub enforces responsive WebP/AVIF with strict budgets.
- **Promotion Decision:** Lead (Inspirational layout grammar only, no direct copying).

---

## 3. Reference Registry Maintenance Schedule
- **Review Cycle:** Every 90 days.
- **Next Mandatory Review:** 2026-12-23.
