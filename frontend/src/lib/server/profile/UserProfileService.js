/**
 * StudentHub AI — UserProfileService
 *
 * Canonical service for reading and updating Normal User Profiles.
 * Performs parallel reads for base identity, Trust cases, Community activity,
 * and Expert review requests. Enforces strict server-owned allowlist on writes.
 */

import { getPostgresPool } from "../database/PostgresPool.js";
import { UserProfileRepository, normalizeUserId } from "../database/UserProfileRepository.js";

const USER_ALLOWED_UPDATE_FIELDS = new Set([
  "fullName",
  "displayName",
  "avatarUrl",
  "avatarId",
  "bio",
  "university",
  "major",
  "academicYear",
  "onboardingCompleted",
]);

const USER_FORBIDDEN_MUTATION_FIELDS = new Set([
  "email",
  "role",
  "roles",
  "trustScore",
  "starLevel",
  "reputation",
  "studentVerification",
  "institutionalEmailVerified",
  "universityEmailVerified",
  "expert",
  "expertState",
  "qualification",
  "verifiedDomains",
  "active",
  "authority",
  "qaAccess",
  "qaEntitlements",
  "demoAccess",
  "demoEntitlements",
  "createdAt",
  "updatedAt",
]);

export class ProfileServiceError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "ProfileServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function unavailableActivity(kind) {
  const unavailable = { dataStatus: "UNAVAILABLE", errorCode: "PROFILE_ACTIVITY_UNAVAILABLE" };
  if (kind === "trust") return { ...unavailable, count: null, recentCases: [], pendingExpertRequests: null };
  if (kind === "community") return { ...unavailable, posts: null, comments: null, recentActivity: [], sources: {} };
  return { ...unavailable, total: null, pending: null, inReview: null, completed: null, recentRequests: [] };
}

function recordActivityFailure(source, error) {
  const code = /^[A-Z0-9_]{1,80}$/.test(String(error?.code || "")) ? error.code : "STORAGE_UNAVAILABLE";
  console.error("[OwnerProfileActivity] read unavailable", { source, code });
}

export class UserProfileService {
  /**
   * Retrieves the comprehensive, normalized UserProfileDTO for an authenticated student.
   * Runs independent reads in parallel.
   */
  static async getUserProfileView({ principal }) {
    if (!principal?.isAuthenticated) {
      throw new ProfileServiceError("AUTHENTICATION_REQUIRED", "A valid authenticated session is required.", 401);
    }
    const userId = normalizeUserId(principal.subjectId);
    const fallbackName = principal.attributes?.fullName || principal.email?.split("@")[0] || "Thành viên StudentHub";

    // 1. Base Profile from repository
    const baseProfilePromise = UserProfileRepository.getOrCreate({ userId, fallbackName });

    // 2. Trust Activity read
    const trustActivityPromise = this.readTrustActivity(userId);

    // 3. Community Activity read
    const communityActivityPromise = this.readCommunityActivity(userId);

    // 4. Expert Review Requests read
    const expertRequestsPromise = this.readExpertRequests(userId);

    const [baseProfileResult, trustActivityResult, communityActivityResult, expertRequestsResult] =
      await Promise.allSettled([
        baseProfilePromise,
        trustActivityPromise,
        communityActivityPromise,
        expertRequestsPromise,
      ]);

    if (baseProfileResult.status === "rejected") {
      throw new ProfileServiceError(
        "PROFILE_STORAGE_UNAVAILABLE",
        "Owner profile storage is unavailable. No fallback profile was used.",
        503
      );
    }
    const baseProfile = baseProfileResult.value;

    const trustActivity = trustActivityResult.status === "fulfilled" ? trustActivityResult.value : unavailableActivity("trust");

    const communityActivity = communityActivityResult.status === "fulfilled" ? communityActivityResult.value : unavailableActivity("community");

    const expertRequests = expertRequestsResult.status === "fulfilled" ? expertRequestsResult.value : unavailableActivity("expert");

    const email = principal.email || null;
    const emailVerified = principal.attributes?.emailVerified === true;
    const institutionalEmailVerified = principal.attributes?.institutionalEmailVerified === true;
    const studentVerification = institutionalEmailVerified
      ? "VERIFIED"
      : emailVerified
        ? "EMAIL_VERIFIED"
        : "UNVERIFIED";

    return {
      identity: {
        id: userId,
        fullName: baseProfile.fullName || fallbackName,
        displayName: baseProfile.fullName || fallbackName,
        avatarUrl: baseProfile.avatarUrl,
        avatarId: baseProfile.avatarId,
        email,
      },
      education: {
        university: baseProfile.university || null,
        major: baseProfile.major || null,
        academicYear: baseProfile.academicYear || null,
        studentVerification,
        institutionalEmailVerified,
      },
      bio: baseProfile.bio || null,
      trustActivity,
      communityActivity,
      expertRequests,
      account: {
        id: userId,
        email,
        createdAt: baseProfile.createdAt,
        updatedAt: baseProfile.updatedAt,
        roles: principal.roles || ["STUDENT"],
      },
      // Backward-compatibility projection for existing UI and contracts:
      id: userId,
      fullName: baseProfile.fullName || fallbackName,
      displayName: baseProfile.fullName || fallbackName,
      avatarUrl: baseProfile.avatarUrl,
      avatarId: baseProfile.avatarId,
      email,
      bio: baseProfile.bio || null,
      university: baseProfile.university || null,
      major: baseProfile.major || null,
      academicYear: baseProfile.academicYear || null,
      studentVerification,
      institutionalEmailVerified,
      trustScore: null,
      starLevel: null,
      createdAt: baseProfile.createdAt,
      updatedAt: baseProfile.updatedAt,
      onboarded: baseProfile.onboarded === true,
      emailVerified,
      verificationSource: principal.attributes?.verificationSource || "NONE",
      qaEntitlements: Array.isArray(principal.attributes?.qaEntitlements) ? principal.attributes.qaEntitlements : [],
      qaStudentFeatureAccess: principal.attributes?.qaStudentFeatureAccess === true,
      demoFeatureAccess: principal.attributes?.demoFeatureAccess === true,
      demoAccessSource: principal.attributes?.demoAccessSource || null,
    };
  }

