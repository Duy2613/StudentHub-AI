/**
 * StudentHub AI — Academic Roadmap API Route
 * GET /api/academic/me/roadmap
 * 
 * Returns the student's personal academic roadmap projection.
 * Reuses getAuthoritativeCommandCenterData() to avoid duplicate loading logic.
 */

import { NextResponse } from "next/server";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function getRoadmap(request, routeParams, principal) {
  try {
    const data = getAuthoritativeCommandCenterData({
      studentId: principal.subjectId.replace("student:", "").trim()
    });
    
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
    throw err;
  }
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_ACADEMIC_ROADMAP",
    requiredPermission: "ACADEMIC.READ_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: false
  },
  getRoadmap
);
