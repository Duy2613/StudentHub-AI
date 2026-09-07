# StudentHub AI — AUTH / SESSION CLOSURE PASS

Date: 2026-09-06  
Scope: StudentHub authentication/session boundary only. Labbe remains frozen.  
Safety: no commit, push, production deploy, automatic writeback, or provider enablement.

## EXECUTIVE VERDICT

`AUTH_IDENTITY_VERIFIED_LOCAL`

The local identity chain is verified at contract level and through a local
server smoke check: Supabase proof is exchanged for a server-owned opaque
HttpOnly session, the server session is the only authenticated UI authority,
roles come from private server state, logout clears local/private state, and
late auth work is fenced against stale-principal resurrection.

This is not a production-readiness claim. A valid beta-account login, live
PostgreSQL/RLS proof, multi-instance realtime proof, and Google OAuth success
were not completed in this environment.

## ROOT CAUSE

The historical AuthContext failure described in the brief is not reproducible
in the current isolated AuthContext contract: the current test passes. It is
therefore recorded as historical test/fixture/worktree drift, not as a claim
that an unobserved stack trace was fixed.

The concrete authority risks found and closed were:

- Supabase provider state and legacy backend state could be treated as parallel
  identities; legacy login/register/sync paths now fail closed or read only the
  application session.
- Client/provider metadata could influence real-user role or verification
  presentation; real profiles now use the server application-session projection.
- Auth callbacks could race initial hydration, token refresh, logout, or an
  unmount; ordered reconciliation and an epoch fence now reject stale work.
- Google UI state could imply readiness without provider configuration proof;
  the capability state now records the exact blocker.

## AUTHCONTEXT

The required state enum is implemented and contract-tested:

`INITIALIZING → AUTHENTICATING → SIGNED_IN | SIGNED_OUT | ERROR`

with explicit `REFRESHING` and `SIGNING_OUT` transitions. Initialization:

1. Reads the server-owned application session first.
2. Exchanges a current Supabase proof only when no application session exists.
3. Applies a minimal server projection before exposing authenticated UI.
4. Reads Demo Mode only after authoritative checks.
5. Subscribes to provider changes only after bootstrap completes.

The callback queue, `authEpochRef`, mounted guard, and cross-tab logout signal
prevent duplicate initialization, stale UI, listener races, and a slow exchange
from restoring a logged-out principal.

## EMAIL PASSWORD

Local capability state: `READY` when the configured Supabase URL and public key
are usable and the explicit disable flag is absent. Registration, six-digit OTP
verification, minimum password validation, login, typed error translation, and
server-session exchange are implemented.

A negative live probe against the configured Supabase endpoint used a synthetic
`.invalid` address and produced `REJECTED_WITH_SAFE_ERROR`; it did not create an
account or write application data. A successful beta-account registration,
email verification, refresh rotation, and login-after-logout proof were not
possible without approved test identities.

## GOOGLE OAUTH

Current capability: `DISABLED`. Exact reason:

`GOOGLE_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION`

The Google guard stops before an OAuth request. The audit projection records:

- provider enabled: false;
- Dashboard attestation: false;
- application redirect configured: false in the current local capability input;
- expected provider callback shape: `https://<project-ref>.supabase.co/auth/v1/callback`;
- Client ID and Client Secret expected: yes;
- credential location: `SUPABASE_DASHBOARD_ONLY`;
- configuration evidence: `NOT_VERIFIED`.

No Client ID, Client Secret, token, or Dashboard credential was read or added
to the frontend. The observed `Unsupported provider: provider is not enabled`
condition is represented by the exact blocker above.

## SESSION HYDRATION

The browser restores the opaque `studenthub_session` cookie before consulting
provider state. A provider access token is transient exchange material only;
the returned application session contains safe metadata and no credential.

Demo cache is presentation-only and cannot shadow an authoritative session.
Provider storage is memory-backed rather than Web Storage. `BroadcastChannel`
plus a timestamp-only storage signal invalidates peer tabs without carrying a
credential.