  /**
   * Updates safe presentation fields for the user profile.
   * Enforces strict allowlist and rejects forbidden/server-owned attributes with HTTP 400.
   */
  static async updateUserProfile({ principal, updates }) {
    if (!principal?.isAuthenticated) {
      throw new ProfileServiceError("AUTHENTICATION_REQUIRED", "A valid authenticated session is required.", 401);
    }
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      throw new ProfileServiceError("INVALID_PAYLOAD", "Update payload must be a JSON object.", 400);
    }

    const userId = normalizeUserId(principal.subjectId);
    const fallbackName = principal.attributes?.fullName || principal.email?.split("@")[0] || "Thành viên StudentHub";

    // Detect forbidden/privileged field tampering
    for (const key of Object.keys(updates)) {
      if (USER_FORBIDDEN_MUTATION_FIELDS.has(key)) {
        throw new ProfileServiceError(
          "FORBIDDEN_PROFILE_MUTATION",
          `Field '${key}' is server-owned and cannot be modified by clients.`,
          400
        );
      }
      if (!USER_ALLOWED_UPDATE_FIELDS.has(key)) {
        throw new ProfileServiceError(
          "UNKNOWN_PROFILE_FIELD",
          `Field '${key}' is not an editable profile presentation field.`,
          400
        );
      }
    }

    // Persist safe presentation updates
    await UserProfileRepository.update({
      userId,
      fallbackName,
      updates,
    });

    if (updates.onboardingCompleted === true) {
      await UserProfileRepository.markOnboarded({ userId, fallbackName });
    }

