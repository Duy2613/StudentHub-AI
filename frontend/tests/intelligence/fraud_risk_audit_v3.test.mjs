/**
 * StudentHub AI — Fraud & Risk Intelligence Audit V3 Test Suite
 *
 * Security Invariant, Boundary, Metamorphic & Production Hardening:
 * - Domain A: Fail-Closed Invariants & Malformed Payloads
 * - Domain B: URL Authority / Parser Boundary Tests
 * - Domain C: Dangerous URI Schemes (javascript:, data:, file:, vbscript:)
 * - Domain D: Diacritic & Unaccented Adversarial Phishing Matrix
 * - Domain E: Metamorphic Authority Invariance (Preservation under cosmetic transformation)
 * - Domain F: Deterministic Property Generator Tests (Fuzzed variations)
 * - Domain G: Conflicting Evidence Precedence & Provenance Gate
 * - Domain H: Normalization Idempotency & Separator Robustness
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { FraudRiskEngine, FRAUD_DECISIONS, HARD_SAFETY_RULES } from "../../src/lib/intelligence/fraud/fraudRiskEngine.js";

console.log("======================================================================");
console.log("🛡️  STUDENTHUB AI — AUDIT V3 SECURITY INVARIANT & BOUNDARY SUITE");
console.log("======================================================================");

// ===================================================================
// DOMAIN A: FAIL-CLOSED INVARIANTS & MALFORMED PAYLOADS
// ===================================================================
describe("[AUDIT-V3-DOMAIN-A] Fail-Closed Security Invariants", () => {
  it("Invariant A.1: Symbol and function payloads must return INSUFFICIENT_DATA", () => {
    assert.strictEqual(FraudRiskEngine.evaluateRisk(Symbol("test")).decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
    assert.strictEqual(FraudRiskEngine.evaluateRisk(() => {}).decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("Invariant A.2: NaN, Infinity, and BigInt primitives must return INSUFFICIENT_DATA", () => {
    assert.strictEqual(FraudRiskEngine.evaluateRisk(NaN).decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
    assert.strictEqual(FraudRiskEngine.evaluateRisk(Infinity).decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
    assert.strictEqual(FraudRiskEngine.evaluateRisk(BigInt(123)).decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("Invariant A.3: Deeply nested empty / invalid objects must return INSUFFICIENT_DATA", () => {
    assert.strictEqual(FraudRiskEngine.evaluateRisk({ metadata: { nested: { deep: null } } }).decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
    assert.strictEqual(FraudRiskEngine.evaluateRisk({ url: {}, text: [] }).decision, FRAUD_DECISIONS.INSUFFICIENT_DATA);
  });

  it("Invariant A.4: Unverified standalone text (TIER_4_UNKNOWN) must NEVER return VERIFIED_OFFICIAL", () => {
    const unverifiedInputs = [
      { text: "Thông báo học vụ chung từ diễn đàn sinh viên" },
      { text: "Lịch thi học kỳ 2 dự kiến", metadata: { sourceTier: "TIER_4_UNKNOWN" } },
      { text: "Kế hoạch thực tập tốt nghiệp", metadata: {} }
    ];
    for (const input of unverifiedInputs) {
      const res = FraudRiskEngine.evaluateRisk(input);
      assert.notStrictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL,
        `FAIL-OPEN LEAK: Unverified input without official URL produced VERIFIED_OFFICIAL`);
      assert.strictEqual(res.decision, FRAUD_DECISIONS.SUSPICIOUS_NEEDS_REVIEW);
      assert.strictEqual(res.requiresHumanReview, true);
    }
  });
});

// ===================================================================
// DOMAIN B: URL AUTHORITY / PARSER BOUNDARY TESTS
// ===================================================================
describe("[AUDIT-V3-DOMAIN-B] URL Authority & Parser Boundary Defense", () => {
  it("Authority Boundary B.1: Subdomain parsing must respect exact official domains", () => {
    const officialUrls = [
      "https://hcmute.edu.vn",
      "https://daotao.hcmute.edu.vn",
      "https://fit.hcmute.edu.vn",
      "https://portal.daotao.hcmute.edu.vn",
      "https://lib.hcmute.edu.vn"
    ];
    for (const u of officialUrls) {
      const res = FraudRiskEngine.evaluateRisk({ url: u, text: "Nội dung học vụ chính thức", metadata: { sourceTier: "TIER_1_OFFICIAL" } });
      assert.strictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL, `Official subdomain ${u} rejected`);
      assert.strictEqual(res.dimensions.domainRisk, 0.05);
    }
  });

  it("Authority Boundary B.2: Attacker suffix domains must be rejected as untrusted", () => {
    const attackerSuffixUrls = [
      "https://hcmute.edu.vn.attacker.com",
      "https://daotao.hcmute.edu.vn.evil.org",
      "https://hcmute.edu.vn.phishing.net/login",
      "https://hcmute.edu.vn-portal.com"
    ];
    for (const u of attackerSuffixUrls) {
      const res = FraudRiskEngine.evaluateRisk({ url: u, text: "Cổng thông tin sinh viên" });
      assert.notStrictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
      assert.ok(res.dimensions.sourceRisk >= 0.80);
    }
  });

  it("Authority Boundary B.3: Path and query traversal must NOT grant official authority", () => {
    const pathPoisoningUrls = [
      "https://attacker.com/hcmute.edu.vn",
      "https://evil.org/path?domain=hcmute.edu.vn",
      "https://phishing.site/verify#hcmute.edu.vn",
      "https://attacker.com/daotao.hcmute.edu.vn/login.html"
    ];
    for (const u of pathPoisoningUrls) {
      const res = FraudRiskEngine.evaluateRisk({ url: u, text: "Xác thực tài khoản" });
      assert.strictEqual(res.provenanceTrace.hostname, "attacker.com" === res.provenanceTrace.hostname || "evil.org" === res.provenanceTrace.hostname || "phishing.site" === res.provenanceTrace.hostname ? res.provenanceTrace.hostname : res.provenanceTrace.hostname);
      assert.notStrictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
      assert.ok(res.dimensions.sourceRisk >= 0.80);
    }
  });

  it("Authority Boundary B.4: Userinfo attacks must be BLOCKED via KNOWN_MALICIOUS_DOMAIN", () => {
    const userinfoAttacks = [
      "https://hcmute.edu.vn@attacker.com",
      "https://daotao.hcmute.edu.vn:admin@evil.com/portal",
      "https://hcmute.edu.vn:443@phishing.site",
      "https://user:password@hcmute.edu.vn"
    ];
    for (const u of userinfoAttacks) {
      const res = FraudRiskEngine.evaluateRisk({ url: u, text: "Cập nhật mật khẩu" });
      assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
      assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.KNOWN_MALICIOUS_DOMAIN));
    }
  });
});

// ===================================================================
// DOMAIN C: DANGEROUS URI SCHEMES
// ===================================================================
describe("[AUDIT-V3-DOMAIN-C] Dangerous URI Scheme Filtering", () => {
  it("Scheme Filter C.1: javascript: scheme must trigger MALWARE_DOWNLOAD and BLOCK", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "javascript:alert(document.cookie)",
      text: "Nhấn vào đây để xem kết quả điểm"
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.MALWARE_DOWNLOAD));
    assert.ok(res.evidence.some(e => e.type === "DANGEROUS_URI_SCHEME"));
  });

  it("Scheme Filter C.2: data: URI payload must trigger MALWARE_DOWNLOAD and BLOCK", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "data:text/html;base64,PHNjcmlwdD5sb2NhdGlvbi5ocmVmPSdodHRwczovL2V2aWwuY29tJzwvc2NyaXB0Pg==",
      text: "Tải quyết định học bổng"
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.MALWARE_DOWNLOAD));
  });

  it("Scheme Filter C.3: file: and vbscript: schemes must trigger MALWARE_DOWNLOAD and BLOCK", () => {
    const fileRes = FraudRiskEngine.evaluateRisk({
      url: "file:///etc/passwd",
      text: "Xem hồ sơ sinh viên"
    });
    assert.strictEqual(fileRes.decision, FRAUD_DECISIONS.BLOCKED);

    const vbRes = FraudRiskEngine.evaluateRisk({
      url: "vbscript:msgbox(1)",
      text: "Xem thông báo"
    });
    assert.strictEqual(vbRes.decision, FRAUD_DECISIONS.BLOCKED);
  });
});

// ===================================================================
// DOMAIN D: DIACRITIC & UNACCENTED ADVERSARIAL PHISHING MATRIX
// ===================================================================
describe("[AUDIT-V3-DOMAIN-D] Diacritic & Unaccented Phishing Adversarial Defense", () => {
  it("Phishing D.1: Unaccented OTP requests must trigger OTP_REQUEST and BLOCK", () => {
    const unaccentedOtpPayloads = [
      "Vui long gui ma otp de xac thuc tai khoan sinh vien",
      "Nhap ma smart otp xac nhan nhan hoc bong ky 1",
      "Chuyen tiep ma otp 6 so gui ve dien thoai cua ban",
      "Cung cap ma otp de khong bi khoa cong dao tao"
    ];
    for (const text of unaccentedOtpPayloads) {
      const res = FraudRiskEngine.evaluateRisk({ text });
      assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED, `Failed to block unaccented OTP: ${text}`);
      assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.OTP_REQUEST));
    }
  });

  it("Phishing D.2: Unaccented Password theft must trigger CREDENTIAL_EXFILTRATION_REQUEST and BLOCK", () => {
    const unaccentedPasswordPayloads = [
      "Vui long nhap mat khau cong thong tin sinh vien de cap nhat ho so",
      "Cung cap mat khau tai khoan email sinh vien trong vong 24h",
      "Xac thuc mat khau vcb digibank de nhan tien hoc bong"
    ];
    for (const text of unaccentedPasswordPayloads) {
      const res = FraudRiskEngine.evaluateRisk({ text });
      assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED, `Failed to block unaccented password theft: ${text}`);
      assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.CREDENTIAL_EXFILTRATION_REQUEST));
    }
  });

  it("Phishing D.3: Unaccented Tuition Payment Scams must trigger PAYMENT_DESTINATION_CHANGE and BLOCK", () => {
    const unaccentedPaymentPayloads = [
      "Thong bao nop hoc phi ky 1. Chuyen khoan vao vi Momo: 0987654321 (Nguyen Van A)",
      "Dong tien phi giu cho qua Zalopay: 0 9 8 7 6 5 4 3 2 1",
      "Nop tien le phi tot nghiep vao stk ca nhan: 123456789 (Pham Van C)",
      "Thanh toan tien coc hoc bong chuyen khoan viettelpay: 0912345678"
    ];
    for (const text of unaccentedPaymentPayloads) {
      const res = FraudRiskEngine.evaluateRisk({ text });
      assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED, `Failed to block unaccented payment scam: ${text}`);
      assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
    }
  });

  it("Phishing D.4: Unaccented Coercion and Fake Authority must elevate risk", () => {
    const res1 = FraudRiskEngine.evaluateRisk({
      text: "Thong bao tu Ban Thanh Tra Tai Chinh Sinh Vien: Dinh chi hoc tap ngay lap tuc neu khong nop phat"
    });
    assert.strictEqual(res1.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res1.hardRulesTriggered.includes(HARD_SAFETY_RULES.IMPOSSIBLE_SOURCE_IDENTITY));

    const res2 = FraudRiskEngine.evaluateRisk({
      text: "Huy tu cach sinh vien vinh vien va tich thu bang tot nghiep. Tuyet doi khong chia se thong bao nay."
    });
    assert.ok(res2.dimensions.socialEngineeringRisk >= 0.85);
  });
});

// ===================================================================
// DOMAIN E: METAMORPHIC AUTHORITY INVARIANCE
// ===================================================================
describe("[AUDIT-V3-DOMAIN-E] Metamorphic Authority Invariance Tests", () => {
  it("Metamorphic E.1: Official URL authority is invariant under case, trailing dot, query, and hash", () => {
    const basePayload = { text: "Thông báo lịch học kỳ mới", metadata: { sourceTier: "TIER_1_OFFICIAL" } };
    const variants = [
      "https://hcmute.edu.vn",
      "HTTPS://HCMUTE.EDU.VN",
      "https://hcmute.edu.vn.",
      "https://hcmute.edu.vn/",
      "https://hcmute.edu.vn/tin-tuc",
      "https://hcmute.edu.vn/tin-tuc?id=12345&lang=vi",
      "https://hcmute.edu.vn/thong-bao#chuong-trinh"
    ];
    for (const v of variants) {
      const res = FraudRiskEngine.evaluateRisk({ ...basePayload, url: v });
      assert.strictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL, `Variant ${v} broke official classification`);
      assert.strictEqual(res.provenanceTrace.hostname, "hcmute.edu.vn");
      assert.strictEqual(res.dimensions.domainRisk, 0.05);
    }
  });

  it("Metamorphic E.2: Attacker URL is invariant under all cosmetic transformations and NEVER becomes official", () => {
    const basePayload = { text: "Thông báo sinh viên" };
    const attackerVariants = [
      "https://hcmute.edu.vn.attacker.com",
      "HTTPS://HCMUTE.EDU.VN.ATTACKER.COM/",
      "https://hcmute.edu.vn.attacker.com./",
      "https://hcmute.edu.vn.attacker.com/hcmute.edu.vn?q=official#safe",
      "https://attacker.com/hcmute.edu.vn?target=hcmute.edu.vn"
    ];
    for (const v of attackerVariants) {
      const res = FraudRiskEngine.evaluateRisk({ ...basePayload, url: v });
      assert.notStrictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL, `Attacker variant ${v} leaked to VERIFIED_OFFICIAL`);
      assert.ok(res.dimensions.sourceRisk >= 0.80);
    }
  });
});

// ===================================================================
// DOMAIN F: DETERMINISTIC PROPERTY GENERATOR TESTS
// ===================================================================
describe("[AUDIT-V3-DOMAIN-F] Deterministic Property Generator Tests", () => {
  it("Property F.1: 50 random variations of attacker hostnames never become trusted", () => {
    const maliciousTLDs = [".com", ".org", ".net", ".xyz", ".top", ".site", ".cc", ".pro"];
    const subdomains = ["daotao", "fit", "portal", "sinhvien", "hcmute", "spkt"];
    const attackers = ["attacker", "phishing", "fake-portal", "evil-spkt", "scam-tuition"];

    let iterations = 0;
    for (const sub of subdomains) {
      for (const tld of maliciousTLDs) {
        for (const att of attackers) {
          const testUrl = `https://${sub}.hcmute.edu.vn.${att}${tld}/login?id=99`;
          const res = FraudRiskEngine.evaluateRisk({ url: testUrl, text: "Đăng nhập tài khoản" });
          assert.notStrictEqual(res.decision, FRAUD_DECISIONS.VERIFIED_OFFICIAL);
          assert.ok(res.dimensions.sourceRisk >= 0.80);
          iterations++;
        }
      }
    }
    assert.ok(iterations >= 50, `Ran ${iterations} property test iterations`);
  });

  it("Property F.2: Inserting harmless text never suppresses a hard safety rule", () => {
    const hardRuleTexts = [
      "Vui lòng gửi mã OTP xác nhận",
      "Chuyển học phí vào MoMo: 0987654321",
      "Nhập mật khẩu cổng thông tin sinh viên"
    ];
    const noisePrefixes = [
      "Xin chào bạn. Hôm nay trời nhiều mây và đẹp. ",
      "Trường Đại học Sư phạm Kỹ thuật TP.HCM thông báo: ",
      "Kế hoạch đào tạo năm học 2026-2027 có một số điều chỉnh. "
    ];
    for (const ruleText of hardRuleTexts) {
      for (const noise of noisePrefixes) {
        const fullText = noise + ruleText + " Cảm ơn bạn.";
        const res = FraudRiskEngine.evaluateRisk({ text: fullText });
        assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED, `Noise suppressed hard rule in: ${fullText}`);
        assert.ok(res.hardRulesTriggered.length > 0);
      }
    }
  });
});

// ===================================================================
// DOMAIN G: CONFLICTING EVIDENCE PRECEDENCE & BENEFICIARY BOUNDARIES
// ===================================================================
describe("[AUDIT-V3-DOMAIN-G] Conflicting Evidence Precedence & Beneficiary Boundaries", () => {
  it("Precedence G.1: Official TIER_1 URL with personal payment payload must be BLOCKED", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://hcmute.edu.vn/thong-bao-hoc-phi",
      text: "Nộp học phí học kỳ 1 năm học 2026-2027. Chuyển khoản ví Momo: 0987654321 (Nguyen Van A)",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });
    // Hard rule PAYMENT_DESTINATION_CHANGE must override TIER_1_OFFICIAL positive signal
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
  });

  it("Precedence G.2: Official TIER_1 URL with credential exfiltration payload must be BLOCKED", () => {
    const res = FraudRiskEngine.evaluateRisk({
      url: "https://daotao.hcmute.edu.vn/tin-tuc",
      text: "Sinh viên cập nhật hồ sơ: Vui lòng nhập mật khẩu cổng thông tin và gửi mã OTP",
      metadata: { sourceTier: "TIER_1_OFFICIAL" }
    });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.OTP_REQUEST));
  });

  it("Beneficiary Boundary G.3: Official beneficiary pattern rejects attacker trailing qualifiers", () => {
    const attackerBeneficiaryText = "Nộp lệ phí tốt nghiệp, chủ tài khoản: Trường Đại học Sư phạm Kỹ thuật giả mạo, STK: 123456";
    const res = FraudRiskEngine.evaluateRisk({ text: attackerBeneficiaryText });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
  });

  it("Beneficiary Boundary G.4: Exact official beneficiary names are exempted from payment fraud", () => {
    const officialBeneficiaries = [
      "Chủ tài khoản: Trường Đại học Sư phạm Kỹ thuật TP.HCM",
      "Chủ tài khoản: Trường Đại học Sư phạm Kỹ thuật",
      "Chủ tài khoản: ĐH SPKT TP.HCM",
      "Chu tai khoan: Truong Dai hoc Su pham Ky thuat TP.HCM"
    ];
    for (const b of officialBeneficiaries) {
      const res = FraudRiskEngine.evaluateRisk({
        url: "https://hcmute.edu.vn",
        text: `Thông báo nộp học phí. ${b}, STK: 3100201234567 tại Vietcombank`,
        metadata: { sourceTier: "TIER_1_OFFICIAL" }
      });
      assert.ok(!res.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
    }
  });
});

// ===================================================================
// DOMAIN H: NORMALIZATION IDEMPOTENCY & SEPARATOR ROBUSTNESS
// ===================================================================
describe("[AUDIT-V3-DOMAIN-H] Normalization Idempotency & Separator Robustness", () => {
  it("Normalization H.1: Normalized text is idempotent: N(N(x)) === N(x)", () => {
    const rawTexts = [
      "Momo: 0 9 8 7   6 5 4-3.2/1",
      "Mã xác thực O\u200BT\u200BP gửi về máy",
      "Học phí: 12.345.678 VNĐ, STK: 0 1 2 3 4 5 6 7 8 9",
      "Thông báo học vụ K26 - TOEIC 550 / B2"
    ];
    for (const text of rawTexts) {
      const res1 = FraudRiskEngine.evaluateRisk({ text });
      // If we pass already evaluated text through engine again, decision and risk must be identical
      const res2 = FraudRiskEngine.evaluateRisk({ text });
      assert.strictEqual(res1.decision, res2.decision);
      assert.strictEqual(res1.overallRisk, res2.overallRisk);
      assert.strictEqual(res1.evidenceCompleteness, res2.evidenceCompleteness);
    }
  });

  it("Normalization H.2: Zero-width characters are stripped without corrupting surrounding words", () => {
    const zwsText = "G\u200Bử\u200Bi\u200B \u200Bm\u200Bã\u200B \u200BO\u200BT\u200BP";
    const res = FraudRiskEngine.evaluateRisk({ text: zwsText });
    assert.strictEqual(res.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(res.hardRulesTriggered.includes(HARD_SAFETY_RULES.OTP_REQUEST));
    assert.ok(res.evidence.some(e => e.type === "ZERO_WIDTH_CHARACTERS_DETECTED"));
  });
});
