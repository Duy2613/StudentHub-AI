# StudentHub AI / Khai Minh master visual system

Status: implementation reference for the 2026-09-10 visual integration pass.

## Point of view

Khai Minh means clarity earned through inquiry. The product surface should feel like a quiet editorial archive that can become a precise instrument when a student needs to verify a claim. The visual ratio is approximately 70% editorial calm, 20% product precision, and 10% cinematic wonder.

The core metaphor is the Evidence Prism: uncertain material enters as fragments, passes through traceable evidence work, and leaves as a clearer next action. It is a visual metaphor only. A prism image never establishes a verdict or a product record.

## Material and color

- Dark mineral: deep navy and graphite for Trust, Expert, Community, and cinematic transitions.
- Warm paper: ivory and low-chroma stone for archive, dashboard, settings, and reading states.
- Institutional accent: jade or restrained refraction blue for active controls and verified state emphasis.
- Warm light: a small amount of Vietnamese daylight to connect the system to Hanoi without turning the UI into tourism imagery.
- Glass: reserved for evidence instruments and overlays. Use opaque or paper surfaces for ordinary content.

Existing semantic tokens remain canonical. New visual work must use `--canvas`, `--surface-instrument`, `--surface-archive`, `--surface-paper`, `--text-primary`, `--text-secondary`, `--brand`, and existing state tokens instead of route-local color values.

## Typography

- UI and body: Be Vietnam Pro.
- Editorial display and short quotations: Cormorant Garamond or Newsreader.
- Technical labels, hashes, timestamps, and provenance: JetBrains Mono.
- Body copy stays at 16px or larger where space allows. Technical labels remain at least 13px.
- Hero display stays within 64 to 88px on wide screens and 44 to 52px on mobile.
- Do not render concept-art text in the product. Do not use long all-caps copy as a substitute for hierarchy.

## Surfaces

| Surface | Use | Treatment |
| --- | --- | --- |
| `cinematic` | Landing hero and transition | Dark mineral frame, one strong image, restrained refraction |
| `instrument` | Trust, Community, Expert | Opaque reading surface with evidence panels and a quiet ambient image |
| `archive` | Cases and Academic | Paper/stone surface, document rhythm, image as marginal atmosphere |
| `paper` | Dashboard and Settings | Lighter editorial desk, clear ownership and state disclosure |

## Route composition

The active route shell owns navigation, focus order, data states, and actions. The visual registry supplies only responsive derivative paths and provenance metadata.

- `/`: a short hero, an explicit Trust promise, the five-step verification story, academic knowledge map motif, AI research assistant framing, and Community/Expert bridge. No fake counts.
- `/trust`: the live input and result hierarchy remain primary. The product must preserve the seven established layers L1, L2A, L2B, L2C, L3, L4, and L5.
- `/community`: durable community signals remain separate from popularity. Empty, unavailable, and loading states remain honest.
- `/expert`: directory results, contribution, qualification, scope, conflicts, and assessment states come from the provider. A 5-star concept-art portrait is never an expert record.
- `/cases`: the existing case studio remains explicitly labelled when it is a demo fixture. Concept-art archive labels do not become cases.
- `/dashboard`: only actual cases, saved evidence, contribution, recent activity, and next actions may appear.
- `/settings`: the lighter paper direction supports privacy, devices, export, reset, and not-configured states already exposed by the contract.

## Responsive image contract

Every registered image provides desktop, tablet, and mobile derivatives plus width, height, aspect ratio, priority, decorative status, embedded-text risk, human-illustrative status, provenance, and a fallback. Original PNGs remain in the master pack only.

Use `priority` only for the true landing LCP image. All route atmospheres are decorative, lazy, and removable. Mobile images use a deliberate crop toward the prism or subject and stay within a reasonable payload budget.

## Motion and accessibility

Motion is limited to a soft refraction sheen, a short reveal, and optional ambient drift. There is no scroll-jacking or large camera move. Under `prefers-reduced-motion: reduce`, remove parallax, drift, marquee movement, and large transforms while preserving content order and contrast.

Decorative atmosphere images use empty alt text and `aria-hidden`. Meaningful image descriptions describe the metaphor, never a fabricated person or product state. Keyboard focus remains on live controls, never on background art.

## Reality boundary

The visual layer may suggest inquiry, evidence, community, and expertise. It must never imply that those records exist. Product numbers, identities, citations, timestamps, statuses, and conclusions remain backend-owned and are rendered by the existing route components.
