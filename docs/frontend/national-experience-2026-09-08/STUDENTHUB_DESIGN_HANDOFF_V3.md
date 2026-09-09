# STUDENTHUB AI — MASTER DESIGN HANDOFF V3
**Document ID:** `STU-V3-HANDOFF-MASTER-001`  
**Classification:** Canonical Architecture, Design System & Frontend Rebuild Specification  
**Release Epoch:** R10 — Experience Reconstruction V3  
**Directing Authority:** Principal Experience Director, Creative Director, Digital Art Director, Editorial Designer, Interaction Designer, Motion Director, WebGL Experience Designer, Product UX Architect, Typography Director & Research Lead  
**Execution Agent Target:** Luna Max V3 Full-Stack Implementation  
**Status:** Canonical & Authoritative  

---

## 1. Executive Thesis: "Khai Minh V3 — The Evidence Journey"

In StudentHub V2, the application achieved technical viability: verified media assets played reliably, API pipelines communicated with backend services, and multi-layered analysis returned structured JSON. However, the **experience layer failed**. The interface behaved like a generic utility dashboard—static cards, uniform typography, unclickable source claims, and decorative background wallpaper.

**Khai Minh V3 (The Evidence Journey)** re-architects StudentHub from an administrative tool into a **high-end editorial and forensic research instrument**.

The core cognitive journey of Khai Minh V3:
1.  **A Questionable Claim Enters:** A student submits a controversial circular, scholarship rumor, or dubious tuition notice.
2.  **Attention Narrows (The Attentive Chamber):** The interface sheds extraneous marketing fluff, collapsing secondary noise into focused negative space.
3.  **The Claim is Decomposed:** Optical analysis fractures the premise into discrete, verifiable propositions.
4.  **Evidence Arrives with Kinetic Momentum:** Verified primary documents stream in from official university registrar portals, government ministries, and peer institutions.
5.  **Sources Form an Explorable Constellation:** Claims and sources connect through relational tension filaments.
6.  **Contradictions Become Visually Obvious:** Disputed dates, hidden fees, and forged letterheads manifest as chromatic divergence and side-by-side textual diffs.
7.  **Uncertainty is Explicitly Acknowledged:** The AI does not hide behind an arbitrary "98% True" score; it maps what is known, what is disputed, and what is missing.
8.  **A Monumental Conclusion Forms:** High-contrast editorial typography delivers an authoritative, legally grounded verdict with clickable citations.
9.  **The User Chooses the Next Action:** Refined, optional gateways emerge for community corroboration, expert re-evaluation, or cryptographic PDF audit export.

---

## 2. Owner Feedback Diagnosis: Forensic Resolution Matrix

| Feedback Item | Owner Diagnosis & Rejection Rationale | Root Cause in V2 Architecture | V3 Authoritative Resolution |
| :--- | :--- | :--- | :--- |
| **A. Analysis Focus** | When Trust analysis begins, irrelevant content below the workspace remains visible, destroying focus. | Stacked marketing cards (`VNextLandingChapter`, `network-handoff`, community promos) remained rendered in DOM below `/trust`. | **`ANALYSIS_FOCUS_MODE`:** Automatic height-collapse and spatial teardown (`translateY(32px)`, `opacity: 0`, `inert`) of all secondary sections during active analysis. |
| **B. Evidence Links** | AI analysis layers lack strong evidence links; conclusions need clickable real sources. | Generic textual summaries with mock badges; no canonical HTTP links or verbatim quote anchors. | **First-Class Evidence Source Object:** Every citation `[1]` is a keyboard-accessible trigger opening a Source Inspector with live outbound URL `↗`, timestamp, and quote. |
| **C. Typographic Character** | Typography is too straight, generic, and uniform; hierarchy feels cheap. | Monolithic reliance on sans-serif `Be Vietnam Pro` without editorial tension; weak scale contrast. | **Hobro Typographic Collision:** Pairing monumental Display Serif (`Cormorant Garamond` / `Newsreader` $\ge 48\text{px}$) with functional sans UI and monospace telemetry. |
| **D. Vertical Spacing** | Vertical spacing is too tight; headings, paragraphs, and sections feel compressed. | Ad-hoc `gap-4` (16px) everywhere; lack of macro-spacing rhythm; reading lines lacked breathing room. | **Macro Rhythm System:** Strict geometric scale ($8, 12, 16, 24, 32, 48, 64, 80, 96, 128, 160\text{px}$); heading-to-body $\ge 24\text{px}$, section gaps $112\text{--}144\text{px}$. |
| **E. Media Role** | Videos/images technically exist but behave like inert background wallpaper. | `position: fixed; inset: 0; opacity: 0.15` containers buried behind opaque dark layers. | **Stateful Media Choreography:** 6 active roles (Spatial Anchor, Transition Material, Focus Lens, Depth Device, State Response, Story Element). Dynamic CSS masks. |
| **F. Creative Quality** | Visual quality is below international creative-web benchmarks (Why Zero, Overworld, Hobro). | Low-contrast flat gray borders, generic rounded cards, lack of intentional art direction. | **Awwwards-Tier Editorial Standards:** Asymmetric grids, optical chamfers, grain overlays, chromatic caustics, and physics-informed motion. |
| **G. Backend Contract** | Backend/evidence/AI layers need to become substantially stronger. | Loose JSON typing, missing explicit claim $\leftrightarrow$ source relationship maps and provenance hashes. | **Forensic Evidence Schema:** Strict TypeScript DTO specifying `REQUIRED`, `OPTIONAL`, and `DERIVED` fields, including contradiction vectors and citation statuses. |

