# StudentHub Trust — Own Backend / Four-Layer Final Predict Contract

This document records the implementation contract for the canonical StudentHub-owned Trust path. It is derived from the active execution request supplied with this task; historical Friend-backend material is not an executable dependency of this path.

## Ownership and public shape

| Public stage | StudentHub-owned responsibility | Allowed external dependency | Public outcome |
| --- | --- | --- | --- |
| Layer 1 — Deterministic Screen | Input, format, local security and deterministic checks | None | Actual checks executed, signals, limitations, next step |
| Layer 2 — Threat & Semantic Intelligence | Threat/reputation, semantics/entities/manipulation, student scam/context | Only configured StudentHub-owned providers | Provider truth, semantic signals, context risks; failure stays UNKNOWN/PARTIAL |
| Layer 3 — Evidence Retrieval | Claim/task queries, live retrieval, source validation and provenance | StudentHub Tavily adapter only | Real source records, provenance, evidence sufficiency |
| Layer 4 — AI Synthesis & Reasoning | Tavily-context synthesis, independent Gemini citations, and uncertainty explanation | StudentHub Gemini gateway only | Actual executed model, bounded reasoning, validated Tavily + Gemini links |
| Final Predict | Deterministic projection of all layer outputs | None | Separate truth, security and recommended-action axes |

The public pipeline has exactly four layers. Final Predict is a projection after Layer 4, not Layer 5 and not an additional model call. Internal legacy compatibility may remain outside this route, but Friend backend adapters, Friend URLs and Friend environment variables are not permitted on the canonical path.

## State transition matrix

| State | Trigger / server action | UI action | Error / safety rule |
| --- | --- | --- | --- |
| `IDLE` | No run exists | Show Layer 1 ready; Layers 2–4 locked | No provider call |
| `SUBMITTING` | Valid request accepted | Disable duplicate submit; show request state | Invalid input returns typed 4xx |
| `L1_RUNNING` | Deterministic screen starts | Layer 1 dominant; later layers locked | Cancellation stops publication |
| `L1_COMPLETE` | L1 result committed | Show actual checks and limitations | PASS never means true/safe |
| `L2_RUNNING` | L2 starts after L1 | Layer 2 dominant; L1 settles | Provider failure cannot become SAFE |
| `L2_COMPLETE` | L2 sub-results merged | Show actual provider(s), semantic/context findings | UNKNOWN/PARTIAL remains visible |
| `L3_RUNNING` | L3 starts after L2 | Show bounded Tavily retrieval status | No local corpus is external evidence |
| `L3_COMPLETE` | Sources/evidence finalized | Show real sources and provenance | Zero usable sources => `INSUFFICIENT_EVIDENCE` / `UNKNOWN` |
| `L4_RUNNING` | L4 starts after L3 | Show synthesis progress; no premature verdict | AI receives only bounded, trusted inputs |
| `L4_COMPLETE` | Synthesis result validated | Show evidence-phase counts and resolved source IDs; keep executed model in backend audit only | Model failure => partial/unknown, conservative action |
| `FINAL_PREDICT` | Deterministic projection executes | Show truth/security/action separately | Exactly zero Tavily and AI calls |
| `COMPLETED` | Final projection published | Enable navigator; reopen layers without rerun | No hidden rerun on navigation |
| `PARTIAL` | A layer/provider is unavailable | Preserve completed findings; explain gap | Never upgrade uncertainty to positive certainty |
| `FAILED` | Unrecoverable server error | Show safe failure and retry action | Do not fabricate a layer result |
| `CANCELLED` | Client/request cancellation | Stop stream and mark cancelled | Do not publish stale final result |

## Tavily dual-stage evidence contract

After the initial Layer 3 package is built, Layer 4 may perform exactly one bounded evidence-gap analysis. The gap-analysis response contains only missing-evidence reasons and plain-text suggested queries. The final Gemini synthesis may return exact Tavily URLs and independent Gemini URLs; the server validates independent URLs before publication. The server accepts at most two queries and runs at most one supplemental Tavily retrieval round:

`Gemini gap analysis → Tavily supplemental search → safe URL validation → page fetch → evidence extraction → source quality → deduplication → rebuilt canonical evidence package → one final Gemini synthesis`

Every source and evidence item carries `retrievalOrigin`. Tavily owns the initial and bounded supplemental evidence retrieval. Gemini receives that evidence as context and may add an independent public URL. Any Gemini URL is checked server-side for HTTP(S), SSRF/DNS safety, redirects, and a reachable HTTP response before it is exposed. Broken, private, malformed, or fabricated-looking URLs are removed from the public DTO. The final Gemini DTO may use `supportingSourceIds` / `contradictingSourceIds` for Tavily evidence and `citationsUsed` for exact Tavily URLs or independent Gemini URLs. No recursive search loop is allowed.

Layer 3 visibly separates `Initial Search`, `Supplemental Search`, and `Final Validated Evidence Set`. Layer 4 visibly reports initial sources, supplemental sources, and total validated sources. The executed model remains available for server-side audit and is intentionally not rendered as an AI-engine label in the UI.

## Non-negotiable invariants

- Active canonical Friend calls: `0`.
- Public layer identifiers: `l1`, `l2`, `l3`, `l4`; no public `l5`, `L5`, or `5 lớp`.
- Layer 3 canonical provider: Tavily through a server-only StudentHub adapter.
- Supplemental retrieval is bounded to one round and two AI-requested queries.
- `retrievalOrigin` is mandatory on normalized Tavily sources/evidence. Gemini citations carry their own validation metadata (`retrievalOrigin=GEMINI_GENERATED`, `validationStatus=REACHABLE`, HTTP status, and optional redirect target) and only validated citations are public/clickable.
- A Tavily outage or zero usable sources cannot be converted into confident TRUE/FALSE by Layer 4.
- Every displayed provider, source, model, confidence and citation must be present in the executed result; no hardcoded positive provider output.
- Final Predict is deterministic and performs no network, retrieval, or AI work.
- Expert Blind Review remains observational and must not override Final Predict or be shown as an input to pre-submit analysis.

## Motion and navigation contract

Motion is a presentation of backend state, never a scheduler for backend work. A transition may begin only after the corresponding real stage event arrives; no timer may trigger Layer 2, Tavily, Gemini or Final Predict. The initial visual state is `L1 READY`, `L2–L4 LOCKED`, and `FINAL PREDICT LOCKED`. The persistent rail is `01 SCREEN → 02 INTELLIGENCE → 03 EVIDENCE → 04 SYNTHESIS → FINAL PREDICT` and illuminates only completed backend stages.

The active layer is visually dominant while running. Completed layers settle into compact summaries, and Final Predict converges from four provenance nodes without implying equal numerical weighting. After completion, layer navigation changes only local stored/rendered state: provider calls, Tavily calls, Gemini calls and new Trust runs must all remain zero. Arrow Left/Right, Home and End are allowed outside text/form controls. Reduced-motion mode keeps all status/content/navigation and removes shimmer, travel and large transforms. Unknown/insufficient states use neutral or amber treatment; only real errors use error styling.

Required motion evidence is defined as QA work, not as a source of fake progress: idle, each active layer, each real transition, source arrival, synthesis/result, convergence, Final Predict, evidence-chain view, and reopening completed layers without rerun. The final handoff must report the motion acceptance values only after actual browser/video verification.
