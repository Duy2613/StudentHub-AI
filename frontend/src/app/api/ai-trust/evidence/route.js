import { NextResponse } from "next/server";
import { Layer3EvidenceService } from "@/lib/ai-trust/layer3/Layer3EvidenceService";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

export const runtime = "nodejs";

/**
 * POST /api/ai-trust/evidence
 * 
 * Layer 3 Authoritative Evidence Retrieval & Source Verification Endpoint
 */
async function verifyEvidence(request) {
  try {
    const body = await request.json();
    const { claims, candidateSources, layer2Result } = body;

    if (claims !== undefined && (!Array.isArray(claims) || claims.length > 30) ||
        candidateSources !== undefined && (!Array.isArray(candidateSources) || candidateSources.length > 60)) {
      return NextResponse.json({ success: false, error: { code: "TRUST_EVIDENCE_INPUT_TOO_LARGE", userMessage: "Số lượng claim hoặc nguồn vượt giới hạn an toàn." } }, { status: 413 });
    }
    if (layer2Result !== undefined && (!layer2Result || typeof layer2Result !== "object" || Array.isArray(layer2Result))) {
      return NextResponse.json({ success: false, error: { code: "TRUST_EVIDENCE_INPUT_INVALID", userMessage: "Dữ liệu Layer 2 không hợp lệ." } }, { status: 400 });
    }

    const result = await Layer3EvidenceService.verify({
      claims: Array.isArray(claims) ? claims : [],
      candidateSources: Array.isArray(candidateSources) ? candidateSources : [],
      layer2Result,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "ANALYZE_TRUST_EVIDENCE",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 256 * 1024,
}, verifyEvidence);
