import crypto from "node:crypto";

import { deliverLabbeEvent, getLabbeConfig } from "./LabbeBridge.js";
import { getPostgresPool } from "../database/PostgresPool.js";

export const LABBE_OUTBOX_MAX_ATTEMPTS = 8;
export const LABBE_OUTBOX_LEASE_SECONDS = 30;

function retryDelaySeconds(attempts) {
  return Math.min(60 * 60, 2 ** Math.min(10, Math.max(0, attempts)));
}

function hashHex(value) {
  if (Buffer.isBuffer(value)) return value.toString("hex");
  if (value instanceof Uint8Array) return Buffer.from(value).toString("hex");
  return typeof value === "string" ? value : "";
}

function deliveryError(delivery) {
  const suffix = Number.isInteger(delivery?.httpStatus) ? `_HTTP_${delivery.httpStatus}` : "";
  return `${String(delivery?.status || "DELIVERY_FAILED").slice(0, 80)}${suffix}`.slice(0, 1000);
}

function rowAsEvent(row) {
  return {
    event_id: row.event_id,
    event_type: row.event_type,
    schema_version: row.schema_version,
    occurred_at: row.occurred_at,
    produced_at: row.produced_at,
    producer: row.producer,
    environment: row.environment,
    correlation_id: row.correlation_id,
    causation_id: row.causation_id,
    subject: row.subject,
    classification: row.classification,
    payload: row.payload,
    payload_hash: hashHex(row.payload_hash),
  };
}

export class LabbeOutboxService {
  static async dispatchOne({
    fetchImpl = globalThis.fetch,
    env = process.env,
    pool: suppliedPool = null,
    leaseSeconds = LABBE_OUTBOX_LEASE_SECONDS,
  } = {}) {
    const config = getLabbeConfig(env);
    if (config.mode === "DISABLED") return { state: "DISABLED", delivered: false };
    if (config.mode === "CONTROLLED") return { state: "CONTROLLED_DISABLED", delivered: false };
    if (config.mode === "STAGING" && !config.remoteConfigured) {
      return { state: "NOT_CONFIGURED", delivered: false };
    }

    const pool = suppliedPool || getPostgresPool();
    const client = await pool.connect();
    let row = null;
    let attempts = 0;
    const leaseToken = crypto.randomUUID();
    const boundedLeaseSeconds = Math.min(300, Math.max(1, Number.isFinite(leaseSeconds) ? Math.floor(leaseSeconds) : LABBE_OUTBOX_LEASE_SECONDS));
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `SELECT id, event_id, event_type, schema_version, occurred_at, produced_at,
                producer, environment, correlation_id, causation_id, subject, classification,
                payload, payload_hash, attempts, status, lease_count
           FROM private.integration_outbox
          WHERE integration = 'LABBE'
            AND (
              (status IN ('PENDING', 'FAILED', 'SHADOW') AND available_at <= now() AND attempts < ${LABBE_OUTBOX_MAX_ATTEMPTS})
              OR (status = 'IN_FLIGHT' AND leased_until IS NOT NULL AND leased_until < now())
            )
          ORDER BY available_at ASC, created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1`
      );
      if (!result.rows[0]) {
        await client.query("COMMIT");
        return { state: "IDLE", delivered: false };
      }
      row = result.rows[0];
      const previousAttempts = Number(row.attempts || 0);
      // A SHADOW exercise acquires a real lease but is not a delivery attempt.
      // Expired IN_FLIGHT rows are retried even when the previous worker used
      // the final attempt: the event must not be lost after a worker crash.
      attempts = config.mode === "SHADOW"
        ? previousAttempts
        : Math.min(LABBE_OUTBOX_MAX_ATTEMPTS, previousAttempts + 1);
      await client.query(
        `UPDATE private.integration_outbox
            SET status = 'IN_FLIGHT', attempts = $2,
                lease_token = $3::uuid,
                lease_count = lease_count + 1,
                leased_until = now() + ($4 * interval '1 second'),
                updated_at = now()
          WHERE id = $1`,
        [row.id, attempts, leaseToken, boundedLeaseSeconds]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    const delivery = await deliverLabbeEvent(rowAsEvent(row), { env, fetchImpl });

    if (config.mode === "SHADOW") {
      const shadowUpdate = await pool.query(
        `UPDATE private.integration_outbox
            SET status = 'SHADOW', leased_until = NULL, lease_token = NULL,
                shadow_count = shadow_count + 1, shadowed_at = now(),
                last_error = 'SHADOW_SUPPRESSED', updated_at = now()
          WHERE id = $1 AND status = 'IN_FLIGHT' AND lease_token = $2::uuid`,
        [row.id, leaseToken]
      );
      if (shadowUpdate.rowCount === 0) {
        return { state: "STALE_LEASE", delivered: false, eventId: row.event_id, attempts, staleLease: true };
      }
      return {
        state: "SHADOW",
        delivered: false,
        eventId: row.event_id,
        attempts,
        leaseCount: Number(row.lease_count || 0) + 1,
        deliveryStatus: delivery.status,
      };
    }

    const delivered = delivery.delivered === true;
    const conflict = delivery.status === "CONFLICT";
    const nextStatus = conflict ? "CONFLICT" : delivered ? "DELIVERED" : "FAILED";
    const nextDelay = delivered || conflict ? 0 : retryDelaySeconds(attempts);
    const updateResult = await pool.query(
      `UPDATE private.integration_outbox
          SET status = $3,
              lease_token = NULL,
              leased_until = NULL,
              available_at = CASE WHEN $4 OR $3 = 'CONFLICT' THEN available_at ELSE now() + ($5 * interval '1 second') END,
              delivered_at = CASE WHEN $4 THEN now() ELSE delivered_at END,
              last_error = CASE WHEN $4 THEN NULL ELSE $6 END,
              updated_at = now()
        WHERE id = $1 AND status = 'IN_FLIGHT' AND lease_token = $2::uuid`,
      [row.id, leaseToken, nextStatus, delivered, nextDelay, delivered ? null : deliveryError(delivery)]
    );
    if (updateResult.rowCount === 0) {
      return { state: "STALE_LEASE", delivered: false, eventId: row.event_id, attempts, staleLease: true, deliveryStatus: delivery.status };
    }
    return {
      state: nextStatus,
      delivered,
      eventId: row.event_id,
      attempts,
      deliveryStatus: delivery.status,
      httpStatus: delivery.httpStatus,
    };
  }

  static async dispatchAvailable({ limit = 5, fetchImpl = globalThis.fetch, env = process.env, pool = null } = {}) {
    const boundedLimit = Math.min(20, Math.max(1, Number.isInteger(limit) ? limit : 5));
    const results = [];
    for (let index = 0; index < boundedLimit; index += 1) {
      const result = await this.dispatchOne({ fetchImpl, env, pool });
      results.push(result);
      if (["IDLE", "DISABLED", "NOT_CONFIGURED", "CONTROLLED_DISABLED"].includes(result.state)) break;
    }
    return results;
  }
}
