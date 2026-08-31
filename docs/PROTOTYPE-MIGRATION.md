# The Margin Prototype Migration

Source: approved `project.zip`, with `FINAL-IMPLEMENTATION-HANDOFF.md` as visual authority. Prototype HTML/JS is a specification, not production code.

| Prototype element | Disposition | Production location | Notes |
| --- | --- | --- | --- |
| Margin rail/body/footnote grammar | ADOPT + REBUILD | shared layout/components | Keep 240px desktop, condensed tablet, top strip mobile. |
| Six marks `[n] ✻ !! ? → ✕` | REBUILD | `components/margin/Mark*` | Closed alphabet, semantic ARIA, no seventh glyph. |
| Reading Room library image | ADAPT | landing/trust entry asset | Use existing approved asset; no mock source claims. |
| Instrument three-ring SVG | ADAPT | Trust-only verification state | Inline SVG/CSS; never a persistent widget or WebGL. |
| Community `<details>` provenance | ADAPT | Community observation ledger | Preserve native keyboard disclosure. |
| Expert publication chord | REBUILD | Expert dossier | Data-driven from real scoped evidence. |
| Academic prerequisite trace | REBUILD | Academic workspace | Rules come from versioned deterministic source data. |
| Dashboard priority ledger | REBUILD | Command Center | Keep quiet, action-first, no gamification. |
| Prototype iframe shell | REJECT | Next route composition | Render direct React/Next surfaces. |
| Personas, citations, percentages, timestamps, proto watermark | REJECT | real data/explicit demo fixtures | Never ship mock claims as live evidence. |

## Migration sequence

1. Add frozen semantic tokens and Margin primitives without changing domain contracts. **Complete:** `components/margin/Mark.jsx`, `Annotation.jsx`, `MarginRail.jsx` and the shared shell rail.
2. Apply the shell/rail/body structure to canonical Trust, Community, Expert, Academic, and Dashboard routes one surface at a time. **Shell tranche complete:** all authenticated routes now receive the Margin rail; route-local body migrations remain visual follow-up work.
3. Preserve real loading, empty, unavailable, conflict, and unknown states.
4. Verify keyboard/reduced-motion/mobile behavior with focused browser tests.

The current Ultra route is a bounded creative showcase and integration test surface; it does not replace the canonical product routes. The shared shell intentionally keeps the existing business surfaces while introducing the Margin rail, so the static prototype is never copied into production.
