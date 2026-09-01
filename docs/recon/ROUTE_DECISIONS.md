# 01 — Corrected Route Inventory & Product Decisions

**Audit date:** 2026-09-01  
**Auditor:** Antigravity 3.7 Flash High; Luna Max evidence review  
**Claim discipline:** The route file inventory is `VERIFIED`. Product classifications are frozen decisions recorded in `docs/product/ROUTE_MAP.md`. Runtime redirects are not implemented by this phase.

## Inventory correction

The previous reconnaissance counted 47 routes and contained duplicate entries. A direct enumeration of page files under `frontend/src/app` yields **39 unique page routes**. Every route is listed once below. There are no UNKNOWN inventory rows.

## Disposition totals

| Disposition | Count | Meaning |
| --- | ---: | --- |
| KEEP | 13 | Retained canonical product/platform route |
| MERGE_INTO | 13 | Compatibility route whose product job belongs to the named canonical route |
| REMOVE | 4 | Removed from product IA after a separate migration/removal gate |
| POST_V1 | 9 | Deferred feature, not a current core promise or primary navigation item |
| **Total** | **39** | Complete current route accounting |

## Complete route inventory

| Route | Current source/purpose | Pillar | Decision | Migration behavior |
| --- | --- | --- | --- | --- |
| `/` | Public landing and product entry | Platform | KEEP | Canonical public entry |
| `/trust` | Multimodal Trust investigation | Trust P0 | KEEP | Canonical flagship |
| `/community` | Student observation/provenance surface | Community P1 | KEEP | Canonical community |
| `/expert` | Scoped expert discovery/evaluation | Expert P1 | KEEP | Canonical expert |
| `/cases` | Competition Evidence Case Lab | Trust support | KEEP | Retain as explicitly demo-labelled lab; not live Passport authority |
| `/dashboard` | Personal command center and case list | Platform | KEEP | Canonical personal hub |
| `/profile` | Own profile and Passport-facing identity | Platform/Trust support | KEEP | Canonical account/profile surface |
| `/settings` | Account preferences | Platform | KEEP | Canonical settings |
| `/settings/privacy` | Privacy and retention controls | Platform/Trust support | KEEP | Nested settings destination |
| `/login` | Sign-in and OTP boundary | Platform | KEEP | Canonical auth entry |
| `/register` | Registration | Platform | KEEP | Canonical auth entry |
| `/callback` | OAuth callback boundary | Platform | KEEP | Non-navigation protocol route |
| `/onboarding` | First-run profile setup | Platform | KEEP | Canonical first-run boundary |
| `/ai` | Generic AI mentor/chat compatibility page | Trust | MERGE_INTO:`/trust` | Preserve a temporary redirect to Trust; never present as an ungrounded chat product |
| `/academic/profile` | Academic transcript/degree audit | Platform/Academic dependency | MERGE_INTO:`/profile` | Preserve an explicit compatibility redirect or query view; academic data remains deferred |
| `/contract-check` | Contract analyzer entry | Trust | MERGE_INTO:`/trust` | Redirect to Trust input with source context; do not create a second analyzer domain |
| `/intelligence` | Intelligence umbrella | Trust / Community / Expert | MERGE_INTO:`/trust` | Redirect to Trust as the flagship default; pillar links live in canonical nav |
| `/intelligence/ai-trust` | AI trust/telemetry view | Trust | MERGE_INTO:`/trust` | Redirect to Trust evidence/depth context |
| `/intelligence/community` | Community intelligence lens | Community | MERGE_INTO:`/community` | Redirect to Community |
| `/intelligence/evidence` | Raw evidence lens | Trust | MERGE_INTO:`/trust` | Redirect to Trust evidence context |
| `/intelligence/experts` | Expert graph/lens | Expert | MERGE_INTO:`/expert` | Redirect to Expert |
| `/intelligence/knowledge` | Knowledge fusion view | Trust | MERGE_INTO:`/trust` | Redirect to Trust graph/evidence context |
| `/intelligence/trust` | Trust graph/subview | Trust | MERGE_INTO:`/trust` | Redirect to Trust graph context |
| `/prof-rating` | Professor rating registry | Expert-adjacent | MERGE_INTO:`/expert` | Redirect only to scoped Expert discovery; ratings are not migrated as authority |
| `/profile/[id]` | Public profile detail | Platform/Trust support | MERGE_INTO:`/profile` | Resolve through the canonical public-profile/Passport view; preserve identity parameter |
| `/scam-check` | Legacy scam-check entry | Trust | MERGE_INTO:`/trust` | Redirect to Trust input; no duplicate verdict path |
| `/forum` | Legacy social forum with engagement model | Community-adjacent | REMOVE | During migration show a clear redirect to Community if safe; after the removal gate return the chosen 404/410 response |
| `/marketplace` | Marketplace | None / sprawl | REMOVE | No canonical replacement; temporary home redirect may be used during migration, then 404/410 |
| `/quests` | Gamification/quests | None / sprawl | REMOVE | No canonical replacement; temporary Dashboard redirect may be used during migration, then 404/410 |
| `/ultra` | Internal visual showcase | None / internal | REMOVE | Do not expose in product IA; internal-only access or 404/410 after removal gate |
| `/academic` | Academic 360 workspace | Academic | POST_V1 | Hide from current nav; retain only while compatibility and data ownership are reviewed |
| `/academic/execution` | Course execution workflow | Academic | POST_V1 | Hide from current nav; route availability is feature-gated until released |
| `/academic/planner` | What-if course planner | Academic | POST_V1 | Hide from current nav; route availability is feature-gated until released |
| `/academic/roadmap` | Graduation roadmap | Academic | POST_V1 | Hide from current nav; route availability is feature-gated until released |
| `/credit-scheduler` | Credit/timetable scheduler | Academic | POST_V1 | Preserve existing compatibility behavior; no current navigation |
| `/safety-map` | Physical safety map | Safety | POST_V1 | Hide from current nav; requires operational/legal and location-data review |
| `/scholarships` | Scholarship registry | Academic/Financial | POST_V1 | Hide from current nav; requires source freshness and eligibility contract |
| `/sos` | Emergency/SOS surface | Safety | POST_V1 | Hide from current nav; requires operational ownership and crisis-safety review |
| `/tuition-radar` | Tuition/fee radar | Academic/Financial | POST_V1 | Preserve existing compatibility behavior; no current navigation |

## Decision notes

- `MERGE_INTO` is a product ownership decision, not an instruction to implement redirects during F00/F01.
- `/cases` stays as a supporting route because its deterministic demo superflows are useful for contract testing and product review. It must remain labelled `DEMO FIXTURE` and must not be presented as live evidence.
- `/dashboard`, `/profile`, and `/settings` are supporting platform routes. They are retained but do not count as additional core pillars.
- `/forum` is not merged as a social model. If a temporary redirect is used, it is a migration bridge to the observation-based Community surface and must not carry likes, ratings, or unscoped claims into the new domain.
- Removing a page or handler requires source-reference search, redirect/removal tests, privacy/data review, release notes, and a rollback path. No route is deleted in this freeze.

## Evidence boundary

Verified source facts do not prove production API availability. The current canonical Community and Expert views use seeded/demo data and typed seams; live backend, RLS, provider credentials, and production redirect behavior remain `BLOCKED_BY_ENV` or `NOT_EXECUTED` as recorded in `docs/recon/EVIDENCE-CLEANUP.md`.
