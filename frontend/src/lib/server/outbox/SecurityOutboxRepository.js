/**
 * StudentHub AI — SecurityOutboxRepository
 * 
 * Manages transactional persistence and bounded leasing of the security outbox.
 * Supports:
 * - Atomic transactional insert within existing PostgreSQL transactions
 * - Concurrency-safe batch leasing with FOR UPDATE SKIP LOCKED
 * - Exponential backoff scheduling and Dead-Letter state transitions
 * - Durable File Adapter / In-Memory fallback for test sandboxes
 */

import crypto from "node:crypto";
import { getPostgresPool } from "../database/PostgresPool.js";
import { DatabaseAdapter } from "../../db/DatabaseAdapter.js";

export const OUTBOX_STATE = Object.freeze({
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  DEAD_LETTER: "DEAD_LETTER",
});

export class SecurityOutboxRepository {
  /**
   * Inserts an outbox record inside an existing PostgreSQL client transaction.
   * STRICT REQUIREMENT: client must be an active pg Client inside BEGIN ... COMMIT.
   * 
   * @param {object} params
   * @param {import("pg").PoolClient} params.client
   * @param {object} params.envelope - Standard envelope from SecurityOutboxTransformer
   * @param {number} [params.maxAttempts=5]
   * @returns {Promise<{ outboxId: string, eventId: string }>}
   */
  static async insertInTransaction({ client, envelope, maxAttempts = 5 }) {
    if (!client || typeof client.query !== "function") {
      throw new TypeError("SecurityOutboxRepository.insertInTransaction requires an active pg client.");
    }
    if (!envelope || !envelope.eventId || !envelope.payloadHash) {
      throw new ValueError("Invalid envelope supplied to security outbox.");
    }

    const outboxId = crypto.randomUUID();
    await client.query(
      `INSERT INTO public.security_outbox (
         id, event_id, event_type, schema_version, classification,
         payload, payload_hash, delivery_state, attempt_count, max_attempts,
         next_attempt_at, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', 0, $8, now(), now(), now())
       ON CONFLICT (event_id) DO NOTHING`,
      [
        outboxId,
        envelope.eventId,
        envelope.eventType,
        envelope.schemaVersion || "studenthub-security-event-v1",
        envelope.classification || "INTERNAL",
        JSON.stringify(envelope.payload || {}),
        envelope.payloadHash,
        maxAttempts,
      ]
    );

    return { outboxId, eventId: envelope.eventId };
  }

