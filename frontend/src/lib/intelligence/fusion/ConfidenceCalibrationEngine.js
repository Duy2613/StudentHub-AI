/**
 * StudentHub AI — Multi-Dimensional Confidence & Brier Calibration Engine V2
 * Calculates explainable confidence scores and measures calibration error against empirical historical outcomes.
 */

export class ConfidenceCalibrationEngine {
  static #calibrationHistory = [];

  /**
   * Calculates multidimensional confidence components for an intelligence claim
   * @param {object} params
   * @param {object[]} [params.supportingEvidence]
   * @param {object[]} [params.contradictingEvidence]
   * @param {object} [params.consensusData]
   * @param {object} [params.expertSignals]
   * @param {number} [params.freshnessScore]
   * @returns {object} Full confidence assessment breakdown
   */
  static evaluateConfidence({
    supportingEvidence = [],
    contradictingEvidence = [],
    consensusData = null,
    expertSignals = null,
    freshnessScore = 0.90
  }) {
    // 1. Evidence Confidence (weighted by 8 dimensions)
    const totalSupportingQuality = supportingEvidence.reduce((acc, e) => acc + (e.qualityWeight || 0.7), 0);
    const evidenceConfidence = Math.min(0.95, totalSupportingQuality / Math.max(1, supportingEvidence.length || 1));

    // 2. Source Confidence (authority of underlying publishers)
    const avgSourceAuthority = supportingEvidence.reduce((acc, e) => acc + (e.authority || 0.8), 0) / Math.max(1, supportingEvidence.length || 1);
    const sourceConfidence = Math.min(0.98, avgSourceAuthority);

    // 3. Temporal Confidence (recency decay)
    const temporalConfidence = Math.max(0.20, Math.min(1.0, freshnessScore));

    // 4. Consensus Confidence (community agreement)
    const consensusConfidence = consensusData && consensusData.consensusPercentage
      ? (consensusData.consensusPercentage / 100)
      : 0.50;

    // 5. Contradiction Penalty
    const contradictionPenalty = Math.min(0.60, contradictingEvidence.length * 0.20);

    // 6. Calibrated Overall Confidence (Conservative, bounded strictly < 0.98 to prevent false certainty)
    const rawScore = (
      evidenceConfidence * 0.40 +
      sourceConfidence * 0.25 +
      temporalConfidence * 0.20 +
      consensusConfidence * 0.15
    ) - contradictionPenalty;

    const overallConfidence = Math.max(0.10, Math.min(0.95, Number(rawScore.toFixed(3))));

    let confidenceBand = "CAO";
    if (overallConfidence >= 0.80) confidenceBand = "RẤT ĐÁNG TIN CẬY (HIGH)";
    else if (overallConfidence >= 0.60) confidenceBand = "MỨC ĐỘ VỪA PHẢI (MODERATE)";
    else if (overallConfidence >= 0.40) confidenceBand = "CẦN THẬN TRỌNG (LOW)";
    else confidenceBand = "THIẾU MINH CHỨNG (INSUFFICIENT)";

    return {
      overallConfidence,
      confidenceBand,
      dimensions: {
        evidenceConfidence: Number(evidenceConfidence.toFixed(3)),
        sourceConfidence: Number(sourceConfidence.toFixed(3)),
        temporalConfidence: Number(temporalConfidence.toFixed(3)),
        consensusConfidence: Number(consensusConfidence.toFixed(3)),
        contradictionPenalty: Number(contradictionPenalty.toFixed(3))
      },
      supportingCount: supportingEvidence.length,
      contradictingCount: contradictingEvidence.length,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Records a historical prediction vs empirical observed outcome for Brier Score calibration
   * @param {object} record - { claimId, predictedConfidence, observedOutcome: 1 | 0, domain, timestamp }
   */
  static recordCalibrationData(record) {
    if (record.predictedConfidence === undefined || record.observedOutcome === undefined) {
      throw new Error("recordCalibrationData requires predictedConfidence and observedOutcome.");
    }

    const item = {
      recordId: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      claimId: record.claimId || "unknown",
      predictedConfidence: Math.max(0, Math.min(1, Number(record.predictedConfidence))),
      observedOutcome: Number(record.observedOutcome) === 1 ? 1 : 0,
      domain: record.domain || "academic",
      timestamp: record.timestamp || new Date().toISOString()
    };

    this.#calibrationHistory.push(item);
    return item;
  }

  /**
   * Computes the Brier Score across historical predictions: BS = (1/N) * sum((f_t - o_t)^2)
   * Target: BS closer to 0 indicates superior probability calibration (BS < 0.15 is considered well-calibrated).
   */
  static calculateBrierScore(domain = null) {
    const dataset = domain
      ? this.#calibrationHistory.filter(c => c.domain === domain)
      : this.#calibrationHistory;

    if (dataset.length === 0) {
      return {
        sampleSize: 0,
        brierScore: 0.0,
        calibrationQuality: "CHƯA ĐỦ DỮ LIỆU HIỆU CHUẨN",
        meanPrediction: 0.0,
        meanOutcome: 0.0
      };
    }

    let sumSquaredDiff = 0;
    let sumPrediction = 0;
    let sumOutcome = 0;

    for (const item of dataset) {
      const diff = item.predictedConfidence - item.observedOutcome;
      sumSquaredDiff += (diff * diff);
      sumPrediction += item.predictedConfidence;
      sumOutcome += item.observedOutcome;
    }

    const n = dataset.length;
    const brierScore = Number((sumSquaredDiff / n).toFixed(4));
    const meanPrediction = Number((sumPrediction / n).toFixed(3));
    const meanOutcome = Number((sumOutcome / n).toFixed(3));
    const calibrationError = Number(Math.abs(meanPrediction - meanOutcome).toFixed(3));

    let calibrationQuality = "HIỆU CHUẨN TỐT (WELL CALIBRATED)";
    if (brierScore > 0.25) calibrationQuality = "KÉM HIỆU CHUẨN (POOR CALIBRATION)";
    else if (brierScore > 0.15) calibrationQuality = "HIỆU CHUẨN CHẤP NHẬN ĐƯỢC (ACCEPTABLE)";

    return {
      sampleSize: n,
      brierScore,
      meanPrediction,
      meanOutcome,
      calibrationError,
      calibrationQuality,
      isOverconfident: meanPrediction > meanOutcome + 0.05,
      isUnderconfident: meanPrediction < meanOutcome - 0.05
    };
  }

  static clear() {
    this.#calibrationHistory = [];
  }
}
