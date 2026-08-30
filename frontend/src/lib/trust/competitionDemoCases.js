export const COMPETITION_DEMO_CASES = Object.freeze([
  {
    id: "clear-risk",
    label: "Case 1 · Rủi ro rõ",
    input: "Phòng đào tạo yêu cầu chuyển khoản đặt cọc và gửi mã OTP qua liên kết đăng nhập lạ.",
    layers: {
      layer1: { status: "REVIEW", riskLevel: "HIGH" },
      layer2: { status: "COMPLETE", summary: "Yêu cầu thanh toán và OTP qua kênh không chính thức.", claims: [{ text: "Yêu cầu chuyển tiền trước khi xác minh", status: "SUSPICIOUS" }] },
      layer3: { status: "COMPLETE", verificationCompleteness: 0.84, sourceAgreement: "STRONG", providerResults: [{ provider: "Domain intelligence", status: "findings", signals: ["Tên miền không thuộc tổ chức"], latencyMs: 84 }], evidence: [{ title: "Cổng thông tin chính thức", publisher: "Nhà trường", status: "verified" }] },
      layer4: { status: "HIGH_RISK_INDICATORS", riskLevel: "HIGH", confidence: 0.88, userExplanation: { verdictTitle: "Nghi vấn rủi ro cao", why: "Kênh thanh toán và yêu cầu OTP không khớp quy trình chính thức.", recommendedActionNote: "Tạm dừng giao dịch và xác minh qua kênh chính thức." } },
    },
  },
  {
    id: "uncertain",
    label: "Case 2 · Chưa đủ bằng chứng",
    input: "Một thông báo học bổng được chuyển tiếp nhưng chưa có đường dẫn hoặc đơn vị phát hành.",
    layers: {
      layer1: { status: "REVIEW", riskLevel: "UNKNOWN" },
      layer2: { status: "PARTIAL", summary: "Thiếu nguồn phát hành có thể đối chiếu.", claims: [{ text: "Có chương trình học bổng mới", status: "UNVERIFIED" }] },
      layer3: { status: "INSUFFICIENT", verificationCompleteness: 0.18, sourceAgreement: "UNKNOWN", providerResults: [] },
      layer4: { status: "INSUFFICIENT_EVIDENCE", riskLevel: "UNKNOWN", confidence: 0.22, userExplanation: { verdictTitle: "Chưa đủ bằng chứng để kết luận", why: "Không có đủ nguồn độc lập để xác nhận hoặc bác bỏ.", recommendedActionNote: "Chờ thông báo từ kênh chính thức trước khi hành động." } },
    },
  },
  {
    id: "degraded-providers",
    label: "Case 3 · Nguồn suy giảm",
    input: "Liên kết thanh toán học phí cần được kiểm tra trong lúc một số nguồn đối soát không phản hồi.",
    layers: {
      layer1: { status: "REVIEW", riskLevel: "MEDIUM" },
      layer2: { status: "COMPLETE", summary: "Liên kết cần xác minh thêm trước khi thanh toán.", claims: [{ text: "Đây là cổng học phí chính thức", status: "UNVERIFIED" }] },
      layer3: { status: "PARTIAL", verificationCompleteness: 0.52, sourceAgreement: "MIXED", providerResults: [{ provider: "Domain intelligence", status: "findings", signals: ["Tên miền mới đăng ký"], latencyMs: 112 }, { provider: "Threat feed", status: "unknown", signals: [] }, { provider: "Community reports", status: "unavailable", signals: [] }] },
      layer4: { status: "CONFLICTING_EVIDENCE", riskLevel: "MEDIUM", confidence: 0.58, userExplanation: { verdictTitle: "Có dấu hiệu cần chú ý", why: "Một nguồn có phát hiện trong khi hai nguồn chưa thể kết luận.", recommendedActionNote: "Không thanh toán cho đến khi đối chiếu được với cổng trường." } },
    },
  },
]);
