# StudentHub AI Trust Engine V5 — Evidence-Bound Final Report

Date of evidence capture: 2026-08-31 (Asia/Bangkok)

This report is an evidence record, not a certification. It makes no claim of
government certification, calibrated probability, a proprietary trained model,
or production deployment.

## 1. Authority and scope

The attached document
D:\Download\STUDENTHUBAI_LUNA_MAX_TRUST_ENGINE_V5_SEQUENTIAL_L2C_L5_MASTER_PROMPT.md
was read completely. Its contents were treated as the locked V5 engineering
specification and acceptance gates. The document is instruction/specification
material, not an independent authorization to mutate external systems.

The user's request authorized implementation in the shared repository, a new
branch from the latest production main, a Draft PR, testing, documentation,
and Vercel Preview verification. The latest V5 instruction supersedes the
earlier request to deploy production: main was not merged and production was
not deployed.

The required pre-edit source reads were completed verbatim before the first
patch. All four referenced paths existed; no FILE_NOT_FOUND condition was
encountered:

* frontend/src/lib/ai-trust/layer1/engine/DecisionEngine.js — 177 lines
* frontend/src/lib/ai-trust/layer4/policy/HardDecisionPolicy.js — 149 lines
* frontend/src/app/api/ai-trust/screen/route.js — 73 lines
* frontend/src/app/api/ai/trust/evaluate/route.js — 33 lines

The implementation branch was created after fetching production main at
e1feed7f4e7effee5311b0f2968fc569f3251a9d.

## 2. Ground truth and runtime state

### Official L2A canary before edits

Request:

~~~text
curl.exe -X POST https://studenthub-api-8fqp.onrender.com/api/verify/layer2 -H "Content-Type: application/json" -d '{"type":"url","content":"https://testsafebrowsing.appspot.com/s/phishing.html"}'
~~~

Raw response:

~~~json
{"verdict":"DANGEROUS","confidence":0.99,"reason":"Google Safe Browsing detected a threat: SOCIAL_ENGINEERING.","providers":[{"provider":"Google Safe Browsing","success":true,"verdict":"DANGEROUS","confidence":0.99,"message":"Threat detected: SOCIAL_ENGINEERING."}]}
~~~

Exit code: 0. This is not a BACKEND_DEFECT.

### One-shot runtime probes

STATE_L2A_BACKEND=LIVE. Raw probe response for the requested google.com body:

~~~json
{"verdict":"SAFE","confidence":0.95,"reason":"Google Safe Browsing did not report this URL as a known threat.","providers":[{"provider":"Google Safe Browsing","success":true,"verdict":"SAFE","confidence":0.95,"message":"No known Safe Browsing threat was returned."}]}
~~~

STATE_AI_GATEWAY=DETERMINISTIC_FALLBACK_ONLY: no AI Gateway credentials were
configured and no live AI Gateway evidence was available.

STATE_RETRIEVAL_PROVIDER=LOCAL_KNOWLEDGE_BASE_ONLY: no search/retrieval
provider credentials were configured and no live retrieval evidence was
available.

These states reduce the claim scope of L2B and L3 only. They do not block the
local L1 or deterministic L4 work.

## 3. Baseline before V5 changes

The PowerShell equivalent of the requested tail -30 was used:
Select-Object -Last 30. The following are the raw baseline result lines.

~~~text
L1: TP: 57, TN: 66, FP: 0, FN: 0
L1: [QUALITY_GATE] PASS: 1/1 selected test files
L2: Total Test Scenarios Evaluated : 14
L2: Passed : 14 / 14
L2: Failed : 0
L2: [QUALITY_GATE] PASS: 1/1 selected test files
L3: 8 / 8
L3: failed 0
L3: [QUALITY_GATE] PASS: 1/1 selected test files
L4: 8 / 8
L4: failed 0
L4: [QUALITY_GATE] PASS: 1/1 selected test files
~~~

## 4. V5 architecture delivered

The sequential contract is defined by
frontend/src/lib/ai-trust/v5/contracts.js:29 (STAGE_IDS),
:81 (STAGE_DEFINITIONS), :360 (createStageEnvelope), and
:456 (toPublicPipelineResult). The orchestrator is
frontend/src/lib/ai-trust/v5/TrustPipelineOrchestrator.js:107
(TrustPipelineOrchestrator), with stage execution at :168,
single-stage execution at :242, complete sequential execution at :311,
and retry at :399.

