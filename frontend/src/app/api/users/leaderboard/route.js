import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

// Deterministic UI fixture.  It deliberately contains no email, Supabase ID or
// other account identifier; a future durable leaderboard must be backed by a
// privacy-reviewed aggregate query before it can be marked authoritative.
const LEADERBOARD_USERS = [
  {
    id: 1,
    displayName: "TS. Nguyễn Minh Đức",
    role: "Expert",
    trustScore: 99,
    avatarId: "expert-tech",
    expertField: "An ninh Mạng & AI",
  },
  {
    id: 2,
    displayName: "Luật sư Trần Thu Hà",
    role: "Expert",
    trustScore: 98,
    avatarId: "expert-legal",
    expertField: "Pháp lý & Quyền lợi SV",
  },
  {
    id: 3,
    displayName: "ThS. Lê Hoàng Nam",
    role: "Expert",
    trustScore: 97,
    avatarId: "expert-science",
    expertField: "Học bổng & Hướng nghiệp",
  },
  {
    id: 4,
    displayName: "Nguyễn Minh Quân",
    role: "Student",
    trustScore: 92,
    avatarId: "student-tech",
    expertField: null,
  },
  {
    id: 5,
    displayName: "Trần Bảo Ngọc",
    role: "Student",
    trustScore: 88,
    avatarId: "student-creative",
    expertField: null,
  },
];

/**
 * GET /api/users/leaderboard
 * Trả về Top 5 người dùng có điểm uy tín cao nhất tuần/tháng
 */
export const GET = SecurityFabric.wrapHandler({
  action: "READ_LEADERBOARD",
  allowAnonymous: true,
  maxRequests: 60
}, async (request, _routeParams, _principal, secContext) => {
  const { searchParams } = new URL(request.url);
  const parsedLimit = Number.parseInt(searchParams.get("limit") || "5", 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 20) : 5;
  const sortedUsers = [...LEADERBOARD_USERS].sort((a, b) => b.trustScore - a.trustScore).slice(0, limit);

  return Response.json({
    success: true,
    count: sortedUsers.length,
    leaderboard: sortedUsers,
    sourceState: "SYNTHETIC_FIXTURE",
    isAuthoritative: false,
    dataNotice: "Bảng xếp hạng minh họa; điểm uy tín chưa được tính từ dữ liệu production."
  }, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "x-request-id": secContext.correlationId
    }
  });
});
