# StudentHub AI — Full Product Reality Audit

Date: 2026-09-17 (Asia/Bangkok)  
Target: https://student-hub-ai-topaz.vercel.app  
Deployment: dpl_HGwSuLGPEUHCFbsvqdaKJxNL5gFd  
Commit reported by production: 3721964894c7de99d5419e968858980692883116  
Verdict: **STUDENTHUB_FULL_PRODUCT_AUDIT_BLOCKED**

## Executive result

The deployment is reachable and the public shell renders, but this is not a
full-product verification. The required authenticated QA_USER/QA_EXPERT
identities, verified student mailbox, expert provisioning path, authenticated
browser state, and production-safe video evidence were not available. More
importantly, the public /api/v1/community endpoint currently exposes seeded
POST_TOEIC_* community evidence while the durable community projection is
empty. Tasks and notifications are routed through process-local file stores,
not the durable public.notifications table. These are release-blocking
reality/persistence findings.

No production code was patched and no production QA account or production
record was created. The only writes performed by the audit were against the
explicit local disposable Supabase target and were cleaned up by the supplied
harnesses.

## Verification matrix

| Area | Evidence | Result |
|---|---|---|
| Deployment identity | /api/health/live returned 200 and the expected SHA/deployment ID | PASS |
| Platform readiness | /api/health/ready returned READY; runtime, database, and durable session were AVAILABLE | PASS, not sufficient for product verification |
| Capability readiness | Overall PARTIAL; experts PARTIAL; live providers configured but optional; 3 Gemini models advertised | PARTIAL |
| Public desktop shell | /login, /register, /trust, /community, /expert, /profile all returned 200 | PASS for shell only |
| Public mobile shell | 390×844 captures for all six routes; document scroll width stayed 390 | PARTIAL: clipped off-viewport child content on Community/Trust |
| Anonymous boundary | Session, profile, student identity, qualification, and notifications returned 401 | PASS |
| QA_USER / QA_EXPERT | No credentials, mailbox, Playwright storage state, or approved expert provisioning evidence | BLOCKED |
| Two-user authorization | Two independent browser contexts were created, but both were anonymous with zero cookies | BLOCKED |
| Student profile/email flow | No real sign-in, OTP/mailbox verification, profile mutation, or cross-user read was run | BLOCKED |
| Trust V5 | Anonymous production request returned trust.v5, HTTP 200, but pipeline PARTIAL and persistence.persisted=false | PARTIAL; authenticated persistence unverified |
| Community authenticity | Durable community APIs returned zero posts, while /api/v1/community returned four seeded first-hand reports | FAIL / release blocker |
| Expert directory | Production /api/expert/graph and /api/v1/experts returned zero experts; health reported expert capability PARTIAL | BLOCKED |
| Qualification/quiz/assessment | Static contracts and migrations exist; no real expert identity or supervised qualification run | BLOCKED |
| Notifications/tasks | API routes use .data file-backed stores; no production cross-instance/restart proof | FAIL / release blocker |
| Local PostgreSQL/RLS | Supplied disposable harness: 10/10 tests passed | PASS, local disposable only |
| Local private screenshot storage | Upload, owner read, non-owner denial, anonymous denial, metadata insert: 5/5 passed | PASS, local disposable only |
| Accessibility | Trust/Expert/Profile had no Axe violations; Community had 12 serious contrast nodes; Login/Register had landmark violations | PARTIAL |
| Video evidence | No videos recorded because authenticated QA flows were not safely executable | BLOCKED |

## Production HTTP/API evidence

Anonymous read-only probes observed:

- /api/health/live: 200, LIVE.
- /api/health/ready: 200, platform READY; capability readiness PARTIAL.
- /api/auth/session: 401 with authenticated:false.
- /api/users/profile, /api/student/identity, /api/expert/qualification,
  /api/academic/notifications, /api/v1/notifications: 401.
