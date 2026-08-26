/**
 * StudentHub AI — Counter-Evidence & Adversarial Disproof Engine V2
 */

import {
  AiTrustModel,
  AUTHORITY_TIER,
  TEMPORAL_STATUS
} from "./aiTrustModel.js";

export class CounterEvidenceEngine {
  static searchCounterEvidence(claim, candidateEvidencePool = []) {
    if (!claim) return { counterEvidence: [], outcome: "UNRESOLVED", explanation: "Không có tuyên bố để kiểm chứng." };

    const validPool = candidateEvidencePool.map(e => AiTrustModel.createEvidenceSpan(e));
    const counterEvidence = [];

    const claimTextLower = (claim.text || claim.statement || "").toLowerCase();
    const claimCohort = claim.scope || claim.cohort || "ALL";

    for (const evid of validPool) {
      const passageLower = evid.passage.toLowerCase();

      // 1. Numeric contradiction (e.g. claim says TOEIC 550, but source says 500 or 600)
      if (claim.numericValue !== null && typeof claim.numericValue === "number") {
        const numRegex = /\b(\d{2,4})\b/g;
        const matches = evid.passage.match(numRegex) || [];
        for (const m of matches) {
          const val = Number(m);
          if (val !== claim.numericValue && Math.abs(val - claim.numericValue) >= 20 && Math.abs(val - claim.numericValue) <= 200) {
            counterEvidence.push(evid);
          }
        }
      }

      // 2. Cohort mismatch / exception
      if (claimCohort !== "ALL" && (passageLower.includes("khóa") || passageLower.includes("k2"))) {
        if (!passageLower.includes(claimCohort.toLowerCase()) && (passageLower.includes("k22") || passageLower.includes("k23") || passageLower.includes("k25"))) {
          if (passageLower.includes("áp dụng riêng cho")) {
            counterEvidence.push(evid);
          }
        }
      }

      // 3. Negation / Contradiction / Policy Divergence
      const negationPairs = [
        ["bãi bỏ", "không được bãi bỏ"],
        ["bãi bỏ", "bắt buộc"],
        ["miễn", "không được miễn"],
        ["hủy", "vẫn áp dụng"],
        ["tự chọn", "bắt buộc"]
      ];

      for (const [pos, neg] of negationPairs) {
        if ((claimTextLower.includes(pos) && passageLower.includes(neg)) ||
            (claimTextLower.includes(neg) && passageLower.includes(pos))) {
          counterEvidence.push(evid);
        }
      }

      if (passageLower.includes("hủy bỏ") || passageLower.includes("không còn hiệu lực") || passageLower.includes("thay thế bằng")) {
        if (claimTextLower.split(" ").some(word => word.length > 3 && passageLower.includes(word))) {
          if (!counterEvidence.includes(evid)) counterEvidence.push(evid);
        }
      }
    }

    let outcome = "CONFIRMED";
    let explanation = "Không phát hiện bằng chứng phản bác hợp lệ. Kết luận giữ nguyên độ tin cậy.";

    if (counterEvidence.length > 0) {
      const hasOfficialCurrent = counterEvidence.some(
        c => c.authorityTier >= AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR && c.temporalStatus === TEMPORAL_STATUS.CURRENTLY_VALID
      );
      const hasHistorical = counterEvidence.some(c => c.temporalStatus === TEMPORAL_STATUS.HISTORICALLY_TRUE);

      if (hasOfficialCurrent) {
        outcome = "CONFLICTED";
        explanation = "Phát hiện văn bản quy định chính thức hiện hành mâu thuẫn trực tiếp với tuyên bố.";
      } else if (hasHistorical) {
        outcome = "WEAKENED";
        explanation = "Phát hiện văn bản lịch sử có quy định khác (đã được thay thế bởi văn bản hiện hành).";
      } else {
        outcome = "WEAKENED";
        explanation = "Phát hiện phản hồi không đồng nhất từ các nguồn thứ cấp/cộng đồng.";
      }
    }

    return {
      counterEvidence,
      outcome,
      explanation
    };
  }

  static generateSensitivityAnalysis(claim, currentEvidence) {
    return {
      currentStatus: claim?.epistemicState || "VERIFIED",
      conditionsThatWouldChangeAnswer: [
        "Xuất hiện Quyết định hoặc Thông báo mới hơn từ Ban Giám hiệu / Phòng Đào Tạo bãi bỏ quy định này.",
        "Sinh viên thuộc khóa (Cohort) hoặc hệ đào tạo khác (ví dụ: Chất lượng cao vs Đại trà) có chuẩn riêng.",
        "Văn bản trích dẫn bị đính chính hoặc thu hồi chính thức trên cổng thông tin nhà trường.",
        "Quy trình thực tế tại Khoa/Phòng ban có bổ sung hướng dẫn chuyên biệt chưa được số hóa."
      ]
    };
  }
}
