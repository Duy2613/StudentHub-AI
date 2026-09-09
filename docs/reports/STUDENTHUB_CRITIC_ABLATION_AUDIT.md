# StudentHub AI — Critic Ablation Forensics & Code-Path Delta Audit

- **Date:** 2026-09-09T18:15:00.000Z
- **Auditor:** Principal AI Systems & Assurance Forensic Auditor
- **Subject:** Mechanistic Audit of the Critic Ablation Pathway (`FULL` vs `NO_CRITIC`)
- **Evaluated Files:**
  - `frontend/tests/ai-eval/tevv_ai_evaluation.test.mjs` (Evaluation Harness)
  - `frontend/src/lib/server/trust/MultiModelVerifier.js` (Layer 4 Verification)
  - `frontend/src/lib/server/trust/VerdictPolicyEngine.js` (Layer 5 Policy Adjudication)
  - `frontend/src/lib/server/trust/TrustV5Engine.js` (Pipeline Orchestrator)

---

## 1. Executive Summary

The previous assurance report stated:
> *"Without critic false reassurance spikes to 100%"*

An adversarial forensic audit was performed to determine whether this was a true causal measurement or an artifact of an improperly constructed test harness.

**Forensic Finding:**
The dramatic 100% false reassurance spike in `frontend/tests/ai-eval/tevv_ai_evaluation.test.mjs` was **mechanically forced by the test runner's local mock**, not produced by running the real `TrustV5Engine.js`.

In `tevv_ai_evaluation.test.mjs`:
```javascript
// Line 43-45:
if (ablationMode !== "NO_CRITIC") {
  if (/nạp tiền|tạm ứng|chuyển khoản|2 triệu|phí giữ suất|telegram|800k\/ngày|20%/i.test(claim)) {
    criticFlaggedScam = true;
  }
}

// Line 56-59:
if (caseItem.riskType === "SCAM") {
  if (criticFlaggedScam) {
    predictedVerdict = "CONFIRMED_FRAUD";
    confidenceScore = 0.96;
  } else if (ablationMode === "NO_CRITIC") {
    // Hardcoded!
    predictedVerdict = "OFFICIALLY_VERIFIED"; // False reassurance!
    confidenceScore = 0.88;
  }
}
```

The test runner did not ablate the critic from an active pipeline. Instead, it literally set `predictedVerdict = "OFFICIALLY_VERIFIED"` whenever `ablationMode === "NO_CRITIC"`.

---

## 2. Production Code-Path Delta Analysis

To understand what the Critic *actually* does in the real system, we trace the execution path in `frontend/src/lib/server/trust/`:

### A. Full Pipeline (`FULL` Mode)
1. **Layer 1:** Input is normalized; atomic claims extracted; `FraudRiskEngine` calculates rule-based fraud signals.
2. **Layer 2:** `EvidenceDiscoveryService` fetches sources from institutional index and web.
3. **Layer 3:** `EvidenceForensicsService` clusters sources and evaluates relations (`SUPPORTS`, `CONTRADICTS`, `CONTEXTUALIZES`).
4. **Layer 4 (`MultiModelVerifier.js`):**
   - Deep Reasoner (`gpt-5.6-luna`) generates reasons and cites evidence IDs.
   - **Independent Critic (`gpt-5.6-luna`):** Audits evidence diversity (single-domain trap), detects stale/superseded policies, generates `criticNotes`, and appends cautions to `unknowns`.
   - Citation Validator strips hallucinated citations.
5. **Layer 5 (`VerdictPolicyEngine.js`):**
   - Applies deterministic safety rules over claims, relations, fraud scores, and model agreement.
   - If `hasContradiction` or `isHighFraudRisk`, flags `HIGH_RISK` or `CONTRADICTED`.
   - If sufficiency is low, abstains with `INSUFFICIENT_EVIDENCE`.

### B. True Ablation (`NO_CRITIC` Mode)
In a scientifically valid ablation, the **only** component disabled is the Layer 4 Critic step in `MultiModelVerifier.js`:
- The Critic notes on single-domain syndication and policy staleness are omitted.
- The downstream `VerdictPolicyEngine.js`, `FraudRiskEngine`, `CitationValidator`, and Layer 2 retrieval remain **100% active and identical**.

### C. Real World Impact of Removing the Critic
Under the real production pipeline:
- Removing the Critic **does NOT** cause obvious scams (with payment requests or contradiction in official bulletins) to suddenly pass as `OFFICIALLY_VERIFIED`, because `FraudRiskEngine` and `VerdictPolicyEngine.js` catch them.
- Where the Critic **genuinely** provides causal value is in **borderline, subtle, or single-source syndication traps**:
  - A sophisticated phishing post that mirrors university branding and has no explicit extortion keywords.
  - A student rumor that has 5 identical mirrors on Facebook, creating the illusion of multi-source confirmation. The Critic identifies that all 5 are syndicated from a single unverified blog and halts verification.
  - Stale regulations (e.g. 2021 tuition cap) where all retrieved documents are from official domains but are out of date. The Critic notes the publication dates and injects temporal caveats.

---

## 3. Corrected Scientific Protocol for Critic Ablation

Going forward, the ablation must be evaluated on the **Fresh AI Challenge Dataset** using the real `TrustV5Engine.verify({ ... })` pipeline with a dedicated `disableCritic: true` flag:
1. `FULL_V5`: Runs full 5 layers with active Critic.
2. `FULL_MINUS_CRITIC`: Runs full 5 layers with `disableCritic: true`. No other parameters, thresholds, or policies may differ by even a single byte.
3. Measure the exact difference in:
   - False reassurance on subtle single-domain syndication cases.
   - Stale policy detection rate.
   - Number of ungrounded assumptions caught.
