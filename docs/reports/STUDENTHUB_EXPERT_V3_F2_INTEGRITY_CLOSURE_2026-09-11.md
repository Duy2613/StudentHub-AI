# StudentHub AI Phase F.2 — Expert Trust Network V3 Integrity Closure

**Date:** 2026-09-11
**Scope:** Remote release-candidate integrity closure from `origin/feature/expert-trust-network-v3`
**Starting remote SHA:** `bbabf87514e9201f963896cb97999e73c5c8afc6`
**Final verdict:** `EXPERT_V3_REMOTE_RC_BLOCKED_BY_ENVIRONMENT`

## Executive result

The Phase F.2 integrity changes are implemented and locally verified from a fresh disposable worktree. The authenticated local flow is verified as `FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED`; the network guard recorded zero violations and all Main write counters are zero.

The release candidate is not marked ready because the repository-wide discovered runner intentionally blocked two external live-web/provider suites after removing provider credentials. The remaining 357 discovered test files executed and passed, with zero failed files. This is therefore not a claim of full regression.

No `develop` merge, Main Supabase write, Main Supabase migration, force push, or production deployment was performed.

## Provenance and worktree protection

| Item | Evidence |
| --- | --- |
| Fresh F.2 worktree | `C:\Users\Duy\Projects\MyProj\StudentHub-AI-Expert-V3-F2`; clean before changes; detached at the starting remote SHA |
| Primary owner worktree | `implementation/academic-cinematic-v1-f00` at `b78f90fb6e8f475c0b36a6116aa6ff0a01975882` |
| Primary status signature | 298 status lines, 19,757 LF-normalized UTF-8 bytes, SHA-256 `2537c8cb607d9fda81b2e2de37a43715df851a96556264caaad0ecd85df79c5c`; unchanged before/after F.2 work |
| Existing feature worktree | `C:\Users\Duy\Projects\MyProj\StudentHub-AI-Expert-V3`, branch `feature/expert-trust-network-v3`, starting SHA unchanged; not used for edits or tests |

The F.2 worktree used `npm ci --prefix frontend` successfully. No Main credentials were copied into it.

## Diff audit and file classification

### Intentional Phase F.2 files

- `database/migrations/202609110002_expert_v3_integrity_closure.sql`: forward-only schema, constraint, RLS, grant, trigger, audit-snapshot, and moderation-integrity closure.
- `frontend/src/lib/server/database/ExpertProgressionRepository.js`: domain-scoped progression normalization and `(user_id, domain_code)` conflict handling.
- `frontend/src/lib/server/database/CommunityPerceptionRepository.js`: strict target consistency and server-derived expert qualification behavior.
- `frontend/src/lib/server/database/ModerationRepository.js`: canonical eligibility, authoritative target-author resolution, quorum/finalization separation, immutable eligibility snapshots, conflict/self/reporter controls, appeal independence, and audit retention.
- Moderation routes for case creation, vote casting, case finalization, appeal submission, and appeal resolution.
- `artifacts/expert-v3/MODERATION_POLICY.json`: versioned `community-moderation-v2` policy.
- F.2 contract, live RLS/grant, moderation, progression, visual, and literal-backslash hygiene tests.
- `scripts/rehearse-expert-v3-integrity.mjs`: two-clean-database plus old-like forward-migration rehearsal.
- `artifacts/visual/STUDENTHUB_KHAI_MINH_RUNTIME_ASSET_MANIFEST_2026-09-11.json`: current WebP runtime manifest.
- The seven historical report files and two verification scripts containing terminal literal `\n` corruption markers; only the terminal marker was removed.
- Three pre-existing VNext visual contract tests updated to the actual current Khai Minh/WebP runtime registry; no product surface was added.
- This closure report.

### Explicitly excluded from the candidate

`node_modules`, `.next`, `.env`/`.env.*` files, secrets, local logs, browser caches, disposable database artifacts/dumps, generated benchmark outputs, and local E2E output were not staged. Test-generated benchmark/build files were removed or restored before the final audit.

## Integrity changes closed

### Repository hygiene and visual truth

