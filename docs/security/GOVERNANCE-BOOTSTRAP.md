# One-time governance reviewer bootstrap

The current application has no pre-existing owner or first-governance bootstrap. `private.user_roles` is the source of role truth, and `ADMIN.SECURITY` is derived only from `ADMIN`; ordinary Student and Expert sessions cannot grant or claim it.

The replacement is a server-side, one-time operator command: `scripts/bootstrap-governance-reviewer.mjs`. It is not an HTTP endpoint and has no client-supplied role or target. It requires an approved Supabase project-owner operator environment, verified Auth and database identity matching production project `kytdomflmjytzyaabogi`, the database `postgres` owner role, separate owner and reviewer Auth UUIDs, confirmed email identities, an exact interactive confirmation, and no previous active or revoked ADMIN role history. The reviewer email must not be one of the eight demo persona emails.

The service takes a transaction-scoped advisory lock, grants only the canonical `ADMIN` role to the configured reviewer with the configured owner as grantor, and writes `GOVERNANCE_REVIEWER_BOOTSTRAPPED` to `private.audit_events` in the same transaction. A later invocation is a no-op only when that exact owner, reviewer, event, and sole active ADMIN still match. Any other prior governance state is rejected; it is never overwritten or silently restored. The bootstrap does not change expert scopes or other users' roles.

Required operator variables are `GOVERNANCE_BOOTSTRAP_OWNER_USER_ID` and `GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID`. The PowerShell launcher reads only `DATABASE_URL` and Supabase URL metadata from the same operator env file used by `OWNER_FRESH_BACKUP.ps1`, then uses that workflow's sibling `prod-ca-2021.crt`. It gives the Node process a minimal environment, prints sanitized presence/ref checks, and performs a read-only `SELECT 1` transport preflight before starting the interactive bootstrap. The Node command independently validates the production ref and pinned CA fingerprint, then configures node-postgres with that CA and `rejectUnauthorized: true` so URL SSL parameters cannot replace the strict TLS options. Hostname verification remains enabled; the rest of `.env.local` is never loaded. Never place passwords, connection strings, JWTs, or API keys in command arguments or evidence.

After a successful grant, the reviewer must log out and back in so the durable session reloads roles. The operator must verify the reviewer reaches a `ADMIN.SECURITY` review route and that ordinary Student and Expert identities remain denied, then remove the two temporary bootstrap ID variables and retain the sanitized audit evidence.

## Owner procedure

1. In the production Auth project `StudentHub-AI / kytdomflmjytzyaabogi`, create or select one separate, email-verified reviewer user. Do not select any of U01/U02/U03, E01/E02/E03, O01, or W01. Record only the Auth UUIDs; do not share the account password or tokens.
2. In the approved production operator terminal, keep the owner and reviewer ID variables set. The launcher discovers the env file and CA path from the successful fresh-backup operator workflow; it requires Auth and database metadata to identify `kytdomflmjytzyaabogi` and rejects staging. Do not load staging configuration or paste a connection string.
3. From the candidate repository root, set the two non-secret IDs and run the interactive command:

   ```powershell
   $env:GOVERNANCE_BOOTSTRAP_OWNER_USER_ID = ""<verified owner Auth UUID>""
   $env:GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID = ""<verified reviewer Auth UUID>""
   .\scripts\bootstrap-governance-reviewer-operator.ps1
   Remove-Item Env:GOVERNANCE_BOOTSTRAP_OWNER_USER_ID
   Remove-Item Env:GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID
   ```

4. Review the sanitized transport preflight and printed project ref and IDs, type the full confirmation shown by the command, and retain the result with `state=BOOTSTRAPPED`, `role=ADMIN`, `permission=ADMIN.SECURITY`, and `auditEvent=GOVERNANCE_REVIEWER_BOOTSTRAPPED`. If the command reports a project, owner-role, prior-governance, or identity failure, stop and do not substitute manual SQL. To run only the transport check first, use `.\scripts\bootstrap-governance-reviewer-operator.ps1 -PreflightOnly`.
5. Have the reviewer sign in again, verify their active role and `ADMIN.SECURITY`, then verify Student and Expert sessions receive 403 from the qualification review endpoint. Only then run the normal W01 application, quiz, practice, review, and activation workflow.

The command is intentionally interactive and requires the database `postgres` role plus exact project-ref agreement. It does not accept or print passwords, connection strings, API keys, JWTs, or dump data.