- /api/expert/graph: 200 with sourceState DURABLE_POSTGRES and totalExperts:0.
- /api/intelligence/experts and /api/v1/experts: 200 with durable source and total:0.
- /api/intelligence/community/posts and /api/community/social: 200 with zero durable posts.
- /api/intelligence/health: 200 but state:UNAVAILABLE and
  LIVE_METRICS_NOT_CONFIGURED.

The anonymous V5 probe used a harmless audit fixture and did not request
streaming. It returned:

~~~
HTTP 200
contractVersion: trust.v5
pipelineStatus: PARTIAL
persistence.persisted: false  (expected for anonymous execution)
l1: COMPLETED / LOCAL_DETERMINISTIC
l2a: COMPLETED / NOT_APPLICABLE
l2b: PARTIAL / RATE_LIMITED
l2c: COMPLETED / BASELINE_RULE_MODEL
l3: COMPLETED / SUCCESS
l4: PARTIAL / COOLDOWN
l5: COMPLETED / NOT_CONFIGURED
~~~

Negative production input checks returned typed 422 responses:

- empty content → CONTENT_REQUIRED;
- unsupported input type → UNSUPPORTED_INPUT_TYPE.

This proves the public boundary and fail-closed validation, not authenticated
Trust persistence or a healthy live provider chain.

## Critical finding: seeded Community evidence is exposed in production

GET /api/v1/community is anonymous and returned a STRONG_COMMUNITY_SIGNAL
claim based on four POST_TOEIC_* records, four independent provenance
clusters, and a seven-day median. The same deployment's durable community
projection returned zero posts.

The source path is direct: the route calls CommunityQueryEngine, which calls
CommunityStore; CommunityStore seeds POST_TOEIC_01, POST_TOEIC_02,
POST_TOEIC_03, and POST_TOEIC_EDGE when its local store is empty. The route
does not gate this path behind an explicit demo adapter. This violates the
audit requirement that production never present fixture/seed data as real
student experience evidence.

Relevant source:

- [community route](../../frontend/src/app/api/v1/community/route.js:2)
- [community query engine](../../frontend/src/lib/intelligence/community/communityQueryEngine.js:27)
- [seeded community store](../../frontend/src/lib/intelligence/community/communityStore.js:69)

Classification: **P0 — production evidence authenticity / release blocker**.

## Critical finding: task and notification persistence is not production-durable

The authenticated notification routes import AcademicNotificationStore,
which persists to .data/academic_notifications_store.json using local
filesystem reads and writes. The academic task route imports AcademicTaskStore,
which uses .data/academic_workflow_store.json. The database migration does
define public.notifications with RLS, but the user-facing notification routes
do not use a Postgres notification repository.

This cannot prove cross-device, cross-instance, or restart durability for the
deployed server. The local focused tests pass when isolated; a batched focused
run produced one [AcademicNotificationStore] Disk flush failed rehydration
failure, while an isolated rerun passed. That is additional test-isolation
noise, not evidence of production durability.

Relevant source:

- [notification API](../../frontend/src/app/api/v1/notifications/route.js:2)
- [notification file store](../../frontend/src/lib/intelligence/academic/academicNotificationStore.js:18)
- [task API](../../frontend/src/app/api/academic/tasks/[taskId]/route.js:7)
- [task file store](../../frontend/src/lib/intelligence/academic/academicTaskStore.js:16)
- [notifications migration](../../database/migrations/202608290001_feature_freeze_cross_system.sql:83)

Classification: **P0 — required student workflow durability / release blocker**.

## Auth, profile, institutional email, and role evidence

The code contract is directionally sound: server-owned profile/session state,
authenticated institutional-email checks, owner-scoped identity access, and
server-owned expert qualification/RLS are present. The disposable RLS proof
also passed the negative role/ownership checks.

