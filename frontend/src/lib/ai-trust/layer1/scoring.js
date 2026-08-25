/**
 * AI Trust & Scam Detection Pipeline — Layer 1 Confidence & Scoring Engine
 * 
 * Aggregates Hard Rules and Soft Signals into normalized confidence metrics:
 * - BLOCK: Hard trigger match (Confidence 0.95 - 0.99) -> Early Exit STOP
 * - SUSPICIOUS: Compound anomaly score >= 0.50 (Confidence 0.45 - 0.85) -> Forward to Layer 2
 * - PASS: Clean or Whitelist match (Confidence 0.90 - 0.99) -> Forward to Layer 2
 */

import { LAYER_1_STATUS, SIGNAL_TYPE, LAYER_1_REASONS } from "./types.js";

/**
 * Computes standardized Layer 1 evaluation
 * @param {object} params
 * @param {Array} params.signals - Array of all detected signals
 * @param {Array} params.hardTriggers - Array of matched hard triggers
 * @param {boolean} [params.isWhitelisted=false] - Whether domain/item is in authoritative whitelist
 * @returns {object} Standardized Layer 1 Output
 */
export function evaluateLayer1({ signals = [], hardTriggers = [], isWhitelisted = false }) {
  // Case 1: Hard BLOCK (Deterministic Early Exit)
  if (hardTriggers.length > 0) {
    const reasons = Array.from(new Set(hardTriggers.map((t) => t.reason)));
    
    // Confidence calculation: Max weight of matched hard triggers, bounded [0.95, 0.99]
    const maxHardWeight = Math.max(...hardTriggers.map((t) => t.signal?.weight || 0.95));
    const confidence = Math.min(0.99, Math.max(0.95, maxHardWeight));

    return {
      layer: 1,
      status: LAYER_1_STATUS.BLOCK,
      confidence: Number(confidence.toFixed(2)),
      reasons,
      signals,
      details: {
        hardTriggersCount: hardTriggers.length,
        totalSignalsCount: signals.length,
        earlyExit: true,
        nextAction: "STOP",
        decisionRationale: "Phát hiện bằng chứng gian lận / lừa đảo hoặc tệp độc hại chắc chắn theo quy tắc cứng (Hard Rules).",
      },
    };
  }

  // Case 2: Authoritative Whitelist PASS
  if (isWhitelisted) {
    return {
      layer: 1,
      status: LAYER_1_STATUS.PASS,
      confidence: 0.99,
      reasons: [LAYER_1_REASONS.WHITELISTED_DOMAIN],
      signals,
      details: {
        hardTriggersCount: 0,
        totalSignalsCount: signals.length,
        earlyExit: false,
        nextAction: "PROCEED_TO_LAYER_2",
        decisionRationale: "Khớp danh mục tên miền giáo dục / công lập chính thống (.edu.vn / .gov.vn).",
      },
    };
  }

  // Case 3: Soft Signals Compounding
  const dangerSignals = signals.filter((s) => s.type === SIGNAL_TYPE.DANGER);
  const warningSignals = signals.filter((s) => s.type === SIGNAL_TYPE.WARNING);

  // Calculate cumulative risk weight using probabilistic independent combination: 1 - product(1 - weight_i)
  const combinedRisk = 1 - [...dangerSignals, ...warningSignals].reduce(
    (acc, sig) => acc * (1 - (sig.weight || 0.3)),
    1
  );

  if (combinedRisk >= 0.50 || dangerSignals.length > 0 || warningSignals.length >= 2) {
    const reasons = Array.from(
      new Set(
        [...dangerSignals, ...warningSignals].map((s) =>
          s.id.toLowerCase().replace(/^sig_/, "")
        )
      )
    );

    // Confidence in the suspicious assessment bounded [0.45, 0.85]
    const confidence = Math.min(0.85, Math.max(0.45, Number(combinedRisk.toFixed(2))));

    return {
      layer: 1,
      status: LAYER_1_STATUS.SUSPICIOUS,
      confidence: Number(confidence.toFixed(2)),
      reasons,
      signals,
      details: {
        hardTriggersCount: 0,
        totalSignalsCount: signals.length,
        combinedRiskScore: Number(combinedRisk.toFixed(2)),
        earlyExit: false,
        nextAction: "PROCEED_TO_LAYER_2",
        decisionRationale: "Phát hiện nhiều tín hiệu bất thường nhưng chưa đủ điều kiện chặn cứng. Chuyển tiếp sang Layer 2 để đối chiếu danh sách đen & mô hình AI chuyên sâu.",
      },
    };
  }

  // Case 4: Default Clean PASS
  return {
    layer: 1,
    status: LAYER_1_STATUS.PASS,
    confidence: 0.92,
    reasons: [],
    signals,
    details: {
      hardTriggersCount: 0,
      totalSignalsCount: signals.length,
      earlyExit: false,
      nextAction: "PROCEED_TO_LAYER_2",
      decisionRationale: "Chưa phát hiện rủi ro rõ ràng ở tầng thẩm định nhanh. Chuyển tiếp Layer 2.",
    },
  };
}
