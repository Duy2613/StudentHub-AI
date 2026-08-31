# StudentHub AI Trust Engine — M3 High-Assurance Evidence Report

Status: evidence-bound handoff. This report does not claim government certification and does not claim that every layer has live M3 evidence. A verdict is only issued where the cited source, named test, and raw result are present.

## 1. Authority and scope

The user request defined the work: harden Layers 1, 2A, 2B, 3, and 4; audit and upgrade the remaining repository capabilities; red-team them; add regression coverage; run repository and CI gates; preserve PR #2 as Draft; and never merge `main`.

The attached master prompt at `D:\Download\STUDENTHUBAI_LUNA_MAX_SOVEREIGN_HIGH_ASSURANCE_TRUST_ENGINE_MASTER_PROMPT.md` was read completely and supplied the M3 exit gates, Section 63 system gate, Section 70 reporting format, and the explicit runtime-state/degradation rules. Repository `AGENTS.md` and the Obsidian vault were consulted. Attached-document instructions were treated as acceptance criteria, not as authorization to merge, certify, or invent external evidence.

The state matrices used during implementation are recorded in [`docs/TRUST-ENGINE-STATE-MATRICES.md`](../docs/TRUST-ENGINE-STATE-MATRICES.md). The exact pre-edit source requested for the four named files is recorded in [`docs/TRUST-ENGINE-PREEDIT-SOURCE-SNAPSHOT.md`](../docs/TRUST-ENGINE-PREEDIT-SOURCE-SNAPSHOT.md).

## 2. Revision and repository state

- Tested Trust Engine implementation SHA: `86bca0d7163477d52232bd098438ce4cc9f9fba4` (`security(trust): harden trust engine boundaries`).
- Whole-system hardening SHA: `0bfcfbea010963d614efd13f7cc4f6726adb4bd2` (`security: harden whole-system trust boundaries`).
- Baseline SHA before implementation: `ea30f901db3ddf3e30614342617418d1ce361e63`.
- Branch: `develop`; whole-system commit was pushed to `origin/develop`.
- `main` SHA observed before handoff: `251e7cb4a908c5a185be89a39301b294f9595dbf`.
- Implementation worktree after publication: clean; `git status --short --branch` returned `## develop...origin/develop`.
- PR #2 current raw API state: `number=2 state=open draft=True merged=False head=d7e4c6f002bbbfade2976f5d1a98447ec8f66c64 base=main`.

No merge operation was performed. PR #2 remains Draft and `main` was not changed.

## 3. Ground-truth verification executed first

### 3.1 Official backend canary

The requested official phishing canary was executed before code changes. The exact response body from the raw curl capture was:

```text
{"verdict":"DANGEROUS","confidence":0.99,"reason":"Google Safe Browsing detected a threat: SOCIAL_ENGINEERING.","providers":[{"provider":"Google Safe Browsing","success":true,"verdict":"DANGEROUS","confidence":0.99,"message":"Threat detected: SOCIAL_ENGINEERING."}]}
```

The response was a threat match, not `SAFE` or `NO_MATCH`; therefore the specified `BACKEND_DEFECT` classification was not triggered. This result is backend evidence only and is not hard-coded in the frontend. The source scan for `testsafebrowsing.appspot.com|phishing.html` returned `CANARY_SOURCE_SCAN_EXIT=1` with no output.

### 3.2 Exact pre-edit source snapshot

The four requested paths existed at the baseline commit; no `FILE_NOT_FOUND` condition occurred. The snapshot was compared against `git show HEAD:<path>` before editing. Raw comparison output:

```text
EXACT_MATCH frontend/src/lib/ai-trust/layer1/engine/DecisionEngine.js
EXACT_MATCH frontend/src/lib/ai-trust/layer4/policy/HardDecisionPolicy.js
EXACT_MATCH frontend/src/app/api/ai-trust/screen/route.js
EXACT_MATCH frontend/src/app/api/ai/trust/evaluate/route.js
PREEDIT_COMPARE_HEAD=ea30f90
BLOCKS=4 EXACT=4
```

