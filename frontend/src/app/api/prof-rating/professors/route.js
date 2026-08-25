import { NextResponse } from "next/server";
import { PROFESSOR_REGISTRY } from "@/lib/prof/profReviewRegistry";

/**
 * GET /api/prof-rating/professors?department=&q=
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department") || "ALL";
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    let list = PROFESSOR_REGISTRY.filter((p) => {
      if (department !== "ALL" && !p.department.toLowerCase().includes(department.toLowerCase())) return false;
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchSubject = p.subject.toLowerCase().includes(q);
        const matchUni = p.university.toLowerCase().includes(q);
        const matchDept = p.department.toLowerCase().includes(q);
        if (!matchName && !matchSubject && !matchUni && !matchDept) return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      count: list.length,
      professors: list,
    });
  } catch (error) {
    console.error("[Professors GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải danh sách giảng viên." },
      { status: 500 }
    );
  }
}
