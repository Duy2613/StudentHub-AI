/**
 * StudentHub AI — ExpertBlindReviewService
 *
 * Implements canonical Blind Parallel Expert Review:
 * - Serves strictly blind DTOs to assigned Experts before submission.
 * - Hides L2, L3, L4, L5, AI verdicts, AI scores, and other experts' votes.
 * - Enforces vote enum: TRUSTWORTHY | UNTRUSTWORTHY | INSUFFICIENT_EVIDENCE.
 * - Validates evidence URLs via SafeRemoteUrl.
 * - Enforces submission immutability (SUBMITTED_ASSESSMENT_IMMUTABLE = YES).
 * - Enforces Reveal Gate: L5 comparison revealed ONLY after Expert submission is LOCKED and L5 is complete.
 */

import { randomUUID } from "node:crypto";
import { getPostgresPool } from "../database/PostgresPool.js";
import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";
import { ExpertReputationPolicy } from "./ExpertReputationPolicy.js";
import { ExpertReviewResolutionService } from "./ExpertReviewResolutionService.js";

export const BLIND_REVIEW_VOTE_ENUM = Object.freeze({
  TRUSTWORTHY: "TRUSTWORTHY",
  UNTRUSTWORTHY: "UNTRUSTWORTHY",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
});

export const BLIND_REVIEW_STATUS = Object.freeze({
  ASSIGNED: "ASSIGNED",
  OPENED: "OPENED",
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  LOCKED: "LOCKED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
});

export const EVIDENCE_SOURCE_TYPES = Object.freeze([
  "OFFICIAL",
  "PRIMARY",
  "INDEPENDENT_MEDIA",
  "ACADEMIC",
  "GOVERNMENT",
  "COMMUNITY",
  "OTHER",
]);

// Ephemeral fallback memory store for serverless/testing environments when DB is mocked or pooling
const ephemeralBlindDrafts = new Map();

export class ExpertBlindReviewService {
  /**
   * Retrieves pending blind reviews assigned to a specific expert.
   * STRICT ANTI-LEAK: Strips all L2-L5 data, AI results, and other experts' votes.
   */
  static async getPendingReviews(expertId) {
    return this.getPendingReviewsForExpert(expertId);
  }

  static async getPendingReviewsForExpert(expertId) {
    if (!expertId) return [];
    const pool = getPostgresPool();

    try {
      const res = await pool.query(
        `SELECT a.id AS assignment_id,
                a.case_id,
                a.case_revision,
                a.domain_code,
                a.status AS assignment_status,
                a.expires_at,
                a.created_at AS assigned_at,
                r.id AS review_request_id,
                r.question,
                r.context_refs,
                c.state AS case_state,
                c.created_at AS case_created_at
           FROM private.expert_assignments a
           JOIN private.expert_review_requests r ON r.id = a.review_request_id
           LEFT JOIN public.trust_cases c ON c.id = a.case_id
          WHERE a.expert_id = $1
            AND a.status IN ('ASSIGNED', 'IN_REVIEW', 'OPENED', 'DRAFT')
            AND (a.expires_at IS NULL OR a.expires_at > now())
          ORDER BY a.created_at DESC`,
        [expertId]
      );

      return res.rows.map((row) => this._buildBlindSummaryDTO(row));
    } catch (err) {
      console.warn("[ExpertBlindReviewService] getPendingReviews fallback:", err.message);
      return [];
    }
  }

  /**
   * Builds public Blind Summary DTO strictly devoid of AI and other expert results.
   */
  static _buildBlindSummaryDTO(row) {
    const contextRefs = Array.isArray(row.context_refs) ? row.context_refs : [];
    const primaryContext = contextRefs[0] || {};
    const claim = primaryContext.claim || row.question || "Mệnh đề đang chờ đánh giá";

    return {
      assignmentId: row.assignment_id,
      reviewRequestId: row.review_request_id,
      caseId: row.case_id,
      caseRevision: Number(row.case_revision || 1),
      domain: row.domain_code,
      claim: String(claim).slice(0, 1000),
      boundedContext: {
        type: row.input_type || primaryContext.inputType || "TEXT",
        snippet: primaryContext.snippet || null,
        url: primaryContext.url || null,
        mediaArtifactId: primaryContext.mediaArtifactId || null,
        timestamp: row.assigned_at,
      },
      status: row.assignment_status,
      deadline: row.expires_at,
      createdAt: row.assigned_at,
      // Invariant: No L2, L3, L4, L5, AI verdicts, or other expert data
    };
  }

