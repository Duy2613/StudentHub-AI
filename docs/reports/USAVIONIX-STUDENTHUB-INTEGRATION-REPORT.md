# USAvionix → StudentHub AI integration report

**Date:** 2026-09-06  
**Scope:** reference audit, copy-paste prompt, and future integration plan saved as project documentation  
**Implementation status:** documentation complete; no application code, backend, auth, database, RLS, storage, or security contract changed by this task

## Executive finding

USAvionix's homepage is an operational story told through a very long scroll: the viewer moves from a large aircraft/terrain hero through Specs, Swarm, Mission, Sync, Detection, Phalanx AI, System Analysis, Intelligence Alerts, Coordination, and Response. The visual hierarchy is unusually disciplined: persistent utility navigation, one oversized claim, restrained supporting copy, a chapter label, machine-readable status fragments, and one scene-changing visual at a time.

That grammar fits StudentHub AI when translated into evidence and learning language. It should become a presentation layer for the existing Trust / Community / Experts / Learning / Cases model, not a new intelligence product and not an aircraft-themed reskin. The current project is under a feature freeze, so the correct integration now is a reference pack, a bounded prompt, a state-matrix plan, and explicit acceptance gates. Code integration is proposed only for a later approved phase.

## Source and instruction distinction

The user's request was to inspect the linked website and supplied recording, then save a prompt, report, and integration plan in StudentHub AI. The repository `AGENTS.md`, `frontend/AGENTS.md`, and vault files are operating instructions and project constraints; they are not additional product requirements from the user. Their relevant constraints are honored here: consult the vault, reuse existing components, keep truthful data boundaries, preserve the feature freeze, and update project memory for a substantial documentation artifact.

The supplied MP4 is visual reference material, not a written instruction. Frame sampling identifies a `cogni:wave` mental-wellness showcase with a light cream/lavender opening, a tablet/porcelain floral hand hero, black rounded content panels, floating service cards, testimonials, and a dark closing panel. It is not the USAvionix website. The report therefore uses it only for composition and pacing observations and does not merge its brand, copy, or imagery into the USAvionix analysis.

## Evidence ledger

### USAvionix website

