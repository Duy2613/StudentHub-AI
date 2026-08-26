import { NextResponse } from "next/server";
import { StudentProfile360Service } from "@/lib/intelligence/academic/studentProfile360Service";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "24110001";

    const profile = StudentProfile360Service.getProfile360(studentId);

    return NextResponse.json({
      success: true,
      data: profile,
      meta: {
        timestamp: new Date().toISOString(),
        revision: profile.profileRevision
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve Student Profile 360"
      },
      { status: 400 }
    );
  }
}
