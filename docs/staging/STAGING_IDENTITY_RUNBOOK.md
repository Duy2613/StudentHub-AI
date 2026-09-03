# StudentHub AI — Non-Production Test Identity Runbook

Status: **PREPARED / NOT EXECUTED**

This runbook defines deterministic identities for the approved disposable
staging project. It contains no passwords, tokens, cookies, or service-role
credentials.

## Identity matrix

| Identity | Auth state | Role source | Required positive checks | Required negative checks |
| --- | --- | --- | --- | --- |
| Anonymous | No bearer token | None | Public-safe route access only | Private profile, Trust case, Passport, screenshot metadata, and storage object denied |
| User A | Supabase-authenticated | `STUDENT` | Own profile/case/input/evidence/Passport access and permitted owner mutation | User B records and User B objects denied; Passport history not arbitrarily updated |
| User B | Supabase-authenticated | `STUDENT` | Own records and own community mutation | User A private records and objects denied |
| Expert | Supabase-authenticated | `STUDENT` + `EXPERT` | Approved expert profile/assessment path | Unverified or unrelated expert scope denied |
| Moderator | Supabase-authenticated | `STUDENT` + `MODERATOR` | Explicit moderation capability only | No implicit Trust-case, session, or private storage privilege |
| Admin/service context | Server-only credential or service context | `ADMIN`/`SERVICE` | Controlled migration, role, audit, persistence, and cleanup operations | Never exposed to browser; never used as an end-user proof |

The roles are separate from Supabase Auth identities. A role assignment is a
server-side operation and must be auditable. Public expert fields are served
through the approved redacted API projection; private verification/domain data
remains service-controlled.

## Creation procedure

1. Confirm the Supabase project reference and environment are approved as
   disposable staging.
2. Create four deterministic Auth users through the approved operator path.
   Use a staging-owned email domain or aliases. Generate passwords in the
   secret manager; never put them in this repository or a test file.
3. Record only opaque user IDs and role assignment evidence in the protected
   staging operator record.
4. Assign `EXPERT` and `MODERATOR` only to the designated identities. Keep the
   admin/service credential outside browser test state.
5. Run the executable RLS harness against the disposable database and clean up
   all rows/users created by the harness.
6. Create Playwright storage state by signing in through the staging UI. Store
   the generated file outside Git, with restricted permissions and a short TTL.

## Lifecycle and cleanup

- Rotate or delete all test users when staging is recreated or the operator
  owning the environment changes.
- Revoke sessions before deleting identities.
- Delete generated storage state after each assurance run or when its TTL
  expires.
- Do not copy staging credentials into preview, production, screenshots,
  reports, CI logs, or issue comments.
- The service role is an operational boundary, not a test user's password.

## Readiness evidence

Identity provisioning is complete only when the operator can provide the
project reference, opaque user IDs, role assignment evidence, successful sign-in
and session-restore evidence, and a passing positive/negative RLS run. None of
those external artifacts are present in the current local environment.