The verbatim blocks are at lines 7, 144, 250, and 327 of `docs/TRUST-ENGINE-PREEDIT-SOURCE-SNAPSHOT.md`, respectively. The snapshot contains the original 119-line Layer 1 engine, original Layer 4 policy, and both original route implementations without paraphrase.

### 3.3 Required pre-change test commands

The literal commands requested by the user were run before implementation. PowerShell does not provide the Unix `tail` command, so each command failed at the pipe before the test runner was invoked. Raw result for the four commands was:

```text
tail: The term 'tail' is not recognized as a name of a cmdlet, function, script file, or operable program...
```

The subsequent `npm test -- tests/layerN/...` invocation produced the following raw npm result for each layer:

```text
npm error Missing script: "test"
npm error
npm error To see a list of scripts, run:
npm error   npm run
npm error A complete log of this run can be found in:
C:\Users\Duy\AppData\Local\npm-cache\_logs\2026-08-30T16_10_30_327Z-debug-0.log
```

The corresponding log timestamps for Layer 2, Layer 3, and Layer 4 were `2026-08-30T16_10_31_235Z-debug-0.log`, `2026-08-30T16_10_32_152Z-debug-0.log`, and `2026-08-30T16_10_32_999Z-debug-0.log`. This literal-command baseline is therefore `ERROR`/not runnable, not a passing baseline.

The repository's actual pre-edit layer scripts were then run in a detached temporary worktree at baseline SHA `ea30f90`. Their raw count summaries were:

```text
Layer 1
True Positives (Threats Blocked)   [TP]: 57
True Negatives (Legitimate Passed)  [TN]: 66
False Positives (False Alarms)      [FP]: 0
False Negatives (Missed Threats)    [FN]: 0
Average Screening Latency                : 0.18 ms
Overall Deterministic Accuracy           : 100.0%
TEST_EXIT=0

Layer 2
Total Test Scenarios Evaluated : 14
Passed                         : 14 / 14
Failed                         : 0
Average Screening Latency      : 3.76 ms
Overall Accuracy               : 100.0%
TEST_EXIT=0

Layer 3
Total Test Scenarios Evaluated : 8
Passed                         : 8 / 8
Failed                         : 0
Average Evidence Latency       : 1.98 ms
Overall Accuracy               : 100.0%
TEST_EXIT=0

Layer 4
Total Test Scenarios Evaluated : 8
Passed                         : 8 / 8
Failed                         : 0
Average Reasoning Latency      : 0.63 ms
Overall Accuracy               : 100.0%
TEST_EXIT=0
```

These pre-edit happy-path counts are retained as historical baseline only; they are not used as M3 evidence.

## 4. One-time runtime-state detection

The state probe was attempted once, before implementation, and was non-blocking as required. The command was:

```text
curl.exe -X POST https://studenthub-api-8fqp.onrender.com/api/verify/layer2 -H "Content-Type: application/json" -d '{"type":"url","content":"https://google.com"}'
```

Raw terminal result: the request uploaded 45 bytes, received 0 bytes and no response body, remained pending until interrupted after approximately 1:12, and ended with `EXIT=1`. Therefore:

```text
STATE_L2A_BACKEND=MOCK_REQUIRED
```

The one-time environment/configuration check returned:

```text
STUDENTHUB_LAYER2_BASE_URL=UNSET
STUDENTHUB_LAYER2_TIMEOUT_MS=UNSET
OPENAI_API_KEY=UNSET
GOOGLE_API_KEY=UNSET
GEMINI_API_KEY=UNSET
AI_GATEWAY_URL=UNSET
AI_GATEWAY_API_KEY=UNSET
TRUST_ENGINE_AI_GATEWAY_URL=UNSET
TRUST_ENGINE_AI_GATEWAY_API_KEY=UNSET
TAVILY_API_KEY=UNSET
SERPAPI_API_KEY=UNSET
BRAVE_SEARCH_API_KEY=UNSET
BING_SEARCH_API_KEY=UNSET
STUDENTHUB_RETRIEVAL_PROVIDER_URL=UNSET
```

The implementation's configuration supports OpenAI/Gemini adapters but the detected environment has no configured AI gateway, and no retrieval-provider URL is configured. The resulting states are:

