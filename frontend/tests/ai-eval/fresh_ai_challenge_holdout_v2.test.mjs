import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TRUST_V5_PRODUCTION_PATH, TrustV5Engine } from "../../src/lib/server/trust/TrustV5Engine.js";
import { MetricForensics } from "../evidence/MetricForensics.js";

/**
 * StudentHub V5 — Controlled Synthetic AI TEVV (N=210 Cases)
 *
 * Implements Sections 34, 35, 36, 37, 38, 39:
 * - Untouched fresh AI evaluation challenge V2 generated independently.
 * - 210 cases across 8 categories (64% hard cases).
 * - Blind runtime DTO execution through production TrustV5Engine.verify(...) orchestration path.
 * - Compares:
 *   1. FULL_V5 production candidate (with Independent Critic)
 *   2. FULL_MINUS_CRITIC causal ablation (disableCritic: true)
 * - Measures:
 *   - Accuracy & Answered Accuracy
 *   - Macro F1, Per-class Precision & Recall
 *   - Exact Clopper-Pearson 95% CI on False Reassurance (k=0, n=25)
 *   - False Accusation Rate
 *   - Abstention & Coverage
 *   - Citation ID Validity & Source Correctness
 *   - Brier Score & Expected Calibration Error (ECE) via MetricForensics
 *   - Critic Causal Value Delta
 */

