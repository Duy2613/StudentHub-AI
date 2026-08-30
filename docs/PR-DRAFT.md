# Pull Request Draft — StudentHubAI National Competition RC

Status: reviewable draft; final head pushed to `develop`; merge to `main` has not been performed.
Base: `main`
Head: `develop` (`ad04de7980e26d6e3b1a68096ad97b0aea3be01b`)
Suggested title: **StudentHubAI National Competition Release Candidate**

Remote check: `origin/develop` points to the same final head; `origin/main` remains `251e7cb4a908c5a185be89a39301b294f9595dbf`. PR #2 is open/draft against `main`; no merge was performed.

Closure record: final worktree is clean. Surgical release fixes are recorded in `e4c75e1`, `d2bb044`, `fbda772`, and `ad04de7`.

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

Local evidence: 252/252 discovered tests, final audit 6/6, security suites pass, 115/115 production routes, typecheck/build/bundle/dependency gates pass, Chromium/WebKit/mobile local coverage pass, explicit Demo Mode Trust rehearsal 3/3, and visual target 3/3. Lint exits with 0 errors and 359 legacy warnings. The new ExpertStore read-only-runtime regression test passes.

Remote evidence: GitHub Actions push [33302735122](https://github.com/Duy2613/StudentHub-AI/actions/runs/33302735122) and PR [33302736663](https://github.com/Duy2613/StudentHub-AI/actions/runs/33302736663) are green, including Chromium + Firefox Linux. Vercel previews are Ready; the public competition target is [student-hub-ai-weje-git-develop-vi-be-city.vercel.app](https://student-hub-ai-weje-git-develop-vi-be-city.vercel.app).

External limitations are intentionally visible: live PostgreSQL/RLS/restart proof, operator-owned staging case JSON, fresh provider secrets/terms/cost/health, deployment rollback control, and Firefox on the current Windows host. See `FINAL-AUDIT-REPORT.md` section 35 for the release gate matrix.

## Review checklist

- [x] User authorized the surgical RC closure commits and non-force push.
- [x] Final head branch/ref is `develop`; PR #2 base remains `main`.
- [ ] Disposable database/RLS proof attached, or `BLOCKED_BY_ENV` retained.
- [ ] Staging/provider/rollback evidence attached, or the documented blocker retained.
- [x] Firefox Linux CI evidence attached; Windows host parity remains `BLOCKED_BY_ENV_FIREFOX`.
- [x] Commits were created only after explicit authorization.
- [x] PR #2 is open from the authorized ref; merge remains a separate user decision.
