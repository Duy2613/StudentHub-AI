# Database migration risk review — 2026-10-01

## Scope and decision

Reviewed the tracked reconciliation batch and its isolated fresh/upgrade
simulations. The three forward migrations are safe to keep in the release
candidate. They have been applied to staging through the Supabase migration
workflow and read back successfully. **Production is not approved for DDL**:
the exact production project's backup/PITR evidence and restore readiness remain
`UNKNOWN`, and the full staging cloud fingerprint and staging live-application
gates are not yet verified.

```ini
STAGING_PROJECT_REF = bniwtkjtramqaozrrtrk
STAGING_MIGRATION_APPLY = PASS
PRODUCTION_PROJECT_REF = kytdomflmjytzyaabogi
PRODUCTION_MIGRATION_APPLY = NOT_RUN
PRODUCTION_BACKUP_RECOVERY_GATE = UNKNOWN
MAIN_PROMOTION = BLOCKED_BY_RELEASE_GATES
TAVILY_MODE = OFF
TAVILY_MAX_CALLS_PER_RUN = 0
```

## Migration-by-migration review

| Migration | Change | Data and safety review | Staging result |
|---|---|---|---|
| `202610010001_integration_outbox_forward_reconciliation.sql` | Reconciles the known outbox shape by adding the lease/shadow fields and guarded nonnegative counter checks. | Additive and forward-only; preserves existing outbox rows. It aborts on an incompatible pre-existing column/check shape rather than silently normalizing unknown data. No backfill or destructive rewrite. | Applied; readback confirms nullable UUID lease token, non-null checked integer counters, and timestamp field. Existing counts were not reported as changed. |
| `202610010002_profile_presentation_check_reconciliation.sql` | Widens the observed profile presentation limits to the canonical major/avatar bounds. | Exact known prior constraint shape is required before replacement. No profile row rewrite, role change, or identity mutation. Unknown check shapes fail closed. | Applied; readback confirms major length 180 and avatar length 80; historical `institution_label` remains. |
| `202610010003_expert_v5_event_sequence_permissions.sql` | Grants required sequence usage/read to `service_role` for V5 event writes. | Least-privilege grant only; no table data change and no grant to browser roles. Does not use service-role bypass during migration execution. | Applied; disposable grant/denial and append-only checks pass. |

The existing migration IDs remain unchanged. Supabase's migration workflow
recorded server-assigned versions for the eight migration applications in this
run; the source filename/name mapping is retained in
`CANONICAL_MIGRATION_TIMELINE.md` and must not be interpreted as proof that the
remote version strings equal repository filename timestamps.

## Verification evidence

- Fresh disposable PostgreSQL 17 migration chain: **29/29 migrations pass**.
- Production-shaped and staging-shaped upgrade simulations: **pass on observed
  schema fixtures**; synthetic pre/post row counts and content digests match.
- Guard tests reject an incompatible outbox column and an unknown profile check.
- Isolated contract checks cover RLS/default-deny, owner profile access,
  service-only writes, V5 append-only enforcement, the four V5 sequence grants,
  and nested Community comment linkage.
- Staging post-apply readback reports 107 application tables, including the
  retained 20 historical extras; the new Community, academic workflow, demo
  entitlement, reputation-idempotency, notification, and Trust constraint
  objects are present. Existing Expert V5 and review-request rows remain
  visible by count.
- The local canonical contract contains 87 tables. The filtered table/column/
  constraint/index/policy/function/trigger sequence matches the simulated
  observed schema. Supabase's remote table API does not expose every index,
  policy, grant, function, or trigger; therefore a full live staging schema
  fingerprint is **UNVERIFIED**.
- The simulations use observed-schema fixtures, not a current cloud snapshot.
  Their preservation digests do not prove that production or staging cloud row
  contents are byte-for-byte unchanged.

Detailed machine evidence is in `DISPOSABLE_MIGRATION_RESULTS.json` and
`CANONICAL_SCHEMA_FINGERPRINT.json`.

## Residual risks and required gates

1. **Production recovery:** no exact-project backup ID/timestamp or PITR window,
   restore destination, or successful cloud restore rehearsal has been
   evidenced for `kytdomflmjytzyaabogi`. Keep production migrations and main
   promotion stopped until the recovery gate records verified evidence.
2. **Staging contract:** current API readback confirms the objects listed above,
   but cannot establish every remote RLS policy, grant, function, trigger, or
   index. Do not mark `STAGING_SCHEMA_MATCH=PASS` from table metadata alone.