```text
STATE_AI_GATEWAY=DETERMINISTIC_FALLBACK_ONLY
STATE_RETRIEVAL_PROVIDER=LOCAL_KNOWLEDGE_BASE_ONLY
```

The test-only `MockReputationProvider` is explicitly labeled at `frontend/tests/trust/fixtures/MockReputationProvider.mjs:8`, constructed at line 14, and returns `NOT_CONFIGURED`/`UNKNOWN` with `MOCK_REQUIRED_EXTERNAL_BACKEND_UNAVAILABLE` at lines 17–24. It cannot produce positive evidence and is not counted as Layer 2A M3 evidence.

## 5. Threat model and fail-safe invariants

The state matrix in `docs/TRUST-ENGINE-STATE-MATRICES.md` covers malformed input, hostile URLs, private/loopback destinations, provider timeout/error, malformed provider output, prompt injection, retrieval poisoning, stale/missing/conflicting evidence, AI outage, network loss, dependency outage, and resource bounds.

The cross-layer invariant is implemented as follows: Layer 1 hard blocks and invalid input are authoritative in `frontend/src/lib/ai-trust/layer1/engine/DecisionEngine.js:26` (`DecisionEngine.resolve`) and `frontend/src/lib/ai-trust/layer1/Layer1ScreenService.js:35` (`Layer1ScreenService.screen`); Layer 2B applies the Layer 1 block before semantic context at `frontend/src/lib/ai-trust/layer2/engine/Layer2DecisionEngine.js:19` (`Layer2DecisionEngine.resolveDecision`); Layer 4 applies threat and deterministic hard rules before context at `frontend/src/lib/ai-trust/layer4/policy/HardDecisionPolicy.js:25` (`HardDecisionPolicy.evaluate`); and the canonical route composes the sequence at `frontend/src/app/api/v1/trust/route.js:25` (`runCanonicalTrust`). The named adversarial tests below provide the raw regression evidence for these invariants.

## 6. Layer 1 — local deterministic screening

Controls are implemented in `frontend/src/lib/ai-trust/layer1/normalization/NormalizationService.js:36` (`NormalizationService.normalizeUrl`), `frontend/src/lib/ai-trust/layer1/detectors/UrlDetector.js:84` (`checkSsrfTarget`) and `:158` (`UrlDetector.detect`), `frontend/src/lib/ai-trust/layer1/engine/DecisionEngine.js:26` (`DecisionEngine.resolve`), and `frontend/src/lib/ai-trust/layer1/Layer1ScreenService.js:35`/`:187` (`screen` and its safe exception path). Unsupported schemes, canonicalized private destinations, deception/homoglyphs, malformed values, cycles, invalid confidence, and auxiliary-provider failure remain non-authoritative or non-safe.

The dedicated regression file `frontend/tests/trust/layer1_boundary.test.mjs` contains these exact tests: `Layer 1 keeps malformed direct calls UNKNOWN and never manufactures confidence` (line 14); `Layer 1 redacts cyclic evidence without throwing` (line 49); `Layer 1 blocks unsupported schemes at the local boundary` (line 65); `Layer 1 blocks canonicalized private destinations before any provider` (line 77); `Layer 1 auxiliary model failure and invalid confidence remain non-authoritative` (line 91); and `Layer 1 M3 hostile URL corpus never crashes or becomes final safety` (line 122).

Raw targeted result:

