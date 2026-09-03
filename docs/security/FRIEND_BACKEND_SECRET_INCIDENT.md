# Friend Backend Secret Incident

**Incident status:** `OPEN`

**Priority:** `P0`

**Classification:** `SECRET_ROTATION_REQUIRED`

**Detected:** `2026-09-02`

**Source snapshot:** `0625b1b950f29edd714507e485284208207039fb` on `develop`

## Affected source

| Field | Finding |
| --- | --- |
| Repository | `https://github.com/anhkt015/StudentHub-AI.git` |
| Branch | `develop` |
| File | `backend/StudentHub.API/appsettings.json` |
| Location | Line 3, `ConnectionStrings:DefaultConnection` |
| Credential category | PostgreSQL database password embedded in a connection string |
| Exposure class | Public repository source and reachable Git history; active status not yet externally confirmed |
| Potential environment | Supabase-hosted PostgreSQL database configured by the friend backend |

The credential value is intentionally not reproduced. The source file itself must be treated as compromised until revocation is confirmed.

## Potential blast radius

If the credential is active, an unauthorised party may be able to authenticate to the configured PostgreSQL endpoint with the permissions granted to that database user. The exact permissions, current activity, deployment usage, backups, forks, caches, and downstream data impact have not been verified in this repository-only phase.

The incident does not establish that StudentHub's canonical Supabase project is compromised. It does establish that the friend backend's configured database credential cannot be trusted and must not be promoted into StudentHub infrastructure.

## Required operator containment

- [ ] Revoke or rotate the exposed database credential at the owning Supabase/database control plane.
- [ ] Verify the old credential no longer authenticates.
- [ ] Review database and provider access logs for unexpected activity.
- [ ] Identify every Render, Vercel, local, CI, container, or other runtime configuration that may have consumed the value.
- [ ] Replace runtime configuration through an approved secret store; do not re-add it to tracked files.
- [ ] Inspect all reachable Git history, branches, tags, forks, caches, build artifacts, and deployment snapshots.
- [ ] Remove the plaintext value from active source through the approved repository secret-remediation process.
- [ ] Decide whether public Git history cleanup is required and obtain explicit authorization before rewriting history.
- [ ] Record the rotated credential's ownership, date, environment, and validation evidence without recording the value.

## Verification after rotation

The following evidence is required before the incident can be closed:

1. Database/provider control-plane confirmation that the old credential is revoked.
2. A negative authentication test for the old credential, performed by the owner or authorized operator.
3. A positive connection test using the replacement secret from the approved secret store.
4. Deployment configuration review proving no active service still uses the old value.
5. Git/history scan result covering the pinned repository and relevant forks/caches.
6. Access-log review and incident decision for any observed misuse.

## Repository-only evidence

- `git ls-remote` resolved `develop` to commit `0625b1b950f29edd714507e485284208207039fb`.
- The credential-bearing file is tracked in that commit.
- Historical metadata also shows generated `bin/Debug/net10.0` configuration artifacts were tracked by earlier commits and require review.
- No credential rotation, database login, deployment inspection, or public history rewrite was performed by Codex.

## Release gate

Until the operator actions and verification evidence above are supplied:

`LIVE RELEASE SECURITY GATE = BLOCKED`

Repository-side engineering may continue, but no staging/live deployment, remote migration, or secret-store mutation is authorized by this document.
