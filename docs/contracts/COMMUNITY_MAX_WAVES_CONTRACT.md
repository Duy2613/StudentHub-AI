# StudentHub AI — Community Max Waves Contract

Status: development/staging implementation only
Contract version: `community-max.v1`
Owner gate: `COMMUNITY_DEVELOPMENT_AUTHORIZED_WITH_EXTERNAL_EMAIL_GATE`
Unresolved external gate: `STAGING_EMAIL_FINAL_ASSURANCE_PENDING`

## Scope and freeze boundary

Community Max is an additive intelligence layer over the existing Community
Promax contracts. Auth, Profile, Expert authority, Trust V5, callback/session
exchange, and Supabase Auth configuration are consumed as-is. Community can
emit a signal, a review request, or a read-only bridge event; it cannot write a
Trust verdict, grant an Expert role, change a client vote's weight, or turn
popularity into truth.

The canonical persisted entities remain:

| Product concept | Canonical storage | Rule |
| --- | --- | --- |
| Contribution and revision | `public.community_contributions`, `public.community_contribution_revisions` | Reuse; revision is immutable and case/claim scoped. |
| Source family | `public.community_source_clusters` | Reuse; cluster identity is not proof of truth. |
| Source instance, status, and freshness | `public.community_source_references`, `public.community_source_change_events` | Additive projection; URL safety and state history are server-owned. |
| Claim discussion | `public.community_claim_discussions` | Typed, revision-bound discussion projection; legacy `public.comments` remains compatible for post comments. |
| BELIEVE/DOUBT and reactions | `public.community_perception_votes`, `public.community_reactions` | Reuse existing repositories; signals stay non-authoritative. |
| Evidence Passport | `public.evidence_passports`, `public.evidence_passport_events` | Read canonical Trust-owned passport; never duplicate or mutate from Community. |
| Review and Expert request | `private.community_review_candidates`, `private.community_expert_requests` | Queue only; assignment and authority remain Expert-owned. |
| Discussion summary | `public.community_discussion_summaries` | Grounded projection only; no fabricated source or verdict. |
| Campus context | `public.community_campus_contexts` | Explicit consent and visibility; no profile inference. |
| Risk pattern | `private.community_risk_clusters`, `private.community_risk_cluster_members` | Hashed server-side signals; no raw sensitive pattern in public DTOs. |
| Correction culture | `public.community_correction_records` | Append-only integrity signal; no Trust mutation. |
| Data flywheel candidate | `private.community_data_candidates` | Candidate only; `training_eligible` is hard-false in this contract. |
| Moderation and appeals | Existing `private.moderation_*`, `public.moderation_appeals` | Reuse; moderation cannot alter Trust. |

## State transition matrices

Every route and UI action maps to a row below. Invalid transitions fail closed
with a typed error and preserve the previous durable state.

### Wave 1 — evidence-first, claim discussion, independence, revision, freshness

| Trigger | Action / system response | UI feedback | Error / boundary |
| --- | --- | --- | --- |
| Member selects an epistemic intent | Normalize to `DIRECT_EXPERIENCE`, `FOUND_SOURCE`, `NEEDS_VERIFICATION`, `SUPPORTING_EVIDENCE`, `CONTRADICTING_EVIDENCE`, `CONTEXT`, or `CRITIQUE`; require only fields appropriate to that intent. | Intent is visible before the statement field; evidence and uncertainty are separate. | Unknown intent, unsafe URL, oversized text, or identifying content returns a typed validation error. |
| Member requests preview | Run privacy and URL checks; return a redacted preview digest. | `PREVIEW_READY`, `PRIVACY_SCAN_PENDING`, or `BLOCKED` is explicit. | Original file bytes, OCR identifiers, QR data, and EXIF never enter a public DTO. |
| Member publishes a preview | Delegate to existing `CommunityRepository.createContribution` with case/revision/claim scope and idempotency. | Published contribution shows its binding and evidence state. | Missing canonical case scope or stale preview cannot publish. |
| Member opens a claim discussion | Validate contribution, claim, and immutable contribution revision; insert one typed discussion event. | Discussion is labelled `SUPPORT`, `CHALLENGE`, `ADD_EVIDENCE`, `CONTEXT`, or a request. | Discussion cannot attach to another claim/revision; client cannot set expert/truth status. |
| Source URL is attached | Canonicalize safe HTTP(S) URL, derive conservative independence key, reuse/create source cluster, then persist source reference. | Show source count and independent source-family count separately. | Loopback/private/credential-bearing URLs and tracking secrets are rejected. Cluster count is not a truth score. |
| Contribution is edited | Existing immutable revision flow is used; verification projection becomes `OUTDATED`/`NEW_VERIFICATION_REQUIRED`. | Old revision remains inspectable and a freshness warning appears. | Stale expected revision returns conflict; no in-place history overwrite. |
| Source verification window expires or source changes | Update freshness/source state projection and append a source-change event. | `FRESH`, `AGING`, `STALE`, `SOURCE_RETRACTED`, or `CONTEXT_CHANGED` badge. | No source-status event may update a Trust verdict. |