The public sanitizer removes server-only raw metadata at
contracts.js:456. The V5 regression PUBLIC_RESPONSE_OMITS_SERVER_RAW_METADATA
proves that raw layer results, assurance internals, audit metadata, and secret
raw metadata are not returned.

The API is exposed at
frontend/src/app/api/v1/trust/route.js:93 (runCanonicalTrust) and
:178 (POST), with the alias route protected at
frontend/src/app/api/v1/trust/analyze/route.js:9 (POST). The client invokes
the sequential stream at
frontend/src/lib/api/trust.ts:154 (sequentialRequest) and
frontend/src/components/trust/AiTrustStudioView.jsx:196
(trustApi.sequential). The seven-card UX is rendered by
frontend/src/components/trust/TrustPipelineTimeline.jsx:48.

The exact V5 unit test SEQUENTIAL_STAGE_CONTRACT_AND_ORDER at
frontend/tests/trust/trust_engine_v5_sequential.test.mjs:134 verifies the
seven-stage order and stage envelope. Raw V5 suite result:

~~~text
ℹ tests 50
ℹ pass 50
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
~~~

## 5. Per-layer evidence and verdicts

The labels below distinguish a locally evidenced implementation gate from a
national-high-impact M3 claim. A blocked M3 label is intentional when the
required external evidence was not available.

### L1 — Local Security Screening

Implementation evidence:
frontend/src/lib/ai-trust/layer1/engine/DecisionEngine.js:26
(DecisionEngine.resolve) and
frontend/src/lib/ai-trust/v5/TrustPipelineOrchestrator.js:168
(_stageWorker). A hard L1 block redacts the downstream target before L2A.

Proof tests:
L1_LOCAL_CLEAR_AND_UNKNOWN_NEVER_FINAL_SAFE (:180),
L1_BLOCK_PROPAGATION (:194), and
L1_HARD_BLOCK_REDACTS_DOWNSTREAM_TARGET (:207).

Raw proof:

~~~text
TP: 57, TN: 66, FP: 0, FN: 0
ℹ tests 50
ℹ pass 50
ℹ fail 0
~~~

Verdict: L1_M3_PASS for the deterministic local gate, supported by the
baseline and the named V5 hard-negative/propagation tests. This is not a
government certification claim.

### L2A — Threat Intelligence

Implementation evidence:
frontend/src/lib/ai-trust/layer2a/Layer2AReputationService.js:8
(verify), frontend/src/lib/ai-trust/layer2a/RenderLayer2AProvider.js:95
(normalizeLayer2AProviderPayload), and :386 (check). Provider timeout,
abort, malformed response, circuit-open, and provider-contradiction paths
remain UNKNOWN; no known threat is not converted to SAFE.

Proof tests:
THREAT_MATCH_HARD_BLOCK_PRESERVED (:223),
NO_KNOWN_THREAT_NOT_SAFE (:238),
PROVIDER_TIMEOUT_UNKNOWN (:248),
PROVIDER_ERROR_UNKNOWN (:257),
CIRCUIT_OPEN_UNKNOWN (:266),
PROVIDER_CONTRACT_CONTRADICTION (:273), and
NO_SYNTHETIC_GOOGLE_CONFIDENCE (:283). The live canary above is additional
external evidence.

Raw proof:

~~~text
{"verdict":"DANGEROUS","confidence":0.99,"reason":"Google Safe Browsing detected a threat: SOCIAL_ENGINEERING.","providers":[{"provider":"Google Safe Browsing","success":true,"verdict":"DANGEROUS","confidence":0.99,"message":"Threat detected: SOCIAL_ENGINEERING."}]}
ℹ tests 50
ℹ pass 50
ℹ fail 0
~~~

Verdict: L2A_M3_BLOCKED_BY_MISSING_EXTERNAL_FAILURE_EVIDENCE. The live
provider canary was reachable, but a live provider-outage/compromise exercise
was not available; controlled failure tests prove code behavior only.

### L2B — Semantic Intelligence

Implementation evidence:
frontend/src/lib/ai-trust/layer2/Layer2SemanticService.js:71
(verify), frontend/src/lib/ai-gateway/AIGatewayService.js:34
(generateText), :93 (generateStructured), and
frontend/src/lib/ai-gateway/ModelRouter.js:77 (route). Request cancellation
is propagated through the model provider boundary.

Proof tests:
L2B_SEMANTIC_AI_CANNOT_CLEAR_THREAT (:289),
PROMPT_INJECTION_ISOLATED (:300),
INVALID_MODEL_SCHEMA_FALLBACK (:307),
SEMANTIC_TIMEOUT_TYPED (:315),
CLAIMS_EXTRACTION_BOUNDED (:322), and
NO_SEMANTIC_SAFE_ASSERTION (:329).

