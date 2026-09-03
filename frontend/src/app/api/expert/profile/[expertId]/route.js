/**
 * StudentHub AI — API Route: GET /api/expert/profile/[expertId]
 * 
 * Retrieves expert profile, scope graph, credentials, and publication provenance.
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore.js";
import { ExpertPublicDTO } from "@/lib/intelligence/expert/ExpertPublicDTO.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_EXPERT_PROFILE",
  requiredPermission: "EXPERT.READ",
  requiredScopes: ["expert:read"],
  allowAnonymous: true,
  maxRequests: 120
}, async (_request, routeParams, _principal, secContext) => {
  const { expertId } = await routeParams.params;
  if (!expertId) {
    return Response.json({
      success: false,
      error: {
        code: "EXPERT_ID_REQUIRED",
        userMessage: "Thiếu mã chuyên gia.",
        requestId: secContext.correlationId,
        retryable: false
      }
    }, { status: 400 });
  }

  const rawExpert = ExpertStore.getExpert(expertId, { redactPrivate: true });
  if (!rawExpert) {
    return Response.json({
      success: false,
      error: {
        code: "EXPERT_NOT_FOUND",
        userMessage: "Không tìm thấy hồ sơ chuyên gia.",
        requestId: secContext.correlationId,
        retryable: false
      }
    }, { status: 404 });
  }

  // Never expose the store object directly: it contains verification metadata
  // and contact fields that are intentionally private even for public profiles.
  return Response.json({
    success: true,
    expert: ExpertPublicDTO.toPublicDTO(rawExpert),
    meta: { requestId: secContext.correlationId }
  });
});
