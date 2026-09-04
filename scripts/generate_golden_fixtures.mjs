import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { SecurityOutboxTransformer } from "../frontend/src/lib/server/outbox/SecurityOutboxTransformer.js";

const root = join(process.cwd(), "contracts", "security-events");
const goldenDir = join(root, "golden");
const negativeDir = join(root, "negative");
mkdirSync(goldenDir, { recursive: true });
mkdirSync(negativeDir, { recursive: true });

// 1. Golden Fixtures
const goldenFixtures = [
  {
    name: "trust_decision_v1",
    envelope: {
      eventId: "evt-golden-trust-001",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      occurredAt: "2026-09-04T00:00:00.000Z",
      producedAt: "2026-09-04T00:00:00.000Z",
      producer: "StudentHub-AI",
      environment: "production",
      correlationId: "corr-golden-001",
      causationId: null,
      subject: "studenthub-trust-engine",
      classification: "INTERNAL",
      payload: {
        case_id: "case-golden-001",
        claim_count: 3,
        evaluated_at: "2026-09-04T00:00:00.000Z",
        evidence_count: 5,
        input_type: "text",
        verdict: "VERIFIED",
        visibility: "PRIVATE",
      },
    },
    citadelAcceptance: "ACCEPTED",
  },
  {
    name: "auth_anomaly_v1",
    envelope: {
      eventId: "evt-golden-auth-002",
      eventType: "security.studenthub.auth_anomaly.v1",
      schemaVersion: "studenthub-security-event-v1",
      occurredAt: "2026-09-04T00:00:00.000Z",
      producedAt: "2026-09-04T00:00:00.000Z",
      producer: "StudentHub-AI",
      environment: "production",
      correlationId: "corr-golden-002",
      causationId: null,
      subject: "studenthub-security-fabric",
      classification: "CONFIDENTIAL",
      payload: {
        action: "SUSPICIOUS_TOKEN_REPLAY",
        actor_id: "user-anon-456",
        client_ip: "192.0.2.1",
        detected_at: "2026-09-04T00:00:00.000Z",
        severity: "HIGH",
        violation_code: "AUTH_ANOMALY_REPLAY",
      },
    },
    citadelAcceptance: "ACCEPTED",
  },
  {
    name: "audit_checkpoint_v1",
    envelope: {
      eventId: "evt-golden-audit-003",
      eventType: "security.studenthub.audit_checkpoint.v1",
      schemaVersion: "studenthub-security-event-v1",
      occurredAt: "2026-09-04T00:00:00.000Z",
      producedAt: "2026-09-04T00:00:00.000Z",
      producer: "StudentHub-AI",
      environment: "production",
      correlationId: "corr-golden-003",
      causationId: null,
      subject: "studenthub-compliance",
      classification: "INTERNAL",
      payload: {
        checkpoint_id: "chk-compliance-789",
        checkpoint_type: "SESSION_AUDIT",
        record_count: 42,
        snapshot_hash: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
        timestamp: "2026-09-04T00:00:00.000Z",
      },
    },
    citadelAcceptance: "ACCEPTED",
  },
  {
    name: "unicode_vietnamese_v1",
    envelope: {
      eventId: "evt-golden-vn-004",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      occurredAt: "2026-09-04T00:00:00.000Z",
      producedAt: "2026-09-04T00:00:00.000Z",
      producer: "StudentHub-AI",
      environment: "production",
      correlationId: "corr-golden-vn-004",
      causationId: null,
      subject: "studenthub-trust-engine",
      classification: "INTERNAL",
      payload: {
        case_id: "case-vn-scholarship-001",
        category: "lừa đảo học bổng",
        institution: "Đại học Quốc gia Thành phố Hồ Chí Minh",
        report_summary: "Phát hiện dấu hiệu lừa đảo học bổng qua mạng xã hội tại TP.HCM",
        status: "INVESTIGATING",
      },
    },
    citadelAcceptance: "ACCEPTED",
  },
  {
    name: "unicode_comprehensive_v1",
    envelope: {
      eventId: "evt-golden-comp-005",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      occurredAt: "2026-09-04T00:00:00.000Z",
      producedAt: "2026-09-04T00:00:00.000Z",
      producer: "StudentHub-AI",
      environment: "production",
      correlationId: "corr-golden-comp-005",
      causationId: null,
      subject: "studenthub-trust-engine",
      classification: "INTERNAL",
      payload: {
        array_values: [1, "two", null, false, { nested_key: "nested_val" }],
        backslash_path: "C:\\Users\\Duy\\Projects\\StudentHub-AI",
        boolean_false: false,
        boolean_true: true,
        control_escapes: "Control:\b\f\n\r\t\u0000\u001f",
        decimal_pi: 3.14159,
        decimal_quarter: 0.125,
        emoji_badges: "🛡️ 🎓 🚀",
        integer_boundary_max: 9007199254740991,
        integer_boundary_min: -9007199254740991,
        integer_zero: 0,
        nested_object: {
          inner_a: 100,
          inner_b: {
            deep_leaf: "verified",
          },
        },
        null_value: null,
        quoted_string: "Said: \"Canonical serialization matters\"",
      },
    },
    citadelAcceptance: "ACCEPTED",
  },
  {
    name: "unicode_normalization_nfc_nfd_v1",
    envelope: {
      eventId: "evt-golden-norm-006",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      occurredAt: "2026-09-04T00:00:00.000Z",
      producedAt: "2026-09-04T00:00:00.000Z",
      producer: "StudentHub-AI",
      environment: "production",
      correlationId: "corr-golden-norm-006",
      causationId: null,
      subject: "studenthub-trust-engine",
      classification: "INTERNAL",
      payload: {
        composed_nfc: "Tiếng Việt",
        decomposed_nfd: "Tiếng Việt".normalize("NFD"),
        normalization_rule: "NONE",
        rule_rationale: "RFC 8785 Section 3.1 prohibits implicit normalization. Composed and decomposed forms produce distinct byte streams.",
      },
    },
    citadelAcceptance: "ACCEPTED",
  },
];