  /**
   * Retrieves full blind review dossier for an assigned expert.
   * Enforces BOLA: Expert can ONLY access their own assigned review.
   */
  static async getBlindDossier({ assignmentId, expertId }) {
    if (!assignmentId || !expertId) {
      throw new Error("assignmentId and expertId are required.");
    }
    const pool = getPostgresPool();

    const assignRes = await pool.query(
      `SELECT a.id AS assignment_id,
              a.expert_id,
              a.case_id,
              a.case_revision,
              a.domain_code,
              a.status AS assignment_status,
              a.expires_at,
              a.created_at AS assigned_at,
              r.id AS review_request_id,
              r.question,
              r.context_refs,
              c.state AS case_state,
              c.created_at AS case_created_at
         FROM private.expert_assignments a
         JOIN private.expert_review_requests r ON r.id = a.review_request_id
         LEFT JOIN public.trust_cases c ON c.id = a.case_id
        WHERE a.id = $1`,
      [assignmentId]
    );

    if (!assignRes.rows.length) {
      const error = new Error("ASSIGNMENT_NOT_FOUND: Review assignment does not exist.");
      error.statusCode = 404;
      error.code = "ASSIGNMENT_NOT_FOUND";
      throw error;
    }

    const row = assignRes.rows[0];

    // BOLA Check: Must be the assigned expert
    if (String(row.expert_id) !== String(expertId)) {
      const error = new Error("FORBIDDEN_ASSIGNMENT: Expert is not authorized for this assignment.");
      error.statusCode = 403;
      error.code = "FORBIDDEN_ASSIGNMENT";
      throw error;
    }

    // Check if expert has an existing locked assessment
    const assessRes = await pool.query(
      `SELECT id, assessment, confidence, reasoning, assessment_state, submitted_at, created_at
         FROM public.expert_assessments
        WHERE assignment_id = $1 AND expert_id = $2
        ORDER BY created_at DESC LIMIT 1`,
      [assignmentId, expertId]
    );

    const existingAssessment = assessRes.rows[0] || null;
    const isLocked = existingAssessment && ["SUBMITTED", "LOCKED"].includes(existingAssessment.assessment_state);

    // Retrieve draft if any
    const draftKey = `${expertId}:${assignmentId}`;
    const draft = ephemeralBlindDrafts.get(draftKey) || null;

    const baseDto = this._buildBlindSummaryDTO(row);

    // If assessment is NOT locked: STRICT BLIND MODE
    if (!isLocked) {
      return {
        ...baseDto,
        assessmentState: row.assignment_status,
        isLocked: false,
        ownDraft: draft,
        // AI results strictly omitted
      };
    }

    // Assessment IS locked. Check if L5 has completed to determine if Reveal Gate opens
    const caseRecord = await pool.query(
      `SELECT state FROM public.trust_cases WHERE id = $1`,
      [row.case_id]
    );
    const caseState = caseRecord.rows[0]?.state || "IN_PROGRESS";
    const isL5Completed = caseState !== "IN_PROGRESS" && caseState !== "PROCESSING" && caseState !== "PENDING";

    let parsedAssessment = existingAssessment.assessment;
    if (typeof parsedAssessment === "string") {
      try { parsedAssessment = JSON.parse(parsedAssessment); } catch {}
    }

    const lockedData = {
      ...baseDto,
      assessmentState: "LOCKED",
      isLocked: true,
      submittedAt: existingAssessment.submitted_at || existingAssessment.created_at,
      ownAssessment: {
        vote: parsedAssessment?.verdict || parsedAssessment?.vote,
        confidence: Number(existingAssessment.confidence || parsedAssessment?.confidence || 0),
        reasoning: existingAssessment.reasoning || parsedAssessment?.reasoning,
        evidence: parsedAssessment?.evidence || [],
      },
    };

    if (!isL5Completed) {
      // REVEAL GATE CLOSED: L5 is not ready yet
      return {
        ...lockedData,
        revealGate: "WAITING_FOR_L5",
        revealMessage: "Đánh giá của bạn đã được ghi nhận và khóa an toàn. Kết quả Trust đang được hoàn tất độc lập.",
      };
    }

    // REVEAL GATE OPEN: Reveal post-L5 comparison and calibration
    const resolution = ExpertReviewResolutionService.compareAndCalibrate({
      expertVote: lockedData.ownAssessment.vote,
      expertConfidence: lockedData.ownAssessment.confidence,
      expertEvidence: lockedData.ownAssessment.evidence,
      trustVerdict: caseState,
      caseId: row.case_id,
    });

    return {
      ...lockedData,
      revealGate: "REVEALED",
      trustResult: {
        verdict: caseState,
        completed: true,
      },
      resolution,
    };
  }

