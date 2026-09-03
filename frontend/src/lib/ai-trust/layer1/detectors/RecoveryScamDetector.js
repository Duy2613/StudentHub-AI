/**
 * Layer 1 — RecoveryScamDetector
 *
 * Detects "Recovery Scam" (Lừa đảo thu hồi tiền) — a second-stage attack
 * targeting victims who have ALREADY been defrauded.
 *
 * Pattern:
 *   Prior scam incident (user mentions they lost money)
 *   ↓
 *   New contact offers "recovery service"
 *   ↓
 *   Recovery fee / verification fee / legal fee demanded
 *   ↓
 *   Victim scammed AGAIN
 *
 * This is classified separately from other scam types because:
 *   1. The victim is already vulnerable and less suspicious
 *   2. The attacker may reference the ORIGINAL scam to build credibility
 *   3. The signal combination (victim context + recovery offer + fee) is unique
 *   4. Risk is CRITICAL when all three signals co-occur
 */

import { SCAM_TYPES, ATTACK_STAGES } from "../../models/ScamTaxonomy.js";
import { createSignal, SIGNAL_SEVERITY } from "../types.js";

// ─── Recovery Offer Patterns ──────────────────────────────────────────────────
const RECOVERY_OFFER_PATTERNS = [
  /chúng\s+tôi\s+có\s+thể\s+(lấy\s+lại|thu\s+hồi|hoàn\s+lại|khôi\s+phục)\s+tiền/gi,
  /hỗ\s+trợ\s+thu\s+hồi\s+tiền\s+bị\s+lừa/gi,
  /chuyên\s+gia\s+thu\s+hồi\s+(tài\s+sản|tiền)/gi,
  /recovery\s+(specialist|agent|service|firm|expert)/gi,
  /we\s+can\s+(recover|retrieve|get\s+back)\s+your\s+(money|funds|assets)/gi,
  /fraud\s+recovery|asset\s+recovery\s+specialist/gi,
  /interpol\s+anti.fraud\s+unit|fbi\s+cyber\s+division/gi, // common impersonation in recovery scams
  /đơn\s+vị\s+chống\s+lừa\s+đảo\s+quốc\s+tế/gi,
];

// ─── Prior Victim Context Patterns ────────────────────────────────────────────
const VICTIM_CONTEXT_PATTERNS = [
  /tôi\s+đã\s+bị\s+lừa\s+mất/gi,
  /tôi\s+đã\s+(mất|chuyển)\s+\d+\s*(triệu|ngàn|k)/gi,
  /tôi\s+bị\s+(lừa|chiếm\s+đoạt|mất\s+tiền)\s+(vào|qua|bởi)/gi,
  /i\s+(was|got)\s+scammed|i\s+lost\s+money\s+to/gi,
  /họ\s+đã\s+lấy\s+(hết|toàn\s+bộ)\s+tiền\s+của\s+tôi/gi,
];

// ─── Recovery Fee Patterns ─────────────────────────────────────────────────────
const RECOVERY_FEE_PATTERNS = [
  /phí\s+(thu\s+hồi|xử\s+lý|pháp\s+lý|hành\s+chính|thủ\s+tục)/gi,
  /đóng\s+phí\s+(để\s+|nhằm\s+)?(lấy\s+lại|thu\s+hồi|hoàn\s+tiền)/gi,
  /recovery\s+fee|processing\s+fee\s+(to\s+recover|to\s+retrieve)/gi,
  /legal\s+fee|admin\s+fee|handling\s+charge/gi,
  /phí\s+kích\s+hoạt\s+quy\s+trình|fee\s+to\s+unlock\s+(your\s+funds|the\s+account)/gi,
  /nộp\s+\d+.*để\s+(lấy\s+lại|thu\s+hồi)/gi,
];

// ─── High-Risk Escalation Patterns (inside recovery scam) ─────────────────────
const RECOVERY_ESCALATION_PATTERNS = [
  /nộp\s+thêm\s+phí\s+(thuế|bảo\s+hiểm|chuyển\s+đổi)\s+để\s+nhận\s+tiền/gi,
  /phát\s+sinh\s+thêm\s+chi\s+phí\s+do|tiếp\s+tục\s+thanh\s+toán\s+để/gi,
  /pay\s+one\s+more\s+(fee|charge)|additional\s+fee\s+required\s+to\s+release/gi,
];

