# 05 — Trust Flagship Gap Audit

**Audit date:** 2026-09-01  
**Reference stance:** the requested evidence depth was compared at the product-structure level only. CyStack was not used as a pixel or visual-copy target.

## Baseline assessment

Trust is the strongest current product foundation. AiTrustStudioView already supports image, text, and URL modes; local OCR for images; clipboard paste; input validation; opt-in deterministic demo cases; a V5 sequential API request; abort and late-response protection; typed error states; provider status; reasons; actions; related cases; a TrustGraph; and Community/Expert handoffs.

The gap is not “no Trust feature”. The gap is that the current implementation is a layered studio output, while the brief defines a flagship investigation product with a strict reading order, independent evidence metrics, image/entity inspection, a technical drilldown, and a Passport lifecycle.

## Target-to-current matrix

| Target capability | Current evidence | Gap and priority |
| --- | --- | --- |
| Paste URL | URL mode with validation and Trust API path | Foundation present; retain |
| Paste text/message | Text mode, clipboard paste, validation | Foundation present; retain |
| Upload screenshot/image | Image mode, size/type validation, local OCR, preview | No investigation overlay or entity-level result; P0 |
| Scan QR | OCR may expose QR content in technical output | No dedicated QR mode, camera permission flow, or QR-specific explanation; P0 |
| Processing | Named Trust pipeline and V5 stages | Current stage display is good, but the design must guarantee stages reflect known backend events only |
| Level 1 decision | Verdict, safety actions, reasons | Current result is embedded in a long stack; make decision/action the first stable block |
| Risk | Qualitative verdict/risk language and meters exist | Brief asks for independent Risk value; freeze scale, meaning, and missing-data behavior |
| Confidence | Qualitative/provider confidence signals exist | No single clear Confidence metric tied to evidence and source quality |
| Evidence coverage | Evidence/provider details are present in parts of the report | No independent Evidence coverage metric with explicit denominator/unknown semantics |
| Source agreement | Provider findings/statuses and related evidence exist | No distinct Source agreement value or conflict explanation at the top level |
| Why it matters | Reasons and safety actions exist | Preserve; bring top three reasons beside the verdict |
| Level 2 explanation | Current result contains stage/provider/content sections | No explicit Overview, Identity, Technical, Content, Reputation, Community, Expert tab model |
| Identity | Trust pipeline and result data include investigation layers | Need a stable identity section that explains brand/domain/ownership mismatch |
| Technical | Technical/provider data and TrustGraph exist | Level 3 needs Domain, DNS, TLS, Headers, Redirect chain, Certificate, Infrastructure, provenance, and timestamps as a deliberate drilldown |
| Content | Text/image input and result reasons exist | Content signals need their own explanation tab and evidence references |
| Reputation | Related cases/provider results provide some context | Reputation evidence is not a named, consistent report layer |
| Community | Handoff exists; Community is a separate seeded feed | No case-linked corroboration panel or observation evidence in the primary Trust result |
| Expert | Handoff exists; Expert is a separate seeded dossier/evaluate flow | No case-linked scoped assessment event in the primary report |
| Screenshot evidence | Image preview exists | No highlighted regions, entity list, coordinate mapping, or mobile bottom-sheet equivalent |
| Uncertainty | Unknown/unavailable/provider statuses and typed errors exist | Normalize UNKNOWN, INSUFFICIENT_EVIDENCE, CONFLICTING_EVIDENCE, PARTIAL, and UNAVAILABLE across every section |
| TrustGraph | Search, kind filter, zoom, inspector, graph/list fallback; dynamically loaded | Static positions and limited filters; no keyboard node selection/pan; graph should be progressive, not initial cognitive load |
| Evidence Passport | Passport timeline exists in /cases demo | Not owned by primary /trust result; case, revision, sources, expert review, and engine version need one contract |
| Revision history | /cases demo shows revisioned Passport events | Trust flow does not yet append immutable revisions as a first-class action |
| Recommended action | Safety actions and handoffs exist | Make action visible before technical depth and bind each action to verdict/state |
| Demo mode | Explicit CHẾ ĐỘ TRÌNH DIỄN panel and env gate | Strong foundation; never present fixture results as live verification |
| Live backend boundary | Typed frontend API path and errors | Requested provider folder and future C# adapter are not frozen |

## Required Trust report hierarchy

The approved design should make this sequence visible without requiring a full page scroll:

    Level 1 — Decision
    ├── verdict
    ├── risk
    ├── confidence
    ├── evidence coverage
    ├── source agreement
    ├── top reasons
    └── what to do next

    Level 2 — Explanation
    ├── Overview
    ├── Identity
    ├── Technical
    ├── Content
    ├── Reputation
    ├── Community
    └── Expert

    Level 3 — Technical evidence
    ├── Domain, DNS, TLS, headers
    ├── redirect chain and certificate
    ├── infrastructure and provider results
    ├── evidence provenance
    └── observation timestamps / raw detail

    Supporting objects
    ├── screenshot entity annotations
    ├── TrustGraph
    ├── Evidence Passport and revisions
    └── escalation / action

The current implementation has many of these data areas in some form, but not this hierarchy or ownership.

## State taxonomy required for Trust

The brief defines:

    SUCCESS
    PARTIAL
    UNKNOWN
    INSUFFICIENT_EVIDENCE
    CONFLICTING_EVIDENCE
    UNAVAILABLE
    ERROR

The current frontend has pieces of this model in API errors, provider statuses, unknown copy, and demo labels. It does not yet prove that every metric, tab, graph node, Passport event, and action consumes the same taxonomy. In particular, UNKNOWN must never render as safe/positive, and UNAVAILABLE must not imply a negative finding.

## Risk/metric semantics to freeze before visual design

The brief proposes Risk, Confidence, Evidence coverage, Source agreement, and unresolved signals. Before any implementation, the product spec must define:

- whether Risk is 0–100, ordinal, or a labelled band;
- what Confidence measures versus Evidence coverage;
- how Source agreement behaves when only one provider returns;
- how missing or unavailable providers affect each metric;
- whether values are comparable across image, text, URL, and QR inputs;
- what action is allowed for PARTIAL, UNKNOWN, INSUFFICIENT_EVIDENCE, and CONFLICTING_EVIDENCE.

Current UI cannot be used as the answer because it mostly presents qualitative levels and provider statuses.

## TrustGraph gap

The current graph is a useful progressive candidate because it has a list fallback and dynamic loading. The next specification should add:

- graph entry after the decision, not before it;
- entity branches for message, domain, IP, certificate, redirect, phone, QR, and brand;
- keyboard selection and inspector announcement;
- filters that match all rendered node kinds, including Community and Expert;
- reduced-motion transitions and a list-first fallback for constrained devices;
- source/timestamp context for each node.

## Primary decision

Do not call Trust flagship complete because the current page can produce a V5 response. It becomes design-ready only when the product scope decides what is authoritative, the mobile shell is usable, and the report/passport/adapter ownership is frozen.
