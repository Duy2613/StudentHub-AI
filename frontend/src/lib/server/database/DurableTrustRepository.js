/**
 * StudentHub AI — DurableTrustRepository
 * 
 * Production PostgreSQL persistence engine for the Native Trust Engine V5.
 * Strictly adheres to OPTION B (Canonical Authenticated-Only Persistence):
 * - Persists durable records ONLY for authenticated principals with a valid auth.users UUID.
 * - Anonymous requests remain purely ephemeral and are rejected by this repository.
 * - Enforces immutable foreign key `owner_id NOT NULL REFERENCES auth.users(id)`.
 * - Records full verification graph: case_inputs, entities (deduplicated), evidence, claims, claim_sources, and audit_events.
 */

import crypto from "node:crypto";
import { getPostgresPool } from "./PostgresPool.js";
import { computeTrustInputHash } from "./TrustInputHash.js";
import { validateLabbeEvent } from "../integrations/LabbeBridge.js";

function computeSha256(val, normalize = true) {
  const value = String(val).trim();
  return crypto.createHash("sha256").update(normalize ? value.toLowerCase() : value).digest();
}

function digestBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value !== "string") return null;
  if (/^\\x[0-9a-f]+$/i.test(value)) return Buffer.from(value.slice(2), "hex");
  if (/^[0-9a-f]{64}$/i.test(value)) return Buffer.from(value, "hex");
  return null;
}