export class RecoveryScamDetector {
  /**
   * Analyzes text for recovery scam signals.
   *
   * @param {object} params
   * @param {string} params.text - Message text
   * @param {string} [params.ocrText] - OCR text from attached image
   * @param {boolean} [params.hasVictimContext] - true if user has already mentioned being scammed
   * @param {object} [params.conversationContext] - Prior conversation signals
   * @returns {object} Detection result
   */
  static detect({ text = "", ocrText = "", hasVictimContext = false, conversationContext = null }) {
    const combined = `${text} ${ocrText}`.trim().toLowerCase();
    if (!combined) {
      return { detected: false, confidence: 0, signals: [], stage: null };
    }

    const signals = [];

    // 1. Check for recovery offer
    const hasRecoveryOffer = RECOVERY_OFFER_PATTERNS.some((p) => {
      p.lastIndex = 0;
      const match = p.exec(combined);
      if (match) {
        signals.push({
          type: "RECOVERY_OFFER",
          matchedText: match[0],
          severity: SIGNAL_SEVERITY.HIGH,
        });
        return true;
      }
      return false;
    });

    // 2. Check for victim context (in current message or conversation)
    let victimContextDetected = hasVictimContext;
    if (!victimContextDetected) {
      victimContextDetected = VICTIM_CONTEXT_PATTERNS.some((p) => {
        p.lastIndex = 0;
        const match = p.exec(combined);
        if (match) {
          signals.push({
            type: "VICTIM_CONTEXT",
            matchedText: match[0],
            severity: SIGNAL_SEVERITY.INFO,
          });
          return true;
        }
        return false;
      });
    }

    // 3. Check for recovery fee demand
    const hasRecoveryFee = RECOVERY_FEE_PATTERNS.some((p) => {
      p.lastIndex = 0;
      const match = p.exec(combined);
      if (match) {
        signals.push({
          type: "RECOVERY_FEE_DEMAND",
          matchedText: match[0],
          severity: SIGNAL_SEVERITY.CRITICAL,
        });
        return true;
      }
      return false;
    });

    // 4. Check for escalation (additional fees)
    const hasEscalation = RECOVERY_ESCALATION_PATTERNS.some((p) => {
      p.lastIndex = 0;
      const match = p.exec(combined);
      if (match) {
        signals.push({
          type: "RECOVERY_ESCALATION",
          matchedText: match[0],
          severity: SIGNAL_SEVERITY.CRITICAL,
        });
        return true;
      }
      return false;
    });

    // ── Risk Calculation ───────────────────────────────────────────────────────
    let confidence = 0;
    let detected = false;

    if (hasRecoveryOffer && hasRecoveryFee) {
      // Core recovery scam pattern: offer + fee demand
      confidence = 0.88;
      detected = true;
    } else if (hasRecoveryOffer && victimContextDetected) {
      // Recovery offer targeting a known victim
      confidence = 0.72;
      detected = true;
    } else if (hasRecoveryOffer) {
      // Recovery offer alone — suspicious but not conclusive
      confidence = 0.45;
      detected = confidence >= 0.45;
    }

    if (hasEscalation && detected) {
      // Escalation confirms ongoing recovery scam campaign
      confidence = Math.min(confidence + 0.10, 0.97);
    }

    return {
      detected,
      confidence: Number(confidence.toFixed(2)),
      signals,
      scamType: SCAM_TYPES.RECOVERY_SCAM,
      attackStage: detected ? ATTACK_STAGES.RECOVERY_EXPLOITATION : null,
      hasRecoveryOffer,
      hasVictimContext: victimContextDetected,
      hasRecoveryFee,
      hasEscalation,
      severity: confidence >= 0.80 ? SIGNAL_SEVERITY.CRITICAL :
                confidence >= 0.60 ? SIGNAL_SEVERITY.HIGH :
                SIGNAL_SEVERITY.MEDIUM,
    };
  }

  /**
   * Creates a Layer 1 signal DTO from detection result.
   * @param {object} detectionResult
   * @returns {object|null} Layer 1 signal or null if not detected
   */
  static toLayer1Signal(detectionResult) {
    if (!detectionResult.detected) return null;

    return createSignal({
      type: "recovery_scam_pattern",
      category: "social_engineering",
      severity: detectionResult.severity,
      confidence: detectionResult.confidence,
      evidence: {
        matchedText: detectionResult.signals.map((s) => s.matchedText).join("; "),
        signals: detectionResult.signals.map((s) => s.type),
        hasVictimContext: detectionResult.hasVictimContext,
        hasRecoveryFee: detectionResult.hasRecoveryFee,
      },
      source: "RecoveryScamDetector",
    });
  }
}