3. **Staging application:** current `localhost:3000` health/live and health/ready
   checks were unavailable before the worktree server was started. Authenticated
   demo-role and live product flows are separate gates and remain unverified
   until the staging server and same-origin browser checks produce evidence.
4. **Rollback:** these are additive/guarded migrations. For a failed atomic
   migration, rely on transaction rollback. For a committed incompatible
   application state, use a reviewed forward repair or verified recovery point;
   do not issue unreviewed `DROP` or reverse DDL against production.
5. **Provider:** all automated assurance keeps Tavily `OFF` with call budget 0.
   Live retrieval/provider accuracy is not inferred from fixture-based browser
   tests.

## Release disposition

`STAGING_DDL = PASS` · `DISPOSABLE_MIGRATION_ASSURANCE = PASS` ·
`PRODUCTION_DDL = BLOCKED` · `PRODUCTION_BACKUP_GATE = UNKNOWN` ·
`STAGING_LIVE_ASSURANCE = PENDING`.

## Superseding production-only closure readback — 2026-10-01

The staging migration ledger now has 16 entries and the read-only table
inventory reports 107 tables / 1,157 columns, all 107 with RLS enabled. Eight
tracked migration applications were recorded in the staging ledger and their
targeted readbacks are documented above. This does not establish full staging
schema equivalence (the canonical fingerprint is 87 tables / 918 columns), nor
does it establish a production persona session. The latest release directive
designates production as the full-persona target, so staging personas are not
being retried.

The production `list_tables` readback on exact ref `kytdomflmjytzyaabogi`
reports 65 tables / 694 columns and 65/65 RLS-enabled metadata. The canonical
fingerprint has 87 tables / 918 columns. It is missing 22 active tables and six
columns on existing tables; the full delta and bounded FK comparison are in
`DATABASE_SCHEMA_DRIFT_MATRIX.md`. Policies, grants, indexes, functions and
triggers were not exposed by that metadata read, and remain unverified.

```ini
STAGING_MIGRATION_LEDGER = 16 ENTRIES
STAGING_TABLE_READBACK = 107 TABLES / 1157 COLUMNS / RLS ENABLED 107 OF 107
STAGING_FULL_SCHEMA_MATCH = NOT_ESTABLISHED
STAGING_PRODUCTION_PERSONA_CAMPAIGN = NOT_RUN (PRODUCTION-ONLY DIRECTIVE)
PRODUCTION_SCHEMA_MATCH = NO
PRODUCTION_BACKUP_RECOVERY_GATE = UNKNOWN
PRODUCTION_DDL = BLOCKED
MAIN_PROMOTION = BLOCKED
TAVILY_FINAL_LIVE = NOT_RUN
```

Production health is currently `LIVE` and `/api/health/ready` returns `READY`
for the existing production deployment. Health readiness does not compensate
for the missing active schema or substitute for role-scoped API and persistence
tests.

## Destructive DDL disclosure — CHECK constraint replacement

The forward migrations contain two conditional `DROP CONSTRAINT` operations.
They are called out separately because `DROP` statements require a distinct
safety review. These are not table/column drops and do not delete or rewrite
rows.

| Migration | Conditional DDL | Guard and replacement | Production disposition |
|---|---|---|---|
| `202610010001_integration_outbox_forward_reconciliation.sql` | Drops `private.integration_outbox.integration_outbox_status_check` only when exactly one validated CHECK has the recognized legacy four-state expression. | In the same transaction, installs the reviewed six-state CHECK including `SHADOW` and `CONFLICT`. Unexpected, multiple or unvalidated shapes raise and roll back. | Not applied to production; staging/disposable only. |
| `202610010002_profile_presentation_check_reconciliation.sql` | Drops the existing CHECK for `public.profiles.major` or `avatar_id` only when exactly one validated CHECK has the exact recognized legacy expression. | In the same transaction, installs the canonical bounded length CHECK (major 180; avatar_id 80). Unexpected shapes raise and roll back. No column or profile row is dropped or updated. | Not applied to production; staging/disposable only. |
| `202610010003_expert_v5_event_sequence_permissions.sql` | No `DROP` operation. | Adds least-privilege sequence permission for `service_role`. | Not applied to production. |

This was reviewed as a guarded, transactional forward replacement. It is not a
blanket production authorization: recovery remains `UNKNOWN`, so no production
DDL, including these constraint replacements, was executed.
