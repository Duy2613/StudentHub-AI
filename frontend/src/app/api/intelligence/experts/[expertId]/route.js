/**
 * StudentHub AI — API Route: GET /api/intelligence/experts/[expertId]
 * 
 * Retrieves expert profile, scope graph, credentials, roles, and publications.
 */

import { NextResponse } from "next/server";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";

export async function GET(req, { params }) {
  try {
    const { expertId } = await params;
    if (!expertId) {
      return NextResponse.json(
        { success: false, error: "Missing expertId parameter" },
        { status: 400 }
      );
    }

    const expert = ExpertStore.getExpert(expertId, { redactPrivate: true });
    if (!expert) {
      return NextResponse.json(
        { success: false, error: "Expert not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      expert
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving expert" },
      { status: 500 }
    );
  }
}
