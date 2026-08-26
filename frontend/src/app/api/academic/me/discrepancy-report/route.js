import { NextResponse } from "next/server";
import { StudentProfile360Service } from "@/lib/intelligence/academic/studentProfile360Service";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const studentId = body?.studentId || "24110001";

    const report = StudentProfile360Service.reportDiscrepancy(studentId, body);

    return NextResponse.json({
      success: true,
      data: report,
      message: "Yêu cầu kiểm tra dữ liệu học vụ đã được tiếp nhận và chuyển đến Phòng Đào tạo."
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit discrepancy report"
      },
      { status: 400 }
    );
  }
}
