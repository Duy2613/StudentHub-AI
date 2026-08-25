import { NextResponse } from "next/server";

// In-memory profile storage keyed by email/id (Phần F)
const PROFILES_DB = new Map();

// Initialize default seed profiles
PROFILES_DB.set("student.hust@sis.hust.edu.vn", {
  id: "usr_stu_01",
  supabaseUserId: "sup_01",
  email: "student.hust@sis.hust.edu.vn",
  fullName: "Nguyễn Minh Quân",
  role: "student",
  trustScore: 92,
  universityEmailVerified: true,
  avatarId: "student-tech",
  university: "Đại học Bách Khoa Hà Nội (HUST)",
  major: "Kỹ thuật Phần mềm",
  onboardingCompleted: true,
  createdAt: "2026-01-10T08:00:00.000Z",
});

PROFILES_DB.set("expert.ai@studenthub.ai", {
  id: "usr_exp_01",
  supabaseUserId: "sup_exp_01",
  email: "expert.ai@studenthub.ai",
  fullName: "TS. Nguyễn Minh Đức",
  role: "expert",
  trustScore: 99,
  universityEmailVerified: true,
  avatarId: "expert-ai",
  expertField: "Trí tuệ nhân tạo (AI & Machine Learning)",
  university: "Đại học Quốc gia Hà Nội (VNU)",
  onboardingCompleted: true,
  createdAt: "2026-01-05T08:00:00.000Z",
});

/**
 * GET /api/users/profile?email=...
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp email của tài khoản." },
        { status: 400 }
      );
    }

    const found = PROFILES_DB.get(email);
    if (found) {
      return NextResponse.json({ success: true, profile: found });
    }

    // Default Profile structure for new users
    const isEdu = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$|\.edu\.vn$|\.ac\.vn$)/i.test(email);
    const defaultProfile = {
      id: `usr_${Date.now()}`,
      supabaseUserId: `sup_${Date.now()}`,
      email: email,
      fullName: email.split("@")[0] || "Sinh viên",
      role: "student",
      trustScore: isEdu ? 80 : 50,
      universityEmailVerified: isEdu,
      avatarId: "student-tech",
      expertField: null,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };

    PROFILES_DB.set(email, defaultProfile);

    return NextResponse.json({ success: true, profile: defaultProfile });
  } catch (error) {
    console.error("[Profile GET API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải hồ sơ." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/profile
 * Body: { email, fullName, role, avatarId, expertField, university, major, onboardingCompleted }
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { email, fullName, role, avatarId, expertField, university, major, onboardingCompleted } = body || {};

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp email tài khoản cần cập nhật." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = PROFILES_DB.get(cleanEmail) || {
      id: `usr_${Date.now()}`,
      supabaseUserId: `sup_${Date.now()}`,
      email: cleanEmail,
      trustScore: 50,
      universityEmailVerified: false,
      createdAt: new Date().toISOString(),
    };

    // Calculate score updates if .edu verified
    const isEdu = existing.universityEmailVerified || /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$|\.edu\.vn$|\.ac\.vn$)/i.test(cleanEmail);
    const calculatedScore = Math.max(existing.trustScore || 50, isEdu ? 80 : 50);

    const updatedProfile = {
      ...existing,
      fullName: fullName !== undefined ? fullName.trim() : existing.fullName,
      role: role === "expert" ? "expert" : "student",
      avatarId: avatarId || existing.avatarId || "student-tech",
      expertField: role === "expert" ? (expertField || "An ninh mạng & Phòng chống lừa đảo") : null,
      university: university || existing.university || (isEdu ? "Đại học Thành viên" : "Chưa cập nhật"),
      major: major || existing.major || "Khoa học & Kỹ thuật",
      trustScore: calculatedScore,
      universityEmailVerified: isEdu,
      onboardingCompleted: onboardingCompleted !== undefined ? Boolean(onboardingCompleted) : true,
      updatedAt: new Date().toISOString(),
    };

    PROFILES_DB.set(cleanEmail, updatedProfile);

    return NextResponse.json({
      success: true,
      message: "Cập nhật hồ sơ thành công!",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("[Profile PUT API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi cập nhật hồ sơ." },
      { status: 500 }
    );
  }
}
