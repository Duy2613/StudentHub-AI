/**
 * Layer 2 — AttackStageAnalyzer
 *
 * Models the 14-stage scam lifecycle and infers which stage a conversation
 * or message is at. Designed for conversation-level (multi-message) analysis.
 *
 * Attack Stage Model:
 *   CONTACT → RAPPORT_BUILDING → PRETEXT_ESTABLISHMENT → AUTHORITY_ESTABLISHMENT
 *   → EMOTIONAL_TRIGGER → URGENCY_ESCALATION → INFORMATION_COLLECTION
 *   → CREDENTIAL_COLLECTION → PAYMENT_REQUEST → REMOTE_ACCESS
 *   → MONEY_EXTRACTION → WITHDRAWAL_BLOCK → ESCALATION → RECOVERY_EXPLOITATION
 *
 * Design Rules:
 *   - Early stages (CONTACT, RAPPORT_BUILDING) alone are NOT high risk.
 *   - Late stages (CREDENTIAL_COLLECTION, PAYMENT_REQUEST, WITHDRAWAL_BLOCK) are high risk.
 *   - Multi-stage progression is a strong campaign signal.
 *   - Single-message analysis always returns stage with LOW confidence.
 *     Multi-message analysis can return HIGH confidence stage transitions.
 */

import { ATTACK_STAGES } from "../../models/ScamTaxonomy.js";

// ─── Stage Signal Patterns ────────────────────────────────────────────────────

