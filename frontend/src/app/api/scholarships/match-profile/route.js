import { NextResponse } from "next/server";
import { matchStudentScholarships } from "@/lib/scholarship/scholarshipRegistry";

/**
 * POST /api/scholarships/match-profile
 * Khớp hồ sơ sinh viên với các chương trình học bổng doanh nghiệp
 * Body: { major: string, gpa: number, targetYear: string }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { major = "", gpa = 3.0, targetYear = "Năm 3" } = body || {};

    const matchedList = matchStudentScholarships({ major, gpa, targetYear });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      studentProfile: { major, gpa, targetYear },
      matchedCount: matchedList.length,
      matchedScholarships: matchedList,
      topRecommendation: matchedList[0] || null,
    });
  } catch (error) {
    console.error("[Scholarships Match Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi khớp hồ sơ học bổng." },
      { status: 500 }
    );
  }
}
