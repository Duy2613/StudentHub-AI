# Database backup and recovery gate — 2026-10-01

Observed at `2026-10-01T02:52:01Z` / `2026-10-01 09:52:01 Asia/Bangkok`.
Scope: read-only metadata and repository evidence. No remote snapshot, restore,
database write, project change, credential read, or provider request was performed.

```ini
PRODUCTION_PROJECT_REF = kytdomflmjytzyaabogi
STAGING_PROJECT_REF = bniwtkjtramqaozrrtrk
PRODUCTION_IDENTITY = PASS
PRODUCTION_BACKUP_GATE = UNKNOWN
PRODUCTION_BACKUP_AVAILABLE = UNKNOWN
PRODUCTION_PITR_ENABLED = UNKNOWN
PRODUCTION_RECOVERY_WINDOW = UNKNOWN
PRODUCTION_RESTORE_REHEARSAL = NOT_EVIDENCED
OWNER_DASHBOARD_BACKUP_READ = BLOCKED_BY_DASHBOARD_LOGIN
PRODUCTION_SCHEMA_CHANGE = BLOCKED_BY_BACKUP_GATE
LOCAL_APPLICATION_SCHEMA_RESTORE_20260910 = HISTORICAL_PASS
```

## Current project identity evidence

The connected Supabase `get_project` tool returned these exact project records;
the environment classification uses project reference and name from the API.

| Environment | Reference | Project name | Status | PostgreSQL engine/version | Region |
|---|---|---|---|---|---|
| Production | `kytdomflmjytzyaabogi` | `StudentHub-AI` | `ACTIVE_HEALTHY` | `17` / `17.6.1.155` | `ap-northeast-1` |
| Staging | `bniwtkjtramqaozrrtrk` | `StudentHub-AI-Staging` | `ACTIVE_HEALTHY` | `17` / `17.6.1.166` | `ap-southeast-2` |

Both projects belong to organization `eacmzumtuxcylkajrjly`. The connected
`get_organization` tool returned `plan=free` and `tier=tier_free` on this run.
That is an observed organization attribute. It is not a backup inventory,
PITR configuration response, or proof that this project has no recoverable backup.
Neither `get_project` response contains backup or PITR fields.

## Repository evidence and its limits

| Evidence | Observation | Production gate value |
|---|---|---|
| `docs/operations/BACKUP-RECOVERY.md:6` | Claims that Pro/PITR and daily WAL archiving are enabled for production. No observed backup identifier, recovery range, capture time, or operator restore record accompanies the claim. Its Pro assertion disagrees with the current organization API metadata. | Architectural claim; cannot establish PASS. |
| `docs/operations/BACKUP-RECOVERY.md:7`–`:8` | Lists RPO <=5 minutes and RTO <=30 minutes without measurements. | Unmeasured objectives; cannot establish PASS. |
| `docs/operations/BACKUP_RESTORE_REHEARSAL.md:3` | Explicitly says PLAN PREPARED / NOT EXECUTED and requires a separate disposable destination. | A safe rehearsal plan exists; execution is not evidenced. |
| `artifacts/local-supabase-backup-restore-2026-09-10.json` | Records a local disposable application-schema dump/restore with `restorePass=true`. | Historical local evidence only. |
| `docs/reports/STUDENTHUB_LOCAL_SUPABASE_ASSURANCE_CLOSURE_2026-09-10.md` | Describes filtering to `auth`, `public`, `private`, `storage`; excludes incompatible platform-owned Realtime internals. Explicitly excludes main-cloud migration and full Supabase platform restore claims. | Confirms the local coverage limit. |
| `docs/reports/STUDENTHUB_EXPERT_AUTHENTICATED_LOCAL_E2E_2026-09-10.md:11` | Uses APPLICATION_SCHEMA_RESTORE_VERIFIED and explicitly excludes full platform restore. | Does not establish current production protection. |
| `docs/reports/STUDENTHUB_MAIN_CLOUD_FORWARD_MIGRATION_PACKAGE_2026-09-10.md:65` | Requires a fresh Main snapshot before future apply; explicitly disallows representing application backup as platform restore proof. | Consistent with the current gate. |
| Search of repository `docs`, `artifacts`, `scripts`, and `database` | Found no current production backup inventory, PITR window, successful cloud restore record, or candidate-bound recovery artifact. | UNKNOWN remains. |

The preserved local JSON reports a custom archive of `454769` bytes with SHA-256
`341e2e54d585aa43e5cb22e505dbdf72eb075ef33442c8459bf99cc4ae1ee40e`.
The historical target was `LOCAL_DISPOSABLE_SUPABASE`; readback counted 56 app
tables, 14 Trust cases, 9 Community contributions, 7 Expert assessments, and 36
integration-outbox rows. The original dump file is absent from this worktree, so
its bytes and hash were not independently revalidated on this run.

The old script `scripts/local-backup-restore-assurance.mjs` requires a disposable
acknowledgement, a loopback source distinct from the application database, and
uses a newly created local database. It excludes transient Auth session-table
data, and its PASS predicate only checks that selected restored counts are
positive. It does not compare every source/target row, validate production
recovery readiness, restore Storage binaries, or measure RPO/RTO. It was reviewed
as source and was not run by this read-only investigation.

## Supported inspection and recovery automation

Current official Supabase documentation was obtained through the connected
`search_docs` tool, including the backup guide and API reference.

