/**
 * StudentHub AI — Academic Roadmap API Route
 * GET /api/academic/me/roadmap
 * 
 * Returns the student's personal academic roadmap projection.
 * Reuses getAuthoritativeCommandCenterData() to avoid duplicate loading logic.
 */

import { NextResponse } from "next/server";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader";

export async function GET(request) {
  try {
    const data = getAuthoritativeCommandCenterData();
    
    if (!data.success || !data.roadmap) {
      return NextResponse.json(
        { error: "Unable to generate roadmap", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      roadmap: data.roadmap,
      freshness: data.roadmap.freshness,
      timestamp: data.timestamp
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Roadmap generation failed", detail: err.message, success: false },
      { status: 500 }
    );
  }
}
