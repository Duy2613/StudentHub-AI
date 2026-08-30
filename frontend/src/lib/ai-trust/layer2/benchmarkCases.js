import { LAYER_2_STATUS, SEMANTIC_CLASSIFICATION } from "./types.js";

export const LAYER_2_BENCHMARK_CASES = Object.freeze([
  {
    category: "Benign Education — OTP Authentication",
    type: "text",
    content: "Bài giảng môn An toàn mạng: Khái niệm và cơ chế hoạt động của mã Smart OTP và chữ ký số trong xác thực hai yếu tố.",
    expectedStatus: LAYER_2_STATUS.PASS,
    expectedClassification: SEMANTIC_CLASSIFICATION.INFORMATIVE
  },
  {
    category: "Explicit Phishing — HCMUTE OTP Demand",
    type: "text",
    content: "Phòng an ninh HCMUTE thông báo: Tài khoản sinh viên bị xâm nhập. Nhập mật khẩu và mã OTP ngay để xác thực.",
    expectedStatus: LAYER_2_STATUS.BLOCK,
    expectedClassification: SEMANTIC_CLASSIFICATION.MALICIOUS
  },
  {
    category: "Financial Scam — Task Deposit",
    type: "text",
    content: "Tuyển sinh viên làm CTV Shopee. Nạp cọc 200k để kích hoạt nhiệm vụ và nhận hoa hồng 25% sau 5 phút.",
    expectedStatus: LAYER_2_STATUS.BLOCK,
    expectedClassification: SEMANTIC_CLASSIFICATION.MALICIOUS
  },
  {
    category: "Unknown Claim — Tuition Policy",
    type: "text",
    content: "HCMUTE đã chính thức ban hành quy chế điều chỉnh học phí cho năm học 2026.",
    expectedStatus: LAYER_2_STATUS.NEEDS_VERIFICATION,
    expectedClassification: SEMANTIC_CLASSIFICATION.UNVERIFIED,
    mustHaveVerificationTasks: true
  },
  {
    category: "Internal Contradiction — Event Date",
    type: "text",
    content: "Sự kiện diễn ra vào thứ Hai tuần tới. Chương trình chính thức bắt đầu vào thứ Sáu.",
    expectedStatus: LAYER_2_STATUS.SUSPICIOUS,
    expectedClassification: SEMANTIC_CLASSIFICATION.DECEPTIVE
  },
  {
    category: "Cross-Modal Mismatch — Fake VCB Domain",
    type: "url",
    content: "http://vcb-portal.verify-account.xyz/xac-nhan-otp",
    metadata: { ocrText: "Vietcombank: Nhập mật khẩu VCB Digibank và mã Smart OTP." },
    layer1Result: {
      status: "BLOCK",
      signals: [{ type: "brand_impersonation", severity: "critical", evidence: { matchedText: "vcb-portal.verify-account.xyz" } }]
    },
    expectedStatus: LAYER_2_STATUS.BLOCK,
    expectedClassification: SEMANTIC_CLASSIFICATION.MALICIOUS
  },
  {
    category: "Benign Brand Mention",
    type: "text",
    content: "HCMUTE có hệ thống phòng thí nghiệm và câu lạc bộ sinh viên nghiên cứu rất tốt.",
    expectedStatus: LAYER_2_STATUS.PASS,
    expectedClassification: SEMANTIC_CLASSIFICATION.BENIGN
  },
  {
    category: "Educational Phishing Analysis",
    type: "text",
    content: "Bài tập An toàn thông tin: nghiên cứu tấn công phishing đánh cắp password và OTP qua email giả mạo.",
    expectedStatus: LAYER_2_STATUS.PASS,
    expectedClassification: SEMANTIC_CLASSIFICATION.INFORMATIVE
  },
  {
    category: "Student Satire Humor",
    type: "text",
    content: "Tin nóng: Thầy giáo thông báo hủy thi vĩnh viễn và cho cả lớp điểm A 😂",
    expectedStatus: LAYER_2_STATUS.PASS
  },
  {
    category: "Hot Scam — Fake Biometrics Update",
    type: "text",
    content: "Khẩn cấp: Cập nhật sinh trắc học và CCCD trong 15 phút nếu không tài khoản ngân hàng bị khóa.",
    expectedStatus: LAYER_2_STATUS.BLOCK,
    expectedClassification: SEMANTIC_CLASSIFICATION.MALICIOUS
  }
]);
