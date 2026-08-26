/**
 * StudentHub AI — Academic Command Center Aggregate API Route
 * 
 * Provides authenticated student academic intelligence payload:
 * - Digital twin state
 * - Actionable priority insights
 * - Recent semantic changes
 * - Academic timeline events
 * - Source sync status & provenance
 */

import { NextResponse } from "next/server";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cohort = searchParams.get("cohort");
    const programCode = searchParams.get("programCode");
    const studentId = searchParams.get("studentId");

    const payload = getAuthoritativeCommandCenterData({
      studentId,
      cohort,
      programCode
    });

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ACADEMIC_SERVICE_ERROR",
        message: err.message || "Không thể khởi tạo dữ liệu Academic Command Center."
      },
      { status: 500 }
    );
  }
}
