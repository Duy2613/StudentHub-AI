import { NextResponse } from "next/server";
import { StudentIdentityStore } from "@/lib/intelligence/academic/studentIdentityStore.js";
import { StudentIdentityService } from "@/lib/intelligence/academic/studentIdentityService.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "24110001";

    const identity = StudentIdentityStore.getIdentityByStudentId(studentId);
    if (!identity) {
      return NextResponse.json(
        { success: false, error: `Student identity not found for MSSV: ${studentId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: identity
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
