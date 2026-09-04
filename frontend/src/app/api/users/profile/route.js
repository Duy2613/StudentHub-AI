import { SecurityFabric } from "../../../../lib/security/SecurityFabric.js";
import { SecurityError } from "../../../../lib/security/core/SecurityErrorEnvelope.js";
import { createSecureId } from "../../../../lib/security/secureId.js";
import { getPostgresPool } from "../../../../lib/server/database/PostgresPool.js";

// The memory map is retained only for the explicit non-durable test adapter.
// Live requests use public.profiles, keyed by the authenticated Supabase UUID.
const PROFILES_DB = new Map();

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

function getPrimaryRole(principal) {
  if (principal?.hasRole?.("ADMIN")) return "admin";
  if (principal?.hasRole?.("EXPERT")) return "expert";
  return "student";
}

function cleanText(value, { maxLength, field, allowEmpty = true } = {}) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new SecurityError({
      code: "VALIDATION_FAILED",
      message: `${field} must be a string.`,
      statusCode: 422,
    });
  }
  const clean = value.trim();
  if (field === "avatarUrl" && clean && !clean.startsWith("https://")) {
    throw new SecurityError({
      code: "VALIDATION_FAILED",
      message: "avatarUrl must be an HTTPS URL.",
      statusCode: 422,
    });
  }
  if (field === "avatarId" && clean && !/^[a-z0-9-]{1,80}$/.test(clean)) {
    throw new SecurityError({
      code: "VALIDATION_FAILED",
      message: "avatarId has an invalid format.",
      statusCode: 422,
    });
  }
  if (!allowEmpty && !clean) {
    throw new SecurityError({
      code: "VALIDATION_FAILED",
      message: `${field} is required.`,
      statusCode: 422,
    });
  }
  if (clean.length > maxLength) {
    throw new SecurityError({
      code: "VALIDATION_FAILED",
      message: `${field} exceeds the allowed length.`,
      statusCode: 422,
    });
  }
  return clean || null;
}

