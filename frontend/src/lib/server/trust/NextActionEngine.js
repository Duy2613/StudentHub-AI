/**
 * StudentHub AI — NextActionEngine
 *
 * Implements context-appropriate student action recommendations.
 * Prevents dangerous automated high-impact external actions.
 */

export const NEXT_ACTIONS = {
  OPEN_OFFICIAL_SOURCE: "OPEN_OFFICIAL_SOURCE",
  VERIFY_WITH_INSTITUTION: "VERIFY_WITH_INSTITUTION",
  DO_NOT_TRANSFER_MONEY_YET: "DO_NOT_TRANSFER_MONEY_YET",
  ADD_MISSING_EVIDENCE: "ADD_MISSING_EVIDENCE",
  REQUEST_EXPERT_REVIEW: "REQUEST_EXPERT_REVIEW",
  VIEW_COMMUNITY_CONTEXT: "VIEW_COMMUNITY_CONTEXT",
};

export class NextActionEngine {
  static determineNextActions({
    verdict = "INSUFFICIENT_EVIDENCE",
    evidence = [],
    claims = [],
    caseId = null,
  } = {}) {
    const actions = [];

    const officialSource = evidence.find((e) => e.sourceType === "PRIMARY_OFFICIAL" && e.canonicalUrl);

    if (verdict === "HIGH_RISK" || verdict === "CONTRADICTED") {
      actions.push({
        actionType: NEXT_ACTIONS.DO_NOT_TRANSFER_MONEY_YET,
        label: "TUYỆT ĐỐI KHÔNG CHUYỂN TIỀN CỌC / KHÔNG NHẬP OTP",
        priority: "CRITICAL",
        reason: "Phát hiện rủi ro lừa đảo mạo danh hoặc yêu cầu thanh toán không hợp thức.",
      });

      actions.push({
        actionType: NEXT_ACTIONS.VERIFY_WITH_INSTITUTION,
        label: "Liên hệ Phòng Tuyển sinh / CTSV nhà trường để kiểm chứng",
        priority: "HIGH",
        reason: "Đối chiếu trực tiếp qua số hotline hoặc email chính thức của trường.",
      });
    }

    if (officialSource) {
      actions.push({
        actionType: NEXT_ACTIONS.OPEN_OFFICIAL_SOURCE,
        label: `Mở văn bản gốc tại ${officialSource.publisher || officialSource.domain}`,
        priority: "HIGH",
        targetUrl: officialSource.canonicalUrl,
        reason: "Kiểm tra toàn văn thông báo trên cổng thông tin có thẩm quyền.",
      });
    }

    if (verdict === "INSUFFICIENT_EVIDENCE") {
      actions.push({
        actionType: NEXT_ACTIONS.ADD_MISSING_EVIDENCE,
        label: "Bổ sung ảnh chụp hoặc văn bản thông báo chi tiết hơn",
        priority: "MEDIUM",
        reason: "Thông tin hiện tại quá ngắn hoặc thiếu căn cứ đối chiếu.",
      });
    }

    // Community and Expert options
    actions.push({
      actionType: NEXT_ACTIONS.VIEW_COMMUNITY_CONTEXT,
      label: "Xem trao đổi của sinh viên các khóa khác",
      priority: "LOW",
      href: `/community${caseId ? `?caseId=${caseId}` : ""}`,
      reason: "Tham khảo kinh nghiệm và phản ánh thực tế từ cộng đồng sinh viên.",
    });

    actions.push({
      actionType: NEXT_ACTIONS.REQUEST_EXPERT_REVIEW,
      label: "Yêu cầu Giảng viên / Chuyên gia học vụ thẩm định",
      priority: "LOW",
      href: `/expert${caseId ? `?caseId=${caseId}` : ""}`,
      reason: "Chuyển tình huống phức tạp đến cố vấn chuyên môn có thẩm quyền.",
    });

    return actions;
  }
}
