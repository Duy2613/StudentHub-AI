/**
 * StudentHub AI — Security Event Golden & Negative Contract Verification Suite
 * 
 * Verifies:
 * 1. Golden Fixtures: Deterministic RFC 8259 canonical byte encoding, strict key ordering,
 *    and exact SHA-256 payload checksum matches across all supported event families.
 * 2. Negative Vectors: Verifies failure detection on extra fields, missing fields, bad producers,
 *    bad schema versions, checksum tampering, forbidden classification, oversized payloads,
 *    and leaked credentials.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SecurityOutboxTransformer } from "../../src/lib/server/outbox/SecurityOutboxTransformer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractsRoot = join(__dirname, "..", "..", "..", "contracts", "security-events");
const goldenDir = join(contractsRoot, "golden");
const negativeDir = join(contractsRoot, "negative");

describe("Security Event Golden & Negative Contract Suite", () => {
  it("verifies all golden contract fixtures match deterministic canonical JSON and SHA-256 hashes", () => {
    const goldenFiles = readdirSync(goldenDir).filter((f) => f.endsWith(".golden.json"));
    assert.ok(goldenFiles.length >= 3, `Expected at least 3 golden contract fixtures, found ${goldenFiles.length}`);

    for (const file of goldenFiles) {
      const filePath = join(goldenDir, file);
      const raw = JSON.parse(readFileSync(filePath, "utf8"));

      const { fixtureMetadata, canonicalPayloadJson, inputEnvelope } = raw;
      assert.ok(fixtureMetadata, `Fixture ${file} missing fixtureMetadata`);
      assert.ok(inputEnvelope, `Fixture ${file} missing inputEnvelope`);

      // 1. Verify canonical serialization of payload
      const computedCanonical = SecurityOutboxTransformer.toCanonicalJson(inputEnvelope.payload);
      assert.equal(
        computedCanonical,
        canonicalPayloadJson,
        `Canonical JSON mismatch for fixture ${file}`
      );

      // 2. Verify SHA-256 integrity hash
      const computedHash = SecurityOutboxTransformer.computePayloadHash(inputEnvelope.payload);
      assert.equal(
        computedHash,
        fixtureMetadata.expectedPayloadHash,
        `SHA-256 mismatch for fixture ${file}`
      );
      assert.equal(
        computedHash,
        inputEnvelope.payloadHash,
        `Envelope payloadHash mismatch for fixture ${file}`
      );
      assert.match(computedHash, /^[0-9a-f]{64}$/, "Hash must be 64-char lowercase hex");

      // 3. Verify Producer & Schema
      assert.equal(inputEnvelope.producer, "StudentHub-AI");
      assert.equal(inputEnvelope.schemaVersion, "studenthub-security-event-v1");
      assert.ok(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"].includes(inputEnvelope.classification));
    }
  });

  it("verifies negative vectors fail validation with correct failure codes", () => {
    const negativeFiles = readdirSync(negativeDir).filter((f) => f.endsWith(".json"));
    assert.ok(negativeFiles.length >= 9, `Expected at least 9 negative vector files, found ${negativeFiles.length}`);

    for (const file of negativeFiles) {
      const filePath = join(negativeDir, file);
      const { name, envelope, expectedFailure } = JSON.parse(readFileSync(filePath, "utf8"));

      let detectedFailure = null;

      // 1. Missing mandatory fields
      if (!envelope.eventId || !envelope.eventType || !envelope.schemaVersion || !envelope.producer) {
        detectedFailure = "MISSING_MANDATORY_FIELD";
      }

      // 2. Extra root fields
      const standardKeys = new Set([
        "eventId", "eventType", "schemaVersion", "occurredAt", "producedAt",
        "producer", "environment", "correlationId", "causationId", "subject",
        "classification", "payload", "payloadHash"
      ]);
      for (const k of Object.keys(envelope)) {
        if (!standardKeys.has(k)) {
          detectedFailure = "EXTRA_UNRECOGNIZED_FIELD";
          break;
        }
      }

      // 3. Bad producer
      if (!detectedFailure && envelope.producer !== "StudentHub-AI") {
        detectedFailure = "INVALID_PRODUCER";
      }

      // 4. Bad schema version
      if (!detectedFailure && envelope.schemaVersion !== "studenthub-security-event-v1") {
        detectedFailure = "UNSUPPORTED_SCHEMA_VERSION";
      }

      // 5. Forbidden classification
      if (!detectedFailure && envelope.classification && !["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"].includes(envelope.classification)) {
        detectedFailure = "INVALID_CLASSIFICATION";
      }

      // 6. Malformed timestamp
      if (!detectedFailure && envelope.occurredAt && Number.isNaN(Date.parse(envelope.occurredAt))) {
        detectedFailure = "INVALID_TIMESTAMP_FORMAT";
      }

      // 7. Oversized payload
      if (!detectedFailure) {
        const serialized = JSON.stringify(envelope.payload || {});
        if (Buffer.byteLength(serialized, "utf8") > 64 * 1024) {
          detectedFailure = "PAYLOAD_OVERSIZED";
        }
      }

      // 8. Payload hash mismatch
      if (!detectedFailure && envelope.payloadHash && envelope.payload) {
        const computed = SecurityOutboxTransformer.computePayloadHash(envelope.payload);
        if (computed !== envelope.payloadHash) {
          detectedFailure = "PAYLOAD_HASH_MISMATCH";
        }
      }

      // 9. Leaked secret check
      if (!detectedFailure && envelope.payload) {
        const rawPayloadStr = JSON.stringify(envelope.payload);
        if (/api_key|sk_live|eyJhbGci/i.test(rawPayloadStr)) {
          detectedFailure = "PROHIBITED_SECRET_LEAKAGE";
        }
      }

      assert.equal(
        detectedFailure,
        expectedFailure,
        `Negative vector ${name} (${file}) expected ${expectedFailure} but got ${detectedFailure}`
      );
    }
  });
});
