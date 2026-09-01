# StudentHub AI — Frozen Product Scope

**Program:** StudentHub AI product and architecture freeze  
**Phase:** Stages 00–24 continuous engineering program  
**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01

## Purpose

This is the canonical product boundary for the continuous engineering program. It resolves the current frontend route sprawl into a trust-first product and records the completed local implementation without claiming that the collaborator ASP.NET backend, live Supabase/RLS, production providers, or deployment are available.

F00/F01 froze product ownership, route ownership, information architecture, flow semantics, adapter boundaries, and UI state meanings. Stages 02–24 now implement the non-visual engineering needed to make those decisions executable. Final visual/cinematic polish remains Antigravity-owned and backend/provider integration remains environment-gated.

## Product definition

StudentHub AI is a trust-first student intelligence platform that helps a student understand a questionable claim, inspect its evidence, and choose a safer next action.

The frozen product equation is:

    Academic context × Trust investigation × Editorial evidence

Trust is the flagship. Community and Expert make Trust more useful without becoming alternate truth engines.

## Frozen core

| Priority | Pillar | Job to be done | Required outcome |
| --- | --- | --- | --- |
| P0 | Trust | Investigate URL, message, screenshot/image, and QR-ready input before the student clicks, pays, signs in, uploads, or shares | Decision, evidence explanation, uncertainty, and safe action |
| P1 | Community | Inspect and contribute time-bound student observations with provenance and corroboration | Context and disagreement without popularity-as-truth |
| P1 | Expert | Find scoped authority and request an accountable assessment | Scope-bound review with evidence, confidence, limitations, and timestamp |

## In-scope product capability

### Trust

- multimodal input: URL, text/message, screenshot/image, and QR-ready contract boundary;
- input validation, normalization, and entity extraction;
- truthful staged investigation with cancellation and bounded requests;
- Level 1 decision: verdict, action, top reasons, unknowns, and unresolved signals;
- independent Risk, Confidence, Evidence Coverage, Source Agreement, and Unresolved Signals;
- Level 2 explanation: identity, technical, content, reputation, community, and expert context;
- Level 3 evidence: redirect, DNS, TLS/certificate, headers, infrastructure, provider observations, timestamps, and provenance when available;
- explicit `PARTIAL`, `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`, `UNAVAILABLE`, `ERROR`, and `OFFLINE` behavior;
- TrustGraph with a list fallback;
- Trust case identity, revisions, action handoffs, and Evidence Passport contract.

### Community

- observation feed and detail;
- source, context, timestamp, evidence attachment, freshness, corroboration, and conflict semantics;
- authenticated contribution and moderation boundary;
- links from observations to Trust cases without automatic verdict mutation.

### Expert

- searchable expert directory;
- identity, scope, credential/publication evidence, verification status, reviewed cases, limitations, and expected review time;
- case-linked scoped assessment;
- confidence, evidence reviewed, timestamp, revision, and disagreement semantics;
- no popularity leaderboard or unbounded authority claim.

### Supporting platform

- public landing/discovery;
- login, registration, OAuth callback, onboarding, session boundary;
- Dashboard for personal cases/briefing;
- Profile and Settings, including privacy/retention controls;
- explicit deterministic DemoProvider fixtures;
- `/cases` as an explicitly labelled deterministic Case Lab for contract/product review, not live Passport authority.

## Feature disposition

| Disposition | Features | Rule |
| --- | --- | --- |
| `REQUIRED_DEPENDENCY` | Trust, Community, Expert, Landing, Dashboard, Profile, Settings/Privacy, Auth, Onboarding, Case Lab | Required for current product promise or safe identity/case lifecycle |
| `MERGE_INTO` | `/ai`, `/contract-check`, `/scam-check`, `/prof-rating`, `/intelligence/*`, `/academic/profile`, `/profile/[id]` | Preserve the user job only under the canonical domain owner; no second domain model |
| `POST_V1` | Academic workspace/planner/roadmap/execution, credit scheduler, Safety Map, SOS, Scholarships, Tuition Radar | Retain as deferred code/compatibility only; no current core promise or primary nav |
| `REMOVE` | Forum, Marketplace, Quests, Ultra | Remove from product information architecture after a separate migration/removal gate |

