/**
 * StudentHub AI — ExpertProfileService
 *
 * Canonical service for reading and updating Expert Profiles.
 * Assembles ExpertProfileViewDTO from Owner Supabase backend only.
 * Prohibits client mutation of StarLevel, Reputation, Role, Qualification,
 * Active state, or Verified Domains.
 */

import { getPostgresPool } from "../database/PostgresPool.js";
import { ExpertQualificationService, authenticatedUserId } from "../expert/ExpertQualificationService.js";
import { ExpertRepository } from "../database/ExpertRepository.js";

const EXPERT_ALLOWED_UPDATE_FIELDS = new Set([
  "bio",
  "Bio",
  "expertise",
  "Expertise",
  "publicTitle",
  "publicBio",
  "title",
]);

const EXPERT_FORBIDDEN_MUTATION_FIELDS = new Set([
  "starLevel",
  "StarLevel",
  "reputation",
  "Reputation",
  "role",
  "roles",
  "qualification",
  "Qualification",
  "qualificationStatus",
  "active",
  "Active",
  "verifiedDomains",
  "VerifiedDomains",
  "completedReviews",
  "CompletedReviews",
  "trustScore",
  "TrustScore",
  "authority",
  "createdAt",
  "updatedAt",
  "email",
]);

export class ExpertProfileServiceError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "ExpertProfileServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ExpertProfileService {
  /**
   * Retrieves the comprehensive, normalized ExpertProfileViewDTO.
   * Runs independent reads in parallel.
   */
  static async getExpertProfileView({ principal }) {
    const userId = authenticatedUserId(principal);
    const pool = getPostgresPool();

    // 1. Qualification Status
    const qualificationPromise = ExpertQualificationService.getStatus(userId);

    // 2. Verified Domains
    const verifiedDomainsPromise = ExpertRepository.getVerifiedDomains(userId);

    // 3. Public Expert Profile
    const expertProfilePromise = pool.query(
      `SELECT public_title, public_bio, updated_at, created_at
         FROM public.expert_profiles
        WHERE user_id = $1
        LIMIT 1`,
      [userId]
    );

    // 4. Work Summary & Assignments
    const assignmentsPromise = pool.query(
      `SELECT id, case_id, case_revision, claim_id, domain_code, status, assigned_by, expires_at, created_at, updated_at
         FROM private.expert_assignments
        WHERE expert_id = $1
        ORDER BY created_at DESC
        LIMIT 20`,
      [userId]
    );

    const workCountsPromise = pool.query(
      `SELECT
         count(*) filter (where status = 'ASSIGNED')::int AS assigned,
         count(*) filter (where status = 'PENDING')::int AS pending,
         count(*) filter (where status = 'IN_REVIEW')::int AS in_review,
         count(*) filter (where status = 'COMPLETED')::int AS completed,
         count(*) filter (where status in ('CANCELLED','REJECTED','EXPIRED'))::int AS cancelled
       FROM private.expert_assignments
      WHERE expert_id = $1`,
      [userId]
    );

    // 5. Formal Assessments
    const assessmentsPromise = pool.query(
      `SELECT ea.id, ea.case_id, ea.domain_code, ea.confidence, ea.case_revision, ea.claim_id,
              ea.assessment_state, ea.conclusion_within_scope, ea.reasoning, ea.uncertainty,
              ea.missing_evidence, ea.verified_domain, ea.submitted_at, ea.created_at,
              tc.visibility, tc.state as case_state
         FROM public.expert_assessments ea
         LEFT JOIN public.trust_cases tc ON tc.id = ea.case_id
        WHERE ea.expert_id = $1
        ORDER BY ea.created_at DESC
        LIMIT 20`,
      [userId]
    );

    // 6. Reputation & Quality Events
    const reputationPromise = pool.query(
      `SELECT coalesce(sum(delta), 0)::numeric AS reputation, count(*)::int AS count
         FROM private.reputation_events
        WHERE user_id = $1`,
      [userId]
    );

    const [
      qualificationResult,
      verifiedDomainsResult,
      expertProfileResult,
      assignmentsResult,
      workCountsResult,
      assessmentsResult,
      reputationResult,
    ] = await Promise.all([
      qualificationPromise,
      verifiedDomainsPromise,
      expertProfilePromise,
      assignmentsPromise,
      workCountsPromise,
      assessmentsPromise,
      reputationPromise,
    ]);

    const qualification = qualificationResult;
    const application = qualification?.application || null;
    const snapshot = application?.profile && typeof application.profile === "object" ? application.profile : {};
    const verifiedDomains = verifiedDomainsResult;
    const expertProfileRow = expertProfileResult.rows[0] || null;

    const workCountsRow = workCountsResult.rows[0] || {};
    const workCounts = {
      assigned: Number(workCountsRow?.assigned || 0),
      pending: Number(workCountsRow?.pending || 0),
      inReview: Number(workCountsRow?.in_review || 0),
      completed: Number(workCountsRow?.completed || 0),
      cancelled: Number(workCountsRow?.cancelled || 0),
    };

    const assignmentsRows = assignmentsResult.rows;
    const reviewDeskTasks = assignmentsRows.map((row) => ({
      id: row.id,
      caseId: row.case_id,
      caseRevision: Number(row.case_revision),
      claimId: row.claim_id,
      domainCode: row.domain_code,
      status: row.status,
      assignedBy: row.assigned_by,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const assessmentsRows = assessmentsResult.rows;
    const formalAssessments = assessmentsRows.map((row) => ({
      id: row.id,
      caseId: row.case_id,
      domainCode: row.domain_code,
      confidence: Number(row.confidence),
      caseRevision: Number(row.case_revision),
      claimId: row.claim_id,
      assessmentState: row.assessment_state,
      conclusionWithinScope: row.conclusion_within_scope,
      reasoning: row.reasoning,
      uncertainty: row.uncertainty,
      missingEvidence: row.missing_evidence,
      verifiedDomain: row.verified_domain,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
      caseState: row.case_state || null,
    }));

    const repRow = reputationResult.rows[0] || {};
    const reputationTotal = Number(repRow?.reputation || 0);
    const completedCount = workCounts.completed;

    // Server-calibrated StarLevel: calculated from completed formal assessments and reputation
    // If completedReviews > 0 or reputation > 0, project calibrated level, otherwise null.
    let starLevel = null;
    if (completedCount >= 20 || reputationTotal >= 100) {
      starLevel = 3;
    } else if (completedCount >= 5 || reputationTotal >= 25) {
      starLevel = 2;
    } else if (completedCount >= 1 || reputationTotal > 0) {
      starLevel = 1;
    }

    const isActive = qualification?.state === "ACTIVE" || (verifiedDomains.length > 0 && qualification?.state === "DOMAIN_VERIFIED");
    const fullName = expertProfileRow?.public_title || snapshot.displayName || principal.attributes?.fullName || "Chuyên gia StudentHub";
    const bio = expertProfileRow?.public_bio || (typeof snapshot.bio === "string" ? snapshot.bio : null);
    const expertise = typeof snapshot.expertise === "string" ? snapshot.expertise : null;

    return {
      identity: {
        id: userId,
        fullName,
        avatarUrl: principal.attributes?.avatarUrl || null,
        email: principal.email || null,
      },
      expert: {
        active: isActive,
        qualificationStatus: qualification?.state || "NOT_APPLIED",
        verifiedDomains,
        bio,
        expertise,
        title: expertProfileRow?.public_title || null,
      },
      qualification: {
        state: qualification?.state || "NOT_APPLIED",
        applicationId: application?.applicationId || null,
        identityReview: qualification?.state !== "NOT_APPLIED",
        quizVersion: qualification?.latestAttempt?.quizVersion || null,
        quizScore: qualification?.latestAttempt?.score ?? null,
        quizMaxScore: qualification?.latestAttempt?.maxScore ?? null,
        quizPassed: qualification?.latestAttempt?.status === "PASSED",
        domainReview: ["DOMAIN_REVIEW", "ACTIVE"].includes(qualification?.state),
        activationState: isActive ? "ACTIVE" : "PENDING_ACTIVATION",
        practiceReviews: qualification?.practiceReviews || [],
      },
      reputation: {
        starLevel,
        reputation: reputationTotal,
        completedReviews: completedCount,
        policyNotice: "Reputation reflects platform contribution under server-owned policy. It is not truth probability.",
      },
      work: workCounts,
      tasks: reviewDeskTasks,
      assessments: formalAssessments,
      communityContribution: {
        expertResponsesCount: 0,
        recentResponses: [],
      },
      availability: {
        status: isActive ? "AVAILABLE" : "UNAVAILABLE",
      },
      // Backward-compatibility projection:
      id: userId,
      userId,
      fullName,
      email: principal.email || null,
      bio,
      expertise,
      trustScore: null,
      starLevel,
      createdAt: application?.createdAt || null,
      qualificationStatus: qualification?.state || "NOT_APPLIED",
      verifiedDomains,
      sourceState: "OWNER_CANONICAL",
    };
  }

  /**
   * Updates expert-editable profile fields (Bio, Expertise).
   * Rejects client attempts to modify server-owned authority fields (StarLevel, Reputation, Role, Domains).
   */
  static async updateExpertProfile({ principal, updates }) {
    const userId = authenticatedUserId(principal);
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      throw new ExpertProfileServiceError("INVALID_PAYLOAD", "Update payload must be a JSON object.", 400);
    }

    // Check for forbidden privilege mutation attempts
    for (const key of Object.keys(updates)) {
      if (EXPERT_FORBIDDEN_MUTATION_FIELDS.has(key)) {
        throw new ExpertProfileServiceError(
          "FORBIDDEN_PROFILE_MUTATION",
          `Field '${key}' is server-owned authority and cannot be modified by the expert.`,
          400
        );
      }
      if (!EXPERT_ALLOWED_UPDATE_FIELDS.has(key)) {
        throw new ExpertProfileServiceError(
          "UNKNOWN_PROFILE_FIELD",
          `Field '${key}' is not an editable expert field.`,
          400
        );
      }
    }

    const bio = updates.Bio ?? updates.bio ?? updates.publicBio;
    const expertise = updates.Expertise ?? updates.expertise;
    const title = updates.publicTitle ?? updates.title;

    // Update in qualification application if exists
    try {
      await ExpertQualificationService.updateProfile({
        userId,
        bio,
        expertise,
      });
    } catch (err) {
      // If qualification application doesn't exist yet, allow public expert profile record
      if (err?.code !== "QUALIFICATION_NOT_FOUND") throw err;
    }

    // Also persist to public.expert_profiles for public directory projection
    await ExpertRepository.upsertProfile({
      userId,
      publicTitle: title || undefined,
      publicBio: bio,
    });

    return this.getExpertProfileView({ principal });
  }
}
