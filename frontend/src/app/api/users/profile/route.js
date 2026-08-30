import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { SecurityError } from "@/lib/security/core/SecurityErrorEnvelope.js";

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
export const dynamic = "force-dynamic";

function getPrincipalEmail(principal, correlationId) {
  const email = String(principal?.email || "").toLowerCase().trim();
  if (!email) {
    throw SecurityError.forbidden(
      "Authenticated identity does not contain a verified email claim.",
      correlationId
    );
  }
  return email;
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_OWN_PROFILE",
    allowAnonymous: false
  },
  async (request, routeParams, principal, secContext) => {
    const { searchParams } = new URL(request.url);
    const requestedEmail = (searchParams.get("email") || "").toLowerCase().trim();
    const email = getPrincipalEmail(principal, secContext.correlationId);

    if (requestedEmail && requestedEmail !== email) {
      throw SecurityError.forbidden(
        "You can only access your own profile.",
        secContext.correlationId,
        "OBJECT_NOT_OWNED"
      );
    }

    const found = PROFILES_DB.get(email);
    if (found) {
      return Response.json({ success: true, profile: found });
    }

    // Identity verification is a server workflow; an email suffix alone proves nothing.
    const defaultProfile = {
      id: `usr_${Date.now()}`,
      supabaseUserId: principal.subjectId,
      email: email,
      fullName: email.split("@")[0] || "Sinh viên",
      role: "student",
      trustScore: 50,
      universityEmailVerified: false,
      avatarId: "student-tech",
      expertField: null,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };

    PROFILES_DB.set(email, defaultProfile);

    return Response.json({ success: true, profile: defaultProfile });
  }
);

/**
 * PUT /api/users/profile
 * Mutable body fields: { fullName, avatarId, university, major, onboardingCompleted }
 * Security-sensitive role/trust/verification fields are always server-authoritative.
 */
export const PUT = SecurityFabric.wrapHandler(
  {
    action: "UPDATE_OWN_PROFILE",
    allowAnonymous: false
  },
  async (request, routeParams, principal, secContext) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: { code: "VALIDATION_FAILED", message: "Request body must be valid JSON.", correlationId: secContext.correlationId } },
        { status: 400 }
      );
    }

    const { email: requestedEmail, fullName, avatarId, university, major, onboardingCompleted } = body || {};
    const email = getPrincipalEmail(principal, secContext.correlationId);

    if (requestedEmail && String(requestedEmail).toLowerCase().trim() !== email) {
      throw SecurityError.forbidden(
        "You can only update your own profile.",
        secContext.correlationId,
        "OBJECT_NOT_OWNED"
      );
    }

    const existing = PROFILES_DB.get(email) || {
      id: `usr_${Date.now()}`,
      supabaseUserId: principal.subjectId,
      email,
      role: "student",
      trustScore: 50,
      universityEmailVerified: false,
      createdAt: new Date().toISOString(),
    };

    const updatedProfile = {
      ...existing,
      fullName: typeof fullName === "string" ? fullName.trim().slice(0, 120) : existing.fullName,
      avatarId: avatarId || existing.avatarId || "student-tech",
      university: university || existing.university || "Chưa cập nhật",
      major: major || existing.major || "Khoa học & Kỹ thuật",
      onboardingCompleted: onboardingCompleted !== undefined ? Boolean(onboardingCompleted) : true,
      updatedAt: new Date().toISOString(),
    };

    PROFILES_DB.set(email, updatedProfile);

    return Response.json({
      success: true,
      message: "Cập nhật hồ sơ thành công!",
      profile: updatedProfile,
    });
  }
);
