# 05 — Corrected Trust Flagship Experience Gap Analysis

**Audit date:** 2026-09-01  
**Auditor:** Antigravity 3.7 Flash High; Luna Max evidence review  
**Claim discipline:** Current implementation facts below are `VERIFIED` from source/tests unless marked otherwise. Production provider behavior is `BLOCKED_BY_ENV` where stated. See `docs/recon/EVIDENCE-CLEANUP.md`.

## Verified current strengths

- `AiTrustStudioView` accepts URL, text, and image input, validates image type/size, runs local OCR for an explicit hint, supports cancellation, and calls the typed Trust API seam.
- Trust results already expose a verdict/action path, reasons, timeline/provider status, related cases, and separate risk/confidence/evidence/source-agreement concepts in the result surface/tests. It is inaccurate to describe the current UI as only a single “safe percentage” score.
- `TrustGraph2D` is an interactive SVG. It provides search, kind filtering, zoom controls, selectable node buttons, an inspector, and a list fallback. It is inaccurate to describe it as static or non-interactive.
- Demo mode is guarded by an explicit `NEXT_PUBLIC_COMPETITION_DEMO=true` flag and is labelled in the Trust surface/tests. A global demo-label contract still needs to be enforced consistently across every provider-backed surface.

## Confirmed gaps and bounded unknowns

```text
[FINDING-TRUST-01] [SEVERITY: HIGH] [STATUS: VERIFIED GAP]
Current Trust image review exposes OCR text/preview but does not establish a verified coordinate/entity-overlay contract in the inspected UI.
Required boundary: coordinates may be rendered only when returned by a typed OCR/entity provider; the client must never invent boxes or entities.
Not executed: live OCR provider coordinate support and a complete screenshot-to-entity browser flow.
```

```text
[FINDING-TRUST-02] [SEVERITY: HIGH] [STATUS: VERIFIED GAP]
The current result is a dense sequential stack rather than a fully frozen progressive Level 1 -> Level 2 -> Level 3 information hierarchy.
Required boundary: decision/action first, explanation second, technical evidence third, with independent uncertainty states.
Not executed: complete progressive disclosure usability validation.
```

```text
[FINDING-TRUST-03] [SEVERITY: HIGH] [STATUS: NOT_EXECUTED]
Metric semantics, calibration, and evidence-coverage calculation are not proven by the UI labels alone.
Required boundary: Risk, Confidence, Coverage, Agreement, and Unresolved Signals must have typed definitions and cannot be inferred from colors or a single percentage.
```

```text
[FINDING-TRUST-04] [SEVERITY: MEDIUM] [STATUS: VERIFIED GAP]
TrustGraph has no verified arrow-key graph traversal, focus management for selected nodes, or complete non-visual relation narration.
The existing list fallback reduces the gap but does not prove full keyboard/screen-reader usability.
```

```text
[FINDING-TRUST-05] [SEVERITY: HIGH] [STATUS: VERIFIED PARTIAL]
Explicit Trust demo disclosure exists, but the global provider contract must ensure every demo response carries provenance and every live-unavailable response is labelled UNAVAILABLE rather than silently replaced by a fixture.
```

## Evidence boundary

The local frontend run verified route rendering and testable UI behavior. It did not verify a live ASP.NET provider, production Supabase/RLS, OCR coordinates from a production service, or calibrated model quality. These are `BLOCKED_BY_ENV` or `NOT_EXECUTED`, not failures converted into visual requirements.
