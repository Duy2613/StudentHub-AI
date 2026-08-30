# ADR-003 — PostgreSQL Authority and RLS

Status: Accepted schema; live clean-database and RLS proof blocked by environment.

## Decision

PostgreSQL/Supabase is the durable authority for V2 core state. Migration `202608270001_v2_authority_foundation.sql` establishes institutions, safe public profile fields, private roles and sessions, append-oriented audit events, forum posts/comments/votes, Trust evidence foundations, expert verification, and reputation events.

Privileged authority lives under the `private` schema. API roles receive no access to roles, sessions, expert verification, reputation, or audit internals. The explicit `service_role` receives the minimum operational table grants; audit events receive select/insert but not update/delete grants. Public profiles revoke legacy blanket grants and policies, then re-grant only safe columns. Existing legacy role/trust/verification columns may remain physically during compatibility migration but are not V2 authority and are not directly selectable, insertable, or updateable by authenticated clients.

RLS uses `auth.uid()` for own-profile, own-post, own-vote, own-case, input, and evidence boundaries. Forum writes derive `author_id` from the SecurityFabric principal and default production behavior fails closed when PostgreSQL is unavailable. An explicit non-production memory adapter remains only for legacy runtime tests.

## Verification boundary

Static migration contract tests and durable repository reconstruction tests pass. A live test harness exists at `frontend/tests/db/phase3_live_postgres_rls.test.mjs` and requires the deliberately named `STUDENTHUB_RLS_TEST_DATABASE_URL`; it applies the migration only to that dedicated Supabase-compatible test database and proves anonymous, cross-user, role, reputation, expert, session, and service-role behavior.

Because that environment is absent, no claim is made that migrations execute cleanly or RLS is proven live. PHASE 3 remains incomplete until the live suite passes and a real forum post is observed after an actual server restart.