Raw proof:

~~~text
ℹ tests 50
ℹ pass 50
ℹ fail 0
~~~

Verdict: L2B_M3_BLOCKED_BY_MISSING_LIVE_AI_GATEWAY_EVIDENCE. The runtime was
DETERMINISTIC_FALLBACK_ONLY; no live provider result or live provider-failure
exercise may be represented as evidence.

### L2C — StudentHub Domain AI

Implementation evidence:
frontend/src/lib/ai-trust/v5/l2c/taxonomy.js:1 (version/taxonomy),
frontend/src/lib/ai-trust/v5/l2c/StudentDomainRiskModel.js:208
(StudentDomainRiskModel.analyze),
frontend/src/lib/ai-trust/v5/l2c/datasetSchema.js:54
(validateStudentDomainCase), :64 (isEligibleForFineTuning), and
frontend/src/lib/ai-trust/v5/l2c/evaluationHarness.js:49
(runStudentDomainEvaluation).

Proof tests:
DOMAIN_CLASSIFICATION_SCHEMA_VALID (:372),
BENIGN_CONTROL_FALSE_POSITIVE_GUARD (:379),
L2C_UNKNOWN_NEVER_SAFE (:348),
UNCALIBRATED_SCORE_NOT_PROBABILITY (:357),
MODEL_VERSION_PRESENT (:366),
L2C_CANNOT_OVERRIDE_THREAT_MATCH (:336),
L2C_RISK_CAN_RAISE_SUSPICION (:387), and
L2C_DATASET_PRIVACY_AND_FINE_TUNE_GATE (:399).

Raw proof:

~~~text
ℹ tests 50
ℹ pass 50
ℹ fail 0
~~~

Verdict: L2C_BASELINE_READY. The baseline taxonomy, DTO, deterministic
domain-risk model, evaluation harness, privacy schema, and model card are
evidenced by the named tests and the following files:

* docs/ai/STUDENTHUB-DOMAIN-DATASET-SCHEMA.md
* docs/ai/STUDENTHUB-DOMAIN-EVALUATION.md
* docs/ai/STUDENTHUB-DOMAIN-RISK-MODEL-CARD.md

Separate verdict: L2C_FINE_TUNE_BLOCKED_BY_DATA_QUALITY. No verified training
dataset or trained artifact exists, so no proprietary model or probability
claim is made.

### L3 — Evidence and Provenance

Implementation evidence:
frontend/src/lib/ai-trust/layer3/Layer3EvidenceService.js:144
(verify) and
frontend/src/lib/ai-trust/layer3/retrieval/WebSearchRetriever.js:50
(search) / :62 (fetch). Retrieval failure is partial and visible;
duplicate sources are not independent; stale/conflicting evidence remains
visible; caller cancellation is not rewritten as a provider timeout.

Proof tests:
LOCAL_KB_NOT_EXTERNAL_VERIFIED (:407),
SOURCE_DUPLICATES_NOT_INDEPENDENT (:413),
STALE_EVIDENCE_VISIBLE (:420),
CONFLICTS_PRESERVED (:426),
MISSING_SOURCE_LOWERS_COMPLETENESS (:432),
RETRIEVAL_FAILURE_PARTIAL (:439), and
PROMPT_INJECTION_FROM_SOURCE_ISOLATED (:449).

Raw proof:

~~~text
ℹ tests 50
ℹ pass 50
ℹ fail 0
~~~

Verdict: L3_M3_BLOCKED_BY_MISSING_LIVE_RETRIEVAL_EVIDENCE. Runtime state was
LOCAL_KNOWLEDGE_BASE_ONLY; the local corpus is not external verification.

### L4 — Deterministic Trust Policy

Implementation evidence:
frontend/src/lib/ai-trust/layer4/policy/HardDecisionPolicy.js:25
(HardDecisionPolicy.evaluate),
frontend/src/lib/ai-trust/layer4/Layer4TrustService.js:54
(Layer4TrustService.evaluate),
frontend/src/lib/ai-trust/layer4/fusion/EvidenceFusionEngine.js:147
(EvidenceFusionEngine.fuse),
frontend/src/lib/ai-trust/layer4/policy/RiskAssessmentEngine.js:21
(RiskAssessmentEngine.assessRisk), and
frontend/src/lib/ai-trust/layer4/providers/DeterministicTrustPolicyProvider.js:151.
L4 remains authoritative and preserves hard negatives.