### Wave 2 — disagreement, passport, Expert request, summary, ranking

| Trigger | Action / system response | UI feedback | Error / boundary |
| --- | --- | --- | --- |
| Signals disagree materially | Deterministically create a private review candidate with bounded priority and cited signal IDs. | `HIGH-VALUE DISAGREEMENT` explains the observed conflict, not a winner. | No majority shortcut; no automatic verdict or Expert authority. |
| Member requests more evidence | Queue a review candidate or Expert request with sanitized reason and domain. | `QUEUED`; no promised SLA or assigned Expert is invented. | Client cannot assign, activate, or qualify an Expert. |
| Owner opens an Evidence Passport | Read `evidence_passports` and its event timeline using canonical owner scope. | Passport timeline is clearly marked Trust-owned. | Community cannot create, append, or rewrite Passport events through this route. |
| Discussion summary is requested | Build a grounded summary only from persisted discussion/source records and cite their IDs. | Label `AI DISCUSSION SUMMARY` plus provider status and `NOT A VERDICT`. | No model/provider claim, uncited sentence, private content, or invented source is emitted. |
| Feed ranking is requested | Apply bounded transparent relevance/evidence/freshness/independence/helpfulness factors. | Show ranking reasons and policy version. | Popularity, vote weight, contributor score, or Expert status cannot be a truth authority. |

### Wave 3 — retraction, campus, risk, correction, data flywheel

| Trigger | Action / system response | UI feedback | Error / boundary |
| --- | --- | --- | --- |
| Source becomes unavailable/retracted | Append source state event, mark dependent Community freshness stale, and notify the contribution owner with a generic safe message. | Source alert identifies state and affected revision, not a verdict. | Never delete source history or alter Trust state. |
| Member adds campus context | Persist only explicit, consented fields and requested visibility. | `PUBLIC`, `PRIVATE`, or `CONSENT REVOKED` is visible. | No university/major inference from email, profile, location, or text. |
| Repeated sanitized risk signal matches | Hash server-side fingerprint and upsert a private cluster/member projection. | Show only an aggregate safety signal when authorized. | Raw PII, exact reports, and private cluster membership stay private. |
| Member corrects a contribution | Create a new canonical revision/correction record and quality signal of integrity only. | Correction lineage and reason are visible. | No reputation windfall and no Trust verdict mutation. |
| Candidate reaches data flywheel | Store a private, privacy-sanitized candidate with consent/license/annotation states. | Candidate is not training data; eligibility is pending/false. | Automatic training is hard-disabled: `trainingEligible=false`. |

## Hard invariants

The following must remain true in code, SQL, DTOs, and tests:

```text
Community -> direct Trust verdict                 = 0
Popularity -> Truth                               = 0
BELIEVE -> VERIFIED                               = 0
Expert answer -> direct Trust verdict             = 0
Client vote weight as authority                   = 0
Client quality score as authority                 = 0
Contributor score -> Expert authority             = 0
Moderation -> Trust verdict                       = 0
Restricted media public leak                      = 0
Private profile leak                              = 0
User content -> automatic training                = 0
```

All reads expose `isAuthoritative: false` unless the response is explicitly a
read-only projection labelled `TRUST_CANONICAL` or `EXPERT_CANONICAL`. An
Expert request is a queue item, not an assignment. A summary is a cited
discussion summary, not a Trust result.

## Wave gates and regression evidence

Wave 1 can be marked implemented only after domain, migration/RLS, API, and
browser/empty-state checks pass. Wave 2 requires Wave 1 plus idempotency,
passport owner-scope, summary-grounding, and ranking-explainability checks.
Wave 3 requires Wave 2 plus source-retraction lineage, consent, private-risk,
correction, and hard-false data-candidate checks. Each gate must rerun the
Auth/Profile/Expert/Trust regression suite without changing those modules.

The external staging email gate remains separate:
`STAGING_EMAIL_FINAL_ASSURANCE_PENDING`. It is retried once, in a controlled
staging signup flow, only after capacity is available; Community work must not
consume email quota.
