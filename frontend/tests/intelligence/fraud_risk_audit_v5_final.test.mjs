/**
 * StudentHub AI — Master Audit V5 Final System Hardening & Certification Suite
 * 
 * Comprehensive End-to-End Verification across:
 * - Domain 1: API Boundary & Schema Robustness
 * - Domain 2: Serialization & Deserialization Invariance
 * - Domain 3: Decision & Security Field Injection Resistance
 * - Domain 4: Persistence Immutability & In-Memory Tamper Resistance
 * - Domain 5: Snapshot Staleness & TOCTOU Hash Pinning
 * - Domain 6: Configuration & Domain Allowlist Integrity
 * - Domain 7: ReDoS Boundedness & Resource Exhaustion Defense
 * - Domain 8: End-to-End Adversarial Attack Chains (A, B, C, D)
 * - Domain 9: Reason / Decision / Evidence Logical Coherence
 */

import test from "node:test";
import assert from "node:assert/strict";

import { FraudRiskEngine, FRAUD_DECISIONS, HARD_SAFETY_RULES, OFFICIAL_HCMUTE_ALLOWLIST } from "../../src/lib/intelligence/fraud/fraudRiskEngine.js";
import { AcademicFraudLiveSyncBridge } from "../../src/lib/intelligence/fraud/academicFraudLiveSyncBridge.js";
import { DocumentSnapshotStore } from "../../src/lib/intelligence/academic/documentSnapshotStore.js";
import { LiveSourceWatcher } from "../../src/lib/intelligence/academic/liveSourceWatcher.js";
import { Layer4TrustService } from "../../src/lib/ai-trust/layer4/Layer4TrustService.js";
import { FINAL_CLASSIFICATION, SECURITY_RISK_LEVEL, RECOMMENDED_ACTION } from "../../src/lib/ai-trust/layer4/types.js";

