# StudentHub AI — Security & Functional Release Baseline (V5 Final Freeze)

- **Release Baseline Commit**: `3699775`
- **Branch**: `develop`
- **Verification Environment**: Node.js v24.2.0 (Windows x64)
- **Status**: **PRODUCTION-READY & LOCKED** (Change-Control Only)

---

## 1. System Architecture & Complete Data Flow

```text
                 EXTERNAL INPUT (Raw Text, URL, Headers, Document)
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │  API & SCHEMA VALIDATOR  │
                     │  (Null/Primitive Guard)  │
                     └────────────┬─────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │ NORMALIZE & CANONICALIZE │
                     │  - NFKC Normalization    │
                     │  - Zero-Width Strip      │
                     │  - WHATWG Hostname Parse │
                     └────────────┬─────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │         LAYER 1          │
                     │ DETERMINISTIC SCREENING  │
                     │  - Dangerous URI Scheme  │
                     │  - Known Malicious / IDN │
                     │  - Hard Block Emitted    │
                     └────────────┬─────────────┘
                                  │
                          HARD BLOCK MONOTONIC
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │         LAYER 2          │
                     │    SEMANTIC / NEURAL     │
                     │  - Multi-Label Context   │
                     │  - Educational Immunity  │
                     │    (Gated by L1 PASS)    │
                     └────────────┬─────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │         LAYER 3          │
                     │  EXTERNAL EVIDENCE / RAG │
                     │  - Claim Grounding       │
                     │  - Contradiction Check   │
                     └────────────┬─────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │         LAYER 4          │
                     │  POLICY & EVIDENCE FUSION│
                     │  - Hard Decision Policy  │
                     │  - Monotonicity Guard    │
                     └────────────┬─────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │    FRAUD RISK ENGINE     │
                     │  - 9-Dimension Risk      │
                     │  - Provenance Gate       │
                     │  - Fail-Closed Handling  │
                     └────────────┬─────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │    ACADEMIC LIVE-SYNC    │
                     │  - Provenance Isolation  │
                     │  - Semantic Diff & DAG   │
                     └────────────┬─────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │  DOCUMENT SNAPSHOT STORE │
                     │  - SHA-256 Pinned State  │
                     │  - Defensive Data Clone  │
                     │  - Stale Fallback Warning│
                     └────────────┬─────────────┘
                                  │
                                  ▼
                         SERIALIZED OUTPUT
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │    DOWNSTREAM CONSUMER   │
                     │ (Server Authority Model) │
                     └──────────────────────────┘
```

---

## 2. Core System-Level Security Invariants

1. **Invariant 01 — Fail-Closed**:
   `null`, `undefined`, malformed shapes, empty strings, missing evidence, and unverified origins evaluate to `INSUFFICIENT_DATA` or `SUSPICIOUS_NEEDS_REVIEW`. They **never** fail open to `VERIFIED_OFFICIAL`, `VERIFIED_UPDATED`, or `ALLOW`.
2. **Invariant 02 — Hard Block Monotonicity**:
   Once a hard safety rule emits `BLOCKED`, downstream layers (Layer 2, Layer 3, Layer 4, FraudRiskEngine, LiveSync) **cannot downgrade** the verdict to `ALLOW` or `VERIFIED`. Hard blocks are non-overridable.
3. **Invariant 03 — Provenance Monotonicity**:
   Unverified sources (`TIER_4_UNKNOWN`, `TIER_5_UNTRUSTED`) cannot escalate to `TIER_1_OFFICIAL` or `VERIFIED_UPDATED` regardless of content similarity, copied official phrasing, or institutional keywords.
4. **Invariant 04 — Authority Monotonicity**:
   Official domain trust is strictly determined by canonical hostname matching against `OFFICIAL_HCMUTE_ALLOWLIST`. Subdomain suffixes (`hcmute.edu.vn.attacker.com`), userinfo spoofs (`hcmute.edu.vn@attacker.com`), and path tricks are strictly rejected.
5. **Invariant 05 — Decision Field Ownership**:
   Authoritative security fields (`decision`, `overallRisk`, `provenance`, `hardRulesTriggered`) are computed internally. Injected caller-supplied values are strictly overwritten or ignored.
6. **Invariant 06 — Security Semantics Survive Boundaries**:
   The security verdict and its constituent evidence remain identical across function invocations, serialization/deserialization roundtrips, snapshot archiving, and cache restores.

---

## 3. Explicit Domain & Implementation Caveats

1. **Defensive Cloning Assumption in Snapshot Domain**:
   Snapshot records in `DocumentSnapshotStore` are plain serializable data structures (strings, numbers, booleans, arrays, plain objects). Defensive cloning before exposure via `JSON.parse(JSON.stringify(doc))` is intentionally scoped to this domain data model and does not claim to be a universal deep clone for arbitrary JavaScript types (e.g., `Date`, `Map`, `Set`, `BigInt`, class instances).
2. **Adversarial & ReDoS Execution Time**:
   Worst-case adversarial string evaluations complete within bounded execution time without catastrophic backtracking. Sub-millisecond benchmarks represent regression benchmarks on the tested runtime environment, not hardware-agnostic theoretical guarantees.
3. **Client-Side vs. Server-Side Trust Boundary**:
   Evaluations occurring in browser environments are strictly **informative previews**. Authoritative security decisions, academic state mutations, and policy enforcement remain exclusively on the trusted server / background worker boundary.

---

## 4. Operational Change-Control Policy

Following the V5 release freeze:
1. **No Ad-Hoc Vulnerability Hunts**: The architecture and security rules are frozen at baseline `3699775`.
2. **Targeted Verification Workflow**: Any future modifications to URL parsing, normalization, provenance gates, Layer 1–4 policies, LiveSync diffing, or snapshot persistence must run:
   - Targeted unit and integration tests.
   - Relevant mutation tests (`npm run test:mutation`, `npm run test:mutation-v3`, `npm run test:mutation-v4`).
   - Full master regression suite (`npm run test:all`).
3. **Preservation of Past Audits**: Regression tests in `fraud_risk_audit_v2.test.mjs`, `fraud_risk_audit_v3.test.mjs`, `fraud_risk_integration_audit_v4.test.mjs`, and `fraud_risk_audit_v5_final.test.mjs` must remain permanently active.

---

## 5. Verification & Test Suite Summary

- **Total Test Cases**: 265
- **Test Suites**: 84
- **Test Files**: 20
- **PASS**: 265 / 265 (100%) | **FAIL**: 0 | **SKIP**: 0
- **Actual Source Mutants**: 31 / 31 KILLED (0 surviving)
- **Repeatability**: 3 / 3 independent runs verified 100% deterministic.
