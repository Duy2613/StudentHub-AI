# StudentHub AI — Security Event Canonicalization & Golden Contract Specification (V1)

## 1. Scope & Purpose
This document specifies the canonical byte serialization, deterministic SHA-256 payload hashing, envelope data structures, and fixture schema for security telemetry events exported from **StudentHub AI** to **GovSec Citadel** (`Duy2613/govsec-citadel`).

It enables cross-language verification across JavaScript/TypeScript (Node.js) and Python/Rust, ensuring identical byte representations and cryptographically verifiable integrity checksums across system boundaries.

---

## 2. Canonicalization Specification: RFC 8785 (JSON Canonicalization Scheme — JCS)

All security telemetry payloads MUST be canonicalized according to **RFC 8785 (JSON Canonicalization Scheme — JCS)** prior to byte conversion and SHA-256 digest computation. This replaces generic references to RFC 8259 with an explicit, mathematically deterministic algorithm supported across JavaScript/TypeScript (Node.js), Python, Rust, and Go.

### 2.1 Object Member Ordering
- Object properties MUST be sorted in strictly ascending lexicographical order based on UTF-16 code units (RFC 8785 Section 3.2.3).
- Separators MUST NOT contain any whitespace:
  - Property name / value separator: `:` (colon, ASCII 0x3A, NO whitespace).
  - Member separator: `,` (comma, ASCII 0x2C, NO whitespace).
- Example: `{"a":1,"b":2}` (NEVER `{"a": 1, "b": 2}` or `{"b":2,"a":1}`).

### 2.2 Unicode & String Escaping
- String encoding is strictly **UTF-8**.
- Characters that MUST be escaped (RFC 8785 Section 3.2.2.2):
  - Quotation mark: `\"` (ASCII 0x22 / U+0022)
  - Reverse solidus: `\\` (ASCII 0x5C / U+005C)
  - Control characters U+0000 through U+001F:
    - Standard two-character escapes: `\b` (U+0008), `\t` (U+0009), `\n` (U+000A), `\f` (U+000C), `\r` (U+000D).
    - Other control characters (U+0000..U+0007, U+000B, U+000E..U+001F) MUST be serialized as six-character lowercase hex sequences: `\u00XX`.
- Forward solidus `/` (ASCII 0x2F) MUST NOT be escaped (i.e. `/`, not `\/`).
- All other Unicode characters (including Vietnamese diacritics, accented letters, emoji, non-Latin scripts) MUST be serialized directly as raw UTF-8 bytes and MUST NOT be hex-escaped.

### 2.3 Numbers & Numerics
- Number representation MUST conform to RFC 8785 Section 3.2.2.3 (ECMAScript Number ToString representation):
  - Standard decimal notation: `0`, `123`, `3.1415`.
  - Negative zero (`-0`) MUST be serialized as `0`.
  - Negative numbers are prefixed with `-`.
  - Exponential notation uses lowercase `e`.
- Non-finite numbers (`NaN`, `Infinity`, `-Infinity`) are strictly prohibited and serialize to `null`.
- Floating point values MUST fall within safe IEEE-754 double precision.

### 2.4 Booleans & Null
- Literal `true` and `false` (lowercase).
- Literal `null` (lowercase).
- `undefined` object properties MUST be omitted or serialized to `null`.

### 2.5 Array Order
- Arrays maintain their exact positional order: `[item0,item1,...]`.
- Array elements are recursively canonicalized according to RFC 8785 JCS rules.

### 2.6 Unicode Normalization: NONE
- In strict adherence to RFC 8785 Section 3.1, canonicalization **does NOT perform Unicode normalization**.
- Rule: **`NONE`**. Systems MUST NOT normalize implicitly (e.g. converting NFD to NFC or vice versa during canonicalization).
- Pre-composed characters (NFC) and decomposed combining sequences (NFD) represent distinct byte sequences and MUST retain their exact code points and distinct payload hashes.

### 2.7 SHA-256 Digest Computation
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

---

## 5. Contract Version Safety & Compatibility
- **Compatible V1 Clarification**: The formal adoption of RFC 8785 JCS is 100% byte-for-byte compatible with all historical V1 event payloads (`trust_decision_v1`, `auth_anomaly_v1`, `audit_checkpoint_v1`).
- Historical event hashes (`29e3f88e...`, `3a3d02a4...`, `d89d192c...`) remain completely unchanged and cryptographically explainable under RFC 8785 JCS.
- Fixture metadata supports both `RFC_8785_JCS` and legacy alias `RFC_8259_CANONICAL_UTF8`.
