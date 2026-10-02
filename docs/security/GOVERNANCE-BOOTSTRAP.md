# One-time governance reviewer bootstrap

The current application has no pre-existing owner or first-governance bootstrap. `private.user_roles` is the source of role truth, and `ADMIN.SECURITY` is derived only from `ADMIN`; ordinary Student and Expert sessions cannot grant or claim it.

The replacement is a server-side, one-time operator command: `scripts/bootstrap-governance-reviewer.mjs`. It is not an HTTP endpoint and has no client-supplied role or target. It requires an approved Supabase project-owner operator environment, verified Auth and database identity matching production project `kytdomflmjytzyaabogi`, the database `postgres` owner role, separate owner and reviewer Auth UUIDs, confirmed email identities, an exact interactive confirmation, and no previous active or revoked ADMIN role history. The reviewer email must not be one of the eight demo persona emails.

The service takes a transaction-scoped advisory lock, grants only the canonical `ADMIN` role to the configured reviewer with the configured owner as grantor, and writes `GOVERNANCE_REVIEWER_BOOTSTRAPPED` to `private.audit_events` in the same transaction. A later invocation is a no-op only when that exact owner, reviewer, event, and sole active ADMIN still match. Any other prior governance state is rejected; it is never overwritten or silently restored. The bootstrap does not change expert scopes or other users' roles.

Required operator variables are `GOVERNANCE_BOOTSTRAP_OWNER_USER_ID` and `GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID`. The project identity itself is read from the existing server configuration and must resolve to production before the database connection is opened. Never place passwords, connection strings, JWTs, or API keys in command arguments or evidence. The command prints only the configured non-secret user IDs, role result, audit event ID, and project reference.

After a successful grant, the reviewer must log out and back in so the durable session reloads roles. The operator must verify the reviewer reaches a `ADMIN.SECURITY` review route and that ordinary Student and Expert identities remain denied, then remove the two temporary bootstrap ID variables and retain the sanitized audit evidence.

## Owner procedure

1. In the production Auth project `StudentHub-AI / kytdomflmjytzyaabogi`, create or select one separate, email-verified reviewer user. Do not select any of U01/U02/U03, E01/E02/E03, O01, or W01. Record only the Auth UUIDs; do not share the account password or tokens.
2. In the approved production operator terminal, load the existing owner database environment and verify its Auth and database project metadata identify `kytdomflmjytzyaabogi`. Do not load staging configuration.
3. From the candidate repository root, set the two non-secret IDs and run the interactive command:

   ```powershell
   $env:GOVERNANCE_BOOTSTRAP_OWNER_USER_ID = "<verified owner Auth UUID>"
   $env:GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID = "<separate reviewer Auth UUID>"
   node .\scripts\bootstrap-governance-reviewer.mjs
   Remove-Item Env:GOVERNANCE_BOOTSTRAP_OWNER_USER_ID
   Remove-Item Env:GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID
   ```

4. Review the printed project ref and IDs, type the full confirmation shown by the command, and retain the result with `state=BOOTSTRAPPED`, `role=ADMIN`, `permission=ADMIN.SECURITY`, and the audit event ID. If the command reports a project, owner-role, prior-governance, or identity failure, stop and do not substitute manual SQL.
5. Have the reviewer sign in again, verify their active role and `ADMIN.SECURITY`, then verify Student and Expert sessions receive 403 from the qualification review endpoint. Only then run the normal W01 application, quiz, practice, review, and activation workflow.

The command is intentionally interactive and requires the database `postgres` role plus exact project-ref agreement. It does not accept or print passwords, connection strings, API keys, JWTs, or dump data.