    return this.getUserProfileView({ principal });
  }

  static async readTrustActivity(userId) {
    try {
      const pool = getPostgresPool();
      const countRes = await pool.query(
        `SELECT count(*)::int AS count FROM public.trust_cases WHERE owner_id = $1`,
        [userId]
      );
      const recentRes = await pool.query(
        `SELECT tc.id, tc.state, tc.visibility, tc.created_at, tc.updated_at,
                (SELECT max(revision) FROM public.trust_case_revisions
                  WHERE case_id = tc.id AND owner_id = $1) AS case_revision
           FROM public.trust_cases tc
          WHERE tc.owner_id = $1
          ORDER BY tc.created_at DESC, tc.id DESC
          LIMIT 5`,
        [userId]
      );
      const pendingRequestsResult = await Promise.allSettled([pool.query(
        `SELECT count(*)::int AS pending_count
           FROM private.expert_review_requests
          WHERE requester_id = $1 AND status IN ('REQUESTED', 'MATCHING', 'ASSIGNED', 'IN_REVIEW')`,
        [userId]
      )]);
      const pendingRequests = pendingRequestsResult[0];
      if (pendingRequests.status === "rejected") recordActivityFailure("trust-expert-requests", pendingRequests.reason);

      return {
        dataStatus: pendingRequests.status === "fulfilled" ? "AVAILABLE" : "PARTIAL",
        count: Number(countRes.rows[0]?.count || 0),
        recentCases: recentRes.rows.map((row) => ({
          id: row.id,
          state: row.state,
          visibility: row.visibility,
          caseRevision: row.case_revision == null ? null : Number(row.case_revision),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        pendingExpertRequests: pendingRequests.status === "fulfilled" ? Number(pendingRequests.value.rows[0]?.pending_count || 0) : null,
      };
    } catch (error) {
      recordActivityFailure("trust", error);
      return unavailableActivity("trust");
    }
  }

  static async readCommunityActivity(userId) {
    try {
      const pool = getPostgresPool();
      const results = await Promise.allSettled([
        pool.query(
          `SELECT (SELECT count(*)::int FROM public.posts WHERE author_id = $1) AS posts,
                  (SELECT count(*)::int FROM public.comments WHERE author_id = $1) AS comments,
                  coalesce((SELECT jsonb_agg(recent ORDER BY recent.created_at DESC, recent.id DESC)
                    FROM (SELECT id, title, category, status, created_at FROM public.posts
                          WHERE author_id = $1 ORDER BY created_at DESC, id DESC LIMIT 5) recent), '[]'::jsonb) AS recent_activity`,
          [userId]
        ),
        pool.query(
          `SELECT (SELECT count(*)::int FROM public.community_contributions WHERE author_id = $1) AS posts,
                  (SELECT count(*)::int FROM public.community_comments WHERE author_id = $1) AS comments,
                  coalesce((SELECT jsonb_agg(recent ORDER BY recent.created_at DESC, recent.id DESC)
                    FROM (SELECT id, left(public_statement, 160) AS title, contribution_type AS category,
                                 publication_state AS status, created_at, case_id, case_revision
                            FROM public.community_contributions WHERE author_id = $1
                            ORDER BY created_at DESC, id DESC LIMIT 5) recent), '[]'::jsonb) AS recent_activity`,
          [userId]
        ),
      ]);
      const sourceNames = ["discussions", "contributions"];
      const sources = {};
      const recentActivity = [];
      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        const name = sourceNames[index];
        if (result.status === "rejected") {
          recordActivityFailure(`community-${name}`, result.reason);
          sources[name] = { dataStatus: "UNAVAILABLE", posts: null, comments: null };
          continue;
        }
        const row = result.value.rows[0];
        sources[name] = { dataStatus: "AVAILABLE", posts: Number(row.posts), comments: Number(row.comments) };
        for (const activity of row.recent_activity || []) {
          recentActivity.push({
            type: name === "discussions" ? "POST" : "TRUST_CONTRIBUTION",
            source: name,
            id: activity.id,
            title: activity.title,
            category: activity.category,
            status: activity.status,
            createdAt: activity.created_at,
            ...(name === "contributions" ? { caseId: activity.case_id, caseRevision: Number(activity.case_revision) } : {}),
          });
        }
      }
      const available = Object.values(sources).filter((source) => source.dataStatus === "AVAILABLE");
      const complete = available.length === sourceNames.length;
      return {
        dataStatus: complete ? "AVAILABLE" : available.length ? "PARTIAL" : "UNAVAILABLE",
        posts: complete ? available.reduce((sum, source) => sum + source.posts, 0) : null,
        comments: complete ? available.reduce((sum, source) => sum + source.comments, 0) : null,
        sources,
        recentActivity: recentActivity.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || String(b.id).localeCompare(String(a.id))).slice(0, 5),
      };
    } catch (error) {
      recordActivityFailure("community", error);
      return unavailableActivity("community");
    }
  }

  static async readExpertRequests(userId) {
    try {
      const pool = getPostgresPool();
      const requestsRes = await pool.query(
        `SELECT id, case_id, case_revision, claim_id, domain_code, question, status, created_at, updated_at
           FROM private.expert_review_requests
          WHERE requester_id = $1
          ORDER BY created_at DESC
          LIMIT 10`,
        [userId]
      );
      const countsRes = await pool.query(
        `SELECT
           count(*)::int AS total,
           count(*) filter (where status in ('REQUESTED', 'MATCHING'))::int AS pending,
           count(*) filter (where status in ('ASSIGNED', 'IN_REVIEW'))::int AS in_review,
           count(*) filter (where status = 'COMPLETED')::int AS completed
         FROM private.expert_review_requests
        WHERE requester_id = $1`,
        [userId]
      );
      const counts = countsRes.rows[0] || {};
      return {
        dataStatus: "AVAILABLE",
        total: Number(counts.total || 0),
        pending: Number(counts.pending || 0),
        inReview: Number(counts.in_review || 0),
        completed: Number(counts.completed || 0),
        recentRequests: requestsRes.rows.map((r) => ({
          id: r.id,
          caseId: r.case_id,
          caseRevision: Number(r.case_revision),
          claimId: r.claim_id,
          domainCode: r.domain_code,
          question: r.question,
          status: r.status,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
      };
    } catch (error) {
      recordActivityFailure("expert", error);
      return unavailableActivity("expert");
    }
  }
}
