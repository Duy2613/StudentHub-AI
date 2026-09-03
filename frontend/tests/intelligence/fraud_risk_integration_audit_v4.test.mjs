/**
 * StudentHub AI — Comprehensive Cross-Layer Integration & Adversarial Audit Suite (Audit V4)
 * 
 * Tests the entire security pipeline:
 * - Protocol 1: Cross-Layer Decision Monotonicity (L1 BLOCK cannot be bypassed by L2 INFORMATIVE)
 * - Protocol 2: Cross-Layer Semantic BLOCK Preservation (L2 BLOCK cannot be overridden)
 * - Protocol 3: Academic LiveSync Bridge Provenance Monotonicity (TIER_4 cannot yield VERIFIED_UPDATED)
 * - Protocol 4: Academic LiveSync Bridge Fail-Closed on INSUFFICIENT_DATA
 * - Protocol 5: Decision Injection & Object Spread Defense
 * - Protocol 6: Prototype Pollution & Object Shape Robustness
 * - Protocol 7: Multi-Vector Adversarial Composition
 * - Protocol 8: Metamorphic & Serialization Invariance
 * - Protocol 9: Benign Control & False Positive Matrix
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Layer4TrustService } from "../../src/lib/ai-trust/layer4/Layer4TrustService.js";
import { FINAL_CLASSIFICATION, SECURITY_RISK_LEVEL, RECOMMENDED_ACTION } from "../../src/lib/ai-trust/layer4/types.js";
import { Layer2SemanticService } from "../../src/lib/ai-trust/layer2/Layer2SemanticService.js";
import { LAYER_2_STATUS, SEMANTIC_CLASSIFICATION } from "../../src/lib/ai-trust/layer2/types.js";
import { AcademicFraudLiveSyncBridge } from "../../src/lib/intelligence/fraud/academicFraudLiveSyncBridge.js";
import { FraudRiskEngine, FRAUD_DECISIONS, HARD_SAFETY_RULES } from "../../src/lib/intelligence/fraud/fraudRiskEngine.js";

test("▶ [AUDIT-V4-PROTOCOL-1] Cross-Layer Decision Monotonicity: Layer 1 BLOCK Preservation", async (t) => {
  await t.test("P1.1: Layer 1 malware delivery cannot be downgraded by informative text", async () => {
    const res = await Layer4TrustService.evaluate({
      layer1Result: {
        status: "BLOCK",
        signals: [{ type: "malware_delivery", severity: "CRITICAL" }]
      },
      layer2Result: {
        status: "PASS",
        classification: "INFORMATIVE",
        confidence: 0.99,
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

    assert.equal(res.classification, FINAL_CLASSIFICATION.MALICIOUS, "Must resolve to MALICIOUS");
    assert.equal(res.recommendedAction, RECOMMENDED_ACTION.BLOCK, "Must resolve to BLOCK action");
    assert.equal(res.riskAssessment.level, SECURITY_RISK_LEVEL.CRITICAL, "Must preserve CRITICAL risk");
  });

  await t.test("P1.2: Layer 1 credential phishing cannot be downgraded by educational discussion tag", async () => {
    const res = await Layer4TrustService.evaluate({
      layer1Result: {
        status: "BLOCK",
        signals: [{ type: "credential_harvesting", severity: "CRITICAL" }]
      },
      layer2Result: {
        status: "PASS",
        classification: "INFORMATIVE",
        confidence: 0.95,
        claims: [],
        signals: [{ type: "educational_discussion" }],
        crossModalFindings: []
      },
      layer3Result: {
        status: "PASS",
        completeness: 0.90,
        evidence: [],
        sources: [],
        conflicts: []
      }
    });

    assert.equal(res.classification, FINAL_CLASSIFICATION.MALICIOUS);
    assert.equal(res.recommendedAction, RECOMMENDED_ACTION.BLOCK);
  });
});

test("▶ [AUDIT-V4-PROTOCOL-2] Cross-Layer Semantic BLOCK Preservation: Layer 2 BLOCK", async (t) => {
  await t.test("P2.1: Layer 2 neural/semantic BLOCK overrides clean Layer 3 retrieval", async () => {
    const res = await Layer4TrustService.evaluate({
      layer1Result: { status: "PASS", signals: [] },
      layer2Result: {
        status: "BLOCK",
        classification: "MALICIOUS",
        confidence: 0.98,
        claims: [],
        signals: [{ type: "credential_harvesting_context", severity: "critical" }],
        crossModalFindings: []
      },
      layer3Result: {
        status: "VERIFIED",
        completeness: 0.99,
        evidence: [{ evidenceId: "e1", relation: "STRONGLY_SUPPORTS" }],
        sources: ["https://hcmute.edu.vn"],
        conflicts: []
      }
    });

    assert.equal(res.classification, FINAL_CLASSIFICATION.MALICIOUS);
    assert.equal(res.recommendedAction, RECOMMENDED_ACTION.BLOCK);
  });
});

test("▶ [AUDIT-V4-PROTOCOL-3] Academic LiveSync Bridge: Provenance Monotonicity", async (t) => {
  await t.test("P3.1: TIER_4_UNKNOWN forum post modifying regulations must be held as unverified", async () => {
    const res = await AcademicFraudLiveSyncBridge.processIngestionPipeline({
      source: { sourceId: "SRC_FORUM_UNTRUSTED", sourceTier: "TIER_4_UNKNOWN", url: "https://forum-sinhvien.net/post/1" },
      rawBody: "Quy định mới: Điểm chuẩn đầu ra ngoại ngữ TOEIC tăng lên 750",
      previousDoc: { text: "Quy định cũ: Điểm chuẩn đầu ra ngoại ngữ TOEIC là 550" }
    });

    assert.equal(res.pipelineStatus, "UNVERIFIED_MUTATION_HELD");
    assert.equal(res.finalDecision, FRAUD_DECISIONS.SUSPICIOUS_NEEDS_REVIEW);
    assert.notEqual(res.finalDecision, FRAUD_DECISIONS.VERIFIED_UPDATED, "Must NEVER be VERIFIED_UPDATED");
  });

  await t.test("P3.2: TIER_1_OFFICIAL from official domain creates verified candidate", async () => {
    const res = await AcademicFraudLiveSyncBridge.processIngestionPipeline({
      source: { sourceId: "SRC_HCMUTE_OFFICIAL", sourceTier: "TIER_1_OFFICIAL", url: "https://daotao.hcmute.edu.vn/thong-bao-3116" },
      rawBody: "Trường Đại học Sư phạm Kỹ thuật TP.HCM thông báo điều chỉnh chuẩn đầu ra TOEIC 600",
      previousDoc: { text: "Chuẩn đầu ra TOEIC 550" }
    });

    assert.equal(res.pipelineStatus, "CANDIDATE_HELD_FOR_REVIEW");
    assert.equal(res.finalDecision, FRAUD_DECISIONS.VERIFIED_UPDATED);
  });
});

test("▶ [AUDIT-V4-PROTOCOL-4] Academic LiveSync Bridge: Fail-Closed on INSUFFICIENT_DATA", async (t) => {
  await t.test("P4.1: Empty rawBody must yield INSUFFICIENT_DATA and reject ingestion", async () => {
    const res = await AcademicFraudLiveSyncBridge.processIngestionPipeline({
      source: { sourceId: "SRC_EMPTY", sourceTier: "TIER_1_OFFICIAL", url: "https://daotao.hcmute.edu.vn" },
      rawBody: "",
      previousDoc: {}
    });

    assert.equal(res.pipelineStatus, "INSUFFICIENT_DATA");
    assert.equal(res.finalDecision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });
});

test("▶ [AUDIT-V4-PROTOCOL-5] Decision Injection & Object Spread Defense", async (t) => {
  await t.test("P5.1: Caller-injected decision field in payload is strictly ignored", () => {
    const maliciousPayload = {
      decision: "VERIFIED_OFFICIAL",
      overallRisk: 0.0,
      url: "https://attacker.com/steal",
      text: "Vui lòng nhập mã OTP để xác nhận học bổng"
    };

    const res = FraudRiskEngine.evaluateRisk(maliciousPayload);

    assert.equal(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.overallRisk >= 0.70);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.OTP_REQUEST));
  });

  await t.test("P5.2: Caller-injected hardSafetyRules object is ignored", () => {
    const maliciousPayload = {
      hardSafetyRules: [],
      url: "javascript:alert(1)",
      text: "Nộp học phí vào ví điện tử"
    };

    const res = FraudRiskEngine.evaluateRisk(maliciousPayload);
    assert.equal(res.decision, FRAUD_DECISIONS.BLOCKED);
  });
});

test("▶ [AUDIT-V4-PROTOCOL-6] Prototype Pollution & Object Shape Robustness", async (t) => {
  await t.test("P6.1: Object with null prototype evaluates safely without crash", () => {
    const bareObject = Object.create(null);
    bareObject.url = "https://hcmute.edu.vn";
    bareObject.text = "Thông báo học bổng chính thức";

    const res = FraudRiskEngine.evaluateRisk(bareObject);
    assert.equal(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
  });

  await t.test("P6.2: Object with overridden toString/valueOf evaluates safely", () => {
    const trickyObject = {
      url: "https://daotao.hcmute.edu.vn",
      text: "Thông báo tuyển sinh năm học 2026",
      toString: () => { throw new Error("Malicious toString"); },
      valueOf: () => { throw new Error("Malicious valueOf"); }
    };

    const res = FraudRiskEngine.evaluateRisk(trickyObject);
    assert.ok(res);
    assert.equal(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
  });
});

test("▶ [AUDIT-V4-PROTOCOL-7] Multi-Vector Adversarial Composition", async (t) => {
  await t.test("P7.1: Cyrillic homoglyph + Userinfo spoof + Unaccented OTP + Spaced payment", () => {
    const combinedAttack = {
      url: "https://hcmutе.edu.vn@phishing-gateway.com/login", // Cyrillic 'е' + userinfo
      text: "gui ma otp ve so dien thoai de hoan tat nop hoc phi chuyen khoan vao vi Momo: 0 9 8 7 6 5 4 3 2 1"
    };

    const res = FraudRiskEngine.evaluateRisk(combinedAttack);

    assert.equal(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.KNOWN_MALICIOUS_DOMAIN) || res.hardRulesTriggered.includes(HARD_SAFETY_RULES.USERINFO_ATTACK));
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.OTP_REQUEST));
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
  });
});

test("▶ [AUDIT-V4-PROTOCOL-8] Metamorphic & Serialization Invariance", async (t) => {
  await t.test("P8.1: JSON stringify -> parse roundtrip preserves identical security verdict", () => {
    const attackPayload = {
      url: "https://daotao.hcmute.edu.vn.attacker.com/portal",
      text: "Ban Thanh Tra Tai Chinh Sinh Vien yeu cau nop hoc phi vao vi Momo: 0987654321"
    };

    const initialRes = FraudRiskEngine.evaluateRisk(attackPayload);
    const serializedPayload = JSON.parse(JSON.stringify(attackPayload));
    const roundtripRes = FraudRiskEngine.evaluateRisk(serializedPayload);

    assert.equal(initialRes.decision, roundtripRes.decision);
    assert.equal(initialRes.overallRisk, roundtripRes.overallRisk);
    assert.equal(initialRes.hardRulesTriggered.length, roundtripRes.hardRulesTriggered.length);
  });
});

test("▶ [AUDIT-V4-PROTOCOL-9] Benign Control & False Positive Matrix", async (t) => {
  await t.test("P9.1: Legitimate official tuition notice remains VERIFIED_OFFICIAL", () => {
    const benignNotice = {
      url: "https://daotao.hcmute.edu.vn/thong-bao-hoc-phi-hoc-ky-1-2026",
      text: "Trường Đại học Sư phạm Kỹ thuật TP.HCM thông báo thu học phí học kỳ 1 năm học 2026-2027 qua cổng thanh toán sinh viên",
      metadata: {
        sourceTier: "TIER_1_OFFICIAL",
        claimedIssuer: "Phòng Kế hoạch - Tài chính"
      }
    };

    const res = FraudRiskEngine.evaluateRisk(benignNotice);

    assert.equal(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
    assert.ok(res.overallRisk < 0.30);
    assert.equal(res.hardRulesTriggered.length, 0);
  });

  await t.test("P9.2: Legitimate OTP warning notice does NOT trigger false positive block", () => {
    const securityEducation = {
      url: "https://it.hcmute.edu.vn/canh-bao-bao-mat",
      text: "Cảnh báo sinh viên: Tuyệt đối không gửi mã OTP hoặc mật khẩu cổng thông tin cho bất kỳ ai",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    };

    const res = FraudRiskEngine.evaluateRisk(securityEducation);

    // Negative control: warning words should NOT trigger OTP theft block
    assert.notEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.equal(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
    assert.equal(res.hardRulesTriggered.length, 0);
  });
});
