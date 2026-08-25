/**
 * Layer 4 — EvidenceFusionEngine (v2.0)
 *
 * Upgraded from a simple signal merger to a full Evidence-Fusion Intelligence Engine.
 *
 * NEW CAPABILITIES:
 *   - Risk interaction terms (AUTHORITY × URGENCY amplification)
 *   - Abstention path (INSUFFICIENT_EVIDENCE when evidence quality is low)
 *   - Multi-label scam type output (40+ categories)
 *   - Attack stage inference
 *   - Psychological tactics aggregation
 *   - Requested action extraction
 *   - Target asset extraction
 *   - Document forensics integration
 *   - Cross-document consistency integration
 *   - Uncertainty quantification per evidence dimension
 *
 * Design Rule:
 *   "Risk ≠ Confidence" — low confidence evidence does NOT produce high risk.
 *   When OCR is uncertain, when evidence conflicts, when source quality is low:
 *   → Return INSUFFICIENT_EVIDENCE rather than force a binary verdict.
 *
 * Evidence Graph output is the single source of truth for Layer 4 reasoning providers.
 */

import {
  SCAM_TYPES,
  PSYCH_TACTICS,
  ATTACK_STAGES,
  TARGET_ASSETS,
  REQUESTED_ACTIONS,
  RISK_INTERACTION_TERMS,
  HARD_NEGATIVE_CONTEXTS,
} from "../../models/ScamTaxonomy.js";

// ─── Abstention Thresholds ────────────────────────────────────────────────────
const ABSTENTION_CONFIG = {
  // If OCR confidence is below this, evidence from image is unreliable
  MIN_OCR_CONFIDENCE: 0.45,
  // If evidence source count is below this AND no L1 block, consider INSUFFICIENT
  MIN_EVIDENCE_SOURCES: 1,
  // If cross-source agreement is below this, high conflict = uncertainty
  MIN_SOURCE_AGREEMENT: 0.30,
};

// ─── Signal → Scam Type Mapping ───────────────────────────────────────────────
const SIGNAL_TO_SCAM_TYPE = {
  // Layer 1 signal types → Scam categories
  "phishing_link": SCAM_TYPES.PHISHING,
  "otp_trap": SCAM_TYPES.OTP_THEFT,
  "credential_harvesting": SCAM_TYPES.CREDENTIAL_THEFT,
  "malware_delivery": SCAM_TYPES.MALWARE_DELIVERY,
  "suspicious_domain": SCAM_TYPES.PHISHING,
  "unicode_confusable": SCAM_TYPES.PHISHING,
  "recovery_scam_pattern": SCAM_TYPES.RECOVERY_SCAM,
  "advance_fee": SCAM_TYPES.ADVANCE_FEE_SCAM,
  "remote_access_request": SCAM_TYPES.REMOTE_ACCESS_SCAM,
  "qr_phishing": SCAM_TYPES.QR_PHISHING,
};

// ─── Context Signal → Scam Type Mapping ──────────────────────────────────────
const CONTEXT_TO_SCAM_TYPE = {
  "credential_harvesting_context": SCAM_TYPES.CREDENTIAL_THEFT,
  "financial_scam_context": SCAM_TYPES.ADVANCE_FEE_SCAM,
  "institutional_impersonation_context": SCAM_TYPES.BANK_IMPERSONATION,
  "account_takeover_context": SCAM_TYPES.ACCOUNT_TAKEOVER,
  "malware_delivery_context": SCAM_TYPES.MALWARE_DELIVERY,
  "social_engineering_context": SCAM_TYPES.PHISHING,
};