for (const g of goldenFixtures) {
  const canonicalJson = SecurityOutboxTransformer.toCanonicalJson(g.envelope.payload);
  const utf8Bytes = Buffer.from(canonicalJson, "utf8");
  const expectedHash = SecurityOutboxTransformer.computePayloadHash(g.envelope.payload);
  g.envelope.payloadHash = expectedHash;

  const fixtureContent = {
    fixtureMetadata: {
      fixtureType: "GOLDEN",
      contractVersion: "SECURITY_EVENT_CONTRACT_V1",
      targetFamily: g.envelope.eventType,
      canonicalByteRule: "RFC_8785_JCS",
      unicodeNormalization: "NONE",
      expectedPayloadHash: expectedHash,
      expectedCitadelAcceptance: g.citadelAcceptance,
      utf8ByteLength: utf8Bytes.length,
      utf8HexRepresentation: utf8Bytes.toString("hex"),
    },
    canonicalPayloadJson: canonicalJson,
    inputEnvelope: g.envelope,
  };

  const outPath = join(goldenDir, `${g.name}.golden.json`);
  writeFileSync(outPath, JSON.stringify(fixtureContent, null, 2), "utf8");
  console.log(`Wrote golden fixture: ${outPath} (hash: ${expectedHash}, bytes: ${utf8Bytes.length})`);
}

