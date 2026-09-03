export const STUDENT_DOMAIN_TAXONOMY_VERSION = "studenthub-student-risk-taxonomy-1.0.0";

export const STUDENT_DOMAIN_TAXONOMY = Object.freeze([
  { id: "FAKE_SCHOLARSHIP", highRisk: true, description: "Học bổng giả hoặc yêu cầu phí để nhận học bổng." },
  { id: "TUITION_PAYMENT_SCAM", highRisk: true, description: "Lừa đảo nộp học phí hoặc đổi điểm nhận tiền." },
  { id: "UNIVERSITY_IMPERSONATION", highRisk: true, description: "Mạo danh trường hoặc phòng ban đại học." },
  { id: "FACULTY_IMPERSONATION", highRisk: true, description: "Mạo danh giảng viên/cán bộ để gây áp lực." },
  { id: "STUDENT_ORG_IMPERSONATION", highRisk: true, description: "Mạo danh câu lạc bộ hoặc tổ chức sinh viên." },
  { id: "FAKE_INTERNSHIP", highRisk: true, description: "Thực tập giả, thường kèm phí hồ sơ/đặt cọc." },
  { id: "FAKE_PART_TIME_JOB", highRisk: true, description: "Việc làm thêm giả hoặc tuyển cộng tác viên bất thường." },
  { id: "ADVANCE_FEE_SCAM", highRisk: true, description: "Yêu cầu đóng trước phí, cọc hoặc phí mở khóa." },
  { id: "FAKE_KTX_HOUSING", highRisk: true, description: "Tin phòng ký túc xá/nhà trọ giả hoặc đặt cọc giả." },
  { id: "FAKE_EVENT_TICKET", highRisk: true, description: "Vé sự kiện sinh viên giả hoặc yêu cầu thanh toán bất thường." },
  { id: "FAKE_CERTIFICATE", highRisk: true, description: "Bán chứng chỉ/bằng cấp giả." },
  { id: "ACCOUNT_RECOVERY_SCAM", highRisk: true, description: "Mạo danh hỗ trợ khôi phục tài khoản." },
  { id: "ACCOUNT_TAKEOVER", highRisk: true, description: "Dấu hiệu chiếm quyền tài khoản sinh viên." },
  { id: "PHISHING_SOCIAL_ENGINEERING", highRisk: true, description: "Lừa đảo qua social engineering hoặc phishing." },
  { id: "QR_PAYMENT_SCAM", highRisk: true, description: "Dụ quét QR để chuyển tiền hoặc đổi đích thanh toán." },
  { id: "PAYMENT_REDIRECTION", highRisk: true, description: "Điều hướng thanh toán ra kênh không được xác minh." },
  { id: "FAKE_REFUND", highRisk: true, description: "Mạo danh hoàn tiền và yêu cầu thông tin/thanh toán." },
  { id: "FAKE_REWARD", highRisk: true, description: "Mạo danh phần thưởng/ưu đãi sinh viên." },
  { id: "FAKE_STUDENT_SUPPORT", highRisk: true, description: "Mạo danh hỗ trợ sinh viên để lấy tiền hoặc dữ liệu." },
  { id: "MONEY_MULE_RECRUITMENT", highRisk: true, description: "Tuyển sinh viên nhận/chuyển tiền hộ." },
  { id: "CREDENTIAL_HARVESTING", highRisk: true, description: "Thu thập mật khẩu, OTP hoặc thông tin đăng nhập." },
  { id: "URGENCY_MANIPULATION", highRisk: false, description: "Tạo áp lực thời gian để giảm khả năng kiểm tra." },
  { id: "SOCIAL_PROOF_MANIPULATION", highRisk: false, description: "Dùng bằng chứng xã hội giả hoặc đám đông giả." },
  { id: "NO_MATERIAL_STUDENT_RISK", highRisk: false, description: "Không thấy pattern domain đáng kể trong input hiện tại." },
  { id: "UNKNOWN_STUDENT_RISK", highRisk: false, description: "Không đủ tín hiệu để phân loại domain." },
]);

export const STUDENT_DOMAIN_CLASS_IDS = Object.freeze(STUDENT_DOMAIN_TAXONOMY.map((entry) => entry.id));

export function taxonomyEntry(id) {
  return STUDENT_DOMAIN_TAXONOMY.find((entry) => entry.id === id) || null;
}
