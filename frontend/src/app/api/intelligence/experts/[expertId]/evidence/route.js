/**
 * StudentHub AI — API Route: GET /api/intelligence/experts/[expertId]/evidence
 * 
 * Retrieves evidence graph, publications, and provenance clusters for an expert.
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

    const publications = expert.publications || [];
    const evidenceRefs = expert.evidenceRefs || [];
    const credentials = expert.credentials || [];

    return NextResponse.json({
      success: true,
      expertId,
      totalPublications: publications.length,
      totalEvidenceRefs: evidenceRefs.length,
      publications,
      evidenceRefs,
      credentials
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving evidence" },
      { status: 500 }
    );
  }
}
