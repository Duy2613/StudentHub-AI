/**
 * StudentHub AI — Personal Academic Radar & Deadline Dependency Engine
 * 
 * Enforces Constitution Articles 26–29:
 * Generates personalized academic radar alerts, countdowns, and
 * deadline preparation dependency graphs based on student state.
 */

export class AcademicRadarEngine {
  /**
   * Generates personal academic radar signals based on student profile
   * @param {object} studentState - { semester, earnedCredits, gpa, completedCourses }
   * @returns {object} Personalized Radar Signals
   */
  static generatePersonalRadar(studentState = {}) {
    const { semester = 3, earnedCredits = 45, gpa = 2.8, completedCourses = [] } = studentState;
    const signals = [];

    // 1. Course Registration Radar
    signals.push({
      signalId: "RADAR_REGISTRATION_FALL2026",
      category: "COURSE_REGISTRATION",
      title: "Đợt Đăng Ký Học Phần Học Kỳ 1 (2026 - 2027)",
      issuer: "Phòng Đào Tạo HCMUTE",
      urgency: "HIGH",
      deadline: "2026-09-05T17:00:00.000Z",
      sourceUrl: "https://online.hcmute.edu.vn",
      requiredAction: "Kiểm tra danh sách môn học đề xuất và đăng ký trên cổng online.hcmute.edu.vn theo đúng khung giờ khóa.",
      relevanceScore: 1.0,
      provenance: {
        source_id: "portal_academic",
        authority: "TIER_1_OFFICIAL"
      }
    });

    // 2. Thesis Prep Radar (Triggered when credits >= 100)
    if (earnedCredits >= 100) {
      signals.push({
        signalId: "RADAR_THESIS_PREP",
        category: "GRADUATION_THESIS",
        title: "Đăng Ký Đề Tài & Giảng Viên Hướng Dẫn Khóa Luận Tốt Nghiệp",
        issuer: "Khoa Công Nghệ Thông Tin (FIT)",
        urgency: "CRITICAL",
        deadline: "2026-09-20T23:59:00.000Z",
        sourceUrl: "https://fit.hcmute.edu.vn",
        requiredAction: "Chọn hướng nghiên cứu và liên hệ trực tiếp giảng viên bộ môn để thống nhất đề tài trước hạn.",
        relevanceScore: 0.95,
        provenance: {
          source_id: "fit_portal",
          authority: "TIER_1_OFFICIAL"
        }
      });
    }

    // 3. Scholarship Radar (Triggered when GPA >= 3.20)
    if (gpa >= 3.20) {
      signals.push({
        signalId: "RADAR_SCHOLARSHIP_MERIT",
        category: "SCHOLARSHIP",
        title: "Học Bổng Khuyến Khích Học Tập Học Kỳ Mới",
        issuer: "Phòng Công Tác Sinh Viên (CTSV)",
        urgency: "MEDIUM",
        deadline: "2026-09-30T17:00:00.000Z",
        sourceUrl: "https://ctsv.hcmute.edu.vn",
        requiredAction: "Kiểm tra số tài khoản ngân hàng liên kết trên hệ thống để nhà trường chuyển khoản học bổng trực tiếp.",
        relevanceScore: 0.90,
        provenance: {
          source_id: "portal_ctsv",
          authority: "TIER_1_OFFICIAL"
        }
      });
    }

    // 4. Tuition Radar
    signals.push({
      signalId: "RADAR_TUITION_PAYMENT",
      category: "TUITION_FEE",
      title: "Hạn Chót Nộp Học Phí Học Kỳ 1 (2026 - 2027)",
      issuer: "Phòng Kế Hoạch - Tài Chính HCMUTE",
      urgency: "HIGH",
      deadline: "2026-10-15T16:30:00.000Z",
      sourceUrl: "https://online.hcmute.edu.vn",
      requiredAction: "Thanh toán học phí qua cổng trực tuyến hoặc nộp vào STK chính thức BIDV của trường.",
      relevanceScore: 1.0,
      provenance: {
        source_id: "portal_academic",
        authority: "TIER_1_OFFICIAL"
      }
    });

    return {
      studentSummary: { semester, earnedCredits, gpa },
      totalActiveSignals: signals.length,
      signals
    };
  }

  /**
   * Generates a step-by-step preparation dependency graph for a major academic deadline
   * @param {string} milestoneType - e.g. "GRADUATION_THESIS"
   * @returns {object} Milestone Prep Graph
   */
  static generateMilestonePreparationGraph(milestoneType = "GRADUATION_THESIS") {
    if (milestoneType === "GRADUATION_THESIS") {
      return {
        milestone: "Khóa luận Tốt nghiệp cử nhân/kỹ sư CNTT",
        finalDeadline: "2026-12-15",
        preparationSteps: [
          {
            stepIndex: 1,
            title: "Chọn hướng đề tài & liên hệ Giảng viên Hướng dẫn (GVHD)",
            deadlineOffsetDays: -60,
            requiredItems: ["Bảng điểm tích lũy >= 110 tín chỉ", "Đề cương sơ bộ (1-2 trang)"],
            status: "RECOMMENDED_START"
          },
          {
            stepIndex: 2,
            title: "Nộp Đơn đăng ký đề tài chính thức qua Cổng Khoa FIT",
            deadlineOffsetDays: -45,
            requiredItems: ["Chữ ký xác nhận của GVHD", "Mẫu đơn Form FIT-01"],
            status: "PENDING_PORTAL_OPEN"
          },
          {
            stepIndex: 3,
            title: "Báo cáo tiến độ giữa kỳ (Mid-term Progress Review)",
            deadlineOffsetDays: -20,
            requiredItems: ["Slide báo cáo", "Bản nháp 50% nội dung cuốn khóa luận"],
            status: "UPCOMING"
          },
          {
            stepIndex: 4,
            title: "Nộp toàn văn Khóa luận & Quyết định phản biện",
            deadlineOffsetDays: -7,
            requiredItems: ["3 cuốn khóa luận đóng bìa mềm", "File PDF gửi qua hệ thống"],
            status: "UPCOMING"
          },
          {
            stepIndex: 5,
            title: "Bảo vệ trước Hội đồng chấm Khóa luận cấp Khoa",
            deadlineOffsetDays: 0,
            requiredItems: ["Slide thuyết trình 15 phút", "Demo sản phẩm phần mềm trực tiếp"],
            status: "FINAL_DEFENSE"
          }
        ]
      };
    }

    return {
      milestone: milestoneType,
      preparationSteps: []
    };
  }
}