## SERVER PRINCIPAL

`IdentityResolver` gives the server-owned session cookie precedence. A malformed
or invalid cookie fails closed and cannot fall through to a second bearer
credential. Bearer verification remains a compatibility path only when no
session cookie is present.

OIDC/JWKS tests verify signature, issuer, audience, expiry, key rotation, and
UUID subject requirements. Typed `student:`, `expert:`, and `user:` UUID
prefixes normalize to the canonical UUID; non-UUID legacy subjects remain
unchanged rather than being guessed into a UUID.

## DATABASE IDENTITY

The application session repository joins the session subject to `auth.users`
and reads email confirmation, safe profile presentation fields, and active
roles from `private.user_roles`. Real role values are normalized server-side.

The durable session contract verifies hashed opaque secrets, expiry, revocation,
restart reconstruction, proof replay rejection, and session isolation using a
local durable test repository. The live PostgreSQL identity path was blocked
because `DATABASE_URL` was absent from the Node test process.

## RLS

Migration contracts pass for `auth.uid()` owner policies, private role/session
state, Trust records, reports, expert qualification, and community ownership.
The effective disposable-database A/B proof was not executed: the required
`STUDENTHUB_RLS_TEST_DATABASE_URL` was not available to the test process.

## LOGOUT

Same-origin logout now revokes the durable session when a cookie exists and
always clears the opaque cookie. A no-cookie local smoke request returned:

- `GET /api/auth/session`: 401, generic `UNAUTHORIZED` response;
- `POST /api/auth/session/logout`: 200, `{"success":true}` and `Max-Age=0` cookie.

Client logout clears provider proof, application/profile/demo caches, realtime
private state, and the in-memory exchange result. Cross-tab logout is
credential-free. Old revoked sessions are rejected by the durable session
contracts.

## REALTIME AUTH

Private realtime subscriptions require both `SIGNED_IN` and an
`APPLICATION_SESSION` authority. Principal changes clear events,
notifications, metrics, presence, and runtime state; the stream closes when
the application session disappears. Broadcast requests include the server
cookie and do not accept a client principal as authority.

Local transport and channel-idempotency contracts pass. Case A/B subscription,
revocation/expiry reauthorization, and shared multi-instance fan-out remain
unverified; they are the next realtime/multi-instance phase.

## EXPERT IDENTITY

Expert activation is server-owned. The activation transaction grants the
`EXPERT` role in `private.user_roles` with the reviewer as grantor before
publishing verification/domain state; failure rolls back. Client profile data
cannot set `VERIFIED`, `ACTIVE`, or domain authority. Expert qualification,
privacy, and migration contracts pass. Live duplicate/resume application proof
requires the disposable RLS database.

## BETA USER MATRIX

| Identity | Expected authority | Result in this pass |
| --- | --- | --- |
| Anonymous | Public-only; private session/profile denied | Local session route smoke PASS |
| User A | Own profile, Trust, report, community records | Contracted; live DB proof BLOCKED |
| User B | Own records only; User A records denied | Contracted; live DB proof BLOCKED |
| Expert | Student plus server-granted `EXPERT` scope | Contracted; live role/RLS proof BLOCKED |
| Moderator | Explicit community moderation only | Migration contract; live role/RLS proof BLOCKED |
| Admin/service | Server-only private operations | Migration contract; no browser exposure |

No new beta account was created and no unrelated data was deleted.

## TEST RESULTS

- Auth, identity, session, error, OIDC, logout, and security contracts:
  **49 passed, 0 failed**.
- Realtime, community/expert authorization, qualification, migration/RLS, and
  report contracts: **14 passed, 0 failed**.
