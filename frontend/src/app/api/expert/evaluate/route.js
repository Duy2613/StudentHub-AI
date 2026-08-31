/**
 * StudentHub AI — API Route: POST /api/expert/evaluate
 * 
 * Evaluates an expert claim against the expert's Scope Graph & Institutional Authority.
 */

import { NextResponse } from "next/server";
import { ExpertScopeEngine } from "@/lib/intelligence/expert/expertScopeEngine";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

async function evaluateExpertScope(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { expertId, claim } = body;

    if (typeof expertId !== "string" || expertId.length > 160 || !claim || typeof claim !== "object" || Array.isArray(claim)) {
      return NextResponse.json(
        { success: false, error: { code: "EXPERT_INPUT_INVALID", userMessage: "Mã chuyên gia và claim hợp lệ là bắt buộc." } },
        { status: 400 }
      );
    }

    const expert = ExpertStore.getExpert(expertId);
    if (!expert) {
      return NextResponse.json(
        { success: false, error: { code: "EXPERT_NOT_FOUND", userMessage: "Không tìm thấy hồ sơ chuyên gia." } },
        { status: 404 }
      );
    }

    const evaluation = ExpertScopeEngine.evaluateClaimScope(expert, claim);

    return NextResponse.json({
      success: true,
      expert: {
        expertId: expert.expertId,
        name: expert.name,
        title: expert.title,
        institution: expert.institution,
        department: expert.department,
        hasRegistrarAuthority: expert.hasRegistrarAuthority
      },
      evaluation
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "ANALYZE_EXPERT_SCOPE",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 128 * 1024,
}, evaluateExpertScope);
