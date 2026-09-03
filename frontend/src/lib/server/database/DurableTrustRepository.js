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

function computeSha256(val) {
  return crypto.createHash("sha256").update(String(val).trim().toLowerCase()).digest();
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
  }) {
    const ownerId = caseRecord.ownerId;
    if (!ownerId || typeof ownerId !== "string" || !ownerId.trim()) {
      throw new Error("AUTHENTICATED_OWNER_REQUIRED: Durable trust case persistence requires a valid authenticated principal ownerId.");
    }

    const pool = getPostgresPool();
    const client = await pool.connect();

    const caseId = caseRecord.id || crypto.randomUUID();
    const state = caseRecord.state || "INSUFFICIENT_EVIDENCE";
    const visibility = caseRecord.visibility || "PRIVATE";

    const counts = {
      entities: 0,
      evidence: 0,
      claims: 0,
      claimSources: 0,
    };

    try {
      await client.query("BEGIN");

      // 1. Persist Trust Case (Strict owner_id)
      await client.query(
        `INSERT INTO public.trust_cases (id, owner_id, state, visibility, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         ON CONFLICT (id) DO UPDATE
         SET state = EXCLUDED.state, visibility = EXCLUDED.visibility, updated_at = now()`,
        [caseId, ownerId, state, visibility]
      );

      // 2. Persist Case Input
      const inputId = input.id || crypto.randomUUID();
      const inputType = String(input.type || "text").toLowerCase();
      const contentHash = input.content ? computeSha256(input.content) : null;
      const objectKey = input.metadata?.objectKey || input.metadata?.url || (inputType.toUpperCase() === "URL" ? input.content : null);

      await client.query(
        `INSERT INTO public.case_inputs (id, case_id, input_type, object_key, content_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (id) DO NOTHING`,
        [inputId, caseId, inputType, objectKey, contentHash]
      );

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

        await client.query(
          `INSERT INTO public.evidence (id, case_id, source_type, source_identifier, observed_at, extractor_version, confidence, provenance, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
           ON CONFLICT (id) DO UPDATE
           SET confidence = EXCLUDED.confidence, provenance = EXCLUDED.provenance`,
          [evId, caseId, srcType, srcIdent, observedAt, extractorVer, conf, JSON.stringify(provenance)]
        );

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
        await client.query(
          `INSERT INTO public.claims (id, creator_id, statement, status, valid_from, created_at)
           VALUES ($1, $2, $3, $4, now(), now())
           ON CONFLICT (id) DO UPDATE
           SET status = EXCLUDED.status`,
          [claimId, ownerId, statement, status]
        );
        counts.claims++;

        // Link Claim Sources
        if (Array.isArray(clm.evidenceRelations)) {
          for (const rel of clm.evidenceRelations) {
            const evId = evidenceIdMap.get(rel.evidenceId) || rel.evidenceId;
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
         LEFT JOIN public.claim_sources cs ON c.id = cs.claim_id
         WHERE c.creator_id = $1`,
        [caseRes.rows[0].owner_id]
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
    const hashBuf = Buffer.isBuffer(contentHash) ? contentHash : computeSha256(contentHash);
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
}
