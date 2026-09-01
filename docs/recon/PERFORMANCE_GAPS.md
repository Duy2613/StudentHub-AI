# 10 — Corrected Performance & Bundle Budget Audit

**Audit date:** 2026-09-01  
**Auditor:** Antigravity 3.7 Flash High; Luna Max evidence review  
**Claim discipline:** Repository measurements are `VERIFIED` only where cited. Field CWV, production waterfalls, and unmeasured impact claims are `NOT_EXECUTED`. See `docs/recon/EVIDENCE-CLEANUP.md`.

## Verified baseline

- `docs/frontend/PERFORMANCE.md` records route initial-JS measurements for the then-current local build: `/trust` 360,164 bytes, `/community` 325,808 bytes, and `/expert` 327,837 bytes; shared emitted CSS was recorded as 338,843 bytes.
- `frontend/package.json` declares heavyweight capabilities including Three.js/React Three Fiber, GSAP, Tesseract, and jsQR. Their presence is verified; route-level load cost must be measured rather than inferred from dependency presence.
- The source contains model/asset and canvas systems. Their runtime load timing, network priority, and impact on real devices were not executed in this phase.

## Corrected findings

```text
[FINDING-PERF-01] [SEVERITY: HIGH] [STATUS: VERIFIED BASELINE]
Core route bundles and shared CSS are large enough to require a measured budget and route-level ownership. Exact optimization opportunity must be established from a current production build/profile.
```

```text
[FINDING-PERF-02] [SEVERITY: HIGH] [STATUS: NOT_EXECUTED]
No reliable evidence was produced for a 1.4 MB initial landing payload, 28 MB raw model load, or a single 135.4 KB total CSS footprint. These claims are removed from the evidence base.
```

```text
[FINDING-PERF-03] [SEVERITY: HIGH] [STATUS: NOT_EXECUTED]
Field LCP, INP, CLS, memory, battery, reduced-motion behavior, and mobile GPU impact were not measured.
```

## Foundation implications

F02 must keep provider code and heavy visual/analysis code off the initial shell path where possible, use abortable bounded requests, preserve reduced-motion behavior, and add a repeatable bundle/performance check. No visual effect is removed by this document alone.