  /**
   * Saves in-progress draft for the assigned expert.
   */
  static async saveDraft({ assignmentId, expertId, draft }) {
    if (!assignmentId || !expertId) throw new Error("assignmentId and expertId required.");
    const pool = getPostgresPool();

    // Verify assignment ownership
    const assignCheck = await pool.query(
      `SELECT id, status FROM private.expert_assignments WHERE id = $1 AND expert_id = $2`,
      [assignmentId, expertId]
    );
    if (!assignCheck.rows.length) {
      const error = new Error("FORBIDDEN_ASSIGNMENT: Assignment not found or access denied.");
      error.statusCode = 403;
      error.code = "FORBIDDEN_ASSIGNMENT";
      throw error;
    }
    if (["COMPLETED", "LOCKED"].includes(assignCheck.rows[0].status)) {
      const error = new Error("SUBMISSION_LOCKED: Cannot edit draft of a submitted assessment.");
      error.statusCode = 409;
      error.code = "SUBMISSION_LOCKED";
      throw error;
    }

    // Save in ephemeral store and update status
    const draftKey = `${expertId}:${assignmentId}`;
    ephemeralBlindDrafts.set(draftKey, {
      ...draft,
      savedAt: new Date().toISOString(),
    });

    await pool.query(
      `UPDATE private.expert_assignments SET status = 'IN_REVIEW', updated_at = now() WHERE id = $1`,
      [assignmentId]
    );

    return { ok: true, savedAt: new Date().toISOString() };
  }

  /**
   * Submits canonical blind assessment.
   * Once submitted, assessment is LOCKED and immutable.
   */
  static async submitAssessment(params) {
    return this.submitBlindAssessment(params);
  }

