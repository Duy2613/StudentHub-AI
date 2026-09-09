# TRUST FOCUS STUDY V3: ATTENTIONAL NARROWING & WORKBENCH STAGE ARCHITECTURE
**Document ID:** `STU-V3-REF-FOCUS-001`  
**Classification:** UX Architecture, Attentional Engineering & Stage Mechanics  
**Role Scope:** Principal Product UX Architect, Interaction Designer, Creative Director  
**Status:** Canonical Reference Intelligence for V3 Handoff  

---

## 1. Executive Diagnosis: Eliminating Visual Contamination

### 1.1 The Owner's Explicit Rejection
> *"When Trust analysis begins, irrelevant content below the analysis workspace remains visible. This destroys focus."*

In StudentHub V2, when a user entered a claim or uploaded a circular in `/trust`, the active analysis workspace sat directly on top of marketing cards, community testimonials, expert consultation promos, and historical run logs. As the API returned streaming status messages, the user could still see irrelevant cards below the fold. This created severe cognitive fragmentation:
*   The user is trying to evaluate whether a scholarship announcement is fraudulent or authentic.
*   Directly underneath, a 600px promotional block for "Gia nhập Cộng đồng Học thuật" and "Đặt lịch Phản biện Chuyên gia" competed for visual dominance.
*   The interface behaved like a commercial e-commerce landing page rather than a forensic verification instrument.

### 1.2 The V3 Principle: "The Attentive Chamber"
When analysis begins, the interface must undergo an intentional spatial metamorphosis: **The Attentive Chamber**.
1.  **Zero Peripheral Contamination:** Everything non-essential to resolving the current claim must gracefully yield, collapse, or leave the active visual frustum.
2.  **Intentional Mechanics Over Lazy CSS Hacks:** We do not simply fire an abrupt `display: none` that produces jarring layout jumps. Secondary elements animate out via a synchronized height collapse, opacity fade, and spatial retreat (`translateY(24px) scale(0.98)`).
3.  **Preservation of Document Flow & Native Scroll:** The workspace expands upward and locks into a sticky, high-ergonomics inspection theater. Native scroll remains available to inspect extensive evidentiary chains, but the scroll boundary is strictly bounded to the active investigation.

---

## 2. The 7-Stage State Transformation Lifecycle

```
[ STAGE 0: TRUST_IDLE ]
Centered Input Instrument • Ambient Optical Dispersion • Example Prompts
              │
              ▼ (User submits claim via Cmd+Enter or Click)
[ STAGE 1: ANALYSIS_ENTER ]
Focus Ripple • Input Card Compresses • Optical Lens Tightens
              │
              ▼ (Attentive Chamber Locks In)
[ STAGE 2: ANALYSIS_FOCUS ]
Secondary Sections Teardown • Header Minimizes • Investigation Rail Mounts
              │
              ▼ (Streaming Backend: Sources Found)
[ STAGE 3: EVIDENCE_ARRIVAL ]
Source Nodes Stream In • Cluster Formation • Proximity Physics
              │
              ▼ (Contradiction Check & Claim Matching)
[ STAGE 4: SYNTHESIS ]
Claims Decomposed • Filaments Highlight Concordance / Conflict
              │
              ▼ (Verdict Formulation)
[ STAGE 5: RESULT_REVEAL ]
Monumental Editorial Headline • Crystalline Caustic Wash • Evidentiary Foundation
              │
              ▼ (Post-Verdict Exploration)
[ STAGE 6: POST_RESULT_EXPLORATION ]
Compact Action Gateways: [Xem cộng đồng] [Tham vấn chuyên gia] [Xuất báo cáo PDF]
```

---

## 3. Stage-by-Stage Spatial Choreography

