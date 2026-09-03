# 09 — Corrected Accessibility (WCAG 2.2 AA) Evidence

**Audit date:** 2026-09-01  
**Auditor:** Antigravity 3.7 Flash High; Luna Max evidence review  
**Claim discipline:** This is a bounded local audit, not a conformance certification. See `docs/recon/EVIDENCE-CLEANUP.md`.

## Verified local evidence

- The recorded Axe checks found only a minor `aria-allowed-role` issue on the core Trust/Community/Expert pages, while login exposed landmark/heading/region findings in the one-off run.
- Trust risk results include explicit text/status semantics and are not conveyed exclusively by color.
- TrustGraph exposes an HTML list fallback and button-based node selection.
- The command overlay has dialog semantics and autofocus. A complete focus trap, restoration, and screen-reader announcement flow was not verified.

## Findings

```text
[FINDING-A11Y-01] [SEVERITY: BLOCKER] [STATUS: VERIFIED]
The mobile shell clipping defect reduces the usable main surface on core routes. Fixing it is a structural accessibility requirement before visual work.
```

```text
[FINDING-A11Y-02] [SEVERITY: HIGH] [STATUS: NOT_EXECUTED]
TrustGraph arrow-key traversal, focus movement, relation narration, and graph/list parity have not been tested end-to-end. Interactivity exists, so “static graph” is not an accurate finding.
```

```text
[FINDING-A11Y-03] [SEVERITY: MEDIUM] [STATUS: VERIFIED PARTIAL]
Login landmark/heading/region issues were observed in the local Axe run. The full authentication flow and all viewport states still require the F02/F04 accessibility gate.
```

```text
[FINDING-A11Y-04] [SEVERITY: NOT_EXECUTED]
Touch-target sizes, zoom/reflow at 200%, high-contrast modes, real screen-reader output, and reduced-motion behavior on physical devices were not executed.
```

## Gate

No page is called WCAG-conformant from this evidence alone. F02 must preserve semantic state text, keyboard reachability, focus visibility, and no-color-only meaning while correcting the shell structure.
