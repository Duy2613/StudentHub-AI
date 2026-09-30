# Expert V4 Deferred Assurance Register

**Current verdict:** `EXPERT_V4_ASSURANCE_VERDICT = DEFERRED`  
**Blocker:** `EXPERT_V4_FINAL_ASSURANCE = BLOCKED_BY_DB_FIXTURE_ENV`  
**Project boundary:** staging only, project ref `bniwtkjtramqaozrrtrk`; no Main access, no migration application, no DB writes, and no write-capable tests in implementation mode.

Staging read-only discovery previously confirmed a healthy connection but found the required request schema absent and the expected eight static test identities missing. This register describes a future isolated assurance run; it does not authorize or execute one. The local preflight intentionally fails closed until identity, schema and fixtures are available.

| Deferred gate | Reason | Required environment | Required fixture | Future test command | Expected evidence |
|---|---|---|---|---|---|
| Migration/schema readiness | Staging lacks `private.expert_review_requests`; local migration files are not live-schema evidence | Approved StudentHub staging only; verified ref matches API URL; migrations applied by environment owner | None | Read-only preflight: `node --env-file=.env.staging.local --import=./tests/expert/staging_db_preflight.mjs --test ./tests/db/expert_qualification_migration_contract.test.mjs` | Redacted project identity, migration ledger, `to_regclass` readiness and schema snapshot; no secrets |
| Expert request persistence + owner isolation | Requires writes and readback; cannot run against Main; stage fixture principals absent | Same isolated staging project with service-role test harness | Eight approved synthetic principals and owner Trust cases | Run the guarded Expert request suite only after the preflight’s fixture/schema assertions pass | Created row/readback, status/event lineage, owner-only list, unauthorized `401/403`, duplicate request conflict |
| Request idempotency | Requires competing writes and digest readback | Same | Same requester + stable request payload and conflicting replay payload | Guarded request idempotency suite; no implicit `DATABASE_URL` fallback | Same key/same payload returns original result; same key/different payload rejects; one durable row |
| Assignment and identity integrity | Coordinator write and reviewer-bound readback required | Same | Coordinator, verified Expert, current case revision | Guarded assignment suite | Assigned `expert_id`, `case_id`, revision, status, expiry and actor read back; unauthorized assignment blocked |
| `ORPHAN_CASE_CHECK` | Requires full durable origin/linkage comparison | Same, read-only after migrations and test cleanup | Community-origin records plus controlled synthetic request lineage | `node --env-file=.env.staging.local --import=./tests/expert/staging_db_preflight.mjs --test ./tests/community_expert/phase8_live_gate.test.mjs` after approved isolated fixtures | Zero unexplained Community-origin Trust cases; query text, scope and row counts recorded |
| `SCOPE_CONFLICT_CHECK` | COI and scope decisions need assignment/review persistence readback | Same | In-scope, out-of-scope, declared conflict and no-conflict cases | Guarded scope/conflict suite | No out-of-domain or conflicted binding review; auditable COI state; rejected rows absent |
| Assessment submission + immutable review | Submission, locks, idempotency and readback require writes | Same | Assigned Expert, case/claim/evidence revision IDs, no-conflict declaration | Guarded Expert assessment suite | Reviewer identity, exact case/evidence revisions, authority snapshot, submitted state and immutable row read back |
| Review idempotency/versioning | Assessment duplicate/race attempts require concurrent writes; no review version field is currently established | Same | Same assignment with parallel same-key and conflicting-key submissions | Guarded idempotency/concurrency suites; review-version test remains blocked until a domain version contract exists | Exactly one immutable assessment for accepted key; conflicting content rejected; no claim of review-version coverage |
| Trust revision staleness | Needs a real Trust revision mutation and subsequent Expert submit attempt | Same | Case at revision N, then controlled revision N+1 | Guarded Trust-staleness suite | Old assignment/request/assessment attempt rejects after revision change; no stale assessment row |
| Evidence revision staleness | Needs controlled evidence revision replacement | Same | Case and selected evidence at known revision, then changed evidence | Guarded evidence-lineage suite | Assessment references exactly the reviewed revision set; changed/missing reference rejected |
| RLS / privacy / authorization | Requires DB policies and session-bound identities | Same | Owner, assigned Expert, unrelated user, anonymous session; public/private case rows | Guarded Expert authorization/privacy suite | Row visibility matrix, no private case/evidence leakage, no unauthorized writes |
| Realtime reconnect/convergence | Requires committed events, reconnect/replay and multiple sessions | Same, durable realtime configured | Request/assignment/review plus Trust update and case-close/reassignment events | Guarded realtime suite and browser reconnect scenario | Ordered cursor replay, duplicate idempotence, account switch clears private events, two-session canonical refetch/convergence |
| Cleanup/readback | Every synthetic write must be removed and absence proved | Same; never Main | All synthetic IDs emitted by the suite | Suite `finally` cleanup plus exact-ID readback query | Zero remaining rows across cases, requests, assignments, assessments, event/outbox rows and dependent fixtures; cleanup failures block assurance |
| Credential lifecycle / identity freshness | Requires state changes and readback; durable public DTO currently omits expiry/revocation timestamps | Same | Approved test Expert with verified/expired/revoked transitions | Guarded lifecycle suite after public DTO contract is implemented | Status/revision snapshots match source rows; public projection contains only approved fields |
| Community and Trust regressions | Current Community is already PARTIAL; final gates include manual and live convergence evidence | Isolated staging plus browser test environment | Normal Community, Trust optional, Expert request, completed-review projection | Community V4.2 and Trust regression suites after their own safe fixtures exist | Community remains `PARTIAL` until all prior closure gates pass; Expert cannot upgrade it |

