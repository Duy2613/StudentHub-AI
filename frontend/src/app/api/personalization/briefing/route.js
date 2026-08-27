import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { AcademicBriefingEngine } from "@/lib/personalization/AcademicBriefingEngine.js";

export const dynamic = "force-dynamic";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_ACADEMIC_BRIEFING",
  allowAnonymous: true,
  handler: async ({ request, principal, correlationId }) => {
    const subjectId = principal?.subjectId || "student:24110001";
    const briefing = AcademicBriefingEngine.compileBriefing(subjectId);

    return Response.json({
      success: true,
      data: briefing,
      correlationId
    });
  }
});
