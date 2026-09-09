/**
 * StudentHub AI — API Route: POST /api/expert/evaluate
 * 
 * Evaluates an expert claim against the expert's Scope Graph & Institutional Authority.
 */

import { NextResponse } from "next/server";
import { ExpertScopeEngine } from "@/lib/intelligence/expert/expertScopeEngine";
import { ExpertStore, isExpertDemoMode } from "@/lib/intelligence/expert/expertStore";
import { ExpertRepository } from "@/lib/server/database/ExpertRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

async function evaluateExpertScope(req, _routeParams, _principal, securityContext) {
  try {
    const body = await req.json().catch(() => ({}));
    const { expertId, claim } = body;

    if (typeof expertId !== "string" || expertId.length > 160 || !claim || typeof claim !== "object" || Array.isArray(claim)) {
      return NextResponse.json(
        { success: false, error: { code: "EXPERT_INPUT_INVALID", userMessage: "Mã chuyên gia và claim hợp lệ là bắt buộc." } },
        { status: 400 }
      );
    }

    const expert = isExpertDemoMode() ? ExpertStore.getExpert(expertId) : await ExpertRepository.getPublicProfile(expertId);
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
      evaluation,
      sourceState: isExpertDemoMode() ? "DEMO_FIXTURE" : "DURABLE_POSTGRES",
      correlationId: securityContext.correlationId,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "EXPERT_STORAGE_UNAVAILABLE", userMessage: "Expert scope storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "ANALYZE_EXPERT_SCOPE",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 128 * 1024,
}, evaluateExpertScope);
