/**
 * StudentHub AI — API Route: GET /api/intelligence/recommendations
 * Generates grounded AI recommendations with traceable evidence and uncertainty metrics
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { AiRecommendationEngine } from "@/lib/intelligence/recommendation/AiRecommendationEngine.js";
import { StudentProfile360Service } from "@/lib/intelligence/academic/studentProfile360Service.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_RECOMMENDATIONS",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:plan"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get("studentId");

    const studentId = principal.isAuthenticated
      ? principal.subjectId.replace("student:", "").trim()
      : (requestedStudentId || "24110001");

    const profile360 = StudentProfile360Service.getStudentProfile360(studentId);

    const recResult = AiRecommendationEngine.generateAcademicRecommendations({
      subjectId: `student:${studentId}`,
      studentProfile: profile360,
      fusedClaims: [],
      availableEvidence: []
    });

    return Response.json({
      success: true,
      data: recResult,
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