const STAGE_SIGNALS = {

  [ATTACK_STAGES.CONTACT]: {
    risk: "minimal",
    riskScore: 0.05,
    signals: [
      /^(xin\s+chào|hello|hi|chào\s+anh\/chị|good\s+(morning|afternoon|evening))/gi,
      /tôi\s+thấy\s+(profile|thông\s+tin)\s+của\s+bạn/gi,
      /bạn\s+có\s+muốn\s+(làm\s+quen|kết\s+bạn|tìm\s+hiểu)/gi,
    ],
    description: "Tiếp cận lần đầu — chưa có dấu hiệu nguy hiểm",
  },

  [ATTACK_STAGES.RAPPORT_BUILDING]: {
    risk: "minimal",
    riskScore: 0.10,
    signals: [
      /bạn\s+(làm\s+nghề\s+gì|đang\s+học\s+ở\s+đâu|ở\s+thành\s+phố\s+nào)/gi,
      /anh\/em\s+chia\s+sẻ\s+(kinh\s+nghiệm|câu\s+chuyện)/gi,
      /chúng\s+ta\s+có\s+nhiều\s+điểm\s+chung|tôi\s+cũng\s+từng/gi,
      /tin\s+tưởng\s+nhau|mình\s+có\s+thể\s+nói\s+thật/gi,
    ],
    description: "Xây dựng mối quan hệ và lòng tin — bình thường nhưng cần theo dõi",
  },

  [ATTACK_STAGES.PRETEXT_ESTABLISHMENT]: {
    risk: "low",
    riskScore: 0.20,
    signals: [
      /tôi\s+đang\s+làm\s+(dự\s+án|hợp\s+đồng)\s+và\s+cần/gi,
      /có\s+cơ\s+hội\s+kinh\s+doanh\s+muốn\s+chia\s+sẻ/gi,
      /tôi\s+là\s+(đại\s+lý|đối\s+tác)\s+chính\s+thức\s+của/gi,
      /đây\s+là\s+chương\s+trình\s+(ưu\s+đãi|khuyến\s+mãi)\s+đặc\s+biệt/gi,
    ],
    description: "Dựng kịch bản lý do — bắt đầu cần chú ý hơn",
  },

  [ATTACK_STAGES.AUTHORITY_ESTABLISHMENT]: {
    risk: "medium",
    riskScore: 0.40,
    signals: [
      /tôi\s+là\s+(cán\s+bộ|nhân\s+viên|đại\s+diện)\s+(ngân\s+hàng|công\s+an|bộ)/gi,
      /gọi\s+từ\s+(ngân\s+hàng|trung\s+tâm\s+bảo\s+mật|phòng\s+nghiệp\s+vụ)/gi,
      /theo\s+quyết\s+định\s+số|văn\s+bản\s+chính\s+thức\s+số/gi,
      /mã\s+(nhân\s+viên|cán\s+bộ|định\s+danh):\s*\w+/gi,
    ],
    description: "Tuyên bố thẩm quyền / danh tính — nguy cơ trung bình, cần kiểm chứng",
  },

  [ATTACK_STAGES.EMOTIONAL_TRIGGER]: {
    risk: "medium",
    riskScore: 0.45,
    signals: [
      /tài\s+khoản\s+của\s+bạn\s+đang\s+(bị|có\s+nguy\s+cơ)|phát\s+hiện\s+giao\s+dịch\s+lạ/gi,
      /bạn\s+đã\s+(trúng|được\s+chọn|nhận\s+được)\s+\d+/gi,
      /khẩn\s+cấp|cảnh\s+báo\s+bảo\s+mật|thông\s+báo\s+quan\s+trọng/gi,
      /người\s+thân\s+của\s+bạn\s+đang\s+(gặp\s+nạn|cần\s+giúp\s+đỡ)/gi,
    ],
    description: "Kích hoạt cảm xúc (sợ hãi, tham lam, lo lắng) — rủi ro tăng cao",
  },

  [ATTACK_STAGES.URGENCY_ESCALATION]: {
    risk: "high",
    riskScore: 0.60,
    signals: [
      /trong\s+vòng\s+\d+\s*(phút|giờ)|hết\s+hạn\s+ngay/gi,
      /nếu\s+không\s+xử\s+lý\s+ngay.*sẽ\s+bị|ngay\s+lập\s+tức|khẩn\s+cấp\s+nhất/gi,
      /tài\s+khoản\s+sẽ\s+bị\s+khóa\s+trong.*phút/gi,
      /act\s+now|immediate\s+action\s+required/gi,
    ],
    description: "Leo thang áp lực thời gian — rủi ro cao",
  },

  [ATTACK_STAGES.INFORMATION_COLLECTION]: {
    risk: "high",
    riskScore: 0.55,
    signals: [
      /cho\s+(tôi|chúng\s+tôi)\s+biết\s+(họ\s+tên|ngày\s+sinh|số\s+cccd)/gi,
      /xác\s+minh\s+danh\s+tính\s+bằng\s+cách\s+cung\s+cấp/gi,
      /yêu\s+cầu\s+cung\s+cấp\s+(thông\s+tin|hình\s+ảnh)\s+(mặt\s+trước|mặt\s+sau)/gi,
      /please\s+(provide|confirm|verify)\s+your\s+(name|date\s+of\s+birth|id)/gi,
    ],
    description: "Thu thập thông tin cá nhân — rủi ro cao",
  },

  [ATTACK_STAGES.CREDENTIAL_COLLECTION]: {
    risk: "critical",
    riskScore: 0.85,
    signals: [
      /đọc\s+(mã|số)\s+otp|nhập\s+mã\s+(xác\s+nhận|otp|smart\s+otp)/gi,
      /cung\s+cấp\s+(mật\s+khẩu|password|pin|mã\s+bảo\s+mật)/gi,
      /để\s+(hủy|chặn)\s+giao\s+dịch\s+cần\s+nhập\s+mã/gi,
      /share\s+your\s+(otp|one.time\s+password|verification\s+code)/gi,
    ],
    description: "Thu thập OTP / mật khẩu — RỦI RO CỰC CAO (active credential attack)",
  },

  [ATTACK_STAGES.PAYMENT_REQUEST]: {
    risk: "critical",
    riskScore: 0.80,
    signals: [
      /chuyển\s+khoản\s+\d+|nộp\s+(tiền|phí)\s+\d+/gi,
      /tài\s+khoản\s+nhận:\s*\d{8,}/gi,
      /thanh\s+toán\s+(phí|chi\s+phí)\s+(xác\s+minh|hải\s+quan|thuế|pháp\s+lý)/gi,
      /please\s+(transfer|send|pay)\s+\d+|wire\s+transfer/gi,
      /mua\s+thẻ\s+(google\s+play|itunes|steam|gift\s+card)/gi,
    ],
    description: "Yêu cầu chuyển tiền / đóng phí — RỦI RO CỰC CAO",
  },

  [ATTACK_STAGES.REMOTE_ACCESS]: {
    risk: "critical",
    riskScore: 0.85,
    signals: [
      /cài\s+(anydesk|teamviewer|ultraviewer|airdroid)/gi,
      /cho\s+phép\s+(truy\s+cập|điều\s+khiển)\s+(từ\s+xa|máy)/gi,
      /chia\s+sẻ\s+màn\s+hình|screen\s+share|share\s+your\s+screen/gi,
      /tải\s+và\s+cài\s+ứng\s+dụng\s+(này|theo\s+link)/gi,
      /remote\s+(access|desktop|control)/gi,
    ],
    description: "Yêu cầu truy cập thiết bị từ xa — RỦI RO CỰC CAO",
  },

  [ATTACK_STAGES.MONEY_EXTRACTION]: {
    risk: "critical",
    riskScore: 0.90,
    signals: [
      /chuyển\s+tiếp\s+sang\s+tài\s+khoản\s+an\s+toàn/gi,
      /bảo\s+mật\s+tài\s+sản\s+bằng\s+cách\s+chuyển\s+vào/gi,
      /để\s+bảo\s+vệ\s+tiền\s+cần\s+rút\s+và\s+nộp\s+cho/gi,
      /chuyển\s+toàn\s+bộ\s+số\s+dư|withdraw\s+all\s+funds/gi,
    ],
    description: "Rút tiền / chuyển tài sản đang xảy ra — MỨC ĐỘ KHẨN CẤP CAO NHẤT",
  },

  [ATTACK_STAGES.WITHDRAWAL_BLOCK]: {
    risk: "high",
    riskScore: 0.75,
    signals: [
      /để\s+rút\s+lợi\s+nhuận\s+cần\s+(đóng\s+thêm|nộp\s+thêm|xác\s+minh\s+thêm)/gi,
      /tài\s+khoản\s+bị\s+(đóng\s+băng|tạm\s+khóa)\s+cần\s+thanh\s+toán\s+phí/gi,
      /withdrawal\s+is\s+blocked.*pay|tax\s+on\s+profits|unlock\s+fee/gi,
    ],
    description: "Chặn rút tiền — yêu cầu thêm tiền để mở khóa (investment scam cuối giai đoạn)",
  },

  [ATTACK_STAGES.ESCALATION]: {
    risk: "high",
    riskScore: 0.70,
    signals: [
      /nếu\s+không\s+(hợp\s+tác|thanh\s+toán)\s+sẽ\s+bị\s+khởi\s+tố/gi,
      /chúng\s+tôi\s+sẽ\s+phải\s+(báo\s+cảnh\s+sát|tiến\s+hành\s+thủ\s+tục)/gi,
      /this\s+is\s+your\s+final\s+warning|legal\s+action\s+will\s+be\s+taken/gi,
    ],
    description: "Leo thang đe dọa nếu không tuân thủ yêu cầu trước đó",
  },

  [ATTACK_STAGES.RECOVERY_EXPLOITATION]: {
    risk: "high",
    riskScore: 0.75,
    signals: [
      /chúng\s+tôi\s+có\s+thể\s+(lấy\s+lại|thu\s+hồi)\s+tiền|hỗ\s+trợ\s+hoàn\s+tiền\s+bị\s+lừa/gi,
      /recovery\s+(specialist|agent|service)|get\s+your\s+money\s+back/gi,
      /phí\s+(thu\s+hồi|xử\s+lý|pháp\s+lý)\s+để\s+(lấy\s+lại|hoàn)/gi,
    ],
    description: "Recovery scam — lợi dụng nạn nhân đã mất tiền để lừa lần thứ hai",
  },
};

