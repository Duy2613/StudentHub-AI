# 08 — Core Reduction and Remove Candidates

**Audit date:** 2026-09-01  
**Core priority:** Trust P0; Community P1; Expert P1.  
**Safety rule:** this is a disposition list, not authorization to delete files.

## Reduction principle

Keep the current frontend as a baseline. Reduce the user-facing product surface around the three pillars, preserve useful domain logic for later, consolidate duplicate concepts into one owner, and remove only after link, data, legal, and rollback checks.

    current route or component
       ├── dependency      required by a core journey or platform boundary
       ├── valuable later   real value, but outside the current flagship scope
       ├── feature sprawl   competing product promise or duplicate model
       └── remove candidate no current product owner after compatibility review

## Outside-core inventory

| Surface | Category | Why | Recommended disposition |
| --- | --- | --- | --- |
| /dashboard | Dependency | personal case, session, notification, and Passport entry point | KEEP; clarify personal IA |
| /profile and /profile/[id] | Dependency | identity, reputation, public transparency, and future Passport ownership | KEEP / CONSOLIDATE public profile |
| /settings and /settings/privacy | Dependency | account, privacy, retention, and trust controls | KEEP |
| /login, /register, /callback, /onboarding | Dependency | auth boundary determines honest live/demo/session behavior | KEEP |
| /cases | Dependency/supporting lab | strongest current Passport, conflict, revision, and Decision Twin demo | KEEP temporarily; freeze top-level versus nested ownership |
| Academic 360 routes | Valuable later | real algorithmic value, but a separate product pillar | POST_V1; remove from primary navigation for current scope |
| /academic/profile | Valuable later plus dependency | transcript/degree data can support profile/Passport | CONSOLIDATE data ownership, defer full workspace |
| /credit-scheduler | Valuable later | useful planner behavior, not a Trust/Community/Expert promise | POST_V1 |
| /safety-map | Valuable later | physical safety domain with different data/legal requirements | POST_V1; separate product decision |
| /sos | Valuable later | emergency/complaint capability needs legal and operational ownership | POST_V1; do not silently merge into Trust |
| /scholarships | Valuable later | registry/matching feature with separate freshness and moderation needs | POST_V1 |
| /tuition-radar | Valuable later | compatibility entry to Academic; not current core | POST_V1 |
| /contract-check | Core-adjacent | a contract can be a Trust input, but it is not a separate report concept | CONSOLIDATE into multimodal Trust input after contract scope is defined |
| /intelligence and /intelligence/* | Feature sprawl / duplicate model | umbrella and subviews repeat Trust, Community, Expert, Evidence, and Knowledge concepts | CONSOLIDATE into canonical pillar surfaces |
| /ai | Feature sprawl / duplicate entry | generic AI promise conflicts with evidence-grounded Trust | CONSOLIDATE as Trust compatibility path, remove generic IA |
| /forum | Feature sprawl | social forum incentives and content model conflict with evidence-first Community | REMOVE from primary IA; retain redirect only if inbound links require it |
| /marketplace | Feature sprawl | buy/sell promise is outside current pillars; current route redirects to Community | REMOVE feature; retain compatibility redirect temporarily |
| /prof-rating | Feature sprawl / duplicate authority | rating registry can turn expertise into popularity; current route redirects to Expert | CONSOLIDATE into scoped Expert authority, no leaderboard |
| /quests | Feature sprawl | gamification is not a current Trust/Community/Expert outcome; current route redirects to Dashboard | REMOVE feature; retain compatibility redirect temporarily |
| /ultra | Remove candidate | internal showcase/playground, not an end-user product surface | REMOVE from product IA and release navigation |

## High-confidence remove candidates

### Forum

The legacy Forum page is a large, separate social product model with likes/downvotes and category behavior. Community’s intended unit is an observation with evidence, context, timestamp, source, and corroboration. Keeping both as primary destinations would split moderation, incentives, and trust semantics.

### Marketplace

The current route is a compatibility redirect to Community rather than a proven marketplace flow. Its product promise is unrelated to the current three-pillar priority. Do not spend design or backend-contract effort on it in this program.

### Quests

The current route is a compatibility redirect to Dashboard. The gamification surface adds engagement semantics without supporting evidence quality or scoped authority. Remove from the product IA after inbound-link review.

### Ultra

Ultra is a showcase/playground surface. It can remain a local design reference while the code is being audited, but it must not be treated as a production product route or used to justify more visual effects.

## Consolidation candidates

| Canonical owner | Absorb or redirect | Boundary to preserve |
| --- | --- | --- |
| Trust | /ai, /contract-check, /scam-check, /intelligence/ai-trust, /intelligence/evidence, /intelligence/knowledge, /intelligence/trust | one Trust case, one report, one evidence/provenance contract |
| Community | /intelligence/community, Forum compatibility traffic | one observation model; no automatic conversion of legacy social posts without moderation/data decision |
| Expert | /prof-rating, /intelligence/experts | scope-bound authority; no rating/leaderboard semantics |
| Profile / Passport | /profile/[id], /academic/profile outputs | identity, revision, evidence ownership, privacy policy |
| Supporting Case Lab | /cases | demo/live distinction, case URL, Passport revision ownership |

## API and component caution

The repository has 110 API route handler files and many feature components. This inventory is not enough evidence to delete an API handler, store, or shared primitive. Before removal:

1. map route/component imports and public links;
2. identify data and analytics owners;
3. check compatibility redirects and saved URLs;
4. record a rollback path;
5. confirm legal/privacy implications for safety, profile, and evidence data;
6. update the test matrix and release evidence.

## No-design zone

Until product scope is approved, do not spend visual-design or motion budget on:

- Forum, Marketplace, Quests, or Ultra;
- standalone Intelligence subviews;
- full Academic 360 polish beyond preserving current behavior;
- a duplicate Expert rating model;
- a separate Contract Check report;
- a second TrustGraph or Passport implementation.

## Reduction decision

The current codebase should be preserved as a working baseline, but the next design phase should only deepen the three pillars and their dependencies. The cleanest safe reduction is:

    KEEP        Trust, Community, Expert, Landing, Auth, Account, Dashboard, Cases pending IA decision
    CONSOLIDATE duplicate Trust/Community/Expert/Profile concepts
    POST_V1    Academic, safety, scholarships, scheduler, tuition
    REMOVE     Forum, Marketplace, Quests, Ultra from primary product IA

This recommendation supports a scope freeze without pretending that deferred features have no value or that live backend integration is complete.
