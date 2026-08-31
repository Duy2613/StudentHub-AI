# StudentHub AI Agent Skill Registry

**STACK_VERIFIED:** 2026-08-28
**Policy:** minimum overlap, maximum coverage, version safe, auditable, reversible, project local
**Canonical location for newly approved skills:** `.github/skills/<skill-name>/`

This registry is the authority for which repository-local skills are active. A directory being present does not make a skill active by default.

## A. Current stack

### VERIFIED

| Area | Repository reality |
|---|---|
| Application | `frontend/` is the product application; the root package delegates common commands to it |
| Framework | Next.js 16.3.0, App Router |
| UI runtime | React and React DOM 19.2.8 |
| Language | TypeScript 5.x, strict mode enabled; JavaScript is also allowed |
| Styling | Tailwind CSS 4 through `@tailwindcss/postcss`, plus repository semantic CSS/tokens |
| Components | Custom components and Lucide icons; no installed shadcn component package |
| State | React state/context; no general-purpose external state store detected |
| Data and AI | Native `fetch`/typed API clients, Supabase 2.112.3, AI SDK 7, `@ai-sdk/react` 4 |
| Validation | Zod 4.4.3 |
| Motion/visuals | Motion/Framer Motion 13.1.1, GSAP 3.15, Lenis 1.3, Three.js/React Three Fiber/Spline |
| Tests | Node tests, Playwright 1.62.1, `@axe-core/playwright` 4.13.0 |
| Quality | ESLint 9 with `eslint-config-next` 16.3; no formatter configuration detected |
| Lockfile | npm lockfile at `frontend/package-lock.json` |
| Deployment config | `vercel.json` exists |
| Repository rules | Root and frontend `AGENTS.md` and `CLAUDE.md`; permanent context under `docs/vault/` |

### INFERRED

- Vercel is an intended deployment target because `vercel.json` exists.
- The checked-in `.agents/skills/` collection is intended for agents that discover that path; `.github/skills/` is the canonical location for the six skills added by this audit.
- The design phase is mature/locked enough that broad redesign skills should be opt-in, not automatic.

### UNKNOWN

- Whether the current production/staging deployment is actively connected to a Vercel account.
- Whether paid GitHub Secret Protection or Dependabot services are enabled for this repository.
- Whether every agent runtime used by the team automatically discovers `.github/skills/`; agents that do not must be configured to reference the canonical copy rather than maintain an independent copy.
- No checked-in CI workflow, `.github/copilot-instructions.md`, `.agent/`, `.claude/`, `.cursor/`, repository MCP configuration, or `CODEX.md` was found during this audit.

## B. Existing skill and instruction inventory

### Instructions and configuration

| Item | Purpose | Owner/source | Status and risk |
|---|---|---|---|
| `AGENTS.md`, `CLAUDE.md` | Repository-wide agent rules and vault routing | Repository | KEEP; higher authority than skills |
| `frontend/AGENTS.md`, `frontend/CLAUDE.md` | Frontend-specific rules, including local Next.js documentation guidance | Repository | KEEP; higher authority than skills |
| `.agents/DESIGN.md` | Product design system | Repository | KEEP; prevents generic redesign drift |
| `docs/vault/` | Architecture, design, session context and roadmap | Repository | KEEP; mandatory context |
| `skills-lock.json` | Records 13 imported skill paths/content hashes | Repository/Leonxlnx sources | CONDITIONAL; it lacks exact commit, license and audit metadata. Its hash format could not be reproduced using raw-file SHA-256, so integrity is not independently verifiable from this file alone; this is not evidence of tampering |
| MCP/agent prompt configs | None detected beyond files above | — | UNKNOWN/not present |

### Pre-existing `.agents/skills`

All 19 entries contain instruction documents only; no bundled executable scripts were found. No entry was deleted or moved.