```text
ℹ tests 6
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The historical repository benchmark also remained green with `TP=57`, `TN=66`, `FP=0`, `FN=0`, `Overall Deterministic Accuracy=100.0%`, `TEST_EXIT=0`. The layer has no external runtime dependency in its decision path. Verdict: `L1_M3_PASS`, supported by the cited source paths, six named boundary tests with raw `6 pass / 0 fail`, the historical `57/66/0/0` corpus, and the remote CI success recorded in Section 12.

## 7. Layer 2A — reputation/provider boundary

The real Render adapter is `frontend/src/lib/ai-trust/layer2a/RenderLayer2AProvider.js:94` (`normalizeLayer2AProviderPayload`), `:225` (`RenderLayer2AProvider`), and `:357` (`check`). It performs strict response normalization, bounded timeout/retry/circuit behavior, cache restrictions, request correlation, redaction, and SSRF validation. `frontend/src/lib/ai-trust/layer2a/Layer2AReputationService.js:8` (`verify`) marks only service-created DTOs as trusted. The public boundary is `frontend/src/app/api/ai-trust/reputation/route.js:9` (`verifyUrlReputation`) and its POST handler at line 44.

The exact boundary tests in `frontend/tests/trust/layer2a_reputation_boundary.test.mjs` are: `returns UNKNOWN when the real adapter is not configured` (line 38); `keeps a provider no-match bounded and cacheable without calling it safe` (line 52); `retains a dangerous nested result when the top-level response contradicts it` (line 77); `maps a real threat response to THREAT_MATCH without inventing a score` (line 92); `fails closed on malformed responses and does not cache the failure` (line 104); `uses one bounded retry, then opens a circuit without converting failure to no-match` (line 119); `rejects SSRF targets before any provider call` (line 140); and `strips arbitrary fields from nested provider DTOs` (line 149).

Raw targeted result:

```text
ℹ tests 8
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The runtime probe was `MOCK_REQUIRED`, so the test-only mock is used only for pipeline coverage and returns `UNKNOWN`; the exact regression `MOCK_REQUIRED_L2A_PIPELINE_REMAINS_UNKNOWN_AND_REVIEW_ONLY` is at `frontend/tests/trust/trust_engine_high_assurance.test.mjs:56` and is included in the combined raw result in Section 11. The earlier official canary returned `DANGEROUS`, so there is no `BACKEND_DEFECT` finding. Verdict: `L2A_M3_BLOCKED_BY_EXTERNAL_BACKEND`. The implementation is fail-safe and the boundary tests pass, but the configured production backend state required for an evidence-backed live M3 verdict was not available.

## 8. Layer 2B — semantic/AI boundary

`frontend/src/lib/ai-trust/layer2/guards/SemanticBoundary.js:191` (`normalizeSemanticAnalysis`), `:277` (`detectSemanticInputInjection`), and `:282` (`mergeSemanticCandidates`) bound and classify untrusted semantic output. `frontend/src/lib/ai-trust/layer2/engine/Layer2DecisionEngine.js:19` (`resolveDecision`) applies deterministic Layer 1 blocks first; provider failure is detected at line 80, educational context is guarded at line 90, and the provider-failure branch returns a non-pass result at line 139. The AI provider keeps the trusted system prompt and user-data wrapper separate in its `analyzeSemantics` implementation at `frontend/src/lib/ai-trust/layer2/providers/AIGatewayModelProvider.js:93` and lines 118–131.

The exact tests in `frontend/tests/trust/layer2b_semantic_boundary.test.mjs` are: `keeps deterministic credential-phishing hard block when AI says BENIGN` (line 30); `isolates prompt injection before any AI gateway call and requires review` (line 44); `does not let a malformed custom provider response become PASS` (line 60); `bounds malformed entry input and returns UNKNOWN without invoking a provider` (line 73); `keeps untrusted data in a user-data wrapper separate from the trusted system prompt` (line 87); and `does not invent confidence when an AI entity omits confidence` (line 104).

Raw targeted result:

```text
ℹ tests 6
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Mutation regression raw result:

```text
TOTAL: 15/15 MUTANTS KILLED | SURVIVING: 0
...
ℹ tests 16
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
TEST_EXIT=0
```

The detected state was `STATE_AI_GATEWAY=DETERMINISTIC_FALLBACK_ONLY`; therefore no live gateway evidence exists. Verdict: `L2B_M3_BLOCKED_BY_MISSING_EVIDENCE`. The deterministic fallback has exact adversarial coverage and mutation evidence, but a live gateway contract and outage/recovery evidence cannot be claimed from this environment.

## 9. Layer 3 — evidence/retrieval boundary

Evidence DTOs and provenance are bounded by `frontend/src/lib/ai-trust/layer3/types.js:287` (`createLayer3Result`), with live/external status gating at lines 325 and 332–335. `frontend/src/lib/ai-trust/layer3/Layer3EvidenceService.js:137` (`verify`) and its final marked result at line 320 accept only validated evidence. `frontend/src/lib/ai-trust/layer3/retrieval/WebSearchRetriever.js:32` (`search`) is explicitly local-only when no configured provider exists; network fetching starts at line 43, uses manual redirect handling at line 76, and enforces redirect bounds at line 90. `frontend/src/lib/ai-trust/layer3/TrustBoundary.js:6` and `:11` use a private capability marker so caller-asserted provenance cannot promote a result.

The exact tests in `frontend/tests/trust/layer3_evidence_boundary.test.mjs` are: `returns VERIFIED only for bounded live evidence with independent provenance` (line 55); `cannot promote a retriever that merely asserts live data without a network guard` (line 69); `labels the built-in knowledge base as local and never as external verification` (line 81); `abstains when there are no claims instead of manufacturing an evidence result` (line 90); `falls back honestly when the configured retriever fails` (line 99); `rejects SSRF candidates and preserves insufficient evidence` (line 119); and `does not verify evidence whose publication date is missing` (line 139).

Raw targeted result:

```text
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The historical layer benchmark remained `8 / 8` passed, `0` failed, `100.0%`, `TEST_EXIT=0`. The detected state was `STATE_RETRIEVAL_PROVIDER=LOCAL_KNOWLEDGE_BASE_ONLY`; no live retrieval provider was configured. Verdict: `L3_M3_BLOCKED_BY_MISSING_EVIDENCE`. Local provenance and poisoning/SSRF/freshness failure handling are evidenced; live independent retrieval evidence is not available.

## 10. Layer 4 — deterministic policy and truth enforcement

`frontend/src/lib/ai-trust/layer4/policy/HardDecisionPolicy.js:25` (`evaluate`) matches threats before contextual heuristics; its educational-context marker at line 30 is deliberately non-authoritative. `frontend/src/lib/ai-trust/layer4/providers/DeterministicTrustPolicyProvider.js:43` (`hasValidNoKnownThreat`) requires the private Layer 2A capability, and `:52` (`hasUsableEvidence`) requires the private Layer 3 capability. The deterministic provider reasons at line 131 and keeps failure paths at lines 207 and 234. Fusion records capability provenance at `frontend/src/lib/ai-trust/layer4/fusion/EvidenceFusionEngine.js:147` (`fuse`), lines 191 and 210. `frontend/src/lib/ai-trust/layer4/Layer4TrustService.js:54` (`evaluate`) makes the deterministic provider authoritative and permits custom AI output only as a bounded explanatory narrative at line 155.

The exact tests in `frontend/tests/trust/layer4_policy_boundary.test.mjs` are: `fails closed for missing and malformed upstream graphs` (line 53); `does not turn a threat-intelligence outage into a no-threat result` (line 67); `keeps local suspicion at WARN even when threat intelligence returns no-match` (line 80); `keeps an explicit provider no-match bounded and non-safe` (line 98); `does not trust a forged no-match finding without the Layer 2A contract provenance` (line 118); `keeps deterministic credential blocking active inside educational context` (line 130); `does not trust a copied successful no-match DTO without the service capability` (line 153); `does not accept caller-asserted live evidence without the Layer 3 service capability` (line 171); `preserves a validated threat match over benign semantic context and poisoned evidence` (line 181); `ignores a non-authoritative provider that attempts to grant ALLOW` (line 200); `allows AI to enrich explanation only, never the deterministic verdict` (line 220); `keeps supported truth separate from unknown security when reputation is unavailable` (line 249); and `keeps no-match security separate from contradicted truth` (line 266).

Raw targeted result:

```text
ℹ tests 13
ℹ pass 13
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The historical layer benchmark remained `8 / 8` passed, `0` failed, `100.0%`, `TEST_EXIT=0`; mutation testing also produced `15/15 MUTANTS KILLED`, `SURVIVING: 0`, `16` tests passed, `0` failed, `TEST_EXIT=0`. Verdict: `L4_M3_PASS` for the deterministic policy/truth/enforcement boundary, with the cited exact adversarial tests and no external dependency required to preserve its deny/review behavior.

## 11. Combined Trust Engine regression evidence

The combined boundary command was:

```text
node --test tests/trust/layer1_boundary.test.mjs tests/trust/layer2a_reputation_boundary.test.mjs tests/trust/layer2b_semantic_boundary.test.mjs tests/trust/layer3_evidence_boundary.test.mjs tests/trust/layer4_policy_boundary.test.mjs tests/trust/trust_engine_high_assurance.test.mjs
```

Raw result:

```text
ℹ tests 42
ℹ suites 5
ℹ pass 42
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

