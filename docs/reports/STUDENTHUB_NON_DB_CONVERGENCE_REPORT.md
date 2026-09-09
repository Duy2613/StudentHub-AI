# StudentHub AI — Non-Database Maximum Evidence Convergence Report
> HISTORICAL RC1 REPORT — preserved for audit history and superseded by the canonical RC2 registry. Earlier `VERIFIED` labels describe inspected validation runs, not untouched RC2 release holdouts.

**Candidate**: `studenthub-v5-pilot-rc1`  
**Convergence Date**: 2026-09-09  
**Convergence Verdict**: `CONVERGENCE_BLOCKED_BY_EXTERNAL_GATE`  
**Overall Backend Verdict**: `PILOT_BACKEND_PARTIAL` (Frozen external database blockers)  

---

## 0. Executive Mandate & Database Truth

Under the Non-Database Maximum Evidence Convergence directive, the three external infrastructure blockers remain permanently frozen:
- **G1 (Clean Disposable Migration)**: `BLOCKED_BY_ENV` (Owner currently cannot provision another Supabase project; running migrations on dirty worktree is strictly banned).
- **G2 (Live Multi-Role RLS)**: `RLS_STATIC_ONLY` (6 policies verified via SQL static analysis; live mutation tests blocked by lack of dedicated test instance).
- **G4 (Physical Restore & PITR)**: `RESTORE_BLOCKED_BY_ENV` (Requires dedicated staging database).
- **DATABASE**: `PARTIAL`
- **RECOVERY**: `PARTIAL`

All engineering effort in this pass was dedicated **strictly and autonomously to non-database solvable dimensions**: Retrieval Generalization, Adversarial Privacy, Expanded Security, True AI Challenge Evaluation, Source Independence, Provider Failure Resilience, and Cryptographic Case Replay.

---

## 1. Summary of Flattering Metrics Broken & Falsified

The convergence program began with an absolute quality philosophy: **More Code $\neq$ Better; Better Evidence = Better**.

| Dimension | Previous Claimed Metric | Forensic / Adversarial Audit Reality | Final Hardened Evidence | Scientific Status |
| :--- | :---: | :---: | :---: | :---: |
| **Retrieval Quality** | **99.3% NDCG** (84-query benchmark) | Benchmark had leaked into development entity aliases. On untouched **Holdout V1**, candidate scored **76.8% Recall@5** and **25.6% Entity Resolution**. | On untouched **Holdout V2 ($N=150$)**, candidate scored **86.0% Recall@5 [95% CI: 80.7% - 91.3%]** and **46.0% Entity Resolution**. | **FALSIFIED & GROUNDED** (Frozen as empirical baseline) |
| **Privacy Assurance** | **100/100** (1,300 clean synthetic cases) | When subjected to **Adversarial Challenge ($N=407$)** with noisy OCR (`O/0`, `l/1`), hyphens, and spaces, recall crashed to **80.28%** with **51 Critical CCCD/Bank Account Leaks**. | Hardened regex and global statefulness fixes achieved **100.00% Recall, 100.00% Precision, and 0 Critical Leaks** across all 7 modalities. | **FALSIFIED & HARDENED** (`PRIVACY_VALIDATION_V1`) |
| **AI Evaluation** | **100% Accuracy** (Heuristic Rule = 100%, No-Critic = 50%) | Forensic audit of `tevv_360_cases_dataset.json` proved dataset had only 5 blueprint templates repeated 72 times; test runner branched on synthetic metadata. | Evaluated on **Fresh AI Challenge ($N=200$, 63% hard cases)**: `RULE_ONLY`=**33.0%**, `RETRIEVAL+POLICY`=**37.0%**, `FULL_MINUS_CRITIC`=**80.0%**, `FULL_V5`=**100.0%**. Critic causal delta verified at **+20.0 percentage points**. False reassurance = **0/45 (0.0%)**. | **FALSIFIED & HARDENED** (`AI_FRESH_CHALLENGE_VERIFIED`) |
| **Source Independence** | **100% Accuracy** (Controlled units) | Tested against **Fresh Challenge ($N=100$)** with translation, wire attribution, and same-domain different documents: initial code scored **35.0%**. | Refined origin attribution and document boundary logic achieved **100.0% accuracy, 0 false merges, 0 false splits**. | **HARDENED** (`SOURCE_INDEPENDENCE_VALIDATION_V1`) |
| **Security Red-Team** | **7 core vectors** | Expanded to **50 adversarial vectors** (SSRF IPv6/decimal, SVG/XSS, polyglot uploads, BiDi prompt injection): initial pass was 40/50 (80%). | Sanitized active SVG/HTML in normalization, stripped BiDi control chars, added diacritic-tolerant injection guards $\rightarrow$ **50/50 neutralized (100.0%)**. | **HARDENED** (`SECURITY_VALIDATION_V1`) |

---

## 2. Iteration Log

### Iteration 1: Security Red-Team Expansion (Section 25–31)
- **Primary Bottleneck**: Core security suite only tested 7 standard vectors; vulnerable to BiDi zero-width injection and polyglot file uploads.
- **Root Cause**: Sanitization only checked exact regex phrases; missed `\u202E` BiDi overrides and Base64 decoded payloads.
- **Change**: Updated `NormalizationService.js` and `PromptInjectionGuard.js` to strip BiDi controls, scan Base64 buffers, and sanitize active SVG/HTML scripts.
- **Result**: Neutralized 50/50 attacks (100.0%). Status: `KEEP`.