| Skill | Primary purpose | Provenance | Decision | Overlap/conflict/risk |
|---|---|---|---|---|
| atomic-design-tokens | Semantic tokens and component architecture | Repository-local, not in `skills-lock.json` | KEEP | Primary design-system implementation guardrail |
| enterprise-nextjs-cursorrules | Next 16/React 19/Tailwind 4 architecture | Repository-local, not in lock | KEEP | Compatible; repository reality still wins |
| spec-driven-development | State/error matrices before implementation | Repository-local, not in lock | KEEP | Use for non-trivial behavior changes, not tiny edits |
| design-dna | Typography/layout design rules | Repository-local, not in lock | CONDITIONAL | Overlaps several taste/design skills |
| cinematic-motion-experience | Premium motion patterns | Repository-local, not in lock | CONDITIONAL | Can create performance/scope drift |
| creative-3d-webgl-engine | Three/WebGL engineering | Repository-local, not in lock | CONDITIONAL | Only for explicit 3D work; GPU/performance risk |
| brandkit | Brand image direction | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Visual-only specialist; provenance not reproducibly pinned |
| design-taste-frontend | Broad frontend redesign guidance | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | 88 KB instruction load; overlaps most design skills and contains dependency-install suggestions |
| design-taste-frontend-v1 | Legacy redesign guidance | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Duplicates v2 and may instruct package installation |
| full-output-enforcement | Exhaustive output behavior | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Agent-behavior policy, not a product engineering role |
| gpt-taste | GSAP/editorial UI direction | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Overlaps motion/design skills; aesthetic scope risk |
| high-end-visual-design | Premium visual design rules | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Overlaps design system and redesign skills |
| image-to-code | Image-first UI implementation | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Heavy workflow; may conflict with existing locked design |
| imagegen-frontend-mobile | Mobile screen image concepts | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Image-only and outside current web task unless requested |
| imagegen-frontend-web | Web design reference images | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Overlaps image-to-code/redesign skills |
| industrial-brutalist-ui | Specific visual style | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Style conflicts with established product language |
| minimalist-ui | Specific visual style | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Style conflicts with other visual-direction skills |
| redesign-existing-projects | Broad redesign workflow | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | High overlap and feature/design drift risk |
| stitch-design-taste | Stitch design-system generation | `Leonxlnx/taste-skill`; exact ref absent | CONDITIONAL | Tool-specific; overlaps current design rules |

## C. Recommended skill stack and candidate decisions

| Candidate | Decision | Reason |
|---|---|---|
| `react-best-practices` | ADD | Official Tier A performance guidance compatible with React 19/Next 16; no package added |
| `composition-patterns` | ADD | Focused component API role; React 19-aware |
| `acquire-codebase-knowledge` | ADD | Repeatable codebase discovery with a reviewed, standard-library-only scanner |
| `webapp-testing` | ADD | Real-browser workflow complements the installed Playwright/axe stack |
| `security-review` | ADD | Static security review with no external service dependency |
| `agent-supply-chain` | ADD | Unique governance role for future external skill/plugin evaluation |
| `web-design-guidelines` | REJECT | Fetches a floating `main` URL at invocation time; duplicates existing design rules and violates pinned/offline policy |
| `web-design-reviewer` | REJECT | Overlaps existing design/a11y and browser QA; example invokes `@playwright/mcp@latest` |
| `agent-skill-stack` | REJECT | Duplicates governance/discovery, bundles five scripts, and encourages broad external discovery/CLI execution |
| `secret-scanning` | CONDITIONAL | Enable only after confirming GitHub Secret Protection/account integration; never expose secret values |
| `dependabot` | CONDITIONAL | Enable only with explicit authorization to add GitHub automation configuration |
| `scoutqa-test` | REJECT | External service/global latest CLI duplicates existing Playwright coverage |
| AgentRC assess/generate skills | REJECT | Unpinned `npx github:` execution and possible instruction replacement/deletion conflict with repository rules |
| `react-view-transitions` | CONDITIONAL | Only for an explicit transition task after compatibility review |
| `vercel-optimize` | CONDITIONAL | Only after active Vercel deployment/account is verified and the task concerns cost/performance |
| Tier B community candidates | REJECT for current stack | No unique uncovered role remains after Tier A selection; importing them would add provenance and conflict surface |

### Tier B candidate pool: `PyModel/react-frontend-skills`

Audit date: 2026-08-28. Candidate checkout: `aec25a43f4c03e45865d198409f28ba9dcf9c67f` (2026-08-20). License: MIT. Decision: **CANDIDATE_ONLY — DO NOT INSTALL AS A PACK**.

The audited tree contains 764 files (about 1.94 MB) and 18 skills. Skill folders contain Markdown guidance only. The optional MCP subpackage contains seven JavaScript/MJS source, packaging and test files; its dependency ranges are `@modelcontextprotocol/sdk ^1.30.0`, `yaml ^2.9.0`, and `zod ^4.4.3`. The packaging smoke script runs `npm pack` and a temporary `npm install --ignore-scripts`; none of these scripts were executed during the audit. No symlink/reparse point or binary was found.

