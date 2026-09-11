import { getPostgresPool } from "./PostgresPool.js";

export const ALLOWED_MODERATION_TARGETS = Object.freeze([
  "COMMUNITY_CONTRIBUTION",
  "COMMUNITY_REACTION",
  "COMMUNITY_PROFILE",
]);

export const MODERATION_ACTIONS = Object.freeze([
  "KEEP",
  "LIMIT",
  "REMOVE_FROM_PUBLIC_PROJECTION",
  "ESCALATE",
]);

/**
 * ModerationRepository
 *
 * Implements Community Content Moderation & Transparent Appeals.
 *
 * BINDING AMENDMENTS UPHOLDED:
 * 1. Amendment 5: Moderation is strictly scoped to Community content. It is
 *    FORBIDDEN from targeting, governing, or mutating Trust cases/verdicts.
 * 2. Amendment 6: Sensitive cases, votes, and events remain private. Only sanitized
 *    public projections or user-owned appeals are exposed.
 * 3. Non-destructive moderation: Soft removal hides from public projections while
 *    preserving immutable audit history.
 */
export class ModerationRepository {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async createCase({
    targetType,
    targetId,
    targetAuthorId,
    reportedBy = null,
    reasonCategory,
    details = null,
  }) {
    const upperTargetType = String(targetType || "").toUpperCase();
    if (!ALLOWED_MODERATION_TARGETS.includes(upperTargetType)) {
      throw new Error(`MODERATION_TARGET_DISALLOWED: Phase-F moderation is scoped to Community content only. Cannot moderate '${targetType}'.`);
    }
    if (!targetId) throw new Error("TARGET_ID_REQUIRED");
    if (!targetAuthorId) throw new Error("TARGET_AUTHOR_ID_REQUIRED");

    const validReasons = ["SPAM", "HARASSMENT", "MISINFORMATION", "PRIVACY_VIOLATION", "ACADEMIC_DISHONESTY", "OTHER"];
    const safeReason = validReasons.includes(String(reasonCategory).toUpperCase())
      ? String(reasonCategory).toUpperCase()
      : "OTHER";

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const insertRes = await client.query(
        `INSERT INTO private.moderation_cases (
          target_type, target_id, target_author_id, reported_by,
          reason_category, details, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', now(), now())
        RETURNING id`,
        [upperTargetType, targetId, targetAuthorId, reportedBy, safeReason, details]
      );
      const caseId = insertRes.rows[0].id;

      await client.query(
        `INSERT INTO private.moderation_events (
          moderation_case_id, actor_id, event_type, metadata, created_at
        ) VALUES ($1, $2, 'CASE_OPENED', $3::jsonb, now())`,
        [caseId, reportedBy || targetAuthorId, JSON.stringify({ reasonCategory: safeReason })]
      );

      await client.query("COMMIT");
      return { id: caseId, targetType: upperTargetType, status: "OPEN" };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async recordVote({ caseId, moderatorId, action, rationale = null }) {
    if (!caseId) throw new Error("CASE_ID_REQUIRED");
    if (!moderatorId) throw new Error("MODERATOR_ID_REQUIRED");
    const upperAction = String(action || "").toUpperCase();
    if (!MODERATION_ACTIONS.includes(upperAction)) {
      throw new Error(`INVALID_MODERATION_ACTION: Must be one of ${MODERATION_ACTIONS.join(", ")}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO private.moderation_votes (
          moderation_case_id, moderator_id, action, rationale, created_at
        ) VALUES ($1, $2, $3, $4, now())
        ON CONFLICT (moderation_case_id, moderator_id) DO UPDATE SET
          action = EXCLUDED.action,
          rationale = EXCLUDED.rationale,
          created_at = now()`,
        [caseId, moderatorId, upperAction, rationale]
      );

      await client.query(
        `INSERT INTO private.moderation_events (
          moderation_case_id, actor_id, event_type, metadata, created_at
        ) VALUES ($1, $2, 'VOTE_RECORDED', $3::jsonb, now())`,
        [caseId, moderatorId, JSON.stringify({ action: upperAction })]
      );

      await client.query("COMMIT");
      return { success: true, action: upperAction };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async resolveCase({ caseId, resolvedBy, resolution }) {
    if (!caseId) throw new Error("CASE_ID_REQUIRED");
    const upperRes = String(resolution || "").toUpperCase();
    if (!MODERATION_ACTIONS.includes(upperRes)) {
      throw new Error(`INVALID_RESOLUTION: Must be one of ${MODERATION_ACTIONS.join(", ")}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const caseRes = await client.query(
        `SELECT target_type, target_id FROM private.moderation_cases
         WHERE id = $1 FOR UPDATE`,
        [caseId]
      );
      if (caseRes.rows.length === 0) throw new Error("MODERATION_CASE_NOT_FOUND");
      const { target_type, target_id } = caseRes.rows[0];

      await client.query(
        `UPDATE private.moderation_cases
         SET status = 'RESOLVED',
             resolution = $1,
             resolved_by = $2,
             resolved_at = now(),
             updated_at = now()
         WHERE id = $3`,
        [upperRes, resolvedBy, caseId]
      );

      // Non-destructive mutation: hide from public projection
      if (upperRes === "REMOVE_FROM_PUBLIC_PROJECTION" && target_type === "COMMUNITY_CONTRIBUTION") {
        await client.query(
          `UPDATE public.community_contributions
           SET publication_state = 'MODERATED', updated_at = now()
           WHERE id = $1`,
          [target_id]
        );
      }

      await client.query(
        `INSERT INTO private.moderation_events (
          moderation_case_id, actor_id, event_type, metadata, created_at
        ) VALUES ($1, $2, 'CASE_RESOLVED', $3::jsonb, now())`,
        [caseId, resolvedBy, JSON.stringify({ resolution: upperRes })]
      );

      await client.query("COMMIT");
      return { success: true, resolution: upperRes };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async submitAppeal({ caseId, appellantId, reason }) {
    if (!caseId) throw new Error("CASE_ID_REQUIRED");
    if (!appellantId) throw new Error("APPELLANT_ID_REQUIRED");
    const cleanReason = String(reason || "").trim();
    if (cleanReason.length < 10) throw new Error("APPEAL_REASON_TOO_SHORT");

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const insertRes = await client.query(
        `INSERT INTO public.moderation_appeals (
          moderation_case_id, appellant_id, reason, status, created_at, updated_at
        ) VALUES ($1, $2, $3, 'PENDING', now(), now())
        ON CONFLICT (moderation_case_id, appellant_id) DO UPDATE SET
          reason = EXCLUDED.reason,
          status = 'PENDING',
          updated_at = now()
        RETURNING id`,
        [caseId, appellantId, cleanReason]
      );
      const appealId = insertRes.rows[0].id;

      await client.query(
        `INSERT INTO private.moderation_events (
          moderation_case_id, actor_id, event_type, metadata, created_at
        ) VALUES ($1, $2, 'APPEAL_SUBMITTED', $3::jsonb, now())`,
        [caseId, appellantId, JSON.stringify({ appealId })]
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
    if (!appealId) throw new Error("APPEAL_ID_REQUIRED");
    const upperStatus = String(status || "").toUpperCase();
    if (!["ACCEPTED", "REJECTED"].includes(upperStatus)) {
      throw new Error("INVALID_APPEAL_STATUS: Must be ACCEPTED or REJECTED");
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const appealRes = await client.query(
        `UPDATE public.moderation_appeals
         SET status = $1,
             review_notes = $2,
             reviewed_by = $3,
             updated_at = now()
         WHERE id = $4
         RETURNING moderation_case_id, appellant_id`,
        [upperStatus, reviewNotes, reviewedBy, appealId]
      );
      if (appealRes.rows.length === 0) throw new Error("APPEAL_NOT_FOUND");
      const { moderation_case_id } = appealRes.rows[0];

      await client.query(
        `INSERT INTO private.moderation_events (
          moderation_case_id, actor_id, event_type, metadata, created_at
        ) VALUES ($1, $2, 'APPEAL_RESOLVED', $3::jsonb, now())`,
        [moderation_case_id, reviewedBy, JSON.stringify({ appealId, status: upperStatus })]
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

  async getModeratorCases({ status = "OPEN", limit = 20 } = {}) {
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