### 3.1 Stage 0: `TRUST_IDLE`
*   **Visual Dominance:** Clean, centered forensic input instrument with generous negative space (macro margin top: `96px`, bottom: `112px`).
*   **Atmosphere:** `VID-OPTIC-01` running at ambient `35%` opacity, dispersed across a wide radial vignette.
*   **Typography:** Editorial Display Serif ("Kiểm chứng trước khi bạn tin") with subtle italic emphasis and micro-monospace status badge (`STU-ENGINE-v3 // READY`).
*   **Action Affordances:** Multi-modal drop zone (paste text, URL link, drag-and-drop university circular PDF or image), quick-seed example chips ("Học bổng Erasmus 2026", "Thông báo học phí mới").

### 3.2 Stage 1 & 2: `ANALYSIS_ENTER` $\rightarrow$ `ANALYSIS_FOCUS`
*   **Trigger:** Analysis execution initiated.
*   **Header Compression:** The global site navigation compresses from `80px` to a compact `48px` glassmorphic utility strip (`backdrop-filter: blur(16px)`), docking essential brand mark and session tokens.
*   **Input Morph:** The wide input box seamlessly collapses into a persistent, high-density **Investigation Rail** docked at the top-left or sticky top, displaying:
    *   The sanitized claim text with high-contrast glyphs.
    *   Decomposed sub-claim tokens (`#claim-1`, `#claim-2`).
    *   Dynamic forensic progress ticker (`JetBrains Mono`, 12px).
*   **Secondary Section Teardown:**
    *   Community Promo (`#community-cta-section`): Slides down $32\text{px}$, fades to `opacity: 0`, and smoothly collapses `height: 0` with `overflow: hidden; pointer-events: none; margin: 0; padding: 0`.
    *   Expert Booking (`#expert-consult-section`): Executes identical teardown over 420ms.
    *   Historical Runs (`#recent-history-section`): Docks into a collapsed, accessible side drawer toggleable via keyboard shortcut (`Cmd+H`).
    *   Accessibility Note: During active analysis, collapsed sections are assigned `aria-hidden="true"` and `inert` to prevent keyboard focus trapping.

### 3.3 Stage 3: `EVIDENCE_ARRIVAL`
*   **Visual Center:** The center stage expands into the **Evidence Constellation Stage** (580px fixed height on desktop or responsive height).
*   **Node Choreography:** As the server pushes Server-Sent Events (SSE) or WebSocket payloads, evidence nodes enter from the screen margins with directional momentum:
    *   Official University Registrar sources enter from top quadrant.
    *   Ministry circulars and legal statutes enter from left quadrant.
    *   Community observations and student reports enter from bottom quadrant.
*   **Telemetry Bar:** Real-time ticker in the right inspector tracks:
    *   `Sources Retrieved: 14`
    *   `Direct Matches: 3`
    *   `Contradictions Detected: 1`
    *   `Freshness Median: 2.4 hrs`

### 3.4 Stage 4: `SYNTHESIS`
*   **Relational Mapping:** High-tension filaments snap between the decomposed claim tokens and their supporting/confuting evidence nodes.
*   **Contradiction Highlight:** Disputed claims glow with an amber/crimson split aura; the Source Inspector immediately surfaces the conflicting paragraphs side-by-side.

### 3.5 Stage 5: `RESULT_REVEAL`
*   **The Reveal Transition:** The constellation canvas recedes to a compact 320px contextual overview; the **Synthesis Presentation Stage** reveals from beneath with an editorial sliding mask (`clip-path` polygon animation).
*   **Monumental Verdict:** The primary judgment is rendered in 56px–72px Cormorant Garamond:
    *   *"XÁC THỰC CÓ ĐIỀU KIỆN (CONDITIONAL VERIFICATION)"*
    *   Sub-verdict: *"Chính sách học bổng có thật nhưng thời hạn nộp đã kết thúc ngày 01/09/2026 theo Công văn 142/ĐHQG."*
*   **Evidentiary Foundation:** High-density, structured summary cards highlighting exact quotes, cited numbers, and explicit agreement/disagreement scores.

