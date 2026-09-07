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
import { computeTrustInputHash } from "./TrustInputHash.js";
import { buildTrustDecisionEvent, getLabbeConfig } from "../integrations/LabbeBridge.js";
import { LabbeOutboxService } from "../integrations/LabbeOutboxService.js";
import { publishRealtimeEvent } from "../realtime/RealtimePublisher.js";

function resolveOwnerId(principal) {
  if (!principal) return null;
  const rawId = principal.id || principal.subjectId || principal.userId || null;
  if (!rawId || typeof rawId !== "string") return null;
  const cleaned = rawId.replace(/^(student|expert|user):/, "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleaned)
    ? cleaned
    : null;
}

function normalizeIdempotencyKey(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^[A-Za-z0-9._:-]{1,160}$/.test(value.trim())) {
    const error = new Error("TRUST_IDEMPOTENCY_KEY_INVALID: idempotency key is outside the allowed format.");
    error.code = "TRUST_IDEMPOTENCY_KEY_INVALID";
    error.statusCode = 400;
    throw error;
  }
  return value.trim();
}

function sameDigest(left, right) {
  if (!left || !right) return false;
  const toBuffer = (value) => {
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    if (typeof value === "string" && /^\\x[0-9a-f]+$/i.test(value)) return Buffer.from(value.slice(2), "hex");
    if (typeof value === "string" && /^[0-9a-f]{64}$/i.test(value)) return Buffer.from(value, "hex");
    return null;
  };
  const a = toBuffer(left);
  const b = toBuffer(right);
  return Boolean(a && b && a.length === b.length && crypto.timingSafeEqual(a, b));
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
    idempotencyKey = null,
    labbeEnv = process.env,
  }) {
    const ownerId = resolveOwnerId(principal);
    if (!ownerId) {
      // Option B: Ephemeral for anonymous
      return { caseId: null, persisted: false };
    }

    const normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);

    try {
      // 1. Idempotency Check: if identical content hash exists recently, check if retry
      const contentHash = computeTrustInputHash(input);

      const existingCaseId = await DurableTrustRepository.findCaseByInputHash(ownerId, contentHash);
      if (existingCaseId && input.metadata?.isRetry && !normalizedIdempotencyKey) {
        return { caseId: existingCaseId, persisted: true, idempotent: true };
      }

      // 2. Map pipeline to relational DTO
      const durableDto = TrustPersistenceMapper.mapPipelineToDurableRecord({
        pipelineResult,
        input,
        principal,
        requestId,
        idempotencyKey: normalizedIdempotencyKey,
      });

      if (!durableDto) {
        return { caseId: null, persisted: false };
      }

      const labbeConfig = getLabbeConfig(labbeEnv);
      const labbeEvent = ["SHADOW", "STAGING"].includes(labbeConfig.mode)
        ? buildTrustDecisionEvent({
            caseId: durableDto.caseRecord.id,
            caseRevision: 1,
            runId: durableDto.runRecord.id,
            pipelineResult,
            correlationId: requestId,
            env: labbeEnv,
          })
        : null;

      // 3. Persist atomically in short transaction
      let caseId;
      try {
        ({ caseId } = await DurableTrustRepository.persistTrustRecord({
          ...durableDto,
          outboxEvents: labbeEvent ? [{ ...labbeEvent, aggregateType: "TRUST_CASE", aggregateId: durableDto.caseRecord.id }] : [],
        }));
      } catch (error) {
        if (normalizedIdempotencyKey && error?.code === "23505") {
          const existingRun = await DurableTrustRepository.findRunByIdempotencyKey(ownerId, normalizedIdempotencyKey);
          if (existingRun) {
            if (!sameDigest(existingRun.input_fingerprint, durableDto.runRecord.inputFingerprint)) {
              const conflict = new Error("TRUST_IDEMPOTENCY_CONFLICT: the key is already bound to a different input.");
              conflict.code = "TRUST_IDEMPOTENCY_CONFLICT";
              conflict.statusCode = 409;
              throw conflict;
            }
            return { caseId: existingRun.case_id, caseRevision: 1, runId: existingRun.id, persisted: true, idempotent: true, passportId: null, labbeQueued: false };
          }
        }
        throw error;
      }

      // Delivery is deliberately after COMMIT.  If the process stops here,
      // the outbox row remains available for a later worker retry.
      if (labbeEvent) {
        LabbeOutboxService.dispatchOne({ env: labbeEnv }).catch((outboxError) => {
          console.error("[TrustPersistenceService] Labbe outbox dispatch deferred:", outboxError.message);
        });
      }

      // Realtime is a projection of the committed Trust revision.  The
      // durable event log is written only after the case/outbox transaction
      // returned successfully; a publication outage cannot roll back the
      // business result and is recoverable by the domain outbox.
      const decision = pipelineResult?.finalDecision || pipelineResult?.decision || {};
      void publishRealtimeEvent({
        channel: "trust",
        eventType: "trust:revision",
        subjectId: ownerId,
        classification: "RESTRICTED",
        producer: "StudentHub-AI",
        environment: process.env.NODE_ENV || "development",
        correlationId: requestId || `trust-${caseId}`,
        causationId: durableDto.runRecord?.id || caseId,
        idempotencyKey: `trust:${durableDto.runRecord?.id || caseId}:revision:1`,
        data: {
          caseId,
          caseRevision: 1,
          runId: durableDto.runRecord?.id || null,
          status: durableDto.runRecord?.status || "COMPLETED",
          security: String(decision.security || "UNKNOWN").slice(0, 80),
          truth: String(decision.truth || "UNKNOWN").slice(0, 80),
          action: String(decision.action || "UNKNOWN").slice(0, 80),
        },
      }).catch(() => {});

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

      return { caseId, caseRevision: 1, runId: durableDto.runRecord.id, persisted: true, passportId, labbeQueued: Boolean(labbeEvent) };
    } catch (err) {
      if (err?.code !== "TRUST_IDEMPOTENCY_CONFLICT") {
        console.error("[TrustPersistenceService] Persistence failure:", err.message);
      }
      throw err;
    }
  }

  /**
   * Records a failed or aborted Trust evaluation for an authenticated user.
   */
  static async recordTrustFailure({
    error,
    principal,
    requestId,
  }) {
    const ownerId = resolveOwnerId(principal);
    if (!ownerId) return { persisted: false };

    const pool = getPostgresPool();
    const caseId = crypto.randomUUID();
    let client = null;

    try {
      client = await pool.connect();
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO public.trust_cases (id, owner_id, state, visibility, created_at, updated_at)
         VALUES ($1, $2, 'FAILED', 'PRIVATE', now(), now())`,
        [caseId, ownerId]
      );

      await client.query(
        `INSERT INTO private.audit_events (event_type, actor_id, target_type, target_id, request_id, occurred_at, metadata)
         VALUES ('TRUST_CASE_FAILED', $1, 'TRUST_CASE', $2, $3, now(), $4)`,
        [ownerId, caseId, requestId || null, JSON.stringify({ error: String(error?.message || "UNKNOWN_ERROR").slice(0, 500) })]
      );
      await client.query("COMMIT");

      return { caseId, persisted: true };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("[TrustPersistenceService] Failure logging error:", err.message);
      return { persisted: false };
    } finally {
      client?.release();
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
