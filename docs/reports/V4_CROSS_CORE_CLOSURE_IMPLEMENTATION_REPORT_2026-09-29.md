# StudentHub AI V4 Cross-Core Closure — 2026-09-29

## Verdict

```text
V4_CROSS_CORE_CLOSURE_IMPLEMENTATION_VERDICT = PASS
A — AI REVISION / PROVENANCE = PARTIAL_CONTRACT_BOUND
B — TRUST → EXPERT + 8 DEMO IDENTITIES = PASS
C — 360 OVERFLOW + LINT + CHROME/FIREFOX = PASS
LIVE_ASSURANCE = DEFERRED
```

The overall implementation gate passes with the explicitly permitted contract-bound partial for Omni chat. Trust V5 L4 already returns structured, validated citation DTOs with persisted case/run identity; the general Omni `/api/chat` endpoint returns assistant text and provider metadata only, without structured citations or revision-bound product context. The UI does not invent either contract.

## A — AI revision and provenance

- Trust V5 `publicAiVerification` projects structured `citationsUsed`, support/contradiction source IDs, URL validation counts, and link status. The persisted response carries `caseId`, `caseRevision`, `runId`, and persistence state.
- `projectTrust` now joins safe AI citation URLs to Trust sources/evidence, determines their relation, and marks provenance revision-bound only when persistence, UUID case identity, positive revision, and run identity are all present.
- Trust result UI shows the AI citation trail separately from evidence, labels support/contradiction and validation status, and displays the persisted Trust revision. Unsafe URL schemes and credential-bearing URLs are excluded.
- The separate Omni chat route returns `content: result.text`; it has no `citationsUsed`, `citationValidation`, `caseRevision`, or `runId` contract. Therefore A remains `PARTIAL_CONTRACT_BOUND` for Omni. Adding citations in the frontend would misrepresent backend output.
- Verification: Trust projection tests cover revision binding, citation-to-source relation, unsafe URL filtering, and unpersisted responses. A source-contract test preserves the distinction between Trust L4 structured provenance and Omni text-only chat.

## B — Trust to Expert and demo identities

- Trust-to-Expert UI sends the selected Trust `caseId`, persisted `caseRevision`, and selected `claimId`. The isolated browser flow verified the submitted request body and the displayed revision.
- Repository contract checks verify case/revision scope and the optional published Community contribution's matching case, revision, and claim before linkage.
- `DEMO_ACCOUNT_INVENTORY.json` contains exactly eight enabled identities: four `USER` and four `EXPERT`, with no credential fields. The existing `TRUST_8_DEMO_ACCOUNT_MATRIX.md` records PASS for all eight identities.
- The historical account matrix was inspected but the eight logins were not rerun in this closure. This pass did not use staging or database credentials; `LIVE_ASSURANCE` remains deferred.

## C — 360px, lint, Chromium, Firefox

- Fixed the 360px app-header overflow for both authenticated and anonymous states. The anonymous compact header now stays within the viewport.
- Playwright ran the same isolated production suite in Chromium and Firefox: **9/9 passed in each browser**. The suite includes Trust AI provenance, Trust-to-Expert request scope, Community preview, difficult Trust outcomes, validation/upload states, accessibility checks, and responsive layout.
- Responsive assertions cover 7 widths (`360, 390, 768, 1024, 1280, 1440, 1920`) × 3 themes (`light, midnight, system`) = **21 combinations per browser**, with zero horizontal overflow. A separate anonymous Midnight 360px case also passes in both browsers.
- `agent-browser` production smoke at 360×844 confirmed `documentWidth = 360`, `horizontalOverflow = false`, and Midnight theme. Screenshot: `artifacts/visual/V4_CROSS_CORE_CLOSURE/2026-09-29/agent-browser-360-midnight-anonymous.png`.
- Focused ESLint over all changed implementation and test files: **0 errors, 0 warnings**. The broader Trust lint target exits successfully with 0 errors and four existing `<img>` warnings in `CommunityComposer.jsx` and `CommunitySocialWorkspace.jsx`, which were outside this closure's edits.
- Isolated production build succeeded; Next generated **142/142** static pages.
- Hermetic Node contract/model tests: **11/11 passed**.

## Evidence

All browser runs used the disposable mirror at `artifacts/lab/trust-v4/frontend`. The runner passes only a small operating-system environment allowlist and does not copy `.env.local` or `.env.staging.local` into the mirror.

- Production build: `artifacts/visual/V4_CROSS_CORE_CLOSURE/2026-09-29/build.status.json` and `build.log`.
- Cross-browser summary: `artifacts/visual/V4_CROSS_CORE_CLOSURE/2026-09-29/cross-browser.status.json`.
- Per-browser logs, statuses, 33 screenshots, and screenshot manifests: `artifacts/visual/V4_CROSS_CORE_CLOSURE/2026-09-29/chromium/` and `.../firefox/`.
- Final anonymous mobile smoke screenshot: `artifacts/visual/V4_CROSS_CORE_CLOSURE/2026-09-29/agent-browser-360-midnight-anonymous.png`.

## Assurance boundary

No staging sign-in, staging database operation, migration, provider request, or deployment was performed for this closure. Browser E2E APIs use isolated fixtures; the standalone `agent-browser` smoke hit only the local production mirror and its local shell/realtime endpoints, with no project credentials. `LIVE_ASSURANCE = DEFERRED`.

No commit was created. The branch remains `frontend/v4-three-core-redesign`; the pre-existing dirty worktree and unrelated artifacts were preserved.
