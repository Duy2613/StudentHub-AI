# Canonical Recovery Matrix — Trust Reference Unification

Snapshot: 2026-10-01 (Asia/Bangkok). This matrix supplements `FULL_SOURCE_UNIFICATION_MATRIX.md` and `FULL_COMMIT_PROVENANCE_MATRIX.md`, which already inventory the earlier 57 refs and retained worktrees. It records the current dirty-checkout comparison before implementation.

## User request and scope boundary

- Direct request: use the attached full-system prompt as the scope, and treat the four visible Trust commits (`80351be`, `554e8e7`, `4bfd4e9`, `3d52e6c`) as a recoverable implementation reference for rebuilding the Trust presentation. The user clarified that the attached prompt is the remainder of the earlier unfinished sentence.
- The screen recording and those commits guide the Trust UI/backend integration; the attached runbook remains the full-product execution contract. Do not reduce the work to a visual-only redesign.
- Reference screen contract: four backend-driven stages—Deterministic Screen; Threat & Semantic Intelligence; Evidence Retrieval; Synthesis & Reasoning—followed by a separately represented deterministic Final Predict. The interface must show unavailable/locked data honestly and must not advance stages with client timers.
- Safety boundary from the runbook: direct SQL and service-role bypass are prohibited. Production DDL, live mutations, Main promotion, deployment, canary, and the final provider campaign are conditional on their explicit release gates. The current backup/PITR and production schema blockers fail those conditions, so none has been performed in this continuation. Tavily remains OFF with a zero-call budget.

## Git and worktree inventory

| Source | Revision / state | Classification | Action |
|---|---|---|---|
| `origin/main` | `595a99110367aefb545b02dab4b9f9a5a6106ab6` | `MAIN_NEWER` relative to old checkpoint; release base retained | Do not promote until production gates pass. |
| `origin/release/studenthub-full-sync-20261001` | `70e0927f4fe2ce4c726227d84aae85f6dcb595de` | `KEEP_CANONICAL_CANDIDATE` | Continue work in its clean dedicated worktree. |
| User checkout `C:/Users/Duy/Projects/MyProj/StudentHub-AI` | `8c474ee0634488410a8e8ecf33551642f9bcf3f5`, branch `checkpoint/studenthub-v5-2026-09-29`; 2,028 status entries, including 66 relevant source/test/script paths | `LOCAL_ONLY` until reviewed | Preserve untouched; generated artifacts, logs, screenshots, local migration seeds and personal outputs are not release payloads by default. |
| `D:/StudentHub-CodexRuns/FULL_SCHEMA_SYNC_20261001/release-worktree` | `70e0927f4fe2ce4c726227d84aae85f6dcb595de`; clean at inventory | `KEEP_CANONICAL_CANDIDATE` | Use as the isolated implementation checkout. |
| Other historical worktrees and refs | Enumerated in the existing source/provenance matrices; several old worktree metadata entries are prunable or point to absent paths | `PATH_INVENTORY_ONLY` / `LOCAL_ONLY` | No cleanup and no blind cherry-picks. |

`git fetch origin` completed before this comparison. Root and release worktrees share the same repository object database; the dirty root checkout was read only.

## Dirty root checkout source comparison

Comparison is byte-based between each relevant root working file and the clean release checkout. It is an inventory, not semantic approval.

| Classification | Count | Rule |
|---|---:|---|
| `KEEP_CANONICAL_ALREADY_PRESENT` | 38 | Root content is byte-identical to the release checkout; no copy required. |
| `MERGE_SEMANTICALLY` | 21 | Both paths exist but differ; review behavior and tests before porting. |
| `LOCAL_ONLY_PRESERVE` | 7 | Root-only scripts/tests; retain in place until safety and reproducibility are reviewed. |

### `KEEP_CANONICAL_ALREADY_PRESENT` — 38 paths

