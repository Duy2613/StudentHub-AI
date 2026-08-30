/**
 * Layer 1 — DecisionEngine
 * 
 * Deterministic final decision resolver.
 * Maps signals and hard rules into normalized tri-state output: BLOCK / SUSPICIOUS / PASS.
 */

import { LAYER_1_STATUS, LAYER_1_REASONS, SIGNAL_SEVERITY, createLayer1Result } from "../types.js";
import { SignalAggregator } from "./SignalAggregator.js";
import { HardRuleEngine } from "./HardRuleEngine.js";
import { ConfidenceEngine } from "./ConfidenceEngine.js";

export class DecisionEngine {
  /**
   * Resolves final Layer 1 status and confidence
   * @param {object} params
   * @param {Array} params.signals - All detected signals
   * @param {boolean} [params.isWhitelisted=false] - Authoritative whitelist indicator
   * @param {string} [params.requestId]
   * @param {object} [params.metrics]
   * @param {boolean} [params.forceUnknown=false] - local boundary could not
   *   produce a reliable result; never convert this state to PASS
   * @param {string} [params.unknownReason]
  * @returns {object} Standardized Layer 1 Result DTO
  */
  static resolve(params = {}) {
    const hasObjectParams = params && typeof params === "object" && !Array.isArray(params);
    const input = hasObjectParams ? params : {};
    if (!hasObjectParams || !Array.isArray(input.signals)) {
      return createLayer1Result({
        status: LAYER_1_STATUS.UNKNOWN,
        confidence: 0,
        reasons: [LAYER_1_REASONS.INVALID_INPUT],
        nextLayer: 2,
        details: {
          decisionRationale: "Không nhận được tập tín hiệu cục bộ hợp lệ. Không suy diễn thành an toàn.",
          scope: "LOCAL_SCREEN_ONLY",
          providerIndependent: true,
          notFinalSafety: true,
        },
      });
    }
    const signals = input.signals;
    const isWhitelisted = input.isWhitelisted === true;
    const requestId = typeof input.requestId === "string" ? input.requestId.slice(0, 160) : null;
    const metrics = input.metrics && typeof input.metrics === "object" && !Array.isArray(input.metrics) ? input.metrics : {};
    const forceUnknown = input.forceUnknown === true;
    const unknownReason = typeof input.unknownReason === "string" ? input.unknownReason.slice(0, 160) : null;
    // 1. Deduplicate and aggregate signals
    const { uniqueSignals, severityCounts } = SignalAggregator.aggregate(signals);

    // 2. Evaluate Hard Rules (P0/P1)
    const hardRuleRes = HardRuleEngine.evaluate(uniqueSignals);

    // CASE 1: HARD BLOCK (Early Exit STOP)
    if (hardRuleRes.isHardBlock) {
      const confidence = ConfidenceEngine.calculate({
        status: LAYER_1_STATUS.BLOCK,
        signals: uniqueSignals,
        hardRuleConfidence: hardRuleRes.primaryConfidence,
      });

      return createLayer1Result({
        status: LAYER_1_STATUS.BLOCK,
        confidence,
        reasons: hardRuleRes.reasons,
        signals: uniqueSignals,
        nextLayer: null,
        requestId,
        metrics,
        details: {
          hardTriggersCount: hardRuleRes.matchedRules.length,
          matchedRules: hardRuleRes.matchedRules,
          decisionRationale: "Phát hiện bằng chứng gian lận / lừa đảo hoặc tệp độc hại chắc chắn theo quy tắc cứng (Hard Rules).",
        },
      });
    }

    const hasCritical = severityCounts[SIGNAL_SEVERITY.CRITICAL] > 0;
    const hasHigh = severityCounts[SIGNAL_SEVERITY.HIGH] > 0;
    const hasMedium = severityCounts[SIGNAL_SEVERITY.MEDIUM] > 0;

    // CASE 2: INVALID / INCOMPLETE LOCAL INSPECTION
    if (forceUnknown && !hasCritical) {
      return createLayer1Result({
        status: LAYER_1_STATUS.UNKNOWN,
        confidence: 0,
        reasons: [unknownReason || LAYER_1_REASONS.INVALID_INPUT],
        signals: uniqueSignals,
        nextLayer: 2,
        requestId,
        metrics,
        details: {
          hardTriggersCount: 0,
          decisionRationale: "Không thể hoàn tất kiểm tra cục bộ một cách đáng tin cậy. Không suy diễn thành an toàn.",
          scope: "LOCAL_SCREEN_ONLY",
          providerIndependent: true,
          notFinalSafety: true,
        },
      });
    }

    // CASE 3: AUTHORITATIVE WHITELIST HINT (only when no material signal)
    if (isWhitelisted && !hasHigh && !hasMedium) {
      const confidence = ConfidenceEngine.calculate({
        status: LAYER_1_STATUS.PASS,
        isWhitelisted: true,
        signals: uniqueSignals,
      });

      return createLayer1Result({
        status: LAYER_1_STATUS.PASS,
        confidence,
        reasons: [LAYER_1_REASONS.WHITELISTED_DOMAIN],
        signals: uniqueSignals,
        nextLayer: 2,
        requestId,
        metrics,
        details: {
          hardTriggersCount: 0,
          decisionRationale: "Tên miền thuộc danh mục xác thực chính thống (.edu.vn / .gov.vn / Đối tác xác minh).",
        },
      });
    }

    // CASE 4: SUSPICIOUS (Routing to Layer 2 for deeper analysis)
    if (hasCritical || hasHigh || hasMedium) {
      const confidence = ConfidenceEngine.calculate({
        status: LAYER_1_STATUS.SUSPICIOUS,
        signals: uniqueSignals,
      });

      const reasons = Array.from(
        new Set(
          uniqueSignals
            .filter((s) => s.severity !== SIGNAL_SEVERITY.INFO)
            .map((s) => s.type)
        )
      );

      return createLayer1Result({
        status: LAYER_1_STATUS.SUSPICIOUS,
        confidence,
        reasons,
        signals: uniqueSignals,
        nextLayer: 2,
        requestId,
        metrics,
        details: {
          hardTriggersCount: 0,
          severityCounts,
          decisionRationale: "Phát hiện tín hiệu bất thường cần đối chiếu sâu với Aggregator API & AI Vector RAG ở Layer 2.",
        },
      });
    }

    // CASE 5: CLEAN PASS (Routing to Layer 2)
    const confidence = ConfidenceEngine.calculate({
      status: LAYER_1_STATUS.PASS,
      signals: uniqueSignals,
    });

    return createLayer1Result({
      status: LAYER_1_STATUS.PASS,
      confidence,
      reasons: [],
      signals: uniqueSignals,
      nextLayer: 2,
      requestId,
      metrics,
      details: {
        hardTriggersCount: 0,
        decisionRationale: "Không phát hiện mối đe dọa trực diện ở Tầng 1. Chuyển tiếp Layer 2 để thẩm định nội dung chuyên sâu.",
      },
    });
  }
}