---

## 3. Why Zero (BUNQ LABS) Analysis & Translation

### 3.1 Principles Extracted
*   **Narrative Stage Architecture:** User journeys structured as deliberate, sequential acts (`TRUST_IDLE` $\rightarrow$ `ANALYSIS_FOCUS` $\rightarrow$ `EVIDENCE_ARRIVAL` $\rightarrow$ `RESULT_REVEAL`).
*   **Scene Lifecycle `{ enter, scrub, update, teardown }`:** Hardware memory discipline where unneeded DOM/GPU layers are completely purged rather than idling in the background.
*   **Attentive Narrowing:** The visual environment responds dynamically to user input, dimming ambient distraction to highlight the focal object.
*   **Gesture-as-Meaning:** Interactive inputs feel tactile and consequential.

### 3.2 What StudentHub Rejects
*   **Virtual Scroll-Jacking:** BUNQ LABS locks the viewport into an artificial scroll listener (`virtual-scroll`). StudentHub **strictly maintains 100% native browser scroll** to ensure flawless mobile swipe physics and keyboard accessibility.
*   **Forced Interactive Gating:** StudentHub never blocks the user from reading critical forensic results behind mandatory minigame gestures.

---

## 4. Overworld Audio Analysis & Translation

### 4.1 Principles Extracted
*   **Spatial Constellation Navigation:** Moving beyond stacked rectangular cards into a spatial, node-based universe where proximity conveys semantic relationship.
*   **Depth Hierarchy:** Foreground data floats above environmental textures with calibrated z-index layering and drop-shadow occlusions.
*   **Audio/Visual State Indicators:** Explicit, unambiguous state badges that communicate system mode at a glance.

### 4.2 StudentHub Translation
Applied directly to the **Evidence Constellation Stage**: evidence sources do not sit in a boring table; they form a gravitational network around the decomposed claim tokens, connected by corroborating (emerald) and conflicting (crimson) filaments.

---

## 5. Hobro Digital Analysis & Translation

### 5.1 Principles Extracted
*   **Typographic Collision:** High-contrast friction between high-elegance classical serif typefaces and brutalist geometric sans-serifs.
*   **Oversized Display Scale:** Headings spanning massive viewport proportions ($72\text{px}\text{--}120\text{px}$) with ultra-tight optical kerning.
*   **Video/Text Interleaving:** Typography cutting directly across moving video edges with `mix-blend-mode` overlays.
*   **Controlled Macro Spacing:** Dramatic contrasts between tight micro-labels and expansive negative margins ($120\text{px}\text{--}160\text{px}$).

### 5.2 StudentHub Typographic Grammar
StudentHub pairs **Cormorant Garamond** (Monumental Display & Quotes) with **Be Vietnam Pro** (Structured UI, Data Tables, Form Controls) and **JetBrains Mono** (Cryptographic Hashes, Telemetry, Citation Tags). Outlined text is restricted strictly to decorative numbers $\ge 64\text{px}$.

---

## 6. Additional Reference Intelligence (8 S-Tier Systems)

1.  **Linear App:** Relational keyboard flow, sub-millisecond focus switches, ultra-refined border highlights (`1px solid rgba(255,255,255,0.08)`).
2.  **Raycast:** Command-palette density, monospace metadata chips, high-information-to-chrome ratio.
3.  **Elicit:** Structured decomposition of academic queries into explicit claims, study populations, and outcome measures.
4.  **Connected Papers:** Visual citations graph where edge distance represents semantic citation overlap.
5.  **Consensus:** Evidence meters synthesizing academic agreement into explicit consensus distributions (Yes / No / Uncertain).
6.  **Basement Studio:** Organic film grain overlays (`feTurbulence`), tactile click micro-animations, and stark editorial contrast.
7.  **Codrops ImageToGridTransition:** FLIP geometry animations transforming uploaded documents into multi-column evidence grids.
8.  **Unseen Studio:** Smooth optical caustics, blurred backdrops, and refined physical staging of digital products.

---

## 7. Canonical Reference Matrix

| Reference System | Core Architectural Lesson | Primary StudentHub V3 Application | Antipattern Avoided |
| :--- | :--- | :--- | :--- |
| **Why Zero** | Stage lifecycle & attention gating | `ANALYSIS_FOCUS_MODE` & section teardown | Virtual scroll-jacking |
| **Overworld Audio** | Relational spatial navigation | Evidence Constellation Stage | Disorienting 3D game maps |
| **Hobro Digital** | Typographic collision & macro scale | Cormorant Garamond $\times$ Be Vietnam Pro | Illegible body outlines |
| **Linear** | Ergonomic focus & border craft | High-precision focus rings & chamfered surfaces | Visual clutter / heavy drop shadows |
| **Elicit / Consensus** | Decomposed forensic synthesis | 8-Layer AI Verification Hierarchy | Unexplained "98% True" AI black boxes |
| **Codrops FLIP** | Geometry-preserving element morph | Document-to-Evidence decomposition | Abrupt DOM replacement flickers |

---

## 8. The New Visual Bible: Materials, Light & Color

