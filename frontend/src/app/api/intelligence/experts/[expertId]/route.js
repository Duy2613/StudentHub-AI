/**
 * StudentHub AI — API Route: GET /api/intelligence/experts/[expertId]
 * Detailed Expert Profile & Historical Reliability
 * Protected by Security Fabric & Sanitized via ExpertPublicDTO (P0 Fix)
 */

import { SecurityFabric } from "../../../../../lib/security/SecurityFabric.js";
import { ExpertStore, isExpertDemoMode } from "../../../../../lib/intelligence/expert/expertStore.js";
import { ExpertRepository } from "../../../../../lib/server/database/ExpertRepository.js";
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
    let rawExpert;
    try {
      rawExpert = isExpertDemoMode() ? ExpertStore.getExpert(expertId, { redactPrivate: true }) : await ExpertRepository.getPublicProfile(expertId);
    } catch {
      return Response.json({ success: false, error: { code: "EXPERT_STORAGE_UNAVAILABLE", userMessage: "Expert profile storage is temporarily unavailable.", correlationId: secContext.correlationId } }, { status: 503 });
    }

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
    let reliability;
    if (isExpertDemoMode()) {
      reliability = ExpertReliabilityTracker.getExpertReliability(expertId);
    } else {
      const domainCode = rawExpert.scopes?.[0]?.domain || rawExpert.domains?.[0] || null;
      try {
        reliability = domainCode
          ? await ExpertRepository.getQualityProfile({ userId: expertId, domainCode })
          : { label: "INSUFFICIENT_DATA", sampleSize: 0, score: null, policyVersion: "expert-quality-v1" };
      } catch {
        reliability = { label: "UNAVAILABLE", sampleSize: null, score: null, policyVersion: "expert-quality-v1" };
      }
    }

    return Response.json({
      success: true,
      data: {
        expert: publicExpert,
        reliability
      },
      meta: {
        correlationId: secContext.correlationId,
        sourceState: isExpertDemoMode() ? "DEMO_FIXTURE" : "DURABLE_POSTGRES"
      }
    });
  }
);