`/cases` is retained as a supporting demo route, not promoted to a fourth pillar. `/academic/profile` is merged into Profile as a future academic view, while the rest of Academic remains POST_V1.

## Out of scope for visual authority and environment-gated integration

- advanced visual redesign, cinematic landing, new 3D/WebGL, GSAP/Framer motion polish, or media direction;
- advanced TrustGraph redesign, novel scoring algorithms, or model calibration claims;
- production ASP.NET integration before a live contract and adapter gate;
- production provider credentials, email/workers/cron, live Supabase/RLS migrations, or unverified external data;
- full Academic 360, safety operations, scholarship matching, tuition radar, marketplace, quests, forum social mechanics, or generic AI chat;
- silent live-to-demo fallback;
- merging observations, expert opinions, or fixtures directly into a Trust verdict.

## Product laws

1. Reality before confidence.
2. Evidence before conclusion.
3. `UNKNOWN` is not `SAFE`.
4. `INSUFFICIENT_EVIDENCE` is a valid result.
5. `CONFLICTING_EVIDENCE` is a valid result.
6. `UNAVAILABLE` is not a finding and is not safe reassurance.
7. Demo data is never live evidence.
8. Community observations inform a case but do not automatically establish truth.
9. Expert authority is scoped, evidenced, time-bound, and accountable.
10. Every action declares the state and evidence basis it relies on.

## Frozen truth boundary

The frontend consumes typed domain contracts through a provider port. A provider may return evidence, a structured unknown, a partial result, an unavailable state, or an error. The UI must not manufacture a finding to fill an absent provider response.

The absence of live backend/RLS/provider evidence is recorded as `BLOCKED_BY_ENV` or `NOT_EXECUTED` in `docs/recon/EVIDENCE-CLEANUP.md`; it is never represented as a passing product state.

## Freeze acceptance (historical F00/F01 gate)

F00/F01 is accepted when:

- the three core pillars and supporting platform are unambiguous;
- all 39 current routes have one disposition;
- every compatibility/removed/deferred route has explicit migration behavior;
- Trust owns case, report, action, graph, and Passport lifecycle;
- Community owns observations/corroboration and Expert owns scoped assessments;
- state meanings and failure semantics are written before visual implementation;
- DemoProvider and future live providers share one contract with no silent fallback;
- F02 was the only implementation phase specified at freeze time;
- no source, backend, database, or visual polish change is required to declare the freeze.

## Scope-change protocol

Any new route or feature must state its pillar owner, user job, data/evidence contract, security/privacy impact, performance budget, tests, rollback, and which existing surface is deferred, merged, or removed. The owner must approve a scope change before implementation.

## Continuous program implementation status

The local engineering program has completed the executable foundation, canonical shell/navigation adoption for the core routes, Trust input/report/multimodal safety behavior, TrustGraph/Passport seams, Community observation/detail/submission seams, Expert directory/assessment seams, privacy/auth state handling, responsive/accessibility/performance gates, and visual handoff contracts. It did not add a fourth pillar or promote deferred features.

The product remains accepted as:

- **Core pillar routes:** 3 — `/trust`, `/community`, `/expert`;
- **Canonical retained routes:** 13 `KEEP` routes, including landing, Case Lab, personal, and identity support;
- **Inventory:** 39 current page routes, each with one disposition;
- **External readiness:** ASP.NET/Supabase/RLS/provider/deployment proof is `BLOCKED_BY_ENV`;
- **Visual readiness:** contracts are ready for Antigravity; advanced visual polish is not claimed complete.
