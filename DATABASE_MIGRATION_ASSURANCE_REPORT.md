# Database migration assurance — 2026-10-01

## Decision

Tracked migrations and disposable PostgreSQL rehearsals are ready for review,
but the production upgrade is **blocked**. This campaign verified production
project identity and read-only schema metadata. It did not apply production DDL,
use direct SQL, or claim that an observed-schema fixture is a production clone.

```ini
PRODUCTION_PROJECT_REF = kytdomflmjytzyaabogi
STAGING_PROJECT_REF = bniwtkjtramqaozrrtrk
DATABASE_TARGET = Supabase PostgreSQL 17.6, ap-northeast-1 (production)
FRESH_DB_MIGRATION_CHAIN = PASS (29 tracked migration files)
PRODUCTION_UPGRADE_SIMULATION = PASS_OBSERVED_SCHEMA_FIXTURE
STAGING_MIGRATION_APPLY = PASS (8 tracked migration applications recorded)
PRODUCTION_SCHEMA_MATCH = NO
PRODUCTION_BACKUP_GATE = UNKNOWN
PRODUCTION_MIGRATION_APPLY = NOT_RUN
MAIN_PROMOTION = BLOCKED
```

## Environment and deployment identity

The Supabase project API identifies production ref `kytdomflmjytzyaabogi` as
`StudentHub-AI`, `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.155 in `ap-northeast-1`.
Staging is the distinct ref `bniwtkjtramqaozrrtrk`, project
`StudentHub-AI-Staging`, PostgreSQL 17.6.1.166 in `ap-southeast-2`.

At this read, `origin/main` is `595a99110367aefb545b02dab4b9f9a5a6106ab6`.
Vercel's production-target deployment `dpl_ED91sTmSbtDS3xTzhgCeeiJqeRh7` is
`READY` for that exact SHA. The production `/api/health/live` response reports
the same commit and deployment IDs; `/api/health/ready` is `READY`, with runtime,
database, Supabase Auth, and durable session marked `AVAILABLE`. This is the
currently deployed main version, not the release candidate.

The release branch is `release/studenthub-full-sync-20261001`, based directly on
the fetched `origin/main` and five integration commits ahead at the start of
this closure. The tested preview at SHA `64634319fe0f744e37b1f0fa39fbe57262ae7798`
predates this worktree's follow-up changes. No deployment is represented as
containing the uncommitted closure changes.

## Schema readback

The source fingerprint contains 87 tables, 918 columns, 709 constraints, 270
indexes, 53 policies, 15 sequences, 7 functions and 23 triggers. Production
metadata currently exposes 65 tables, 694 columns and RLS enabled on 65/65
tables. It is missing 22 active tables and six columns on otherwise present
tables. The missing table and column names, plus the expected-FK comparison, are
recorded in
[`DATABASE_SCHEMA_DRIFT_MATRIX.md`](artifacts/production-blocker-closure/reconciliation-20261001/DATABASE_SCHEMA_DRIFT_MATRIX.md).

`list_tables` does not return the full index, policy, grant, function or trigger
definitions in the available connector. Those categories are `UNKNOWN`; 65/65
RLS-enabled metadata is not a behavioral RLS pass. No application-role or
production demo-persona authorization matrix was run.

Staging has 107 tables / 1,157 columns / RLS enabled on all 107 tables and 16
migration ledger entries. Eight tracked migration applications were recorded
there. Staging has not been declared an exact match to the 87-table canonical
fingerprint, and is not used for this run's full persona campaign.

## Disposable migration evidence

The recorded isolated PostgreSQL 17.6 run applied all 29 tracked migrations to
an empty database. The production-like and staging-like upgrade simulations
passed against synthetic fixtures reconstructed from observed table/column/check
metadata; representative data digests were stable before and after. Incompatible
profile-check shapes fail closed. RLS/grant/append-only and Community nested-FK
unit scenarios passed in disposable PostgreSQL.

These results support migration syntax and the modeled forward path. They do
not prove an upgrade against a production dump or validate full Supabase Auth,
Storage, Realtime, live policy behavior, cloud grants, functions, indexes, or
triggers. The three new migrations address outbox shape, profile presentation
checks, and Expert V5 event sequence permissions. The first two conditionally
replace recognized legacy CHECK constraints; this `DROP CONSTRAINT` DDL is
disclosed and reviewed separately in
[`DATABASE_MIGRATION_RISK_REVIEW.md`](artifacts/production-blocker-closure/reconciliation-20261001/DATABASE_MIGRATION_RISK_REVIEW.md).
It is transactional, data-preserving, validated against disposable/staging
shapes, and has not been applied to production.

## Recovery gate and safe stopping point

The exact production backup ID/timestamp or PITR interval, restore destination,
and recovery rehearsal are not evidenced. The previously authorized Chromium
CDP endpoint is not currently available; the earlier bounded Dashboard visit
showed the sign-in page only. Project metadata does not expose backup/PITR
state. Therefore `PRODUCTION_BACKUP_GATE=UNKNOWN` and production DDL remains
blocked. The tracked migration plan, source review, reports, local tests, branch
commit and push can proceed independently; no main promotion or production
canary should be represented as complete.

## Test boundary

- Fresh migration chain: 29/29 tracked migrations passed in a disposable DB.
- Production-like upgrade: passed only for the observed-schema synthetic
  fixture; not a live production clone.
- Hermetic test discovery: 388/394 discovered files passed; six live retrieval
  or Expert read-only tests are externally gated and not counted as passes.
- V4 three-core browser matrix: 100 passed, two screenshot-only skips, zero
  failures across Chromium, Firefox and WebKit; fixture-backed.
- ESLint: zero errors and 490 warnings.
- Production schema, persona, persistence, API, RLS behavior and realtime:
  blocked or not run; see
  [`PRODUCTION_FULL_CLOSURE_GATE.md`](PRODUCTION_FULL_CLOSURE_GATE.md).
