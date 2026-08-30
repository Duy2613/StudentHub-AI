import { NextResponse } from "next/server";
import { StudentProfile360Service } from "@/lib/intelligence/academic/studentProfile360Service";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";

export const dynamic = "force-dynamic";

export const POST = SecurityFabric.wrapHandler(
  {
    action: "REPORT_ACADEMIC_DISCREPANCY",
    requiredPermission: "ACADEMIC.DISCREPANCY_REPORT",
    requiredScopes: ["academic:plan"],
    allowAnonymous: false
  },
  async (request, routeParams, principal) => {
  try {
    const body = await request.json();
    const requestedStudentId = body?.studentId;
    const studentId = principal.subjectId.replace("student:", "").trim();

    if (requestedStudentId && requestedStudentId !== studentId) {
      ObjectAuthorizer.assertAccess(principal, { studentId: requestedStudentId });
    }

    const report = StudentProfile360Service.reportDiscrepancy(studentId, body);

    return NextResponse.json({
      success: true,
      data: report,
      message: "Yêu cầu kiểm tra dữ liệu học vụ đã được tiếp nhận và chuyển đến Phòng Đào tạo."
    });
  } catch (error) {
    throw error;
  }
  }
);