export class AttackStageAnalyzer {
  /**
   * Analyzes a single message or conversation for attack stage signals.
   *
   * @param {object} params
   * @param {string} params.text - Current message text
   * @param {string} [params.ocrText] - OCR text if image attached
   * @param {Array<object>} [params.conversationHistory] - Previous messages [{text, timestamp}]
   * @param {object} [params.priorResult] - Prior layer analysis result
   * @returns {object} Stage analysis result
   */
  static analyze({ text = "", ocrText = "", conversationHistory = [], priorResult = null }) {
    const combined = `${text} ${ocrText}`.trim();
    if (!combined) {
      return {
        stage: null,
        stageRisk: "unknown",
        stageRiskScore: 0,
        confidence: 0,
        evidence: [],
        isMultiStage: false,
        campaignSignal: false,
      };
    }

    const stageMatches = [];

    for (const [stageName, config] of Object.entries(STAGE_SIGNALS)) {
      const evidence = [];
      for (const pattern of config.signals) {
        pattern.lastIndex = 0;
        const match = pattern.exec(combined);
        if (match) {
          evidence.push(match[0].slice(0, 120));
        }
      }
      if (evidence.length > 0) {
        stageMatches.push({
          stage: stageName,
          risk: config.risk,
          riskScore: config.riskScore,
          confidence: Math.min(0.55 + evidence.length * 0.15, 0.95),
          evidence,
          description: config.description,
        });
      }
    }

    // Sort by risk score descending to identify primary stage
    stageMatches.sort((a, b) => b.riskScore - a.riskScore);
    const primaryMatch = stageMatches[0] || null;

    // Analyze conversation history for multi-stage pattern
    const historyStages = this._analyzeHistory(conversationHistory);
    const isMultiStage = historyStages.length >= 2;

    // Campaign signal: sequential stage progression detected
    const campaignSignal = this._detectCampaignProgression(historyStages, primaryMatch?.stage);

    return {
      stage: primaryMatch?.stage || null,
      stageRisk: primaryMatch?.risk || "unknown",
      stageRiskScore: primaryMatch?.riskScore || 0,
      confidence: primaryMatch?.confidence || 0,
      evidence: primaryMatch?.evidence || [],
      description: primaryMatch?.description || "",
      allMatchedStages: stageMatches,

      // Conversation-level signals
      isMultiStage,
      campaignSignal,
      historyStages,
      stageProgression: campaignSignal ? this._buildProgressionSummary(historyStages, primaryMatch?.stage) : null,
    };
  }