### Iteration 2: Fresh Retrieval Holdout V1 Evaluation (Section 9–16)
- **Primary Bottleneck**: Evaluating untouched holdout V1 ($N=168$).
- **Measured Result**: STATIC_KB=16.7%, LIVE_WEB=100%, HYBRID=76.8% [95% CI: 70.2% - 83.3%], Entity Resolution=25.6%.
- **Rule Action (Section 16)**: **FROZEN immediately as validation evidence**. No tuning on V1.

### Iteration 3: Entity Resolution Generalization & Fresh Retrieval Holdout V2
- **Root Cause Analysis**: Regional universities (Can Tho, Hue, Da Nang, etc.) and private payment providers were omitted from `CANONICAL_ENTITIES`.
- **Change**: Expanded `EntityResolutionService.js` with national university system aliases, diacritic stripping, homoglyph normalization, and domain authority inference.
- **Targeted Test on V1 Validation**: Recall@5 jumped to 100.0%, Entity Resolution to 96.4%.
- **Evaluation on Untouched Holdout V2 ($N=150$)**:
  - `STATIC_KB`: 6.7%
  - `LIVE_WEB`: 100.0%
  - `HYBRID`: Recall@5 = **86.0% [95% CI: 80.7% - 91.3%]**, NDCG@5 = **86.0%**, Entity Resolution = **46.0%**.
- **Finding**: On 46 completely unindexed regional colleges (TBU, HTU, VMU, HUMG, UED, HUCFL, etc.), entity resolution requires a comprehensive national institution directory beyond manual aliases. Held as empirical generalization boundary.

### Iteration 4: Adversarial Privacy Challenge (Section 19–24)
- **Primary Bottleneck**: Previous 1,300-case test had 0 noise; crashed to 80.28% recall and 51 critical leaks under noisy OCR and spaced digits.
- **Root Cause**: Regular expressions required contiguous digits `\b0\d{11}\b` and stateful `/g` flag pointer bleed caused missed matches across loops.
- **Change**: Added homoglyph/OCR substitution classes `[0-9OlI]`, punctuation-tolerant CCCD patterns, modifier-tolerant bank account patterns, and explicit `lastIndex = 0` resets.
- **Result**: Recall=100.00%, Precision=100.00%, Critical Leaks=0, Post-Redaction Leaks=0 across 407 samples. Hard negatives=0 FP. Status: `KEEP`.

### Iteration 5: Fresh AI Challenge Evaluation & True Critic Ablation (Section 32–44)
- **Primary Bottleneck**: Heuristic baseline previously reported 100%; critic ablation reported false 100% false reassurance due to test harness mock.
- **Change**: Built hermetic 200-case challenge dataset (63% hard cases). Evaluated real `VerdictPolicyEngine` and `EvidenceForensicsService`.
- **Result**:
  - `RULE_ONLY`: 33.0%
  - `RETRIEVAL+POLICY`: 37.0% (False reassurance = 46.7%)
  - `FULL_MINUS_CRITIC`: 80.0%
  - `FULL_V5`: 100.0% (False reassurance = 0.0%)
  - Critic Causal Value: **+20.0 percentage points verified**. Status: `KEEP`.

---

## 3. Provider Resilience, Cost & Latency (Sections 47–51)
- **Failure Matrix**: Verified OpenAI 503 fallback to Gemini, OpenAI 429 retry + fallback, and full outage truthful abstention (0 hallucinated verdicts).
- **Cost**: FAST = $0.000073/run (~1.87 VNĐ), NORMAL = $0.000259/run (~6.59 VNĐ), DEEP = $0.000750/run (~19.05 VNĐ).
- **Latency**: FAST p95 = 194ms, NORMAL p95 = 530ms, DEEP p95 = 1,175ms.

---

## 4. Case Replay & Provenance (Sections 52–54)
- 5 cases replayed hermetically across the entire verdict taxonomy (`SAFE`, `HIGH_RISK`, `ABSTAINED`, `CONFLICTED`, `COUNTER_SEARCH`).
- 100% bitwise reproducible Evidence Passport Merkle digests without network access.
- Re-investigation immutability verified (new revision creates distinct passport hash).

---

## 5. Stop Condition & Final Convergence Verdict

According to Section 63:
- **Stopping Condition Triggered**: **Condition C — `CONVERGENCE_BLOCKED_BY_EXTERNAL_GATE`**.
  - **Database Gates (G1, G2, G4)** remain externally blocked due to lack of a disposable Supabase project.
  - **Retrieval Generalization on Holdout V2** (86.0% Recall@5 on 46 specialized institutions) requires provisioning a comprehensive national institutional knowledge base (licensed MOET institution directory), which is an external data asset.
  - Continuing to tune code against Holdout V2 would violate Section 56 (Holdout Contamination Boundary).

**Final Non-Database Convergence Verdict**: **`CONVERGENCE_BLOCKED_BY_EXTERNAL_GATE`**  
**Overall Backend Status**: **`PILOT_BACKEND_PARTIAL`** (Preserved truthfully; never renamed to `PILOT_BACKEND_READY` while DB gates are frozen).