test("▶ [AUDIT-V5-DOMAIN-1] API Boundary & Schema Robustness", async (t) => {
  await t.test("D1.1: FraudRiskEngine handles unexpected primitive and non-object inputs safely", () => {
    const primitives = [null, undefined, 42, "random_string", true, false, Symbol("sec"), 999999999999n];
    for (const p of primitives) {
      const res = FraudRiskEngine.evaluateRisk(p);
      assert.ok(res, "Result must exist");
      assert.equal(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA, `Primitive ${String(p)} must yield INSUFFICIENT_DATA`);
    }
  });

  await t.test("D1.2: AcademicLiveSyncBridge handles null and malformed input objects safely", async () => {
    const malformedInputs = [null, undefined, {}, { rawBody: null }, { source: null, rawBody: "" }];
    for (const input of malformedInputs) {
      const res = await AcademicFraudLiveSyncBridge.processIngestionPipeline(input);
      assert.ok(res);
      assert.equal(res.pipelineStatus, "INSUFFICIENT_DATA");
      assert.equal(res.finalDecision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
    }
  });

  await t.test("D1.3: Layer4TrustService handles missing/null layer outputs with fail-closed default", async () => {
    const res = await Layer4TrustService.evaluate({
      layer1Result: null,
      layer2Result: null,
      layer3Result: null
    });
    assert.ok(res);
    assert.notEqual(res.classification, FINAL_CLASSIFICATION.VERIFIED_TRUE, "Cannot be VERIFIED_TRUE with null layers");
    assert.notEqual(res.recommendedAction, RECOMMENDED_ACTION.ALLOW, "Cannot be ALLOW with null layers");
  });
});

test("▶ [AUDIT-V5-DOMAIN-2] Serialization & Deserialization Invariance", async (t) => {
  await t.test("D2.1: Full evaluation report survives JSON serialization roundtrip without loss", () => {
    const payload = {
      url: "https://daotao.hcmute.edu.vn/thong-bao",
      text: "Trường Đại học Sư phạm Kỹ thuật TP.HCM thông báo kế hoạch học tập năm 2026",
      metadata: { sourceTier: "TIER_1_OFFICIAL", claimedIssuer: "Phòng Đào tạo" }
    };

    const initial = FraudRiskEngine.evaluateRisk(payload);
    const jsonStr = JSON.stringify(initial);
    const deserialized = JSON.parse(jsonStr);

    assert.equal(deserialized.decision, initial.decision);
    assert.equal(deserialized.overallRisk, initial.overallRisk);
    assert.deepEqual(deserialized.hardRulesTriggered, initial.hardRulesTriggered);
    assert.deepEqual(deserialized.dimensions, initial.dimensions);
    assert.equal(deserialized.provenanceTrace.hostname, "daotao.hcmute.edu.vn");
  });

  await t.test("D2.2: Malicious payload serialization roundtrip preserves BLOCKED verdict", () => {
    const attackPayload = {
      url: "javascript:alert(1)",
      text: "Nộp tiền học phí vào ví Momo: 0987654321"
    };

    const initial = FraudRiskEngine.evaluateRisk(attackPayload);
    const roundtrip = JSON.parse(JSON.stringify(initial));

    assert.equal(roundtrip.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(roundtrip.hardRulesTriggered.includes(HARD_SAFETY_RULES.MALWARE_DOWNLOAD));
    assert.ok(roundtrip.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
  });
});

test("▶ [AUDIT-V5-DOMAIN-3] Decision & Security Field Injection Resistance", async (t) => {
  await t.test("D3.1: Attacker cannot inject fake decision, fake risk, or fake provenance", () => {
    const injectionAttempt = {
      decision: "VERIFIED_OFFICIAL",
      overallRisk: 0.0,
      confidence: 1.0,
      provenance: "TIER_1_OFFICIAL",
      isOfficial: true,
      url: "https://phishing-portal.com",
      text: "Yêu cầu nhập mật khẩu cổng thông tin sinh viên"
    };

    const res = FraudRiskEngine.evaluateRisk(injectionAttempt);

    assert.equal(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.overallRisk >= 0.70);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.CREDENTIAL_EXFILTRATION_REQUEST));
  });
});

test("▶ [AUDIT-V5-DOMAIN-4] Persistence Immutability & In-Memory Tamper Resistance", async (t) => {
  await t.test("D4.1: Mutating returned snapshot object does NOT mutate internal archive", () => {
    const doc = DocumentSnapshotStore.getActiveSnapshot("DOC_QD_3116");
    assert.ok(doc);
    assert.equal(doc.status, "ACTIVE");

    // Attempt to tamper with returned object
    doc.status = "TAMPERED_BY_ATTACKER";
    doc.contentHash = "00000000000000000000000000000000";

    // Re-query the store
    const freshQuery = DocumentSnapshotStore.getActiveSnapshot("DOC_QD_3116");
    assert.equal(freshQuery.status, "ACTIVE", "Internal store status must remain ACTIVE");
    assert.equal(freshQuery.contentHash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "Internal hash must remain intact");
  });
});

test("▶ [AUDIT-V5-DOMAIN-5] Snapshot Staleness & TOCTOU Hash Pinning", async (t) => {
  await t.test("D5.1: Live source failure triggers serveLastVerifiedState with STALE warning", () => {
    const fallback = DocumentSnapshotStore.serveLastVerifiedState("DOC_QD_3116", true);
    assert.equal(fallback.found, true);
    assert.equal(fallback.isStale, true);
    assert.ok(fallback.warning.includes("[STALE_SOURCE_WARNING]"));
    assert.equal(fallback.document.status, "ACTIVE");
  });

  await t.test("D5.2: Content hash is deterministic SHA-256", () => {
    const text = "Quy chế đào tạo trình độ đại học HCMUTE 2025";
    const hash1 = LiveSourceWatcher.computeContentHash(text);
    const hash2 = LiveSourceWatcher.computeContentHash(text);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });
});

test("▶ [AUDIT-V5-DOMAIN-6] Configuration & Domain Allowlist Integrity", async (t) => {
  await t.test("D6.1: Allowlist contains only valid official HCMUTE domains", () => {
    for (const domain of OFFICIAL_HCMUTE_ALLOWLIST) {
      assert.ok(domain.endsWith("hcmute.edu.vn"), `Domain [${domain}] must end with hcmute.edu.vn`);
      assert.ok(!domain.includes("/"), `Domain [${domain}] must not contain path separators`);
      assert.ok(!domain.includes("@"), `Domain [${domain}] must not contain userinfo`);
    }
  });

  await t.test("D6.2: Suffix lookalike domains are strictly rejected from official status", () => {
    const attackHosts = [
      "hcmute.edu.vn.attacker.com",
      "daotao.hcmute.edu.vn.phishing.net",
      "hcmute.edu.vn@attacker.com",
      "fake-hcmute.edu.vn"
    ];

    for (const host of attackHosts) {
      const res = FraudRiskEngine.evaluateRisk({ url: `https://${host}`, text: "Thông báo" });
      assert.notEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL, `Host [${host}] must NOT be VERIFIED_OFFICIAL`);
    }
  });
});

test("▶ [AUDIT-V5-DOMAIN-7] ReDoS Boundedness & Resource Limits", async (t) => {
  await t.test("D7.1: Pathological large string evaluates in < 50ms without catastrophic backtracking", () => {
    // 10,000 characters of repeated deceptive text
    const largeAdversarialText = "học phí chuyển khoản nộp vào tài khoản ".repeat(250) + "0987654321";
    const startTime = performance.now();
    const res = FraudRiskEngine.evaluateRisk({ text: largeAdversarialText, url: "https://attacker.com" });
    const duration = performance.now() - startTime;

    assert.ok(duration < 50, `Evaluation took ${duration}ms, must be < 50ms`);
    assert.ok(res.overallRisk >= 0.40);
  });
});

