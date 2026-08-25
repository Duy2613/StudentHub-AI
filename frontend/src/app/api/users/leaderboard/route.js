import { NextResponse } from "next/server";

// Sample verified leaderboard data conforming to UserProfile model (Phần F)
const LEADERBOARD_USERS = [
  {
    id: 1,
    supabaseUserId: "usr_exp_01",
    email: "nguyenminhduc@hcmute.edu.vn",
    fullName: "TS. Nguyễn Minh Đức",
    role: "Expert",
    trustScore: 99,
    universityEmailVerified: true,
    avatarId: "expert-tech",
    expertField: "An ninh Mạng & AI",
    onboardingCompleted: true,
    createdAt: "2026-01-15T08:00:00.000Z",
  },
  {
    id: 2,
    supabaseUserId: "usr_exp_02",
    email: "tranthuha@hlu.edu.vn",
    fullName: "Luật sư Trần Thu Hà",
    role: "Expert",
    trustScore: 98,
    universityEmailVerified: true,
    avatarId: "expert-legal",
    expertField: "Pháp lý & Quyền lợi SV",
    onboardingCompleted: true,
    createdAt: "2026-01-18T09:30:00.000Z",
  },
  {
    id: 3,
    supabaseUserId: "usr_exp_03",
    email: "lehoangnam@ftu.edu.vn",
    fullName: "ThS. Lê Hoàng Nam",
    role: "Expert",
    trustScore: 97,
    universityEmailVerified: true,
    avatarId: "expert-science",
    expertField: "Học bổng & Hướng nghiệp",
    onboardingCompleted: true,
    createdAt: "2026-02-01T14:00:00.000Z",
  },
  {
    id: 4,
    supabaseUserId: "usr_stu_01",
    email: "quan.nm21@hust.edu.vn",
    fullName: "Nguyễn Minh Quân",
    role: "Student",
    trustScore: 92,
    universityEmailVerified: true,
    avatarId: "student-tech",
    expertField: null,
    onboardingCompleted: true,
    createdAt: "2026-02-10T11:20:00.000Z",
  },
  {
    id: 5,
    supabaseUserId: "usr_stu_02",
    email: "ngoc.tb@hcmut.edu.vn",
    fullName: "Trần Bảo Ngọc",
    role: "Student",
    trustScore: 88,
    universityEmailVerified: true,
    avatarId: "student-creative",
    expertField: null,
    onboardingCompleted: true,
    createdAt: "2026-02-14T16:45:00.000Z",
  },
];

/**
 * GET /api/users/leaderboard
 * Trả về Top 5 người dùng có điểm uy tín cao nhất tuần/tháng
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    const sortedUsers = [...LEADERBOARD_USERS]
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, Math.min(limit, 20));

    return NextResponse.json(
      {
        success: true,
        count: sortedUsers.length,
        leaderboard: sortedUsers,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[Leaderboard API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải bảng xếp hạng uy tín." },
      { status: 500 }
    );
  }
}
