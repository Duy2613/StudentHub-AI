# StudentHub AI — Signature Effect Cards v3.0

**Status:** RATIFIED & ACTIVE  
**Governing Authority:** MASTER FRONTEND CONSTITUTION v3.0 (C-32)

---

## EFX-01 · Knowledge Prism
- **Meaning:** StudentHub knowledge and intelligence identity.
- **Visual Thesis:** Frosted Acrylic outer body + restrained Liquid Metal edge + Violet/Cyan internal knowledge light.
- **Layer:** L3 primary; L2 static only.
- **Allowed Routes:** `/` (Landing Hero), `/knowledge` (Universe entry), select onboarding still.
- **Not Allowed:** On every card, on `/trust` result screen, as a verified truth icon.
- **Fallback Chain:** `R-WEBGPU` / `R-WEBGL2` -> `R-LITE` -> `R-POSTER` (static SVG/WebP).
- **Reject If:** Looks like generic chrome sphere, disco glass ball, or verified badge.
- **Acceptance Criteria:**
  - Recognizable silhouette in Light and Midnight Lab themes.
  - Readable silhouette in R-POSTER static mode.
  - Zero dependency on motion to identify it.
  - Supports CAP-STATIC and `prefers-reduced-motion`.
  - Maintains StudentHub identity even when stripped of logo text.
  - CTA button is usable and accessible before 3D scene finishes loading.

---

## EFX-02 · Evidence Crystallization
- **Meaning:** Evidence structure becomes clearer as real processing states arrive from backend pipeline.
- **Trigger:** Actual processing state events (`CLAIM_EXTRACTED` -> `EVIDENCE_FETCHED` -> `SOURCE_EVALUATED` -> `CONTRADICTION_RESOLVED`).
- **Layer:** `/trust` processing stage (L2 only).
- **Result Screen:** Effect ends immediately; result screen returns to calm L1 reading surface.
- **Fallback Chain:** Clean step progress bar + calm semantic state tags.
- **Reject If:**
  - Implies truth before evidence is fully evaluated.
  - Synthesizes arbitrary progress bars or timers when backend is idle.
- **Acceptance Criteria:**
  - Transitions gracefully into the final L1 conclusion.
  - Zero motion when reduced-motion is requested.

---

## EFX-03 · Learning Constellation
- **Meaning:** Confirmed learning relationships, course progress, and prerequisite pathways.
- **Layer:** L2 / L3 in optional exploration surfaces (`/learn/constellation`, `/knowledge`).
- **Fallback Chain:** Structured progress rows / 2D prerequisite tree / accessible list.
- **Reject If:**
  - Locks educational content behind visual progression.
  - Uses coercive streak-loss gamification.
  - Publishes private learning progress publicly.
- **Acceptance Criteria:**
  - All nodes have full keyboard navigation and screen reader equivalents.
  - High contrast ratio for text labels (minimum 4.5:1).

---

## EFX-04 · Semantic Surface Treatment
- **Meaning:** Representative surface expresses evidence state without making text illegible.
- **Layer:** L2.
- **Mapping:**
  - Insufficient evidence -> amber outline + sparse hatch + lower surface opacity (`Chưa đủ bằng chứng`).
  - Conflicting sources -> split dual-tone border + caution pattern.
  - Verified source -> calm paper/mint accent + verified badge.
- **Fallback Chain:** Border tone + label + status icon.
- **Reject If:**
  - Distorts source text, citation text, or primary conclusion.
  - Makes evidence unreadable.
- **Acceptance Criteria:**
  - Core text and numbers remain 100% stable, sharp, and readable.

---

## EFX-05 · Academic Type Collision
- **Meaning:** Editorial identity and contrast of ideas through bold typographic pairing.
- **Layer:** Landing L2 / L3.
- **Implementation:** Lora editorial outline/solid pairing with Be Vietnam Pro product display.
- **Fallback Chain:** Normal high-contrast typographic hierarchy.
- **Reject If:**
  - Vietnamese diacritics clip (Ă, Â, Đ, Ê, Ô, Ơ, Ư, Ắ, Ấ, Ễ, Ự, Ỵ).
  - Essential text is rendered as outline-only.
  - Composition resembles an external agency portfolio too closely.
- **Acceptance Criteria:**
  - Passes all strings in Constitution Appendix A (Vietnamese Typography Test Set).
  - DOM text remains selectable and accessible.

---

## EFX-06 · Aurora Ink
- **Meaning:** Subtle, calm StudentHub atmosphere reflecting depth of knowledge.
- **Layer:** L2 / L3; select L1 background ONLY if near-static and extremely restrained (4–12% bloom opacity).
- **Fallback Chain:** Clean neutral canvas (#F7F9FD Light / #07101F Midnight).
- **Reject If:**
  - Becomes an intense neon gradient blob.
  - Reduces WCAG 2.2 AA text contrast below 4.5:1.
  - Runs expensive continuous RAF render loops on reading routes.
- **Acceptance Criteria:**
  - Automatically paused when tab is inactive.
  - Completely static or disabled on CAP-STATIC / low-end devices.
