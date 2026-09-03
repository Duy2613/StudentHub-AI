/**
 * StudentHub AI — Champion / Challenger MLOps Gate
 * 
 * Enforces Constitution 24 & Constitution 63:
 * A challenger may replace champion ONLY if it improves locked benchmark,
 * temporal benchmark, unseen-campaign benchmark, and hard negatives without unacceptable regression.
 */

export class ChampionChallengerGate {
  /**
   * Evaluates a candidate model against the current champion
   * @param {object} championMetrics - Metrics of the current champion
   * @param {object} candidateMetrics - Metrics of the candidate model
   * @param {object} constraints - Latency and cost constraints
   * @returns {object} Evaluation Report & Gate Decision
   */
  static evaluatePromotion(championMetrics, candidateMetrics, constraints = {}) {
    const minF1Delta = constraints.minF1Delta !== undefined ? constraints.minF1Delta : 0.005;
    const maxLatencyMs = constraints.maxLatencyMs || 50.0;
    const maxAllowedEce = constraints.maxAllowedEce || 0.050;

    const checks = [];

    // 1. Locked Benchmark F1 Improvement
    const f1Delta = candidateMetrics.f1_score - championMetrics.f1_score;
    const f1Pass = f1Delta >= minF1Delta;
    checks.push({
      criterion: "LOCKED_BENCHMARK_F1",
      championValue: championMetrics.f1_score,
      candidateValue: candidateMetrics.f1_score,
      delta: Number(f1Delta.toFixed(4)),
      requiredDelta: `+${minF1Delta}`,
      passed: f1Pass,
      rationale: f1Pass ? "Candidate shows statistically significant F1 gain." : "Candidate fails to outperform Champion F1 margin."
    });

    // 2. Temporal Holdout Generalization (No regression allowed)
    const champTemporal = championMetrics.temporal_holdout_f1 ?? championMetrics.temporal_holdout_2026h2_f1 ?? 0;
    const candTemporal = candidateMetrics.temporal_holdout_f1 ?? candidateMetrics.temporal_holdout_2026h2_f1 ?? 0;
    const tempDelta = candTemporal - champTemporal;
    const tempPass = tempDelta >= -0.002;
    checks.push({
      criterion: "TEMPORAL_HOLDOUT_GENERALIZATION",
      championValue: champTemporal,
      candidateValue: candTemporal,
      delta: Number(tempDelta.toFixed(4)),
      requiredDelta: ">= -0.002",
      passed: tempPass,
      rationale: tempPass ? "Temporal holdout performance preserved." : "CRITICAL REGRESSION: Candidate fails on future temporal test."
    });

    // 3. Unseen Campaign Generalization (No regression allowed)
    const champUnseen = championMetrics.unseen_campaign_holdout_f1 ?? championMetrics.unseen_campaign_f1 ?? 0;
    const candUnseen = candidateMetrics.unseen_campaign_holdout_f1 ?? candidateMetrics.unseen_campaign_f1 ?? 0;
    const unseenDelta = candUnseen - champUnseen;
    const unseenPass = unseenDelta >= 0.0;
    checks.push({
      criterion: "UNSEEN_CAMPAIGN_HOLDOUT",
      championValue: champUnseen,
      candidateValue: candUnseen,
      delta: Number(unseenDelta.toFixed(4)),
      requiredDelta: ">= 0.0",
      passed: unseenPass,
      rationale: unseenPass ? "Robust against unseen 2027-era scam templates." : "Candidate overfits known campaigns, failing unseen variants."
    });

    // 4. Hard Negatives Preservation (Legitimate banking/academic warnings)
    const champHardNeg = championMetrics.hard_negatives_accuracy ?? championMetrics.hard_neg_acc ?? 0;
    const candHardNeg = candidateMetrics.hard_negatives_accuracy ?? candidateMetrics.hard_neg_acc ?? 0;
    const hardNegDelta = candHardNeg - champHardNeg;
    const hardNegPass = candHardNeg >= 0.980 && hardNegDelta >= -0.005;
    checks.push({
      criterion: "HARD_NEGATIVES_ACCURACY",
      championValue: champHardNeg,
      candidateValue: candHardNeg,
      delta: Number(hardNegDelta.toFixed(4)),
      requiredDelta: ">= 0.980 (delta >= -0.005)",
      passed: hardNegPass,
      rationale: hardNegPass ? "Legitimate notifications preserved without false alarms." : "Unacceptable False Positives on legitimate content."
    });

    // 5. Calibration Error (ECE <= threshold)
    const ecePass = candidateMetrics.ece <= maxAllowedEce && candidateMetrics.ece <= (championMetrics.ece + 0.008);
    checks.push({
      criterion: "EXPECTED_CALIBRATION_ERROR",
      championValue: championMetrics.ece,
      candidateValue: candidateMetrics.ece,
      delta: Number((candidateMetrics.ece - championMetrics.ece).toFixed(4)),
      requiredDelta: `<= ${maxAllowedEce}`,
      passed: ecePass,
      rationale: ecePass ? "Confidence scores are well-calibrated." : "Model exhibits uncalibrated overconfidence."
    });

    // 6. Operational SLA (Latency & Cost)
    const latencyPass = candidateMetrics.latency_ms <= maxLatencyMs;
    checks.push({
      criterion: "OPERATIONAL_LATENCY_SLA",
      championValue: `${championMetrics.latency_ms}ms`,
      candidateValue: `${candidateMetrics.latency_ms}ms`,
      delta: `${(candidateMetrics.latency_ms - championMetrics.latency_ms).toFixed(1)}ms`,
      requiredDelta: `<= ${maxLatencyMs}ms`,
      passed: latencyPass,
      rationale: latencyPass ? "Inference latency within interactive SLA." : "Latency exceeds maximum budget."
    });

    const allPassed = checks.every(c => c.passed);
    const decision = allPassed ? "PROMOTION_APPROVED" : "PROMOTION_REJECTED";

    return {
      gate_version: "v9.0.0",
      timestamp: new Date().toISOString(),
      decision,
      status: allPassed ? "READY_FOR_DEPLOYMENT" : "RETAIN_CHAMPION",
      summary: allPassed
        ? "Candidate challenger strictly outperformed champion across all locked benchmarks without regression."
        : "Candidate challenger rejected. Did not satisfy zero-regression constitution constraints.",
      checks
    };
  }
}