// 2. Negative Fixtures
const negativeFixtures = [
  {
    name: "missing_mandatory_field",
    envelope: {
      // missing eventId
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      producer: "StudentHub-AI",
      payload: { verdict: "SAFE" },
      payloadHash: SecurityOutboxTransformer.computePayloadHash({ verdict: "SAFE" }),
    },
    expectedFailure: "MISSING_MANDATORY_FIELD",
  },
  {
    name: "extra_disallowed_field",
    envelope: {
      eventId: "evt-neg-002",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      producer: "StudentHub-AI",
      payload: { verdict: "SAFE" },
      payloadHash: SecurityOutboxTransformer.computePayloadHash({ verdict: "SAFE" }),
      unauthorizedRootField: "ILLEGAL_INJECTION",
    },
    expectedFailure: "EXTRA_UNRECOGNIZED_FIELD",
  },
  {
    name: "bad_producer",
    envelope: {
      eventId: "evt-neg-003",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      producer: "Rogue-Attacker-System",
      payload: { verdict: "SAFE" },
      payloadHash: SecurityOutboxTransformer.computePayloadHash({ verdict: "SAFE" }),
    },
    expectedFailure: "INVALID_PRODUCER",
  },
  {
    name: "bad_schema_version",
    envelope: {
      eventId: "evt-neg-004",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "unsupported-v999",
      producer: "StudentHub-AI",
      payload: { verdict: "SAFE" },
      payloadHash: SecurityOutboxTransformer.computePayloadHash({ verdict: "SAFE" }),
    },
    expectedFailure: "UNSUPPORTED_SCHEMA_VERSION",
  },
  {
    name: "payload_hash_mismatch",
    envelope: {
      eventId: "evt-neg-005",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      producer: "StudentHub-AI",
      payload: { verdict: "SAFE" },
      payloadHash: "0000000000000000000000000000000000000000000000000000000000000000",
    },
    expectedFailure: "PAYLOAD_HASH_MISMATCH",
  },
  {
    name: "forbidden_classification",
    envelope: {
      eventId: "evt-neg-006",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      producer: "StudentHub-AI",
      classification: "TOP_SECRET_UNKNOWN",
      payload: { verdict: "SAFE" },
      payloadHash: SecurityOutboxTransformer.computePayloadHash({ verdict: "SAFE" }),
    },
    expectedFailure: "INVALID_CLASSIFICATION",
  },
  {
    name: "oversized_payload",
    envelope: {
      eventId: "evt-neg-007",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      producer: "StudentHub-AI",
      payload: { largeBlob: "X".repeat(200 * 1024) }, // 200KB exceeds 64KB limit
      payloadHash: SecurityOutboxTransformer.computePayloadHash({ largeBlob: "X".repeat(200 * 1024) }),
    },
    expectedFailure: "PAYLOAD_OVERSIZED",
  },
  {
    name: "malformed_timestamp",
    envelope: {
      eventId: "evt-neg-008",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      producer: "StudentHub-AI",
      occurredAt: "yesterday at noon",
      payload: { verdict: "SAFE" },
      payloadHash: SecurityOutboxTransformer.computePayloadHash({ verdict: "SAFE" }),
    },
    expectedFailure: "INVALID_TIMESTAMP_FORMAT",
  },
  {
    name: "prohibited_secret_field",
    envelope: {
      eventId: "evt-neg-009",
      eventType: "security.studenthub.trust_decision.v1",
      schemaVersion: "studenthub-security-event-v1",
      producer: "StudentHub-AI",
      payload: {
        case_id: "case-001",
        api_key: "sk_live_1234567890",
        raw_token: "eyJhbGciOi...",
      },
      payloadHash: SecurityOutboxTransformer.computePayloadHash({
        case_id: "case-001",
        api_key: "sk_live_1234567890",
        raw_token: "eyJhbGciOi...",
      }),
    },
    expectedFailure: "PROHIBITED_SECRET_LEAKAGE",
  },
];

for (const neg of negativeFixtures) {
  const outPath = join(negativeDir, `${neg.name}.json`);
  writeFileSync(outPath, JSON.stringify(neg, null, 2), "utf8");
  console.log(`Wrote negative fixture: ${outPath}`);
}
