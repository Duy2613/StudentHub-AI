# Community V4 Domain Gap Log

**Status:** C0 gaps were re-evaluated after the local Community V4 implementation. “Implemented locally” means code/schema artifacts are present; it does not imply a migration was applied or a live database flow passed. An absent contract is not represented as a working UI feature.

## Current disposition — 2026-09-26

| ID | Current status | Evidence / gate |
|---|---|---|
| G-01 | IMPLEMENTED_LOCAL | Feed, detail, filters, and search use canonical Community endpoints with durable error states; no silent legacy fallback. |
| G-02 | IMPLEMENTED_LOCAL | Contribution creation authorizes the Trust case owner while publishing only the separately scanned and confirmed public statement. Live authorization/readback is unverified. |
| G-03 | IMPLEMENTED_LOCAL | Feed DTO compares the latest Trust case revision and last successful Trust run start against the newest published Community contribution update for that case; incomplete/missing Trust run remains UNKNOWN. |
| G-04 | IMPLEMENTED_LOCAL_WITH_MATCH_LIMITATION | Owner explicitly requests adjudication for a linked Community contribution; server matches verified experts in the exact requested domain, otherwise the request remains REQUESTED. No public Expert verdict projection was added. |
| G-05 | IMPLEMENTED_LOCAL_DB_PENDING | Nested comments/replies, PII scan, idempotency, bounded depth, anonymous read projection, and service-only SQL are implemented. Migration 20260926111838_community_nested_comments.sql is not applied. |
| G-06 | IMPLEMENTED_LOCAL | “Báo nội dung” writes the canonical REPORT_ABUSE reaction. No ordinary-user moderation control is shown; staff moderation remains outside the existing authorization contract. |
| G-07 | BLOCKER — MEDIA DERIVATIVE PIPELINE | Composer clearly states media upload is unavailable. Trust intake keeps originals private; Community preview reports originalStored=false and publicDerivative=null. No verified derivative delivery path exists. |
| G-08 | BLOCKER — SPACES CONTRACT | Filters/search use canonical contribution types and states. No durable Community Space membership or query contract exists, so no group/Space controls are presented as functional. |
| G-09 | IMPLEMENTED_LOCAL_DB_PENDING | Community events are metadata-only and public; Trust/Expert events are subject-scoped. Client event-ID dedupe, ordered durable replay, cursor reconnect, and canonical refetch are wired. Live replay/multi-tab/session convergence is unverified without a configured DB. |
| G-10 | IMPLEMENTED_LOCAL | Post/detail render only persisted contribution, case revision, freshness, reaction, and request-status fields; no verdict is inferred from attachments. |
| G-11 | P0 FRESHNESS PASS — SCOPED | Focused freshness suite passed 116/116; production build passed. The historical root suite still stops at the intentionally preserved missing visual-registry manifest, so this is not a whole-repository green claim. |
| G-12 | BLOCKER — ORPHAN_CASE_CHECK | No approved/disposable database target was identified in this run. Static code cannot establish whether historical Community-origin Trust cases are unexplained orphans. Do not claim PASS. |

Community V4 is not release-cleared while G-05, G-07, G-08, G-09, or G-12 remain open. Seven-screen visual review is a separate prerequisite to locking the Community UI.

| ID | Severity | Gap | Root evidence | Planned closure / safe boundary | Acceptance evidence |
|---|---|---|---|---|---|
| G-01 | P0 | Active feed and detail use legacy public.posts and silent fallback; Trust-bound Promax contributions are unused | CommunitySocialWorkspace, CommunityDetailWorkspace, /api/community/social, /api/forum/posts | Switch to canonical /api/intelligence/community/posts; retain durable error state and do not swap stores silently | API contract tests; one canonical post DTO for feed/detail |
| G-02 | P0 | Owner cannot publish Community contribution from a new private Trust case | Trust cases default PRIVATE; createContribution requires publicOnly: true; no case-share API | Allow authenticated owner to publish a separately privacy-scanned Community statement against their own private Trust case; keep Trust case private and its raw content private | Scope/privacy tests; private case absent from public Trust detail; only public statement returned in Community |
| G-03 | P1 | Community feed does not reveal stale Trust revision or Community changes after Trust run | Case write checks current revision, but feed DTO omits current revision / run timestamp / signal update watermark | Add derived freshness metadata; compare contribution/reaction update watermark with Trust run completion; never mutate Trust verdict | Cases for current revision, changed case, and Community-after-run |
| G-04 | P1 | Expert request lifecycle is disconnected from Community; no safe public Expert reply projection | Owner-scoped expert-review-requests exists; feed does not call it; expertResponse absent from DTO | Add an explicit author action tied to case/revision/claim and display only owner-visible request status. Render public assessment only if an existing persisted projection explicitly permits it | Authorization/privacy tests; no private text in public feed; orphan check |
| G-05 | P1 | Canonical contributions have no comment/reply contract; legacy comments are flat | public.comments has no parent_comment_id; Promax table has no comments | Add case-bound, contribution-bound nested comments with bounded depth, owner/session auth, PII scan, idempotency, and public-derivative-only reads | SQL/API contract tests; thread UI read/write; private parent rejected |
| G-06 | P1 | “Report”/moderation UI does not match backend behavior | Active callback only shows notice; repository supports REPORT_ABUSE, not a moderation decision endpoint | Ship report action via canonical reaction; do not expose staff hide/remove controls absent an authorized moderation contract | A report is stored once; ordinary user cannot change publication state |
| G-07 | P1 | Composer cannot attach a safe Community media object | Private file table exists without a Community upload/derivative route | Keep URL/source attachments explicit and labeled; no file-upload success state until a server path returns a safe derivative | UI has no fake upload; media posts are actual canonical references or preview-only fixtures |
| G-08 | P2 | Topic “Spaces” in legacy UI do not exist in canonical contribution DTO | Durable contribution stores contribution type and Trust scope, not old five categories | Use filters derived from real contribution types/review/evidence states; do not claim group membership or invent campus-topic assignment | Query/filter tests against canonical DTO |
| G-09 | P1 | Realtime provider ignores Community, Trust, and Expert event types; duplicate IDs redispatch | RealtimeContext registers only system and audit listeners; rememberEvent dispatches every duplicate | Parse authorized domain events, dedupe by event ID, expose connection/replay state, refetch canonical state on committed event; per-entity revision checks reject stale responses | duplicate/out-of-order/reconnect/replay/multi-tab/session contract tests |
| G-10 | P1 | Trust / Expert status copy in post detail is derived from attachment count or optional fields | Fixed badges and optional expertResponse without source DTO | Display only server-returned case/revision/evidence/review states; unknown remains unknown | DTO/UI contracts reject inferred verdicts |
| G-11 | P1 | Current P0 root suite has known historical visual-registry missing-file failure | tmp/p0-remediation-root-test-final2.log | Preserve deleted artifact and document exact unrelated failure; do not restore or stage it | Re-run scoped P0 plus Community gates; report full-suite limitation |

## Phase disposition

- G-01–G-10 block COMMUNITY_V4 = PASS until closed or recorded as a genuine external blocker.
- G-11 is closed for the scoped freshness gate; the historical missing visual-registry manifest still limits a whole-repository green verdict.
- No migration is considered applied until a disposable or approved database run proves it. Local SQL contract tests do not substitute for RLS/readback/live evidence.
