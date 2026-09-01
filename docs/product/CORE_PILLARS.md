# StudentHub AI — Frozen Core Pillars

**Phase:** Stages 00–24 continuous engineering program  
**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01

## Pillar relationship

    Trust (P0 flagship)
       ├── owns investigation case, report, action, graph, and Passport
       ├── consumes typed provider evidence
       ├── receives Community observations/corroboration
       └── requests Expert assessment/escalation

    Community (P1 support) ── records contextual student observations
    Expert (P1 support) ───── provides scoped, accountable review

Community and Expert contribute typed events. They cannot silently mutate a Trust verdict.

## Trust — investigation and safer action

### User job

Before acting on a URL, message, screenshot, QR, document, or claim, a student needs a decision, the reason for it, the evidence behind it, what is unknown, and the safest next action.

### P0 commitments

- one canonical case identity across input, normalized entities, evidence, graph, report, action, and revisions;
- decision/action first, explanation second, technical evidence third;
- independent Risk, Confidence, Evidence Coverage, Source Agreement, and Unresolved Signals;
- explicit `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`, `PARTIAL`, `UNAVAILABLE`, `ERROR`, and `OFFLINE` semantics;
- no fabricated provider finding, confidence, provenance, or progress;
- safe containment action when evidence is insufficient or conflicting;
- Community corroboration, Expert escalation, and Evidence Passport as typed cross-pillar branches.

### Trust non-goals

- a single opaque safe percentage;
- generic ungrounded AI chat;
- a decorative graph that replaces evidence;
- silent demo fallback;
- treating `UNKNOWN` or `UNAVAILABLE` as safe.

## Community — collective observation

### User job

Students need to see what peers observed, when, where, and with what evidence, then add corroboration or correction without popularity deciding truth.

### P1 commitments

- observation is the canonical unit, not a like/upvote;
- source/context/time/evidence/freshness are first-class;
- corroboration and conflict are visible and time-bound;
- a safe link can attach an observation to a Trust case;
- contribution, moderation, redaction, and privacy have explicit contracts.

### Community non-goals

- forum engagement mechanics as authority;
- anonymous unscoped claims presented as verified;
- converting an observation count into a verdict.

## Expert — scoped authority

### User job

Students need a qualified reviewer for a particular domain and a traceable assessment of a specific Trust case revision.

### P1 commitments

- identity, scope, credential/publication evidence, verification status, and limitations;
- evidence reviewed, confidence, review timestamp, case revision, and assessment revision;
- disagreement/withdrawal/status handling;
- escalation from Trust and a clear return path to the case.

### Expert non-goals

- professor-rating registry as authority;
- popularity leaderboard;
- unbounded “expert on everything” identity;
- opinion represented as objective fact outside the declared scope.

## Shared semantics

| Semantic | Trust | Community | Expert |
| --- | --- | --- | --- |
| Evidence | Provider observations and provenance | Source, context, attachments, corroboration | Evidence item identifiers reviewed |
| Time | Scan time, provider time, case revision | Observation and corroboration time/freshness | Assessment/revision timestamp |
| Uncertainty | Unknown, insufficient, conflicting, unavailable | Missing corroboration or stale observation | Unverified credentials, out-of-scope, disagreement |
| Authority | Reconciled Trust policy | Context only | Scope-bound assessment only |
| Privacy | Sensitive input/output and retention | Contributor/attachment redaction | Approved public authority data |

## Ownership law

Trust owns the final case state and Passport revision. Community owns observation lifecycle. Expert owns assessment lifecycle. Dashboard lists user-owned cases. Profile exposes only permitted identity/history. Cross-pillar actions add events and evidence; they do not perform direct verdict mutation.

## Dependency classification

- `REQUIRED_DEPENDENCY`: Trust, Community, Expert, Dashboard, Profile, Settings/Privacy, authentication, onboarding, landing, and the explicitly demo-labelled Case Lab.
- `POST_V1`: Academic, Safety, Scholarships, Tuition Radar, and associated routes.
- `MERGE_INTO`: duplicate Trust/Community/Expert/tool/profile routes.
- `REMOVE`: Forum, Marketplace, Quests, Ultra.

No feature moves from `POST_V1` or `REMOVE` into core without the scope-change protocol in `docs/product/PRODUCT_SCOPE.md`.

## Implementation readout

The three-pillar ownership model is implemented in the local frontend boundary:

- Trust is the canonical `/trust` workspace and owns report/action/graph/passport handoffs.
- Community is the canonical `/community` observation surface with explicit case scope and no popularity-as-truth behavior.
- Expert is the canonical `/expert` scoped authority surface with credential/scope/limitation disclosure.

The shared provider port and UI state model preserve the ownership rule even when a capability is unavailable. Live ASP.NET, Supabase/RLS, and production-provider validation remain `BLOCKED_BY_ENV`.
