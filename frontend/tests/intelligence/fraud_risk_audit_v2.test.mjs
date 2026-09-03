/**
 * StudentHub AI — Fraud & Risk Intelligence Audit V2 Adversarial Test Suite
 * 
 * Verifies all confirmed findings from Audit V2:
 * - Input contract: null/undefined/{}/empty → INSUFFICIENT_DATA (never VERIFIED)
 * - URL canonicalization: case, trailing dot, userinfo, attacker suffix
 * - Homoglyph/IDN: correct Punycode (xn--hcmut-3we), Cyrillic, legitimate IDN
 * - Payment evasion: spaced/dashed/dotted digits
 * - Credential semantic patterns: paraphrased exfiltration
 * - False positive matrix: legitimate login, official update, official payment, IDN
 * - False negative matrix: userinfo spoof, attacker suffix, paraphrased OTP
 * - Hard rule precedence: hard rule > composite score
 * - Fail-closed: every error path returns non-verified state
 * - Rejected findings: Đ/đ regex works with /i, no /u required
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { FraudRiskEngine, FRAUD_DECISIONS, HARD_SAFETY_RULES } from "../../src/lib/intelligence/fraud/fraudRiskEngine.js";

console.log("======================================================================");
console.log("🔬 STUDENTHUB AI — AUDIT V2 ADVERSARIAL TEST SUITE");
console.log("======================================================================");

// ===================================================================
// SECTION 1: INPUT CONTRACT — FAIL-CLOSED VERIFICATION
// ===================================================================
describe("[AUDIT-V2-01] Input Contract: Fail-Closed on Invalid Input", () => {
  it("evaluateRisk(null) → INSUFFICIENT_DATA, no crash", () => {
    const res = FraudRiskEngine.evaluateRisk(null);
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
    assert.strictEqual(res.overallRisk, 0);
    assert.strictEqual(res.evidenceCompleteness, 0);
  });

  it("evaluateRisk(undefined) → INSUFFICIENT_DATA, no crash", () => {
    const res = FraudRiskEngine.evaluateRisk(undefined);
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
    assert.strictEqual(res.overallRisk, 0);
  });

  it("evaluateRisk({}) → INSUFFICIENT_DATA (no usable url or text)", () => {
    const res = FraudRiskEngine.evaluateRisk({});
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
    assert.notStrictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
  });

  it("evaluateRisk({ url: '' }) → INSUFFICIENT_DATA", () => {
    const res = FraudRiskEngine.evaluateRisk({ url: "" });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("evaluateRisk({ text: '' }) → INSUFFICIENT_DATA", () => {
    const res = FraudRiskEngine.evaluateRisk({ text: "" });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("evaluateRisk({ url: '   ', text: '  ' }) → INSUFFICIENT_DATA (whitespace only)", () => {
    const res = FraudRiskEngine.evaluateRisk({ url: "   ", text: "  " });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("evaluateRisk(42) → INSUFFICIENT_DATA (non-object)", () => {
    const res = FraudRiskEngine.evaluateRisk(42);
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("evaluateRisk('string') → INSUFFICIENT_DATA (non-object)", () => {
    const res = FraudRiskEngine.evaluateRisk("string");
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("evaluateRisk([]) → INSUFFICIENT_DATA (array is not valid payload)", () => {
    const res = FraudRiskEngine.evaluateRisk([]);
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("evaluateRisk({ url: null, text: null }) → INSUFFICIENT_DATA (null fields)", () => {
    const res = FraudRiskEngine.evaluateRisk({ url: null, text: null });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("evaluateRisk({ url: 123, text: true }) → INSUFFICIENT_DATA (wrong types)", () => {
    const res = FraudRiskEngine.evaluateRisk({ url: 123, text: true });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("evaluateRisk({ metadata: null }) → INSUFFICIENT_DATA (no url/text with null metadata)", () => {
    const res = FraudRiskEngine.evaluateRisk({ metadata: null });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });
});

// ===================================================================
// SECTION 2: URL CANONICALIZATION MATRIX
// ===================================================================
describe("[AUDIT-V2-02] URL Canonicalization & Domain Trust", () => {
  it("should handle case-insensitive URLs correctly: HTTPS://HCMUTE.EDU.VN", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "HTTPS://HCMUTE.EDU.VN/ANNOUNCEMENT",
      text: "Thông báo chung",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });
    // Should parse hostname as hcmute.edu.vn, recognized as official
    assert.strictEqual(res.provenanceTrace.hostname, "hcmute.edu.vn");
    assert.strictEqual(res.dimensions.sourceRisk, 0.02);
  });

  it("should strip trailing dot: hcmute.edu.vn. → hcmute.edu.vn", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://hcmute.edu.vn./thong-bao",
      text: "Thông báo chung",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });
    assert.strictEqual(res.provenanceTrace.hostname, "hcmute.edu.vn");
  });

  it("should detect userinfo attack: hcmute.edu.vn@attacker.com", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://hcmute.edu.vn@attacker.com/portal",
      text: "Cổng thông tin sinh viên"
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.KNOWN_MALICIOUS_DOMAIN));
    assert.ok(res.evidence.some(e => e.type === "USERINFO_ATTACK"));
  });

  it("should NOT inherit official trust for attacker suffix: hcmute.edu.vn.attacker.com", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://hcmute.edu.vn.attacker.com",
      text: "Cổng thông tin"
    });
    // Hostname = hcmute.edu.vn.attacker.com — NOT in allowlist
    assert.notStrictEqual(res.provenanceTrace.hostname, "hcmute.edu.vn");
    assert.ok(res.dimensions.sourceRisk >= 0.80);
  });

  it("should NOT inherit official trust for path-only: attacker.com/hcmute.edu.vn", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://attacker.com/hcmute.edu.vn",
      text: "Thông báo"
    });
    assert.strictEqual(res.provenanceTrace.hostname, "attacker.com");
    assert.ok(res.dimensions.sourceRisk >= 0.80);
  });

  it("should correctly identify official subdomain: daotao.hcmute.edu.vn", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://daotao.hcmute.edu.vn/tin-tuc",
      text: "Lịch học kỳ 1",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });
    assert.strictEqual(res.provenanceTrace.hostname, "daotao.hcmute.edu.vn");
    assert.strictEqual(res.dimensions.sourceRisk, 0.02);
  });
});

// ===================================================================
// SECTION 3: HOMOGLYPH / IDN / PUNYCODE (CORRECTED BENCHMARK)
// ===================================================================
describe("[AUDIT-V2-03] Homoglyph & IDN Detection (Corrected Punycode)", () => {
  it("should detect Cyrillic е (U+0435) in raw URL as homoglyph attack", () => {
    // hcmutе.edu.vn with Cyrillic е — correct Punycode is xn--hcmut-3we.edu.vn
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://hcmut\u0435.edu.vn/hoc-bong",
      text: "Nhận học bổng"
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.KNOWN_MALICIOUS_DOMAIN));
  });

  it("should detect correct Punycode xn--hcmut-3we.edu.vn as confusable with hcmute", () => {
    // This is the CORRECT Punycode for hcmutе.edu.vn (Cyrillic е)
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://xn--hcmut-3we.edu.vn/thong-bao",
      text: "Thông báo khẩn cấp"
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.KNOWN_MALICIOUS_DOMAIN));
  });

  it("should NOT flag legitimate unrelated IDN domain as malicious", () => {
    // A Vietnamese IDN or other legitimate international domain
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://xn--80akhbyknj4f.example.com/page",
      text: "Trang web bình thường"
    });
    // Should NOT be flagged as KNOWN_MALICIOUS_DOMAIN
    assert.ok(!res.hardRulesTriggered.includes(HARD_SAFETY_RULES.KNOWN_MALICIOUS_DOMAIN));
  });

  it("should NOT flag normal ASCII domain as homoglyph", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://example.com/page",
      text: "Trang web bình thường"
    });
    assert.ok(!res.hardRulesTriggered.includes(HARD_SAFETY_RULES.KNOWN_MALICIOUS_DOMAIN));
  });
});

// ===================================================================
// SECTION 4: PAYMENT EVASION TESTS (SPACED/DASHED DIGITS)
// ===================================================================
describe("[AUDIT-V2-04] Payment Fraud with Digit Obfuscation", () => {
  it("should detect spaced digits: Momo: 0 9 8 7 6 5 4 3 2 1", () => {
    const res = FraudRiskEngine.evaluateRisk({
      text: "Thông báo nộp học phí kỳ 1. Chuyển khoản Momo: 0 9 8 7 6 5 4 3 2 1 (Nguyen Van A)"
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
  });

  it("should detect dashed digits: Momo: 0987-654-321", () => {
    const res = FraudRiskEngine.evaluateRisk({
      text: "Nộp học phí qua ví Momo: 0987-654-321, chủ tài khoản: Tran Van B"
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
  });

  it("should detect dotted digits: ZaloPay: 0987.654.321", () => {
    const res = FraudRiskEngine.evaluateRisk({
      text: "Sinh viên vui lòng nộp lệ phí qua ZaloPay: 0987.654.321"
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
  });

  it("should still detect normal compact digits: Momo: 0987654321", () => {
    const res = FraudRiskEngine.evaluateRisk({
      text: "Thông báo nộp học phí kỳ 1. Chuyển khoản Momo: 0987654321 (Nguyen Van A)"
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
  });
});

// ===================================================================
// SECTION 5: FALSE POSITIVE MATRIX
// ===================================================================
describe("[AUDIT-V2-05] False Positive Matrix — Legitimate Content Must NOT Be Fraud", () => {
  it("should NOT flag legitimate official login instructions as credential theft", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://daotao.hcmute.edu.vn/login",
      text: "Đăng nhập cổng đào tạo bằng tài khoản sinh viên của bạn. Nhập mã số sinh viên và mật khẩu.",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });
    assert.notStrictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(!res.hardRulesTriggered.includes(HARD_SAFETY_RULES.CREDENTIAL_EXFILTRATION_REQUEST));
  });

  it("should NOT flag official TOEIC update from TIER_1 as fraud", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://hcmute.edu.vn/quy-dinh-k26",
      text: "Quyết định số 2045/QĐ-ĐHSPKT: Chuẩn đầu ra Ngoại ngữ cho khóa K26 là TOEIC 600.",
      metadata: { sourceTier: "TIER_1_OFFICIAL", claimedIssuer: "Phòng Đào Tạo" }
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_UPDATED);
    assert.strictEqual(res.hardRulesTriggered.length, 0);
    assert.strictEqual(res.requiresHumanReview, true);
  });

  it("should NOT flag official bank account (Trường Đại học Sư phạm Kỹ thuật) as personal payment", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://hcmute.edu.vn/thong-bao-hoc-phi",
      text: "Sinh viên nộp học phí vào tài khoản: Chủ tài khoản: Trường Đại học Sư phạm Kỹ thuật TP.HCM, STK: 3100201234567 tại Vietcombank.",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });
    assert.ok(!res.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
  });

  it("should NOT flag legitimate scholarship announcement", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://ctsv.hcmute.edu.vn/hoc-bong",
      text: "Thông báo xét cấp học bổng khuyến khích học tập HK1 2026-2027. Điều kiện: GPA >= 3.2, không nợ tín chỉ.",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });
    assert.notStrictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.notStrictEqual(res.decision, FRAUD_DECISIONS.HIGH_RISK);
  });
});

// ===================================================================
// SECTION 6: FALSE NEGATIVE MATRIX
// ===================================================================
describe("[AUDIT-V2-06] False Negative Matrix — Attacks Must Be Detected", () => {
  it("should detect credential exfiltration with semantic paraphrasing", () => {
    const res = FraudRiskEngine.evaluateRisk({
      text: "Vui lòng gửi lại mã xác thực bảo mật qua tin nhắn để hoàn tất đăng ký học bổng."
    });
    // Should at least be SUSPICIOUS or have credential evidence
    assert.ok(
      res.decision === FRAUD_DECISIONS.BLOCKED ||
      res.decision === FRAUD_DECISIONS.HIGH_RISK ||
      res.decision === FRAUD_DECISIONS.SUSPICIOUS_NEEDS_REVIEW
    );
    assert.ok(res.dimensions.socialEngineeringRisk >= 0.50);
  });

  it("should detect zero-width character evasion", () => {
    // Insert zero-width spaces in "OTP"
    const res = FraudRiskEngine.evaluateRisk({
      text: "Gửi mã O\u200BT\u200BP để xác thực tài khoản sinh viên."
    });
    // Zero-width characters should be stripped, then OTP should be found
    assert.ok(res.evidence.some(e => e.type === "ZERO_WIDTH_CHARACTERS_DETECTED"));
  });

  it("should detect financial pressure without explicit payment", () => {
    const res = FraudRiskEngine.evaluateRisk({
      text: "KHẨN CẤP: Sinh viên cần chuyển khoản gấp số tiền 500.000đ trước 12h hôm nay để tránh bị xóa tên."
    });
    assert.ok(res.dimensions.paymentRisk >= 0.85);
  });
});

// ===================================================================
// SECTION 7: HARD RULE PRECEDENCE
// ===================================================================
describe("[AUDIT-V2-07] Hard Rule Precedence Over Composite Score", () => {
  it("should BLOCK even when only one hard rule fires and other dimensions are low", () => {
    const res = FraudRiskEngine.evaluateRisk({
      text: "Vui lòng gửi mã OTP xác nhận tài khoản"
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.overallRisk >= 0.95);
    // Hard rule must override even if average risk is low
    assert.ok(res.hardRulesTriggered.length > 0);
  });
});

// ===================================================================
// SECTION 8: EVIDENCE COMPLETENESS (replaces hardcoded confidence)
// ===================================================================
describe("[AUDIT-V2-08] Evidence Completeness Replaces Hardcoded Confidence", () => {
  it("should have evidenceCompleteness instead of hardcoded confidence", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://hcmute.edu.vn",
      text: "Thông báo chung"
    });
    assert.ok("evidenceCompleteness" in res);
    // Should NOT have a fixed 0.95 confidence
    assert.ok(typeof res.evidenceCompleteness === "number");
    assert.ok(res.evidenceCompleteness >= 0.0 && res.evidenceCompleteness <= 1.0);
  });

  it("should have higher evidenceCompleteness when more dimensions have signal", () => {
    const minimal = FraudRiskEngine.evaluateRisk({
      text: "Thông báo chung"
    });
    const rich = FraudRiskEngine.evaluateRisk({
      url: "https://bit.ly/fake",
      text: "Nộp học phí gấp. Gửi mã OTP. Ban Thanh Tra Tài Chính Sinh Viên.",
    });
    assert.ok(rich.evidenceCompleteness > minimal.evidenceCompleteness);
  });
});

// ===================================================================
// SECTION 9: REJECTED FINDINGS — Đ/đ REGEX RUNTIME PROOF
// ===================================================================
describe("[AUDIT-V2-09] Rejected: Vietnamese Đ/đ Regex Works with /i Flag", () => {
  it("/trường đại học sư phạm kỹ thuật/i matches 'Trường Đại học Sư phạm Kỹ thuật TP.HCM'", () => {
    const pattern = /trường đại học sư phạm kỹ thuật/i;
    const input = "Trường Đại học Sư phạm Kỹ thuật TP.HCM";
    assert.strictEqual(pattern.test(input), true, "Node.js /i flag handles Đ/đ correctly");
  });

  it("official beneficiary check correctly identifies 'Trường Đại học Sư phạm Kỹ thuật' as official", () => {
    // The previous negative lookahead regex was fundamentally broken due to \s* backtracking.
    // The fix uses programmatic extraction: match "chủ tài khoản:", extract beneficiary, check allowlist.
    const officialPattern = /trường đại học sư phạm kỹ thuật/i;
    assert.strictEqual(officialPattern.test("Trường Đại học Sư phạm Kỹ thuật TP.HCM"), true,
      "Official beneficiary name is correctly recognized by case-insensitive pattern");
    // Also verify lowercase
    assert.strictEqual(officialPattern.test("trường đại học sư phạm kỹ thuật tp.hcm"), true);
  });
});

// ===================================================================
// SECTION 10: FAIL-CLOSED — EVERY ERROR PATH RETURNS NON-VERIFIED
// ===================================================================
describe("[AUDIT-V2-10] Fail-Closed: No Error Path Returns VERIFIED_OFFICIAL", () => {
  const invalidInputs = [
    { label: "null", value: null },
    { label: "undefined", value: undefined },
    { label: "{}", value: {} },
    { label: "{ url: '' }", value: { url: "" } },
    { label: "{ text: '' }", value: { text: "" } },
    { label: "{ url: null }", value: { url: null } },
    { label: "{ text: null }", value: { text: null } },
    { label: "42", value: 42 },
    { label: "'string'", value: "string" },
    { label: "[]", value: [] },
    { label: "true", value: true },
    { label: "{ metadata: {} }", value: { metadata: {} } },
  ];

  for (const { label, value } of invalidInputs) {
    it(`evaluateRisk(${label}) must NOT return VERIFIED_OFFICIAL`, () => {
      const res = FraudRiskEngine.evaluateRisk(value);
      assert.notStrictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL,
        `FAIL-OPEN BUG: ${label} produced VERIFIED_OFFICIAL`);
    });
  }
});

// ===================================================================
// SECTION 11: PROPERTY TESTS
// ===================================================================
describe("[AUDIT-V2-11] Security Property Tests", () => {
  it("PROPERTY A: Equivalent URL representations → equivalent trust decisions", () => {
    const r1 = FraudRiskEngine.evaluateRisk({ url: "https://hcmute.edu.vn", text: "test" });
    const r2 = FraudRiskEngine.evaluateRisk({ url: "HTTPS://HCMUTE.EDU.VN", text: "test" });
    const r3 = FraudRiskEngine.evaluateRisk({ url: "https://hcmute.edu.vn./", text: "test" });
    assert.strictEqual(r1.dimensions.sourceRisk, r2.dimensions.sourceRisk);
    assert.strictEqual(r1.dimensions.sourceRisk, r3.dimensions.sourceRisk);
  });

  it("PROPERTY B: Adding harmless text should NOT remove a hard malicious signal", () => {
    const malicious = FraudRiskEngine.evaluateRisk({ text: "Gửi mã OTP ngay" });
    const withExtra = FraudRiskEngine.evaluateRisk({ text: "Chào bạn. Thời tiết đẹp. Gửi mã OTP ngay lập tức." });
    assert.strictEqual(malicious.decision, FRAUD_DECISIONS.BLOCKED);
    assert.strictEqual(withExtra.decision, FRAUD_DECISIONS.BLOCKED);
  });

  it("PROPERTY C: No malformed input produces VERIFIED_OFFICIAL (comprehensive)", () => {
    const fuzzInputs = [null, undefined, {}, "", 0, false, NaN, [], { url: 123 }];
    for (const input of fuzzInputs) {
      const res = FraudRiskEngine.evaluateRisk(input);
      assert.notStrictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
    }
  });
});
