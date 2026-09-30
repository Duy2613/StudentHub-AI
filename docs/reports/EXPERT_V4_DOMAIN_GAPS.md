# Expert V4 Domain Gap Log

**Status:** `IMPLEMENTATION_ALLOWED_ASSURANCE_DEFERRED`  
**Phase 0:** `COMMUNITY_V4_2=PARTIAL_ASSURANCE_DEFERRED`; `EXPERT_V4_IMPLEMENTATION=ACTIVE`; `EXPERT_V4_FINAL_ASSURANCE=BLOCKED_BY_DB_FIXTURE_ENV`  
**Rule:** UI decisions below use only `HIDDEN`, `READ_ONLY`, `DISABLED_WITH_EXPLANATION`, or `FUTURE_DESIGN_ONLY`. Fixtures may represent real DTO data but may not add domain capability.

| Capability | Required by | Current contract | Frontend decision | Required backend/domain work | Release impact |
|---|---|---|---|---|---|
| Durable public directory | Discovery | Verified domain + public title/bio; richer DTO fields may be empty (`EXPERT_V4_CONTRACT_AUDIT.md`, directory row) | READ_ONLY | Add safe public profile fields only when verified/provenance-backed; stage migration/readback | PARTIAL when a field is absent |
| Name, institution, organization | Directory/profile | Durable query exposes public title/bio only | READ_ONLY | Define public fields and ownership/edit policy | Unknown must stay visible as unknown |
| Domain/subdomain | Scope | Durable verified domain code; public DTO has richer but not durable subdomain | READ_ONLY | Persist/display subdomain only with qualification evidence | No inferred expertise |
| Credential records and lifecycle | Qualification | Durable directory emits an empty credential list; private verification has lifecycle data but public DTO omits dates | READ_ONLY | Add explicit public-safe credential DTO and lifecycle policy | Do not show permanent verification badges |
| Publications/source links | Relevant work | Legacy/public DTO fields exist; durable directory supplies none | HIDDEN | Durable publication registry and canonical source validation | Noncritical metadata gap |
| Outside stated scope | Case eligibility | DTO exposes explicit `OUT_OF_SCOPE` only when provided; durable list lacks it | READ_ONLY | Define and persist explicit negative scope declarations | Absence is not “outside scope” |
| Public availability/capacity | Directory | Owner profile computes coarse active availability; no public capacity contract | HIDDEN | Define capacity, freshness and visibility policy | Do not imply scheduling or acceptance |
| Match ranking and explanation | Discovery | Topic/domain search exists; durable branch filters text and domain; no stable explainable score DTO | READ_ONLY | Add canonical match reasons if ranked matching is introduced | Use neutral order; no quality/rating ranking |
| Requester-selected Expert | Request flow | Requester submits a domain; assignment authority is server-controlled | DISABLED_WITH_EXPLANATION | No frontend change. Keep server matching/coordinator assignment | Avoid suggesting profile action targets a named reviewer |
| Review request state | Trust/Community/Profile | Owner can create/list requests; canonical statuses and case linkage exist in repository | READ_ONLY | Apply migration and verify owner isolation/readback | Live mutation assurance deferred |
| Expert queue / assignment | Adjudication | Private assignments and blind dossier API exist; queue summary is not verified in staging | READ_ONLY | Confirm a canonical queue listing API and role policy; reconcile legacy blind-review and Promax pathways | No synthetic production queue items |
| Private case adjudication | Case detail | Request owner scope exists; assignment/assessment currently require public case scope | DISABLED_WITH_EXPLANATION | Align privacy policy/domain contract before supporting private case assignment | Do not expose private case content |
| Evidence source/provenance | Evidence review | Assessment stores evidence revision IDs; dossier-specific source details depend on real returned payload | READ_ONLY | Stable source DTO and revision display contract | Missing provenance remains unknown |
| Conflict / recusal | Scope integrity | Assignment conflict flag and assessment COI state exist; full conflict taxonomy/lifecycle not confirmed | DISABLED_WITH_EXPLANATION | Define declaration categories, recusal, coordinator disposition and audit states | Do not allow binding review without valid COI state |
| Assessment state | Judgment | Persisted assessment, reasoning, uncertainty, missing evidence and within-scope conclusion | READ_ONLY | Keep client schema aligned with repository DTO | Never style an assessment as a Trust verdict |
| Review editing/withdrawal/version | Accountability | Submitted assessment is immutable; authority/assignment revisions exist; review version is absent | DISABLED_WITH_EXPLANATION | Define supersession, withdrawal and optimistic review version if required | No overwrite or fabricated revision history |
| Multiple Expert assessments | Disagreement | `getAssessmentsForCase` and disagreement policy exist | READ_ONLY | Verify public/private projection and case-level authorization | Show independent views; never average |
| Community completed-review projection | Roundtrip | Community can attach a request; no public assessment projection contract located | DISABLED_WITH_EXPLANATION | Define redacted public assessment DTO and visibility policy | Community must not fabricate “Đã có đánh giá chuyên gia” |
| Trust result mutation | Trust boundary | Expert assessment is separate; Trust remains backend-authoritative | DISABLED_WITH_EXPLANATION | None for UI; preserve immutable boundary | Expert must never rewrite Trust conclusion |
| Draft persistence | Assessment | Legacy blind-review API has an in-memory draft path; no durable private draft contract verified | READ_ONLY | Add a protected durable draft API only if needed | Use component memory only; never localStorage |
| Review notifications | Workflow | Realtime/outbox events only; no durable notification API verified | HIDDEN | Define user notification delivery/read state | No SLA/notification promise |
| Realtime convergence | Queue/case | Event names/listeners exist; live reconnect/order convergence unverified | READ_ONLY | Execute isolated multi-session replay, reconnect, close/reassign/revision tests | `IMPLEMENTED_UNVERIFIED_RUNTIME` until then |
| Omni public Expert | Search | Public list/detail provider exists | READ_ONLY | Keep search index limited to public DTO | Private queue/case stays excluded |
| Omni public assessments | Search | No public assessment endpoint/DTO | HIDDEN | Define publishable, redacted assessment contract | No private judgment leakage |

