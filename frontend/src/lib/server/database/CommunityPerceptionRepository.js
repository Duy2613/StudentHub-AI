import { getPostgresPool } from "./PostgresPool.js";

/**
 * CommunityPerceptionRepository
 *
 * Implements Expert Trust Network V3 Community Perception Signals (BELIEVE / DOUBT).
 *
 * BINDING AMENDMENTS UPHOLDED:
 * 1. Target & Revision aware: UNIQUE on (user_id, case_id, case_revision, claim_id, contribution_id, target_type)
 * 2. Server-derived expert status: voter_is_expert_at_vote is ALWAYS queried server-side
 *    from active private.expert_verifications. Client status is NEVER trusted.
 * 3. Invariant: 100 BELIEVE votes do NOT alter or mutate Trust Engine cases or verdicts.
 * 4. Append-only audit: All vote changes write to private.community_perception_events.
 */
export class CommunityPerceptionRepository {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async isVerifiedExpert(userId) {
    if (!userId) return false;
    const result = await this.pool.query(
      `SELECT 1 FROM private.expert_verifications
       WHERE user_id = $1
         AND status = 'VERIFIED'
         AND qualification_state = 'DOMAIN_VERIFIED'
         AND suspended_at IS NULL
         AND (expires_at IS NULL OR expires_at > now())
       LIMIT 1`,
      [userId]
    );
    return result.rows.length > 0;
  }