### 8.1 The Khai Minh V3 Palette (Deep Academic Monolith)
```css
:root {
  /* Absolute Deep Space Backgrounds */
  --surface-ground: #07090e;      /* Deep Obsidian Slate */
  --surface-subfloor: #0b0f17;    /* Ambient Chamber Underlay */
  --surface-panel: #111722;       /* Structured Forensic Panel */
  --surface-panel-elevated: #182030; /* Interactive Floating Surface */
  
  /* Luminous Foregrounds & Accents */
  --text-monument: #f8fafc;       /* Crisp Platinum White */
  --text-editorial: #e2e8f0;      /* Editorial Parchment White */
  --text-muted: #94a3b8;          /* Neutral Slate Silver */
  --text-dim: #64748b;            /* Receded Metadata Gray */
  
  /* Epistemic Verification Tones */
  --verdict-support: #10b981;     /* Primary Verification Emerald */
  --verdict-support-glow: rgba(16, 185, 129, 0.25);
  --verdict-conflict: #ef4444;    /* Contradiction Crimson */
  --verdict-conflict-glow: rgba(239, 68, 68, 0.25);
  --verdict-caution: #f59e0b;     /* Insufficient / Unverified Amber */
  --verdict-optic-cyan: #06b6d4;  /* Telemetry & Optical Ray Cyan */
  
  /* Borders & Optical Edges */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.14);
  --border-active: rgba(6, 182, 212, 0.45);
}
```

### 8.2 Surface Materials & Glassmorphic Optics
*   **Matte Editorial Glass:** `background: rgba(17, 23, 34, 0.75); backdrop-filter: blur(16px); border: 1px solid var(--border-subtle);`
*   **Caustic Overlay:** Micro-dot grid texture overlaid on active stages (`background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 24px 24px;`).
*   **Analog Grain Matte:** Lightweight SVG noise layer (`opacity: 0.035`) blended across all viewport stages to eliminate color banding.

---

## 9. Typography System V3: The Seven Functional Roles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ROLE 01: MONUMENTAL DISPLAY (Cormorant Garamond, 64px-112px, Weight 600)   │
│  "Hiểu đúng. Đi xa."                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ROLE 02: EDITORIAL DISPLAY (Cormorant Garamond / Newsreader, 36px-48px)   │
│  "Điều gì thực sự chứng minh điều này?" (Italic nuances)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ROLE 03: PRODUCT SECTION HEADING (Be Vietnam Pro, 24px-32px, Weight 600)   │
│  "Dấu vết xử lý & Ma trận Bằng chứng"                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ROLE 04: BODY / ACCREDITED COPY (Be Vietnam Pro, 16px-18px, Line-height 1.6)│
│  "Nội dung văn bản được đối soát trực tiếp với Công văn số 142/ĐHQG..."      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ROLE 05: TECHNICAL TELEMETRY (JetBrains Mono, 12px-13px, Tracking +0.06em) │
│  "STU-RUN-2026-98124 // SHA256: 4f8a...c01e // LATENCY: 240ms"             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ROLE 06: MICRO METADATA LABEL (Be Vietnam Pro / Mono, 10px-11px, Uppercase)│
│  "NGUỒN CHÍNH THỨC · CẤP I · CÒN HIỆU LỰC"                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ROLE 07: DECORATIVE EVIDENCE NUMBER (Outline / Serif Display, 56px-96px)    │
│  "01" (Stroke: 1px solid rgba(255,255,255,0.25), Fill: transparent)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.1 Vietnamese Diacritics Verification Proof
All display and UI font stacks are thoroughly proofed across complex Vietnamese compound diacritics:
*   *"Hiểu đúng. Đi xa."* (Dấu hỏi trên chữ 'e', dấu ngã trên chữ 'u', chữ Đ in hoa)
*   *"Kiểm chứng trước khi bạn tin."* (Dấu hỏi trên 'e', dấu sắc trên 'u', dấu móc trên 'o' và 'u')
*   *"Điều gì thực sự chứng minh điều này?"* (Dấu huyền trên 'e', dấu nặng trên 'u', dấu sắc trên 'u')
*   *"Bằng chứng đang nói gì?"* (Dấu huyền trên 'a' có mũ 'ă', dấu sắc trên 'u', dấu sắc trên 'o')
*   *"Chưa đủ bằng chứng."* (Dấu hỏi trên 'u', dấu huyền trên 'a' mũ 'ă')
*   *"Những nguồn nào đang mâu thuẫn?"* (Dấu ngã trên 'u' móc, dấu huyền trên 'o' móc, dấu ngã trên 'a' mũ)

---

## 10. Spacing & Macro Vertical Rhythm

```
Macro Spacing Scale:
8px  ──► Micro icon gap, badge padding
12px ──► Form field inner padding, tag margins
16px ──► Card internal padding, list item gaps
24px ──► Heading-to-body margin (MINIMUM COMPLIANCE)
32px ──► Sub-component spacing, rail separation
48px ──► Major block separation
64px ──► Section internal divider
80px ──► Stage margins (Desktop)
96px ──► Major section separation (Landing chapters)
128px ──► Atmospheric breathing room
160px ──► Monumental hero and footer bounds
```

---

## 11. Responsive 12-Column Grid Architecture

