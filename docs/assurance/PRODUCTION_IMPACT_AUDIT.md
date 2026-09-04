# StudentHub Owner Promax — Production Impact Audit

Audit date: 2026-09-04 (Asia/Bangkok)

## Scope and evidence boundary

The earlier baseline run discovered that `scripts/run-discovered-tests.mjs`
implicitly loaded `frontend/.env.local`. Safe metadata inspection established
that this local file is production-bound (`kytdomflmjytzyaabogi`) and contains
server database configuration. The raw values were not printed, committed, or
copied. No production read-only audit connection was available or opened for
this closure, so this report does not claim that production impact was absent.

The unsafe loader has now been removed. Pure child tests scrub DB, Supabase,
service-role, session, and external-provider variables. A staging-only guard
rejects production/unknown targets before a PostgreSQL pool or live child
process is created.

## Four observed auth-bootstrap scenarios

The baseline failure was in `frontend/tests/security/auth_sync_bootstrap.test.mjs`.
The route under test was `/api/auth/sync`.

| Scenario | Code path | DB operation reachable | Observed result | Persisted row proven? |
| --- | --- | --- | --- | --- |
| Valid staging Supabase token → durable session | `IdentityResolver.resolveFromSupabaseBootstrap` → `auth/sync/route.js` | Role `SELECT`; then `INSERT ... ON CONFLICT` into `public.profiles`; only after that private role/session/audit writes | PostgreSQL returned `profiles_id_fkey` for the synthetic/nonexistent auth subject | No. The profile statement failed before commit; no audit/role/session write was reached in that request, but production state was not independently queried |
| Browser-supplied fake `user_id` / email | Same bootstrap and sync path; server should use verified `sub` | The invalid synthetic subject can fail UUID parameter handling before the profile write | HTTP 500 from the baseline fixture | No production row impact proven; request/DB-attempt scope is not independently audited |
| Browser-supplied `ADMIN` role | Same path; client role is ignored by the route | With the baseline synthetic subject, UUID/fixture validation fails before a durable authority write; the route never trusts the body role | HTTP 500 from the baseline fixture | No production row impact proven |
| Render/Citadel unavailable | Same path; external backend is not a prerequisite | The auth route owns the profile/session path; baseline fixture failed before durable success | HTTP 500 from the baseline fixture | No production row impact proven |

For a successful real subject, the route's source order is:

1. read authoritative roles;
2. upsert `public.profiles`;
3. insert baseline `private.user_roles`;
4. read roles;
5. create `private.server_sessions` and its audit event in the repository
   transaction.

The baseline output is enough to prove that at least one DB request reached a
production-bound configuration and that a profile write was attempted. It is
not enough to prove the absence of all production reads/writes across the
entire 299-file suite, because the old runner could also expose the same
environment to other tests and local Next processes.

## Secret exposure review

- No raw secret value was printed in the captured assistant/tool output.
- The prior error output contained only application error text and sanitized
  redaction markers; no password, service-role key, session pepper, or bearer
  token was recorded here.
- `frontend/.env.local` is ignored and is not tracked by Git.
- No production value was copied into a staging file, CI artifact, or commit.
- Rotation is not asserted solely from local use; the operator should rotate
  credentials if provider logs, shell history, CI output, or an external
  system show an actual disclosure.

## Required verdict

`PRODUCTION_IMPACT_INCONCLUSIVE`

This is deliberately narrower than `PRODUCTION_IMPACT_NONE_PROVEN`: the code
and baseline output prove attempted access, while no authorized read-only
production audit evidence was available to establish the final persisted state
or exhaustively account for every old-runner process.
