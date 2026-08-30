# Pull Request Draft — StudentHubAI National Competition RC

Status: reviewable draft only; no commit, push, or merge has been performed.
Base: `main`
Head: current local `develop` worktree (`5aeaf71870d63f3c8e06a7d8b95148ce109d3e72`)
Suggested title: **StudentHubAI National Competition Release Candidate**

Read-only remote check: `origin/develop` points to the same HEAD; `origin/main` is `251e7cb4a908c5a185be89a39301b294f9595dbf`; `origin/genspark_ai_developer` is `477857d83b666f862178472d2d86c859d00a6f2a`. No branch update or PR was created because a commit/ref and external GitHub write still require explicit authorization.

Closure baseline record: 0 staged, 288 unstaged modified files, and 199 untracked files. The worktree contains legitimate prior/session RC changes; the exact payload must be reviewed before staging.

## Proposed commit contents

One coherent RC commit (or the same payload split into small logical commits) containing only:

1. The frozen five-pillar product and shared cross-system surfaces: Trust, Community, Expert, Academic 360, Personal Command Center, Evidence Triangle, Evidence Passport, Decision Twin, `/cases`, and The Margin shell.
2. AI Gateway/provider adapters, deterministic fallback/degraded states, retrieval/source provenance, and explicit Demo Mode fixtures.
3. Security and authority hardening: Security Fabric envelopes, owner binding, SSRF/redirect/DNS checks, public DTO redaction, bounded inputs/outputs/rate state, safe logs, and the public-column migration grant correction.
4. Tests and CI/release evidence: security/final-audit tests, migration contracts, browser configuration/snapshots, bundle/API inventory scripts, and competition workflow.
5. Current release documentation: `README.md`, `FEATURE-FREEZE-REPORT.md`, `FINAL-AUDIT-REPORT.md`, `COMPETITION-DEMO.md`, and the required `docs/` reports/checkpoint.

Explicitly exclude credentials, `.env` runtime files, node modules, build/test output, Genspark/OpenCode/FUSE archives, `.codex-temp`, `.github/skills`, personal machine paths, machine-specific exports, and unreviewed screenshots. The reviewed Chromium visual-regression snapshots are an intentional test artifact and may be included with the test suite. The two accidental groups found during closure were moved to an operator-local temporary recovery directory outside the repository and are not part of the worktree.

## PR body

StudentHubAI is a frozen national-competition release candidate built around five connected pillars:

- Trust explains risk and uncertainty through a server-composed four-layer pipeline.
- Community contributes lived evidence without turning popularity into truth.
- Expert views are credential- and domain-scoped.
- Academic 360 provides deterministic source/cohort/freshness-aware planning.
- The Personal Command Center turns the evidence trail into one Next Clear Move.

Evidence Passport and Student Decision Twin preserve revisions, ownership, assumptions, and review state. Evidence Triangle keeps Official, Community, and Expert sources distinct. The Margin provides the shared production shell. The AI Gateway routes bounded, schema-validated capabilities with explicit degraded states.

Local evidence: 250/250 discovered tests, final audit 6/6, security suites pass, 115/115 production routes, typecheck/build/bundle/dependency gates pass, Chromium/WebKit/mobile local coverage pass, explicit Demo Mode Trust rehearsal 3/3, and visual target 3/3. Lint exits with 0 errors and 359 legacy warnings.

External limitations are intentionally visible: live PostgreSQL/RLS/restart proof, staging deployment/rollback, fresh provider secrets/terms/cost/health, and Firefox on the current Windows host. See `FINAL-AUDIT-REPORT.md` section 35 for the release gate matrix.

## Review checklist

- [ ] User reviews the proposed commit contents and authorizes commit.
- [ ] User confirms the desired head branch/ref for the PR; current local reality is `develop`.
- [ ] Disposable database/RLS proof attached, or `BLOCKED_BY_ENV` retained.
- [ ] Staging/provider/rollback evidence attached, or the documented blocker retained.
- [ ] Firefox CI/runtime evidence attached, or `BLOCKED_BY_ENV_FIREFOX` retained.
- [ ] Commit created only after explicit authorization.
- [ ] PR opened from the authorized ref; merge remains a separate user decision.
