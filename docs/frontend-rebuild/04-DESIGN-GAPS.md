# 04 — Visual, UX, Motion, Media, and State Gaps

**Audit date:** 2026-09-01  
**Reference stance:** design-taste-frontend and redesign-existing-projects were used as critique lenses. No visual reference was copied, and the absent getdesign.md could not be used as a source.

## What is already working

- The Atlas landing page has a distinctive academic/editorial mood, strong display typography, a mineral-mint accent, and a deliberate mobile composition.
- The canonical app shell has a coherent dark canvas, persistent navigation, a visible protection status, a skip link, and a command entry point.
- Trust has better state honesty than a generic demo: explicit opt-in demo mode, typed errors, provider status, abort behavior, and unknown/unavailable language.
- Cases demonstrates a readable vocabulary for Evidence Triangle, conflicts, revisions, and Decision Twin.
- Core page structures use semantic headings and controls well enough that the sampled Trust, Community, Expert, Academic Profile, and Knowledge pages did not show serious or critical axe violations.

## Gap matrix

| Dimension | Current baseline | Gap / decision needed |
| --- | --- | --- |
| Visual hierarchy | Landing has clear chapters; Trust has a long staged result stack; Community is a repeated feed; Expert is directory plus dossier | Make “decision first, explanation second, technical depth third” an explicit system on Trust and make evidence the primary hierarchy on Community/Expert |
| Layout | Desktop canonical shell is stable at 1440 px with a 240 px rail and 1,200 px main; mobile rail composition is broken | Freeze a responsive shell that changes composition, not just width |
| Typography | Four loaded families plus Atlas Bodoni/Didot fallbacks and local font aliases | Reduce to one body family plus one intentional editorial family; document mono as a label utility only |
| Color | Dark canvas, mineral mint, indigo, saffron, burnt brown, rose, and multiple semantic token families coexist | Separate page personality from semantic status; unknown and unavailable must not inherit safe/high-risk colors |
| Density | Trust exposes many stages and panels at once; Community renders 42 seeded observations; legacy pages are very long | Establish density tiers and progressive disclosure; do not make users traverse graph/telemetry before the decision |
| Spacing | Tailwind utilities, canonical CSS, Atlas module CSS, and legacy layout containers | Define a shared grid, spacing scale, and content measure before page-specific polishing |
| Radius/borders | Glass cards, HUD panels, editorial slabs, and legacy rounded panels coexist | Pick surface families for editorial, evidence, and system controls |
| Responsive | Landing is composed separately for mobile; canonical app pages fail at 390 px due to Margin layout | Treat 360/390/430 as primary product compositions and test content width, not only document overflow |
| Dark mode | Product is effectively dark-first; there is no demonstrated light/dark theme contract for the app | Decide whether dark is the product identity or a theme, then test contrast for all semantic states |
| Empty states | Some component-level empty copy exists; pillar-level “first observation”, “no assessment”, and “no investigation” paths are not consistently connected to actions | Define one empty state per pillar with a useful next action and no fabricated metrics |
| Loading | Trust exposes named pipeline steps; other surfaces rely more on immediate seeded content, spinners, or local transitions | Map UI stages only to known backend events; do not imply progress percentages that are not measured |
| Error states | Typed API errors are available; auth, legacy, and feature-local presentation differs | Normalize 401, 403, 404, 409, 429, 500, 503, timeout, offline, invalid response, and schema mismatch with recovery copy |
| Partial states | Trust provider status can show partial/unknown/unavailable information | Carry partial provenance into cards, metrics, Graph, Passport, and expert review; do not collapse partial into success |
| Unknown states | Trust has explicit unknown language in places; global semantic styling is not proven | UNKNOWN must be a first-class state with neutral/informational treatment, not green |
| Conflicting evidence | Cases demonstrates conflicts; Community/Trust primary flow does not expose the same model consistently | Define conflict ownership, user wording, revision behavior, and action safety |
| Motion | Atlas, CSS, Framer Motion, GSAP, canvas, WebGL, and utility animations coexist | Assign atmospheric, editorial, and mechanical motion roles with micro/component/page/cinematic duration limits |
| Reduced motion | Global reduced-motion rules exist and Atlas has a reduced-motion branch | Verify each canvas, sticky fold, graph transition, and modal has a meaningful static fallback |
| Media | Atlas uses local image backgrounds and the landing has no purpose-built investigation video; Trust image input has no region annotations | Establish image purpose classes, responsive crops, poster/fallback policy, and evidence image privacy treatment |
| Accessibility | Skip link and labels exist; command focus restoration, tab semantics, graph keyboard selection, and login landmarks remain gaps | Target WCAG 2.2 AA with keyboard and screen-reader flows, not only serious axe filtering |
| Performance | Route chunks are under the current budget, but global CSS, multiple fonts, and canvas/WebGL options are broad | Freeze per-route JS, shared CSS, font, image, graph, and media budgets before adding effects |
| Copy | Product uses serious evidence language in core pages, but some labels contain visible em-dash/list styling and legacy Saffron/marketing phrasing | Establish tone rules: calm, precise, human; avoid decoration that resembles technical certainty |

## Trust-specific hierarchy issue

The current Trust result is visually interesting and information-rich, but the seven-stage output, provider panels, graph, handoffs, and technical content compete in one vertical journey. The target needs a stable reading order:

    decision
       ↓
    immediate action
       ↓
    top reasons and independent metrics
       ↓
    explanation tabs
       ↓
    evidence provenance and technical drilldown
       ↓
    graph / Passport / escalation

This is an information architecture change, not a color or spacing tweak.

## Community and Expert personality

Community should feel like collective observation: context, timestamps, evidence, corroboration, and calm uncertainty. The current feed is closer to a polished seeded list than a complete evidence loop.

Expert should feel like scoped authority: qualification, scope, reviewed cases, consistency, accountability, and disagreement. The current dossier has the right scope warning but not enough proof around each assessment.

Both can share primitives and tokens while retaining different content rhythm. A generic SaaS dashboard treatment or neon cyber-security treatment would work against the requested identity.

## Media and 3D guardrail

The brief permits 3D for the landing hero or a key story, not for the Trust report, Community feed, or Expert profile. The current repository has enough canvas/WebGL/background engines that this rule must be explicit in the design spec. Evidence surfaces should privilege readability, contrast, source metadata, and loading predictability over spectacle.

## Design handoff gate

The next approved design package must specify, with rationale:

- one type hierarchy and one semantic color map;
- responsive shell composition at 360, 390, 430, 768, 1024, 1280, 1440, and 1920;
- component states for success, partial, unknown, insufficient evidence, conflicting evidence, unavailable, error, offline, and demo;
- motion/reduced-motion behavior for core interactions;
- evidence-image and video purpose, crop, privacy, and fallback rules;
- a11y behavior for tabs, dialogs, drawers, graph/list mode, errors, and focus;
- route ownership before any design is applied to deferred or remove candidates.