function normalizeDbProfile(row, principal) {
  if (!row) return null;
  const role = getPrimaryRole(principal);
  return {
    id: String(row.id),
    supabaseUserId: String(row.id),
    email: principal.email,
    fullName: row.display_name,
    role,
    // Mailbox verification is not institutional verification. The latter is
    // deliberately false until a separate evidence-backed workflow persists it.
    universityEmailVerified: false,
    emailVerified: principal.attributes?.emailVerified === true,
    avatarId: row.avatar_id || "student-tech",
    avatarUrl: row.avatar_url || null,
    university: row.institution_label || null,
    major: row.major || null,
    academicYear: row.academic_year || null,
    bio: row.bio || "",
    onboardingCompleted: row.onboarded === true,
    verifiedExpert: role === "expert",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isDurableProfileEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

async function readDurableProfile(principal) {
  const pool = getPostgresPool();
  const result = await pool.query(`
    select p.id, p.display_name, p.avatar_url, p.bio, p.avatar_id,
      p.institution_label, p.major, p.academic_year, p.onboarded,
      p.created_at, p.updated_at
    from public.profiles p
    where p.id=$1
  `, [principal.subjectId]);
  return normalizeDbProfile(result.rows[0], principal);
}

async function writeDurableProfile(principal, fields) {
  const pool = getPostgresPool();
  const result = await pool.query(`
    insert into public.profiles(
      id, display_name, avatar_url, bio, avatar_id, institution_label,
      major, academic_year, onboarded
    ) values($1,coalesce($2, 'StudentHub member'),$3,$4,coalesce($5, 'student-tech'),$6,$7,$8,coalesce($9, false))
    on conflict (id) do update set
      display_name=coalesce($2, public.profiles.display_name),
      avatar_url=coalesce(excluded.avatar_url, public.profiles.avatar_url),
      bio=coalesce(excluded.bio, public.profiles.bio),
      avatar_id=coalesce($5, public.profiles.avatar_id),
      institution_label=coalesce(excluded.institution_label, public.profiles.institution_label),
      major=coalesce(excluded.major, public.profiles.major),
      academic_year=coalesce(excluded.academic_year, public.profiles.academic_year),
      onboarded=coalesce(excluded.onboarded, public.profiles.onboarded),
      updated_at=now()
    returning id, display_name, avatar_url, bio, avatar_id, institution_label,
      major, academic_year, onboarded, created_at, updated_at
  `, [
    principal.subjectId,
    fields.fullName,
    fields.avatarUrl || null,
    fields.bio || null,
    fields.avatarId,
    fields.university || null,
    fields.major || null,
    fields.academicYear || null,
    fields.onboardingCompleted,
  ]);
  return normalizeDbProfile(result.rows[0], principal);
}

function createMemoryProfile(principal) {
  const profile = {
    id: createSecureId("usr"),
    supabaseUserId: principal.subjectId,
    email: principal.email,
    fullName: principal.email.split("@")[0] || "Sinh viên",
    role: getPrimaryRole(principal),
    trustScore: 50,
    reputationScore: 50,
    universityEmailVerified: false,
    emailVerified: principal.attributes?.emailVerified === true,
    avatarId: "student-tech",
    avatarUrl: null,
    university: null,
    major: null,
    academicYear: null,
    bio: "",
    onboardingCompleted: false,
    verifiedExpert: getPrimaryRole(principal) === "expert",
    createdAt: new Date().toISOString(),
  };
  PROFILES_DB.set(principal.subjectId, profile);
  return profile;
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_OWN_PROFILE",
    requiredPermission: "PROFILE.READ_OWN",
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

    if (isDurableProfileEnabled()) {
      const durableProfile = await readDurableProfile(principal);
      if (durableProfile) return Response.json({ success: true, profile: durableProfile });
      const created = await writeDurableProfile(principal, {
        fullName: email.split("@")[0] || "StudentHub member",
        onboardingCompleted: false,
      });
      return Response.json({ success: true, profile: created });
    }

    const found = PROFILES_DB.get(principal.subjectId);
    return Response.json({ success: true, profile: found || createMemoryProfile(principal) });
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
    requiredPermission: "PROFILE.WRITE_OWN",
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

    const {
      email: requestedEmail,
      fullName,
      avatarId,
      avatarUrl,
      university,
      major,
      academicYear,
      bio,
      onboardingCompleted,
    } = body || {};
    const email = getPrincipalEmail(principal, secContext.correlationId);

    if (requestedEmail && String(requestedEmail).toLowerCase().trim() !== email) {
      throw SecurityError.forbidden(
        "You can only update your own profile.",
        secContext.correlationId,
        "OBJECT_NOT_OWNED"
      );
    }

    if (onboardingCompleted !== undefined && typeof onboardingCompleted !== "boolean") {
      throw new SecurityError({
        code: "VALIDATION_FAILED",
        message: "onboardingCompleted must be a boolean.",
        statusCode: 422,
      });
    }

    const fields = {
      fullName: cleanText(fullName, { maxLength: 120, field: "fullName" }),
      avatarId: cleanText(avatarId, { maxLength: 80, field: "avatarId" }),
      avatarUrl: cleanText(avatarUrl, { maxLength: 2048, field: "avatarUrl" }),
      university: cleanText(university, { maxLength: 200, field: "university" }),
      major: cleanText(major, { maxLength: 160, field: "major" }),
      academicYear: cleanText(academicYear, { maxLength: 80, field: "academicYear" }),
      bio: cleanText(bio, { maxLength: 1000, field: "bio" }),
      onboardingCompleted: onboardingCompleted === undefined ? null : onboardingCompleted,
    };

    if (isDurableProfileEnabled()) {
      const saved = await writeDurableProfile(principal, fields);
      return Response.json({
        success: true,
        message: "Cập nhật hồ sơ thành công!",
        profile: saved,
      });
    }

    const existing = PROFILES_DB.get(principal.subjectId) || createMemoryProfile(principal);

    const updatedProfile = {
      ...existing,
      fullName: fields.fullName || existing.fullName,
      avatarId: fields.avatarId || existing.avatarId || "student-tech",
      avatarUrl: fields.avatarUrl || existing.avatarUrl || null,
      university: fields.university || existing.university || null,
      major: fields.major || existing.major || null,
      academicYear: fields.academicYear || existing.academicYear || null,
      bio: fields.bio || existing.bio || "",
      onboardingCompleted: fields.onboardingCompleted === null
        ? existing.onboardingCompleted
        : fields.onboardingCompleted,
      updatedAt: new Date().toISOString(),
    };

    PROFILES_DB.set(principal.subjectId, updatedProfile);

    return Response.json({
      success: true,
      message: "Cập nhật hồ sơ thành công!",
      profile: updatedProfile,
    });
  }
);