The [backup-list Management API](https://supabase.com/docs/reference/api/v1-list-all-backups)
supports `GET /v1/projects/{ref}/database/backups`. A read-only response for exact
ref `kytdomflmjytzyaabogi`, with backup states/timestamps and PITR configuration or
recovery range where supplied, is the next useful evidence. The exposed Supabase
MCP inventory in this session has project/organization/migration/table reads,
but no backup-list or PITR-configuration read tool. Connector OAuth credentials
were not inspected, exported, or reused as raw HTTP tokens.

The [official backup guide](https://supabase.com/docs/guides/platform/backups)
also provides project-specific Dashboard pages:

- [Production scheduled backups](https://supabase.com/dashboard/project/kytdomflmjytzyaabogi/database/backups/scheduled).
- [Production PITR window](https://supabase.com/dashboard/project/kytdomflmjytzyaabogi/database/backups/pitr).

The guide documents daily backups for paid plans, recommends off-site CLI
exports for free-tier projects, and describes PITR as an optional add-on. These
product rules guide inspection; they do not replace observed project state.
The guide also says database backups include Storage metadata but exclude
Storage object binaries. Any recovery plan covering evidence files must preserve
the required objects separately.

No restore endpoint was called. An in-place platform restore takes the project
offline and is not a permissible verification step for this task. A restoration
rehearsal must use an approved separate disposable destination.

## Existing owner browser inspection — 2026-10-01T02:58:55Z

The release lead authorized an additional read-only attempt through the existing
controllable Chromium session at loopback CDP port 9222. The agent-browser skill
was read; its CLI was not installed in the available global or frontend command
paths. The existing Playwright package could reach the browser metadata endpoint,
which identified `Chrome/154.0.8037.58` and CDP protocol `1.3`, but two bounded
Playwright connection attempts timed out before creating a page.

A scoped native CDP attempt created one new tab for
`https://supabase.com/dashboard/project/kytdomflmjytzyaabogi/database/backups`.
The new page reached origin `https://supabase.com`, path `/dashboard/sign-in`,
title `Supabase`, with `readyState=complete`. A password form and sign-in copy
were visible; no backup/PITR content was visible. The inspection collected only
these flags and safe URL components. No form was filled, sign-in performed,
cookie/token read or exported, restore triggered, or project action clicked.
Existing application tabs were not navigated or changed.

The probe tab was closed. A separate CDP target-list read confirmed zero remaining
tabs matching this probe's project-backup/sign-in destination. The Node process
printed its successful inspection result and then hit a Windows async-handle
teardown assertion; the independent cleanup check confirms the probe tab was
removed despite that process-level teardown failure.

The owner browser session therefore supplies no accessible backup inventory.
Production backup/PITR status remains UNKNOWN. The existing StudentHub application
login is not treated as a Supabase Dashboard login.

## Concrete evidence needed to close the gate

The minimal owner/operator step is to expose a non-secret, exact-project recovery
record: the successful recoverable backup identifier and timestamp, or an enabled
PITR earliest/latest recovery interval, for `kytdomflmjytzyaabogi` immediately
before the proposed migration window. A Management API JSON response is preferable
to a plan label. Record the recovery operator, destination/restore procedure,
and recovery limitations for the reviewed migration batch. Do not send an access
token, database password, dump containing personal data, or raw Storage objects
into chat or repository evidence.

If inspection proves that no appropriate platform recovery point exists, the
operator must create a protected off-site logical backup/export for the exact
production project, retain its checksum and schema/version identity, and prove
that the intended data can be restored to a separate disposable target. Record
coverage of Auth/application schemas, grants/ownership/RLS, and required evidence
Storage objects. An organization upgrade is not automatically required; a verified
alternative recovery mechanism may meet the gate for the reviewed migration risk.

The release lead must additionally record migration transaction behavior and
the rollback/forward-repair plan for the final tracked batch. Transactions can
roll back an unsuccessful atomic migration; they do not prove recovery after a
committed incompatibility or operational error. A successful empty-database
migration simulation does not supply a production-data backup.

## Release decision

The user's canonical reconciliation prompt, section 21, requires disposable
fresh and upgrade PASS, staging schema match, staging live PASS, and production
backup PASS before production apply. The ultimate integration prompt, section
23, explicitly says UNKNOWN backup protection for a risky migration must STOP.

Current evidence supports **UNKNOWN**, not PASS or proof of backup absence.
Production DDL and main promotion therefore remain gated. Continue repository
reconciliation, disposable fresh/upgrade simulations, tracked migration risk
review, and safe staging work while the recovery evidence is obtained.

## Follow-up check — 2026-10-01

The current release process made a read-only request to `http://127.0.0.1:9222/json`
to reuse the previously authorized Chromium CDP session. No controllable CDP
listener was available. No browser cookie, token, or local secret was inspected.
The prior bounded Dashboard inspection reached Supabase's sign-in page without
showing backup details. The connected Supabase project metadata and migration
tools still expose no backup/PITR inventory fields.

```ini
CDP_SESSION_AVAILABLE = NO
SUPABASE_DASHBOARD_BACKUP_READ = NOT_AVAILABLE
PRODUCTION_BACKUP_GATE = UNKNOWN
PRODUCTION_DDL = BLOCKED
MAIN_PROMOTION = BLOCKED
```

The next evidence needed is a non-secret, exact-project record for
`kytdomflmjytzyaabogi`: a recoverable backup identifier and timestamp or an
enabled PITR recovery interval, plus the approved restore destination/procedure
and coverage limitations. Do not send credentials, tokens, or a production dump.
