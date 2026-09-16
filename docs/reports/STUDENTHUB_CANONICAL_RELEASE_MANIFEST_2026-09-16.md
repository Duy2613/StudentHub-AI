# StudentHub AI — Canonical Release Manifest

Snapshot date: 2026-09-16 (Asia/Bangkok)

## Git snapshot before release work

| Field | Value |
|---|---|
| Current branch | `implementation/academic-cinematic-v1-f00` |
| Current local HEAD | `39c4ef3b9f48e73c2b301f3e0d9856e871c04418` |
| Staged files before release work | `0` |
| Tracked modified files | `94` |
| Untracked files | `881` |
| Remote implementation SHA observed | `637bb195f7b77af8eaa71a22795bac8d698513ac` |
| Remote `main` SHA observed | `9ceb5ba7b8993e63cbcc8a43f5c42c57b2530ca8` |
| Worktree state | `DIRTY_OWNER_WORK_PRESERVED` |

The snapshot was read before staging, committing, pushing, merging, or changing
Vercel production. No reset, clean, restore, force push, or blind stash is part
of this release process.

## Initial file classification

### A — Intended production product code (candidate allowlist)

Candidate files are limited to reviewed runtime/product changes under
`frontend/src/`, reviewed database schema/migrations, required non-secret
environment examples, reviewed runtime scripts, and the product contract tests
that directly protect those changes. `frontend/public/media/` is included only
where the current product source references the asset and the asset is safe to
ship.

### B — Generated audit evidence

`artifacts/`, screenshots, videos, zip packs, test result directories, generated
status snapshots, generated route inventories, and release/audit reports are
evidence rather than runtime source. They remain outside the clean release
allowlist unless a specific report is intentionally versioned after secret
review.

### C — Local-only tooling and scratch material

Capture scripts, one-off audit/reconciliation scripts, local probes, generated
media pipelines, and other files that are not imported by the production app
remain local unless a reviewed dependency proves they are required for the
release.

### D — Secrets and environment material

`.env.local`, secret values, provider keys, database URLs, service-role values,
OAuth secrets, session peppers, and tokens are excluded from staging and are
not printed or copied into evidence. Environment examples may contain names and
placeholders only.

### E — Unrelated owner work

Existing owner documents, vault/plugin material, unrelated reports, and files
whose intent cannot be established from the canonical product source remain
untouched and unstaged. This includes the broad pre-existing artifact/evidence
collection in the dirty worktree.

## Release identity target

The intended release must establish this invariant before it can be called
aligned:

`LOCAL_RELEASE_SHA = GITHUB_MAIN_SHA = VERCEL_PRODUCTION_SOURCE_SHA = CANONICAL_DOMAIN_DEPLOYMENT_SHA`

Canonical targets:

- GitHub repository: `Duy2613/StudentHub-AI`
- Canonical branch: `main`
- Vercel project: `student-hub-ai`
- Canonical domain: `https://student-hub-ai-topaz.vercel.app`
- Secondary project: `student-hub-ai-weje` — inspect/classify only; do not mutate

This manifest is an audit record of the pre-release state. The final release
report must update the actual release, preview, main, production, domain, test,
secret-scan, and rollback evidence without exposing secrets.
