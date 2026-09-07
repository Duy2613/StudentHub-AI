# Principal-level evolution — integration boundary

**Status:** `IMPLEMENTED_AS_A_BOUNDED_INCREMENT`  
**Date:** 2026-09-06

This note records how the supplied principal-level brief is being adopted without
turning StudentHub AI into a second product or allowing the cinematic layer to
leak into the operational application.

## Integrated into the canonical experience

- Trust is the first landing action and the first canonical app-shell pillar.
- Community and Experts remain sibling intelligence surfaces; Case Lab remains a
  supporting workspace.
- Learning, roadmap, practice, and projects are grouped as a separate learning
  extension instead of competing with the three intelligence pillars.
- Landing copy uses product principles (`Nguồn`, `Bối cảnh`, `Bước tiếp`) rather
  than unverified live metrics or fabricated verification percentages.
- The existing progressive enhancement boundary remains in place: semantic SVG
  first, optional WebGL later, with reduced-motion and low-capability fallbacks.

## Kept deliberately separate

- `frontend/src/components/landing/LivingCampusAtlas.jsx` remains an isolated
  cinematic composition and is not imported by the canonical `/` route.
- WebGL, Lenis, command palette, and the full Trust analysis island remain
  optional enhancements; the semantic shell stays usable without them.
- The cinematic layer stays separate from backend authority. The canonical
  Trust/Expert/Realtime surfaces now use the bounded server/database changes
  recorded in the implementation report; the landing layer does not become a
  source of truth for those domains.
- Deferred academic and legacy routes are not promoted into a new primary
  product navigation.

## Acceptance boundary

The core increment adds only the routes, migrations, and service boundaries
needed for Trust persistence, expert qualification, realtime transport
hardening, and the Labbe outbox bridge. It does not grant the client authority
over verdicts, expert promotion, realtime truth, or Labbe writeback. The
implementation evidence is recorded in
`docs/reports/CORE-SYSTEM-IMPLEMENTATION-2026-09-06.md`; external provider,
cluster realtime, load, cross-browser field performance, and deployment gates
remain separate gates.