// ─── Tactic → Requested Action Inference ─────────────────────────────────────
const TACTIC_TO_ACTION = {
  "OTP_THEFT": REQUESTED_ACTIONS.SHARE_OTP,
  "ADVANCE_FEE_TRAP": REQUESTED_ACTIONS.PAY_FEE,
  "RECOVERY_PROMISE": REQUESTED_ACTIONS.PAY_FEE,
  [PSYCH_TACTICS.SHAME]: REQUESTED_ACTIONS.TRANSFER_MONEY,
  [PSYCH_TACTICS.LOVE]: REQUESTED_ACTIONS.TRANSFER_MONEY,
  [PSYCH_TACTICS.FEAR]: null, // fear alone doesn't imply a specific action
};

// ─── Requested Action Keywords → Action Types ─────────────────────────────────
const ACTION_SIGNAL_PATTERNS = [
  { pattern: /nhập\s+mã\s+otp|đọc\s+mã\s+otp|provide\s+otp/i, action: REQUESTED_ACTIONS.SHARE_OTP },
  { pattern: /chuyển\s+khoản|transfer\s+money|wire\s+transfer/i, action: REQUESTED_ACTIONS.TRANSFER_MONEY },
  { pattern: /cài\s+(anydesk|teamviewer|ultraviewer)|remote\s+access/i, action: REQUESTED_ACTIONS.ENABLE_REMOTE_ACCESS },
  { pattern: /chia\s+sẻ\s+màn\s+hình|screen\s+share/i, action: REQUESTED_ACTIONS.SCREEN_SHARE },
  { pattern: /tải\s+apk|install.*app|cài\s+ứng\s+dụng/i, action: REQUESTED_ACTIONS.INSTALL_APK },
  { pattern: /quét\s+mã\s+qr|scan.*qr/i, action: REQUESTED_ACTIONS.SCAN_QR },
  { pattern: /nhấp\s+vào\s+link|bấm\s+vào\s+đây|click\s+(here|link)/i, action: REQUESTED_ACTIONS.CLICK_LINK },
  { pattern: /gửi\s+(ảnh\s+cccd|giấy\s+tờ\s+tùy\s+thân)|send\s+(your\s+id|documents)/i, action: REQUESTED_ACTIONS.SEND_ID },
  { pattern: /mua\s+thẻ\s+gift\s+card|buy\s+gift\s+card/i, action: REQUESTED_ACTIONS.BUY_GIFT_CARD },
  { pattern: /đóng\s+phí|nộp\s+phí|pay\s+(fee|charge)/i, action: REQUESTED_ACTIONS.PAY_FEE },
  { pattern: /không\s+được\s+nói\s+với\s+ai|giữ\s+bí\s+mật/i, action: REQUESTED_ACTIONS.KEEP_SECRET },
];

// ─── Target Asset Keywords ─────────────────────────────────────────────────────
const ASSET_SIGNAL_PATTERNS = [
  { pattern: /\botp\b|one.time\s+password/i, asset: TARGET_ASSETS.OTP },
  { pattern: /mật\s+khẩu|password|pin\b/i, asset: TARGET_ASSETS.PASSWORD },
  { pattern: /tài\s+khoản\s+ngân\s+hàng|bank\s+account/i, asset: TARGET_ASSETS.BANK_ACCOUNT },
  { pattern: /thẻ\s+tín\s+dụng|credit\s+card|cvv/i, asset: TARGET_ASSETS.CREDIT_CARD },
  { pattern: /cccd|hộ\s+chiếu|chứng\s+minh|passport/i, asset: TARGET_ASSETS.IDENTITY_DOCUMENT },
  { pattern: /crypto|bitcoin|ethereum|usdt|tether/i, asset: TARGET_ASSETS.CRYPTO },
  { pattern: /gift\s+card|thẻ\s+quà\s+tặng/i, asset: TARGET_ASSETS.GIFT_CARD },
  { pattern: /anydesk|teamviewer|remote\s+access/i, asset: TARGET_ASSETS.REMOTE_DEVICE_ACCESS },
  { pattern: /số\s+điện\s+thoại|phone\s+number|số\s+sim/i, asset: TARGET_ASSETS.PHONE_NUMBER },
];

