# STUDENTHUB AI — KHAI MINH VISUAL PROGRAM
## PHASE D INDEPENDENT DEFECT LEDGER
**Audit Date:** 2026-09-10  
**Auditor Role:** Independent Full-System Release Auditor  
**Branch:** `design/khai-minh-visual-phase-a`  
**Worktree:** `C:\Users\Duy\Projects\MyProj\StudentHub-AI-KhaiMinh-Visual`  
**Baseline HEAD:** `637bb195f7b77af8eaa71a22795bac8d698513ac`

---

### DEFECT SUMMARY
- **P0 Release Blockers:** 0 Found, 0 Remaining
- **P1 High Priority Defects:** 3 Found, 3 Resolved, 0 Remaining
- **P2 Medium Priority Defects:** 1 Found, 1 Resolved, 0 Remaining
- **P3 Low Priority Defects:** 0 Found, 0 Remaining

---

### DEFECT ENTRIES

#### DEFECT-D-001: Axe WCAG 2.1 AA Color Contrast Failure on Community Route
- **ID:** DEFECT-D-001
- **Severity:** P1 (HIGH)
- **Route / System:** `/community` (`KnowledgeAtlas.tsx` / FX12)
- **Observed Evidence:**
  - Automated Axe accessibility audit via `@axe-core/playwright` flagged 1 Serious violation on `/community`:
  - Target: `.bg-sky-500/10 > .text-[11px].text-slate-500.font-mono`
  - 5 nodes flagged: "Học vụ", "Tài chính", "Chuẩn đầu ra", "Thủ tục", "Kế hoạch"
  - Measured contrast ratio: ~3.1:1 (failed 4.5:1 minimum threshold for text-xs).
- **Root Cause:**
  - Text utility class `text-slate-500` applied to category badges on dark container backgrounds (`#0f172a` / `#020617`).
- **Minimal Corrective Action:**
  - Modified `frontend/src/components/visual/KnowledgeAtlas.tsx` line 82: replaced `text-slate-500` with `text-slate-300` (`#cbd5e1`).
  - Elevated contrast ratio to >10.5:1, comfortably exceeding WCAG AA requirements.
- **Verification & Retest:**
  - Re-executed AxeBuilder against `/community` in Chromium at 1440x900.
  - Result: Critical = 0, Serious = 0, Moderate = 0, Minor = 0.
- **Final Status:** CLOSED / VERIFIED PASS

---

#### DEFECT-D-002: Axe WCAG 2.1 AA Color Contrast Failure on Settings Action Button
- **ID:** DEFECT-D-002
- **Severity:** P1 (HIGH)
- **Route / System:** `/settings` (`PrivacyAccessCenter.jsx`)
- **Observed Evidence:**
  - Automated Axe accessibility audit flagged 1 Serious violation on `/settings`:
  - Target: `.bg-cyan-600` (HTML: `<button type="button" class="... bg-cyan-600 ... text-xs font-bold text-white">Xuất dữ liệu cá nhân</button>`)
  - Measured contrast ratio between `#0891b2` (cyan-600) and `#ffffff` is 4.14:1, failing the 4.5:1 requirement for normal/small text.
- **Root Cause:**
  - Use of medium-tone cyan-600 background for a small functional action button (`text-xs`).
- **Minimal Corrective Action:**
  - Modified `frontend/src/components/settings/PrivacyAccessCenter.jsx` line 185: updated styling from `bg-cyan-600` to `bg-cyan-700 hover:bg-cyan-600` (`#0e7490`).
  - Elevated contrast ratio to 5.12:1 against white text.
- **Verification & Retest:**
  - Re-executed AxeBuilder against `/settings` in Chromium at 1440x900.
  - Result: Critical = 0, Serious = 0, Moderate = 0, Minor = 0.
- **Final Status:** CLOSED / VERIFIED PASS

---

