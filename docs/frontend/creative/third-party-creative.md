# StudentHub AI — Third-Party Creative Register v3.0

**Status:** RATIFIED & ACTIVE  
**Last Reviewed:** 2026-09-24  
**Governing Authority:** MASTER FRONTEND CONSTITUTION v3.0 (C-04, C-27, Appendix E)

---

## 1. Third-Party Creative Asset & Package Register

| Package / Asset | Purpose | Source | Exact License | Version / Commit | Modified? | Routes | Owner | Notice Required | Status |
|---|---|---|---|---|---|---|---|---|---|
| `three` | 3D rendering engine for L3 routes & Knowledge Prism | npm | MIT | `^0.185.1` | No | `/`, `/knowledge` | Creative Eng | Yes (MIT notice) | Approved (Route-isolated) |
| `@react-three/fiber` | Declarative Three.js wrapper | npm | MIT | `^9.7.0` | No | `/`, `/knowledge` | Creative Eng | Yes (MIT notice) | Approved (Route-isolated) |
| `@react-three/drei` | Useful helpers for R3F | npm | MIT | `^10.7.8` | No | `/`, `/knowledge` | Creative Eng | Yes (MIT notice) | Approved (Route-isolated) |
| `gsap` | Complex timeline animations & choreography | npm | Standard GreenSock License | `^3.15.0` | No | `/`, `/cases` | Creative Eng | Yes | Approved |
| `lucide-react` | Primary functional iconography | npm | ISC | `^1.33.0` | No | All routes | Frontend Core | Yes | Approved (Canonical Icon Family) |
| `motion` (`framer-motion`) | UI micro-animations & layout transitions | npm | MIT | `^13.1.1` | No | All routes | Frontend Core | Yes | Approved |
| `lenis` | Smooth scroll utility (formerly global) | npm | MIT | `^1.3.26` | No | Optional L3 narrative | Creative Eng | Yes | Restricted (Removed from global core) |
| `tesseract.js` | Client-side OCR engine for Trust input | npm | Apache-2.0 | `^7.0.0` | No | `/trust` | Trust Eng | Yes | Approved (Lazy loaded) |

---

## 2. Policy Enforcements
1. **Zero Anonymous Asset Culture:** No unlabeled media, shaders, or 3D models.
2. **License Verification:** Every package and asset must hold an explicit MIT, Apache-2.0, or compatible license verified in this document.
3. **Route Isolation:** Heavy dependencies (`three`, `@react-three/*`) MUST NEVER be bundled into core L1 routes (`/dashboard`, `/learn`, `/community`, `/expert`, `/tools/*`).
