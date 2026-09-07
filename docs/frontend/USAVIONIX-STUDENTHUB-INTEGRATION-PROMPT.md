# StudentHub AI — USAvionix-inspired operational scrollytelling prompt

Use this prompt only for a future, explicitly approved StudentHub AI landing evolution. The current feature-freeze state remains authoritative: this document does not authorize code, route, backend, authentication, RLS, storage, security, or database changes.

## Copy-paste prompt

You are working inside the StudentHub AI repository. First read `AGENTS.md`, `frontend/AGENTS.md`, `docs/vault/00 - 🧠 AI Agent Permanent Context/00-Permanent-Memory.md`, `docs/vault/00 - 🧠 AI Agent Permanent Context/Active-Session-Context.md`, `.agents/DESIGN.md`, `docs/vault/02 - 🎨 Design & Refero Systems/DESIGN.md`, `docs/frontend/PERFORMANCE.md`, and `docs/reports/USAVIONIX-STUDENTHUB-INTEGRATION-REPORT.md`. Treat those files as project constraints and evidence, not as a request to invent a new product.

### Objective

Evolve the existing StudentHub AI landing surface into a measured, academic operations narrative inspired by the information architecture and motion grammar of USAvionix: one calm control layer, an immersive hero, chapter-based scroll progression, machine-readable status panels, and a clear action at every chapter. Preserve StudentHub's own meaning: source provenance, community context, expert scope, learning, trust, and safe next actions.

Extract principles from the reference; do not clone its brand, logo, wording, aircraft, defense imagery, coordinates, telemetry values, visual assets, source code, or trade dress. The supplied MP4 is only a secondary reference for composition and timing. It is a `cogni:wave` mental-wellness showcase and must never be described as USAvionix evidence.

### Product translation

Map the reference's operational chapters to existing StudentHub concepts:

| Reference grammar | StudentHub meaning | Truth requirement |
| --- | --- | --- |
| Specs | What the system checks and what a source can prove | Use documented capabilities only |
| Swarm | Official / Community / Expert lenses | Never imply consensus when no evidence exists |
| Mission | A student's concrete case or learning goal | Use existing case/learning data |
| Sync | Freshness, version, and source agreement | Show actual timestamps/statuses |
| Detection | Claim/evidence/risk inspection | Preserve Trust pipeline contracts |
| Coordination | Next safe action and responsible handoff | Render only available actions |
| Response | Result, learning path, or case follow-up | Do not fabricate completion or outcomes |

Keep the primary landing CTA aligned with the current product information architecture (`/trust`, `/community`, `/expert`, `/learn`, `/cases`). Do not create a parallel Trust implementation or a new backend contract.

### Visual direction

- Build a dark, quiet operational field: near-black StudentHub canvas, mineral/knowledge accents, restrained white type, and small cyan/amber/rose state lights.
- Use an oversized human headline, a short explanatory sentence, and one obvious primary action. Support it with a small mono status rail when the status is real.
- Use chapter labels and progress cues as orientation, not decoration. A chapter transition must reveal meaning: source, evidence, risk, or action.
- Use terrain/map/grid language only as an abstract information metaphor. StudentHub may use a knowledge graph, evidence graph, or academic roadmap; it must not imply aircraft surveillance.
- Use rounded surfaces and spacing already defined by the canonical Academic Cinematic tokens. Add semantic aliases only if the current token system cannot express a state; do not replace the project palette with a copy of the reference palette.
- Prefer existing primitives and modules: `AcademicNavbar`, `AcademicHeroSection`, `InteractiveKnowledgeAtlas`, `AITerminalBlock`, `ReducedMotionBoundary`, `SmoothScrollProvider`, and `KnowledgeUniverseFallback` where their contracts fit. `LivingCampusAtlas` is a reference implementation/alternate surface, not evidence that it is the active `/` entry point.
- Inspect `UAvionixTelemetryHUD` before touching auth. It is a legacy visual inspired by the reference and contains synthetic/random status copy; it is not a source of truth and must not be reused for Trust, academic, or user metrics.

### Motion and implementation rules

- Keep semantic HTML, SSR text, the `h1`, CTA, navigation, and meaningful status available before hydration.
- Use scroll progress or IntersectionObserver to drive chapter state. Update transforms/opacity through Motion values, CSS variables, or refs; do not put a React state update on every scroll or pointer event.
- Animate `transform` and `opacity`; avoid layout properties in scroll loops. Keep a single intentional ambient system and remove competing legacy effects from the touched surface only when evidence supports the change.
- Load canvas, WebGL, large images, video, audio, and analysis-only modules lazily after the critical shell. Every heavy scene needs a poster/SVG/list fallback and an error path.
- Respect `prefers-reduced-motion`: remove pinning, parallax, continuous loops, autoplay, and audio; retain the chapter content, controls, focus order, and actions.
- Do not use audio or autoplay video for essential information. Any media must be muted, `playsInline`, pausable, and optional.
- Keep the experience usable at 390×844 and 1440×900. A mobile layout is a deliberate vertical narrative, not a shrunken desktop canvas.
- Never place invented percentages, coordinates, counters, confidence, provider results, or outcome claims in a telemetry-looking panel. If data is unavailable, render the existing unavailable/unknown contract.

### Performance and accessibility gates

Preserve the current evidence baseline: local production build, landing initial JS around 152,993 B, median landing LCP around 2,139.9 ms, CLS 0, and the documented under-500,000 B route budget. Re-measure after every approved visual change; do not claim field readiness from a local browser run.

Verify, at minimum:

1. `npm run build` and the relevant lint/test commands pass.
2. Chromium desktop and mobile checks cover the initial hero, each chapter transition, keyboard navigation, focus visibility, reduced motion, zero horizontal overflow, and a no-canvas fallback.
3. axe has no serious or critical violations on `/` and all affected routes.
4. SSR/raw HTML contains the page heading and primary action before hydration.
5. Browser console and network checks show no unbounded animation, duplicate heavy media request, fabricated provider response, or failed fallback.
6. The report records environment, viewport, run count, and unverified Firefox/WebKit/real-device/field/staging gaps.

### Expected delivery

Before editing code, produce a state matrix for each chapter (entry condition, content, action, unavailable state, reduced-motion state, and exit condition). Then implement only the approved scope, reuse existing contracts, and update the report with measured evidence. If feature freeze or a security/data contract would be crossed, stop at the design/spec artifact and report the blocker.

## Short prompt

> Design a StudentHub AI academic operations landing narrative using USAvionix's chapter-based scrollytelling grammar: dark field, oversized human headline, restrained telemetry rail, chapter progress, evidence-map transitions, and action-oriented handoffs. Translate Specs/Swarm/Mission/Sync/Detection/Coordination/Response into StudentHub's Source/Official–Community–Expert/Case/Freshness/Trust/Next Action/Outcome model. Keep StudentHub tokens, Vietnamese-first typography, truthful data contracts, SSR content, reduced-motion and mobile fallbacks, lazy heavy media, existing routes, and the under-500 KB/performance gates. Reuse existing components. Do not copy USAvionix or cogni:wave assets, names, claims, source code, coordinates, defense language, fabricated telemetry, or brand treatment. Under the current feature freeze, write the plan and evidence first; do not implement code until separately approved.