- A repository-wide scan found nine tracked files ending in the literal two-byte marker `\\n`; the marker was removed without changing legitimate escaped `\\\\n` content.
- `frontend/tests/repository/trailing_literal_backslash_n_hygiene.test.mjs` now guards the repository against recurrence.
- The current runtime visual registry has 52 physical WebP derivatives across desktop, tablet, mobile, and OG paths. The runtime manifest records byte sizes and SHA-256 values, with mobile and desktop budgets of 180 KiB and 320 KiB respectively.
- Historical AVIF inventory was preserved and no asset was re-encoded.
- Runtime visual tests verify route coverage, physical existence, WebP extension, no PNG runtime references, manifest parity, hashes, and byte budgets.

### Expert progression and Community perception

- Progression identity is composite `(user_id, domain_code)`; repository writes use `ON CONFLICT (user_id, domain_code)` and exact domain reads.
- The simultaneous-domain regression proves independent `AI_ML` and `CYBERSECURITY` rows.
- Community perception writes are server-owned. Direct public/anon/authenticated insert/update/delete grants are revoked.
- A database trigger derives `voter_is_expert_at_vote` from active, non-suspended `DOMAIN_VERIFIED` qualification. The live direct-spoof test denies an authenticated insert and forces a trusted service write to `false` when qualification is absent.
- CASE/CLAIM/CONTRIBUTION target consistency constraints reject mismatched claim/contribution pairs.
- BELIEVE votes never mutate Trust; five-star status never grants Expert authority; moderation never mutates Trust.

### Moderation and appeals

- Only `COMMUNITY_CONTRIBUTION` is currently actionable. Reaction/profile moderation targets are removed until an authoritative projection exists.
- Role labels alone confer no authority. Server eligibility requires authenticated principal identity, required role, active unexpired `DOMAIN_VERIFIED` qualification, at least 20 independent quality units, training pass, case scope, no suspension, no self-moderation, no reporter moderation, and no conflict of interest.
- A vote stores policy version, qualification state, quality sufficiency, verification ID/revision, COI state, eligibility result, full eligibility snapshot, moderator snapshot, and target-author snapshot.
- `recordVote` only casts an append-only vote. `finalizeCase` separately enforces the versioned policy quorum: at least two eligible independent reviewers and a 0.67 requested-action ratio.
- The request-supplied `targetAuthorId` is ignored. The author is resolved from authoritative Community contribution storage.
- Appeals are owner-scoped to the server-resolved contribution author. Appeal reviewers must be independent of the appellant, contribution author, original resolver, and conflicts.
- Audit actor/target foreign keys use retention-preserving `SET NULL` behavior where appropriate, with actor/target snapshots retained.

## Verification gates

| Gate | Result |
| --- | --- |
| `git diff --check` | PASS |
| Secret boundary/client bundle scan | PASS; 83 client bundle files scanned, zero active secret leaks |
| Changed JS/MJS syntax | PASS; 20 files checked with `node --check` |
| Typecheck | PASS; `npx tsc --noEmit` |
| Lint | PASS; 0 errors, 479 pre-existing warnings |
| Production build | PASS; Next.js compiled, TypeScript completed, 162/162 static pages generated |
| Canonical bundle budget | PASS; all 7 core routes below 500,000 bytes; largest `/settings` 454,635 bytes |
| Targeted Phase F.2/current visual/hygiene contracts | PASS; 23/23 |
| Security regression | PASS; 37/37 |
| Phase 2 auth | PASS; 10/10 |
| Live F.2 RLS/grant boundary | PASS; 2/2 |

### Discovered regression accounting

The exact `npm run test:all-discovered` runner reported:

| Metric | Count |
| --- | ---: |
| discovered | 359 test files |
| executed | 357 test files |
| passed | 357 test files |
| failed | 0 test files |
| skipped | 0 file-level skips reported by the runner |
| blocked_by_env | 2 test files |

Blocked files:

- `frontend/tests/evidence/live_web_retrieval.test.mjs`
- `frontend/tests/evidence/real_world_live_search_golden_flow.test.mjs`

The runner stripped live provider/database credentials by design and classified these external live-web suites as `BLOCKED_BY_EXTERNAL_GATE`. They were not converted to synthetic passes. The two blocked files are the sole reason the verdict is environment-blocked rather than release-ready.

