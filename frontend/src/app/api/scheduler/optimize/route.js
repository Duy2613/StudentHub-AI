import {
  CURRICULUM_SAMPLE_BUNDLES,
  generateValidSchedules,
} from "@/lib/scheduler/timetableEngine";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

/**
 * GET /api/scheduler/optimize
 * Lấy danh sách gói học phần mẫu theo ngành học
 */
export const GET = SecurityFabric.wrapHandler({
  action: "READ_SCHEDULE_BUNDLES",
  allowAnonymous: true,
  maxRequests: 90
}, async (_request, _routeParams, _principal, secContext) => Response.json({
  success: true,
  bundles: CURRICULUM_SAMPLE_BUNDLES,
  sourceState: "CURATED_CURRICULUM_FIXTURE",
  isAuthoritative: false,
  dataNotice: "Gói môn học là dữ liệu mẫu để minh họa; hãy xác nhận lịch chính thức với nhà trường.",
  meta: { requestId: secContext.correlationId }
}));

/**
 * POST /api/scheduler/optimize
 * Tính toán tổ hợp thời khóa biểu tối ưu không trùng lịch
 * Body: { courses: Array, mode: "MORNING_FOCUS" | "AFTERNOON_FOCUS" | "FREE_FRIDAY" | "BALANCED" }
 */
async function optimizeSchedule(request, _routeParams, _principal, secContext) {
  const body = await request.json().catch(() => null);
  const { courses = [], mode = "MORNING_FOCUS" } = body || {};
  const allowedModes = new Set(["MORNING_FOCUS", "AFTERNOON_FOCUS", "FREE_FRIDAY", "COMPACT_DAYS", "BALANCED"]);

  if (!Array.isArray(courses) || courses.length === 0 || courses.length > 16 || !allowedModes.has(mode)) {
    return Response.json({ success: false, error: {
      code: "SCHEDULE_INPUT_INVALID",
      userMessage: "Danh sách môn học hoặc chế độ xếp lịch không hợp lệ.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }

  let searchSpace = 1;
  for (const course of courses) {
    if (!course || typeof course !== "object" || !Array.isArray(course.sections) || course.sections.length === 0 || course.sections.length > 12) {
      return Response.json({ success: false, error: {
        code: "SCHEDULE_COURSE_INVALID",
        userMessage: "Một hoặc nhiều môn học không có danh sách lớp hợp lệ.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 400 });
    }
    searchSpace *= course.sections.length;
    if (searchSpace > 250_000) {
      return Response.json({ success: false, error: {
        code: "SCHEDULE_SEARCH_SPACE_TOO_LARGE",
        userMessage: "Không gian xếp lịch quá lớn; hãy chọn ít lớp học phần hơn.",
        requestId: secContext.correlationId,
        retryable: true
      } }, { status: 413 });
    }
    for (const section of course.sections) {
      if (!section || typeof section !== "object" || !Number.isInteger(section.dayOfWeek) || section.dayOfWeek < 2 || section.dayOfWeek > 7 ||
          !Number.isInteger(section.startPeriod) || !Number.isInteger(section.endPeriod) || section.startPeriod < 1 || section.endPeriod < section.startPeriod || section.endPeriod > 15) {
        return Response.json({ success: false, error: {
          code: "SCHEDULE_SECTION_INVALID",
          userMessage: "Thông tin thời gian của lớp học phần không hợp lệ.",
          requestId: secContext.correlationId,
          retryable: false
        } }, { status: 400 });
      }
    }
  }

  const optimalPlans = generateValidSchedules(courses, mode, 3);

  return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      mode,
      plansFoundCount: optimalPlans.length,
      plans: optimalPlans,
      hasValidPlan: optimalPlans.length > 0,
      adviceMessage:
        optimalPlans.length > 0
          ? `Đã tìm thấy ${optimalPlans.length} phương án xếp lịch không trùng giờ theo chế độ đã chọn.`
          : "Không tìm thấy phương án xếp lịch hợp lệ (Tất cả các lớp học phần đều bị xung đột giờ học). Vui lòng đổi lớp học phần khác.",
    });
}

export const POST = SecurityFabric.wrapHandler({
  action: "OPTIMIZE_SCHEDULE",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 128 * 1024,
}, optimizeSchedule);