This result includes the exact `FALSE_SAFE_GOOGLE_CANARY_P0` test at `frontend/tests/trust/trust_engine_high_assurance.test.mjs:9` and the exact `MOCK_REQUIRED_L2A_PIPELINE_REMAINS_UNKNOWN_AND_REVIEW_ONLY` test at line 56. It supports the cross-layer fail-safe behavior only for the states actually exercised; it does not convert the missing live dependency evidence into a live M3 claim.

The canonical API composition is `frontend/src/app/api/v1/trust/route.js:25` (`runCanonicalTrust`) and its POST export at line 90. The platform contract test `tests/platform/canonical_api_runtime.test.mjs:37` passed:

```text
✔ canonical v1 APIs expose honest public contracts and fail closed for personal data (...)
ℹ tests 1
ℹ pass 1
```

The retired client-composed routes return explicit 410 responses: `frontend/src/app/api/ai-trust/reasoning/route.js:15` (`TRUST_REASONING_REQUIRES_CANONICAL_PIPELINE`), `frontend/src/app/api/ai/trust/evaluate/route.js:16` (`TRUST_EVALUATION_REQUIRES_CANONICAL_PIPELINE`), and the claim route's analogous canonical-pipeline response. No legacy route is used to bypass the canonical ordering.

## 12. Full repository, browser, and CI evidence

### 12.1 Whole-system maximum-upgrade evidence

The repository-wide directive is recorded in [`docs/WHOLE-SYSTEM-MAXIMUM-UPGRADE-DIRECTIVE.md`](WHOLE-SYSTEM-MAXIMUM-UPGRADE-DIRECTIVE.md). The current hardening commit adds a memory-only provider-auth boundary and server-owned opaque session flow at `frontend/src/lib/supabase/client.js:21` (`dynamicAuthStorage`), `frontend/src/lib/auth/authService.js:217` (`exchangeApplicationSession`), `frontend/src/lib/auth/authService.js:281` (serialized auth subscription), and `frontend/src/lib/auth/AuthContext.jsx:207` (authority-first initialization). It adds bounded cryptographic identifiers at `frontend/src/lib/security/secureId.js:28` (`createSecureId`), initial academic authority enforcement at `frontend/src/lib/intelligence/academic/academicDocumentFetcher.js`, and cookie precedence at `frontend/src/lib/security/identity/IdentityResolver.js:35` (`resolvePrincipal`).

The exact current focused raw results are:

```text
Auth resilience and authority ordering: ℹ tests 14 / ℹ pass 14 / ℹ fail 0 / EXIT_CODE=0
Final audit hardening:                 ℹ tests 7  / ℹ pass 7  / ℹ fail 0 / EXIT_CODE=0
Secure identifier contracts:           ℹ tests 4  / ℹ pass 4  / ℹ fail 0 / EXIT_CODE=0
Academic source watcher:               ℹ tests 9  / ℹ pass 9  / ℹ fail 0 / EXIT_CODE=0
Trust boundary combination:            ℹ tests 42 / ℹ pass 42 / ℹ fail 0 / EXIT_CODE=0
```

The named tests proving those rows are `frontend/tests/auth/auth_resilience_contracts.test.mjs` (`does not let browser storage failure prevent provider logout`, `checks the authoritative application session before restoring demo cache`, and `serializes Supabase auth subscription after initial session reconciliation`), `frontend/tests/security/final_audit_hardening.test.mjs` (`treats the server-owned cookie as authoritative over a conflicting bearer`), `frontend/tests/security/secure_id_contracts.test.mjs` (`contains no non-cryptographic random ID generator in authoritative ID paths`), `frontend/tests/academic/academic_source_watcher.test.mjs` (`S2.4: Initial official authority is checked before any transport call`), and `frontend/tests/trust/trust_engine_high_assurance.test.mjs` (`FALSE_SAFE_GOOGLE_CANARY_P0` and `MOCK_REQUIRED_L2A_PIPELINE_REMAINS_UNKNOWN_AND_REVIEW_ONLY`).