| Candidate subset | Repo compatibility | Decision |
|---|---|---|
| `react`, `vercel-react-best-practices` | React 19.2 matches | REJECT duplicate: official pinned Vercel skill already owns this role |
| `vercel-composition-patterns` | React 19 matches | REJECT duplicate: official pinned Vercel skill already installed |
| `nextjs` | Next 16 matches | CONDITIONAL candidate only; local Next 16 docs and repository architecture currently cover the role |
| `tailwind` | Tailwind 4.3 matches | CONDITIONAL candidate only; atomic tokens and existing CSS architecture remain authoritative |
| `zod` | Zod 4.4.3 exactly matches | CONDITIONAL candidate only for a future schema-heavy task with a demonstrated guidance gap |
| `playwright` | Playwright 1.62.1 exactly matches | REJECT duplicate: approved `webapp-testing` plus local E2E suite cover the role |
| `typescript` | Pack targets TypeScript 7; repo resolves TypeScript 5.9.3 | REJECT version-incompatible guidance |
| `shadcn` | shadcn package not installed | REJECT irrelevant; do not introduce a component library |
| `vitest`, `msw`, `tanstack-query`, `react-hook-form`, `nuqs` | Libraries not installed | REJECT until the repository independently adopts the library |
| `feature-arch` | General patterns partly fit | REJECT active use: conflicts with the mature repository domain layout and would encourage architecture drift |
| `tdd` | Framework-neutral | REJECT duplicate: existing spec-driven workflow and tests cover the responsibility |
| `ui-design` | Broadly applicable | REJECT duplicate: local design contract, atomic tokens and conditional redesign audit cover it |
| `web-design-guidelines` | Dynamically fetches floating upstream guidance | REJECT under pinned/offline policy |

Promotion rule: import at most one individually reviewed skill directory at an exact commit, never the npm package, MCP package, global CLI install or `--all` installer. Re-run the conflict and version audit before promotion.

## D. Conflict matrix

| Area | Primary authority/skill | Conflicting advice | Resolution |
|---|---|---|---|
| Product scope | User requirements + vault | Any design/performance skill proposing new features | Reject the suggestion |
| Architecture | Repository rules + real dependencies | Generic skill architecture or framework upgrade | Keep current Next 16/React 19 architecture |
| React performance | `react-best-practices` | Examples mentioning absent SWR or helper packages | Apply the principle without adding a dependency; local API architecture wins |
| Component APIs | `composition-patterns` | Broad claims such as replacing all context or refs | Invoke only for explicit API/refactors; verify against React 19 docs and existing code |
| Design system | `atomic-design-tokens` + `.agents/DESIGN.md` | Taste/style/redesign skills | Design system wins; specialist style skills remain opt-in |
| Testing | `webapp-testing` | Skill text offering to auto-install Playwright | Use pinned local Playwright 1.62.1; no install/upgrade |
| Security | `security-review` | Tool-specific secret/dependency services | Local review first; external integrations require authorization |
| Skill governance | `agent-supply-chain` + this registry | `agent-skill-stack` or community discovery | Exact-ref review and registry are mandatory before import |
| Agent instructions | Root/subtree `AGENTS.md` and `CLAUDE.md` | Generated AgentRC instructions | Existing repository instructions win |

Authority order: user-approved requirements → repository architecture/explicit local rules → real dependency versions → official framework documentation → project `AGENTS.md` → approved Tier A skills → approved Tier B skills → general model knowledge.

## E. Supply-chain risks and controls

- New skills were copied from exact commits; no floating branch or release is used.
- No remote pipe execution, npm install, postinstall, package modification, or downloaded script execution occurred.
- Installed trees match the audited upstream trees byte-for-byte and contain no symlinks/reparse points or binaries.
- `react-best-practices` is large (76 files, about 230 KB) and can overload agent context if loaded indiscriminately. Trigger it only for React/Next performance work and open only relevant rules.
- The Vercel selected skill frontmatter declares MIT, but the audited repository checkout did not expose a root `LICENSE`; preserve this caveat in future upgrades.
- `acquire-codebase-knowledge/scripts/scan.py` uses Python standard library, read-only Git commands, reads repository metadata/templates, and writes only to an explicitly requested output. It must not be aimed at real `.env`/secret files.
- `webapp-testing/assets/test-helper.js` contains wait, console, and screenshot helpers only. The skill's generic auto-install advice is disabled here because Playwright is already pinned locally.
- Existing Leonxlnx skills have no exact upstream commit in `skills-lock.json`; treat them as dormant/conditional until re-audited and pinned.
- Upstream guidance can become stale. Re-audit exact diffs before changing any pinned ref.

## F. Exact installation record and reversible plan

The approved installer copied these project-local directories. No package manifest or lockfile was changed.

