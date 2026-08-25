/**
 * Layer 2 — ManipulationAnalyzer
 * 
 * Detects psychological and social-engineering manipulation vectors:
 * - Fear & Threat Coercion (e.g. "Tài khoản bị khóa vĩnh viễn", "Bị khởi tố")
 * - False Urgency (e.g. "Hạn chót trong 15 phút", "Hành động ngay")
 * - False Authority Legitimacy (e.g. "Theo chỉ đạo khẩn của Bộ Công An")
 * - Financial Bait & Artificial Scarcity (e.g. "Chỉ còn 2 suất học bổng cuối cùng")
 * 
 * Aggregates redundant cues into unified semantic risk dimensions without double-counting.
 */

export class ManipulationAnalyzer {
  /**
   * Analyzes manipulation cues from text
   * @param {string} text
   * @returns {object} { manipulationScore, detectedTactics, details }
   */
  static analyze(text) {
    if (!text || typeof text !== "string") {
      return { manipulationScore: 0, detectedTactics: [], details: [] };
    }

    const lower = text.toLowerCase();
    const tactics = [];
    let score = 0;

    // 1. Fear & Threat Manipulation
    const fearMatches = lower.match(/(?:bị khóa|khóa tài khoản|tạm dừng dịch vụ|khởi tố|phạt tiền|mất quyền lợi|bị vô hiệu hóa|account suspended|immediate legal action)/gi);
    if (fearMatches) {
      tactics.push({
        tactic: "FEAR_AND_THREAT",
        severity: "high",
        evidence: fearMatches[0],
        description: "Đe dọa khóa tài khoản hoặc hậu quả pháp lý để gây hoang mang.",
      });
      score += 0.35;
    }

    // 2. Artificial Urgency Manipulation
    const urgencyMatches = lower.match(/(?:trong \d+ phút|trong 24h|hết hạn ngay|khẩn cấp|ngay lập tức|act now|urgent|immediately|chỉ còn \d+ ngày)/gi);
    if (urgencyMatches) {
      tactics.push({
        tactic: "ARTIFICIAL_URGENCY",
        severity: "medium",
        evidence: urgencyMatches[0],
        description: "Tạo áp lực thời gian gấp rút để nạn nhân không kịp kiểm chứng nguồn tin.",
      });
      score += 0.25;
    }

    // 3. False Authority & Institutional Shielding
    const authorityMatches = lower.match(/(?:chỉ đạo khẩn|văn bản số|phòng an ninh quốc gia|bộ công an cảnh báo|ban giám đốc ngân hàng|official directive)/gi);
    if (authorityMatches) {
      tactics.push({
        tactic: "AUTHORITY_PRESSURE",
        severity: "medium",
        evidence: authorityMatches[0],
        description: "Mượn danh nghĩa cơ quan cấp cao nhằm áp đặt sự phục tùng tuyệt đối.",
      });
      score += 0.25;
    }

    // 4. Financial Bait & Artificial Scarcity
    const greedMatches = lower.match(/(?:nhận ngay \d+ triệu|tặng \d+k|hoa hồng khủng|chỉ còn \d+ suất duy nhất|miễn phí 100% cho \d+ người đầu tiên)/gi);
    if (greedMatches) {
      tactics.push({
        tactic: "FINANCIAL_BAIT_AND_SCARCITY",
        severity: "medium",
        evidence: greedMatches[0],
        description: "Kích thích tâm lý ham lợi ích và sợ bỏ lỡ cơ hội (FOMO).",
      });
      score += 0.30;
    }

    return {
      manipulationScore: Number(Math.min(1.0, score).toFixed(2)),
      detectedTactics: tactics,
      isManipulative: score >= 0.40,
    };
  }
}
