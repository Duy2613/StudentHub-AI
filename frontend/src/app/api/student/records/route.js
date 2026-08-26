import { NextResponse } from "next/server";
import { AcademicRecordsStore } from "@/lib/intelligence/academic/academicRecordsStore.js";
import { StudentAcademicSyncBridge } from "@/lib/intelligence/academic/studentAcademicSyncBridge.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "24110001";

    const records = AcademicRecordsStore.getRecordByStudentId(studentId);
    if (!records) {
      return NextResponse.json(
        { success: false, error: `Academic records not found for MSSV: ${studentId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: records
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