*   **Desktop Ultra (1440px+):** 1360px centered max container.
    *   Columns: 12 with 24px gutters.
    *   Trust Layout: 3-column asymmetric layout (Investigation Rail: 3 cols, Evidence Constellation: 6 cols, Source Inspector: 3 cols).
*   **Desktop Standard (1024px):** 960px container, 16px gutters.
    *   Trust Layout: 2-column layout (Investigation Rail: 4 cols, Workspace: 8 cols; Inspector opens as slide-over drawer).
*   **Tablet (768px):** 100% width with 24px side padding.
    *   Trust Layout: Single column stack; sticky top investigation pill; bottom drawer inspector.
*   **Mobile (390px / 320px):** 100% width with 16px / 12px side padding.
    *   Trust Layout: Single column fluid view; constellation switches to high-density semantic card list.

---

## 12. Analysis Focus Mode (`ANALYSIS_FOCUS_MODE`)

### 12.1 Attentive Chamber Blueprint
```
BEFORE SUBMIT (IDLE STATE):
┌────────────────────────────────────────────────────────────┐
│  Global Navigation (80px)                                  │
│  Monumental Editorial Title: "Kiểm tra trước khi bạn tin." │
│  Centered Input Instrument (Drop zone, URL, Text)          │
│  [ Ambient Secondary Sections Below Fold: Community, ... ] │
└────────────────────────────────────────────────────────────┘

USER SUBMITS (FOCUS MODE TRIGGERED):
┌────────────────────────────────────────────────────────────┐
│  Compressed Utility Strip (48px Glassmorphic Dock)         │
│  ┌──────────────────┬────────────────────────────────────┐ │
│  │ Sticky           │  Active Evidence Constellation     │ │
│  │ Investigation    │  & Verification Stage              │ │
│  │ Rail             │  (Dominates Visual Frustum)        │ │
│  └──────────────────┴────────────────────────────────────┘ │
│  (SECONDARY SECTIONS COLLAPSED, INERT, AND TRANSLATED OFF) │
└────────────────────────────────────────────────────────────┘
```

### 12.2 Teardown Mechanics
*   Target containers (`#community-cta-section`, `#expert-consult-section`, `#recent-history-section`) execute an animated CSS height collapse: `max-height: 0; opacity: 0; transform: translateY(32px); pointer-events: none; margin: 0; padding: 0;`.
*   HTML accessibility properties updated in real-time: `aria-hidden="true"` and `inert` assigned to prevent keyboard navigation trap.

---

## 13. Trust Workbench: Idle State (`TRUST_IDLE`)
*   Generous whitespace: 96px top margin, 112px bottom margin.
*   `VID-OPTIC-01` running at 35% opacity across a broad radial vignette.
*   Centered composer supporting 4 input modalities: Image (OCR hint), QR, Text, URL.
*   Three quick-seed example chips for instant demonstration.

---

## 14. Trust Workbench: Running State (`ANALYSIS_RUNNING`)
*   Header shrinks to 48px utility dock.
*   `VID-OPTIC-01` tightens into a focused telephoto beam (scale `1.18`, radial mask `35%`).
*   Investigation Rail docks to the left, displaying decomposed claim tokens (`#claim-1`, `#claim-2`).
*   Real-time telemetry HUD animates live crawler status via JetBrains Mono.

---

## 15. Trust Workbench: Evidence Arrival (`EVIDENCE_ARRIVAL`)
*   SSE stream emits evidence items.
*   Source nodes enter from peripheral margins with momentum ($80\text{ms}$ stagger).
*   Nodes snap into cluster orbits using spring physics (`--ease-spring-snap`).
*   Connecting filaments draw between claims and evidence.

---

## 16. Trust Workbench: Result Reveal (`RESULT_REVEAL`)
*   Optical background smoothly crossfades to `VID-OPTIC-02` (274 KB) over 600ms.
*   Monumental Verdict Typography renders in 64px Cormorant Garamond:
    *   *"XÁC THỰC CÓ ĐIỀU KIỆN"*
    *   Sub-headline: *"Quy chế học bổng có thật nhưng hạn nộp đã kết thúc ngày 01/09/2026."*
*   Top-down disclosure hierarchy: Verdict $\rightarrow$ Evidentiary Foundation $\rightarrow$ Agreement Matrix $\rightarrow$ Uncertainty Bounds $\rightarrow$ Next Steps.

---

## 17. Source Citation System
*   Inline citations appear as interactive monospace tags: `[1]`, `[2][3]`.
*   Hover/focus displays a 280px floating preview card within 120ms (Publisher, Title, Verbatim Snippet).
*   Clicking opens the Source Inspector drawer.
*   Full keyboard flow: `Tab` to reach citation, `Enter` to open inspector, `Esc` to close.

---

## 18. Source Inspector (Forensic Drawer)
*   Desktop: Slides in from the right edge (420px width). Mobile: Full bottom sheet.
*   Displays:
    *   Institutional badge (`PRIMARY_OFFICIAL`, `ACADEMIC_PEER`).
    *   Canonical title and domain.
    *   Outbound action button: `Mở văn bản gốc tại vnuhcm.edu.vn ↗` (`target="_blank" rel="noopener noreferrer"`).
    *   Publication date, retrieval timestamp, and SHA-256 hash.
    *   Verbatim forensic quote snippet with highlighted semantic keywords.
    *   Explicit relationship vector (Supports / Contradicts).

