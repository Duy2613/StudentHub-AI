# 00 — Current Frontend Product Surface & Architecture Baseline

**Audit Date:** September 1, 2026  
**Auditor:** Antigravity 3.7 Flash High (Independent Product Surface & UX Investigator)  
**Operating Mode:** `MODE A — RECONNAISSANCE` (Read-Only)  
**Git Branch & Commit:** `codex/trust-engine-v5-sequential-assurance` (`f96291ec`)  
**Claim Discipline:** Mixed evidence. `docs/recon/EVIDENCE-CLEANUP.md` is authoritative; statements below are historical observations and proposals unless individually labelled.

---

## 1. Executive Summary

StudentHub AI's frontend is an active **Next.js 16.3.0 App Router** project using React 19.2.8, TailwindCSS v4, Framer Motion v13, GSAP 3.15, and Three.js / React Three Fiber.

The corrected inventory comprises **39 page routes, 171 component files (168 code files), and four declared font families**. The exact total CSS footprint, field performance, and production pass rate are not established by this read-only phase.

The repository contains Trust Engine, scam-rule, token-verification, graph, and evidence-fusion modules plus 274 test files. Their complete production correctness and pass rate were not established here. The verified product risks are feature sprawl, duplicate domain entry points, multiple canvas implementations, and legacy pages that bypass the canonical shell.

---

## 2. Product Surface Dissection

```text
                          STUDENTHUB AI FRONTEND SURFACE (39 Page Routes)
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        ▼                                     ▼                                     ▼
  CORE PILLARS (P0/P1)                SUPPORTING SERVICES                   FEATURE SPRAWL (LEGACY)
  ├── /trust                          ├── /login & /register                ├── /forum (Social clone)
  ├── /community                      ├── /callback                         ├── /marketplace (Buy/Sell)
  ├── /expert                         ├── /onboarding                       ├── /prof-rating (Ratings)
  └── / (Landing entry)               ├── /profile & /profile/[id]          ├── /quests (Gamification)
                                      ├── /settings & /privacy              ├── /safety-map (Mapbox)
                                      ├── /dashboard (OS Command)            ├── /sos (Bank Hotlines)
                                      └── /cases (Demo Lab)                  ├── /scholarships (Registry)
                                                                            ├── /tuition-radar (Registry)
                                                                            ├── /contract-check (Analyzer)
                                                                            ├── /credit-scheduler (Timetable)
                                                                            ├── /academic/* (5 routes)
                                                                            ├── /intelligence/* (6 subroutes)
                                                                            ├── /ai (Chatbot)
                                                                            └── /ultra (Design Lab)
```

---

## 3. Quantitative Baseline Metrics

| Dimension | Measured Metric | Verification Status | Architectural Finding |
| :--- | :---: | :---: | :--- |
| **Total Page Routes** | **39 routes** | `VERIFIED` | 13 KEEP, 13 MERGE_INTO, 4 REMOVE, 9 POST_V1 |
| **UI Components** | **171 files / 168 code files** | `VERIFIED` | Distributed across 22 component directories plus the component root |
| **App Shell implementations** | **1 effective canonical shell + 2 delegating wrappers + legacy shell consumers** | `VERIFIED` | `UnifiedAppShell` owns the current canonical composition; wrappers delegate to it |
| **CSS Styling Footprint** | **Not a single verified total** | `NOT_EXECUTED` | `globals.css` and selected route/module measurements are recorded in `docs/frontend/PERFORMANCE.md` |
| **Loaded Typography** | **4 Families** | `VERIFIED` | Plus Jakarta Sans, JetBrains Mono, Instrument Serif, Inter Tight |
| **Canvas implementations** | **8 named systems in source** | `VERIFIED`; concurrency `NOT_EXECUTED` | Runtime simultaneous loading was not measured |
| **Test files** | **274 files** | `VERIFIED`; pass rate `NOT_EXECUTED` | 261 `.mjs` and 13 `.ts`; no blanket passing claim |
| **Live Database / RLS Proof** | **No live run evidenced** | `BLOCKED_BY_ENV` | Requires external Supabase/RLS database and credentials |

---

## 4. Key Architectural Conflicts & System Fractures

1. **Dual Trust Entry Points:** `/scam-check` (legacy redirect in `frontend/src/app/scam-check/page.jsx`) vs `/trust` (`frontend/src/components/trust/AiTrustStudioView.jsx`) vs `/cases` (`frontend/src/components/competition/CompetitionCaseStudio.jsx`).
2. **Dual Community Paradigms:** `/forum` (traditional Reddit/FB clone with upvotes, downvotes, and food/housing categories in `frontend/src/app/forum/page.jsx`) vs `/community` (epistemic student observations, corroboration, consensus, astroturfing defense in `frontend/src/components/community/CommunityIntelligenceView.jsx`).
3. **Dual Expert Paradigms:** `/expert` (evidence-bound authority & domain scope in `frontend/src/components/expert/ExpertIntelligenceView.jsx`) vs `/intelligence/experts` (raw expert graph subview).
4. **App Shell Adoption Gap:** `GlobalAppShell.jsx` and `StudentHubOSShell.jsx` currently delegate to `UnifiedAppShell`; some legacy/deferred pages still mount `ModernNavbar` or `CollapsibleSidebar` directly, so adoption is fragmented even though the effective canonical shell is identifiable.
5. **Aesthetic Incongruity:** The UI simultaneously exhibits Saffron Cybernetic luxury (`#ffbc09`), Deep Space Dark (`#06060a`), Mineral Mint Editorial (`#79d8bd`), and Ultra Neumorphic WebGL chrome.
