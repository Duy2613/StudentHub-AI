import { NextResponse } from "next/server";
import { SCHOLARSHIP_REGISTRY } from "@/lib/scholarship/scholarshipRegistry";

/**
 * GET /api/scholarships/list?major=&type=&q=
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const major = (searchParams.get("major") || "").toLowerCase().trim();
    const sponsorType = searchParams.get("type") || "ALL";
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    let list = SCHOLARSHIP_REGISTRY.filter((sch) => {
      if (sponsorType !== "ALL" && sch.sponsorType !== sponsorType) return false;
      if (major) {
        const matchMajor = sch.targetMajors.some((m) => m.toLowerCase().includes(major));
        if (!matchMajor) return false;
      }
      if (q) {
        const matchName = sch.name.toLowerCase().includes(q);
        const matchSponsor = sch.sponsor.toLowerCase().includes(q);
        const matchBenefits = sch.benefits.toLowerCase().includes(q);
        if (!matchName && !matchSponsor && !matchBenefits) return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      count: list.length,
      scholarships: list,
    });
  } catch (error) {
    console.error("[Scholarships GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải danh sách học bổng." },
      { status: 500 }
    );
  }
}
