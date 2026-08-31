/**
 * StudentHub AI — API Route: GET & POST /api/intelligence/experts/[expertId]/claims
 * 
 * Retrieves claims history and evaluates new claims against expert authority & scope.
 */

import { ExpertStore } from "@/lib/intelligence/expert/expertStore";
import { ExpertScopeEngine } from "@/lib/intelligence/expert/expertScopeEngine";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { SecurityError } from "@/lib/security/core/SecurityErrorEnvelope.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_EXPERT_CLAIMS",
  allowAnonymous: true,
  maxRequests: 90
}, async (_request, { params }, _principal, secContext) => {
  const { expertId } = await params;
  if (!expertId || typeof expertId !== "string" || expertId.length > 120) {
    return Response.json({ success: false, error: {
      code: "EXPERT_ID_INVALID",
      userMessage: "Mã chuyên gia không hợp lệ.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }

  if (!ExpertStore.getExpert(expertId, { redactPrivate: true })) {
    return Response.json({ success: false, error: {
      code: "EXPERT_NOT_FOUND",
      userMessage: "Không tìm thấy hồ sơ chuyên gia.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 404 });
  }

  const claims = ExpertStore.getClaimsByExpert(expertId).map(claim => ({
    claimId: claim.claimId,
    expertId: claim.expertId,
    statement: claim.statement,
    claimType: claim.claimType,
    domain: claim.domain,
    scope: claim.scope,
    jurisdiction: claim.jurisdiction,
    status: claim.status,
    version: claim.version,
    publishedAt: claim.publishedAt,
    evidenceRefs: Array.isArray(claim.evidenceRefs) ? claim.evidenceRefs.slice(0, 100) : [],
    citedPublicationDoi: claim.citedPublicationDoi || null,
    isRetracted: Boolean(claim.isRetracted),
    isCommercialEndorsement: Boolean(claim.isCommercialEndorsement)
  }));
  return Response.json({
    success: true,
    total: claims.length,
    claims,
    sourceState: "CURATED_EXPERT_REGISTRY",
    isAuthoritative: false,
    dataNotice: "Tuyên bố chuyên gia là diễn giải có phạm vi, không thay thế văn bản chính thức."
  });
});

async function evaluateExpertClaim(req, { params }, principal, secContext) {
  try {
    const { expertId } = await params;
    const ownsExpertIdentity = principal.subjectId === expertId || principal.subjectId === `expert:${expertId}`;
    if (!ownsExpertIdentity && !principal.hasRole("ADMIN")) {
      throw SecurityError.forbidden(
        "Experts can only submit assessments under their own verified identity.",
        secContext.correlationId,
        "OBJECT_NOT_OWNED"
      );
    }
    const body = await req.json().catch(() => ({}));

    if (!expertId || typeof body.text !== "string" || !body.text.trim() || body.text.length > 8000) {
      return Response.json({ success: false, error: {
        code: "EXPERT_CLAIM_INVALID",
        userMessage: "Nội dung tuyên bố chuyên gia không hợp lệ.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 400 });
    }

    const expert = ExpertStore.getExpert(expertId, { redactPrivate: false });
    if (!expert) {
      return Response.json({ success: false, error: {
        code: "EXPERT_NOT_FOUND",
        userMessage: "Không tìm thấy hồ sơ chuyên gia.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 404 });
    }

    const evaluation = ExpertScopeEngine.evaluateClaimScope(expert, {
      expertId,
      text: body.text.trim(),
      domain: typeof body.domain === "string" ? body.domain.slice(0, 60) : "AI_ML",
      claimType: typeof body.claimType === "string" ? body.claimType.slice(0, 60) : "TECHNICAL_CLAIM",
      claimJurisdiction: typeof body.claimJurisdiction === "string" ? body.claimJurisdiction.slice(0, 60) : "TECHNICAL_DOMAIN",
      isCommercialEndorsement: Boolean(body.isCommercialEndorsement)
    });

    return Response.json({
      success: true,
      expert: {
        expertId: expert.expertId,
        name: expert.name,
        title: expert.title,
        institution: expert.institution,
        isVerified: expert.isVerified,
        hasRegistrarAuthority: expert.hasRegistrarAuthority
      },
      evaluation
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler(
  {
    action: "SUBMIT_EXPERT_CLAIM_ASSESSMENT",
    requiredPermission: "EXPERT.EVALUATE",
    allowAnonymous: false,
    maxRequests: 30,
    maxBodyBytes: 64 * 1024
  },
  evaluateExpertClaim
);