## Product guardrails

- Do not render rating, popularity, follower, XP, reputation score, or “best expert” ranking as discovery hierarchy. Existing older components that show such metrics are not part of the V4 public directory.
- Keep source data labels (`LIVE`, `DEMO_FIXTURE`, unknown) attached to provenance. Local fixtures are development-only and must not enter production runtime.
- Availability, publications, credential expiry/revocation, outside-scope declarations, conflict state, and public completed reviews remain absent unless the real API returns them.
- The previous Community closure report remains unchanged. Community is still `PARTIAL_ASSURANCE_DEFERRED`.

## Implementation verification update — 2026-09-27

**EXPERT_V4_IMPLEMENTATION_VERDICT:** `PARTIAL` · **EXPERT_V4_ASSURANCE_VERDICT:** `DEFERRED` · **COMMUNITY_V4_2:** `PARTIAL_ASSURANCE_DEFERRED`.

The Expert UI implementation is present for directory, public profile with explicit unknown fields, canonical request sheet, adjudication queue, dossier/evidence, bounded assessment, mobile navigation, and safe Community request-status projection. These views were exercised with deterministic DTO-shaped fixtures only. They do not change the gap classifications above: in particular, no public completed-assessment projection, public credential lifecycle, durable draft, review-version contract, complete conflict lifecycle, or case-close event was established.

The fixture suite passed with API writes and external requests blocked. It verifies UI behavior and accessibility for the inspected component scopes; it is not evidence of server authorization, DB persistence, actual staging records, or multi-session realtime convergence. Keep unknown, private, and unavailable capabilities hidden or explanatory until their real contracts exist.

## V4.1 non-database closure — superseding update — 2026-09-27

The later [Expert V4.1 Non-DB Implementation Closure](EXPERT_V4_1_NON_DB_IMPLEMENTATION_CLOSURE_2026-09-27.md) supersedes the preceding `PARTIAL` implementation status for the requested non-database closure: **`EXPERT_V4_IMPLEMENTATION_VERDICT = PASS`**. **`EXPERT_V4_ASSURANCE_VERDICT = DEFERRED`** and **`COMMUNITY_V4_2 = PARTIAL_ASSURANCE_DEFERRED`** remain unchanged.

This status closes the non-database frontend verification tasks; it does not change the capability classifications in the gap table. Public credential lifecycle, public assessment projection, review version/withdrawal, complete conflict/recusal lifecycle, durable notification/draft contracts, and live realtime convergence remain unproven or unavailable and must stay hidden, read-only, or explanatory until their product and backend contracts exist.
