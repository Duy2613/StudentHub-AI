/**
 * StudentHub AI — API Route: GET /api/intelligence/contradictions/[claimId]
 * Contradiction analysis and conflict resolution status
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

import { ConflictResolutionEngine } from "@/lib/intelligence/fusion/ConflictResolutionEngine.js";
import { ClaimEntity } from "@/lib/intelligence/fabric/ClaimEntity.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_CONTRADICTION_ANALYSIS",
    requiredPermission: "TRUST.READ",
    requiredScopes: ["trust:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { claimId } = await routeParams.params;
    if (typeof claimId !== "string" || !/^[A-Za-z0-9:_-]{1,160}$/.test(claimId)) {
      return Response.json({ success: false, error: { code: "CLAIM_ID_INVALID", userMessage: "Mã claim không hợp lệ.", requestId: secContext.correlationId, retryable: false } }, { status: 400 });
    }

    const mockClaim = new ClaimEntity({
      claimId,
      statement: "Hạn chót nộp chứng chỉ tiếng Anh xét tốt nghiệp đợt 1 là 15/03/2026.",
      topicId: "academic.certification"
    });

    const resolution = ConflictResolutionEngine.resolveConflict({
      claim: mockClaim,
      supportingEvidence: [],
      contradictingEvidence: [],
      contradictions: []
    });

    return Response.json({
      success: true,
      data: {
        claimId,
        resolution,
        sourceState: "SYNTHETIC_CONTRADICTION_BENCHMARK",
        isAuthoritative: false,
        dataNotice: "Phân tích này là benchmark quyết định; cần nạp evidence thật trước khi dùng trong quyết định."
      },
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
