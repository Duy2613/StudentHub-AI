/**
 * StudentHub AI — API Route: POST /api/intelligence/experts/verify-claim
 * 
 * Verifies an expert claim against the expert's Scope Graph, Temporal Roles,
 * and Conflict Graph, returning explicit Scope Boundaries ("Where NOT to trust").
 */

import { NextResponse } from "next/server";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";
import { ExpertScopeEngine } from "@/lib/intelligence/expert/expertScopeEngine";
import { ExpertContextEngine } from "@/lib/intelligence/expert/expertContextEngine";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function verifyExpertClaim(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { expertId, statement, text, domain, claimType, claimJurisdiction, isCommercialEndorsement } = body;

    const claimText = statement || text;
    if (!expertId || !claimText) {
      return NextResponse.json(
        { success: false, error: "expertId and claim text/statement are required." },
        { status: 400 }
      );
    }

    const expert = ExpertStore.getExpert(expertId, { redactPrivate: false });
    if (!expert) {
      return NextResponse.json(
        { success: false, error: "Expert not found" },
        { status: 404 }
      );
    }

    const evaluation = ExpertScopeEngine.evaluateClaimScope(expert, {
      expertId,
      text: claimText,
      statement: claimText,
      domain: domain || "AI_ML",
      claimType: claimType || "TECHNICAL_CLAIM",
      claimJurisdiction: claimJurisdiction || "TECHNICAL_DOMAIN",
      isCommercialEndorsement: Boolean(isCommercialEndorsement)
    });

    const whyThisExpert = ExpertContextEngine.generateWhyThisExpert(expert);
    const scopeBoundaries = ExpertScopeEngine.generateScopeBoundaries(expert);

    return NextResponse.json({
      success: true,
      expert: {
        expertId: expert.expertId,
        canonicalIdentity: expert.canonicalIdentity,
        name: expert.name,
        title: expert.title,
        institution: expert.institution,
        isVerified: expert.isVerified,
        hasRegistrarAuthority: expert.hasRegistrarAuthority
      },
      evaluation,
      whyThisExpert,
      scopeBoundaries
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler(
  {
    action: "VERIFY_EXPERT_CLAIM_SCOPE",
    allowAnonymous: true,
    maxRequests: 30
  },
  verifyExpertClaim
);
