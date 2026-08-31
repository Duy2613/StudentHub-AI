/**
 * Layer 4 — AuditExplanationEngine
 *
 * Produces evidence-bound copy. The explanation is not allowed to invent
 * sources, agreement, certification, or a safety conclusion absent from the
 * deterministic policy result.
 */

import { FINAL_CLASSIFICATION, SECURITY_CLASSIFICATION, RECOMMENDED_ACTION } from "../types.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function boundedText(value, max = 500) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export class AuditExplanationEngine {
  static generateExplanation(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const classification = input.classification;
    const securityClassification = typeof input.securityClassification === "string"
      ? input.securityClassification
      : SECURITY_CLASSIFICATION.UNKNOWN;
    const action = input.action;
    const riskLevel = typeof input.riskLevel === "string" ? input.riskLevel : null;
    const truthAssessment = input.truthAssessment && typeof input.truthAssessment === "object" ? input.truthAssessment : {};
    const fusedGraph = input.fusedGraph && typeof input.fusedGraph === "object" && !Array.isArray(input.fusedGraph)
      ? input.fusedGraph
      : {};
    const reconciliation = input.reconciliation && typeof input.reconciliation === "object" && !Array.isArray(input.reconciliation)
      ? input.reconciliation
      : {};
    const hardRule = input.hardRule && typeof input.hardRule === "object" ? input.hardRule : null;

    let verdictTitle = "CHƯA THỂ XÁC MINH AN TOÀN";
    let why = "Chưa có đủ bằng chứng độc lập và có provenance để kết luận an toàn. Không nên coi trạng thái này là an toàn.";
    const keyEvidence = [];
    const uncertainties = [];
    let riskSummary = "Mức độ rủi ro: CHƯA XÁC ĐỊNH (UNKNOWN).";
    let recommendedActionNote = "Tạm dừng thao tác nhạy cảm và xác minh qua kênh độc lập, chính thức.";

    if (securityClassification === SECURITY_CLASSIFICATION.MALICIOUS || hardRule || classification === FINAL_CLASSIFICATION.MALICIOUS) {
      verdictTitle = "CẢNH BÁO NGUY HIỂM: TẤN CÔNG LỪA ĐẢO / MẠO DANH";
      why = boundedText(hardRule?.reason) || "Phát hiện chỉ dấu độc hại hoặc khớp mối đe dọa từ một quy tắc bảo vệ cứng.";
      riskSummary = `Mức độ rủi ro: ${riskLevel || "CAO"}. Không cung cấp thông tin xác thực, mã OTP, tài chính hoặc quyền truy cập.`;
      recommendedActionNote = "TUYỆT ĐỐI KHÔNG cung cấp mật khẩu, mã OTP, chuyển tiền hoặc mở tệp/liên kết này.";
    } else if (securityClassification === SECURITY_CLASSIFICATION.SUSPICIOUS) {
      verdictTitle = "NỘI DUNG ĐÁNG NGỜ — CẦN THẬN TRỌNG";
      why = "Có tín hiệu bất thường trong nội dung hoặc cách thức phân phối. Kết quả không được hạ cấp chỉ vì nguồn chưa phát hiện mối đe dọa.";
      riskSummary = `Mức độ rủi ro: ${riskLevel || "TRUNG BÌNH"}.`;
      recommendedActionNote = action === RECOMMENDED_ACTION.REVIEW
        ? "Không thực hiện thao tác nhạy cảm cho đến khi có kết quả xác minh độc lập."
        : "Không cung cấp dữ liệu nhạy cảm; hãy đối chiếu với kênh chính thức trước khi tiếp tục.";
      uncertainties.push("Tín hiệu đáng ngờ không tự nó chứng minh toàn bộ nội dung là độc hại; cần giữ trạng thái cảnh báo.");
    } else if (securityClassification === SECURITY_CLASSIFICATION.NO_KNOWN_THREAT) {
      verdictTitle = "KHÔNG PHÁT HIỆN MỐI ĐE DỌA ĐÃ BIẾT";
      why = "Các kiểm tra hiện có không phát hiện mối đe dọa đã biết hoặc bằng chứng đang hỗ trợ nội dung trong phạm vi được kiểm tra.";
      riskSummary = `Mức độ rủi ro: ${riskLevel || "THẤP"}. Đây không phải chứng nhận an toàn hoặc chứng minh sự thật tuyệt đối.`;
      recommendedActionNote = "Vẫn thận trọng với yêu cầu thanh toán, mã OTP, đăng nhập và tệp tải xuống; không coi kết quả này là bảo đảm an toàn.";
      uncertainties.push("Không phát hiện mối đe dọa đã biết không đồng nghĩa với đã chứng minh an toàn.");
    } else if (classification === FINAL_CLASSIFICATION.MISLEADING) {
      verdictTitle = "NỘI DUNG GÂY HIỂU LẦM / PHÓNG ĐẠI QUY MÔ";
      why = "Bằng chứng hỗ trợ một phần nội dung nhưng cho thấy phạm vi hoặc diễn giải bị phóng đại.";
      riskSummary = "Mức độ rủi ro: TRUNG BÌNH (MEDIUM).";
      recommendedActionNote = "Kiểm tra điều kiện và phạm vi trên nguồn chính thức trước khi chia sẻ hoặc hành động.";
    } else if (classification === FINAL_CLASSIFICATION.CONTRADICTED) {
      verdictTitle = "NỘI DUNG BỊ MÂU THUẪN VỚI BẰNG CHỨNG";
      why = "Một hoặc nhiều nguồn có provenance mâu thuẫn trực tiếp với tuyên bố được kiểm tra.";
      riskSummary = "Mức độ rủi ro: CAO (HIGH) — Cần thẩm định thêm.";
      recommendedActionNote = "Không dựa vào tuyên bố này cho quyết định quan trọng cho đến khi tranh chấp được giải quyết.";
    } else if (classification === "CONTESTED" || action === RECOMMENDED_ACTION.REVIEW && asArray(reconciliation.unresolvedConflicts).length > 0) {
      verdictTitle = "PHÁT HIỆN TRANH CHẤP / MÂU THUẪN NGUỒN TIN";
      why = "Tồn tại thông tin đối nghịch hoặc đính chính giữa các nguồn; hệ thống không tự chọn bên khi chưa đủ căn cứ.";
      riskSummary = "Mức độ rủi ro: CHƯA ỔN ĐỊNH (UNKNOWN) — Cần thẩm định thêm.";
      recommendedActionNote = "Khuyến nghị chờ thông báo hoặc đối chiếu chính thức trước khi hành động.";
    } else {
      uncertainties.push("Bằng chứng hiện có chưa đủ để kết luận đáng tin cậy.");
    }

    for (const ev of asArray(fusedGraph.layer3Evidence).slice(0, 3)) {
      if (!ev || typeof ev !== "object") continue;
      const sourceTitle = boundedText(ev.sourceTitle || ev.sourceUrl, 180);
      const sourceUrl = /^https?:\/\//i.test(ev.sourceUrl || "") ? ev.sourceUrl : null;
      const excerpt = boundedText(ev.excerpt, 500);
      if (!sourceTitle && !excerpt) continue;
      keyEvidence.push({
        sourceTitle: sourceTitle || "Nguồn không định danh",
        sourceUrl,
        excerpt,
        relation: boundedText(ev.relation, 80) || "UNSPECIFIED",
        sourceType: boundedText(ev.sourceType, 80) || "UNSPECIFIED",
      });
    }

    if (asArray(fusedGraph.layer3Conflicts).length > 0) {
      uncertainties.push("Có xung đột nguồn hoặc xung đột nội dung chưa được giải quyết hoàn toàn.");
    }
    if (fusedGraph.layer2AProviderStatus && !["SUCCESS", "success", "healthy", "NOT_APPLICABLE"].includes(fusedGraph.layer2AProviderStatus)) {
      uncertainties.push("Nguồn kiểm tra mối đe dọa không hoàn tất; không suy diễn thành không có mối đe dọa.");
    }

    return {
      verdictTitle,
      why,
      keyEvidence,
      uncertainties: Array.from(new Set(uncertainties)),
      riskSummary,
      recommendedActionNote,
    };
  }
}
