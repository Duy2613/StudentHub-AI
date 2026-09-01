# 08 — Corrected Mobile Responsiveness & Layout Composition Gaps

**Audit date:** 2026-09-01  
**Auditor:** Antigravity 3.7 Flash High; Luna Max evidence review  
**Tested local widths:** 360, 390, 430, 768, 1024, and 1440 px where the recorded run covered them  
**Claim discipline:** Shell clipping is `VERIFIED` by local browser checks. Exact touch-target measurements and complete device coverage are `NOT_EXECUTED`. See `docs/recon/EVIDENCE-CLEANUP.md`.

## Verified findings

```text
[FINDING-MOB-01] [SEVERITY: BLOCKER] [STATUS: VERIFIED]
On the canonical core routes, the mobile MarginRail remains a flex child. At the recorded 390 px run, the main content was approximately 146 px wide; dashboard was approximately 120 px wide. The document scroll-width check did not catch the clipping.
Required boundary: the mobile rail must not consume permanent horizontal layout width; navigation must be an overlay or non-blocking flow region.
```

```text
[FINDING-MOB-02] [SEVERITY: MEDIUM] [STATUS: NOT_EXECUTED]
The reconnaissance did not produce a reliable measurement of every interactive touch target. A 44 px target is an acceptance requirement for future implementation, not a verified current violation count.
```

```text
[FINDING-MOB-03] [SEVERITY: NOT_EXECUTED]
Progressive disclosure order, graph drawer behavior, keyboard/focus behavior on real mobile assistive technology, and field device performance require F02/F03 verification.
```

## Product implication

The mobile shell defect is an engineering foundation blocker because it affects Trust, Community, Expert, Cases, Dashboard, and other shell consumers. It does not authorize a visual redesign in F00/F01; it defines a structural acceptance gate for F02.
