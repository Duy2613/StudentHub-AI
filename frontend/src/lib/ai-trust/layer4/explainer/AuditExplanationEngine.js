/**
 * Layer 4 — AuditExplanationEngine
 * 
 * Generates structured, evidence-cited, human-readable explanations.
 * Structure: VERDICT -> WHY -> KEY EVIDENCE -> WHAT IS UNCERTAIN -> RISK -> RECOMMENDED ACTION
 */

import { FINAL_CLASSIFICATION, RECOMMENDED_ACTION } from "../types.js";

export class AuditExplanationEngine {
  /**
   * Generates audit explanation
   */
  static generateExplanation({
    classification,
    action,
    riskLevel,
    truthAssessment,
    fusedGraph,
    reconciliation = {},
    hardRule = null,
  }) {
    let verdictTitle = "Nội dung an toàn (Đã xác minh)";
    let why = "Nội dung được xác thực bởi các nguồn tin chính thống độc lập.";
    const keyEvidence = [];
    const uncertainties = [];
    let riskSummary = "Mức độ rủi ro: KHÔNG CÓ.";
    let recommendedActionNote = "Sinh viên có thể yên tâm tham khảo và thực hiện theo thông báo.";

    // 1. Hard Rule Malicious
    if (hardRule || classification === FINAL_CLASSIFICATION.MALICIOUS) {
      verdictTitle = "CẢNH BÁO NGUY HIỂM: TẤN CÔNG LỪA ĐẢO / MẠO DANH";
      why = hardRule?.reason || "Phát hiện hành vi mạo danh đơn vị uy tín nhằm chiếm đoạt thông tin bảo mật hoặc mã OTP.";
      riskSummary = "Mức độ rủi ro: NGUY CẤP (CRITICAL) — Nguy cơ mất quyền kiểm soát tài khoản hoặc thiệt hại tài chính.";
      recommendedActionNote = "TUYỆT ĐỐI KHÔNG cung cấp mật khẩu, mã OTP hay chuyển tiền theo yêu cầu này.";
    }
    // 2. Misleading / Overstatement
    else if (classification === FINAL_CLASSIFICATION.MISLEADING) {
      verdictTitle = "NỘI DUNG GÂY HIỂU LẦM / PHÓNG ĐẠI QUY MÔ";
      why = "Chính sách / chương trình có tồn tại nhưng thông tin trong bài viết bị phóng đại hoặc sai lệch phạm vi áp dụng.";
      riskSummary = "Mức độ rủi ro: TRUNG BÌNH (MEDIUM) — Có thể gây nhầm lẫn về quyền lợi học bổng / quy chế đào tạo.";
      recommendedActionNote = "Cần kiểm tra kỹ các điều kiện xét duyệt trên trang thông báo chính thức trước khi chia sẻ.";
    }
    // 3. Unverified
    else if (classification === FINAL_CLASSIFICATION.UNVERIFIED) {
      verdictTitle = "CHƯA THỂ XÁC MINH NGUỒN TIN CHÍNH THỐNG";
      why = "Chưa tìm thấy thông cáo hoặc bằng chứng chính thống bên ngoài xác nhận cho sự kiện này (Không đồng nghĩa là thông tin giả mạo).";
      uncertainties.push("Sự kiện có thể mới phát sinh chưa được báo chí hoặc website nhà trường cập nhật.");
      riskSummary = "Mức độ rủi ro: THẤP (LOW).";
      recommendedActionNote = "Nên liên hệ trực tiếp phòng ban phụ trách của trường để đối chiếu trước khi tin cậy hoàn toàn.";
    }
    // 4. Contested
    else if (classification === "CONTESTED" || action === RECOMMENDED_ACTION.ESCALATE) {
      verdictTitle = "PHÁT HIỆN TRANH CHẤP / MÂU THUẪN NGUỒN TIN";
      why = "Tồn tại thông tin đối nghịch hoặc đính chính giữa các cơ quan báo chí / thông báo khác nhau.";
      uncertainties.push("Có khả năng lịch trình sự kiện đã được điều chỉnh hoặc dời ngày.");
      riskSummary = "Mức độ rủi ro: CAO (HIGH) — Cần thẩm định thêm.";
      recommendedActionNote = "Khuyến nghị chờ thông báo đính chính chính thức từ ban tổ chức.";
    }

    // Extract Key Evidence Passages
    for (const ev of fusedGraph.layer3Evidence.slice(0, 3)) {
      keyEvidence.push({
        sourceTitle: ev.sourceTitle || ev.sourceUrl,
        sourceUrl: ev.sourceUrl,
        excerpt: ev.excerpt,
        relation: ev.relation,
      });
    }

    return {
      verdictTitle,
      why,
      keyEvidence,
      uncertainties,
      riskSummary,
      recommendedActionNote,
    };
  }
}
