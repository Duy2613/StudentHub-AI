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
    assert.ok(goldenFiles.length >= 6, `Expected at least 6 golden contract fixtures, found ${goldenFiles.length}`);

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

      // 3. Verify UTF-8 byte representation and length if recorded
      if (fixtureMetadata.utf8ByteLength) {
        const computedBytes = Buffer.from(computedCanonical, "utf8");
        assert.equal(computedBytes.length, fixtureMetadata.utf8ByteLength);
        if (fixtureMetadata.utf8HexRepresentation) {
          assert.equal(computedBytes.toString("hex"), fixtureMetadata.utf8HexRepresentation);
        }
      }

      // 4. Verify Producer & Schema
      assert.equal(inputEnvelope.producer, "StudentHub-AI");
      assert.equal(inputEnvelope.schemaVersion, "studenthub-security-event-v1");
      assert.ok(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"].includes(inputEnvelope.classification));
    }
  });

  it("verifies historical V1 event hashes remain identical under RFC 8785 JCS (compatible V1 clarification)", () => {
    const historicalV1ExpectedHashes = {
      trust_decision_v1: "29e3f88e2f51cbaca2ebed2f0b48df998ada1ea3c3db2bbb5cf9719205ae8dba",
      auth_anomaly_v1: "3a3d02a489049ef79b9092d625cb2d4d335e25f4fff3a99ee57c0dbd1fa0dc7c",
      audit_checkpoint_v1: "d89d192c1d1b36ddcd838c12f5500670de08bc62ad2c03d180a23e2ff76b3df3",
    };

    for (const [name, expectedHash] of Object.entries(historicalV1ExpectedHashes)) {
      const fixturePath = join(goldenDir, `${name}.golden.json`);
      const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
      const computedHash = SecurityOutboxTransformer.computePayloadHash(fixture.inputEnvelope.payload);
      assert.equal(
        computedHash,
        expectedHash,
        `Historical V1 hash stability broken for ${name}`
      );
    }
  });

  it("verifies Unicode serialization rules: Vietnamese, diacritics, emoji, escapes, and NONE normalization rule", () => {
    // 1. Vietnamese & Diacritics
    const vnPayload = {
      institution: "Đại học Quốc gia Thành phố Hồ Chí Minh",
      scam_type: "lừa đảo học bổng",
    };
    const vnCanonical = SecurityOutboxTransformer.toCanonicalJson(vnPayload);
    assert.equal(
      vnCanonical,
      '{"institution":"Đại học Quốc gia Thành phố Hồ Chí Minh","scam_type":"lừa đảo học bổng"}'
    );
    // Raw UTF-8 bytes must not be \u-escaped
    assert.ok(!vnCanonical.includes("\\u0110"), "Vietnamese Đ must be raw UTF-8, not \\u escaped");
    assert.ok(!vnCanonical.includes("\\u1eaf"), "Vietnamese ắ must be raw UTF-8, not \\u escaped");

    // 2. Normalization rule NONE: NFC vs NFD forms must remain distinct
    const strNfc = "Tiếng Việt";
    const strNfd = "Tiếng Việt".normalize("NFD");
    assert.notEqual(strNfc, strNfd, "NFC and NFD are distinct code point sequences");

    const payloadNfc = { text: strNfc };
    const payloadNfd = { text: strNfd };

    const canonicalNfc = SecurityOutboxTransformer.toCanonicalJson(payloadNfc);
    const canonicalNfd = SecurityOutboxTransformer.toCanonicalJson(payloadNfd);

    assert.notEqual(canonicalNfc, canonicalNfd, "Normalization NONE must not collapse NFC into NFD or vice versa");
    const hashNfc = SecurityOutboxTransformer.computePayloadHash(payloadNfc);
    const hashNfd = SecurityOutboxTransformer.computePayloadHash(payloadNfd);
    assert.notEqual(hashNfc, hashNfd, "Distinct Unicode representations must produce distinct SHA-256 hashes");

    // 3. Numbers & Boundaries (-0 -> 0, integer bounds, safe decimals)
    assert.equal(SecurityOutboxTransformer.toCanonicalJson({ zero: -0 }), '{"zero":0}');
    assert.equal(SecurityOutboxTransformer.toCanonicalJson({ zero: 0 }), '{"zero":0}');
    assert.equal(
      SecurityOutboxTransformer.toCanonicalJson({ min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER }),
      '{"max":9007199254740991,"min":-9007199254740991}'
    );
    assert.equal(SecurityOutboxTransformer.toCanonicalJson({ float: 0.125 }), '{"float":0.125}');

    // 4. Control character escaping
    const controlPayload = { esc: "\b\f\n\r\t\u0000\u001f", slash: "a/b" };
    const controlCanonical = SecurityOutboxTransformer.toCanonicalJson(controlPayload);
    assert.ok(controlCanonical.includes('\\b'), "U+0008 must escape to \\b");
    assert.ok(controlCanonical.includes('\\f'), "U+000C must escape to \\f");
    assert.ok(controlCanonical.includes('\\n'), "U+000A must escape to \\n");
    assert.ok(controlCanonical.includes('\\r'), "U+000D must escape to \\r");
    assert.ok(controlCanonical.includes('\\t'), "U+0009 must escape to \\t");
    assert.ok(controlCanonical.includes('\\u0000'), "U+0000 must escape to \\u0000");
    assert.ok(controlCanonical.includes('\\u001f'), "U+001F must escape to \\u001f");
    assert.ok(controlCanonical.includes('"a/b"'), "Forward slash MUST NOT be escaped");
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
