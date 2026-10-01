# Production full closure gate — 2026-10-01

## Release decision

```ini
FINAL_RELEASE_DECISION = STUDENTHUB_PRODUCTION_RELEASE_PARTIAL
PRODUCTION_SCHEMA_MATCH = NO
PRODUCTION_BACKUP_GATE = UNKNOWN
PRODUCTION_PERSONA_CAMPAIGN = BLOCKED_NOT_RUN
PRODUCTION_CANARY = NOT_RUN
MAIN_PROMOTION = BLOCKED
TAVILY_FINAL_LIVE = NOT_RUN
TAVILY_CAMPAIGN_CALLS = 0
```

The current production environment is healthy at the platform/readiness layer,
but it does not match the active schema contract. The required production
persona and product scenarios were not run, so this is not a production
acceptance pass.

## Release identity

| Gate | Observed value | Result |
|---|---|---|
| Production Supabase ref | `kytdomflmjytzyaabogi` | PASS identity |
| Staging Supabase ref | `bniwtkjtramqaozrrtrk` | PASS identity; not the full-persona target |
| `origin/main` | `595a99110367aefb545b02dab4b9f9a5a6106ab6` | Observed |
| Production Vercel deployment | `dpl_ED91sTmSbtDS3xTzhgCeeiJqeRh7` | READY |
| Production deployment SHA | `595a99110367aefb545b02dab4b9f9a5a6106ab6` | Matches current main; not the release candidate |
| Release branch | `release/studenthub-full-sync-20261001` | Candidate work |
| Release branch push | Pending final source review and commit | Not yet PASS |

Production `/api/health/live` reports `LIVE` and the exact deployment metadata.
`/api/health/ready` reports `READY`; runtime, database, Supabase Auth and
durable session are `AVAILABLE`. Readiness does not prove active feature schema,
authorization, persistence or cross-client realtime behavior.

## Backend and database gates

| Gate | Status | Evidence boundary |
|---|---|---|
| API source inventory | PARTIAL | 159 route files / 199 exported handlers; static authorization triage only |
| Frontend-to-API request/response contract | UNKNOWN | No complete call/body/response comparison or live error matrix |
| Missing API routes | UNKNOWN | The inventory does not prove every caller resolves at runtime |
| Fresh database migration | PASS | 29 tracked files in disposable PostgreSQL 17.6 |
| Production-like upgrade | PARTIAL | PASS for synthetic observed-schema fixtures, not a production clone |
| Production schema match | FAIL | 22 missing tables; 6 columns missing on existing tables |
| Production expected FK gap | FAIL | 47 expected constraints absent: 46 from missing tables, 1 missing contribution link |
| Production indexes/policies/grants/functions/triggers | UNKNOWN | Not returned by current read-only table inventory |
| RLS enabled metadata | PARTIAL | 65/65 existing production tables report RLS enabled; behavior/policy coverage unknown |
| Production migration apply | BLOCKED | Backup/PITR/recovery gate is UNKNOWN |
| Production destructive DDL | NOT RUN | Two conditional, reviewed CHECK-constraint replacements exist only in tracked forward migrations; no production DDL was executed |
| Production schema-error runtime matrix | NOT RUN | No production API mutation/read scenario was attempted |

Canonical schema: 87 tables / 918 columns. Production readback: 65 tables / 694
columns. Exact absent objects are in
[`DATABASE_SCHEMA_DRIFT_MATRIX.md`](artifacts/production-blocker-closure/reconciliation-20261001/DATABASE_SCHEMA_DRIFT_MATRIX.md).

## Persona and product gates

The Supabase Auth screenshot establishes that dedicated demo identities were
listed by Auth. It does not prove StudentHub profile, roles, Expert scopes,
qualification, mission state or application login. The owner has stated that
production roles/scopes are provisioned; no application-side read has verified
them in this campaign. No role was reassigned and no demo account was recreated.

| Feature | Production status |
|---|---|
| Auth / Profile / role resolution | NOT RUN |
| Trust text / URL / image / QR | BLOCKED by schema gate; no live cases run |
| Community feed / post / comments / search | BLOCKED by schema gate; no production writes |
| Expert directory / verification / requests | BLOCKED by schema gate; production scope not verified |
| Question bank / Quiz correct and wrong | BLOCKED; no production persona or question-bank read |
| Daily Missions / failure / success | BLOCKED; no production mission state read |
| Star / Level / reputation and idempotency | BLOCKED; no production settlement |
| Expert presence / Live Room / Supervisor / timer | BLOCKED; no production room created |
| Answer privacy / evidence package / adjudication | NOT RUN |
| Community and room realtime / reconnect | NOT RUN |
| Storage uploads / ownership / cleanup | NOT RUN |
| OpenAlex production routing/smoke | UNVERIFIED |
| Fresh retrieval holdout | BLOCKED_EXTERNAL / NOT RUN in this campaign |
| Tavily final one-shot | NOT RUN; mode held OFF, budget 0 |

No production records were created, so there are no run-owned production IDs to
clean up. The seven Community screenshots are deterministic fixture previews,
not live production acceptance evidence.

## Code and regression evidence

| Gate | Result |
|---|---|
| Full hermetic discovery | 388/394 passed; 6 externally gated cases not counted as PASS |
| Chromium / Firefox / WebKit | 100 passed, 2 screenshot-only skips, 0 failed; fixture-backed |
| Production build / TypeScript | PASS; Next.js 16.3.7 compile, type-check and 143 static pages completed in this worktree |
| ESLint | 0 errors, 490 warnings |
| Secret scan | PASS; 89 browser bundles scanned, 16 sensitive variable identifiers absent; this worktree supplied no configured values for value-based probes |
| Accessibility full audit | NOT RUN |
| Responsive matrix beyond captured 390px fixture | NOT RUN |
| Live production canary | NOT RUN |

The static API inventory covers 159 route files and 199 method handlers. It
flags nine routes with no visible Security Fabric wrapper; two `/api/users/me`
mutation rows are confirmed re-export aliases of Security Fabric-wrapped
profile handlers and are scanner false positives. The remaining source triage,
data ownership, schema mapping, caller contracts and live API error/persistence
matrix remain incomplete. Do not report `API_INVENTORY_COMPLETE=YES` or
`MISSING_API_ROUTES=0` from these static counts.

The active route inventory classifies 11 explicitly removed route surfaces as
`NOT_FOUND`; their page components call Next.js `notFound()`, and the retired
Dashboard, Scholarships, Safety Map and SOS handlers return a no-store 404.
The built route manifest still lists these framework route entries, which does
not make their removed UI available. Other legacy/academic routes remain
explicitly listed for owner review; the route-row inventory reports zero
silently omitted entries, while the control-level UI census is still partial.

## Required owner/operator recovery evidence

```ini
LOGIN_REQUIRED_FOR = read production backup/PITR and restore evidence
WHY_EXISTING_AUTH_IS_INSUFFICIENT = CDP 9222 is unavailable; Supabase project/table tools do not expose backup or PITR inventory
WHICH_SYSTEM = Supabase Dashboard, project kytdomflmjytzyaabogi
OWNER_ACTION_REQUIRED = sign in to the production project's Supabase Dashboard in controllable Chromium CDP and expose a non-secret backup timestamp or PITR interval plus restore destination/procedure
```

After the recovery gate is evidenced, apply only reviewed tracked migrations,
read back the full schema contract, verify policy/grant behavior, then use the
existing production demo personas for the full scenario and exact-deployment
canary. Main promotion and a production release PASS remain prohibited until
those gates actually pass.
