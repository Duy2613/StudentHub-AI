const DEFAULT_PROFILE_NAME = "Thành viên StudentHub";
const DEFAULT_STUDENT_BIO = "Sinh viên tích cực tham gia xác thực và xây dựng cộng đồng an toàn.";
const DEFAULT_EXPERT_BIO = "Chuyên gia cố vấn phòng chống lừa đảo và bảo vệ sinh viên.";

function clean(value, fallback = null, maxLength = 180) {
  const normalized = String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
  return normalized || fallback;
}
/**
 * Builds the only client-writable payload used when first-run onboarding is
 * completed. Role, verification, reputation, and trust fields intentionally
 * stay out of this object; those values belong to the server authority.
 */
export function buildOnboardingProfilePayload({
  fullName,
  avatarId,
  university,
  major,
  academicYear,
  isExpert = false,
  bio,
} = {}) {
  return {
    fullName: clean(fullName, DEFAULT_PROFILE_NAME, 120),
    avatarId: clean(avatarId, "student-tech", 80),
    university: isExpert ? null : clean(university),
    major: isExpert ? null : clean(major),
    academicYear: isExpert ? null : clean(academicYear, null, 80),
    bio: clean(bio, isExpert ? DEFAULT_EXPERT_BIO : DEFAULT_STUDENT_BIO, 1000),
    onboardingCompleted: true,
  };
}
