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
    const profile = ReputationGraph.getReputationProfile(subjectId);
    const history = ReputationGraph.getMutationHistory(subjectId);

    return Response.json({
      success: true,
      data: {
        subjectId,
        topicReputations: profile,
        mutationHistory: history
      },
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