## Guarded execution requirements

1. Never run with Main `DATABASE_URL`, even read-only in this implementation continuation.
2. Do not use `.env.local` as an implicit staging alias. Explicit project URL/ref and DB pooler identity must agree.
3. Do not set the synthetic-write acknowledgement until an isolated staging test run is separately approved and every preflight requirement passes.
4. A missing table, principal, fixture, or cleanup readback is a blocker; do not create fixtures just to make the suite green in this implementation phase.
5. Final assurance remains `DEFERRED` until the full Production Assurance Runbook evidence is collected and reviewed.

## Unchanged incident boundary

Prior accidental Main tests and uncertain cleanup remain a separate historical issue. This implementation run made no Main query or mutation and did not attempt cleanup. Preserve `MAIN_RESIDUE_OWNER_CONFIRMATION_REQUIRED` until an authorized owner handles that incident; this register does not change its status.

## Non-DB evidence collected in implementation mode — 2026-09-27

`EXPERT_V4_IMPLEMENTATION_VERDICT = PARTIAL` · `EXPERT_V4_ASSURANCE_VERDICT = DEFERRED` · `COMMUNITY_V4_2 = PARTIAL_ASSURANCE_DEFERRED`. These statuses do not permit release or automatic Trust V4 work.

- Isolated Playwright: 2 scenarios passed. Browser fixtures intercepted every same-origin API read, blocked every non-GET/HEAD request and external origin, and reported zero attempted writes, unexpected API reads, or uncaught page errors. The generated screenshots are development-fixture evidence, not staging or production data.
- Responsive evidence: 64 Expert screenshots plus 15 Community/request-sheet screenshots across 360, 390, 768, 1024, 1280, 1440, and 1920 px; zero serious/critical Axe findings in inspected feature scopes; 390 px text-spacing reflow has no horizontal overflow; reduced motion and mobile focus restoration were checked.
- Contracts/guards: 12/12 targeted tests passed. Production build passed demo gate, compilation, type checking, and static generation (142 pages). Full lint exited 0 with 0 errors and 557 repository warnings.
- Full discovered hermetic test run remains incomplete because an unrelated visual registry test fails on the missing `artifacts/visual/STUDENTHUB_KHAI_MINH_ASSET_INVENTORY_2026-09-10.json`. Do not treat this as a passing full suite; the missing artifact was not fabricated. No DB-write test ran.
- A one-sample optimized local build probe measured directory usable-content at 382 ms / 378,626 encoded JS bytes and queue at 370 ms / 370,842 encoded JS bytes; opening the case pane took 39 ms. The production profile route loaded 367,728 encoded JS bytes but rejected the development DTO fixture by design, so no real profile-render time was obtained. No direct hydration metric or repeated benchmark was collected. See `performance-production.json`; these fixture results do not satisfy production performance assurance.

Artifacts: `artifacts/visual/EXPERT_V4/2026-09-27/manifest.json`, `community-expert-roundtrip.json`, `expert-v4-a11y-and-responsive.json`, and `performance-production.json`. These do not discharge any deferred gate in the table. `EXPERT_V4_ASSURANCE_VERDICT` remains `DEFERRED`; Community remains `PARTIAL_ASSURANCE_DEFERRED`.

## Expert V4.1 non-database implementation closure — superseding update — 2026-09-27

The later [Expert V4.1 Non-DB Implementation Closure](EXPERT_V4_1_NON_DB_IMPLEMENTATION_CLOSURE_2026-09-27.md) supersedes the earlier `PARTIAL` non-database implementation result above. Current implementation status is **`EXPERT_V4_IMPLEMENTATION_VERDICT = PASS`**. Assurance remains **`EXPERT_V4_ASSURANCE_VERDICT = DEFERRED`** and Community remains **`COMMUNITY_V4_2 = PARTIAL_ASSURANCE_DEFERRED`**.

The final scoped command passed 35 static checks, the five-repeat-per-surface optimized production performance test, and all four isolated browser scenarios. It verified the production fixture rejection boundary, keyboard interactions and focus behavior, Chromium accessibility tree, zero Axe findings, and six-surface 200% zoom-equivalent/text-spacing reflow. Build/type checking passed with 142 static pages; full lint exited 0 with 557 repository warnings. Machine-readable evidence: `expert-v4-performance-lab.json`, `expert-v4-accessibility-audit.json`, and `expert-v4-zoom-reflow.json` under `artifacts/visual/EXPERT_V4/2026-09-27/`.

No staging state was re-queried. No database credentials were used, and no database read/write, migration, DB-backed test, Trust V4 work, or Community closure action was performed in this implementation pass. The historical staging observations and required assurance gates above remain recorded as historical context; they were not reconfirmed by this closure.
