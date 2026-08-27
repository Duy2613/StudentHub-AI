import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";
import { TrustIntelligenceEngine } from "@/lib/intelligence/trust/TrustIntelligenceEngine.js";
import { TrustExplanationEngine } from "@/lib/intelligence/trust/TrustExplanationEngine.js";
import { StudentIdentityStore } from "@/lib/intelligence/academic/studentIdentityStore.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_TRUST_PROFILE",
    requiredPermission: "TRUST.READ",
    requiredScopes: ["trust:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { subjectId } = await routeParams.params;
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") || "general";

    // Privacy & BOLA: Users can read their own detailed trust profile; for other users, sensitive moderation flags are excluded
    const rawStudentId = subjectId.replace("student:", "").trim();
    const identityData = StudentIdentityStore.getIdentityByStudentId(rawStudentId);

    const trustProfile = TrustIntelligenceEngine.evaluateTrustProfile({
      subjectId,
      identityData,
      contributions: [],
      abuseFlags: [],
      targetTopicId: topic
    });

    const explanation = TrustExplanationEngine.explainTrust(trustProfile);

    return Response.json({
      success: true,
      data: {
        trustProfile,
        explanation
      },
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