The live product flow remains unverified because no controlled QA identities
or mailbox were supplied. A read-only snapshot of the configured Postgres
target showed 12 Auth users/profiles and only active STUDENT role rows; it
showed zero expert profiles, expert applications, active expert applications,
and assessments. Exact QA_USER/QA_EXPERT/studenthub-qa email patterns were
absent. These counts are not a substitute for a production identity proof.

Not run:

- email/password registration and OTP confirmation;
- student email/domain verification using a real mailbox;
- profile write and read-after-refresh;
- User A/User B cross-user denial;
- expert qualification application, quiz, supervised practice review, and
  admin activation;
- expert assignment, assessment, review, appeal, reputation, and notification
  propagation;
- authenticated Trust V5 persistence and restart read-back.

## Local disposable evidence

The project's safety-gated local harness was run only with the explicit
disposable acknowledgement and loopback database:

- PostgreSQL/RLS: 10 passed, 0 failed. Covered anonymous denial, owner
  isolation, server-only role/reputation/expert verification, qualification
  ownership, Trust append-only revisions, private reports, private review
  requests, realtime logs, and durable session writes.
- Private storage: 5 passed, including owner upload/download,
  non-owner denial, anonymous denial, and server metadata insertion.
- Focused auth/expert/Trust/Promax contracts: 40 passed, 1 expected live-gate
  skip; one notification E2E failed only in the batched run and passed when
  rerun alone.

These results validate local contracts and RLS mechanics only. They do not
promote the production deployment to verified status.

## Browser and visual evidence

Browser automation used Playwright because agent-browser was not installed and
npx --no-install agent-browser could not resolve the package. No credential,
cookie, token, or storage state was used.

Desktop captures (1440×900):

- [login](../../docs/reports/final-audit-screenshots-2026-09-17/login.png)
- [register](../../docs/reports/final-audit-screenshots-2026-09-17/register.png)
- [trust](../../docs/reports/final-audit-screenshots-2026-09-17/trust.png)
- [community](../../docs/reports/final-audit-screenshots-2026-09-17/community.png)
- [expert](../../docs/reports/final-audit-screenshots-2026-09-17/expert.png)
- [profile](../../docs/reports/final-audit-screenshots-2026-09-17/profile.png)

Mobile captures (390×844): matching mobile-*.png files are in the same
directory. Community has content positioned beyond the mobile viewport in the
legend/action surfaces; Trust has a status rail extending beyond the viewport.
The document scroll width is clamped, so the failure presents as clipped
content rather than a body-level horizontal scrollbar.

VIDEO_COUNT=0. No video was fabricated for an unauthenticated shell or for an
unexecuted QA flow.

## Release-blocking conditions to close

1. Provision disposable, named QA_USER and QA_EXPERT identities with verified
   mailboxes, plus the server-only reviewer/admin context. Store storage state
   outside Git and do not paste credentials, tokens, or cookies into evidence.
2. Remove production Community fixture exposure and make the public route read
   only the durable redacted projection, or explicitly return unavailable when
   no durable observations exist.
3. Replace the file-backed task/notification runtime path with a durable
   owner-scoped repository and prove restart, cross-instance, and cross-device
   read-after-write behavior.
4. Execute authenticated Trust V5 with persistence.persisted:true, capture
   the returned case/run IDs, restart/read them back, and prove User B cannot
   access User A's records.
5. Complete the expert qualification → quiz → supervised practice → admin
   activation → assignment → formal assessment → review/appeal/reputation /
   notification chain with two isolated browser contexts.
6. Re-run the mobile visual/accessibility pass after the clipped Community and
   Trust surfaces are corrected, and record both QA videos.

## Final verdict

**STUDENTHUB_FULL_PRODUCT_AUDIT_BLOCKED**

The shell, public boundaries, local RLS/storage contracts, and typed negative
validation are evidenced. The complete product is not verified because the
required real-user flows cannot be executed and production currently exposes
fixture Community evidence plus non-durable task/notification paths.

