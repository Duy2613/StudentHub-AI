/**
 * StudentHub AI — API Route: GET /api/intelligence/experts/disagreements
 * 
 * Returns peer disagreement mappings between experts across domains without reputation bias.
 */

import { ExpertStore } from "@/lib/intelligence/expert/expertStore";
import { ExpertDisagreementMap } from "@/lib/intelligence/expert/expertDisagreementMap";
import { DISAGREEMENT_REASON } from "@/lib/intelligence/expert/expertIntelligenceModel";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_EXPERT_DISAGREEMENTS",
  allowAnonymous: true,
  maxRequests: 60
}, async (req, _routeParams, _principal, secContext) => {
  const { searchParams } = new URL(req.url);
  const domain = (searchParams.get("domain") || "AI_ML").trim().slice(0, 60).toUpperCase();
  if (domain !== "AI_ML") {
    return Response.json({ success: false, error: {
      code: "EXPERT_DISAGREEMENT_DOMAIN_UNAVAILABLE",
      userMessage: "Hiện chỉ có bản minh họa bất đồng trong miền AI/ML.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }

  const allExperts = ExpertStore.getAllExperts({ redactPrivate: true });
  const expMinh = allExperts.find(e => e.expertId === "EXP_DR_MINH_AI");
  const expLan = allExperts.find(e => e.expertId === "EXP_TS_LAN_EDTECH");

  // Sample peer disagreement mapping for AI in higher education
  const disagreements = [
      ExpertDisagreementMap.analyzeDisagreement({
        topic: "Hiệu quả của AI Chatbot trong việc chấm điểm đồ án tự động",
        domain: "AI_ML",
        expertA: expMinh || { name: "TS. Nguyễn Văn Minh", institution: "HCMUTE", title: "Trưởng Bộ Môn AI" },
        claimA: {
          statement: "Mô hình ngôn ngữ lớn (LLM) có thể tự động chấm điểm mã nguồn và đồ án với độ tin cậy tương đương 90% giảng viên khi có bộ rubric chuẩn.",
          publishedAt: "2024-03-15",
          citedPublicationDoi: "10.1109/access.2023.01"
        },
        evidenceA: ["Thực nghiệm trên 250 sinh viên môn Lập trình nâng cao FIT HCMUTE (2023)."],
        expertB: expLan || { name: "TS. Lê Thị Lan", institution: "HCMUTE", title: "Phó Trưởng Khoa SPKT" },
        claimB: {
          statement: "AI chỉ nên dùng làm công cụ gợi ý phản hồi ban đầu. Đồ án cần tương tác đánh giá tư duy phản biện trực tiếp để tránh ngụy biện điểm số.",
          publishedAt: "2024-05-20",
          citedPublicationDoi: "10.1007/edtech.2024.01"
        },
        evidenceB: ["Khảo sát sư phạm trên 400 sinh viên khối ngành kỹ thuật (2024)."],
        divergenceReason: DISAGREEMENT_REASON.DIFFERENT_METHODOLOGIES,
        analysis: "TS. Minh tiếp cận theo bài toán kỹ thuật định lượng (độ khớp mã nguồn và testcase), trong khi TS. Lan phân tích dưới góc độ sư phạm sư phạm kỹ thuật (tương tác sư phạm và đánh giá tư duy)."
      })
  ];

  return Response.json({
    success: true,
    domain,
    totalDisagreements: disagreements.length,
    disagreements,
    sourceState: "SYNTHETIC_EXPERT_BENCHMARK",
    isAuthoritative: false,
    dataNotice: "Bản đồ bất đồng là ví dụ tái lập để minh họa phương pháp; không phải khảo sát trực tiếp hiện tại.",
    meta: { requestId: secContext.correlationId }
  });
});