  /**
   * Fallback insert using DatabaseAdapter when direct PostgreSQL transaction is not active.
   * Used in tests and non-transactional contexts.
   */
  static async enqueueEvent(envelope, maxAttempts = 5) {
    try {
      const pool = getPostgresPool();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const res = await this.insertInTransaction({ client, envelope, maxAttempts });
        await client.query("COMMIT");
        return res;
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    } catch {
      // Fallback to DatabaseAdapter for dev/test sandboxes
      const adapter = new DatabaseAdapter("security_outbox");
      const record = {
        id: crypto.randomUUID(),
        event_id: envelope.eventId,
        event_type: envelope.eventType,
        schema_version: envelope.schemaVersion || "studenthub-security-event-v1",
        classification: envelope.classification || "INTERNAL",
        payload: envelope.payload,
        payload_hash: envelope.payloadHash,
        delivery_state: OUTBOX_STATE.PENDING,
        attempt_count: 0,
        max_attempts: maxAttempts,
        next_attempt_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await adapter.save(record, "id");
      return { outboxId: record.id, eventId: record.event_id };
    }
  }

  /**
   * Claims a batch of pending/failed outbox records with leasing.
   * @param {number} limit 
   * @param {number} leaseSeconds 
   * @returns {Promise<Array<object>>}
   */
  static async claimPendingBatch(limit = 10, leaseSeconds = 30) {
    try {
      const pool = getPostgresPool();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const res = await client.query(
          `SELECT id, event_id, event_type, schema_version, classification,
                  payload, payload_hash, attempt_count, max_attempts
           FROM public.security_outbox
           WHERE delivery_state IN ('PENDING', 'FAILED')
             AND next_attempt_at <= now()
           ORDER BY next_attempt_at ASC
           LIMIT $1
           FOR UPDATE SKIP LOCKED`,
          [limit]
        );

        const rows = res.rows;
        if (rows.length > 0) {
          const ids = rows.map((r) => r.id);
          await client.query(
            `UPDATE public.security_outbox
             SET delivery_state = 'PROCESSING',
                 lease_expires_at = now() + ($1 || ' seconds')::interval,
                 updated_at = now()
             WHERE id = ANY($2::uuid[])`,
            [leaseSeconds, ids]
          );
        }
        await client.query("COMMIT");
        return rows;
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    } catch {
      // Fallback to DatabaseAdapter
      const adapter = new DatabaseAdapter("security_outbox");
      const all = await adapter.findAll();
      const now = new Date();
      const eligible = all
        .filter((r) => r.delivery_state === OUTBOX_STATE.PENDING || r.delivery_state === OUTBOX_STATE.FAILED)
        .filter((r) => !r.next_attempt_at || new Date(r.next_attempt_at) <= now)
        .slice(0, limit);

      for (const item of eligible) {
        item.delivery_state = OUTBOX_STATE.PROCESSING;
        item.lease_expires_at = new Date(now.getTime() + leaseSeconds * 1000).toISOString();
        await adapter.save(item, "id");
      }
      return eligible;
    }
  }

  /**
   * Marks an outbox event as DELIVERED upon successful receipt by Citadel.
   */
  static async markDelivered(eventId) {
    try {
      const pool = getPostgresPool();
      await pool.query(
        `UPDATE public.security_outbox
         SET delivery_state = 'DELIVERED',
             delivered_at = now(),
             lease_expires_at = NULL,
             updated_at = now()
         WHERE event_id = $1`,
        [eventId]
      );
    } catch {
      const adapter = new DatabaseAdapter("security_outbox");
      const all = await adapter.findAll();
      const existing = all.find((r) => r.event_id === eventId);
      if (existing) {
        existing.delivery_state = OUTBOX_STATE.DELIVERED;
        existing.delivered_at = new Date().toISOString();
        existing.lease_expires_at = null;
        await adapter.save(existing, "id");
      }
    }
  }

  /**
   * Marks an event attempt as FAILED, computes next attempt or moves to DEAD_LETTER.
   */
  static async markFailed(eventId, { code = "DELIVERY_ERROR", reason = "", retryDelayMs = 2000 }) {
    try {
      const pool = getPostgresPool();
      await pool.query(
        `UPDATE public.security_outbox
         SET attempt_count = attempt_count + 1,
             delivery_state = CASE
               WHEN attempt_count + 1 >= max_attempts THEN 'DEAD_LETTER'
               ELSE 'FAILED'
             END,
             next_attempt_at = now() + ($1 || ' milliseconds')::interval,
             last_failure_code = $2,
             last_failure_reason = $3,
             lease_expires_at = NULL,
             updated_at = now()
         WHERE event_id = $4`,
        [retryDelayMs, String(code).slice(0, 100), String(reason).slice(0, 500), eventId]
      );
    } catch {
      const adapter = new DatabaseAdapter("security_outbox");
      const all = await adapter.findAll();
      const existing = all.find((r) => r.event_id === eventId);
      if (existing) {
        existing.attempt_count = (existing.attempt_count || 0) + 1;
        if (existing.attempt_count >= (existing.max_attempts || 5)) {
          existing.delivery_state = OUTBOX_STATE.DEAD_LETTER;
        } else {
          existing.delivery_state = OUTBOX_STATE.FAILED;
        }
        existing.next_attempt_at = new Date(Date.now() + retryDelayMs).toISOString();
        existing.last_failure_code = code;
        existing.last_failure_reason = reason;
        existing.lease_expires_at = null;
        await adapter.save(existing, "id");
      }
    }
  }

  /**
   * Returns outbox counts by state.
   */
  static async getStats() {
    try {
      const pool = getPostgresPool();
      const res = await pool.query(
        `SELECT delivery_state, count(*)::int AS count
         FROM public.security_outbox
         GROUP BY delivery_state`
      );
      const stats = { PENDING: 0, PROCESSING: 0, DELIVERED: 0, FAILED: 0, DEAD_LETTER: 0 };
      for (const row of res.rows) {
        if (row.delivery_state in stats) stats[row.delivery_state] = row.count;
      }
      return stats;
    } catch {
      const adapter = new DatabaseAdapter("security_outbox");
      const all = await adapter.findAll();
      const stats = { PENDING: 0, PROCESSING: 0, DELIVERED: 0, FAILED: 0, DEAD_LETTER: 0 };
      for (const it of all) {
        const st = it.delivery_state;
        if (st in stats) stats[st]++;
      }
      return stats;
    }
  }
}
