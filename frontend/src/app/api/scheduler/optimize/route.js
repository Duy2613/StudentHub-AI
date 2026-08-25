import { NextResponse } from "next/server";
import {
  CURRICULUM_SAMPLE_BUNDLES,
  generateValidSchedules,
} from "@/lib/scheduler/timetableEngine";

/**
 * GET /api/scheduler/optimize
 * Lấy danh sách gói học phần mẫu theo ngành học
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      bundles: CURRICULUM_SAMPLE_BUNDLES,
    });
  } catch (error) {
    console.error("[Scheduler GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải gói môn học mẫu." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduler/optimize
 * Tính toán tổ hợp thời khóa biểu tối ưu không trùng lịch
 * Body: { courses: Array, mode: "MORNING_FOCUS" | "AFTERNOON_FOCUS" | "FREE_FRIDAY" | "BALANCED" }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { courses = [], mode = "MORNING_FOCUS" } = body || {};

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp danh sách môn học cần xếp lịch." },
        { status: 400 }
      );
    }

    const optimalPlans = generateValidSchedules(courses, mode, 3);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      mode,
      plansFoundCount: optimalPlans.length,
      plans: optimalPlans,
      hasValidPlan: optimalPlans.length > 0,
      adviceMessage:
        optimalPlans.length > 0
          ? `Đã tìm thấy ${optimalPlans.length} phương án xếp lịch tối ưu 100% không bị trùng giờ học!`
          : "Không tìm thấy phương án xếp lịch hợp lệ (Tất cả các lớp học phần đều bị xung đột giờ học). Vui lòng đổi lớp học phần khác.",
    });
  } catch (error) {
    console.error("[Scheduler POST Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tính toán thời khóa biểu." },
      { status: 500 }
    );
  }
}