Reviewed from [usavionix.com](https://www.usavionix.com/?ref=landing.love) in Chromium on 2026-09-06.

- At approximately 1262×624, the captured homepage reported a document height of about 45,684 px and three canvas elements. This is a measurement of the captured session, not a claim about the source's implementation or all devices.
- The initial desktop hero pairs a dark satellite/terrain image with a centered flying-wing aircraft, a very large white heading (“Securing the skies with autonomous intelligence”), a short right-side description, and a rounded “Scroll To Explore” control.
- The initial mobile hero deliberately reflows: the aircraft occupies the upper field, the heading and description become a lower vertical stack, and the contact action disappears into the menu. This is a composition change, not a scaled desktop screenshot.
- The Mission scene places three labeled aircraft over the terrain. The visual meaning is distributed coordination and spatial coverage.
- The Sync scene uses radial motion blur around one aircraft and a mono boot/status readout (`THERMAL / LIDAR / RGB / IR`, agents, GPU, link, scan mode). The status panel is a narrative device; its numbers are source-site copy and must not be copied into StudentHub.
- The Detection scene uses a terrain map plus a right-aligned alert block with coordinate, signal intensity, and classification. The Coordination scene switches to a dark grid with outlined service areas, cyan/yellow markers, and a red incident line. The Response scene closes with three large rounded mission cards and a direct access/contact CTA.
- The main interaction language is scroll-driven chapter progression with pinned/full-viewport scenes, visual state changes, and small chapter markers. The DOM also exposes keyboard-addressable chapter labels and buttons, so the concept can be made accessible without relying on the canvas alone.
- The captured page used Geist and Geist Mono in the browser session. StudentHub must keep its canonical Be Vietnam Pro / Lora / JetBrains Mono choices and should borrow only the human-vs-machine role split.

### Supplied MP4

The source file is recorded in `docs/references/usavionix-2026-09-06/video-metadata.json` with SHA-256 `09fa2c0b837a3b3d032fef65661ffb5835f96ec94f889440ff00497364b28f51`. It is 6,795,519 bytes, 1024×752, 30 fps, 461 frames, and 15.367 seconds.

The sampled contact sheet shows this broad timeline:

| Approx. time | Observable scene | Safe StudentHub lesson |
| ---: | --- | --- |
| 0–3.2 s | Cream tablet hero, oversized headline, lavender type, floral/porcelain hand enters the frame | Start with one focal object and one sentence; let depth carry attention |
| 4.0–6.4 s | Black “Art and science of mental wellness” panel; cards settle into a two-column arrangement | Use contrast to announce a chapter and keep card geometry calm |
| 6.4–8.8 s | Light section with offset panels, portrait cards, and one dark/organic image card | Alternate visual density; preserve reading order |
| 8.8–10.4 s | Black “Why we are chosen” metrics panel | Use proof only when StudentHub has a real source for the value |
| 10.4–12.1 s | Light “Transformations that inspire” testimonials/cards | Keep human outcomes scoped to verified case or learning data |
| 12.1–15.4 s | Dark brand footer/transition returns toward the hero | Close a chapter with a clear handoff, not a decorative reset |

The video does not establish its original framework, accessibility, data behavior, or mobile behavior. Those are intentionally left unclaimed.

## StudentHub translation map

| Reference chapter | Existing StudentHub surface/contract | Proposed presentation treatment | Boundary |
| --- | --- | --- | --- |
| Specs | Academic product principles, source/provenance contracts | “What we can know” with three source/record states | no invented system capability |
| Swarm | `/trust` Official / Community / Expert lenses | Three evidence lanes or a knowledge ribbon | no synthetic consensus |
| Mission | `/cases`, `/learn`, roadmap/decision flows | One student case moving through a next action | no new case domain |
| Sync | freshness/version/source agreement | Actual timestamps and contract statuses in mono | no random live telemetry |
| Detection | four-layer Trust pipeline and evidence graph | claim → evidence → risk visual | retain provider/unavailable semantics |
| Coordination | action center and expert/community handoffs | one primary CTA per chapter | no action unless route/data exists |
| Response | case result, learning route, or follow-up | verified outcome and next step | no fabricated completion |

## Current codebase fit and conflict map

The active homepage entry is `frontend/src/app/page.jsx`, which imports `AcademicNavbar`, `AcademicHeroSection`, `InteractiveKnowledgeAtlas`, and the existing landing sections. The current `/` route is therefore the Academic Cinematic surface; `frontend/src/components/landing/LivingCampusAtlas.jsx` is an alternate/previous implementation documented in the vault, not the active import in `page.jsx`.

Existing pieces that can support a future implementation include `AcademicNavbar`, `AcademicHeroSection`, `InteractiveKnowledgeAtlas`, `AITerminalBlock`, `ReducedMotionBoundary`, `SmoothScrollProvider`, `KnowledgeUniverseFallback`, and the established landing CSS/token layer. `LivingCampusAtlas` is useful as an implementation reference for parallax, clip-path fill, pointer aura, and reduced-motion behavior, but it should not be reactivated blindly.

There is already a file named `frontend/src/components/auth/UAvionixTelemetryHUD.jsx`, mounted by the Saffron auth container. It is a legacy visual inspired by the source site and is not a reliable data surface. Its synthetic/random telemetry copy must be quarantined from academic and Trust meaning. A future refactor may rename or replace that visual, but this documentation task does not change auth.

The project's current performance remediation is a hard constraint. The latest session records 124/124 production pages, landing initial JS of 152,993 B, median landing LCP of 2,139.9 ms, CLS 0, and local runs under 2.5 s in its stated profile. It also records unverified Firefox/WebKit, field/real-device CWV, canonical Preview, staging provider, PostgreSQL/RLS, restart, rollback, and Lighthouse CI evidence. A USAvionix-like canvas or video must therefore be an enhancement island with a stable HTML fallback, and it must not be described as release-ready without those missing proofs.

## Proposed integration plan (not executed)

### Phase 0 — Documentation and decision gate (complete)

- Store source metadata, screenshots, and sampled frames in `docs/references/usavionix-2026-09-06/`.
- Store this report and the copy-paste prompt in `docs/reports/` and `docs/frontend/`.
- Confirm the video/site distinction, the active homepage path, the feature-freeze boundary, and the synthetic telemetry risk.

### Phase 1 — Content/state design (future, approval required)

Create a content/state matrix before touching JSX or CSS. Each chapter must define its entry condition, canonical data source, visible copy, primary action, unknown/unavailable state, reduced-motion state, keyboard behavior, exit condition, and analytics event if an existing event contract permits it. Keep the first version to four or five StudentHub chapters rather than reproducing the reference's full defense narrative.

Suggested first cut: `Orient → Compare lenses → Inspect evidence → Choose next action`. The chapter names should be reviewed against product language before implementation.

### Phase 2 — Enhancement-island prototype (future, approval required)

Prototype inside the active landing composition using existing tokens and components. Keep the SSR hero and CTA in `AcademicHeroSection`; add a small chapter controller around existing evidence/knowledge visuals; use a static SVG/list fallback before any canvas/WebGL. Do not add a new route, provider, database table, API, auth flow, or security policy. Keep media and canvas lazy and behind the same performance budget.

### Phase 3 — Desktop/mobile and accessibility verification (future)

Run the existing build/lint/test gates plus Chromium checks at 1440×900 and 390×844. Test keyboard-only chapter navigation, focus order, reduced motion, reload at a deep scroll position, no-canvas fallback, slow CPU/network, and zero horizontal overflow. Record raw measurements and screenshots in the report.

### Phase 4 — Cross-engine and environment evidence (future)

Only after Phase 3 is stable, run Firefox/WebKit, real-device or representative field CWV, canonical Preview, staging provider, clean PostgreSQL/RLS, restart, rollback, and observability checks. A local Chromium result cannot close these blockers.

### Phase 5 — Release decision (future)

Compare the measured result with the pre-change baseline. Release only if the critical route budget, accessibility, truth contract, reduced-motion behavior, and environment evidence are all green. Otherwise keep the enhancement behind the documented boundary and retain the stable shell.

## Acceptance matrix

| Area | Acceptance condition | Evidence to attach |
| --- | --- | --- |
| Narrative | Every chapter has a product meaning and one clear next action | state matrix + desktop/mobile screenshots |
| Truth | No invented confidence, counts, coordinates, provider outcomes, or user progress | fixture/contract test + unavailable screenshot |
| Performance | Landing baseline and route JS budget do not regress | build output + Lighthouse/trace JSON with environment |
| SSR | Heading, copy, navigation, CTA, and fallback exist before hydration | raw HTML capture |
| Motion | Scroll/pointer work uses transforms/motion values and stays bounded | trace/profile + reduced-motion screenshot |
| Accessibility | Keyboard, focus, reduced motion, semantics, and axe checks pass | Playwright/axe result |
| Responsive | Intentional 390×844 composition has no horizontal overflow | mobile screenshot + test result |
| Resilience | Canvas/media failure leaves useful content and actions | forced-fallback test |
| Scope | No backend/auth/RLS/security/storage contract changes during this visual phase | diff and architecture review |

## Decision

Adopt the reference's operational storytelling grammar as a future presentation pattern for StudentHub's evidence-first product narrative. Do not adopt the source brand, defense claims, source assets, synthetic telemetry, or an unbounded 45k-pixel scroll by default. The project is ready for a design/state-matrix review and remains intentionally unmodified at the application layer until the feature freeze and release evidence permit implementation.

## Related artifacts

- [Copy-paste implementation prompt](../frontend/USAVIONIX-STUDENTHUB-INTEGRATION-PROMPT.md)
- [Reference pack and capture evidence](../references/usavionix-2026-09-06/README.md)
- [Current performance baseline](../frontend/PERFORMANCE.md)
- [Active session constraints](../vault/00%20-%20%F0%9F%A7%A0%20AI%20Agent%20Permanent%20Context/Active-Session-Context.md)