Proof tests:
SECURITY_TRUTH_ACTION_SEPARATE (:478),
POLICY_VERSION_PRESENT_AND_DETERMINISTIC_REPLAY (:490),
HARD_NEGATIVE_PRECEDENCE (:503), plus the pre-change L4 suite with
8 / 8 and failed 0.

Raw proof:

~~~text
8 / 8
failed 0
ℹ tests 50
ℹ pass 50
ℹ fail 0
~~~

Verdict: L4_M3_PASS for the deterministic policy gate, with no AI or
retrieval component authorized to clear hard-negative evidence.

### L5 — Adversarial Assurance

Implementation evidence:
frontend/src/lib/ai-trust/v5/l5/AdversarialAssuranceAuditor.js:123
(audit), :271 (applyAssuranceDowngrade), and :301
(isAssuranceDowngradeOnly). L5 can downgrade or require review, but cannot
upgrade safety.

Proof tests:
L5_NEVER_UPGRADES_SAFETY (:515),
L5_CAN_DOWNGRADE_TO_REVIEW (:523),
L5_DETECTS_DROPPED_HARD_NEGATIVE (:529),
L5_DETECTS_EVIDENCE_CONCENTRATION (:539),
L5_DETECTS_STALE_EVIDENCE (:545),
L5_DETECTS_CONFIDENCE_INFLATION (:551),
L5_DETECTS_UNSUPPORTED_AI_NARRATIVE (:557),
L5_DETECTS_STAGE_SKIP (:563),
L5_AI_FAILURE_FALLS_BACK_DETERMINISTIC (:570), and
L5_MISSING_EVIDENCE_IS_BLOCKED (:579).

Raw proof:

~~~text
ℹ tests 50
ℹ pass 50
ℹ fail 0
~~~

Verdict: L5_ASSURANCE_PASS for the deterministic auditor gate. A formal
cross-browser M3 claim remains blocked by the Firefox host launch failure
recorded below.

## 6. Sequential user experience

The E2E test
frontend/tests/e2e/trust-v5-sequential.spec.ts:4
(renders all seven stages and their epistemic boundaries through the live
local route) verifies seven distinct stage cards, ordering, stage status,
finding, evidence/signals, meaning, non-proof, limitations, next-stage text,
baseline-model wording, and absence of probability/content-safe overclaims.
The orchestration and UI implementation is cited in Section 4.

Raw browser results:

~~~text
Chromium: 60 tests, 3 skipped, 57 passed (2.2m)
WebKit: 60 tests, 6 skipped, 54 passed (3.3m)
Mobile Chromium: 15 passed (56.2s)
~~~

Firefox did not reach application assertions because the host could not launch
the browser. Raw blocker:

~~~text
Error: browserType.launch: spawn UNKNOWN
Call log:
  - <launching> C:\Users\Duy\AppData\Local\ms-playwright\firefox-1538\firefox\firefox.exe -no-remote -headless ...
...
56 failed
...
3 skipped
1 passed (25.3s)
~~~

Verdict: SEQUENTIAL_TRUST_PIPELINE_PASS for Chromium/WebKit/mobile evidence;
Firefox cross-browser evidence is
UNVERIFIED_CLAIM — requires human verification due the host launch blocker.

## 7. Regression, security, build, and CI evidence

### Full repository and static gates

Raw outputs:

~~~text
[QUALITY_GATE] PASS: 261/261 discovered test files
✖ 338 problems (0 errors, 338 warnings)
found 0 vulnerabilities
~~~

npm run test:quality exited 0; the 338 root lint warnings are legacy
warnings, not errors. npx tsc --noEmit exited 0 with no output.

The production build compiled successfully, completed TypeScript validation,
generated static pages 117/117, and included /api/v1/trust and
/api/v1/trust/analyze.

### Security and contract gates

Raw pass/fail counts:

~~~text
P0 BOLA/PII: ℹ tests 7 / ℹ pass 7 / ℹ fail 0
10 attacks: ℹ tests 10 / ℹ pass 10 / ℹ fail 0
Token/session: ℹ tests 9 / ℹ pass 9 / ℹ fail 0
AI tool firewall: ℹ tests 3 / ℹ pass 3 / ℹ fail 0
Master gateway: ℹ tests 8 / ℹ pass 8 / ℹ fail 0
Final audit: ℹ tests 7 / ℹ pass 7 / ℹ fail 0
Phase 2 auth: ℹ tests 10 / ℹ pass 10 / ℹ fail 0
Phase 3 contract: ℹ tests 5 / ℹ pass 5 / ℹ fail 0
~~~

