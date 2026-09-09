# Community × Expert Promax — Reality Pass

Date: 2026-09-09  
Status: `LOCAL_REALITY_PASS_WITH_LIVE_MIGRATION_GATE`

## Outcome

Trust result surfaces no longer present synthetic Community/Expert records as if they were live. The post-result gateways read Community signals and persisted Expert assessments only when a durable `caseId + caseRevision` exists. Missing records render `EMPTY`/`UNKNOWN`; no names, discussion counts, quotes, SLA promises, or citations are invented.

The contributor path now has a server-owned `0–100 + ★` projection and append-only `private.community_quality_events` ledger. Reactions remain non-authoritative, self-reactions are blocked, and reaching the candidate gate only returns `HUMAN_QUALIFICATION_REQUIRED`; it cannot grant an Expert role or mutate Trust.

## Verification

- Promax/domain/route/migration/Trust V5 contracts: `27/27` pass.
- ESLint error-only gate: pass (`0` errors); production build: pass with `150/150` static pages.
- Route manifest includes `/api/intelligence/community/track-record` and all Promax routes.
- Read-only dev smoke: `/`, `/community`, `/expert` returned HTTP `200`.
- Read-only API smoke: unauthenticated track record/qualification returned `401`; missing Community Promax storage returned typed `503 PROMAX_MIGRATION_REQUIRED`; live Expert directory returned `200` with an empty durable projection after legacy-schema compatibility fallback.

## Explicit boundary

The Supabase database was inspected read-only. The new Promax migration was not applied, no rows were inserted/updated/deleted, and no commit, push, deployment, or automatic main-database migration was performed. Current live schema still lacks `public.community_contributions` and the Promax lifecycle columns on `private.expert_verifications`; durable Community submissions, track records, assignments, and assessments remain unavailable until the migration is applied in an approved disposable/staging environment and then read back with RLS/concurrency tests.

The `agent-browser` binary was not available in PATH, so the browser-specific harness could not run. HTTP smoke and production build passed instead.
