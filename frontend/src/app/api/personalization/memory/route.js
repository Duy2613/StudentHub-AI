import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { AiMemoryGuard } from "@/lib/intelligence/safety/AiMemoryGuard.js";

export const dynamic = "force-dynamic";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_AI_MEMORY",
  allowAnonymous: true,
  handler: async ({ request, principal, correlationId }) => {
    const subjectId = principal?.subjectId || "student:24110001";
    const memories = AiMemoryGuard.getApprovedMemories(subjectId);

    return Response.json({
      success: true,
      data: memories,
      correlationId
    });
  }
});

export const POST = SecurityFabric.wrapHandler({
  action: "PROPOSE_AI_MEMORY",
  allowAnonymous: true,
  handler: async ({ request, principal, correlationId }) => {
    const subjectId = principal?.subjectId || "student:24110001";
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

    const result = AiMemoryGuard.proposeMemory(subjectId, body);

    return Response.json({
      success: result.status === "CANDIDATE_RECORDED",
      data: result,
      correlationId
    });
  }
});