API authorization inventory raw output:

~~~text
Wrote docs\security\API-Authorization-Inventory.md with 137 handlers.
Route files 110
HTTP handlers 137
Authentication required 70
Explicit anonymous access 61
No visible Security Fabric wrapper 6
Unprotected mutations requiring P0 review 0
~~~

Bundle and dependency outputs:

~~~text
[BUNDLE_MEASURE] /trust initial JS: 394484 bytes across 6 chunks.
[BUNDLE_MEASURE] /community initial JS: 337527 bytes across 5 chunks.
[BUNDLE_MEASURE] /expert initial JS: 339510 bytes across 5 chunks.
[BUNDLE_BUDGET] /trust budget: 500000 bytes.
[BUNDLE_BUDGET] PASS
~~~

The live PostgreSQL phase remained externally blocked. Raw output:

~~~text
BLOCKED_BY_DATABASE_ENV: STUDENTHUB_RLS_TEST_DATABASE_URL is required
~~~

### GitHub CI and Vercel Preview

Final application evidence was produced at implementation SHA
fe6be91f8d066aa5c887258bc72cdcb0109b8d6c; the final report itself is a
documentation-only follow-up commit on the same branch.

Raw GitHub status excerpts:

~~~text
"statusState": "success"
"context": "Vercel – student-hub-ai", "state": "success"
"context": "Vercel – student-hub-ai-weje", "state": "success"
"name": "quality", "status": "completed", "conclusion": "success"
"name": "Vercel Preview Comments", "status": "completed", "conclusion": "success"
~~~

Preview smoke result:

~~~json
{"url":"https://student-hub-ai-weje-git-codex-trust-engine-v5-17eaab-vi-be-city.vercel.app/trust","httpStatus":200,"title":"Trust Engine | StudentHub AI","stageCount":7,"pipelineStatus":"IDLE"}
~~~

Preview deployment URLs:

* student-hub-ai Preview:
  https://student-hub-ai-git-codex-trust-engine-v5-sequ-cf3d7a-vi-be-city.vercel.app
* student-hub-ai-weje Preview:
  https://student-hub-ai-weje-git-codex-trust-engine-v5-17eaab-vi-be-city.vercel.app

The Vercel CLI was not authenticated in this environment, but the repository
Vercel integration completed both Preview deployments and GitHub checks.

## 8. Branch and PR state

* Branch: codex/trust-engine-v5-sequential-assurance
* Base: latest fetched production main
  e1feed7f4e7effee5311b0f2968fc569f3251a9d
* Draft PR: https://github.com/Duy2613/StudentHub-AI/pull/3
* PR state: open, draft, not merged
* PR #2: left untouched
* main: not merged into and not modified

## 9. Final evidence-bound verdicts

The following verdicts are deliberately separate:

* L1_M3_PASS: deterministic local gate evidenced by the L1 baseline and
  named V5 tests in Section 5.
* L2A_M3_BLOCKED_BY_MISSING_EXTERNAL_FAILURE_EVIDENCE: live canary passed,
  but no live outage/compromise exercise was available.
* L2B_M3_BLOCKED_BY_MISSING_LIVE_AI_GATEWAY_EVIDENCE: runtime was
  deterministic fallback only.
* L2C_BASELINE_READY: contract/taxonomy/baseline/evaluation/model-card gate
  is evidenced; L2C_FINE_TUNE_BLOCKED_BY_DATA_QUALITY remains explicit.
* L3_M3_BLOCKED_BY_MISSING_LIVE_RETRIEVAL_EVIDENCE: runtime was local KB only.
* L4_M3_PASS: deterministic policy gate evidenced by replay/hard-negative
  tests and the pre-change L4 suite.
* L5_ASSURANCE_PASS: deterministic assurance gate evidenced; Firefox
  cross-browser evidence remains unverified.
* SEQUENTIAL_TRUST_PIPELINE_PASS: seven-stage UX evidenced on
  Chromium/WebKit/mobile; Firefox is externally blocked.

Overall V5 implementation verdict:

TRUST_ENGINE_V5_EXPLAINABLE_ASSURANCE_PASS_WITH_LIMITATIONS

Overall independent national-high-impact maturity verdict:

M3_BLOCKED_BY_MISSING_EVIDENCE

The overall M3 verdict is intentionally not upgraded while L2A live-failure,
L2B live-AI, L3 live-retrieval, database-RLS, and Firefox-host evidence remain
unavailable. No missing external dependency was converted into SAFE.
