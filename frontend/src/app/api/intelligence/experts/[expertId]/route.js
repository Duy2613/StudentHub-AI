/**
 * StudentHub AI — API Route: GET /api/intelligence/experts/[expertId]
 * Detailed Expert Profile & Historical Reliability
 * Protected by Security Fabric & Sanitized via ExpertPublicDTO (P0 Fix)
 */

import { SecurityFabric } from "../../../../../lib/security/SecurityFabric.js";
import { ExpertStore } from "../../../../../lib/intelligence/expert/expertStore.js";
import { ExpertReliabilityTracker } from "../../../../../lib/intelligence/expert/ExpertReliabilityTracker.js";
import { ExpertPublicDTO } from "../../../../../lib/intelligence/expert/ExpertPublicDTO.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_EXPERT_DETAIL",
    requiredPermission: "EXPERT.READ",
    requiredScopes: ["expert:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { expertId } = await routeParams.params;
    const rawExpert = ExpertStore.getExpert(expertId, { redactPrivate: true });

    if (!rawExpert) {
      return Response.json(
        {
          error: {
            code: "EXPERT_NOT_FOUND",
            message: `Không tìm thấy chuyên gia với mã định danh: ${expertId}`,
            correlationId: secContext.correlationId
          }
        },
        { status: 404 }
      );
    }

    // P0 FIX: Strictly project through ExpertPublicDTO to strip any private PII (Phone, Email, CCCD)
    const publicExpert = ExpertPublicDTO.toPublicDTO(rawExpert);
    const reliability = ExpertReliabilityTracker.getExpertReliability(expertId);

    return Response.json({
      success: true,
      data: {
        expert: publicExpert,
        reliability
      },
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
