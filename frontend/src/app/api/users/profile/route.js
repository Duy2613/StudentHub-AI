import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { UserProfileService } from "@/lib/server/profile/UserProfileService.js";

export const dynamic = "force-dynamic";

function profileResponse(profile, principal) {
  return {
    ...profile,
    email: principal.email || null,
    emailVerified: principal.attributes?.emailVerified === true,
    institutionalEmailVerified: principal.attributes?.institutionalEmailVerified === true,
    verificationSource: principal.attributes?.verificationSource || "NONE",
    qaEntitlements: Array.isArray(principal.attributes?.qaEntitlements) ? principal.attributes.qaEntitlements : [],
    qaStudentFeatureAccess: principal.attributes?.qaStudentFeatureAccess === true,
    demoFeatureAccess: principal.attributes?.demoFeatureAccess === true,
    demoAccessSource: principal.attributes?.demoAccessSource || null,
  };
}

async function readProfile(_request, _routeParams, principal) {
  try {
    const profile = await UserProfileService.getUserProfileView({ principal });
    return Response.json({ success: true, profile: profileResponse(profile, principal) });
  } catch (error) {
    const statusCode = error?.statusCode || 503;
    const errorCode = error?.code === "PROFILE_ID_INVALID" ? "AUTHENTICATION_REQUIRED" : (error?.code || "PROFILE_STORAGE_UNAVAILABLE");
    return Response.json(
      {
        success: false,
        error: {
          code: errorCode,
          message: error?.message || "Hồ sơ cá nhân chưa khả dụng.",
          userMessage: error?.message || "Hồ sơ cá nhân chưa khả dụng. Dữ liệu chưa được thay thế bằng bản demo.",
        },
      },
      { status: statusCode }
    );
  }
}

async function updateProfile(request, _routeParams, principal) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body === "object" && !Array.isArray(body) && body.onboardingCompleted === true) {
      // Onboarding completion is handled in UserProfileService
    }
    const profile = await UserProfileService.updateUserProfile({
      principal,
      updates: body,
    });
    return Response.json({ success: true, profile: profileResponse(profile, principal) });
  } catch (error) {
    const statusCode = error?.statusCode || (error?.code === "FORBIDDEN_PROFILE_MUTATION" ? 403 : 400);
    const errorCode = error?.code === "PROFILE_ID_INVALID" ? "AUTHENTICATION_REQUIRED" : (error?.code || "PROFILE_STORAGE_UNAVAILABLE");
    return Response.json(
      {
        success: false,
        error: {
          code: errorCode,
          message: error?.message || "Không thể lưu hồ sơ lúc này.",
          userMessage: error?.message || "Không thể lưu hồ sơ lúc này. Các trường quyền hạn vẫn do máy chủ giữ nguyên.",
        },
      },
      { status: statusCode }
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
export const PATCH = SecurityFabric.wrapHandler({ ...ownProfilePolicy, action: "UPDATE_OWN_PROFILE" }, updateProfile);
