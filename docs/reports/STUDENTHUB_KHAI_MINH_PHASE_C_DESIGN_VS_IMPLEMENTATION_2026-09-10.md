# STUDENTHUB AI — KHAI MINH VISUAL PROGRAM
## PHASE C: DESIGN VS. IMPLEMENTATION RECONCILIATION REPORT
**Date:** 2026-09-10  
**Phase:** C — Full Visual Integration  
**Worktree:** `C:\Users\Duy\Projects\MyProj\StudentHub-AI-KhaiMinh-Visual`  

---

### Route-by-Route Design vs. Implementation Matrix

#### 1. Landing (`/`)
- **Planned Visual:** `KM-PRISM-001` (Desktop Hero), `KM-EDITORIAL-001` (Mobile Alternate), `KM-PRISM-002` (Chapter 2 Trust Transition).
- **Actual Visual:** Implemented exactly as planned via `KhaiMinhMedia` with responsive WebP derivatives.
- **Planned FX:** FX01, FX02, FX03, FX07, FX08, FX10.
- **Actual FX:** FX01, FX03, FX07 (bounded 3 SVG nodes), FX08 (magnetic CTA), FX10 (Noise-to-Knowledge transition).
- **Deviations & Rationale:**
  - `FX02 (Depth Parallax)` was **REJECTED_AT_IMPLEMENTATION_FOR_USABILITY**. Static optical positioning ensured crisp contrast for the primary heading and zero interference with the primary CTA.
  - `FX05` was omitted on landing to preserve native vertical scroll velocity.

#### 2. Trust (`/trust`)
- **Planned Visual:** `KM-PRISM-002` as optical transformation anchor.
- **Actual Visual:** Implemented as supporting background anchor in the header and stage indicator.
- **Planned FX:** FX01, FX04, FX09, FX10, optional FX11.
- **Actual FX:** FX01, FX04 (subtle 4px glass), FX09 (framing), FX10 (5 Macro Layers / 7 Stages indicator).
- **Deviations & Rationale:**
  - `FX11` was omitted because runtime trust engine does not yet produce synthetic human council reviews on initial load. Adding a fake human verdict card would violate C42.

#### 3. Community (`/community`)
- **Planned Visual:** `KM-ATLAS-001` as Knowledge Atlas anchor.
- **Actual Visual:** Implemented as high-contrast visual anchor above the interactive SVG Knowledge Atlas.
- **Planned FX:** FX01, FX04, FX06, FX09, FX12.
- **Actual FX:** FX01, FX04, FX09, FX12 (2.5D declarative SVG orbit).
- **Deviations & Rationale:**
  - `FX06 (Discovery Markers)` was **OMITTED_DATA_REALITY_PROTECTION** per C47 because live geospatial community nodes are not yet present in backend state. Static domain category tabs were used instead.

#### 4. Expert (`/expert`)
- **Planned Visual:** `KM-EXPERT-001` illustrative anchor.
- **Actual Visual:** Implemented with decorative framing and `alt=""`.
- **Planned FX:** FX01, FX04, FX09, FX11.
- **Actual FX:** FX01, FX04, FX09, FX11 (DOM-rendered 3-stage process flow: "AI -> Evidence -> Human Judgment").
- **Deviations & Rationale:** None. Zero concept-art faces were turned into fake expert profiles.

#### 5. Cases (`/cases`)
- **Planned Visual:** `KM-CASES-001` archival background.
- **Actual Visual:** Implemented as a cropped, low-opacity background texture behind live DOM investigation dossier cards.
- **Planned FX:** FX01, FX04, FX09, optional FX05.
- **Actual FX:** FX01, FX04, FX09.
- **Deviations & Rationale:**
  - `FX05 (Sticky Timeline)` was **REJECTED_AT_IMPLEMENTATION_FOR_USABILITY** per C58. Native scroll dossier scanning is significantly more ergonomic, eliminates sticky collision risks on smaller screens, and preserves keyboard accessibility.

#### 6. Dashboard (`/dashboard`)
- **Planned Visual:** `KM-PRISM-005` as quiet workspace atmosphere.
- **Actual Visual:** Implemented with 15% opacity mineral wash behind the workspace shell.
- **Planned FX:** FX01, FX04, FX09.
- **Actual FX:** FX01, FX04, FX09.
- **Deviations & Rationale:** Zero continuous animations. Concept art fake dashboard metrics (93%, 42 sources) were strictly excluded.

#### 7. Settings (`/settings`)
- **Planned Visual:** `KM-SETTINGS-001` quiet visual anchor.
- **Actual Visual:** Implemented as a quiet decorative header accent.
- **Planned FX:** FX01, FX04, FX09.
- **Actual FX:** FX01, FX04, FX09.
- **Deviations & Rationale:** None. Zero fake settings toggles introduced.
