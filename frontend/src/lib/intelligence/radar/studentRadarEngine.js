/**
 * StudentHub AI — 7-Head Student Radar Engine
 * 
 * Multi-stream intelligence radar for Vietnamese university students:
 * 1. Academic Radar (Deadlines, Tuition, Registration, Exam Schedules)
 * 2. Risk Radar (Scams, Fake Scholarships, Phishing Links, Deposit Traps)
 * 3. Opportunity Radar (Genuine Corporate Scholarships, Lab Recruitment, Hackathons)
 * 4. Campus Radar (Seminars, Club Events, Library/Lab Schedules)
 * 5. Social Radar (Trending Academic Inquiries, Course Difficulty Warnings)
 * 6. Safety Radar (Verified Crime Alerts, Poor Lighting, Road Hazards)
 * 7. Career Radar (IT/Engineering Internship Demand, Skill Priorities)
 */

import { calculateFreshnessScore } from "../academic/sourceRegistry.js";

export const STUDENT_RADAR_STREAMS = [
  {
    id: "RADAR_ACADEMIC",
    title: "1. Radar Học Vụ & Học Phí",
    category: "ACADEMIC",
    icon: "GraduationCap",
    signals: [
      {
        id: "sig_acad_01",
        title: "Hạn chót đóng học phí Học kỳ 2 (2025-2026)",
        deadline: "2026-03-15",
        publisher: "Phòng Kế hoạch - Tài chính HCMUTE",
        sourceUrl: "https://online.hcmute.edu.vn",
        authorityTier: "TIER_1_OFFICIAL",
        confidence: "HIGH",
        actionRequired: "Đăng nhập Cổng trực tuyến và nộp học phí trước 17h00",
        publishedAt: "2026-02-20T08:00:00.000Z",
      },
      {
        id: "sig_acad_02",
        title: "Mở cổng đăng ký học phần bổ sung đợt 2",
        deadline: "2026-03-02",
        publisher: "Phòng Đào tạo HCMUTE",
        sourceUrl: "https://daotao.hcmute.edu.vn",
        authorityTier: "TIER_1_OFFICIAL",
        confidence: "HIGH",
        actionRequired: "Kiểm tra sĩ số lớp mở thêm và đăng ký tín chỉ",
        publishedAt: "2026-02-24T10:00:00.000Z",
      },
    ],
  },
  {
    id: "RADAR_RISK",
    title: "2. Radar Rủi Ro & Lừa Đảo",
    category: "RISK",
    icon: "ShieldAlert",
    signals: [
      {
        id: "sig_risk_01",
        title: "Cảnh báo bẫy lừa 'Phí giữ chỗ học bổng du học'",
        publisher: "Bộ GD&ĐT / NCSC",
        sourceUrl: "https://tinnhiemmang.vn",
        authorityTier: "TIER_1_OFFICIAL",
        confidence: "HIGH",
        actionRequired: "Tuyệt đối không chuyển tiền cọc cho các fanpage học bổng tự xưng",
        publishedAt: "2026-02-22T09:00:00.000Z",
      },
    ],
  },
  {
    id: "RADAR_OPPORTUNITY",
    title: "3. Radar Học Bổng & Cơ Hội",
    category: "OPPORTUNITY",
    icon: "Award",
    signals: [
      {
        id: "sig_opp_01",
        title: "Học bổng Doanh nghiệp Samsung Talent Program (STP 2026)",
        deadline: "2026-04-10",
        value: "54.000.000 VNĐ + Cơ hội làm việc chính thức",
        publisher: "Phòng CTSV HCMUTE",
        sourceUrl: "https://ctsv.hcmute.edu.vn",
        authorityTier: "TIER_1_OFFICIAL",
        confidence: "HIGH",
        actionRequired: "Nộp bảng điểm GPA >= 3.0 và chứng chỉ ngoại ngữ",
        publishedAt: "2026-02-25T08:00:00.000Z",
      },
    ],
  },
  {
    id: "RADAR_CAMPUS",
    title: "4. Radar Sự Kiện & Hội Thảo",
    category: "CAMPUS",
    icon: "Calendar",
    signals: [
      {
        id: "sig_camp_01",
        title: "Hội thảo Công nghệ 'GenAI & Autonomous Agents in Engineering'",
        eventDate: "2026-03-05 08:30",
        location: "Hội trường Lớn Khu A - HCMUTE",
        publisher: "Khoa CNTT - FIT HCMUTE",
        sourceUrl: "https://fit.hcmute.edu.vn",
        authorityTier: "TIER_1_OFFICIAL",
        confidence: "HIGH",
        actionRequired: "Đăng ký vé tham dự miễn phí qua link phòng Đào tạo",
        publishedAt: "2026-02-23T14:00:00.000Z",
      },
    ],
  },
  {
    id: "RADAR_SOCIAL",
    title: "5. Radar Thảo Luận Giảng Đường",
    category: "SOCIAL",
    icon: "MessageSquare",
    signals: [
      {
        id: "sig_soc_01",
        title: "Kinh nghiệm ôn thi môn Giải tích 2 & Kỹ thuật Lập trình C++",
        publisher: "Diễn đàn UTE Thắc Mắc Học Tập",
        sourceUrl: "https://facebook.com/groups/utethacmachoctap",
        authorityTier: "TIER_2_CORROBORATED",
        confidence: "MEDIUM",
        actionRequired: "Tham khảo slide bài tập tích phân bội và code mẫu con trỏ",
        publishedAt: "2026-02-25T11:00:00.000Z",
      },
    ],
  },
  {
    id: "RADAR_SAFETY",
    title: "6. Radar An Ninh & Nhà Trọ",
    category: "SAFETY",
    icon: "MapPin",
    signals: [
      {
        id: "sig_safe_01",
        title: "Cập nhật khu trọ an toàn hẻm 48 Hoàng Diệu 2 (Thủ Đức)",
        publisher: "Bản đồ An ninh StudentHub AI",
        sourceUrl: "/safety-map",
        authorityTier: "TIER_2_CORROBORATED",
        confidence: "HIGH",
        actionRequired: "Chủ trọ có hợp đồng chuẩn, không phụ thu tiền điện sai quy định",
        publishedAt: "2026-02-24T16:00:00.000Z",
      },
    ],
  },
  {
    id: "RADAR_CAREER",
    title: "7. Radar Việc Làm & Kỹ Năng Hot",
    category: "CAREER",
    icon: "Briefcase",
    signals: [
      {
        id: "sig_car_01",
        title: "Nhu cầu tuyển dụng Thực tập sinh Lập trình Nhúng / AI Engineer",
        publisher: "Trung tâm Hướng nghiệp & Quan hệ Doanh nghiệp",
        sourceUrl: "https://ctsv.hcmute.edu.vn",
        authorityTier: "TIER_1_OFFICIAL",
        confidence: "HIGH",
        actionRequired: "Củng cố kiến thức C++, Linux Kernel và thuật toán cơ bản",
        publishedAt: "2026-02-21T10:00:00.000Z",
      },
    ],
  },
];

/**
 * Fetches all 7 radar streams with real-time freshness decay
 */
export function getEvaluatedStudentRadar() {
  return STUDENT_RADAR_STREAMS.map((stream) => ({
    ...stream,
    signals: stream.signals.map((sig) => {
      const freshness = calculateFreshnessScore(sig.publishedAt);
      return {
        ...sig,
        freshnessScore: freshness.score,
        freshnessStatus: freshness.status,
      };
    }),
  }));
}