export class EvidenceFusionEngine {
  /**
   * Fuses multi-layer results into an enhanced Evidence Graph with:
   *   - Risk interaction terms
   *   - Multi-label scam type inference
   *   - Attack stage from Layer 2
   *   - Psychological tactics
   *   - Requested actions & target assets
   *   - Document forensics integration
   *   - Uncertainty quantification
   *   - Abstention decision
   *
   * @param {object} params
   * @param {object} params.layer1Result
   * @param {object} params.layer2Result
   * @param {object} params.layer3Result
   * @param {object} [params.documentContext] - From DocumentClassifier, CrossFieldValidator, DocumentForensics
   * @param {object} [params.conversationContext] - From AttackStageAnalyzer (multi-message)
   * @returns {object} Enhanced evidence graph + fusion metrics
   */
  static fuse({
    layer1Result = null,
    layer2Result = null,
    layer3Result = null,
    documentContext = null,
    conversationContext = null,
  }) {

    // ── 1. Base Evidence Graph (backward compatible) ──────────────────────────
    const fusedGraph = {
      layer1Signals: layer1Result?.signals || [],
      layer1Status: layer1Result?.status || "PASS",
      layer1Reasons: layer1Result?.reasons || [],

      layer2Intent: layer2Result?.intent || { primary: "inform", coercive: false },
      layer2Entities: layer2Result?.entities || [],
      layer2Claims: layer2Result?.claims || [],
      layer2ContextSignals: layer2Result?.contextSignals || [],
      layer2ConsistencyFindings: layer2Result?.consistencyFindings || [],
      layer2CrossModalFindings: layer2Result?.crossModalFindings || [],
      layer2Status: layer2Result?.status || "PASS",
      layer2Classification: layer2Result?.classification || "BENIGN",

      // ManipulationAnalyzer v2 output
      layer2ManipulationResult: layer2Result?.details?.manipulationResult || null,
      layer2AttackStageResult: layer2Result?.details?.attackStageResult || null,

      layer3Sources: layer3Result?.sources || [],
      layer3Evidence: layer3Result?.evidence || [],
      layer3ClaimStatuses: layer3Result?.claimStatuses || {},
      layer3Conflicts: layer3Result?.conflicts || [],
      layer3Independence: layer3Result?.sourceIndependence || { totalClusters: 0 },
      layer3Agreement: layer3Result?.crossSourceAgreement || { agreementScore: 1.0 },
      layer3Completeness: layer3Result?.verificationCompleteness || 0.0,
      layer3Status: layer3Result?.status || "UNVERIFIED",

      // Document intelligence
      documentClassification: documentContext?.classification || null,
      documentForensics: documentContext?.forensics || null,
      crossFieldContradictions: documentContext?.crossFieldValidation?.contradictions || [],
      documentForensicFlags: documentContext?.classification?.forensicFlags || [],

      // Conversation context
      attackStageProgression: conversationContext?.stageProgression || null,
      isCampaignLevel: conversationContext?.campaignSignal || false,
    };

    // ── 2. Multi-Label Scam Type Inference ────────────────────────────────────
    const scamTypes = new Set();

    // From Layer 1 signals
    for (const signal of fusedGraph.layer1Signals) {
      const mapped = SIGNAL_TO_SCAM_TYPE[signal.type];
      if (mapped) scamTypes.add(mapped);

      // URL/domain signals → phishing
      if (signal.type?.includes("domain") || signal.type?.includes("url")) {
        scamTypes.add(SCAM_TYPES.PHISHING);
      }
      // SSRF → remote access
      if (signal.type?.includes("ssrf")) {
        scamTypes.add(SCAM_TYPES.REMOTE_ACCESS_SCAM);
      }
    }

    // From Layer 2 context signals
    for (const signal of fusedGraph.layer2ContextSignals) {
      const mapped = CONTEXT_TO_SCAM_TYPE[signal.type];
      if (mapped) scamTypes.add(mapped);
    }

    // From Layer 2 manipulation tactics
    const tactics = fusedGraph.layer2ManipulationResult?.detectedTactics || [];
    const hasPanic = tactics.some((t) => t.tactic === PSYCH_TACTICS.PANIC);
    const hasShame = tactics.some((t) => t.tactic === PSYCH_TACTICS.SHAME);
    const hasLove = tactics.some((t) => t.tactic === PSYCH_TACTICS.LOVE);
    const hasRecovery = tactics.some((t) => t.tactic === "RECOVERY_PROMISE");

    if (hasShame) scamTypes.add(SCAM_TYPES.SEXTORTION);
    if (hasLove) scamTypes.add(SCAM_TYPES.ROMANCE_SCAM);
    if (hasRecovery) scamTypes.add(SCAM_TYPES.RECOVERY_SCAM);
    if (hasPanic && fusedGraph.layer1Signals.some((s) => s.type?.includes("otp"))) {
      scamTypes.add(SCAM_TYPES.PHISHING);
    }

    // From attack stage
    const attackStage = fusedGraph.layer2AttackStageResult?.stage ||
                        conversationContext?.currentStage || null;
    if (attackStage === ATTACK_STAGES.REMOTE_ACCESS) scamTypes.add(SCAM_TYPES.REMOTE_ACCESS_SCAM);
    if (attackStage === ATTACK_STAGES.RECOVERY_EXPLOITATION) scamTypes.add(SCAM_TYPES.RECOVERY_SCAM);

    // ── 3. Psychological Tactics Aggregation ──────────────────────────────────
    const psychTactics = tactics.map((t) => t.tactic);

    // ── 4. Requested Actions Inference ────────────────────────────────────────
    const requestedActions = new Set();
    const allText = this._buildSearchText(layer1Result, layer2Result);

    for (const { pattern, action } of ACTION_SIGNAL_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(allText)) {
        requestedActions.add(action);
      }
    }