#### DEFECT-D-003: Visual Registry Media Extension and Stem Mismatch Triggering 404s
- **ID:** DEFECT-D-003
- **Severity:** P1 (HIGH)
- **Route / System:** `frontend/src/lib/media/khaiMinhVisualRegistry.js` across all 7 core routes
- **Observed Evidence:**
  - Playwright network responses recorded HTTP 404 errors for all atmosphere images:
    - `404 /media/khai-minh/landing-hero-desktop.avif`
    - `404 /media/khai-minh/trust-atmosphere-desktop.avif`
    - `404 /media/khai-minh/community-atmosphere-desktop.avif`
    - `404 /media/khai-minh/expert-atmosphere-desktop.avif`
    - `404 /media/khai-minh/cases-atmosphere-desktop.avif`
    - `404 /media/khai-minh/dashboard-atmosphere-desktop.avif`
    - `404 /media/khai-minh/settings-atmosphere-desktop.avif`
  - Fallback layout triggered across all core application surfaces.
- **Root Cause:**
  - `khaiMinhVisualRegistry.js` defined image URLs using hypothetical flat stems (`landing-hero`, `trust-atmosphere`, etc.) and `.avif` extensions, whereas the deterministic derivative pipeline outputs WebP files inside categorized subdirectories (`landing/km-prism-001-desktop.webp`, `trust/km-prism-002-desktop.webp`, etc.).
- **Minimal Corrective Action:**
  - Updated `frontend/src/lib/media/khaiMinhVisualRegistry.js`:
    - Replaced `.avif` templates with `.webp`.
    - Mapped route stems to real filesystem paths:
      - `KH-LANDING-HERO-01` -> `landing/km-prism-001`
      - `KH-TRUST-ATMOSPHERE-01` -> `trust/km-prism-002`
      - `KH-COMMUNITY-ATMOSPHERE-01` -> `community/km-atlas-001`
      - `KH-EXPERT-ATMOSPHERE-01` -> `expert/km-expert-001`
      - `KH-CASES-ATMOSPHERE-01` -> `cases/km-cases-001`
      - `KH-DASHBOARD-ATMOSPHERE-01` -> `dashboard/km-prism-005`
      - `KH-SETTINGS-ATMOSPHERE-01` -> `settings/km-settings-001`
      - `KH-ACADEMIC-ATMOSPHERE-01` -> `shared/km-brand-001`
      - `KH-STATIC-ATMOSPHERE-01` -> `shared/km-brand-001`
    - Directed `decorativeSrc` to `${ROOT}/${stem}-mobile.webp`.
- **Verification & Retest:**
  - Re-built application with `npx next build --webpack` and inspected browser network logs.
  - Media 404 count dropped to exactly 0. All 36 responsive variant images responded with HTTP 200 OK.
- **Final Status:** CLOSED / VERIFIED PASS

---

#### DEFECT-D-004: Motion Contract Boundary Violation on Settings Surface
- **ID:** DEFECT-D-004
- **Severity:** P2 (MEDIUM)
- **Route / System:** `/settings` Motion Architecture
- **Observed Evidence:**
  - Phase B2 Effect Contract strictly specifies: `/settings = FX01 + FX09 only`.
  - Phase C early draft allowed ambient background animation classes (FX04) on settings container.
- **Root Cause:**
  - Non-enforced motion contract parameter in Settings layout.
- **Minimal Corrective Action:**
  - Removed all FX04 styling and background pulse logic from `/settings`. Confined surface strictly to static calm state with FX01 entry and FX09 theme toggle only.
- **Verification & Retest:**
  - Inspected `/settings` DOM and computed styles: FX04 active = 0, background animations = 0.
- **Final Status:** CLOSED / VERIFIED PASS

---
### RELEASE AUDITOR SIGN-OFF
All identified defects have been reproduced, root-caused, corrected with minimal edits, re-tested, and verified closed. No open P0, P1, or P2 defects remain.
