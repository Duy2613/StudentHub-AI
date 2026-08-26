/**
 * StudentHub AI — API Route: POST /api/intelligence/experts/resolve
 * 
 * Performs multi-signal entity resolution (ORCID, email, institution, DOI)
 * preventing dangerous same-name merging.
 */

import { NextResponse } from "next/server";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const resolution = ExpertStore.resolveEntity(body);

    return NextResponse.json({
      success: true,
      resolution
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error resolving expert entity" },
      { status: 500 }
    );
  }
}
