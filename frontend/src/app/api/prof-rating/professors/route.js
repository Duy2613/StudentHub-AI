import { PROFESSOR_REGISTRY } from "@/lib/prof/profReviewRegistry";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

/**
 * GET /api/prof-rating/professors?department=&q=
 */
export const GET = SecurityFabric.wrapHandler({
  action: "READ_PROFESSOR_REGISTRY",
  allowAnonymous: true,
  maxRequests: 90
}, async (request) => {
  const { searchParams } = new URL(request.url);
  const department = (searchParams.get("department") || "ALL").slice(0, 100);
  const q = (searchParams.get("q") || "").toLowerCase().trim().slice(0, 120);

  const list = PROFESSOR_REGISTRY.filter((p) => {
    if (department !== "ALL" && !p.department.toLowerCase().includes(department.toLowerCase())) return false;
    if (q) {
      const matchName = p.name.toLowerCase().includes(q);
      const matchSubject = p.subject.toLowerCase().includes(q);
      const matchUni = p.university.toLowerCase().includes(q);
      const matchDept = p.department.toLowerCase().includes(q);
      if (!matchName && !matchSubject && !matchUni && !matchDept) return false;
    }
    return true;
  }).map((professor) => ({ ...professor, sourceState: "CURATED_REGISTRY", isAuthoritative: false }));

  return Response.json({
    success: true,
    count: list.length,
    professors: list,
    sourceState: "CURATED_REGISTRY",
    isAuthoritative: false,
    dataNotice: "Danh sách tham khảo; lịch học/đánh giá chính thức cần đối soát với cổng trường."
  }, { headers: { "Cache-Control": "no-store" } });
});