export class DurableTrustRepository {
  /**
   * Persists a complete verification record into PostgreSQL within a single atomic transaction.
   * STRICT REQUIREMENT: caseRecord.ownerId must be a valid authenticated user ID.
   * 
   * @param {object} params
   * @param {object} params.caseRecord - { id, ownerId, state, visibility }
   * @param {object} params.input - { id, type, content, metadata }
   * @param {Array<object>} params.entities - Array of { entityType, value, relationType, confidence }
   * @param {Array<object>} params.evidence - Array of { id, sourceType, identifier, observedAt, extractorVersion, confidence, provenance }
   * @param {Array<object>} params.claims - Array of { id, statement, status, evidenceRelations: [{ evidenceId, relation }] }
   * @param {object} [params.audit] - Optional audit metadata { eventType, actorId, requestId, metadata }
   * @returns {Promise<{ caseId: string, persisted: boolean, counts: object }>}
   */
  static async persistTrustRecord({
    caseRecord = {},
    input = {},
    entities = [],
    evidence = [],
    claims = [],
    audit = null,
    runRecord = null,
    stageRuns = [],
    caseRevision = null,
    verdictRevision = null,
    outboxEvents = [],
    pool: suppliedPool = null,
  }) {
    const ownerId = caseRecord.ownerId;
    if (!ownerId || typeof ownerId !== "string" || !ownerId.trim()) {
      throw new Error("AUTHENTICATED_OWNER_REQUIRED: Durable trust case persistence requires a valid authenticated principal ownerId.");
    }

    const pool = suppliedPool || getPostgresPool();
    const client = await pool.connect();

    const caseId = caseRecord.id || crypto.randomUUID();
    const state = caseRecord.state || "INSUFFICIENT_EVIDENCE";
    const visibility = caseRecord.visibility || "PRIVATE";

    const counts = {
      entities: 0,
      evidence: 0,
      claims: 0,
      claimSources: 0,
      outbox: 0,
    };

    try {
      await client.query("BEGIN");

      // 1. Persist Trust Case (Strict owner_id)
      const caseWrite = await client.query(
        `INSERT INTO public.trust_cases AS target (id, owner_id, state, visibility, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         ON CONFLICT (id) DO UPDATE
         SET state = EXCLUDED.state, visibility = EXCLUDED.visibility, updated_at = now()
         WHERE target.owner_id = EXCLUDED.owner_id
         RETURNING target.id`,
        [caseId, ownerId, state, visibility]
      );
      if (caseWrite.rowCount === 0) {
        throw new Error("TRUST_CASE_OWNER_CONFLICT: case id is already bound to another owner.");
      }

      // 2. Persist Case Input
      const inputId = input.id || crypto.randomUUID();
      const inputType = String(input.type || "text").toLowerCase();
      const contentHash = input.content || Object.keys(input.metadata || {}).length > 0
        ? computeTrustInputHash(input)
        : null;
      const objectKey = input.metadata?.objectKey || input.metadata?.url || (inputType.toUpperCase() === "URL" ? input.content : null);

      const inputWrite = await client.query(
        `INSERT INTO public.case_inputs (id, case_id, input_type, object_key, content_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [inputId, caseId, inputType, objectKey, contentHash]
      );
      if (inputWrite.rowCount === 0) {
        const existingInput = await client.query(
          `SELECT case_id FROM public.case_inputs WHERE id = $1`,
          [inputId]
        );
        if (existingInput.rows[0]?.case_id !== caseId) {
          throw new Error("TRUST_INPUT_OWNER_CONFLICT: input id is already bound to another case.");
        }
      }

      // 3. Persist Entities & Case-Entity Relations (Deduplicated across cases)
      for (const ent of entities) {
        if (!ent.entityType || !ent.value) continue;
        const normVal = String(ent.value).trim();
        const valHash = computeSha256(normVal);

        const entRes = await client.query(
          `INSERT INTO public.entities (entity_type, normalized_value, value_hash, created_at)
           VALUES ($1, $2, $3, now())
           ON CONFLICT (entity_type, value_hash) DO UPDATE
           SET normalized_value = EXCLUDED.normalized_value
           RETURNING id`,
          [ent.entityType.toUpperCase(), normVal, valHash]
        );

        const entityId = entRes.rows[0]?.id;
        if (entityId) {
          const relation = (ent.relationType || "TARGET").toUpperCase();
          const conf = Number.isFinite(ent.confidence) ? Math.min(1, Math.max(0, ent.confidence)) : null;

          await client.query(
            `INSERT INTO public.case_entities (case_id, entity_id, relation_type, confidence)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (case_id, entity_id, relation_type) DO UPDATE
             SET confidence = EXCLUDED.confidence`,
            [caseId, entityId, relation, conf]
          );
          counts.entities++;
        }
      }

      // 4. Persist Evidence Items
      const evidenceIdMap = new Map();
      for (const ev of evidence) {
        const evId = ev.id || crypto.randomUUID();
        const srcType = String(ev.sourceType || "TRUST_ENGINE").toUpperCase();
        const srcIdent = ev.identifier ? String(ev.identifier).slice(0, 500) : null;
        const observedAt = ev.observedAt ? new Date(ev.observedAt) : new Date();
        const extractorVer = ev.extractorVersion ? String(ev.extractorVersion).slice(0, 100) : "v5";
        const conf = Number.isFinite(ev.confidence) ? Math.min(1, Math.max(0, ev.confidence)) : null;
        const provenance = ev.provenance && typeof ev.provenance === "object" ? ev.provenance : {};

        const evidenceWrite = await client.query(
          `INSERT INTO public.evidence AS target (id, case_id, source_type, source_identifier, observed_at, extractor_version, confidence, provenance, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
           ON CONFLICT (id) DO UPDATE
           SET confidence = EXCLUDED.confidence, provenance = EXCLUDED.provenance
           WHERE target.case_id = EXCLUDED.case_id
           RETURNING target.id`,
          [evId, caseId, srcType, srcIdent, observedAt, extractorVer, conf, JSON.stringify(provenance)]
        );
        if (evidenceWrite.rowCount === 0) {
          throw new Error("TRUST_EVIDENCE_CASE_CONFLICT: evidence id is already bound to another case.");
        }

        if (ev.sourceRef) {
          evidenceIdMap.set(ev.sourceRef, evId);
        }
        evidenceIdMap.set(evId, evId);
        counts.evidence++;
      }

      // 5. Persist Claims & Claim Sources
      for (const clm of claims) {
        const claimId = clm.id || crypto.randomUUID();
        const statement = String(clm.statement || "").slice(0, 10_000);
        if (!statement) continue;

        const status = (clm.status || "UNVERIFIED").toUpperCase();
        const claimWrite = await client.query(
          `INSERT INTO public.claims AS target (id, creator_id, statement, status, valid_from, created_at)
           VALUES ($1, $2, $3, $4, now(), now())
           ON CONFLICT (id) DO UPDATE
           SET status = EXCLUDED.status
           WHERE target.creator_id = EXCLUDED.creator_id
           RETURNING target.id`,
          [claimId, ownerId, statement, status]
        );
        if (claimWrite.rowCount === 0) {
          throw new Error("TRUST_CLAIM_OWNER_CONFLICT: claim id is already bound to another owner.");
        }
        counts.claims++;

        // Link Claim Sources
        if (Array.isArray(clm.evidenceRelations)) {
          for (const rel of clm.evidenceRelations) {
            const evId = evidenceIdMap.get(rel.evidenceId);
            if (!evId) continue;
            const relationType = ["SUPPORTS", "CONTRADICTS", "CONTEXT"].includes(rel.relation?.toUpperCase())
              ? rel.relation.toUpperCase()
              : "CONTEXT";

            await client.query(
              `INSERT INTO public.claim_sources (claim_id, evidence_id, relation)
               VALUES ($1, $2, $3)
               ON CONFLICT (claim_id, evidence_id) DO UPDATE
               SET relation = EXCLUDED.relation`,
              [claimId, evId, relationType]
            );
            counts.claimSources++;
          }
        }
      }

      // 6. Record Audit Event
      if (audit) {
        const eventType = String(audit.eventType || "TRUST_CASE_PERSISTED");
        const actorId = ownerId;
        const reqId = audit.requestId || null;
        const meta = audit.metadata && typeof audit.metadata === "object" ? audit.metadata : {};

        await client.query(
          `INSERT INTO private.audit_events (event_type, actor_id, target_type, target_id, request_id, occurred_at, metadata)
           VALUES ($1, $2, 'TRUST_CASE', $3, $4, now(), $5)`,
          [eventType, actorId, caseId, reqId, JSON.stringify(meta)]
        );
      }

      // 7. Persist the execution identity and append-only Trust revisions in
      // the same transaction as the case graph.  A terminal API response is
      // not emitted before this commit succeeds.
      if (runRecord) {
        const runId = runRecord.id;
        if (!runId || !runRecord.caseId || runRecord.caseId !== caseId || runRecord.ownerId !== ownerId) {
          throw new Error("TRUST_RUN_INVALID: run identity must bind to the persisted case and owner.");
        }
        const runWrite = await client.query(
          `INSERT INTO public.trust_runs AS target
            (id, case_id, owner_id, request_id, idempotency_key, input_fingerprint, status, pipeline_version, started_at, completed_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
           ON CONFLICT (id) DO UPDATE
             SET status = EXCLUDED.status, completed_at = EXCLUDED.completed_at
           WHERE target.owner_id = EXCLUDED.owner_id
             AND target.case_id = EXCLUDED.case_id
           RETURNING target.id`,
          [runId, caseId, ownerId, runRecord.requestId || null, runRecord.idempotencyKey || null,
            runRecord.inputFingerprint || null, runRecord.status || "COMPLETED", runRecord.pipelineVersion || "trust.v5",
            new Date(runRecord.startedAt || Date.now()), runRecord.completedAt ? new Date(runRecord.completedAt) : null]
        );
        if (runWrite.rowCount === 0) {
          throw new Error("TRUST_RUN_CONFLICT: run id is already bound to another case or owner.");
        }

        for (const stage of Array.isArray(stageRuns) ? stageRuns : []) {
          await client.query(
            `INSERT INTO public.trust_stage_runs
              (id, run_id, case_id, owner_id, stage_id, stage_index, status, attempt, request_id,
               started_at, completed_at, latency_ms, result_digest, summary, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, now())
             ON CONFLICT (run_id, stage_id, attempt) DO NOTHING`,
            [stage.id || crypto.randomUUID(), runId, caseId, ownerId, stage.stageId, stage.stageIndex,
              stage.status, stage.attempt, stage.requestId || null,
              stage.startedAt ? new Date(stage.startedAt) : null, stage.completedAt ? new Date(stage.completedAt) : null,
              stage.latencyMs, stage.resultDigest || null, JSON.stringify(stage.summary || {})]
          );
        }

        if (caseRevision) {
          const revisionResult = await client.query(
            `INSERT INTO public.trust_case_revisions
              (case_id, owner_id, revision, run_id, state, snapshot, created_at)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb, now())
             ON CONFLICT (case_id, revision) DO NOTHING
             RETURNING id`,
            [caseId, ownerId, caseRevision.revision, runId, caseRevision.state || state, JSON.stringify(caseRevision.snapshot || {})]
          );
          if (revisionResult.rowCount === 0) {
            const existingRevision = await client.query(`SELECT run_id FROM public.trust_case_revisions WHERE case_id = $1 AND revision = $2`, [caseId, caseRevision.revision]);
            if (existingRevision.rows[0]?.run_id !== runId) throw new Error("TRUST_CASE_REVISION_CONFLICT: immutable case revision is bound to another run.");
          }
        }

        if (verdictRevision) {
          const verdictResult = await client.query(
            `INSERT INTO public.trust_verdict_revisions
              (case_id, owner_id, revision, run_id, verdict, decision_digest, created_at)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6, now())
             ON CONFLICT (case_id, revision) DO NOTHING
             RETURNING id`,
            [caseId, ownerId, verdictRevision.revision, runId, JSON.stringify(verdictRevision.verdict || {}), verdictRevision.decisionDigest || null]
          );
          if (verdictResult.rowCount === 0) {
            const existingVerdict = await client.query(`SELECT run_id FROM public.trust_verdict_revisions WHERE case_id = $1 AND revision = $2`, [caseId, verdictRevision.revision]);
            if (existingVerdict.rows[0]?.run_id !== runId) throw new Error("TRUST_VERDICT_REVISION_CONFLICT: immutable verdict revision is bound to another run.");
          }
        }
      }

      // 8. Commit external integrations only through the same durable
      // transaction.  A receiver may retry these rows, but it can never make
      // a successfully persisted Trust case depend on an open network call.
      for (const event of Array.isArray(outboxEvents) ? outboxEvents : []) {
        const validation = validateLabbeEvent(event);
        const normalizedEvent = validation.ok ? validation.event : null;
        const eventId = normalizedEvent?.event_id || "";
        const eventType = normalizedEvent?.event_type || "";
        const integration = typeof event?.integration === "string" ? event.integration.trim().toUpperCase() : "LABBE";
        const payload = normalizedEvent?.payload || null;
        const payloadHash = normalizedEvent?.payload_hash ? Buffer.from(normalizedEvent.payload_hash, "hex") : null;
        if (!validation.ok || !eventId || !eventType || !payload || !payloadHash || integration !== "LABBE") {
          throw new Error("OUTBOX_EVENT_INVALID: durable integration events require a bounded payload and SHA-256 hash.");
        }
        const inserted = await client.query(
          `INSERT INTO private.integration_outbox
            (event_id, integration, aggregate_type, aggregate_id, event_type, schema_version, occurred_at, produced_at,
             producer, environment, correlation_id, causation_id, subject, classification, payload, payload_hash,
             status, attempts, available_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16,
                   'PENDING', 0, now(), now(), now())
           ON CONFLICT (event_id) DO NOTHING
           RETURNING id`,
          [eventId, integration, event.aggregateType || "TRUST_CASE", event.aggregateId || caseId, eventType,
            normalizedEvent.schema_version, new Date(normalizedEvent.occurred_at),
            new Date(normalizedEvent.produced_at), normalizedEvent.producer, normalizedEvent.environment,
            normalizedEvent.correlation_id || requestId || eventId, normalizedEvent.causation_id, normalizedEvent.subject,
            normalizedEvent.classification, JSON.stringify(payload), payloadHash]
        );
        if (inserted.rowCount === 0) {
          const existing = await client.query(
            `SELECT payload_hash FROM private.integration_outbox WHERE event_id = $1`,
            [eventId]
          );
          const existingHash = digestBuffer(existing.rows[0]?.payload_hash);
          if (!existingHash || !existingHash.equals(payloadHash)) {
            throw new Error("OUTBOX_EVENT_CONFLICT: event_id is already bound to different immutable content.");
          }
        } else {
          counts.outbox = (counts.outbox || 0) + 1;
        }
      }

      await client.query("COMMIT");
      return { caseId, persisted: true, counts };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves a full case with inputs, entities, evidence, and claims.
   * 
   * @param {string} caseId 
   * @returns {Promise<object|null>}
   */
  static async getCaseById(caseId) {
    const pool = getPostgresPool();
    const caseRes = await pool.query(
      `SELECT * FROM public.trust_cases WHERE id = $1`,
      [caseId]
    );
    if (caseRes.rows.length === 0) return null;

    const [inputsRes, entitiesRes, evidenceRes, claimsRes] = await Promise.all([
      pool.query(`SELECT * FROM public.case_inputs WHERE case_id = $1`, [caseId]),
      pool.query(
        `SELECT e.entity_type, e.normalized_value, ce.relation_type, ce.confidence
         FROM public.case_entities ce
         JOIN public.entities e ON ce.entity_id = e.id
         WHERE ce.case_id = $1`,
        [caseId]
      ),
      pool.query(`SELECT * FROM public.evidence WHERE case_id = $1 ORDER BY observed_at ASC`, [caseId]),
      pool.query(
        `SELECT c.id, c.statement, c.status, cs.relation, cs.evidence_id
         FROM public.claims c
         JOIN public.claim_sources cs ON c.id = cs.claim_id
         JOIN public.evidence ev ON ev.id = cs.evidence_id AND ev.case_id = $2
         WHERE c.creator_id = $1`,
        [caseRes.rows[0].owner_id, caseId]
      ),
    ]);

    return {
      ...caseRes.rows[0],
      inputs: inputsRes.rows,
      entities: entitiesRes.rows,
      evidence: evidenceRes.rows,
      claims: claimsRes.rows,
    };
  }

  /**
   * Lists paginated trust cases for an authenticated owner.
   * 
   * @param {string} ownerId 
   * @param {object} options 
   * @returns {Promise<Array<object>>}
   */
  static async listCasesByOwner(ownerId, { limit = 20, offset = 0 } = {}) {
    if (!ownerId) return [];
    const pool = getPostgresPool();
    const res = await pool.query(
      `SELECT c.id, c.state, c.visibility, c.created_at, c.updated_at,
              i.input_type, i.object_key, i.content_hash
       FROM public.trust_cases c
       LEFT JOIN LATERAL (
         SELECT input_type, object_key, content_hash
         FROM public.case_inputs
         WHERE case_id = c.id
         ORDER BY created_at ASC
         LIMIT 1
       ) i ON true
       WHERE c.owner_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [ownerId, Math.min(limit, 100), Math.max(offset, 0)]
    );
    return res.rows;
  }

  /**
   * Checks for an existing case by owner and input content hash for idempotency.
   * 
   * @param {string} ownerId 
   * @param {Buffer|string} contentHash 
   * @returns {Promise<string|null>} caseId if found
   */
  static async findCaseByInputHash(ownerId, contentHash) {
    if (!ownerId || !contentHash) return null;
    const pool = getPostgresPool();
    const hashBuf = Buffer.isBuffer(contentHash) ? contentHash : computeTrustInputHash({ content: contentHash });
    const res = await pool.query(
      `SELECT c.id
       FROM public.trust_cases c
       JOIN public.case_inputs i ON c.id = i.case_id
       WHERE c.owner_id = $1 AND i.content_hash = $2
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [ownerId, hashBuf]
    );
    return res.rows[0]?.id || null;
  }

  static async findRunByIdempotencyKey(ownerId, idempotencyKey) {
    if (!ownerId || !idempotencyKey) return null;
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT id, case_id, input_fingerprint, status
         FROM public.trust_runs
        WHERE owner_id = $1 AND idempotency_key = $2
        LIMIT 1`,
      [ownerId, idempotencyKey]
    );
    return result.rows[0] || null;
  }
}
