/**
 * StudentHub AI — ExpertBlindReviewDispatcher
 *
 * Implements the canonical L1 trigger for Blind Parallel Expert Review:
 * - Triggered when L1 has successfully extracted/frozen the canonical claim/context.
 * - Creates a durable public.expert_review_requests entry.
 * - Dispatches assignments to eligible verified Experts in private.expert_assignments.
 * - Emits EXPERT_BLIND_REVIEW_AVAILABLE realtime event to eligible Experts.
 * - Executes in PARALLEL: Does NOT block or stall downstream Trust stages (L2A..L5).
 */

import { createHash, randomUUID } from "node:crypto";
import { getPostgresPool } from "../database/PostgresPool.js";
import { publishRealtimeEvent } from "../realtime/RealtimePublisher.js";

const DEFAULT_DOMAIN = "GENERAL_EPISTEMICS";

export class ExpertBlindReviewDispatcher {
  /**
   * Dispatches blind review request upon L1 claim completion.
   *
   * @param {object} params
   * @param {string} params.caseId - Canonical trust case ID
   * @param {number} [params.caseRevision=1]
   * @param {string} [params.ownerId] - Case owner UUID
   * @param {object} params.input - User input ({ type, content, metadata })
   * @param {object} params.l1Result - Layer 1 screen output with claim
   * @param {string} [params.requestId]
   * @returns {Promise<{ ok: boolean, reviewRequestId?: string, assignmentsCount: number }>}
   */
  static async dispatchOnL1ClaimReady({
    caseId,
    caseRevision = 1,
    ownerId = null,
    input = {},
    l1Result = {},
    requestId = "req",
  }) {
    if (!caseId) {
      return { ok: false, error: "CASE_ID_REQUIRED", assignmentsCount: 0 };
    }

    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
      // 1. Extract canonical claim text
      const rawClaim =
        l1Result.canonicalClaim ||
        l1Result.claim ||
        l1Result.extractedClaim ||
        input.content ||
        input.metadata?.url ||
        input.metadata?.ocrText ||
        "Nội dung cần xác minh";

      const claimText = String(rawClaim).trim().slice(0, 1000);
      const domainCode = String(input.metadata?.domainCode || l1Result.domainCode || DEFAULT_DOMAIN).toUpperCase();

      const contextRef = {
        claim: claimText,
        inputType: input.type || "text",
        url: input.metadata?.url || null,
        mediaArtifactId: input.metadata?.mediaArtifactId || null,
        snippet: claimText.slice(0, 300),
        timestamp: new Date().toISOString(),
      };

      await client.query("BEGIN");

      // Ensure public.trust_cases exists to satisfy foreign key constraints
      const caseOwnerUuid = ownerId && /^[0-9a-f-]{36}$/i.test(ownerId) ? ownerId : null;
      if (caseOwnerUuid) {
        await client.query(
          `INSERT INTO public.trust_cases (id, owner_id, state, visibility, created_at, updated_at)
           VALUES ($1, $2, 'RUNNING', 'PRIVATE', now(), now())
           ON CONFLICT (id) DO NOTHING`,
          [caseId, caseOwnerUuid]
        );
      }

      // 2. Insert or get expert_review_request
      const requestKey = `blind_req:${caseId}:${caseRevision}`;
      const existingReq = await client.query(
        `SELECT id FROM private.expert_review_requests WHERE idempotency_key = $1`,
        [requestKey]
      );

      let reviewRequestId = existingReq.rows[0]?.id;
      if (!reviewRequestId) {
        reviewRequestId = randomUUID();
        const requesterUuid = ownerId && /^[0-9a-f-]{36}$/i.test(ownerId)
          ? ownerId
          : "00000000-0000-0000-0000-000000000000";

        const safeQuestion = ("Đánh giá độc lập cho nhận định: " + (claimText || "Khảo sát tính xác thực")).padEnd(25, " ").slice(0, 4000);
        const requestDigest = createHash("sha256")
          .update(JSON.stringify({
            requesterId: requesterUuid,
            caseId,
            caseRevision,
            domainCode,
            requestKey,
          }))
          .digest();

        await client.query(
          `INSERT INTO private.expert_review_requests
            (id, requester_id, case_id, case_revision, domain_code, question, context_refs, status, idempotency_key, request_digest, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'REQUESTED', $8, $9, now(), now())
           ON CONFLICT (id) DO NOTHING`,
          [
            reviewRequestId,
            requesterUuid,
            caseId,
            caseRevision,
            domainCode,
            safeQuestion,
            JSON.stringify([contextRef]),
            requestKey,
            requestDigest,
          ]
        );
      }

      // 3. Find eligible verified experts for domain
      const expertsRes = await client.query(
        `SELECT DISTINCT ev.user_id
           FROM private.expert_verifications ev
          WHERE ev.status = 'VERIFIED'
            AND ev.qualification_state = 'DOMAIN_VERIFIED'
            AND ev.suspended_at IS NULL
            AND (ev.expires_at IS NULL OR ev.expires_at > now())
            AND ev.domain_code = ANY($1::text[])
            AND ev.user_id != COALESCE($2::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
          LIMIT 10`,
        [[domainCode, DEFAULT_DOMAIN], ownerId && /^[0-9a-f-]{36}$/i.test(ownerId) ? ownerId : null]
      );

      let assignmentsCount = 0;
      const assignedExpertIds = [];

      for (const row of expertsRes.rows) {
        const expertId = row.user_id;
        const assignmentKey = `blind_assign:${caseId}:${caseRevision}:${expertId}`;
        const assignmentId = randomUUID();
        const assignerUuid = ownerId && /^[0-9a-f-]{36}$/i.test(ownerId) ? ownerId : expertId;

        const existingAssignment = await client.query(
          `SELECT id FROM private.expert_assignments
            WHERE expert_id = $1 AND review_request_id = $2
            LIMIT 1`,
          [expertId, reviewRequestId]
        );

        if (existingAssignment.rows.length > 0) {
          assignedExpertIds.push({ expertId, assignmentId: existingAssignment.rows[0].id });
          continue;
        }

        const insertRes = await client.query(
          `INSERT INTO private.expert_assignments
            (id, expert_id, case_id, case_revision, domain_code, status, assigned_by, expires_at, review_request_id, idempotency_key, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'ASSIGNED', $6, now() + interval '24 hours', $7, $8, now(), now())
           RETURNING id`,
          [
            assignmentId,
            expertId,
            caseId,
            caseRevision,
            domainCode,
            assignerUuid,
            reviewRequestId,
            assignmentKey,
          ]
        );

        if (insertRes.rows.length > 0) {
          assignmentsCount++;
          assignedExpertIds.push({ expertId, assignmentId });
        }
      }

      if (assignmentsCount > 0) {
        await client.query(
          `UPDATE private.expert_review_requests
              SET status = 'ASSIGNED', updated_at = now()
            WHERE id = $1`,
          [reviewRequestId]
        );
      }

      await client.query("COMMIT");

      // 4. Emit Realtime Notifications after commit (Minimal payload, no private claim leak)
      for (const item of assignedExpertIds) {
        void publishRealtimeEvent({
          channel: `expert:${item.expertId}`,
          eventType: "EXPERT_BLIND_REVIEW_AVAILABLE",
          subjectId: item.expertId,
          classification: "RESTRICTED",
          producer: "StudentHub-Expert-Dispatcher",
          environment: process.env.NODE_ENV || "development",
          correlationId: requestId,
          idempotencyKey: `notif:blind:${item.assignmentId}`,
          data: {
            assignmentId: item.assignmentId,
            reviewRequestId,
            caseId,
            domain: domainCode,
          },
        }).catch(() => {});
      }

      return {
        ok: true,
        reviewRequestId,
        assignmentsCount,
        dispatchedExperts: assignedExpertIds.map((a) => a.expertId),
      };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      console.warn("[ExpertBlindReviewDispatcher] dispatch failed:", err.message);
      return { ok: false, error: err.message, assignmentsCount: 0 };
    } finally {
      client.release();
    }
  }
}
