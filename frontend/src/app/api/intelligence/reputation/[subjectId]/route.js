import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ReputationGraph } from "@/lib/intelligence/fabric/ReputationGraph.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_REPUTATION_PROFILE",
    requiredPermission: "TRUST.READ",
    requiredScopes: ["trust:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { subjectId } = await routeParams.params;
    if (typeof subjectId !== "string" || !/^[A-Za-z0-9:_-]{1,160}$/.test(subjectId)) {
      return Response.json({ success: false, error: { code: "SUBJECT_ID_INVALID", userMessage: "Mã chủ thể không hợp lệ.", requestId: secContext.correlationId, retryable: false } }, { status: 400 });
    }
    const profile = ReputationGraph.getReputationProfile(subjectId);
    const history = ReputationGraph.getMutationHistory(subjectId);
    const publicHistory = history.map(({ mutationId, topicId, action, effectiveDelta, resultingScore, timestamp }) => ({
      mutationId, topicId, action, effectiveDelta, resultingScore, timestamp
    }));

    return Response.json({
      success: true,
      data: {
        subjectId,
        topicReputations: profile,
        mutationHistory: publicHistory,
        sourceState: "DERIVED_RUNTIME_REPUTATION",
        isAuthoritative: false,
        dataNotice: "Lịch sử công khai đã loại bỏ định danh originator và không thay thế hồ sơ xác thực chính thức."
      },
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
