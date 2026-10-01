# Four-core repair implementation specification — 2026-10-01

Base main: 595a99110367aefb545b02dab4b9f9a5a6106ab6.
Reused release candidate: bb240430fbf1fe3996eecb3e8c0a6957150e7d23.
Working branch: codex/studenthub-four-core-repair-20261001.
Production ref: kytdomflmjytzyaabogi; staging ref: bniwtkjtramqaozrrtrk.
Production SQL reads confirm missing Community comments, question-bank and room tables. Staging has those relations.

| Trigger | Action | UI state | Boundary/error | Persistence/retry |
| --- | --- | --- | --- | --- |
| Search two core sources | Run independently; query before limit | Complete or explicitly partial results | Both fail: 503; one fails: keep healthy source and mark unavailable source | No write; repeat reads safely |
| Load owner activity | Read owner-scoped social, contribution, Trust and Expert data | Available, partial or unavailable per core/source | Unknown count is null, never inferred zero | Existing records remain unchanged |
| Open Profile Trust case | Canonical caseId/revision query | Saved result for authenticated owner | Wrong owner or absent revision denied | Read immutable saved snapshot |
| Open legacy student public-ID profile | Explicit unavailable public route | Public-profile unavailable page | No owner DTO returned for arbitrary ID | No read/write of another user's private profile |
| Login | Provider proof to canonical HttpOnly durable session | Authenticated only after exchange | Capture safe provider code; anonymous 401 is expected | Reload/refresh/logout/owner-isolation verification |
| Publish Community/comment/reaction | Validate case/revision/owner; durable commit | Saved only after commit | Missing schema is a dependency error; safe published DTO only | Idempotency, reread and second-client event |
| Expert mission/room operation | Enforce verified domain, server state/time, answer privacy | Existing contract states | Unauthorized domain denied; missing bank represented explicitly | Settlement idempotency and durable room events |
| Trust analysis | Canonical four-layer pipeline | Existing progress/outcome states | Early exit/N/A and dependency failure distinguished | EPHEMERAL versus PERSISTED versus UNAVAILABLE |
| Responsive render | Bound real overflowing element | Readable at 360/390px | Collect exact WebKit pageerror signatures | No hidden overflow workaround |
| Production rollout | Reviewed migration and candidate | Environment-specific acceptance | Existing session grants do not authorize an unapproved production migration/deploy | Concrete rehearsal, rollback, readback and post-deploy gate |

## Implementation order
1. Preserve other worktrees; use this candidate and existing local/staging environments.
2. Capture actual production/staging schema and deployment/auth identity.
3. Rehearse the tracked migration chain and forward repairs with real PostgreSQL.
4. Repair Profile projection/routes, search isolation and readiness capability checks.
5. Diagnose demo-auth failures; run owned/profile, Community, Expert, Trust and cross-core flows using isolated staging or local Supabase fixtures.
6. Fix browser failures at their source; complete regression/build/browser checks.
7. Commit source/spec/migration changes, bind final evidence to that SHA, and prepare production rollout for approval if no prior approval covers it.

Provider live campaign remains OFF/budget zero until prerequisites and authorization/budget are available. Missing external evidence is not a passing gate.

