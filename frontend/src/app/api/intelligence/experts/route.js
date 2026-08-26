/**
 * StudentHub AI — API Route: GET /api/intelligence/experts
 * 
 * Lists verified experts with optional domain filtering and privacy redaction.
 */

import { NextResponse } from "next/server";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");

    const experts = ExpertStore.getAllExperts({
      redactPrivate: true,
      domainFilter: domain || null
    });

    return NextResponse.json({
      success: true,
      total: experts.length,
      experts
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error listing experts" },
      { status: 500 }
    );
  }
}
