# StudentHub AI — Frozen Route Matrix

**Phase:** Stages 00–24 continuous engineering program  
**Status:** `FULL_ENGINEERING_PROGRAM_COMPLETE_WITH_ENV_BLOCKERS`  
**Authority:** Luna Max  
**Date:** 2026-09-01  
**Route source:** `frontend/src/app` direct page-file enumeration

## Route accounting

There are **39 unique current page routes**. Every route appears exactly once in the matrix. Route disposition is a product/IA decision; compatibility redirects are implemented for the canonical aliases while source folders remain available for rollback/removal review.

| Disposition | Count |
| --- | ---: |
| `KEEP` | 13 |
| `MERGE_INTO:<route>` | 13 |
| `REMOVE` | 4 |
| `POST_V1` | 9 |
| **Total** | **39** |

**Final core pillar route count:** 3 (`/trust`, `/community`, `/expert`).  
**Final retained canonical product/platform route count:** 13 (`KEEP`, including landing, Case Lab, personal, and identity support).  
Merged, removed, and deferred routes do not increase the final canonical route count.

## Canonical route hierarchy

    /
    ├── trust                         Trust flagship / case owner
    ├── community                     P1 observation and corroboration
    ├── expert                        P1 scoped authority and escalation
    ├── cases                         Demo-only Evidence Case Lab
    ├── dashboard                     Personal case/briefing hub
    ├── profile                       Own/public profile and Passport-facing identity
    ├── settings                      Account preferences
    │   └── settings/privacy          Privacy and retention
    ├── login                         Authentication entry
    ├── register                      Registration entry
    ├── callback                      OAuth protocol boundary
    └── onboarding                    First-run identity boundary

No `/intelligence` umbrella is shown in the canonical hierarchy. Trust remains the first intelligence destination and the only P0 pillar route.

## Complete route matrix