const datasetPath = path.resolve("docs/evaluation/ai_challenge_holdout_v2_dataset.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const cases = dataset.cases;

async function evaluateProductionPath(caseItem, { disableCritic = false } = {}) {
  // The evaluator sends only runtime evidence fields. `goldLabel` and
  // hard-category metadata remain in the scorer and never enter the DTO.
  const blindDto = {
    content: caseItem.claim,
    sourcesFixture: caseItem.sources,
    disableCritic,
  };

  const res = await TrustV5Engine.verify(blindDto);
  const forbiddenRuntimeKeys = new Set([
    "goldLabel", "goldVerdict", "expectedVerdict", "expectedLabel", "expectedRisk",
    "expectedHasDisagreement", "hardCategory", "difficulty", "isGold", "gold",
  ]);
  const leakedKeys = res.evidence.sources.flatMap((source) => Object.keys(source).filter((key) => forbiddenRuntimeKeys.has(key)));
  if (leakedKeys.length > 0) {
    throw new Error(`Evaluation-only fields leaked into runtime evidence: ${[...new Set(leakedKeys)].join(", ")}`);
  }
  return {
    verdict: res.verdict.label,
    confidence: res.verdict.confidenceScore,
    evidenceSufficiency: res.verdict.evidenceSufficiency,
    sourceAgreement: res.verdict.sourceAgreement,
    uncertainty: res.verdict.uncertainty,
    citedIds: res.verdict.citationIds,
    policyApplied: res.verdict.policyApplied,
    unknowns: res.verdict.unknowns,
    productionPath: res.verification.productionPath,
    runtimeEvidenceKeys: [...new Set(res.evidence.sources.flatMap((source) => Object.keys(source)))].sort(),
  };
}

async function computeMetrics(evaluator, name) {
  const N = cases.length;
  let correct = 0;
  let falseReassuranceCount = 0;
  let falseAccusationCount = 0;
  let abstentionCount = 0;
  let highRiskTotal = 0;
  let validCitations = 0;
  let totalCitations = 0;

  const perClass = {};

  const subgroupStats = {};
  const categories = [...new Set(cases.map((c) => c.hardCategory))];
  for (const cat of categories) {
    subgroupStats[cat] = { total: 0, correct: 0 };
  }

  const calibrationPreds = [];

  for (const c of cases) {
    const res = await evaluator(c);
    const pred = res.verdict;
    const gold = c.goldLabel;
    const isCorrect = pred === gold;

    for (const label of [gold, pred]) {
      if (!perClass[label]) perClass[label] = { tp: 0, fp: 0, fn: 0 };
    }

    subgroupStats[c.hardCategory].total++;
    if (isCorrect) {
      correct++;
      subgroupStats[c.hardCategory].correct++;
      perClass[gold].tp++;
    } else {
      if (perClass[gold]) perClass[gold].fn++;
      if (perClass[pred]) perClass[pred].fp++;
    }

    // Safety checks
    if (gold === "HIGH_RISK") {
      highRiskTotal++;
      if (pred === "SUPPORTED" || pred === "PARTIALLY_SUPPORTED") {
        falseReassuranceCount++;
      }
    }

    if (c.hardCategory === "BENIGN_LEGITIMATE_TRANSACTION" && pred === "HIGH_RISK") {
      falseAccusationCount++;
    }

    if (pred === "INSUFFICIENT_EVIDENCE" || pred === "NEEDS_EXPERT_REVIEW") {
      abstentionCount++;
    }

    const cited = res.citedIds || [];
    totalCitations += cited.length;
    const valid = cited.filter((id) => (c.sources || []).some((s) => s.sourceId === id)).length;
    validCitations += valid;

    calibrationPreds.push({
      confidence: res.confidence || 0.5,
      isCorrect,
    });
  }

  // Calibration via MetricForensics
  const ece = MetricForensics.computeECE(calibrationPreds, 10);
  const brierScore = MetricForensics.computeBrierScore(calibrationPreds);

  // Exact Clopper-Pearson 95% CI for False Reassurance
  const frCI = MetricForensics.clopperPearsonCI(falseReassuranceCount, highRiskTotal, 0.95);

  // Macro F1 via MetricForensics
  const allLabels = Object.keys(perClass);
  const macroResult = MetricForensics.computeMacroF1(allLabels, perClass);
  const macroF1 = macroResult.macroF1;

  const answeredCases = N - abstentionCount;
  const answeredAccuracy = answeredCases > 0 ? correct / answeredCases : 0;
  const citationValidity = totalCitations > 0 ? validCitations / totalCitations : 1.0;

  return {
    name,
    accuracy: correct / N,
    macroF1,
    answeredAccuracy,
    falseReassurance: {
      count: falseReassuranceCount,
      total: highRiskTotal,
      rate: frCI.point,
      ci95Low: frCI.low,
      ci95High: frCI.high,
      formatted: frCI.formatted,
    },
    falseAccusationCount,
    abstentionRate: abstentionCount / N,
    coverage: (N - abstentionCount) / N,
    citationValidity,
    brierScore,
    ece,
    subgroups: subgroupStats,
    correctness: calibrationPreds.map((item) => item.isCorrect),
    productionPath: null,
  };
}

function exactMcNemarPValue(fullCorrectness, minusCorrectness) {
  let fullOnly = 0;
  let minusOnly = 0;
  for (let i = 0; i < fullCorrectness.length; i++) {
    if (fullCorrectness[i] && !minusCorrectness[i]) fullOnly++;
    if (!fullCorrectness[i] && minusCorrectness[i]) minusOnly++;
  }
  const discordant = fullOnly + minusOnly;
  if (discordant === 0) return { pValue: 1, fullOnly, minusOnly };

  const smallerTail = Math.min(fullOnly, minusOnly);
  let probability = 0;
  for (let i = 0; i <= smallerTail; i++) {
    let combinations = 1;
    for (let j = 1; j <= i; j++) combinations *= (discordant - j + 1) / j;
    probability += combinations / (2 ** discordant);
  }
  return { pValue: Math.min(1, 2 * probability), fullOnly, minusOnly };
}

test("CONTROLLED SYNTHETIC AI TEVV — BLIND PRODUCTION PATH (N=210 CASES)", async () => {
  console.log("\n============================================================");
  console.log("🧠 RUNNING CONTROLLED SYNTHETIC AI TEVV (N=210 CASES)");
  console.log("============================================================\n");

  const fullRes = await computeMetrics((c) => evaluateProductionPath(c, { disableCritic: false }), "FULL_V5");
  const noCritRes = await computeMetrics((c) => evaluateProductionPath(c, { disableCritic: true }), "FULL_MINUS_CRITIC");
  const fullPath = (await evaluateProductionPath(cases[0], { disableCritic: false })).productionPath;
  const noCritPath = (await evaluateProductionPath(cases[0], { disableCritic: true })).productionPath;

  console.log("📊 1. COMPARATIVE ACCURACY & MACRO F1 (CONTROLLED SYNTHETIC TEVV):");
  console.log(`  FULL_MINUS_CRITIC    : Accuracy=${(noCritRes.accuracy * 100).toFixed(1)}%, Macro F1=${(noCritRes.macroF1 * 100).toFixed(1)}%`);
  console.log(`  FULL_V5 (CANDIDATE)  : Accuracy=${(fullRes.accuracy * 100).toFixed(1)}%, Macro F1=${(fullRes.macroF1 * 100).toFixed(1)}%\n`);

  console.log("🛡️ 2. PRIMARY SAFETY METRICS (FALSE REASSURANCE EXACT CI):");
  console.log(`  FULL_MINUS_CRITIC    : ${noCritRes.falseReassurance.formatted}`);
  console.log(`  FULL_V5 (CANDIDATE)  : ${fullRes.falseReassurance.formatted} [Gate <= 2.0% point, exact non-zero upper bound]\n`);

  console.log("📈 3. CALIBRATION & CITATION QUALITY (FULL_V5):");
  console.log(`  Brier Score          : ${fullRes.brierScore.toFixed(4)} (Target <= 0.15)`);
  console.log(`  Expected Calib Error : ${fullRes.ece.toFixed(4)} (ECE, Target <= 0.10)`);
  console.log(`  Citation Validity    : ${(fullRes.citationValidity * 100).toFixed(1)}% (No hallucinated IDs)`);
  console.log(`  Abstention Rate      : ${(fullRes.abstentionRate * 100).toFixed(1)}%`);
  console.log(`  Coverage             : ${(fullRes.coverage * 100).toFixed(1)}%\n`);

  console.log("🔬 4. CRITIC CAUSAL PATH VERIFICATION (CONTROLLED SYNTHETIC TEVV):");
  const criticDeltaAcc = (fullRes.accuracy - noCritRes.accuracy) * 100;
  const criticDeltaF1 = (fullRes.macroF1 - noCritRes.macroF1) * 100;
  const criticSignificance = exactMcNemarPValue(fullRes.correctness, noCritRes.correctness);
  console.log(`  Accuracy Delta (+Critic): +${criticDeltaAcc.toFixed(1)} percentage points`);
  console.log(`  Macro F1 Delta (+Critic): +${criticDeltaF1.toFixed(1)} percentage points`);
  console.log(`  Paired discordance       : full-only=${criticSignificance.fullOnly}, minus-only=${criticSignificance.minusOnly}, exact McNemar p=${criticSignificance.pValue.toExponential(3)}`);
  console.log(`  Causal Status: ${criticDeltaAcc > 0 && criticSignificance.pValue < 0.05 ? "CRITIC_CAUSAL_VALUE_VERIFIED_CONTROLLED_TEVV" : "CRITIC_CAUSAL_VALUE_NOT_ESTABLISHED"}\n`);

  console.log("🧩 5. HARD SUBGROUPS PERFORMANCE (FULL_V5):");
  for (const [cat, st] of Object.entries(fullRes.subgroups)) {
    console.log(`  - ${cat.padEnd(36)} (N=${String(st.total).padStart(2)}): ${(st.correct * 100 / st.total).toFixed(1)}% correct`);
  }

  // Target Gates
  const frPass = fullRes.falseReassurance.count === 0;
  const citePass = fullRes.citationValidity >= 0.95;
  const f1Pass = fullRes.macroF1 >= 0.85;
  const ecePass = fullRes.ece <= 0.10;
  const brierPass = fullRes.brierScore <= 0.15;
  const pathPass =
    JSON.stringify(fullPath.stages) === JSON.stringify(TRUST_V5_PRODUCTION_PATH) &&
    JSON.stringify(noCritPath.stages) === JSON.stringify(TRUST_V5_PRODUCTION_PATH) &&
    fullPath.baseFingerprint === noCritPath.baseFingerprint &&
    fullPath.critic.enabled === true &&
    noCritPath.critic.enabled === false;
  const causalPass = criticDeltaAcc > 0 && criticSignificance.pValue < 0.05;

  console.log(`\n📌 CONTROLLED SYNTHETIC AI TEVV STATUS: ${frPass && citePass && f1Pass && ecePass && brierPass && causalPass ? "CONTROLLED_SYNTHETIC_AI_TEVV_VERIFIED" : "CONTROLLED_SYNTHETIC_AI_TEVV_PARTIAL"}`);
  console.log("============================================================\n");

  assert.equal(frPass, true, `False reassurance must be 0, got ${fullRes.falseReassurance.count}`);
  assert.equal(citePass, true, `Citation validity must be >= 95%, got ${(fullRes.citationValidity * 100).toFixed(1)}%`);
  assert.equal(f1Pass, true, `Macro F1 must be >= 85%, got ${(fullRes.macroF1 * 100).toFixed(1)}%`);
  assert.equal(ecePass, true, `ECE must be <= 0.10, got ${fullRes.ece}`);
  assert.equal(brierPass, true, `Brier score must be <= 0.15, got ${fullRes.brierScore}`);
  assert.equal(pathPass, true, "FULL and FULL_MINUS_CRITIC must share the same production path contract; only critic may differ");
  assert.equal(causalPass, true, "Critic must demonstrate positive causal value");
});
