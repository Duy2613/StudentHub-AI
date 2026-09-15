import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { UserProfileRepository } from "@/lib/server/database/UserProfileRepository.js";

export const dynamic = "force-dynamic";

function identityFrom(principal) {
  return {
    userId: principal.subjectId,
    fallbackName: principal.attributes?.fullName || principal.email?.split("@")[0] || "Thành viên StudentHub",
  };
}

function profileResponse(profile, principal) {
  return {
    ...profile,
    email: principal.email || null,
    emailVerified: principal.attributes?.emailVerified === true,
  };
}

async function readProfile(_request, _routeParams, principal) {
  try {
    const profile = await UserProfileRepository.getOrCreate(identityFrom(principal));
    return Response.json({ success: true, profile: profileResponse(profile, principal) });
  } catch (error) {
    return Response.json(
      { success: false, error: { code: error?.code === "PROFILE_ID_INVALID" ? "AUTHENTICATION_REQUIRED" : "PROFILE_STORAGE_UNAVAILABLE", userMessage: "Hồ sơ cá nhân chưa khả dụng. Dữ liệu chưa được thay thế bằng bản demo." } },
      { status: error?.statusCode || 503 }
    );
  }
}

async function updateProfile(request, _routeParams, principal) {
  try {
    const body = await request.json().catch(() => ({}));
    let profile = await UserProfileRepository.update({
      ...identityFrom(principal),
      updates: body,
    });
    // Onboarding completion is an application-state transition, not a
    // presentation field. Only the dedicated boolean accepted by this
    // authenticated route can move it forward, and it is never downgraded.
    if (body && typeof body === "object" && !Array.isArray(body) && body.onboardingCompleted === true) {
      profile = await UserProfileRepository.markOnboarded(identityFrom(principal));
    }
    return Response.json({ success: true, profile: profileResponse(profile, principal) });
  } catch (error) {
    return Response.json(
      { success: false, error: { code: error?.code === "PROFILE_ID_INVALID" ? "AUTHENTICATION_REQUIRED" : "PROFILE_STORAGE_UNAVAILABLE", userMessage: "Không thể lưu hồ sơ lúc này. Các trường quyền hạn vẫn do máy chủ giữ nguyên." } },
      { status: error?.statusCode || 503 }
    );
  }
}

const ownProfilePolicy = {
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 32 * 1024,
};

export const GET = SecurityFabric.wrapHandler({ ...ownProfilePolicy, action: "READ_OWN_PROFILE", maxBodyBytes: 0 }, readProfile);
export const PUT = SecurityFabric.wrapHandler({ ...ownProfilePolicy, action: "UPDATE_OWN_PROFILE" }, updateProfile);
