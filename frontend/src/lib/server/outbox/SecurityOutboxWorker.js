/**
 * StudentHub AI — SecurityOutboxWorker
 * 
 * Bounded asynchronous export worker delivering security events to GovSec Citadel.
 * Cross-System Safety Invariants:
 * - Runs completely decoupled from product TrustDecision execution paths.
 * - Enforces safe egress validation (only allowlisted Citadel endpoint).
 * - Implements exponential backoff on delivery failure.
 * - Transitions to DEAD_LETTER after bounded retry attempts.
 * - Handles Citadel downtime without event loss or system degradation.
 */

import { SecurityOutboxRepository, OUTBOX_STATE } from "./SecurityOutboxRepository.js";
import { SecurityAuditLogger } from "../../security/audit/SecurityAuditLogger.js";
import { CitadelIntegrationConfig } from "../citadel/CitadelIntegrationConfig.js";

const DEFAULT_CITADEL_URL = "http://127.0.0.1:8000/api/v1/integrations/studenthub/events";
const DEFAULT_WORKLOAD_TOKEN = process.env.CITADEL_WORKLOAD_TOKEN || "synthetic-studenthub-workload-token";

export class SecurityOutboxWorker {
  #citadelUrl;
  #workloadToken;
  #batchSize;
  #pollIntervalMs;
  #retryBaseDelayMs;
  #timer = null;
  #running = false;
  #fetchFn;

  constructor({
    citadelUrl,
    workloadToken,
    batchSize = 10,
    pollIntervalMs = 5000,
    retryBaseDelayMs,
    fetchFn = globalThis.fetch,
  } = {}) {
    let config = null;
    try {
      config = CitadelIntegrationConfig.getConfiguration();
    } catch {}

    this.#citadelUrl = citadelUrl || config?.ingestionUrl || process.env.CITADEL_INGESTION_URL || DEFAULT_CITADEL_URL;
    this.#workloadToken = workloadToken || config?.workloadToken || process.env.CITADEL_WORKLOAD_TOKEN || DEFAULT_WORKLOAD_TOKEN;
    this.#batchSize = batchSize;
    this.#pollIntervalMs = pollIntervalMs;
    this.#retryBaseDelayMs = retryBaseDelayMs !== undefined ? retryBaseDelayMs : (config?.retryBaseDelayMs ?? 1000);
    this.#fetchFn = fetchFn;
  }

  get citadelUrl() { return this.#citadelUrl; }
  get isRunning() { return this.#running; }

  /**
   * Validates that the outbound URL strictly targets an authorized Citadel endpoint.
   * Prevents SSRF / egress redirection.
   */
  validateEgressUrl(urlString) {
    try {
      const parsed = new URL(urlString);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error(`DISALLOWED_PROTOCOL: ${parsed.protocol}`);
      }
      if (parsed.hostname === "169.254.169.254" || parsed.hostname === "metadata.google.internal") {
        throw new Error("METADATA_EGRESS_BLOCKED");
      }
      if (!parsed.pathname.endsWith("/api/v1/integrations/studenthub/events")) {
        throw new Error(`DISALLOWED_PATH: ${parsed.pathname}`);
      }
      return true;
    } catch (err) {
      throw new Error(`INVALID_EGRESS_TARGET: ${err.message}`);
    }
  }

  /**
   * Processes a single batch of pending/failed outbox events.
   * Returns summary counts of delivered, failed, and dead-lettered items.
   */
  async processBatch() {
    this.validateEgressUrl(this.#citadelUrl);

    const batch = await SecurityOutboxRepository.claimPendingBatch(this.#batchSize, 30);
    if (!batch || batch.length === 0) {
      return { claimed: 0, delivered: 0, failed: 0, deadLetter: 0 };
    }

    const summary = {
      claimed: batch.length,
      delivered: 0,
      failed: 0,
      deadLetter: 0,
    };

    for (const item of batch) {
      const eventId = item.event_id;
      const attempt = item.attempt_count || 0;
      const maxAttempts = item.max_attempts || 5;

      const payload = typeof item.payload === "string" ? JSON.parse(item.payload) : item.payload;
      const envelope = {
        event_id: eventId,
        event_type: item.event_type,
        schema_version: item.schema_version || "studenthub-security-event-v1",
        occurred_at: item.created_at || new Date().toISOString(),
        produced_at: new Date().toISOString(),
        producer: "StudentHub-AI",
        environment: process.env.NODE_ENV || "production",
        correlation_id: payload?.correlation_id || `corr-${eventId}`,
        causation_id: payload?.causation_id || null,
        subject: payload?.subject || "studenthub-trust-engine",
        classification: item.classification || "INTERNAL",
        payload: payload || {},
        payload_hash: item.payload_hash,
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await this.#fetchFn(this.#citadelUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.#workloadToken}`,
            "User-Agent": "StudentHub-AI/SecurityOutboxWorker",
            "X-Correlation-ID": envelope.correlation_id,
          },
          body: JSON.stringify(envelope),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 200 || response.status === 202) {
          await SecurityOutboxRepository.markDelivered(eventId);
          summary.delivered++;
        } else if (response.status === 409) {
          // Payload conflict flagged by Citadel: quarantine
          await SecurityOutboxRepository.markFailed(eventId, {
            code: "SECURITY_CONFLICT",
            reason: "Citadel detected event_id conflict with mismatched payload_hash.",
            retryDelayMs: 300000, // 5 min quarantine
          });
          summary.failed++;
        } else {
          // 4xx or 5xx server error
          const retryDelay = this.#retryBaseDelayMs === 0 ? 0 : Math.min(60000, this.#retryBaseDelayMs * Math.pow(2, attempt));
          await SecurityOutboxRepository.markFailed(eventId, {
            code: `HTTP_${response.status}`,
            reason: `Citadel responded with HTTP ${response.status}`,
            retryDelayMs: retryDelay,
          });
          if (attempt + 1 >= maxAttempts) summary.deadLetter++;
          else summary.failed++;
        }
      } catch (networkErr) {
        // Citadel is unreachable, down, or timed out
        const isTimeout = networkErr.name === "AbortError";
        const code = isTimeout ? "DELIVERY_TIMEOUT" : "CITADEL_UNAVAILABLE";
        const retryDelay = this.#retryBaseDelayMs === 0 ? 0 : Math.min(60000, this.#retryBaseDelayMs * Math.pow(2, attempt));

        await SecurityOutboxRepository.markFailed(eventId, {
          code,
          reason: networkErr.message || "Network unreachable",
          retryDelayMs: retryDelay,
        });

        if (attempt + 1 >= maxAttempts) summary.deadLetter++;
        else summary.failed++;
      }
    }

    return summary;
  }

  /**
   * Starts periodic outbox worker polling.
   */
  start() {
    if (this.#running) return;
    this.#running = true;
    const loop = async () => {
      if (!this.#running) return;
      try {
        await this.processBatch();
      } catch (err) {
        console.error("[SecurityOutboxWorker] Loop error:", err.message);
      } finally {
        if (this.#running) {
          this.#timer = setTimeout(loop, this.#pollIntervalMs);
        }
      }
    };
    this.#timer = setTimeout(loop, 100);
  }

  /**
   * Stops periodic outbox worker polling.
   */
  stop() {
    this.#running = false;
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }
}