`frontend/src/app/api/v1/trust/route.js`; `frontend/src/components/expert/ExpertWorkspaceClient.jsx`; `frontend/src/components/layout/UnifiedAppShell.jsx`; `frontend/src/components/trust/TrustMasterUltraJourney.jsx`; `frontend/src/lib/ai-trust/FriendBackendTrustOrchestrator.js`; `frontend/src/lib/ai-trust/OwnBackendTrustOrchestrator.js`; `frontend/src/lib/ai-trust/TrustOrchestrator.js`; `frontend/src/lib/ai-trust/integrations/legacyVerification/FriendBackendTavilyFallback.js`; `frontend/src/lib/ai-trust/layer3/Layer3EvidenceService.js`; `frontend/src/lib/ai-trust/layer3/extractors/EvidenceExtractor.js`; `frontend/src/lib/ai-trust/layer3/registry/SourceAuthorityRegistry.js`; `frontend/src/lib/ai-trust/layer3/retrieval/TavilyRetriever.js`; `frontend/src/lib/ai-trust/layer3/retrieval/WebSearchRetriever.js`; `frontend/src/lib/ai-trust/layer3/types.js`; `frontend/src/lib/ai-trust/v5/MasterUltraTrustModel.js`; `frontend/src/lib/ai-trust/v5/contracts.js`; `frontend/src/lib/ai-trust/v5/stageAdapters.js`; `frontend/src/lib/security/hardening/SafeRemoteUrl.js`; `frontend/src/lib/server/expert/ExpertQuestionBankService.js`; `frontend/src/lib/server/trust/DecisionTwinService.js`; `frontend/tests/e2e/academic-cinematic-closure.spec.ts`; `frontend/tests/e2e/expert-v4-isolated-visual.spec.ts`; `frontend/tests/evidence/real_world_live_search_golden_flow.test.mjs`; `frontend/tests/integration/trust_orchestrator_render_backend.test.mjs`; `frontend/tests/platform/test_runner_contract.test.mjs`; `frontend/tests/security/final_audit_hardening.test.mjs`; `frontend/tests/trust/input_context_retrieval.test.mjs`; `frontend/tests/trust/layer3_evidence_boundary.test.mjs`; `frontend/tests/trust/master_ultra_contract.test.mjs`; `frontend/tests/trust/own_backend_four_layer.test.mjs`; `frontend/tests/trust/tavily_retriever_boundary.test.mjs`; `frontend/tests/trust/trust_v5_golden_flow.test.mjs`; `frontend/tests/vnext_bird_atmosphere_contract.test.mjs`; `frontend/tests/vnext_scope_contract.test.mjs`; `frontend/tests/vnext_shell_contract.test.mjs`; `frontend/tests/vnext_trust_contract.test.mjs`; `frontend/tests/vnext_typography_contract.test.mjs`; `scripts/run-discovered-tests.mjs`.

### `MERGE_SEMANTICALLY` — 21 differing paths

| Path | Review note / initial action |
|---|---|
| `frontend/scripts/run-v4-three-core-e2e.mjs` | Review test selection and cleanup boundaries. |
| `frontend/scripts/staging/start-local-staging.mjs` | Review process ownership and staging target before use. |
| `frontend/src/app/globals.css` | Review token/surface deltas; retain release styles unless a specific fix is justified. |
| `frontend/src/lib/server/trust/TrustV5Engine.js` | Review the one-line delta against the tested candidate contract. |
| `frontend/src/lib/ai-trust/TrustCapabilityRouter.js` | Review provider capability boundaries and Friend Trust advisory-only behavior. |
| `frontend/src/lib/ai-trust/layer3/registry/CanonicalAuthorityCatalog.js` | Review domains, organization identities and authority scoring before adoption. |
| `frontend/src/lib/ai-trust/layer3/registry/canonicalDomainMatch.js` | Review host normalization and registrable-domain boundary. |
| `frontend/tests/e2e/ai-omni-v4-isolated.spec.ts` | Review route coverage and expected UI assertions. |
| `frontend/tests/e2e/trust-v4-isolated.spec.ts` | Review fixture/live distinction and state assertions. |
| `frontend/tests/expert/expert_v5_contract.test.mjs` | Review removed assertions against the current Expert contract. |
| `frontend/tests/expert/expert_v5_live_readonly.test.mjs` | Review read-only guarantees and environment gates. |
| `frontend/tests/platform/canonical_api_runtime.test.mjs` | Review route inventory deltas. |
| `frontend/tests/platform/canonical_v1_api_contract.test.mjs` | Review Trust API contract deltas. |
| `frontend/tests/security/mixed_auth_csrf_identity_source.test.mjs` | Review security coverage before changing or replacing it. |
| `frontend/tests/layer3/canonical_authority_registry.test.mjs` | Review registry assumptions and domain evidence. |
| `frontend/tests/layer3/canonical_domain_match.test.mjs` | Review test cases for suffix and subdomain matching. |
| `frontend/tests/trust/friend_backend_tavily_fallback_status.test.mjs` | Review provider status honesty; do not make a Tavily call. |
| `frontend/tests/trust/tavily_direct_url_independent.test.mjs` | Review direct URL/provider separation; keep Tavily disabled. |
| `frontend/tests/trust/trust_capability_router.test.mjs` | Review input-specific capability matrix. |
| `frontend/tests/trust/web_content_extraction.test.mjs` | Review safe extraction contracts and external-network gating. |
| `scripts/check-secret-leakage.mjs` | Review that scan scope was not weakened. |

### `LOCAL_ONLY_PRESERVE` — 7 root-only paths