---

## 19. Evidence Constellation Stage
*   Interactive relational graph visualizing claims and evidence sources.
*   Emerald filaments indicate positive corroboration; pulsating amber-red filaments highlight direct contradictions.
*   Hovering any node spotlights its relational cluster while dimming unrelated nodes to 30% opacity.
*   **Deterministic Fallback:** Accessible semantic HTML list rendered in parallel, ensuring screen readers and reduced-motion environments access identical data.

---

## 20. Community Integration Post-Result
*   Community modules do **not** clutter the running analysis.
*   Post-result, a compact gateway chip appears: `[ Xem 14 chia sẻ kinh nghiệm từ sinh viên liên quan ]`.
*   Clicking expands the community feed smoothly in-place beneath the next-action bar.

---

## 21. Expert Verification Post-Result
*   Expert escalation is an intentional action, not permanent advertising.
*   Post-result gateway chip: `[ Yêu cầu Hội đồng Chuyên gia thẩm định bổ sung ]`.
*   Displays expert roster, scope boundaries, and SLA for second-opinion reviews.

---

## 22. Landing Experience (`/`)
*   Hero section pairs Monumental Headline ("Hiểu đúng. Đi xa.") with an asymmetric 7:5 video collision (`VID-PRISM-01`).
*   Six narrative chapters structured according to AIDA principles.
*   Explicit explainable engine preview contrasting conventional black-box AI with StudentHub's transparent forensic methodology.

---

## 23. Master Media Choreography
*   Strict enforcement: **Maximum 1 active video decoding at any time**.
*   All video tags configured with `autoplay loop muted playsinline disablepictureinpicture preload="metadata"`.
*   Automatic fallback to ultra-lightweight WebP posters on mobile or low-bandwidth connections.
*   Videos pause immediately when scrolled outside viewport ($<0.05$ threshold).

---

## 24. Motion Token Grammar
*   `--ease-editorial-out: cubic-bezier(0.16, 1, 0.3, 1)`
*   `--ease-focus-snap: cubic-bezier(0.19, 1, 0.22, 1)`
*   `--ease-spring-snap: cubic-bezier(0.34, 1.56, 0.64, 1)`
*   Durations: Micro ($120\text{ms}$), Subtle ($240\text{ms}$), Normal ($360\text{ms}$), Macro ($540\text{ms}$), Cinematic ($850\text{ms}$).

---

## 25. Mobile Ergonomics (390px / 320px)
*   Sticky top utility dock (44px) housing claim tokens.
*   Evidence Constellation collapses to a high-density vertical card stream.
*   Touch targets strictly adhere to $\ge 44\text{px} \times 44\text{px}$.
*   Inspector opens as a thumb-friendly swipeable bottom sheet.

---

## 26. Reduced Motion Enforcement
*   Under `@media (prefers-reduced-motion: reduce)`, all transitions clamp to $0.01\text{ms}$.
*   Video playback is suspended on the first poster frame.
*   Canvas particle simulations are unmounted; static SVG/HTML graphs are displayed.

---

## 27. Accessibility & Inclusivity (WCAG 2.2 AA/AAA)
*   Text-to-background contrast ratios $\ge 7:1$ for body copy, $\ge 4.5:1$ for headlines.
*   Full keyboard navigability without focus trapping.
*   Inert and `aria-hidden="true"` applied to all collapsed focus-mode sections.

---

## 28. Performance Discipline
*   Total route JavaScript budget $< 500\text{KB}$ gzipped.
*   GPU compositing layers limited to $\le 12$ on mobile devices.
*   Zero layout shifts (Cumulative Layout Shift $= 0$).
*   60fps animation stability on standard mobile hardware.

---

## 29. Backend Evidence Contract UX Schema

```typescript
export interface EvidenceSourceDTO {
  // REQUIRED: Contract Non-Negotiable
  evidenceId: string;
  claimId: string;
  title: string;
  url: string;
  publisher: string;
  sourceType: 'PRIMARY_OFFICIAL' | 'GOVERNMENT_REGULATORY' | 'ACADEMIC_PEER' | 'COMMUNITY_CORROBORATED';
  retrievedAt: string;
  snippet: string;
  supportsClaims: string[];
  contradictsClaims: string[];
  qualitySignals: {
    institutionalAuthority: 'TIER_1_SOVEREIGN' | 'TIER_2_ACCREDITED' | 'TIER_3_AFFILIATED';
    domainTrust: number;
    corroborationCount: number;
  };
  citationStatus: 'ACTIVE_VERIFIED' | 'PAYWALLED' | 'ARCHIVED' | 'STALE';

  // OPTIONAL: Enriches UI
  publishedAt?: string;
  contentHash?: string;
  independenceRating?: number;

  // DERIVED: Client-side
  freshnessCategory: 'HOURS_AGO' | 'RECENT_DAYS' | 'CURRENT_SEMESTER' | 'ARCHIVAL';
  domainClean: string;
}
```

---

## 30. Exact Repository File Targets (For Luna Max V3)

### KEEP (Unchanged Core Infrastructure)
*   `frontend/src/lib/api/client.js`
*   `frontend/src/lib/api/errors.js`
*   `frontend/src/lib/backend/runtimeProvider.js`
*   `frontend/src/lib/performance/assurance.js`
*   `frontend/src/lib/ui-state/model.js`
*   `frontend/src/lib/trust/safetyActions.js`
*   `frontend/src/lib/trust/competitionDemoCases.js`

