# StudentHub AI — Final Principal Remediation Report

Date: 2026-09-17  
Repository: `C:\Users\Duy\Projects\MyProj\StudentHub-AI`  
Production: `https://student-hub-ai-topaz.vercel.app`  
Supabase ref: `kytdomflmjytzyaabogi`

## Final verdict

`STUDENTHUB_FULL_PRODUCT_REMEDIATION_BLOCKED`

The local remediation work is implemented and passes its available build, lint, focused contract, privacy, accessibility, and browser checks. The full product gate cannot be verified because the required QA identities/mailbox, disposable PostgreSQL environment, authorized expert-provisioning path, and production deployment evidence were not available. Production was not changed; the live deployment still contains the audited Community fixture leak.

## Release identity

| Item | Result |
|---|---|
| Production SHA observed | `3721964894c7de99d5419e968858980692883116` |
| Current local HEAD | `3721964894c7de99d5419e968858980692883116` |
| Tested immutable candidate | `NOT_AVAILABLE` — remediation changes remain uncommitted in the working tree |
| Pushed SHA | `NOT_PUSHED` |
| Deployment | `NOT_DEPLOYED` |
| Production migration | `NOT_APPLIED` |
| Rollback | `NOT_APPLICABLE` — no deployment or production mutation was made |

## Remediation implemented locally

- Community query routes now use the durable Community repository in production mode. Legacy seeded posts are available only in explicit test/demo mode, and a regression test rejects `POST_TOEIC_*` fixture IDs when production mode is active.
- Added an additive PostgreSQL migration for academic workflow plans, tasks, task events, notification deduplication/status fields, owner/assignee scopes, indexes, grants, and RLS policies. The migration contains no `DROP`, `DELETE`, or `TRUNCATE` operation.
- Added server-side PostgreSQL repositories for academic tasks/events and notifications. Production academic task and notification routes select these repositories; file stores remain only on explicit non-production fallback paths.
- Removed server-page file-store bootstrapping from the academic roadmap/planner surfaces; the roadmap hydrates from the authenticated API.
- Added assigned-expert relationship authorization and changed the review desk to require a real assignment/case. The form now captures a formal multiline assessment, limitations, conflict declaration, confidence, case/revision data, and idempotency. It does not display sample claims or submit simulated evidence.
- Fixed the auth landmark/heading structure and narrow-layout wrapping for the Trust step rail and Community legend.
- Updated the stale model-router contract to the checked-in three-model active chain; this was a contract correction, not a weakening of runtime behavior.

The local Community durable query still lacks a live topic projection in its repository DTO, so topic-specific durable queries truthfully return no matching rows until that projection is connected. This is not counted as a completed production Community proof.

## Gate matrix

| Gate | Evidence / result | Status |
|---|---|---|
| Community fixture boundary | Local production-mode regression passes; unchanged production `/api/v1/community` still returns `POST_TOEIC_*` fixtures | `LOCAL FIX PASS / PRODUCTION FAIL` |
| Community durable persistence | No disposable/live PostgreSQL run and no post-deploy proof | `BLOCKED` |
| Academic task store | Production code path is PostgreSQL-bound; migration was not applied | `POSTGRES PATH / DURABILITY BLOCKED` |
| Notification store | Production code path is PostgreSQL-bound; migration was not applied | `POSTGRES PATH / DURABILITY BLOCKED` |
| QA_USER / student email | No controlled QA identity or mailbox supplied | `BLOCKED — QA_MAILBOX_REQUIRED` |
| Returning-user/relogin proof | No QA mailbox or controlled session available | `BLOCKED` |
| QA_EXPERT | No controlled expert identity available | `BLOCKED` |
| Expert qualification/authorization | No authorized admin provisioning path was exercised | `BLOCKED — EXPERT_PROVISIONING_REQUIRES_AUTHORIZED_ADMIN` |
| Expert assignment / Ask Expert | No real assignment or live case was available; no fabricated case was used | `BLOCKED` |
| Formal expert assessment | UI and request contract are implemented locally, but no real assigned case was submitted | `BLOCKED` |
| Expert reputation/reward | No live assessment, reward, or reputation event | `BLOCKED` |
| Trust authentication/persistence | Prior anonymous production observation was `pipelineStatus: PARTIAL`, `persisted: false`; authenticated persistence was not proven | `BLOCKED` |
| Trust L1–L5 / case and revision IDs | No QA identity, mailbox, or authenticated production run | `BLOCKED` |
| Notifications / reminders / relogin | No durable database or QA session evidence | `BLOCKED` |
| Mobile viewport behavior | 30 local built-app page/viewport combinations; zero horizontal overflow | `PASS — LOCAL` |
| Axe accessibility | Zero serious or critical violations in the same local browser pass | `PASS — LOCAL` |
| Production health | `/api/health/live` and `/api/health/ready` returned 200 | `PASS — HEALTH ONLY` |