- Trust persistence and boundary regression: **83 passed, 0 failed**.
- Frozen Labbe regression suite: **19 passed, 0 failed**.
- `npm run build`: **PASS**; TypeScript and static page generation completed.
- `npx eslint . --quiet`: **PASS**, zero errors.
- `npm run lint`: **PASS**, zero errors and 413 repository warnings.
- Negative Supabase password probe: **safe rejection**; no account/writeback.
- Google provider guard: **PASS**, exact disabled blocker before network.
- Full `npm test`: reaches the expected live gate and stops at
  `frontend/tests/community_expert/phase8_live_gate.test.mjs`; error is
  `DatabaseUnavailableError: DATABASE_URL is required for durable production
  state` at `frontend/src/lib/server/database/PostgresPool.js:17`.
- `test:phase3-live`: **BLOCKED** because
  `STUDENTHUB_RLS_TEST_DATABASE_URL` is absent.
- Labbe staging live gate: five probes skipped and wrapper **BLOCKED** because
  base URL, workload token, workload scope, and test database variables are
  absent. No remote call, migration, or database write was attempted.

## FILES CHANGED

Auth/session implementation and evidence files changed in this pass include:

- `frontend/src/lib/auth/AuthContext.jsx`
- `frontend/src/lib/auth/authService.js`
- `frontend/src/lib/auth/authCapabilities.js`
- `frontend/src/lib/auth/authStateMachine.js`
- `frontend/src/lib/security/identity/normalizeSubjectId.js`
- `frontend/src/lib/security/identity/IdentityResolver.js`
- `frontend/src/lib/security/identity/OidcTokenVerifier.js`
- `frontend/src/lib/security/identity/PostgresSessionRepository.js`
- `frontend/src/app/api/auth/session/route.js`
- `frontend/src/app/api/auth/session/logout/route.js`
- `frontend/src/app/callback/page.jsx`
- `frontend/src/app/login/page.jsx`
- `frontend/src/components/auth/AuthUI.jsx`
- `frontend/src/components/auth/SaffronAuthDeck.jsx`
- `frontend/src/components/providers/RealtimeContext.jsx`
- `frontend/src/lib/server/expert/ExpertQualificationService.js`
- `frontend/tests/auth/auth_identity_closure.test.mjs`
- `frontend/tests/auth/auth_resilience_contracts.test.mjs`
- `frontend/.env.local.example`
- `docs/architecture/SUPABASE_AUTH_CONFIGURATION.md`
- `docs/security/Auth-Dependency-Map.md`

Existing unrelated dirty-worktree changes were preserved.

## KNOWN LIMITATIONS

- No valid beta identity was supplied for a successful email/password, OTP,
  refresh, or post-logout reauthentication flow.
- Live PostgreSQL session/RLS/ownership evidence is not available in the Node
  test environment.
- Google Dashboard provider, Client ID, Client Secret, and redirect allowlist
  were not available for verification.
- Realtime is locally principal-bound but shared multi-instance fan-out is not
  yet a live assurance result.
- Labbe staging was not enabled and remains outside this pass.
- Lint has a pre-existing warning backlog; no lint errors remain.

## BLOCKED_BY_ENV

The following were not present in the Node test process:

- `DATABASE_URL` for durable live gates;
- `STUDENTHUB_RLS_TEST_DATABASE_URL` for disposable effective-RLS proof;
- `STUDENTHUB_LABBE_BASE_URL`;
- `STUDENTHUB_LABBE_TOKEN`;
- `STUDENTHUB_LABBE_SCOPE`;
- `STUDENTHUB_LABBE_TEST_DATABASE_URL`;
- approved beta identities/storage state for positive auth E2E;
- Google Dashboard attestation and provider credentials.

The local `.env.local` was inspected by key presence/status only; secret values
were not printed, modified, or copied into tests or reports.

## NEXT ACTION

Provide a disposable PostgreSQL/RLS test URL and approved stable beta identities
through the secret manager, then run the positive email/OTP/refresh/logout and
A/B ownership matrix. Separately, an operator must verify Google in Supabase
Dashboard and set the two Google capability flags only after that evidence
exists. The next engineering phase is shared realtime/multi-instance
authorization; Labbe should remain frozen until its staging URL, workload
token/scope, and disposable test database are supplied.