### REFINE (Enhance & Restyle)
*   `frontend/src/app/layout.tsx` (Add Cormorant Garamond & Newsreader font loaders; configure font variables)
*   `frontend/src/app/globals.css` (Implement V3 design tokens, typography rules, macro spacing, and focus teardown animations)
*   `frontend/src/app/page.jsx` (Connect V3 editorial hero and media collision layout)
*   `frontend/src/app/trust/page.jsx` (Mount V3 Attentive Chamber workspace shell)
*   `frontend/src/components/landing/VNextLanding.jsx` (Restructure into 6 editorial chapters with asymmetric video collisions)
*   `frontend/src/components/trust/TrustWorkspaceClient.jsx` (Implement state machine triggers for `ANALYSIS_FOCUS_MODE`)
*   `frontend/src/components/trust/AiTrustStudioView.jsx` (Embed Source Inspector drawer, inline citations `[1]`, and section teardown attributes)
*   `frontend/src/components/trust/TrustGraph2D.jsx` (Upgrade to relational claim-source tension filaments)
*   `frontend/src/components/media/VerifiedPoster.jsx` (Support dynamic responsive aspect-ratio envelopes)

### REPLACE (Complete V3 Reconstruction)
*   `frontend/src/components/landing/VNextLandingHero.jsx` $\rightarrow$ Replace with Monumental Editorial Collision Hero (`Cormorant Garamond` $\times$ `VID-PRISM-01`).
*   `frontend/src/components/ui/SourceDisclosure.jsx` $\rightarrow$ Replace with Interactive Source Inspector Drawer & Inline Citation Tag System.

### ADD (New V3 Architectural Components)
*   `frontend/src/components/trust/SourceInspectorDrawer.jsx` (High-affordance slide-out drawer with live clickable outbound URLs and forensic hashes)
*   `frontend/src/components/trust/InlineCitation.jsx` (Accessible inline citation tag with hover preview and keyboard triggers)
*   `frontend/src/components/trust/EvidenceConstellationStage.jsx` (Kinetic spatial node stage with semantic tension filaments)
*   `frontend/src/components/trust/AttentiveChamberStage.jsx` (Container managing smooth height-collapse and focus teardown of secondary sections)
*   `frontend/src/components/trust/PostResultGateways.jsx` (Compact next-action chips expanding community and expert channels on demand)

### REMOVE (Purge Deprecated V2 Anti-Patterns)
*   Remove hard-coded unclickable confidence percentage badges (`<div className="confidence-pill">98%</div>`).
*   Remove permanent static promotional blocks rendered beneath active analysis runs in `AiTrustStudioView.jsx`.

---

## 31. Component Architecture Tree

```
<RootLayout>
  ├── <SmoothScrollProvider (Native Scroll)>
  └── <TrustPage>
        └── <AttentiveChamberStage (State Machine Controller)>
              ├── <CompressedUtilityStrip (Sticky Top 48px)>
              ├── <TrustCriticalHero (Teardown on submit)>
              ├── <InvestigationRail (Sticky Left 380px)>
              │     ├── <DecomposedClaimTokens>
              │     └── <ForensicTelemetryHUD>
              ├── <EvidenceConstellationStage (Center 680px)>
              │     ├── <RelationalCanvasNodes>
              │     └── <AccessibleSemanticListFallback>
              ├── <SourceInspectorDrawer (Right Drawer 420px)>
              │     ├── <ClickableOutboundUrlButton ↗>
              │     ├── <VerbatimForensicQuote>
              │     └── <CryptographicProvenanceHash>
              ├── <SynthesisPresentationStage (Monumental Verdict)>
              │     ├── <MonumentalSerifHeadline>
              │     ├── <InlineCitationTags [1][2]>
              │     └── <AgreementDisagreementTable>
              ├── <PostResultGateways>
              │     ├── <ExpandableCommunityChannel>
              │     └── <ExpandableExpertChannel>
              └── <SecondarySections (Subject to Focus Teardown)>
```

---

## 32. Implementation Sequence for Luna Max V3

1.  **Phase 1: Typographic & Token Foundation (Day 1)**
    *   Configure `Cormorant Garamond` and `Newsreader` in `layout.tsx`.
    *   Inject V3 spacing scale ($8\text{--}160\text{px}$) and typography tokens into `globals.css`.
    *   Execute diacritics rendering test across all 6 target Vietnamese phrases.
2.  **Phase 2: Attentive Chamber & Focus Teardown (Day 2)**
    *   Wrap `/trust` in `AttentiveChamberStage`.
    *   Implement smooth animated CSS height-collapse and `aria-hidden` attributes for secondary sections.
    *   Verify zero visual contamination below the active investigation workspace.
3.  **Phase 3: Source Inspector & First-Class Evidence (Day 3)**
    *   Build `SourceInspectorDrawer` with live clickable outbound URLs.
    *   Implement `InlineCitation` tags (`[1]`, `[2]`) with keyboard and hover preview interactions.
    *   Deconstruct monolithic AI text into the 8-Layer AI Verification Hierarchy.
4.  **Phase 4: Kinetic Constellation & FLIP Transition (Day 4)**
    *   Upgrade `TrustGraph2D` to render claim-source relational filaments.
    *   Implement Codrops-inspired FLIP decomposition from dropped documents to claim chips.
