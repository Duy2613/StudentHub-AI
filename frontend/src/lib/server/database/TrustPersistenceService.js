/**
 * StudentHub AI — TrustPersistenceService
 * 
 * Unified service coordinating durable Trust Case persistence, idempotency,
 * failure recording, and Evidence Passport binding.
 * Adheres strictly to Option B (Authenticated-Only Persistence).
 */

import crypto from "node:crypto";
import { DurableTrustRepository } from "./DurableTrustRepository.js";
import { TrustPersistenceMapper } from "../../ai-trust/v5/TrustPersistenceMapper.js";
import { TrustCasePassportBinder } from "../../intelligence/passport/TrustCasePassportBinder.js";
import { getPostgresPool } from "./PostgresPool.js";

function resolveOwnerId(principal) {
  if (!principal) return null;
  const rawId = principal.id || principal.subjectId || principal.userId || null;
  if (!rawId || typeof rawId !== "string") return null;

  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
  const match = rawId.match(uuidRegex);
  return match ? match[0] : null;
}

export class TrustPersistenceService {
  /**
   * Persists a successful Trust Engine run if the caller is authenticated.
   * Enforces idempotency to prevent duplicate cases on immediate retry.
   * 
   * @param {object} params
   * @param {object} params.pipelineResult
   * @param {object} params.input
   * @param {object} params.principal
   * @param {string} params.requestId
   * @returns {Promise<{ caseId: string|null, persisted: boolean, passportId?: string|null }>}
   */
  static async recordTrustExecution({
    pipelineResult,
    input,
    principal,
    requestId,
  }) {
    const ownerId = resolveOwnerId(principal);
    if (!ownerId) {
      // Option B: Ephemeral for anonymous
      return { caseId: null, persisted: false };
    }

    try {
      // 1. Idempotency Check: if identical content hash exists recently, check if retry
      const contentHash = crypto.createHash("sha256")
        .update(String(input.content || "").trim().toLowerCase())
        .digest();

      const existingCaseId = await DurableTrustRepository.findCaseByInputHash(ownerId, contentHash);
      if (existingCaseId && input.metadata?.isRetry) {
        return { caseId: existingCaseId, persisted: true, idempotent: true };
      }

      // 2. Map pipeline to relational DTO
      const durableDto = TrustPersistenceMapper.mapPipelineToDurableRecord({
        pipelineResult,
        input,
        principal,
        requestId,
      });

      if (!durableDto) {
        return { caseId: null, persisted: false };
      }

      // 3. Persist atomically in short transaction
      const { caseId } = await DurableTrustRepository.persistTrustRecord(durableDto);

      // 4. Bind to Living Evidence Passport
      let passportId = null;
      try {
        const passport = await TrustCasePassportBinder.bindCaseToPassport({
          caseId,
          ownerId,
          pipelineResult,
          input,
        });
        passportId = passport?.id || null;
      } catch (passportErr) {
        console.error("[TrustPersistenceService] Passport binding non-fatal error:", passportErr.message);
      }

      return { caseId, persisted: true, passportId };
    } catch (err) {
      console.error("[TrustPersistenceService] Persistence failure:", err.message);
      throw err;
    }
  }

  /**
   * Records a failed or aborted Trust evaluation for an authenticated user.
   */
  static async recordTrustFailure({
    error,
    input,
    principal,
    requestId,
  }) {
    const ownerId = resolveOwnerId(principal);
    if (!ownerId) return { persisted: false };

    const pool = getPostgresPool();
    const caseId = crypto.randomUUID();

    try {
      await pool.query(
        `INSERT INTO public.trust_cases (id, owner_id, state, visibility, created_at, updated_at)
         VALUES ($1, $2, 'FAILED', 'PRIVATE', now(), now())`,
        [caseId, ownerId]
      );

      await pool.query(
        `INSERT INTO private.audit_events (event_type, actor_id, target_type, target_id, request_id, occurred_at, metadata)
         VALUES ('TRUST_CASE_FAILED', $1, 'TRUST_CASE', $2, $3, now(), $4)`,
        [ownerId, caseId, requestId || null, JSON.stringify({ error: error?.message || "UNKNOWN_ERROR" })]
      );

      return { caseId, persisted: true };
    } catch (err) {
      console.error("[TrustPersistenceService] Failure logging error:", err.message);
      return { persisted: false };
    }
  }

  /**
   * Retrieves full case details ensuring ownership isolation.
   * Throws 403/404 if case does not belong to ownerId.
   */
  static async getCaseForOwner(caseId, ownerId) {
    if (!caseId || !ownerId) return null;
    const record = await DurableTrustRepository.getCaseById(caseId);
    if (!record) return null;
    if (record.owner_id !== ownerId) return null; // IDOR defense
    return record;
  }

  /**
   * Lists paginated cases for authenticated owner.
   */
  static async listCasesForOwner(ownerId, options = {}) {
    if (!ownerId) return [];
    return DurableTrustRepository.listCasesByOwner(ownerId, options);
  }
}