    // From manipulation tactics
    for (const tactic of tactics) {
      const action = TACTIC_TO_ACTION[tactic.tactic];
      if (action) requestedActions.add(action);
    }

    // ── 5. Target Assets Inference ────────────────────────────────────────────
    const targetAssets = new Set();
    for (const { pattern, asset } of ASSET_SIGNAL_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(allText)) {
        targetAssets.add(asset);
      }
    }

    // ── 6. Risk Interaction Terms ─────────────────────────────────────────────
    const triggeredInteractions = [];
    let interactionMultiplier = 1.0;

    for (const term of RISK_INTERACTION_TERMS) {
      const allSignalLabels = [
        ...fusedGraph.layer1Signals.map((s) => s.type?.toUpperCase()),
        ...psychTactics.map((t) => t?.toUpperCase()),
        ...[...scamTypes].map((t) => t?.toUpperCase()),
      ].filter(Boolean);

      const termSignalsUpper = term.signals.map((s) => s.toUpperCase());
      const allPresent = termSignalsUpper.every((sig) =>
        allSignalLabels.some((label) => label.includes(sig) || sig.includes(label))
      );

      if (allPresent) {
        triggeredInteractions.push({
          id: term.id,
          multiplier: term.multiplier,
          description: term.description,
          matchedSignals: term.signals,
        });
        interactionMultiplier = Math.max(interactionMultiplier, term.multiplier);
      }
    }

    // ── 7. Uncertainty Quantification ─────────────────────────────────────────
    const ocrConfidence = documentContext?.ocrConfidence || 1.0;
    const crossFieldContradictions = fusedGraph.crossFieldContradictions;

    const uncertainty = {
      ocr: ocrConfidence < ABSTENTION_CONFIG.MIN_OCR_CONFIDENCE ? "HIGH" : "LOW",
      document: crossFieldContradictions.length > 2 ? "HIGH" :
                crossFieldContradictions.length > 0 ? "MEDIUM" : "LOW",
      url: fusedGraph.layer3Agreement.agreementScore < 0.5 ? "HIGH" : "LOW",
      identity: fusedGraph.layer2ConsistencyFindings.some((f) => f.type?.includes("identity")) ? "HIGH" : "LOW",
    };

    const highUncertaintyCount = Object.values(uncertainty).filter((v) => v === "HIGH").length;

    // ── 8. Abstention Decision ─────────────────────────────────────────────────
    // Return INSUFFICIENT_EVIDENCE when:
    // - Low OCR confidence is the ONLY evidence source
    // - Evidence conflicts without resolution
    // - All signals are below threshold AND no hard block
    const isOcrOnlyEvidence = (
      ocrConfidence < ABSTENTION_CONFIG.MIN_OCR_CONFIDENCE &&
      fusedGraph.layer1Signals.length === 0 &&
      fusedGraph.layer2ContextSignals.length === 0
    );
    const isHighConflict = (
      fusedGraph.layer3Conflicts.length > 2 &&
      fusedGraph.layer3Agreement.agreementScore < ABSTENTION_CONFIG.MIN_SOURCE_AGREEMENT
    );

    // Only abstain if NOT already blocked at L1
    const shouldAbstain = (
      layer1Result?.status !== "BLOCK" &&
      (isOcrOnlyEvidence || (isHighConflict && highUncertaintyCount >= 2))
    );

    // ── 9. Hard Negative Detection ────────────────────────────────────────────
    const isHardNegative = (
      fusedGraph.layer2ManipulationResult?.hardNegativeSignal === true ||
      fusedGraph.layer2ContextSignals.some((s) => s.type === "educational_discussion") ||
      fusedGraph.layer2ContextSignals.some((s) => s.type === "satire_or_humor")
    );

    // ── 10. Compound Evidence Metrics ─────────────────────────────────────────
    const totalEvidenceItems = fusedGraph.layer3Evidence.length + fusedGraph.crossFieldContradictions.length;
    const totalSignals = fusedGraph.layer1Signals.length + fusedGraph.layer2ContextSignals.length;
    const hasPhishingSignals =
      fusedGraph.layer1Signals.some((s) => s.type?.includes("credential") || s.type?.includes("otp") || s.type?.includes("phishing")) ||
      fusedGraph.layer2ContextSignals.some((s) => s.type?.includes("credential") || s.type?.includes("account_takeover"));

    // ── Return Enhanced Fused Graph ────────────────────────────────────────────
    return {
      fusedGraph: {
        ...fusedGraph,
        // New enriched fields
        scamTypes: [...scamTypes],
        psychTactics,
        attackStage,
        requestedActions: [...requestedActions],
        targetAssets: [...targetAssets],
        triggeredInteractions,
        uncertainty,
      },

      // Fusion metrics
      hasPhishingSignals,
      totalEvidenceItems,
      totalSignals,
      interactionMultiplier,
      triggeredInteractionCount: triggeredInteractions.length,

      // Abstention
      shouldAbstain,
      abstentionReason: shouldAbstain ? (
        isOcrOnlyEvidence ? "OCR_ONLY_LOW_CONFIDENCE" :
        isHighConflict ? "HIGH_SOURCE_CONFLICT" : "INSUFFICIENT_EVIDENCE"
      ) : null,

      // Hard negative
      isHardNegative,
      hardNegativeContext: isHardNegative ? HARD_NEGATIVE_CONTEXTS.SCAM_AWARENESS_CONTENT : null,

      // Quality metrics
      uncertainty,
      highUncertaintyCount,
    };
  }

  /**
   * Builds a unified search text from all layer results for pattern matching.
   * @private
   */
  static _buildSearchText(layer1Result, layer2Result) {
    const parts = [
      layer1Result?.metrics?.inputContent || "",
      layer2Result?.semanticSummary || "",
      ...(layer2Result?.claims || []).map((c) => c.rawText || ""),
      ...(layer2Result?.contextSignals || []).map((s) => s.details || ""),
    ];
    return parts.join(" ").trim();
  }
}
