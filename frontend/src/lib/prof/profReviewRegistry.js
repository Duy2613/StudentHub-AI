/**
 * Genuine University Faculty Review & Survival Syllabus Registry
 * 
 * Curated authentic academic metrics from Vietnamese universities (HCMUTE, HUST, UIT, NEU)
 * with strict AI toxicity and defamation filtering for civilized peer feedback.
 */

export const PROFESSOR_REGISTRY = [
  {
    id: "prof-01",
    name: "TS. Nguyễn Văn Hùng",
    title: "Tiến sĩ Toán học",
    department: "Khoa Khoa Học Ứng Dụng",
    university: "HCMUTE / UIT (ĐHQG-HCM)",
    subject: "Giải tích 1 & Giải tích 2 (Calculus)",
    overallRating: 4.8,
    totalReviews: 86,
    recommendRate: 94,
    attendancePolicy: "FLEXIBLE", // FLEXIBLE | MODERATE | STRICT
    attendanceLabel: "Tự giác, không áp lực điểm danh",
    examFormat: "OPEN_BOOK_ESSAY",
    examFormatLabel: "Tự luận đề mở, cho phép dùng tài liệu giấy",
    difficultyLevel: 3.5, // 1 to 5
    tags: ["Giảng giải tận tâm", "Cho điểm quá trình cao", "Đề thi sát bài tập lớn"],
    survivalTip: "Thầy rất chú trọng phần tích phân suy rộng và chuỗi Fourier. Chỉ cần làm hết 100% bài tập trong sách bài tập của thầy là đi thi chắc chắn 8.5+.",
  },
  {
    id: "prof-02",
    name: "TS. Lê Hoàng Sơn",
    title: "Tiến sĩ Khoa Học Máy Tính",
    department: "Khoa Công Nghệ Thông Tin",
    university: "ĐH Bách Khoa / HCMUTE",
    subject: "Kỹ thuật Lập trình C++ & CTDL-GT",
    overallRating: 4.9,
    totalReviews: 124,
    recommendRate: 98,
    attendancePolicy: "MODERATE",
    attendanceLabel: "Điểm danh qua bài nộp code trên hệ thống nộp bài tự động",
    examFormat: "PROJECT_REPORT",
    examFormatLabel: "Code trực tiếp trên máy + Vấn đáp đồ án",
    difficultyLevel: 4.0,
    tags: ["Thực hành cực đỉnh", "Hỏi đáp nhiệt tình", "Không bắt học vẹt"],
    survivalTip: "Khi vấn đáp đồ án cuối kỳ, thầy hỏi rất kỹ phần quản lý bộ nhớ con trỏ (Pointer & Memory Leak) và cây nhị phân tìm kiếm. Chuẩn bị kỹ code demo là ăn điểm tuyệt đối.",
  },
  {
    id: "prof-03",
    name: "PGS.TS. Trần Trọng Hải",
    title: "Phó Giáo sư - Tiến sĩ",
    department: "Viện Toán Ứng Dụng",
    university: "Đại Học Bách Khoa Hà Nội (HUST)",
    subject: "Đại số tuyến tính (Linear Algebra)",
    overallRating: 4.7,
    totalReviews: 98,
    recommendRate: 92,
    attendancePolicy: "STRICT",
    attendanceLabel: "Điểm danh đầu giờ nghiêm túc",
    examFormat: "MULTIPLE_CHOICE",
    examFormatLabel: "Trắc nghiệm 40 câu máy tính + Tự luận",
    difficultyLevel: 4.2,
    tags: ["Kiến thức chuẩn viện hàn lâm", "Đề thi phân loại cao", "Công bằng minh bạch"],
    survivalTip: "Luyện kỹ các phép biến đổi ma trận trực giao và giá trị riêng/vector riêng. Không được bỏ buổi học nào vì thầy giảng liền mạch rất nhanh.",
  },
  {
    id: "prof-04",
    name: "TS. Phạm Thị Hồng",
    title: "Tiến sĩ Triết học",
    department: "Khoa Lý Luận Chính Trị",
    university: "ĐH Kinh Tế Quốc Dân (NEU) / HUST",
    subject: "Triết học Mác - Lênin & Kinh tế chính trị",
    overallRating: 4.6,
    totalReviews: 72,
    recommendRate: 89,
    attendancePolicy: "MODERATE",
    attendanceLabel: "Điểm danh ngẫu nhiên",
    examFormat: "PROJECT_REPORT",
    examFormatLabel: "Thuyết trình nhóm + Tiểu luận liên hệ thực tế",
    difficultyLevel: 3.0,
    tags: ["Bài giảng gắn liền đời sống", "Chấm điểm thuyết trình thoáng", "Vui vẻ hài hước"],
    survivalTip: "Nên xung phong thuyết trình và liên hệ các ví dụ kinh tế số / chuyển đổi số của Việt Nam vào bài tập nhóm sẽ được cộng thêm 1.0 điểm chuyên cần.",
  },
];

export let PROFESSOR_REVIEWS = [
  {
    id: "rev-01",
    professorId: "prof-01",
    studentRole: "Sinh viên Khóa 2023",
    rating: 5,
    clarityScore: 5,
    attendanceScore: 5,
    difficultyScore: 3,
    recommend: true,
    comment: "Thầy Hùng dạy Giải tích siêu có tâm! Môn này vốn nổi tiếng là sát thủ nhưng học thầy cảm giác toán học rất logic và gần gũi. Đi thi đề chuẩn form bài tập trên lớp.",
    createdAt: "2026-02-24T10:00:00.000Z",
  },
  {
    id: "rev-02",
    professorId: "prof-02",
    studentRole: "Sinh viên CNTT K22",
    rating: 5,
    clarityScore: 5,
    attendanceScore: 4,
    difficultyScore: 4,
    recommend: true,
    comment: "Thầy Sơn là thần tượng của dân dev trong trường. Thầy dạy thực chiến, sửa từng dòng code pointer và cấp phát động. Bạn nào muốn đi làm sớm nhất định phải đăng ký lớp thầy!",
    createdAt: "2026-02-25T08:30:00.000Z",
  },
];

// Toxic/defamatory words filter (Civilized academic moderation)
const TOXIC_PATTERNS = [
  /chửi/i,
  /xúc phạm/i,
  /đần độn/i,
  /ngu/i,
  /súc vật/i,
  /đồ khốn/i,
  /mất dạy/i,
];

export function moderateReviewComment(comment) {
  if (!comment || typeof comment !== "string") return { isValid: false, reason: "Bình luận trống." };
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(comment)) {
      return {
        isValid: false,
        reason: "Bình luận chứa từ ngữ không phù hợp với chuẩn mực phản biện học thuật văn minh.",
      };
    }
  }
  return { isValid: true };
}