| Path | Classification rationale |
|---|---|
| `frontend/scripts/generate_canonical_layer3_holdout_v1.mjs` | Preserve locally; review dataset provenance and secret/provider isolation before use. |
| `frontend/scripts/rescore_canonical_layer3_holdout_v1.mjs` | Preserve locally; output is not a fresh verified release metric until rerun and audited. |
| `frontend/scripts/run_canonical_layer3_holdout_v1.mjs` | Preserve locally; inspect network/provider budget before any execution. |
| `frontend/scripts/staging/run-eight-identity-assurance.mjs` | Preserve locally; stage/persona script needs target and credential handling review. |
| `frontend/tests/db/staging_fixture_runner_contract.test.mjs` | Preserve locally; not part of release until its fixture-only boundary is validated. |
| `scripts/build-8-demo-master-video.py` | Local presentation artifact builder, not product source. |
| `scripts/run-8-demo-accounts-e2e.mjs` | Preserve locally; credentials, target environment and cleanup need review before execution. |

## Trust reference decision

The user-provided commits are present in local Git history and identify the canonical Trust seam:

| Commit | Reference behavior | Classification |
|---|---|---|
| `80351be4` | Gated safe demo presentation in `OwnTrustJourney.jsx` | `PORT_UNIQUE_IMPROVEMENT`; presentation-only override remains explicitly gated and must never replace production verdicts. |
| `554e8e78` | Preserve safe L4 classification in final predict | `KEEP_CANONICAL`; retain L1/L2 blocking and L4 classification semantics in the canonical orchestrator. |
| `4bfd4e97` | Complete Layer 2 after provider settlement | `KEEP_CANONICAL`; L2 settles after concurrent provider work, with deterministic unknown fallbacks. |
| `3d52e6c9` | Connect render verification backend | `KEEP_CANONICAL`; `OwnBackendTrustOrchestrator` is the backend-driven four-layer route, with render contract tests. |

The release candidate previously exposed five public macro layers (`Claim Intelligence`, `Evidence Discovery`, `Evidence Forensics`, `AI Verification`, `Decision Intelligence`) even though the recording and canonical response define four user-facing layers plus a separate deterministic Final Predict. The current implementation maps the real public `l1/l2/l3/l4` stage contract to the four visible stages; internal V5 IDs remain implementation details and persistence IDs are unchanged. This unifies the UI around the existing canonical orchestrator instead of introducing a competing backend pipeline.

Known truthfulness issues to address in this slice: timer-driven journey/replay transitions; a hard-coded `VERIFIED_IMMUTABLE` evidence claim; five-layer copy; and a default `NEEDS_REVIEW` verdict when no canonical final decision is published. These are presentation defects, not proof of backend persistence defects.

## Current continuation evidence

- Workspace: `D:/StudentHub-CodexRuns/FULL_SCHEMA_SYNC_20261001/release-worktree`, branch `release/studenthub-full-sync-20261001`, base `70e0927f4fe2ce4c726227d84aae85f6dcb595de`. The owner's dirty checkout remains untouched.
- Trust changed paths are listed by `git status`; targeted Node contracts pass 28/28, changed-file ESLint passes, isolated Trust V4 Playwright passes 9/9, and production build plus TypeScript pass. The isolated Trust fixture uses schema-correct `l1/l2/l3/l4` output; it is not live database/provider assurance.
- Trust visual output is under `D:/StudentHub-CodexRuns/TRUST_VIDEO_REFERENCE_20261001/after/`; screenshots are fixture-labeled and include desktop, states, responsive widths, mobile 390px, and accessibility/performance evidence.
- The canonical database gate documents production schema drift (22 tables and 6 columns) and backup/PITR as unverified. No production migration, final Tavily/OpenAlex campaign, promotion, deployment, or canary has been performed. The package test's synthetic URLhaus offline/timeout probe is separately recorded.
- Three-core Playwright: PASS, 100 passed / 2 intentional screenshot-only skips / 0 failed across Chromium, Firefox and WebKit (33.1 minutes). The isolated production build was rebuilt from this source diff; the runner manifest classifies it as fixture-only with no env files or live DB/provider assurance. Feature folders contain 239 screenshot images, plus Playwright traces and a JSON result report, all outside the checkout.
- `npm run test:all`: PASS with Tavily explicitly OFF and budget 0. Expert V4/V5, database-mutation guard, Omni/Trust/Community contracts: combined targeted root-run set 86/86 PASS. Security/product-scope/Trust render contracts: 30/30 PASS. Full `npm run lint -- --quiet`: PASS (no lint errors). Existing release-build TypeScript and build gates passed before this browser campaign.
- The non-Tavily threat-intelligence unit suite exercises its URLhaus offline/timeout path using a synthetic example URL. No Tavily call or credential was used; the external-provider final gate remains deferred.
- Production backup/PITR and schema drift remain unresolved: 22 canonical tables and 6 columns missing in production, backup/PITR unknown. No production migration, provider final campaign, promotion, deployment, or canary has been performed.

## Database and release disposition

Use `DATABASE_SCHEMA_DRIFT_MATRIX.md` and `DATABASE_BACKUP_RECOVERY_GATE.md` as the current backend gates. Production schema mismatch and unverified backup/PITR remain blocking. This slice must not create a production migration or promote Main. Candidate source changes may continue on the release branch with local/targeted verification.
