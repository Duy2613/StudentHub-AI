# AI / Omni V4 — domain gaps

| Gap | Frontend decision | Consequence |
|---|---|---|
| Trust/claim full-text index absent | DISABLED_WITH_EXPLANATION | Search own Trust by full case ID only; canonical Trust navigation always available. |
| Search DTO lacks full Expert scope | READ_ONLY | Use existing public Expert directory endpoint, omit its coarse global-search duplicate. |
| Source index absent | READ_ONLY | Surface attached public sources from matching discussions; label their parent context, never source quality. |
| Contextual case/thread/assessment AI lacks authorized revision contract | DISABLED_WITH_EXPLANATION | Explain/compare private records and summarize threads are not exposed. AI may help with the text explicitly entered, with an optional non-sensitive core label. |
| Structured AI citations absent | READ_ONLY | Safe output links are AI-proposed links, not verified citations. Original product references remain in search results. |
| Streaming/partial response missing | HIDDEN | Bounded JSON loading; provider-unavailable payload cannot become a complete answer. |
| Server cancellation unavailable | HIDDEN | No cancel button. Close/unmount aborts browser observation only; timeout copy states server work may continue. |
| Historical Trust verdict snapshots missing | READ_ONLY | Current owned case title/claims only, no reconstructed verdict and no inferred revision. |
| Public Community social edit revision absent | READ_ONLY | Refetch selected source/post before opening; no assertion of revision-bound AI summaries. |
| Persistent Omni history absent | HIDDEN | No fake recents or persistent query storage. Closing clears request/answer state. |
| Backend AI tool actions absent | HIDDEN | Allowlisted navigation only; model output never triggers commands. |
| Full-population ranking/index absent | READ_ONLY | Explain text matching and endpoint limits; no importance/confidence scores. |
| Live provider/DB/privacy assurance | FUTURE_DESIGN_ONLY | DEFERRED; use contract fixtures in isolated local production build. |

Trust V4.2 remains PARTIAL_CONTRACT_BOUND: claim correction, exclusion, split/merge/confirm and immutable rerun are not implemented in Omni. Community and Expert retain their current product flows.
