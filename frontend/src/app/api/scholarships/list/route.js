import { SCHOLARSHIP_REGISTRY } from "@/lib/scholarship/scholarshipRegistry";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

/**
 * GET /api/scholarships/list?major=&type=&q=
 */
export const GET = SecurityFabric.wrapHandler({
  action: "READ_SCHOLARSHIP_REGISTRY",
  allowAnonymous: true,
  maxRequests: 90
}, async (request) => {
  const { searchParams } = new URL(request.url);
  const major = (searchParams.get("major") || "").toLowerCase().trim().slice(0, 120);
  const sponsorType = (searchParams.get("type") || "ALL").slice(0, 60);
  const q = (searchParams.get("q") || "").toLowerCase().trim().slice(0, 120);

  const list = SCHOLARSHIP_REGISTRY.filter((sch) => {
    if (sponsorType !== "ALL" && sch.sponsorType !== sponsorType) return false;
    if (major && !sch.targetMajors.some((m) => m.toLowerCase().includes(major))) return false;
    if (q) {
      const matchName = sch.name.toLowerCase().includes(q);
      const matchSponsor = sch.sponsor.toLowerCase().includes(q);
      const matchBenefits = sch.benefits.toLowerCase().includes(q);
      if (!matchName && !matchSponsor && !matchBenefits) return false;
    }
    return true;
  });

  return Response.json({
    success: true,
    count: list.length,
    scholarships: list,
    sourceState: "CURATED_STATIC_REGISTRY",
    isAuthoritative: false,
    dataNotice: "Học bổng tham khảo; cần xác nhận hạn nộp và điều kiện trên website nhà tài trợ."
  }, { headers: { "Cache-Control": "no-store" } });
});
