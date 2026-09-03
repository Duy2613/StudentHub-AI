/**
 * StudentHub AI — API Route: POST /api/intelligence/experts/resolve
 * 
 * Performs multi-signal entity resolution (ORCID, email, institution, DOI)
 * preventing dangerous same-name merging.
 */

import { NextResponse } from "next/server";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function resolveExpertEntity(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const resolution = ExpertStore.resolveEntity(body);

    return NextResponse.json({
      success: true,
      resolution
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler(
  {
    action: "RESOLVE_EXPERT_ENTITY",
    requiredPermission: "EXPERT.MANAGE_GRAPH",
    allowAnonymous: false,
    maxRequests: 30
  },
  resolveExpertEntity
);