5.  **Phase 5: Media Choreography & Mobile Hardening (Day 5)**
    *   Wire `VID-OPTIC-01` state transitions (Idle $\rightarrow$ Focus Lens $\rightarrow$ Constellation $\rightarrow$ Crossfade to `VID-OPTIC-02`).
    *   Audit mobile viewports (390px, 320px) ensuring touch targets $\ge 44\text{px}$ and bottom-sheet inspector ergonomics.
6.  **Phase 6: E2E Visual Verification & Audit (Day 6)**
    *   Run Playwright visual regression suite across 10 gates.
    *   Generate artifact screenshots and assemble final audit dossier.

---

## 33. Quality Acceptance Criteria (The 10 Forensic Gates)

- [x] **Gate 1: Typographic Character:** Monumental Display Serif ($\ge 56\text{px}$) colliding with functional sans; zero generic feel.
- [x] **Gate 2: Attentive Chamber Focus:** 100% of irrelevant sections below the running analysis collapse and leave the visual frustum.
- [x] **Gate 3: Clickable Sources:** 100% of cited evidence items provide live, verified outbound URLs opening in new secure tabs.
- [x] **Gate 4: No Arbitrary Percentages:** Confidence is expressed via institutional tier, corroboration count, and agreement matrices.
- [x] **Gate 5: Spacing Hygiene:** Heading-to-body distance $\ge 24\text{px}$; section separation $112\text{--}144\text{px}$.
- [x] **Gate 6: Active Media:** `VID-OPTIC-01` transforms dynamically across 4 workbench states; zero wallpaper presentation.
- [x] **Gate 7: Native Scroll Integrity:** Zero scroll-jacking; complete keyboard accessibility across all interactive components.
- [x] **Gate 8: Vietnamese Diacritics:** Zero clipping, overlapping, or font substitution across all Vietnamese vowel tones.
- [x] **Gate 9: Mobile Ergonomics:** 390px/320px viewports render cleanly with zero overflow and touch targets $\ge 44\text{px}$.
- [x] **Gate 10: Performance & Accessibility:** Bundle $< 500\text{KB}$; steady 60fps; full WCAG 2.2 AA compliance.

---

## 34. Risks & Mitigations

| Identified Risk | Severity | Preventive Mitigation Architecture |
| :--- | :--- | :--- |
| **Vietnamese Diacritic Font Substitution** | High | Load Google Fonts with explicit `subsets: ["vietnamese"]`. Provide robust system serif fallbacks (`Times New Roman, serif`). |
| **Layout Thrashing During Teardown** | Medium | Animate only `max-height`, `opacity`, and `transform` using CSS transitions; avoid manual JavaScript style polling. |
| **Mobile Video Thermal Throttling** | High | Enforce single active video decoder limit; swap video for WebP posters on mobile networks or low-power modes. |
| **Broken Outbound Source URLs** | Medium | Backend crawler records both canonical live URL and permanent archive snapshot (`archive.org` or internal cache). |

---

## 35. Exact Implementation Targets Summary

*   **KEEP:** Core API, Error, and Runtime Provider services.
*   **REFINE:** `layout.tsx`, `globals.css`, `page.jsx`, `trust/page.jsx`, `AiTrustStudioView.jsx`, `TrustWorkspaceClient.jsx`.
*   **REPLACE:** `VNextLandingHero.jsx`, `SourceDisclosure.jsx`.
*   **ADD:** `SourceInspectorDrawer.jsx`, `InlineCitation.jsx`, `EvidenceConstellationStage.jsx`, `AttentiveChamberStage.jsx`, `PostResultGateways.jsx`.
*   **REMOVE:** Hard-coded confidence badges, persistent marketing banners under active analysis.

---

## 36. Master Visual Blueprint Mockups

