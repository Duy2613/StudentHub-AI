import { NextResponse } from "next/server";
import { matchStudentScholarships } from "@/lib/scholarship/scholarshipRegistry";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

/**
 * POST /api/scholarships/match-profile
 * Khớp hồ sơ sinh viên với các chương trình học bổng doanh nghiệp
 * Body: { major: string, gpa: number, targetYear: string }
 */
async function matchScholarshipProfile(request, _routeContext, _principal, secContext) {
  try {
    const body = await request.json().catch(() => ({}));
    const { major = "", gpa = 3.0, targetYear = "Năm 3" } = body || {};
    if (typeof major !== "string" || typeof targetYear !== "string" || major.length > 160 || targetYear.length > 80 ||
        !Number.isFinite(Number(gpa)) || Number(gpa) < 0 || Number(gpa) > 10) {
      return Response.json({ success: false, error: {
        code: "SCHOLARSHIP_PROFILE_INVALID",
        userMessage: "Hồ sơ học bổng không hợp lệ.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 400 });
    }

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
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "MATCH_SCHOLARSHIP_PROFILE",
  maxRequests: 30,
  maxBodyBytes: 32 * 1024,
}, matchScholarshipProfile);
