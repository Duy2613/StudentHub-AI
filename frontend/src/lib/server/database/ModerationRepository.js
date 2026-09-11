import { getPostgresPool } from "./PostgresPool.js";

export const ALLOWED_MODERATION_TARGETS = Object.freeze([
  "COMMUNITY_CONTRIBUTION",
]);

export const MODERATION_ACTIONS = Object.freeze([
  "KEEP",
  "LIMIT",
  "REMOVE_FROM_PUBLIC_PROJECTION",
  "ESCALATE",
]);

export const MODERATION_POLICY = Object.freeze({
  policyVersion: "community-moderation-v2",
  minimumIndependentReviewers: 2,
  decisionThreshold: 0.67,
  minimumQualityUnits: 20,
  requiredRoles: Object.freeze(["MODERATOR", "ADMIN"]),
  requiredQualificationState: "DOMAIN_VERIFIED",
  allowedTargets: ALLOWED_MODERATION_TARGETS,
});

export class ModerationRepositoryError extends Error {
  constructor(code, message = code, statusCode = 409) {
    super(`${code}: ${message}`);
    this.name = "ModerationRepositoryError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function fail(code, message = code, statusCode = 409) {
  throw new ModerationRepositoryError(code, message, statusCode);
}

function sameIdentity(left, right) {
  return Boolean(left && right && String(left).toLowerCase() === String(right).toLowerCase());
}

function actorSnapshot(actorId, extra = {}) {
  return JSON.stringify({ actorId, snapshotVersion: 1, ...extra });
}

/**
 * Evaluate every server-owned moderation authority input. A role is only one
 * input: active domain qualification, independent quality sufficiency,
 * completed moderation training, target scope, and conflict checks are also
 * required before a vote or finalization can be written.
 */
export async function evaluateModerationEligibility(queryable, { actorId, caseRecord = null } = {}) {
  if (!actorId) {
    return { eligible: false, code: "MODERATOR_IDENTITY_REQUIRED", snapshot: { eligibilityResult: "INELIGIBLE" } };
  }

  const rolesResult = await queryable.query(
    `SELECT coalesce(array_agg(r.code ORDER BY r.code), '{}') AS role_codes
       FROM private.user_roles ur
       JOIN private.roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND ur.revoked_at IS NULL`,
    [actorId]
  );
  const roles = (rolesResult.rows[0]?.role_codes || []).map((role) => String(role).toUpperCase());

  const verificationResult = await queryable.query(
    `SELECT ev.id, ev.domain_code, ev.status, ev.qualification_state,
            ev.revision, ev.suspended_at, ev.expires_at
       FROM private.expert_verifications ev
      WHERE ev.user_id = $1
        AND ev.status = 'VERIFIED'
        AND ev.qualification_state = $2
        AND ev.suspended_at IS NULL
        AND (ev.expires_at IS NULL OR ev.expires_at > now())
      ORDER BY ev.revision DESC, ev.verified_at DESC NULLS LAST
      LIMIT 1`,
    [actorId, MODERATION_POLICY.requiredQualificationState]
  );
  const verification = verificationResult.rows[0] || null;

  const qualityResult = verification
    ? await queryable.query(
      `SELECT count(DISTINCT coalesce(incident_cluster_id, 'event:' || id::text))::int AS sample_size
         FROM private.expert_quality_events
        WHERE user_id = $1 AND domain_code = $2`,
      [actorId, verification.domain_code]
    )
    : { rows: [{ sample_size: 0 }] };
  const qualitySampleSize = Number(qualityResult.rows[0]?.sample_size || 0);
  const qualitySufficiency = qualitySampleSize >= MODERATION_POLICY.minimumQualityUnits ? "SUFFICIENT" : "INSUFFICIENT";

  const trainingResult = await queryable.query(
    `SELECT 1
       FROM private.expert_practice_decisions
      WHERE user_id = $1 AND decision = 'PASS'
      LIMIT 1`,
    [actorId]
  );
  const trainingPassed = trainingResult.rows.length > 0;

  let conflictOfInterest = false;
  if (caseRecord?.id) {
    const conflictResult = await queryable.query(
      `SELECT 1
         FROM private.expert_assignments
        WHERE expert_id = $1
          AND case_id = $2
          AND conflict_of_interest = true
          AND status IN ('ASSIGNED', 'IN_REVIEW')
        LIMIT 1`,
      [actorId, caseRecord.id]
    );
    conflictOfInterest = conflictResult.rows.length > 0;
  }

  const failureCodes = [];
  if (!roles.some((role) => MODERATION_POLICY.requiredRoles.includes(role))) failureCodes.push("MODERATION_ROLE_REQUIRED");
  if (!verification) failureCodes.push("ACTIVE_QUALIFICATION_REQUIRED");
  if (qualitySufficiency !== "SUFFICIENT") failureCodes.push("QUALITY_SUFFICIENCY_REQUIRED");
  if (!trainingPassed) failureCodes.push("MODERATION_TRAINING_REQUIRED");
  if (caseRecord?.target_type && !ALLOWED_MODERATION_TARGETS.includes(caseRecord.target_type)) failureCodes.push("MODERATION_TARGET_DISALLOWED");
  if (caseRecord && !caseRecord.target_author_id) failureCodes.push("TARGET_AUTHOR_UNAVAILABLE");
  if (caseRecord && sameIdentity(actorId, caseRecord.target_author_id)) failureCodes.push("SELF_MODERATION_FORBIDDEN");
  if (caseRecord && sameIdentity(actorId, caseRecord.reported_by)) failureCodes.push("REPORTER_MODERATION_FORBIDDEN");
  if (conflictOfInterest) failureCodes.push("CONFLICT_OF_INTEREST");

  const eligible = failureCodes.length === 0;
  const snapshot = {
    snapshotVersion: 1,
    moderatorId: actorId,
    roleCodes: roles,
    policyVersion: MODERATION_POLICY.policyVersion,
    qualificationState: verification?.qualification_state || "UNKNOWN",
    verificationId: verification?.id || null,
    verificationRevision: verification?.revision == null ? null : Number(verification.revision),
    verifiedDomain: verification?.domain_code || null,
    qualitySampleSize,
    qualitySufficiency,
    trainingPassed,
    coiState: conflictOfInterest ? "CONFLICT" : "CLEAR",
    targetType: caseRecord?.target_type || null,
    targetId: caseRecord?.target_id || null,
    targetAuthorId: caseRecord?.target_author_id || null,
    reportedBy: caseRecord?.reported_by || null,
    failureCodes,
    eligibilityResult: eligible ? "ELIGIBLE" : "INELIGIBLE",
    checkedAt: new Date().toISOString(),
  };

  return {
    eligible,
    code: failureCodes[0] || "ELIGIBLE",
    snapshot,
    verification,
    qualitySampleSize,
  };
}

/**
 * ModerationRepository
 *
 * Community moderation is deliberately separate from Trust. It can change a
 * community contribution's public projection, but it never writes Trust cases,
 * verdicts, confidence, reputation, or expert authority.
 */
export class ModerationRepository {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async createCase({
    targetType,
    targetId,
    reportedBy = null,
    reasonCategory,
    details = null,
  }) {
    const upperTargetType = String(targetType || "").toUpperCase();
    if (!ALLOWED_MODERATION_TARGETS.includes(upperTargetType)) {
      fail("MODERATION_TARGET_DISALLOWED", "Phase-F moderation only supports community contribution projections.", 400);
    }
    if (!targetId) fail("TARGET_ID_REQUIRED", "A community contribution target is required.", 400);
    if (details != null && String(details).length > 2000) fail("DETAILS_TOO_LONG", "Moderation details are limited to 2000 characters.", 400);

    const validReasons = ["SPAM", "HARASSMENT", "MISINFORMATION", "PRIVACY_VIOLATION", "ACADEMIC_DISHONESTY", "OTHER"];
    const safeReason = validReasons.includes(String(reasonCategory).toUpperCase())
      ? String(reasonCategory).toUpperCase()
      : "OTHER";

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // The authoritative Community row supplies the author. Request bodies
      // never choose target ownership or appeal ownership.
      const targetResult = await client.query(
        `SELECT id, author_id, publication_state
           FROM public.community_contributions
          WHERE id = $1
          FOR SHARE`,
        [targetId]
      );
      const target = targetResult.rows[0];
      if (!target) fail("MODERATION_TARGET_NOT_FOUND", "The community contribution does not exist.", 404);

      const insertRes = await client.query(
        `INSERT INTO private.moderation_cases (
          target_type, target_id, target_author_id, reported_by,
          target_author_snapshot, reporter_snapshot,
          reason_category, details, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, 'OPEN', now(), now())
        RETURNING id`,
        [
          upperTargetType,
          targetId,
          target.author_id,
          reportedBy,
          JSON.stringify({ userId: target.author_id, source: "public.community_contributions" }),
          JSON.stringify({ userId: reportedBy, source: "authenticated-principal" }),
          safeReason,
          details,
        ]
      );
      const caseId = insertRes.rows[0].id;

      await client.query(
        `INSERT INTO private.moderation_events (
          moderation_case_id, actor_id, actor_snapshot, event_type, metadata, created_at
        ) VALUES ($1, $2, $3::jsonb, 'CASE_OPENED', $4::jsonb, now())`,
        [
          caseId,
          reportedBy || target.author_id,
          actorSnapshot(reportedBy || target.author_id, { action: "CASE_OPENED" }),
          JSON.stringify({ reasonCategory: safeReason, targetType: upperTargetType, targetId }),
        ]
      );

      await client.query("COMMIT");
      return { id: caseId, targetType: upperTargetType, targetAuthorId: target.author_id, status: "OPEN" };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async recordVote({ caseId, moderatorId, action, rationale = null }) {
    if (!caseId) fail("CASE_ID_REQUIRED", "A moderation case is required.", 400);
    if (!moderatorId) fail("MODERATOR_ID_REQUIRED", "An authenticated moderator is required.", 401);
    const upperAction = String(action || "").toUpperCase();
    if (!MODERATION_ACTIONS.includes(upperAction)) {
      fail("INVALID_MODERATION_ACTION", `Must be one of ${MODERATION_ACTIONS.join(", ")}.`, 400);
    }
    if (rationale != null && String(rationale).length > 1000) fail("RATIONALE_TOO_LONG", "Moderation rationale is limited to 1000 characters.", 400);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const caseResult = await client.query(
        `SELECT id, target_type, target_id, target_author_id, reported_by, status, resolution
           FROM private.moderation_cases
          WHERE id = $1
          FOR UPDATE`,
        [caseId]
      );
      const caseRecord = caseResult.rows[0];
      if (!caseRecord) fail("MODERATION_CASE_NOT_FOUND", "The moderation case does not exist.", 404);
      if (["RESOLVED", "DISMISSED"].includes(caseRecord.status)) fail("MODERATION_CASE_CLOSED", "The moderation case is already closed.", 409);

      const eligibility = await evaluateModerationEligibility(client, { actorId: moderatorId, caseRecord });
      if (!eligibility.eligible) fail(eligibility.code, `Moderation vote denied: ${eligibility.code}.`, 403);

      const duplicate = await client.query(
        `SELECT id
           FROM private.moderation_votes
          WHERE moderation_case_id = $1 AND moderator_id = $2
          FOR SHARE`,
        [caseId, moderatorId]
      );
      if (duplicate.rows.length > 0) fail("DUPLICATE_MODERATION_VOTE", "Each independent moderator may cast one vote per case.", 409);

      await client.query(
        `INSERT INTO private.moderation_votes (
          moderation_case_id, moderator_id, action, rationale,
          policy_version, qualification_state, quality_sufficiency,
          verification_id, verification_revision, coi_state,
          eligibility_result, eligibility_snapshot, moderator_snapshot, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ELIGIBLE', $11::jsonb, $12::jsonb, now())`,
        [
          caseId,
          moderatorId,
          upperAction,
          rationale,
          MODERATION_POLICY.policyVersion,
          eligibility.snapshot.qualificationState,
          eligibility.snapshot.qualitySufficiency,
          eligibility.snapshot.verificationId,
          eligibility.snapshot.verificationRevision,
          eligibility.snapshot.coiState,
          JSON.stringify(eligibility.snapshot),
          actorSnapshot(moderatorId, { roleCodes: eligibility.snapshot.roleCodes }),
        ]
      );

      await client.query(
        `INSERT INTO private.moderation_events (
          moderation_case_id, actor_id, actor_snapshot, event_type, metadata, created_at
        ) VALUES ($1, $2, $3::jsonb, 'VOTE_RECORDED', $4::jsonb, now())`,
        [
          caseId,
          moderatorId,
          actorSnapshot(moderatorId, { eligibilityResult: "ELIGIBLE" }),
          JSON.stringify({ action: upperAction, policyVersion: MODERATION_POLICY.policyVersion, eligibility: eligibility.snapshot }),
        ]
      );

      await client.query(
        `UPDATE private.moderation_cases
            SET status = CASE WHEN status = 'OPEN' THEN 'IN_REVIEW' ELSE status END,
                updated_at = now()
          WHERE id = $1`,
        [caseId]
      );

      await client.query("COMMIT");
      return { success: true, action: upperAction, eligibility: eligibility.snapshot };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async finalizeCase({ caseId, resolvedBy, resolution }) {
    if (!caseId) fail("CASE_ID_REQUIRED", "A moderation case is required.", 400);
    if (!resolvedBy) fail("FINALIZER_IDENTITY_REQUIRED", "An authenticated coordinator or admin is required.", 401);
    const upperResolution = String(resolution || "").toUpperCase();
    if (!MODERATION_ACTIONS.includes(upperResolution)) {
      fail("INVALID_RESOLUTION", `Must be one of ${MODERATION_ACTIONS.join(", ")}.`, 400);
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const caseResult = await client.query(
        `SELECT id, target_type, target_id, target_author_id, reported_by, status, resolution
           FROM private.moderation_cases
          WHERE id = $1
          FOR UPDATE`,
        [caseId]
      );
      const caseRecord = caseResult.rows[0];
      if (!caseRecord) fail("MODERATION_CASE_NOT_FOUND", "The moderation case does not exist.", 404);
      if (["RESOLVED", "DISMISSED"].includes(caseRecord.status)) fail("MODERATION_CASE_CLOSED", "The moderation case is already closed.", 409);

      const eligibility = await evaluateModerationEligibility(client, { actorId: resolvedBy, caseRecord });
      if (!eligibility.eligible) fail(eligibility.code, `Finalization denied: ${eligibility.code}.`, 403);

      const voteResult = await client.query(
        `SELECT action, count(*)::int AS vote_count
           FROM private.moderation_votes
          WHERE moderation_case_id = $1 AND eligibility_result = 'ELIGIBLE'
          GROUP BY action`,
        [caseId]
      );
      const voteCounts = Object.fromEntries(voteResult.rows.map((row) => [row.action, Number(row.vote_count)]));
      const eligibleVoteCount = Object.values(voteCounts).reduce((sum, value) => sum + value, 0);
      const requestedVotes = Number(voteCounts[upperResolution] || 0);
      const thresholdMet = eligibleVoteCount > 0 && requestedVotes / eligibleVoteCount >= MODERATION_POLICY.decisionThreshold;
      if (eligibleVoteCount < MODERATION_POLICY.minimumIndependentReviewers || !thresholdMet) {
        fail("MODERATION_QUORUM_NOT_REACHED", "The case remains open or in review until the versioned quorum and decision threshold are met.", 409);
      }

      await client.query(
        `UPDATE private.moderation_cases
            SET status = 'RESOLVED', resolution = $1, resolved_by = $2,
                resolved_at = now(), updated_at = now()
          WHERE id = $3`,
        [upperResolution, resolvedBy, caseId]
      );

      // Only a contribution has a supported public projection action. KEEP and
      // ESCALATE preserve the projection; LIMIT and REMOVE soft-moderate it.
      if (["LIMIT", "REMOVE_FROM_PUBLIC_PROJECTION"].includes(upperResolution)) {
        await client.query(
          `UPDATE public.community_contributions
              SET publication_state = 'MODERATED', updated_at = now()
            WHERE id = $1`,
          [caseRecord.target_id]
        );
      }

      await client.query(
        `INSERT INTO private.moderation_events (
          moderation_case_id, actor_id, actor_snapshot, event_type, metadata, created_at
        ) VALUES ($1, $2, $3::jsonb, 'CASE_RESOLVED', $4::jsonb, now())`,
        [
          caseId,
          resolvedBy,
          actorSnapshot(resolvedBy, { eligibilityResult: "ELIGIBLE" }),
          JSON.stringify({
            resolution: upperResolution,
            policyVersion: MODERATION_POLICY.policyVersion,
            minimumIndependentReviewers: MODERATION_POLICY.minimumIndependentReviewers,
            decisionThreshold: MODERATION_POLICY.decisionThreshold,
            eligibleVoteCount,
            voteCounts,
            finalizerEligibility: eligibility.snapshot,
          }),
        ]
      );

      await client.query("COMMIT");
      return { success: true, resolution: upperResolution, voteCounts, eligibleVoteCount };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  // Compatibility name retained for callers; finalization is now explicitly
  // quorum-gated and is never performed by castVote.
  async resolveCase(args) {
    return this.finalizeCase(args);
  }

  async submitAppeal({ caseId, appellantId, reason }) {
    if (!caseId) fail("CASE_ID_REQUIRED", "A moderation case is required.", 400);
    if (!appellantId) fail("APPELLANT_ID_REQUIRED", "An authenticated appellant is required.", 401);
    const cleanReason = String(reason || "").trim();
    if (cleanReason.length < 10) fail("APPEAL_REASON_TOO_SHORT", "Appeal reason must be at least 10 characters.", 400);
    if (cleanReason.length > 2000) fail("APPEAL_REASON_TOO_LONG", "Appeal reason is limited to 2000 characters.", 400);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const caseResult = await client.query(
        `SELECT id, target_type, target_author_id, reported_by, resolved_by, status
           FROM private.moderation_cases
          WHERE id = $1
          FOR SHARE`,
        [caseId]
      );
      const caseRecord = caseResult.rows[0];
      if (!caseRecord) fail("MODERATION_CASE_NOT_FOUND", "The moderation case does not exist.", 404);
      if (!sameIdentity(appellantId, caseRecord.target_author_id)) {
        fail("APPEAL_OWNER_REQUIRED", "Only the authoritative contribution author may appeal this case.", 403);
      }
      if (caseRecord.status !== "RESOLVED") fail("APPEAL_NOT_AVAILABLE", "Appeals are available after a final moderation decision.", 409);

      const insertRes = await client.query(
        `INSERT INTO public.moderation_appeals (
          moderation_case_id, appellant_id, appellant_snapshot, reason, status, created_at, updated_at
        ) VALUES ($1, $2, $3::jsonb, $4, 'PENDING', now(), now())
        ON CONFLICT (moderation_case_id, appellant_id) DO UPDATE SET
          reason = EXCLUDED.reason,
          appellant_snapshot = EXCLUDED.appellant_snapshot,
          status = 'PENDING',
          updated_at = now()
        RETURNING id`,
        [caseId, appellantId, actorSnapshot(appellantId, { appealOwner: true }), cleanReason]
      );
      const appealId = insertRes.rows[0].id;

      await client.query(
        `INSERT INTO private.moderation_events (
          moderation_case_id, actor_id, actor_snapshot, event_type, metadata, created_at
        ) VALUES ($1, $2, $3::jsonb, 'APPEAL_SUBMITTED', $4::jsonb, now())`,
        [caseId, appellantId, actorSnapshot(appellantId, { appealOwner: true }), JSON.stringify({ appealId })]
      );

      await client.query("COMMIT");
      return { success: true, appealId };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async resolveAppeal({ appealId, reviewedBy, status, reviewNotes = null }) {
    if (!appealId) fail("APPEAL_ID_REQUIRED", "An appeal is required.", 400);
    if (!reviewedBy) fail("APPEAL_REVIEWER_REQUIRED", "An authenticated independent reviewer is required.", 401);
    const upperStatus = String(status || "").toUpperCase();
    if (!["ACCEPTED", "REJECTED"].includes(upperStatus)) fail("INVALID_APPEAL_STATUS", "Must be ACCEPTED or REJECTED.", 400);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const appealResult = await client.query(
        `SELECT a.id, a.moderation_case_id, a.appellant_id,
                c.target_type, c.target_id, c.target_author_id,
                c.reported_by, c.resolved_by, c.status AS case_status
           FROM public.moderation_appeals a
           JOIN private.moderation_cases c ON c.id = a.moderation_case_id
          WHERE a.id = $1
          FOR UPDATE`,
        [appealId]
      );
      const appeal = appealResult.rows[0];
      if (!appeal) fail("APPEAL_NOT_FOUND", "The appeal does not exist.", 404);

      if ([appeal.appellant_id, appeal.target_author_id, appeal.resolved_by].some((id) => sameIdentity(reviewedBy, id))) {
        fail("APPEAL_REVIEWER_NOT_INDEPENDENT", "The appeal reviewer must be independent of the appellant, author, and original moderator.", 403);
      }

      const eligibility = await evaluateModerationEligibility(client, {
        actorId: reviewedBy,
        caseRecord: {
          id: appeal.moderation_case_id,
          target_type: appeal.target_type,
          target_id: appeal.target_id,
          target_author_id: appeal.target_author_id,
          reported_by: appeal.reported_by,
        },
      });
      if (!eligibility.eligible) fail(eligibility.code, `Appeal review denied: ${eligibility.code}.`, 403);

      await client.query(
        `UPDATE public.moderation_appeals
            SET status = $1,
                review_notes = $2,
                reviewed_by = $3,
                reviewer_snapshot = $4::jsonb,
                updated_at = now()
          WHERE id = $5`,
        [
          upperStatus,
          reviewNotes,
          reviewedBy,
          JSON.stringify({ ...eligibility.snapshot, independence: "INDEPENDENT" }),
          appealId,
        ]
      );

      await client.query(
        `INSERT INTO private.moderation_events (
          moderation_case_id, actor_id, actor_snapshot, event_type, metadata, created_at
        ) VALUES ($1, $2, $3::jsonb, 'APPEAL_RESOLVED', $4::jsonb, now())`,
        [
          appeal.moderation_case_id,
          reviewedBy,
          actorSnapshot(reviewedBy, { independence: "INDEPENDENT" }),
          JSON.stringify({ appealId, status: upperStatus, reviewerEligibility: eligibility.snapshot }),
        ]
      );

      await client.query("COMMIT");
      return { success: true, status: upperStatus };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async getPublicAppeals(userId) {
    if (!userId) return [];
    const result = await this.pool.query(
      `SELECT id, moderation_case_id, reason, status, review_notes, created_at, updated_at
         FROM public.moderation_appeals
        WHERE appellant_id = $1
        ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows.map((r) => ({
      id: r.id,
      caseId: r.moderation_case_id,
      reason: r.reason,
      status: r.status,
      reviewNotes: r.review_notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getModeratorCases({ actorId, status = "OPEN", limit = 20 } = {}) {
    const eligibility = await evaluateModerationEligibility(this.pool, { actorId });
    if (!eligibility.eligible) fail(eligibility.code, `Moderator queue access denied: ${eligibility.code}.`, 403);
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 50);
    const result = await this.pool.query(
      `SELECT c.id, c.target_type, c.target_id, c.reason_category, c.details,
              c.status, c.created_at,
              count(v.id)::int as vote_count
         FROM private.moderation_cases c
         LEFT JOIN private.moderation_votes v ON v.moderation_case_id = c.id
        WHERE (c.status = $1 OR $1 = 'ALL')
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT $2`,
      [status, safeLimit]
    );

    return result.rows.map((r) => ({
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      reasonCategory: r.reason_category,
      details: r.details,
      status: r.status,
      voteCount: r.vote_count,
      createdAt: r.created_at,
    }));
  }
}