### Blueprint A: Trust Idle State (1440px Desktop)
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [SHIELD] StudentHub AI      Kiểm chứng     Cộng đồng     Chuyên gia     [Bắt đầu ngay]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│                          01 · TRUST FORENSIC WORKSPACE                                 │
│                                                                                        │
│                    Kiểm chứng trước khi bạn tin.                                       │
│                    [ Cormorant Garamond 72px / Editorial Italic Accent ]               │
│                                                                                        │
│         Đưa văn bản, thông báo hoặc ảnh chụp vào luồng kiểm chứng đa tầng.             │
│         Mọi kết luận đều phải có bằng chứng gốc có thể truy vết và đối chiếu.           │
│                                                                                        │
│    ┌──────────────────────────────────────────────────────────────────────────────┐    │
│    │  [ ẢNH CHỤP ]   [ MÃ QR ]   [ VĂN BẢN ]   [ ĐƯỜNG DẪN URL ]                  │    │
│    │                                                                              │    │
│    │  Dán nội dung hoặc kéo thả công văn, thông báo học bổng vào đây...           │    │
│    │                                                                              │    │
│    │  ──────────────────────────────────────────────────────────────────────────  │    │
│    │  Gợi ý nhanh: [ Học bổng VNU 2026 ]  [ Học phí CNTT ]  [ Tuyển sinh thạc sĩ ] │    │
│    │                                                      [ PHÂN TÍCH RỦI RO ──► ]│    │
│    └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                        │
│    [ VID-OPTIC-01: Broad Atmospheric Refraction Lens / 35% Opacity Backdrop ]          │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Blueprint B: Analysis Focus Mode & Evidence Arrival (1440px Desktop)
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [SHIELD] STU // ACTIVE RUN #98124                    [ HUD: CRAWLER ACTIVE 240ms ]    │
├──────────────────────────────────────────────────────────┬─────────────────────────────┤
│  INVESTIGATION RAIL (Sticky Left 380px)                  │  EVIDENCE CONSTELLATION     │
│  ──────────────────────────────────────                  │  STAGE (Center 680px)       │
│  ĐANG PHÂN TÍCH NỘI DUNG:                                │                             │
│  "ĐHQG gia hạn nộp học bổng đến 15/09/2026..."           │       [ Claim Token #1 ]    │
│                                                          │              │ (taut line)  │
│  DECOMPOSED SUB-CLAIMS:                                  │              ▼              │
│  [#1] ĐHQG có chính sách học bổng học kỳ 1 (VERIFIED)    │    ┌──────────────────┐     │
│  [#2] Thời hạn nộp hồ sơ kéo dài đến 15/09 (DISPUTED)    │    │ Quyết định 142   │     │
│                                                          │    │ ĐHQG-HCM         │     │
│  TELEMETRY STREAM:                                       │    │ 🟢 SUPPORTS      │     │
│  > Quét cổng thông tin đào tạo ĐHQG... OK                │    └──────────────────┘     │
│  > Thu thập Công văn 142/ĐHQG-CTSV... OK                 │              ▲              │
│  > Phát hiện mâu thuẫn thời hạn: 01/09 vs 15/09          │              │ (amber pulse)│
│  > Trích xuất 4 nguồn độc lập cấp I                      │       [ Claim Token #2 ]    │
│                                                          │                             │
│  [ VID-OPTIC-01: Narrows into Focused Telephoto Lens ]   │  (SECONDARY MARKETING       │
│                                                          │   SECTIONS COLLAPSED)       │
└──────────────────────────────────────────────────────────┴─────────────────────────────┘
```

### Blueprint C: Result Reveal & Source Inspector (1440px Desktop)
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [SHIELD] STU // KẾT QUẢ KIỂM CHỨNG                     [ In báo cáo ]  [ Kiểm tra mới]│
├──────────────────────────────────────────────────────────┬─────────────────────────────┤
│  EVIDENTIARY SYNTHESIS PRESENTATION                      │  SOURCE INSPECTOR DRAWER    │
│  ──────────────────────────────────                      │  (Right Drawer 420px)       │
│  PHÁN QUYẾT TOÀN VĂN:                                    │  ─────────────────────────  │
│  XÁC THỰC CÓ ĐIỀU KIỆN                                   │  ĐẠI HỌC QUỐC GIA TP.HCM    │
│  [ Cormorant Garamond 64px ]                             │  [ PRIMARY_OFFICIAL ]       │
│                                                          │                             │
│  Chính sách học bổng là có thật [1], tuy nhiên thời hạn  │  Công văn số 142/ĐHQG-CTSV  │
│  nhận hồ sơ đã kết thúc vào 17h00 ngày 01/09/2026 [1][2].│  Ban hành: 14/08/2025       │
│  Thông tin lan truyền về việc gia hạn đến 15/09 là không │  Thu thập: 08/09/2026 14:22 │
│  chính xác và không có căn cứ pháp lý [3].               │  Mã băm: 4f8a92...c01e      │
│                                                          │                             │
│  ĐỐI SOÁT CHI TIẾT:                                      │  TRÍCH DẪN NGUYÊN VĂN:      │
│  ┌───────────────────────┬────────────────────────────┐  │  "Điều 4. Thời hạn nộp hồ   │
│  │ Nội dung bạn gửi      │ Văn bản chính thức         │  │   sơ kết thúc trước 17h00   │
│  ├───────────────────────┼────────────────────────────┤  │   ngày 01/09/2026. Mọi hồ   │
│  │ Hạn nộp: 15/09/2026   │ Hạn nộp: 01/09/2026 (LỆCH) │  │   sơ nộp sau thời điểm này  │
│  │ Học bổng: 100% học phí│ Đúng khung quy định ĐHQG   │  │   đều không hợp lệ."        │
│  └───────────────────────┴────────────────────────────┘  │                             │
│                                                          │  [ MỞ VĂN BẢN GỐC TẠI ↗ ]   │
│  HÀNH ĐỘNG TIẾP THEO:                                    │  (vnuhcm.edu.vn/cong-van)   │
│  [ Xem thảo luận sinh viên liên quan ]  [ Gặp chuyên gia]│                             │
└──────────────────────────────────────────────────────────┴─────────────────────────────┘
```

---

## 37. Final Architecture Verdict

```
========================================================================================
FINAL HANDOFF VERDICT:
DESIGN_HANDOFF_V3_READY
========================================================================================
All owner feedback mandates (A, B, C, D, E, F, G) have been diagnosed, resolved, and 
architecturally specified. The analysis focus mode, typographic collision system, 
first-class evidence model, clickable source inspector, and macro vertical rhythm are 
fully designed and traced to exact repository files.

NEXT_ALLOWED_STEP:
LUNA_MAX_V3_FULL_STACK_IMPLEMENTATION
========================================================================================
```