Discovered regression suite:

```text
[QUALITY_GATE] PASS: 260/260 discovered test files
```

Final quality/build raw highlights:

```text
[QUALITY_GATE] PASS: 260/260 discovered test files
✖ 349 problems (0 errors, 349 warnings)
  0 errors and 1 warning potentially fixable with the --fix option.
✓ Compiled successfully in 4.4s
  Finished TypeScript in 3.0s ...
✓ Generating static pages using 15 workers (116/116) in 1043ms
```

The final `npm test`, `npm run build`, and `npx tsc --noEmit --pretty false` commands exited 0. The four repository layer scripts exited 0 with raw final counts `Layer 1 TP=57 TN=66 FP=0 FN=0`, `Layer 2 14/14 passed, 0 failed`, `Layer 3 8/8 passed, 0 failed`, and `Layer 4 8/8 passed, 0 failed`.

Security and contract gates:

```text
P0 Security Regression 7/7
Security Fabric 10/10
Token & Session 9/9
AI Agent 3/3
Master Gateway 8/8
TEST_EXIT=0

npm run test:final-audit
ℹ tests 6
ℹ pass 6
ℹ fail 0
TEST_EXIT=0

npm run test:phase3-contract
ℹ tests 5
ℹ pass 5
ℹ fail 0
TEST_EXIT=0

npm audit --omit=dev --audit-level=high
found 0 vulnerabilities

npm run audit:api-auth
Wrote docs\security\API-Authorization-Inventory.md with 136 handlers.

npm run audit:bundle
[BUNDLE_MEASURE] /trust initial JS: 380189 bytes across 5 chunks.
[BUNDLE_MEASURE] /community initial JS: 336466 bytes across 4 chunks.
[BUNDLE_MEASURE] /expert initial JS: 338449 bytes across 4 chunks.
[BUNDLE_BUDGET] /trust budget: 500000 bytes.
[BUNDLE_BUDGET] PASS
```

The scanned secret-pattern command returned `SECRET_SCAN_EXIT=1` with no output; this means no match for the configured patterns, not proof that every possible secret format is absent. `git diff --check` exited 0 with no output after the implementation commit.

Browser and responsive evidence:

```text
Full Chromium E2E: 3 skipped, 56 passed (1.8m), TEST_EXIT=0
WebKit Evidence Case Lab: 6 passed (15.9s), TEST_EXIT=0
Responsive/reduced-motion mobile matrix: 4 passed (7.6s), TEST_EXIT=0
```

The Trust visual baselines were intentionally regenerated for the implemented navigation/provider-state topology, then the complete accessibility/visual command passed `11/11`. Local Firefox could not launch the installed executable and produced `Error: browserType.launch: spawn UNKNOWN`, followed by `14 failed`, `6 skipped`, `14 passed`, `TEST_EXIT=1`. The remote GitHub Firefox gate passed, so this local executable-launch failure remains an environment limitation rather than an application assertion result.

Remote evidence for the whole-system SHA `d7e4c6f002bbbfade2976f5d1a98447ec8f66c64`:

```text
COMMIT_STATUS state=success total=2
STATUS context=Vercel – student-hub-ai state=success description=Deployment has completed
STATUS context=Vercel – student-hub-ai-weje state=success description=Deployment has completed
RUN id=33349581826 status=completed conclusion=success
RUN id=33349579900 status=completed conclusion=success
DEPLOYMENT environment=Preview – student-hub-ai state=success target=https://student-hub-m3ie7s31z-vi-be-city.vercel.app
DEPLOYMENT environment=Preview – student-hub-ai-weje state=success target=https://student-hub-ai-weje-efy4cmp7w-vi-be-city.vercel.app
PREVIEW_SMOKE status=200 server=Vercel target=/ and /trust for both deployments
```