test("▶ [AUDIT-V5-DOMAIN-8] End-to-End Adversarial Attack Chains", async (t) => {
  await t.test("Chain A: Unknown source copying official wording does NOT yield VERIFIED_UPDATED", async () => {
    const res = await AcademicFraudLiveSyncBridge.processIngestionPipeline({
      source: { sourceId: "SRC_COPYCAT", sourceTier: "TIER_4_UNKNOWN", url: "https://copycat-news.com/qd3116" },
      rawBody: "Trường Đại học Sư phạm Kỹ thuật TP.HCM ban hành Quyết định số 3116: Điều chỉnh chuẩn TOEIC 650",
      previousDoc: { text: "Chuẩn TOEIC 550" }
    });

    assert.equal(res.pipelineStatus, "UNVERIFIED_MUTATION_HELD");
    assert.equal(res.finalDecision, FRAUD_DECISIONS.SUSPICIOUS_NEEDS_REVIEW);
    assert.notEqual(res.finalDecision, FRAUD_DECISIONS.VERIFIED_UPDATED);
  });

  await t.test("Chain B: Educational wrapper around dangerous javascript: URI triggers BLOCKED", async () => {
    const res = await Layer4TrustService.evaluate({
      layer1Result: {
        status: "BLOCK",
        signals: [{ type: "dangerous_uri_scheme", severity: "CRITICAL" }]
      },
      layer2Result: {
        status: "PASS",
        classification: "INFORMATIVE",
        confidence: 0.98,
        claims: [],
        signals: [{ type: "educational_discussion" }],
        crossModalFindings: []
      },
      layer3Result: {
        status: "PASS",
        completeness: 0.95,
        evidence: [],
        sources: [],
        conflicts: []
      }
    });

    assert.equal(res.classification, FINAL_CLASSIFICATION.MALICIOUS);
    assert.equal(res.recommendedAction, RECOMMENDED_ACTION.BLOCK);
  });

  await t.test("Chain C: Cyrillic homoglyph + Userinfo + Unaccented OTP + Spaced payment is BLOCKED", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://hcmutе.edu.vn@malicious-node.com/portal",
      text: "gui ma otp de xac nhan nop hoc phi vao vi Momo: 0 9 8 7 6 5 4 3 2 1"
    });

    assert.equal(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.length >= 2);
  });

  await t.test("Chain D: Official institutional OTP warning is NOT falsely blocked", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://it.hcmute.edu.vn/canh-bao-bao-mat",
      text: "Cảnh báo sinh viên: Tuyệt đối không gửi mã OTP hoặc mật khẩu cổng thông tin cho bất kỳ ai",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });

    assert.equal(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
    assert.equal(res.hardRulesTriggered.length, 0);
    assert.ok(res.overallRisk < 0.30);
  });
});

test("▶ [AUDIT-V5-DOMAIN-9] Reason / Decision Logical Consistency", async (t) => {
  await t.test("D9.1: BLOCKED decisions always contain explicit non-empty reasons and matched rules", () => {
    const maliciousPayloads = [
      { url: "javascript:alert(1)", text: "Nhấn vào đây" },
      { url: "https://attacker.com", text: "Vui lòng gửi mã OTP xác nhận" },
      { url: "https://attacker.com", text: "Nộp tiền học phí vào ví Momo: 0987654321" },
      { url: "https://hcmutе.edu.vn", text: "Trang chủ" }
    ];

    for (const payload of maliciousPayloads) {
      const res = FraudRiskEngine.evaluateRisk(payload);
      assert.equal(res.decision, FRAUD_DECISIONS.BLOCKED);
      assert.ok(res.reasons.length > 0, "Reasons must not be empty on BLOCKED");
      assert.ok(res.hardRulesTriggered.length > 0, "hardRulesTriggered must not be empty on BLOCKED");
      assert.ok(res.overallRisk >= 0.70, "overallRisk must be elevated on BLOCKED");
    }
  });

  await t.test("D9.2: VERIFIED_OFFICIAL decisions have zero hard rules and low risk", () => {
    const officialPayloads = [
      {
        url: "https://daotao.hcmute.edu.vn/thong-bao",
        text: "Trường Đại học Sư phạm Kỹ thuật TP.HCM thông báo lịch thi kết thúc học phần",
        metadata: { sourceTier: "TIER_1_OFFICIAL" }
      },
      {
        url: "https://fit.hcmute.edu.vn/khung-chuong-trinh",
        text: "Khoa Công nghệ Thông tin thông báo khung chương trình đào tạo Khóa 2026",
        metadata: { sourceTier: "TIER_1_OFFICIAL" }
      }
    ];

    for (const payload of officialPayloads) {
      const res = FraudRiskEngine.evaluateRisk(payload);
      assert.equal(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
      assert.equal(res.hardRulesTriggered.length, 0);
      assert.ok(res.overallRisk < 0.30);
    }
  });
});
