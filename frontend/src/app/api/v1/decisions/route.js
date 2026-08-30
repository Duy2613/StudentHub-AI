import { NextResponse } from "next/server";
import { evaluateDecisionScenario, DecisionTwinValidationError } from "@/lib/intelligence/decision/studentDecisionTwinEngine.js";
import { PostgresCrossSystemRepository } from "@/lib/intelligence/crossSystem/PostgresCrossSystemRepository.js";
import { DatabaseUnavailableError } from "@/lib/server/database/PostgresPool.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

function principalUserId(principal) {
  const value = String(principal?.subjectId || "").replace(/^(student|expert|user):/, "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return null;
  return value;
}

async function evaluateDecision(request, routeParams, principal) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || body.demo === true) {
      return NextResponse.json({ success: false, error: { code: "DEMO_DATA_REJECTED", message: "Demo scenarios cannot be persisted through the live Decision Twin API." } }, { status: 422 });
    }
    const ownerId = principalUserId(principal);
    if (!ownerId) {
      return NextResponse.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", message: "A durable Supabase user identity is required." } }, { status: 422 });
    }
    const userScenario = {
      ...body,
      demo: false,
      unknowns: [...(Array.isArray(body.unknowns) ? body.unknowns : []), "Các hệ quả do người dùng nhập chưa được liên kết với bằng chứng máy chủ."],
      options: Array.isArray(body.options) ? body.options.map((option) => ({
        ...option,
        factors: { ...(option.factors || {}), uncertainty: Math.max(4, Number(option.factors?.uncertainty || 0)) },
        consequences: Array.isArray(option.consequences) ? option.consequences.map((consequence) => ({
          ...consequence,
          basis: "USER_ASSUMPTION",
          certainty: "UNKNOWN",
          sourceRef: null,
        })) : [],
      })) : [],
    };
    const decision = evaluateDecisionScenario(userScenario);
    const saved = await new PostgresCrossSystemRepository().createDecision(ownerId, decision);
    return NextResponse.json({ success: true, decision: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof DecisionTwinValidationError) {
      return NextResponse.json({ success: false, error: { code: error.code || "DECISION_INPUT_INVALID", message: "Decision input failed validation." } }, { status: 422 });
    }
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ success: false, error: { code: "DATABASE_UNAVAILABLE", message: "Durable Decision Twin storage is not configured." } }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: { code: "DECISION_EVALUATION_FAILED", message: "Decision Twin evaluation could not be completed." } }, { status: 500 });
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "EVALUATE_STUDENT_DECISION",
  requiredPermission: "DECISION.EVALUATE",
  allowAnonymous: false,
  maxRequests: 30,
  maxBodyBytes: 128 * 1024,
}, evaluateDecision);