Both remote `quality` jobs completed successfully, including install, lint, production build, discovered regression suite, AI Gateway contract, security regression, authorization inventory, mutation protection, bundle budget, dependency audit, and Chromium and Firefox Evidence Case Lab gates. The remote Firefox result is the browser evidence; the local Firefox launch failure is not silently relabeled as a pass.

## 13. Exact external limitations

1. Layer 2A: the one-time Render `google.com` state probe returned no body and exited 1 after timeout/interruption; `STUDENTHUB_LAYER2_BASE_URL` was unset. The required verdict is `L2A_M3_BLOCKED_BY_EXTERNAL_BACKEND`. The official phishing canary separately returned `DANGEROUS`, so no `BACKEND_DEFECT` was declared.
2. Layer 2B: no AI gateway credentials or URL were configured; the deterministic fallback passed its adversarial tests, but a live gateway M3 claim is unavailable. Verdict: `L2B_M3_BLOCKED_BY_MISSING_EVIDENCE`.
3. Layer 3: no retrieval-provider URL was configured; the local knowledge base and guarded failure path passed, but live independent retrieval evidence is unavailable. Verdict: `L3_M3_BLOCKED_BY_MISSING_EVIDENCE`.
4. The live database phase was not runnable locally: `npm run test:phase3-live` returned exactly `BLOCKED_BY_DATABASE_ENV: STUDENTHUB_RLS_TEST_DATABASE_URL is required` and exited 2. This is an external environment blocker, not a passing database claim.
5. Local Firefox launch returned `spawn UNKNOWN`; remote Firefox CI passed. No local Firefox pass is claimed.
6. Vercel Preview is deployed and smoke-tested above. Production deployment is blocked by missing Vercel authorization: `Vercel CLI 54.7.1` returned `No existing credentials found. Starting login flow...` and entered device authentication. No `vercel --prod` operation was executed, and `main` was not changed.

## 14. Final verdicts

| Scope | Evidence-backed verdict |
| --- | --- |
| Layer 1 | `L1_M3_PASS` — six boundary tests `6 pass / 0 fail`, historical corpus `TP=57 TN=66 FP=0 FN=0`, and remote quality success; controls at the cited Layer 1 functions. |
| Layer 2A | `L2A_M3_BLOCKED_BY_EXTERNAL_BACKEND` — eight boundary tests `8 pass / 0 fail`, test-only mock remains `UNKNOWN`, but the one-time external backend probe was unavailable. |
| Layer 2B | `L2B_M3_BLOCKED_BY_MISSING_EVIDENCE` — six boundary tests `6 pass / 0 fail` and mutation `15/15 killed`, but no live AI gateway state. |
| Layer 3 | `L3_M3_BLOCKED_BY_MISSING_EVIDENCE` — seven boundary tests `7 pass / 0 fail`, historical `8/8`, but no live retrieval provider. |
| Layer 4 | `L4_M3_PASS` — thirteen boundary tests `13 pass / 0 fail`, historical `8/8`, and mutation `15/15 killed`; deterministic policy remains authoritative. |
| Preview deployment | `DEPLOYED` — GitHub deployment API reported both Preview environments `success`; the two exact target URLs returned HTTP `200` for `/` and `/trust`. |
| Production deployment | `PRODUCTION_BLOCKED_BY_MISSING_VERCEL_CREDENTIAL` — no authenticated CLI/project link was available; no production claim is made. |

System verdict: `TRUST_ENGINE_SOVEREIGN_HIGH_ASSURANCE_PASS_WITH_EXTERNAL_LIMITATIONS`. This is a bounded engineering verdict for the tested deterministic/fail-safe implementation and green remote CI/Vercel status. It is not an unqualified “all layers live M3” release verdict because Layers 2A, 2B, and 3 have the exact external/missing-evidence blockers above, and the local live database phase is unavailable.

PR verdict: `PR2_NOT_READY` for an unqualified high-impact M3 release. PR #2 is still open and Draft (`draft=True`, `merged=False`), its implementation was pushed to `develop`, and `main` was not merged or modified. No government certification is claimed.

Any claim beyond the cited source paths, exact test names, raw counts, and stated runtime states is: `UNVERIFIED_CLAIM — requires human verification`.