### 3.6 Stage 6: `POST_RESULT_EXPLORATION`
Only **after** the verdict is fully unveiled do next-step gateways appear—not as bloated marketing banners, but as refined, intentional action channels:
*   `[ Xem 14 thảo luận sinh viên liên quan (Community Insight) ]`
*   `[ Yêu cầu Hội đồng Chuyên gia tái thẩm định (Expert Escalation) ]`
*   `[ Tải Báo cáo Thẩm định Pháp lý PDF (Cryptographic Audit Seal) ]`
Clicking any gateway expands the corresponding module smoothly *in place* without reloading the page.

---

## 4. Multi-Breakpoint Responsive Layout Specifications

| Viewport | Container Width | Header Height | Investigation Rail | Evidence Stage | Inspector / Detail | Teardown Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop Ultra (1440px+)** | 1360px centered | 48px sticky | 380px left rail (sticky) | 680px center canvas | 300px right inspector | Full CSS transition, multi-column bento, 0 overflow clutter |
| **Desktop Standard (1024px)**| 960px centered | 48px sticky | 320px left rail (sticky) | 640px combined stage | Drawer on-demand | Sidebar collapses into slide-over if screen width $< 1180px$ |
| **Tablet Portrait (768px)** | 100% (24px pad)| 48px sticky | Top docked bar (auto) | Full width 440px height| Bottom sheet (swipeable)| Single column stack; rail stays sticky top (64px) |
| **Mobile Standard (390px)** | 100% (16px pad)| 44px sticky | Top docked card (compact)| Full width 320px height| Bottom modal / full drawer| Non-essential elements fully unmounted; bottom tab switch |
| **Mobile Compact (320px)** | 100% (12px pad)| 40px sticky | Minimal token banner | Full width 260px list | Full screen overlay | Micro typography (11px mono, 14px body); zero canvas physics |

---

## 5. Architectural CSS Implementation for Teardown & Collapse

```css
/* Container for Secondary Sections Subject to Focus Teardown */
.workbench-secondary-section {
  display: block;
  max-height: 1200px;
  opacity: 1;
  transform: translateY(0) scale(1);
  transform-origin: top center;
  transition:
    max-height var(--duration-macro) var(--ease-editorial-in-out),
    opacity var(--duration-normal) var(--ease-editorial-out),
    transform var(--duration-normal) var(--ease-editorial-out),
    margin var(--duration-macro) var(--ease-editorial-in-out),
    padding var(--duration-macro) var(--ease-editorial-in-out);
  overflow: hidden;
  will-change: max-height, opacity, transform;
}

/* Focused Mode: Smoothly collapse and inert secondary sections */
[data-workbench-state="ANALYSIS_FOCUS"] .workbench-secondary-section,
[data-workbench-state="EVIDENCE_ARRIVAL"] .workbench-secondary-section,
[data-workbench-state="SYNTHESIS"] .workbench-secondary-section {
  max-height: 0 !important;
  opacity: 0 !important;
  transform: translateY(32px) scale(0.98) !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  pointer-events: none !important;
  visibility: hidden;
}

/* Post-Result Next Action Gateways (Compact Pills) */
.post-result-gateways {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-12);
  padding-top: var(--space-8);
  border-top: 1px solid var(--border-subtle);
  opacity: 0;
  transform: translateY(16px);
  transition: 
    opacity var(--duration-normal) var(--ease-editorial-out),
    transform var(--duration-normal) var(--ease-editorial-out);
}

[data-workbench-state="RESULT_REVEAL"] .post-result-gateways,
[data-workbench-state="POST_RESULT_EXPLORATION"] .post-result-gateways {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 6. Verification Checklist
- [ ] **Zero Stray Cards:** Submitting a query completely removes community banners, expert booking modules, and historical lists from the active viewport within 540ms.
- [ ] **No Layout Pop:** Teardown utilizes smooth CSS transitions with `max-height` and `transform`, avoiding instant jump cuts.
- [ ] **Screen Reader Inertness:** All collapsed sections gain `inert` and `aria-hidden="true"`, ensuring Tab navigation does not focus hidden interactive elements.
- [ ] **Mobile Ergonomics:** On 390px screens, the active analysis occupies 100% of the viewport with zero vertical scroll bleeding into irrelevant marketing.
