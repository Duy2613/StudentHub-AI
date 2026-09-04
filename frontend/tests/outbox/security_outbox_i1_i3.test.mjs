/**
 * StudentHub AI — Security Outbox & Citadel Integration Test Suite (I1 & I3)
 * 
 * Tests:
 * 1. Sanitization & Zero Secret Leakage (I1.7)
 * 2. Deterministic Canonical Payload Hashing
 * 3. Outbox Lifecycle & State Transitions (PENDING -> PROCESSING -> DELIVERED / FAILED / DEAD_LETTER)
 * 4. Citadel Outage Resilience (I1.3 Availability Invariant)
 * 5. Bounded Retry & Exponential Backoff
 * 6. SSRF & Egress Protection
 */

import { describe, it, beforeEach, after } from "node:test";
import assert from "node:assert/strict";

import { SecurityOutboxTransformer } from "../../src/lib/server/outbox/SecurityOutboxTransformer.js";
import { SecurityOutboxRepository } from "../../src/lib/server/outbox/SecurityOutboxRepository.js";
import { SecurityOutboxWorker } from "../../src/lib/server/outbox/SecurityOutboxWorker.js";
import { closePostgresPoolForTests } from "../../src/lib/server/database/PostgresPool.js";

describe("Security Outbox & Citadel Integration (I1 — I3)", () => {
  beforeEach(async () => {
    try {
      const { DatabaseAdapter } = await import('../../src/lib/db/DatabaseAdapter.js');
      const adapter = new DatabaseAdapter('security_outbox');
      await adapter.clear();
    } catch {}
  });

  after(async () => {
    await closePostgresPoolForTests();
  });

  it("should sanitize secrets and strip raw screenshot images from event payload", () => {
    const rawPayload = {
      user_id: "user-123",
      password: "SuperSecretPassword123!",
      auth_token: "eyJhbGciOi...",
      session_cookie: "sess_xyz789",
      database_url: "postgresql://postgres:secret@db.prod:5432/main",
      api_key: "sk_live_1234567890",
      normal_metadata: "ok-value",
      screenshot: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    };

    const sanitized = SecurityOutboxTransformer.sanitize(rawPayload);

    assert.equal(sanitized.password, "[REDACTED]");
    assert.equal(sanitized.auth_token, "[REDACTED]");
    assert.equal(sanitized.session_cookie, "[REDACTED]");
    assert.equal(sanitized.database_url, "[REDACTED]");
    assert.equal(sanitized.api_key, "[REDACTED]");
    assert.equal(sanitized.normal_metadata, "ok-value");
    assert.match(sanitized.screenshot, /^\[IMAGE_RAW_STRIPPED:sha256=/);
  });

  it("should compute deterministic canonical JSON and SHA-256 hash regardless of key order", () => {
    const payloadA = { z: 1, a: "hello", m: { y: 2, b: 3 } };
    const payloadB = { a: "hello", m: { b: 3, y: 2 }, z: 1 };

    const hashA = SecurityOutboxTransformer.computePayloadHash(payloadA);
    const hashB = SecurityOutboxTransformer.computePayloadHash(payloadB);

    assert.equal(hashA, hashB);
    assert.equal(hashA.length, 64);
    assert.match(hashA, /^[0-9a-f]{64}$/);
  });

  it("should create complete standard Citadel envelope", () => {
    const envelope = SecurityOutboxTransformer.createEnvelope({
      eventId: "evt-test-001",
      eventType: "security.studenthub.trust_decision.v1",
      classification: "INTERNAL",
      payload: { case_id: "case-001", verdict: "SAFE" },
    });

    assert.equal(envelope.eventId, "evt-test-001");
    assert.equal(envelope.eventType, "security.studenthub.trust_decision.v1");
    assert.equal(envelope.producer, "StudentHub-AI");
    assert.equal(envelope.schemaVersion, "studenthub-security-event-v1");
    assert.equal(envelope.classification, "INTERNAL");
    assert.equal(typeof envelope.payloadHash, "string");
    assert.equal(envelope.payloadHash.length, 64);
  });

  it("should validate and reject illegal egress targets", () => {
    const worker = new SecurityOutboxWorker();

    // Valid Citadel endpoint
    assert.doesNotThrow(() => {
      worker.validateEgressUrl("http://127.0.0.1:8000/api/v1/integrations/studenthub/events");
    });
    assert.doesNotThrow(() => {
      worker.validateEgressUrl("https://citadel.security.gov.vn/api/v1/integrations/studenthub/events");
    });

    // Disallowed path
    assert.throws(() => {
      worker.validateEgressUrl("http://127.0.0.1:8000/api/v1/rogue/endpoint");
    }, /DISALLOWED_PATH/);

    // Metadata service egress
    assert.throws(() => {
      worker.validateEgressUrl("http://169.254.169.254/api/v1/integrations/studenthub/events");
    }, /METADATA_EGRESS_BLOCKED/);

    // Disallowed protocol
    assert.throws(() => {
      worker.validateEgressUrl("ftp://citadel.internal/api/v1/integrations/studenthub/events");
    }, /DISALLOWED_PROTOCOL/);
  });

  it("should deliver pending outbox event when Citadel is healthy (200/202)", async () => {
    const envelope = SecurityOutboxTransformer.createEnvelope({
      eventId: `evt-worker-${Date.now()}`,
      payload: { case_id: "case-123", verdict: "SAFE" },
    });

    await SecurityOutboxRepository.enqueueEvent(envelope);

    let calledUrl = null;
    let calledBody = null;
    const mockFetch = async (url, options) => {
      calledUrl = url;
      calledBody = JSON.parse(options.body);
      return {
        status: 202,
        ok: true,
        json: async () => ({ status: "accepted", event_id: calledBody.event_id, state: "INGESTED" }),
      };
    };

    const worker = new SecurityOutboxWorker({ fetchFn: mockFetch });
    const summary = await worker.processBatch();

    assert.equal(summary.claimed, 1);
    assert.equal(summary.delivered, 1);
    assert.equal(summary.failed, 0);
    assert.ok(calledUrl.includes("/events"));
    assert.equal(calledBody.event_id, envelope.eventId);
    assert.equal(calledBody.producer, "StudentHub-AI");
  });

  it("should guarantee Availability Invariant: Citadel outage records failure with backoff without data loss", async () => {
    const envelope = SecurityOutboxTransformer.createEnvelope({
      eventId: `evt-outage-${Date.now()}`,
      payload: { case_id: "case-456", verdict: "SUSPICIOUS" },
    });

    await SecurityOutboxRepository.enqueueEvent(envelope);

    // Simulate Citadel DOWN (e.g. connection refused)
    const failingFetch = async () => {
      const err = new Error("connect ECONNREFUSED 127.0.0.1:8000");
      err.code = "ECONNREFUSED";
      throw err;
    };

    const worker = new SecurityOutboxWorker({ fetchFn: failingFetch, retryBaseDelayMs: 0 });
    const summary = await worker.processBatch();

    assert.equal(summary.claimed, 1);
    assert.equal(summary.delivered, 0);
    assert.equal(summary.failed, 1);
    assert.equal(summary.deadLetter, 0);

    // Verify recovery: Citadel recovers and next attempt delivers cleanly
    let recovered = false;
    const recoveredFetch = async () => {
      recovered = true;
      return { status: 202, ok: true, json: async () => ({ status: "accepted" }) };
    };

    const recoveringWorker = new SecurityOutboxWorker({ fetchFn: recoveredFetch, retryBaseDelayMs: 0 });
    // Process batch after recovery
    const recoverySummary = await recoveringWorker.processBatch();
    assert.equal(recoverySummary.delivered, 1);
    assert.equal(recovered, true);
  });

  it("should move to DEAD_LETTER after max attempt threshold is reached", async () => {
    const envelope = SecurityOutboxTransformer.createEnvelope({
      eventId: `evt-deadletter-${Date.now()}`,
      payload: { case_id: "case-789", verdict: "HIGH_RISK" },
    });

    await SecurityOutboxRepository.enqueueEvent(envelope, 2); // max 2 attempts

    const permanentErrorFetch = async () => {
      return { status: 500, ok: false, text: async () => "Internal Server Error" };
    };

    const worker = new SecurityOutboxWorker({ fetchFn: permanentErrorFetch, retryBaseDelayMs: 0 });

    // Attempt 1
    const res1 = await worker.processBatch();
    assert.equal(res1.failed, 1);
    assert.equal(res1.deadLetter, 0);

    // Attempt 2 -> moves to DEAD_LETTER
    const res2 = await worker.processBatch();
    assert.equal(res2.deadLetter, 1);
  });

  it("should handle 409 SECURITY_CONFLICT from Citadel gracefully without continuous tight-loop retry", async () => {
    const envelope = SecurityOutboxTransformer.createEnvelope({
      eventId: `evt-conflict-${Date.now()}`,
      payload: { case_id: "case-conflict", verdict: "TAMPERED" },
    });

    await SecurityOutboxRepository.enqueueEvent(envelope);

    const conflictFetch = async () => {
      return {
        status: 409,
        ok: false,
        json: async () => ({ error: { code: "event_conflict" } }),
      };
    };

    const worker = new SecurityOutboxWorker({ fetchFn: conflictFetch });
    const summary = await worker.processBatch();

    assert.equal(summary.failed, 1);
    // Conflict should be quarantined with large backoff
  });
});