  async castVote({
    userId,
    caseId,
    caseRevision,
    claimId = null,
    contributionId = null,
    targetType = "CASE",
    vote,
  }) {
    if (!userId) throw new Error("VOTER_IDENTITY_REQUIRED");
    if (!caseId) throw new Error("CASE_ID_REQUIRED");
    const safeRevision = Math.max(1, Number(caseRevision) || 1);
    const upperVote = String(vote || "").toUpperCase();
    if (!["BELIEVE", "DOUBT"].includes(upperVote)) {
      throw new Error("INVALID_VOTE_TYPE: Vote must be BELIEVE or DOUBT");
    }
    const safeTargetType = String(targetType || "CASE").toUpperCase();
    if (!["CASE", "CLAIM", "CONTRIBUTION"].includes(safeTargetType)) {
      throw new Error("INVALID_PERCEPTION_TARGET");
    }
    if (safeTargetType === "CASE" && (claimId || contributionId)) {
      throw new Error("PERCEPTION_TARGET_MISMATCH");
    }
    if (safeTargetType === "CLAIM" && (!claimId || contributionId)) {
      throw new Error("PERCEPTION_TARGET_MISMATCH");
    }
    if (safeTargetType === "CONTRIBUTION" && (!contributionId || claimId)) {
      throw new Error("PERCEPTION_TARGET_MISMATCH");
    }

    // BINDING AMENDMENT 4: Never trust client-provided expert status.
    const isExpert = await this.isVerifiedExpert(userId);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Check existing vote on this revision
      const existing = await client.query(
        `SELECT id, vote, voter_is_expert_at_vote
         FROM public.community_perception_votes
         WHERE user_id = $1
           AND case_id = $2
           AND case_revision = $3
           AND coalesce(claim_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce($4, '00000000-0000-0000-0000-000000000000'::uuid)
           AND coalesce(contribution_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce($5, '00000000-0000-0000-0000-000000000000'::uuid)
           AND target_type = $6
         FOR UPDATE`,
        [userId, caseId, safeRevision, claimId, contributionId, safeTargetType]
      );

      let voteId;
      let eventType;

      if (existing.rows.length > 0) {
        const currentVote = existing.rows[0];
        voteId = currentVote.id;

        if (currentVote.vote === upperVote) {
          // Same vote, no-op
          await client.query("COMMIT");
          return { success: true, vote: upperVote, isExpert, changed: false };
        }

        // Update existing vote
        eventType = "VOTE_CHANGED";
        await client.query(
          `UPDATE public.community_perception_votes
           SET vote = $1,
               voter_is_expert_at_vote = $2,
               updated_at = now()
           WHERE id = $3`,
          [upperVote, isExpert, voteId]
        );
      } else {
        // Insert new vote
        eventType = "VOTE_CAST";
        const insertRes = await client.query(
          `INSERT INTO public.community_perception_votes (
            user_id, case_id, case_revision, claim_id, contribution_id,
            target_type, vote, voter_is_expert_at_vote, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
          RETURNING id`,
          [userId, caseId, safeRevision, claimId, contributionId, safeTargetType, upperVote, isExpert]
        );
        voteId = insertRes.rows[0].id;
      }

      // Record immutable event in append-only audit log
      await client.query(
        `INSERT INTO private.community_perception_events (
          vote_id, user_id, case_id, case_revision, claim_id, contribution_id,
          target_type, vote, voter_is_expert, event_type, user_snapshot, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, now())`,
        [voteId, userId, caseId, safeRevision, claimId, contributionId, safeTargetType, upperVote, isExpert, eventType, JSON.stringify({ userId })]
      );

      await client.query("COMMIT");
      return { success: true, vote: upperVote, isExpert, changed: true };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async getSummary({
    caseId,
    caseRevision = 1,
    claimId = null,
    contributionId = null,
    targetType = "CASE",
  }) {
    if (!caseId) return null;
    const safeRevision = Math.max(1, Number(caseRevision) || 1);
    const safeTargetType = ["CASE", "CLAIM", "CONTRIBUTION"].includes(String(targetType).toUpperCase())
      ? String(targetType).toUpperCase()
      : "CASE";

    const result = await this.pool.query(
      `SELECT
         count(*) filter (where vote = 'BELIEVE')::int as total_believe,
         count(*) filter (where vote = 'DOUBT')::int as total_doubt,
         count(*) filter (where vote = 'BELIEVE' and voter_is_expert_at_vote = true)::int as expert_believe,
         count(*) filter (where vote = 'DOUBT' and voter_is_expert_at_vote = true)::int as expert_doubt,
         count(*)::int as total_votes
       FROM public.community_perception_votes
       WHERE case_id = $1
         AND case_revision = $2
         AND coalesce(claim_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce($3, '00000000-0000-0000-0000-000000000000'::uuid)
         AND coalesce(contribution_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce($4, '00000000-0000-0000-0000-000000000000'::uuid)
         AND target_type = $5`,
      [caseId, safeRevision, claimId, contributionId, safeTargetType]
    );

    const row = result.rows[0] || {};
    const totalBelieve = row.total_believe || 0;
    const totalDoubt = row.total_doubt || 0;
    const totalVotes = row.total_votes || 0;

    return {
      caseId,
      caseRevision: safeRevision,
      targetType: safeTargetType,
      totalBelieve,
      totalDoubt,
      totalVotes,
      expertBelieve: row.expert_believe || 0,
      expertDoubt: row.expert_doubt || 0,
      believeRatio: totalVotes > 0 ? Number((totalBelieve / totalVotes).toFixed(4)) : 0,
      doubtRatio: totalVotes > 0 ? Number((totalDoubt / totalVotes).toFixed(4)) : 0,
      disclaimer: "Ý kiến cộng đồng phản ánh góc nhìn và niềm tin của người học, KHÔNG thay thế cho phán quyết bằng chứng của Trust Engine.",
      isAuthoritativeVerdict: false,
    };
  }

  async getUserVote({
    userId,
    caseId,
    caseRevision = 1,
    claimId = null,
    contributionId = null,
    targetType = "CASE",
  }) {
    if (!userId || !caseId) return null;
    const safeRevision = Math.max(1, Number(caseRevision) || 1);
    const safeTargetType = ["CASE", "CLAIM", "CONTRIBUTION"].includes(String(targetType).toUpperCase())
      ? String(targetType).toUpperCase()
      : "CASE";

    const result = await this.pool.query(
      `SELECT vote, voter_is_expert_at_vote, updated_at
       FROM public.community_perception_votes
       WHERE user_id = $1
         AND case_id = $2
         AND case_revision = $3
         AND coalesce(claim_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce($4, '00000000-0000-0000-0000-000000000000'::uuid)
         AND coalesce(contribution_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce($5, '00000000-0000-0000-0000-000000000000'::uuid)
         AND target_type = $6
       LIMIT 1`,
      [userId, caseId, safeRevision, claimId, contributionId, safeTargetType]
    );

    if (result.rows.length === 0) return null;
    return {
      vote: result.rows[0].vote,
      isExpert: result.rows[0].voter_is_expert_at_vote,
      updatedAt: result.rows[0].updated_at,
    };
  }
}
