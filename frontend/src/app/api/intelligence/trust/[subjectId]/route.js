import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

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
    const topic = (searchParams.get("topic") || "general").slice(0, 80);

    if (!subjectId || typeof subjectId !== "string" || subjectId.length > 120) {
      return Response.json({ success: false, error: {
        code: "TRUST_SUBJECT_INVALID",
        userMessage: "Mã chủ thể không hợp lệ.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 400 });
    }

    // Privacy & BOLA: only the subject itself (or a privileged administrator)
    // receives detailed identity/academic dimensions.  Anonymous callers get
    // a deliberately coarse aggregate with no moderation or identity flags.
    const rawStudentId = subjectId.replace(/^student:/i, "").trim();
    const cleanPrincipalId = String(principal?.subjectId || "").replace(/^student:/i, "").trim();
    const isPrivileged = principal?.hasRole?.("ADMIN") || principal?.hasRole?.("SYSTEM");
    const isOwner = Boolean(principal?.isAuthenticated && cleanPrincipalId && cleanPrincipalId === rawStudentId);
    const identityData = StudentIdentityStore.getIdentityByStudentId(rawStudentId);
    if (!identityData) {
      return Response.json({ success: false, error: {
        code: "TRUST_SUBJECT_NOT_FOUND",
        userMessage: "Không tìm thấy hồ sơ tin cậy.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 404 });
    }

    const trustProfile = TrustIntelligenceEngine.evaluateTrustProfile({
      subjectId,
      identityData: isOwner || isPrivileged ? identityData : null,
      contributions: [],
      abuseFlags: [],
      targetTopicId: topic
    });

    const explanation = TrustExplanationEngine.explainTrust(trustProfile);
    const publicProfile = (isOwner || isPrivileged)
      ? { ...trustProfile, visibility: "PRIVATE_DETAIL", sourceState: "DERIVED_PROFILE" }
      : {
          ...trustProfile,
          visibility: "PUBLIC_AGGREGATE",
          sourceState: "DERIVED_AGGREGATE",
          isAuthoritative: false,
          dimensions: {
            contributionTrust: trustProfile.dimensions.contributionTrust,
            communityTrust: trustProfile.dimensions.communityTrust,
            expertiseTrust: trustProfile.dimensions.expertiseTrust,
            consistencyTrust: trustProfile.dimensions.consistencyTrust,
            temporalTrust: trustProfile.dimensions.temporalTrust
          },
          evidenceSummary: {
            totalContributions: trustProfile.evidenceSummary.totalContributions,
            evidenceBackedCount: trustProfile.evidenceSummary.evidenceBackedCount,
            validatedCount: trustProfile.evidenceSummary.validatedCount,
            retractedCount: trustProfile.evidenceSummary.retractedCount
          }
        };

    return Response.json({
      success: true,
      data: {
        trustProfile: publicProfile,
        explanation
      },
      meta: {
        correlationId: secContext.correlationId,
        requestId: secContext.correlationId,
        visibility: publicProfile.visibility
      }
    });
  }
);