  static async submitBlindAssessment({
    assignmentId,
    expertId,
    vote,
    confidence,
    reasoning,
    evidence = [],
    evidenceList = null,
    idempotencyKey = null,
  }) {
    const rawEvidence = evidenceList || evidence || [];
    if (!assignmentId || !expertId) {
      throw new Error("assignmentId and expertId are required.");
    }

    // 1. Validate Vote Enum
    const validVotes = Object.values(BLIND_REVIEW_VOTE_ENUM);
    if (!validVotes.includes(String(vote).toUpperCase())) {
      const error = new Error(`INVALID_VOTE: Vote must be one of [${validVotes.join(", ")}].`);
      error.statusCode = 400;
      error.code = "INVALID_VOTE";
      throw error;
    }
    const normalizedVote = String(vote).toUpperCase();

    // 2. Validate Confidence (0..100 or 0..1)
    let numConf = Number(confidence);
    if (!Number.isFinite(numConf) || numConf < 0 || numConf > 100) {
      const error = new Error("INVALID_CONFIDENCE: Confidence must be a number between 0 and 100.");
      error.statusCode = 400;
      error.code = "INVALID_CONFIDENCE";
      throw error;
    }
    const normalizedConfidence = numConf > 1 ? numConf / 100 : numConf;

    // 3. Validate Reasoning
    const cleanReasoning = String(reasoning || "").trim();
    if (cleanReasoning.length < 10) {
      const error = new Error("REASONING_REQUIRED: Phân tích lập luận phải có ít nhất 10 ký tự.");
      error.statusCode = 400;
      error.code = "REASONING_REQUIRED";
      throw error;
    }

    // 4. Validate Evidence URLs with SafeRemoteUrl
    const validatedEvidence = [];
    if (Array.isArray(rawEvidence)) {
      for (const item of rawEvidence) {
        if (!item || typeof item !== "object") continue;
        const rawUrl = String(item.url || "").trim();
        if (rawUrl) {
          const guard = validateRemoteUrlSync(rawUrl);
          if (!guard.ok) {
            const error = new Error(`UNSAFE_EVIDENCE_URL: Bằng chứng URL "${rawUrl}" không an toàn (${guard.code}).`);
            error.statusCode = 400;
            error.code = "UNSAFE_EVIDENCE_URL";
            throw error;
          }
          validatedEvidence.push({
            url: guard.url,
            sourceType: EVIDENCE_SOURCE_TYPES.includes(String(item.sourceType).toUpperCase())
              ? String(item.sourceType).toUpperCase()
              : "OTHER",
            title: String(item.title || "").slice(0, 200),
            note: String(item.note || "").slice(0, 1000),
            observedAt: new Date().toISOString(),
          });
        }
      }
    }

    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Verify assignment and lock state
      const assignRes = await client.query(
        `SELECT a.id, a.case_id, a.case_revision, a.domain_code, a.status, a.expires_at
           FROM private.expert_assignments a
          WHERE a.id = $1 AND a.expert_id = $2
            FOR UPDATE`,
        [assignmentId, expertId]
      );

      if (!assignRes.rows.length) {
        const error = new Error("FORBIDDEN_ASSIGNMENT: Assignment not found or unauthorized.");
        error.statusCode = 403;
        error.code = "FORBIDDEN_ASSIGNMENT";
        throw error;
      }

      const assignment = assignRes.rows[0];

      const finalIdempotencyKey = idempotencyKey || `blind_assessment:${assignmentId}`;

      // SUBMITTED_ASSESSMENT_IMMUTABLE & IDEMPOTENCY RULE
      if (["COMPLETED", "LOCKED"].includes(assignment.status)) {
        const existingAssess = await client.query(
          `SELECT id, assessment, confidence, reasoning, assessment_state, idempotency_key, submitted_at
             FROM public.expert_assessments
            WHERE assignment_id = $1
            LIMIT 1`,
          [assignmentId]
        );

        if (existingAssess.rows.length > 0 && existingAssess.rows[0].idempotency_key === finalIdempotencyKey) {
          await client.query("COMMIT");
          return {
            ok: true,
            idempotent: true,
            assessmentId: existingAssess.rows[0].id,
            assignmentId,
            caseId: assignment.case_id,
            assessmentState: "LOCKED",
            submittedAt: existingAssess.rows[0].submitted_at,
            message: "Đánh giá đã được ghi nhận trước đó (idempotent).",
          };
        }

        const error = new Error("SUBMISSION_LOCKED: Assessment is already submitted and locked. Modifications are forbidden.");
        error.statusCode = 409;
        error.code = "SUBMISSION_LOCKED";
        throw error;
      }

      if (assignment.expires_at && new Date(assignment.expires_at).getTime() <= Date.now()) {
        const error = new Error("ASSIGNMENT_EXPIRED: The assignment deadline has passed.");
        error.statusCode = 409;
        error.code = "ASSIGNMENT_EXPIRED";
        throw error;
      }

      const submittedAt = new Date().toISOString();
      const assessmentPayload = {
        verdict: normalizedVote,
        confidence: normalizedConfidence,
        reasoning: cleanReasoning,
        evidence: validatedEvidence,
        blindReview: true,
        submittedAt,
      };

      // Insert into public.expert_assessments
      const assessInsert = await client.query(
        `INSERT INTO public.expert_assessments
          (id, expert_id, case_id, domain_code, assessment, confidence, assignment_id,
           case_revision, assessment_state, conclusion_within_scope, reasoning,
           evidence_revision_ids, missing_evidence, coi_declared, coi_state,
           qualification_policy_version, policy_version, idempotency_key, submitted_at, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, 'SUBMITTED', $9, $10, '[]'::jsonb, '[]'::jsonb,
                 true, 'DECLARED_NO_CONFLICT', 'expert-qualification-v1', 'expert-blind-v1', $11, now(), now())
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [
          randomUUID(),
          expertId,
          assignment.case_id,
          assignment.domain_code,
          JSON.stringify(assessmentPayload),
          normalizedConfidence,
          assignmentId,
          assignment.case_revision || 1,
          normalizedVote,
          cleanReasoning,
          finalIdempotencyKey,
        ]
      );

      const assessmentId = assessInsert.rows[0]?.id || randomUUID();

      // Lock assignment
      await client.query(
        `UPDATE private.expert_assignments
            SET status = 'COMPLETED', updated_at = now()
          WHERE id = $1`,
        [assignmentId]
      );

      // Reward canonical reputation event: +5 points for completed assessment (V1 preserved)
      const repKey = `assessment_completion:${assessmentId}`;
      await client.query(
        `INSERT INTO private.reputation_events
          (user_id, domain_code, event_type, delta, reason, actor_id, idempotency_key, created_at)
         VALUES ($1, $2, 'EXPERT_ASSESSMENT_COMPLETED', 5, $3, $1, $4, now())
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          expertId,
          assignment.domain_code,
          `Blind expert review submitted for case ${assignment.case_id} revision ${assignment.case_revision || 1}`,
          repKey,
        ]
      );

      await client.query("COMMIT");

      // Clear draft
      ephemeralBlindDrafts.delete(`${expertId}:${assignmentId}`);

      return {
        ok: true,
        assessmentId,
        assignmentId,
        caseId: assignment.case_id,
        assessmentState: "LOCKED",
        vote: normalizedVote,
        confidence: normalizedConfidence,
        submittedAt,
        message: "Đánh giá của bạn đã được ghi nhận và khóa thành công. Kết quả Trust sẽ được so sánh khi hoàn tất.",
      };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
}