  /**
   * Analyzes conversation history to extract stage sequence.
   * @param {Array<{text: string, timestamp?: string}>} history
   * @returns {string[]} Ordered list of detected stages
   */
  static _analyzeHistory(history) {
    if (!history || history.length === 0) return [];

    const detectedStages = [];
    for (const msg of history) {
      const text = msg.text || "";
      for (const [stageName, config] of Object.entries(STAGE_SIGNALS)) {
        const matched = config.signals.some((p) => {
          p.lastIndex = 0;
          return p.test(text);
        });
        if (matched && !detectedStages.includes(stageName)) {
          detectedStages.push(stageName);
        }
      }
    }

    return detectedStages;
  }

  /**
   * Detects if stage progression follows a known attack lifecycle pattern.
   * @param {string[]} historyStages
   * @param {string|null} currentStage
   * @returns {boolean}
   */
  static _detectCampaignProgression(historyStages, currentStage) {
    if (!currentStage || historyStages.length < 2) return false;

    // Known dangerous progressions (order matters)
    const dangerousProgressions = [
      // Classic investment scam lifecycle
      [ATTACK_STAGES.RAPPORT_BUILDING, ATTACK_STAGES.PRETEXT_ESTABLISHMENT, ATTACK_STAGES.PAYMENT_REQUEST],
      // Social engineering with urgency + credential
      [ATTACK_STAGES.AUTHORITY_ESTABLISHMENT, ATTACK_STAGES.URGENCY_ESCALATION, ATTACK_STAGES.CREDENTIAL_COLLECTION],
      // Romance scam lifecycle
      [ATTACK_STAGES.RAPPORT_BUILDING, ATTACK_STAGES.EMOTIONAL_TRIGGER, ATTACK_STAGES.PAYMENT_REQUEST],
      // Recovery scam
      [ATTACK_STAGES.PAYMENT_REQUEST, ATTACK_STAGES.RECOVERY_EXPLOITATION],
      // Pig butchering
      [ATTACK_STAGES.RAPPORT_BUILDING, ATTACK_STAGES.PRETEXT_ESTABLISHMENT, ATTACK_STAGES.PAYMENT_REQUEST, ATTACK_STAGES.WITHDRAWAL_BLOCK],
    ];

    const allStages = [...historyStages, currentStage];

    for (const progression of dangerousProgressions) {
      // Check if any 2+ stages from the progression appear in sequence
      let matchCount = 0;
      let lastIdx = -1;
      for (const stage of progression) {
        const idx = allStages.indexOf(stage);
        if (idx > lastIdx) {
          matchCount++;
          lastIdx = idx;
        }
      }
      if (matchCount >= Math.ceil(progression.length * 0.6)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Builds a human-readable stage progression summary.
   */
  static _buildProgressionSummary(historyStages, currentStage) {
    const allStages = [...historyStages];
    if (currentStage && !allStages.includes(currentStage)) {
      allStages.push(currentStage);
    }
    return allStages.join(" → ");
  }
}