## Authenticated local E2E

The disposable local run produced `FULL_AUTHENTICATED_EXPERT_LOCAL_E2E_VERIFIED`.

- Local Auth probe: HTTP 200 on loopback.
- Server network guard: `LOOPBACK_ONLY`.
- Browser cloud-Supabase guard: rejected.
- Network violations: 0.
- `mainAuthWrites`: 0.
- `mainDbWrites`: 0.
- `mainStorageWrites`: 0.
- Synthetic users: 9; Trust cases: 6; Community contributions: 6; reactions: 8.
- Expert applications: 1; verifications: 1; practice submissions: 1; assignments: 2; assessments: 1.
- Cleanup: `LOCAL_SYNTHETIC_DATA_AND_AUTH_CLEANED`; remaining synthetic users, cases, contributions, and realtime events: 0.

## Deterministic migration rehearsal

`F2_DISPOSABLE_MIGRATION_REHEARSAL_VERIFIED` passed against two disposable local databases. Twelve migrations were applied in order, ending with `202609110002_expert_v3_integrity_closure.sql`.

- Old-like fixture readback survived: `GENERAL` progression row with `adjudicated_count=4`.
- Old-like fingerprint: `fd1c9e5d36221ff95ba14f7b1cf5872cc1a08fa14bc43362f4dcb3fb355f0056`.
- Clean fingerprint: `fd1c9e5d36221ff95ba14f7b1cf5872cc1a08fa14bc43362f4dcb3fb355f0056`.
- Fingerprinted sections: 663 columns, 494 constraints, 163 indexes, 63 RLS entries, 41 policies, 166 grants.
- Direct authenticated perception insert: denied.
- Trusted-service spoofed expert flag after trigger: `false`.

No downgrade is attempted. The rollback/forward-fix strategy is: stop before applying later staging migrations, preserve the failed migration output, restore the staging snapshot if the database must return to the prior known state, diagnose the exact forward incompatibility, and ship a new corrective forward migration. No Main Supabase rollback or migration is authorized by this closure.

## Staging Supabase migration plan

1. Obtain the staging project ID, URL, operator approval, maintenance window, and a verified staging backup/snapshot. Confirm Main and staging identifiers are distinct.
2. Verify the ordered migration list and hashes through `202609110001_expert_trust_network_v3.sql`, then review the exact hash of `202609110002_expert_v3_integrity_closure.sql`.
3. Apply the migration to staging only, using the normal migration runner and a transaction-aware failure stop.
4. Inspect composite keys, target checks, indexes, RLS enablement, policies, grants, append-only triggers, FK delete behavior, and snapshot columns.
5. Run the direct authenticated spoof boundary, server-owned perception write, simultaneous-domain progression, moderation eligibility/quorum, and appeal-independence checks against staging fixtures.
6. Run authenticated staging E2E with explicit write-count and network-boundary evidence. Configure OAuth providers separately and record real provider proof before changing OAuth status.
7. If staging fails, stop and restore the staging snapshot or issue a reviewed forward correction. Do not downgrade and do not touch Main Supabase.

Google OAuth remains `EXTERNAL_CONFIG_REQUIRED` until an actual Google Client and Supabase provider configuration are proven. GitHub OAuth remains `EXTERNAL_CONFIG_REQUIRED` until an actual GitHub OAuth App and Supabase provider configuration are proven.

## CI and publication policy

`.github/workflows/competition-quality.yml` runs on pull requests and on `push` to `develop` only. A normal push to `feature/expert-trust-network-v3` does not execute this workflow. CI was not triggered for the feature-branch push, so there is no CI run SHA to verify; this is not a CI failure. The branch must not be merged to `develop` until the blocked external evidence is available and the resulting CI run is green on the exact pushed SHA.

The intended commit message is:

`fix(expert): close V3 authority and release integrity gaps`

The candidate is to be pushed normally to `origin/feature/expert-trust-network-v3` with no force push. The final handoff records `LOCAL_SHA == REMOTE_SHA` after publication.

## Stop boundary

Stop before merging `develop`, migrating Main Supabase, or deploying production. The only remaining release blocker recorded by this closure is the environment availability/authorization required for the two external live-web regression files.