| Route | Current purpose | Core pillar | User value | Dependency | Decision | Rationale | Redirect / removal behavior |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Public landing and product entry | Platform | Understand product and start safely | Static/landing assets | `KEEP` | Required discovery entry | Canonical public entry |
| `/trust` | URL, text, image, and multimodal Trust investigation | Trust P0 | Decide what to do before acting | Trust API, DemoProvider, OCR hint | `KEEP` | Flagship case lifecycle | Canonical flagship; no redirect |
| `/community` | Student observation feed and provenance context | Community P1 | See contextual peer evidence | Community store/API | `KEEP` | Required Trust corroboration branch | Canonical Community |
| `/expert` | Scoped expert directory and evaluation | Expert P1 | Request accountable domain review | Expert store/evaluation API | `KEEP` | Required Trust escalation branch | Canonical Expert |
| `/cases` | Competition Evidence Case Lab | Trust support | Inspect deterministic superflows/contracts | Local demo fixtures | `KEEP` | Useful review/test surface when explicitly labelled | Keep demo-only; never claim live Passport authority |
| `/dashboard` | Personal command center and case list | Platform/Trust support | Return to cases and actions | Session, dashboard API/fixtures | `KEEP` | Case history and personal entry point | Canonical personal hub |
| `/profile` | Own profile and Passport-facing identity | Platform/Trust support | Review identity and permitted history | Session/profile DTO | `KEEP` | Identity and privacy boundary | Canonical profile |
| `/settings` | Account preferences | Platform | Control account behavior | Session/local settings | `KEEP` | Required account surface | Canonical settings |
| `/settings/privacy` | Privacy and retention controls | Platform/Trust support | Control sensitive data handling | Session/local settings | `KEEP` | Required trust/privacy surface | Nested settings destination |
| `/login` | Sign-in and OTP boundary | Platform | Establish a session | Supabase/proxy auth | `KEEP` | Required access boundary | Canonical auth entry |
| `/register` | Registration | Platform | Create an account | Supabase/proxy auth | `KEEP` | Required access boundary | Canonical auth entry |
| `/callback` | OAuth callback handler | Platform | Complete external sign-in | Supabase auth callback | `KEEP` | Protocol route, not navigation | Keep non-navigation callback |
| `/onboarding` | First-run profile/university setup | Platform | Establish minimum context | Session/profile persistence | `KEEP` | Required first-run boundary | Canonical first-run flow |
| `/ai` | Generic AI mentor/chat studio | Trust | Legacy entry for questions | AI SDK/legacy state | `MERGE_INTO:/trust` | Ungrounded chat is not an independent product promise | Temporary `307` redirect to `/trust`; no generic chat semantics |
| `/academic/profile` | Transcript and degree-audit view | Academic dependency | Review academic record | Records store/fixtures | `MERGE_INTO:/profile` | Identity/Passport owns profile history; full Academic is deferred | `307` redirect to `/profile`; no second profile |
| `/contract-check` | Contract analyzer | Trust | Inspect a risky document | AI/document analysis | `MERGE_INTO:/trust` | Multimodal document input belongs to Trust | Temporary `307` redirect to `/trust`; source context is not trusted evidence |
| `/intelligence` | Intelligence umbrella overview | Trust / Community / Expert | Legacy overview entry | Fusion store/fixtures | `MERGE_INTO:/trust` | No competing umbrella; Trust is the flagship default | `307` redirect to `/trust`; canonical nav exposes the three pillars |
| `/intelligence/ai-trust` | AI trust/telemetry lens | Trust | Inspect Trust processing context | Trust/telemetry fixtures | `MERGE_INTO:/trust` | Trust depth belongs in the Trust case | `307` redirect to `/trust` |
| `/intelligence/community` | Community intelligence lens | Community | See community signals | Community store/fixtures | `MERGE_INTO:/community` | One Community owner | `307` redirect to `/community` |
| `/intelligence/evidence` | Raw evidence lens | Trust | Inspect technical evidence | Evidence store/Trust API | `MERGE_INTO:/trust` | Evidence is a Trust level, not a peer route | `307` redirect to `/trust` |
| `/intelligence/experts` | Expert graph/lens | Expert | Find domain authority | Expert store/fixtures | `MERGE_INTO:/expert` | One Expert owner | `307` redirect to `/expert` |
| `/intelligence/knowledge` | Knowledge fusion studio | Trust | Inspect linked knowledge objects | Knowledge/fusion store | `MERGE_INTO:/trust` | Knowledge is evidence navigation in Trust | `307` redirect to `/trust` |
| `/intelligence/trust` | Trust graph subview | Trust | Explore claims and sources | TrustGraph/evidence API | `MERGE_INTO:/trust` | TrustGraph is part of the case | `307` redirect to `/trust` |
| `/prof-rating` | Professor rating registry | Expert-adjacent | Legacy authority lookup | Memory registry/fixtures | `MERGE_INTO:/expert` | Only scoped, evidence-bound expertise survives | `307` redirect to `/expert`; ratings are not imported as authority |
| `/profile/[id]` | Public profile detail | Platform/Trust support | Inspect permitted contributor identity | Public profile DTO | `MERGE_INTO:/profile` | One profile/Passport owner | `307` redirect to `/profile?profileId=:id`; public DTO/authorization remains contract-gated |
| `/scam-check` | Legacy scam checker | Trust | Legacy investigation entry | Trust redirect/API | `MERGE_INTO:/trust` | Duplicate Trust entry | `307` redirect to `/trust`; no duplicate verdict |
| `/forum` | Legacy social forum | Community-adjacent | Legacy discussions | Postgres/memory/legacy UI | `REMOVE` | Social engagement model conflicts with observation semantics | `307` redirect to `/community` during migration; later 404/410 only after removal gate |
| `/marketplace` | Student marketplace | None / sprawl | Buy/sell prototype | Legacy marketplace state | `REMOVE` | Outside frozen product job | `307` redirect to `/community` during migration; later 404/410 |
| `/quests` | Gamification/quests | None / sprawl | Progress/engagement game | Legacy quest state | `REMOVE` | Vanity mechanics add scope without Trust value | `307` redirect to `/dashboard` during migration; later 404/410 |
| `/ultra` | Internal visual showcase | None / internal | Design experimentation | Local visual fixtures | `REMOVE` | Not an end-user product route | `307` redirect to `/cases`; 3D showcase is not part of product nav |
| `/academic` | Academic 360 workspace | Academic | Manage academic context | Academic engine/store | `POST_V1` | Valuable but not current pillar | Existing isolated route remains out of nav; no current Trust promise |
| `/academic/execution` | Semester course execution | Academic | Plan/execute enrollment | Workflow engine/store | `POST_V1` | Requires academic product scope | Existing isolated route remains out of nav |
| `/academic/planner` | What-if course planner | Academic | Simulate course choices | Planner engine/store | `POST_V1` | Requires academic product scope | Existing isolated route remains out of nav |
| `/academic/roadmap` | Graduation roadmap | Academic | Track milestones | Roadmap engine/store | `POST_V1` | Requires academic product scope | Existing isolated route remains out of nav |
| `/credit-scheduler` | Credit/timetable optimizer | Academic | Schedule courses | Timetable engine | `POST_V1` | Deferred academic dependency | `307` redirect to `/academic?view=planner`; no current nav |
| `/safety-map` | Physical/campus safety map | Safety | Find safety resources | Geospatial/operational data | `POST_V1` | Operational, location, and legal review required | Existing isolated route remains out of nav |
| `/scholarships` | Scholarship registry | Academic/financial | Find opportunities | Registry/source freshness | `POST_V1` | Eligibility and freshness contract required | Existing isolated route remains out of nav |
| `/sos` | Emergency/SOS surface | Safety | Reach emergency support | Operational contact data | `POST_V1` | Crisis safety and operational owner required | Existing isolated route remains out of nav |
| `/tuition-radar` | Tuition/fee radar | Academic/financial | Compare fee information | Source freshness/registry | `POST_V1` | Financial claims require a separate contract | `307` redirect to `/academic`; no current nav |

## Navigation ownership

The route matrix drives one navigation configuration. Compatibility and deferred routes may exist for inbound links, but they are not canonical navigation destinations. `/trust` is always the first intelligence destination and the primary cross-pillar return point.

## Removal gate

No `REMOVE` route is physically deleted by the continuous program. Compatibility redirects are implemented and tested; a later removal phase must still search source imports/links/tests/external references, choose and test final 404/410 behavior, review data/privacy/legal ownership, document release notes, and preserve rollback.

## Runtime verification

The local redirect matrix is covered by `frontend/tests/e2e/navigation.spec.ts` and `frontend/tests/e2e/ultra.spec.ts`. The canonical source file is `frontend/next.config.ts`; redirect behavior is local proof only and does not prove production CDN/deployment configuration.
