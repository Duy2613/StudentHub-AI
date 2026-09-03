# StudentHub AI — Security Event Canonicalization & Golden Contract Specification (V1)

## 1. Scope & Purpose
This document specifies the canonical byte serialization, deterministic SHA-256 payload hashing, envelope data structures, and fixture schema for security telemetry events exported from **StudentHub AI** to **GovSec Citadel** (`Duy2613/govsec-citadel`).

It enables cross-language verification across JavaScript/TypeScript (Node.js) and Python/Rust, ensuring identical byte representations and cryptographically verifiable integrity checksums across system boundaries.

---

## 2. Canonicalization Rules (RFC 8259 + Deterministic Encoding)

### 2.1 Object Key Ordering
- Object keys MUST be sorted in strictly ascending lexicographical order based on UTF-16 code units / Unicode code points (equivalent to standard ASCII / UTF-8 byte comparison for ASCII key identifiers).
- Formatting MUST NOT include whitespace around object separators:
  - Key-value separator: `:` (colon, ASCII 0x3A, NO whitespace).
  - Member separator: `,` (comma, ASCII 0x2C, NO whitespace).
- Example: `{"a":1,"b":2}` (NEVER `{"a": 1, "b": 2}` or `{"b":2,"a":1}`).

### 2.2 Unicode & String Escaping
- String encoding is strictly **UTF-8**.
- Mandatory JSON escapes:
  - Quotation mark: `\"` (ASCII 0x22)
  - Reverse solidus: `\\` (ASCII 0x5C)
  - Control characters U+0000 through U+001F must be escaped using standard short escapes (`\b`, `\f`, `\n`, `\r`, `\t`) or 6-character hex `\u00XX`.
- Forward solidus `/` (ASCII 0x2F) MUST NOT be escaped (i.e. `/`, not `\/`).

### 2.3 Numbers & Numerics
- Standard decimal notation only: `0`, `123`, `3.1415`.
- Negative numbers are prefixed with `-`.
- Scientific notation (`1e5`) is normalized to standard integer/decimal where practical.
- Non-finite numbers (`NaN`, `Infinity`, `-Infinity`) are strictly prohibited and serialize to `null`.

### 2.4 Booleans & Null
- Literal `true` and `false` (lowercase).
- Literal `null` (lowercase).
- `undefined` object properties MUST be omitted or serialized to `null`.

### 2.5 Array Order
- Arrays maintain their exact positional order: `[item0,item1,...]`.
- Array elements are recursively canonicalized according to these same rules.

### 2.6 SHA-256 Digest Computation
- The `payloadHash` field of any event envelope is computed as:
  $$\text{payloadHash} = \text{SHA-256}(\text{canonical\_utf8\_bytes}(\text{sanitized\_payload}))$$
- Represented as a 64-character lowercase hexadecimal string (`^[0-9a-f]{64}$`).

---

## 3. Standard Security Event Envelope
```json
{
  "eventId": "evt-<uuid>",
  "eventType": "security.studenthub.<family>.<version>",
  "schemaVersion": "studenthub-security-event-v1",
  "occurredAt": "2026-09-04T00:00:00.000Z",
  "producedAt": "2026-09-04T00:00:00.000Z",
  "producer": "StudentHub-AI",
  "environment": "production",
  "correlationId": "corr-<uuid>",
  "causationId": null,
  "subject": "studenthub-trust-engine",
  "classification": "INTERNAL",
  "payload": { ... },
  "payloadHash": "<64-hex-sha256>"
}
```

### 3.1 Allowed Classifications
- `PUBLIC`: Information suitable for public disclosure.
- `INTERNAL`: Default operational telemetry for internal security consumption.
- `CONFIDENTIAL`: Contains sensitive system telemetry requiring elevated SOC access.
- `RESTRICTED`: High-sensitivity audit or security incident evidence.

---

## 4. Implemented Event Families
1. `security.studenthub.trust_decision.v1`: Verification case resolution and integrity telemetry.
2. `security.studenthub.auth_anomaly.v1`: Zero-Trust Security Fabric anomaly and attack telemetry.
3. `security.studenthub.audit_checkpoint.v1`: System session and lifecycle compliance checkpoint.