| Local directory | Source path | Exact commit | License | Files / scripts | Tree fingerprint (SHA-256 over sorted path+file hashes) |
|---|---|---|---|---|---|
| `.github/skills/react-best-practices` | `vercel-labs/agent-skills/skills/react-best-practices` | `20e89cc4bb256eb7b1fcbdc68f7175284709a847` | MIT in skill metadata | 76 / none | `7b7baa2e5d9385c8d3fe2c2c936b4e7b2ff608d8552e2eba7cf9b8c199738799` |
| `.github/skills/composition-patterns` | `vercel-labs/agent-skills/skills/composition-patterns` | `20e89cc4bb256eb7b1fcbdc68f7175284709a847` | MIT in skill metadata | 14 / none | `9effc9aec5b507d3c3b6dc3c429aa6ac28ba28502507c2f3bb15bfa5638861d8` |
| `.github/skills/acquire-codebase-knowledge` | `github/awesome-copilot/skills/acquire-codebase-knowledge` | `f11a4e441c5ff061b4f8ae37952be8c602e4034e` | MIT | 11 / `scripts/scan.py` | `798483074f1affefc62220dd899765cea27c0e668783b5dc4c7d8447842dc57e` |
| `.github/skills/webapp-testing` | `github/awesome-copilot/skills/webapp-testing` | `f11a4e441c5ff061b4f8ae37952be8c602e4034e` | MIT | 2 / `assets/test-helper.js` | `9b0c0a4d3fbc61d444ee72a71e0fe2e7c2cbd2e02ce618523fb8549d069a4e20` |
| `.github/skills/security-review` | `github/awesome-copilot/skills/security-review` | `f11a4e441c5ff061b4f8ae37952be8c602e4034e` | MIT | 6 / none | `b9a9d7b805c24392978829f7727440150b0d0a33f0651b15d563e38c7da69c95` |
| `.github/skills/agent-supply-chain` | `github/awesome-copilot/skills/agent-supply-chain` | `f11a4e441c5ff061b4f8ae37952be8c602e4034e` | MIT | 1 / none | `3baafed7e7d8a93a43ab79f39e35d8abe87a7bb7eae2eff991d2d213bcf1a4ac` |

Upgrade procedure: clone/fetch the official source into a temporary directory → resolve an exact commit → review the diff, license, all scripts, dependencies, network and shell instructions → copy with the approved installer → verify exact tree equality → update fingerprints and audit date here. Never update from a floating branch directly.

Rollback procedure: after explicit approval, remove only the six directories listed above and this registry entry. There are no package or runtime changes to reverse. Do not delete or duplicate `.agents/skills/` as part of rollback.

## G. Final active skill matrix

| Primary responsibility | Active skill | Automatic trigger | Conflicts/guardrail | Status |
|---|---|---|---|---|
| Codebase discovery | `acquire-codebase-knowledge` | Unfamiliar repository/module or explicit architecture inventory | Never scan real secret files | ACTIVE, project-local |
| React/Next performance | `react-best-practices` | React/Next implementation or performance review | No dependency/framework upgrades; load relevant rules only | ACTIVE, scoped |
| Component API design | `composition-patterns` | Explicit reusable component/API refactor | Existing APIs and React docs win | ACTIVE, scoped |
| Design tokens/components | `atomic-design-tokens` | UI component/theme implementation | `.agents/DESIGN.md` is authoritative | ACTIVE, existing |
| Next.js architecture | `enterprise-nextjs-cursorrules` | Next.js architecture/change work | Real installed versions and local Next docs win | ACTIVE, existing |
| Behavioral specification | `spec-driven-development` | Non-trivial full-stack behavior/change | Avoid ceremony for tiny edits | ACTIVE, existing |
| Browser/E2E/a11y QA | `webapp-testing` | Browser behavior or regression verification | Use existing Playwright/axe only | ACTIVE, scoped |
| Security review | `security-review` | Explicit security review or security-sensitive code | Report evidence; do not mutate unless asked | ACTIVE, scoped |
| Skill supply-chain governance | `agent-supply-chain` | Evaluating an external skill/plugin/agent | Exact commit and human-readable audit required | ACTIVE, scoped |

All other pre-existing design/image/motion skills are **PRESENT BUT CONDITIONAL**. They are activated only when explicitly named or when a narrowly matching visual task requires them; they must not be stacked together by default.

## H. Final conflict review

- Each active skill has one primary role; no two active skills own the same responsibility.
- Repository rules, vault architecture, real versions and product requirements override every skill.
- No skill grants authority to add product scope, upgrade frameworks, install packages, change APIs, weaken typing, bypass tests, hide errors or delete functionality.
- No canonical skill was duplicated across `.github/skills/` and `.agents/skills/`; cross-agent synchronization is documented rather than hidden behind Windows-unfriendly symlinks.
- The installed set is available to agents that discover `.github/skills/` on their next task/turn. Discovery by other runtimes remains an integration question, not a reason to duplicate files.
