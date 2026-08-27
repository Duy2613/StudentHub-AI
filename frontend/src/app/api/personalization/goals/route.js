import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { UserGoalEngine } from "@/lib/personalization/UserGoalEngine.js";

export const dynamic = "force-dynamic";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_USER_GOALS",
  allowAnonymous: true,
  handler: async ({ request, principal, correlationId }) => {
    const subjectId = principal?.subjectId || "student:24110001";
    const goals = UserGoalEngine.getGoals(subjectId);

    return Response.json({
      success: true,
      data: goals,
      correlationId
    });
  }
});

export const POST = SecurityFabric.wrapHandler({
  action: "CREATE_USER_GOAL",
  allowAnonymous: true,
  handler: async ({ request, principal, correlationId }) => {
    const subjectId = principal?.subjectId || "student:24110001";
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

    const created = UserGoalEngine.createGoal(subjectId, body);

    return Response.json({
      success: true,
      data: created,
      correlationId
    });
  }
});