## Verification evidence

- `npm run build`: passed; Next.js 16.3.0 compiled and generated 145/145 static pages.
- `npm run lint`: passed with 0 errors and 539 warnings.
- Community focused suite: 11 passed, including the production fixture-boundary regression.
- Selected academic end-to-end flows: 16 passed.
- Selected state/privacy checks: 21 passed.
- Migration, RLS, assignment-scope, expert request, and security contract checks passed in their focused runs.
- Durable academic repository live test: one test skipped by the guarded environment gate with `DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV`; no database URL, acknowledgement, or SSL configuration was present, and the Supabase CLI was unavailable.
- `npm run test:all-discovered`: not green. After the stale router contract was corrected, the runner stopped at the known Layer 3 Case C failure in `frontend/tests/layer3/layer3.test.mjs` (`expected CONTESTED`, received `INSUFFICIENT_EVIDENCE`). The runner stops at the first failure and emitted no aggregate result; this is recorded as one known full-suite failure, not hidden or weakened.
- Browser verification on the local built app covered `/login`, `/register`, `/trust`, `/community`, `/expert`, and `/profile` at 390, 430, 768, 1024, and 1440 pixel widths. There were no page errors, serious/critical Axe violations, or horizontal-overflow findings.
- Secret scan: no high-risk literal was found under `frontend/src`, `database`, or `scripts`. One API-key-shaped value is present only as a redacted test fixture pattern at `frontend/tests/providers/provider_gateway_contract.test.mjs:115`; no runtime credential literal was found.

## Additional profile integration in this work session

- Added same-origin Owner API contracts `GET/PUT /api/users/me` and `GET/PUT /api/experts/me`; the browser does not call the supplied friend backend directly.
- User Profile now edits only `FullName` and `AvatarUrl`. `Email`, `TrustScore`, `StarLevel`, role, and verification state are rendered read-only.
- Expert Profile now reads the separate server-owned qualification projection and edits only `Bio` and `Expertise`. `TrustScore` and `StarLevel` remain `null` when the Owner schema has no canonical values; no placeholder authority is invented.
- Added the profile API contract test: 2/2 pass. The full targeted profile/auth/security run was 9/10; the remaining failure is the pre-existing `/api/academic/command-center` 500 when durable database state is unavailable.
- The current production deployment still returns 404 for both new profile API routes, confirming that this slice has not been deployed.

## Explicit blockers

1. `QA_MAILBOX_REQUIRED`: no controlled QA mailbox and no supplied `QA_USER`/`QA_EXPERT` identities were available. Therefore student email verification, relogin, cross-user isolation, expert assignment, and real assessment workflows could not be exercised.
2. `EXPERT_PROVISIONING_REQUIRES_AUTHORIZED_ADMIN`: no authorized admin session/path was supplied or used. A local provisioning script is not evidence of a valid production expert lifecycle.
3. `DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV`: the disposable PostgreSQL URL and required acknowledgement/SSL settings were absent. The new migration and repositories therefore have contract coverage only, not live RLS/durability proof.
4. `NOT_DEPLOYED`: the remediation is not present in the production deployment. A read-only production smoke check returned 200 for health and Community, but Community still reported the seeded `POST_TOEIC_*` fixture IDs.
5. No authenticated Trust L1–L5 run, durable task completion, notification scheduling/cancellation, cross-user/relogin check, expert reputation event, or video evidence exists for this remediation.

## Release decision

No production migration, deployment, commit, or push was performed. The previous audit report and its evidence were not modified. The required next release gate is an authorized, immutable deployment of this remediation followed by controlled QA mailbox/identity testing and a disposable/live PostgreSQL durability/RLS run. Until those gates produce runtime evidence, the only supportable verdict is:

`STUDENTHUB_FULL_PRODUCT_REMEDIATION_BLOCKED`
