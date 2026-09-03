/**
 * StudentHub AI — Fraud & Risk Intelligence + Hardened Live-Sync Test Suite
 * 
 * Enforces Production Verification Protocols:
 * - Protocol 1: Live-Sync Hardening (Cases A, B, C, D: ETag, Last-Modified, SHA-256 fallback, Failure)
 * - Protocol 2: Source Tier Precedence & Anti-Overwrite Protection
 * - Protocol 3: Parser Safety & Disguised HTTP 200 Error Page Detection
 * - Protocol 4: Domain Spoofing, Homoglyphs & Typosquatting Defense
 * - Protocol 5: Payment & Financial Fraud Detection (Personal accounts, fake tuition)
 * - Protocol 6: Credential Exfiltration & OTP Theft Hard Safety Rules
 * - Protocol 7: Social Engineering & Coercive Psychology Defense
 * - Protocol 8: False-Positive Defense: Legitimate Regulation Update vs. Fake Discrepancy
 * - Protocol 9: Deterministic Hard Rules Short-Circuiting
 * - Protocol 10: Master End-to-End Pipeline Integration (Live Source -> Twin)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { LiveSourceWatcher, SOURCE_TRUST_TIERS } from "../../src/lib/intelligence/academic/liveSourceWatcher.js";
import { ParserIntegrityGuard, INGESTION_SAFETY_STATES } from "../../src/lib/intelligence/academic/parserIntegrityGuard.js";
import { FraudRiskEngine, FRAUD_DECISIONS, HARD_SAFETY_RULES } from "../../src/lib/intelligence/fraud/fraudRiskEngine.js";
import { AcademicFraudLiveSyncBridge } from "../../src/lib/intelligence/fraud/academicFraudLiveSyncBridge.js";

console.log("======================================================================");
console.log("🛡️ STUDENTHUB AI — FRAUD RISK & HARDENED LIVE-SYNC SUITE");
console.log("======================================================================");

describe("[PROTOCOL 1] Live-Sync Hardening (Cases A, B, C, D)", () => {
  const mockSource = {
    sourceId: "SRC_TEST_PORTAL",
    etag: '"etag-v1"',
    lastModified: "Wed, 26 Aug 2026 10:00:00 GMT",
    lastContentHash: "5f4dcc3b5aa765d61d8327deb882cf99"
  };

  it("Case A: should return UNCHANGED when server responds HTTP 304 or ETag matches", () => {
    const res304 = LiveSourceWatcher.evaluateConditionalFetch(mockSource, { statusCode: 304 });
    assert.strictEqual(res304.status, "UNCHANGED");
    assert.strictEqual(res304.syncCase, "CASE_A_ETAG_304");

    const resEtag = LiveSourceWatcher.evaluateConditionalFetch(mockSource, { etag: '"etag-v1"' });
    assert.strictEqual(resEtag.status, "UNCHANGED");
    assert.strictEqual(resEtag.syncCase, "CASE_A_ETAG_MATCH");
  });

  it("Case B: should return UNCHANGED when Last-Modified matches", () => {
    const resDate = LiveSourceWatcher.evaluateConditionalFetch(mockSource, { lastModified: "Wed, 26 Aug 2026 10:00:00 GMT" });
    assert.strictEqual(resDate.status, "UNCHANGED");
    assert.strictEqual(resDate.syncCase, "CASE_B_LAST_MODIFIED_MATCH");
  });

  it("Case C: should fallback to SHA-256 comparison when server lacks ETag & Last-Modified", () => {
    // Unchanged hash
    const unchanged = LiveSourceWatcher.evaluateConditionalFetch(mockSource, {
      contentHash: "5f4dcc3b5aa765d61d8327deb882cf99"
    });
    assert.strictEqual(unchanged.status, "UNCHANGED");
    assert.strictEqual(unchanged.syncCase, "CASE_C_SHA256_FALLBACK_UNCHANGED");

    // Changed hash
    const changed = LiveSourceWatcher.evaluateConditionalFetch(mockSource, {
      contentHash: "new_hash_987654321"
    });
    assert.strictEqual(changed.status, "CHANGED");
    assert.strictEqual(changed.syncCase, "CASE_C_SHA256_FALLBACK_CHANGED");
  });

  it("Case D: should flag quarantineRequired on HTTP error or network failure", () => {
    const res500 = LiveSourceWatcher.evaluateConditionalFetch(mockSource, { statusCode: 500 });
    assert.strictEqual(res500.status, "FAILED");
    assert.strictEqual(res500.quarantineRequired, true);
    assert.strictEqual(res500.syncCase, "CASE_D_FAILURE");
  });
});

describe("[PROTOCOL 2] Source Tier Precedence & Anti-Overwrite Protection", () => {
  it("should block TIER_4_UNKNOWN or TIER_5_UNTRUSTED from overwriting TIER_1_OFFICIAL", () => {
    const tier1Source = { sourceId: "SRC_MAIN", sourceTier: "TIER_1_OFFICIAL" };
    const tier4Source = { sourceId: "SRC_FORUM", sourceTier: "TIER_4_UNKNOWN" };
    const tier5Source = { sourceId: "SRC_SCAM", sourceTier: "TIER_5_UNTRUSTED" };

    const checkTier4 = LiveSourceWatcher.isLowerTierOverwriteBlocked(tier1Source, tier4Source);
    assert.strictEqual(checkTier4.allowed, false);
    assert.strictEqual(checkTier4.action, "QUARANTINE_LOWER_TIER_ATTEMPT");

    const checkTier5 = LiveSourceWatcher.isLowerTierOverwriteBlocked(tier1Source, tier5Source);
    assert.strictEqual(checkTier5.allowed, false);
  });
});

describe("[PROTOCOL 3] Parser Safety & Disguised HTTP 200 Error Page Detection", () => {
  it("should detect IIS Runtime Error or 404 Disguised as HTTP 200", () => {
    const disguisedErrorHtml = '<html><body><h1>Server Error in \'/\' Application</h1><p>Runtime Error: Object reference not set</p></body></html>';
    const check = ParserIntegrityGuard.inspectRawContentSafety(disguisedErrorHtml);

    assert.strictEqual(check.status, INGESTION_SAFETY_STATES.ERROR_PAGE_DETECTED);
    assert.strictEqual(check.stopIngestion, true);
    assert.strictEqual(check.shouldQuarantine, true);
  });

  it("should detect Cloudflare / WAF / CAPTCHA Challenge screen", () => {
    const wafHtml = '<html><head><title>Just a moment...</title></head><body><div id="cf-browser-verification">Verifying your browser...</div></body></html>';
    const check = ParserIntegrityGuard.inspectRawContentSafety(wafHtml);

    assert.strictEqual(check.status, INGESTION_SAFETY_STATES.WAF_CHALLENGE_DETECTED);
    assert.strictEqual(check.stopIngestion, true);
    assert.strictEqual(check.shouldQuarantine, true);
  });

  it("should detect login wall replacing public portal", () => {
    const loginHtml = '<html><body><h3>Vui lòng đăng nhập để tiếp tục</h3><form><input type="password" name="pwd"/></form></body></html>';
    const check = ParserIntegrityGuard.inspectRawContentSafety(loginHtml);

    assert.strictEqual(check.status, INGESTION_SAFETY_STATES.LOGIN_WALL_DETECTED);
    assert.strictEqual(check.stopIngestion, true);
  });
});

describe("[PROTOCOL 4] Domain Spoofing, Homoglyphs & Typosquatting Defense", () => {
  it("should trigger KNOWN_MALICIOUS_DOMAIN on Cyrillic Homoglyph Attack", () => {
    // Contains Cyrillic 'е' (\u0435) instead of Latin 'e'
    const homoglyphUrl = "https://hcmut\u0435.edu.vn/hoc-bong";
    const result = FraudRiskEngine.evaluateRisk({ url: homoglyphUrl, text: "Nhận học bổng" });

    assert.strictEqual(result.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(result.hardRulesTriggered.includes(HARD_SAFETY_RULES.KNOWN_MALICIOUS_DOMAIN));
    assert.strictEqual(result.overallRisk >= 0.95, true);
  });

  it("should trigger OFFICIAL_DOMAIN_MISMATCH on Lookalike domain", () => {
    const lookalikeUrl = "https://daotao-hcmute.com/dang-ky-tin-chi";
    const result = FraudRiskEngine.evaluateRisk({
      url: lookalikeUrl,
      text: "Cổng đăng ký tín chỉ trực tuyến",
      metadata: { sourceTier: "TIER_1_OFFICIAL", isOfficialChannel: true }
    });

    assert.strictEqual(result.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(result.hardRulesTriggered.includes(HARD_SAFETY_RULES.OFFICIAL_DOMAIN_MISMATCH));
  });

  it("should flag URL shorteners with high domain risk", () => {
    const shortUrl = "https://bit.ly/hcmute-thong-bao-hoc-phi";
    const result = FraudRiskEngine.evaluateRisk({ url: shortUrl, text: "Thông báo nộp học phí" });

    assert.ok(result.dimensions.domainRisk >= 0.85);
  });
});

describe("[PROTOCOL 5] Payment & Financial Fraud Detection", () => {
  it("should trigger PAYMENT_DESTINATION_CHANGE hard rule on personal bank/Momo account in tuition notice", () => {
    const fakeTuitionPayload = {
      url: "https://hcmute.edu.vn/thong-bao-hoc-phi", // Even if URL is forged
      text: "Thông báo nộp học phí kỳ 1. Sinh viên vui lòng chuyển khoản học phí vào Ví Momo: 0987654321 (Chủ tài khoản: Nguyen Van A) để được giảm 10% học phí.",
      metadata: { sourceTier: "TIER_4_UNKNOWN" }
    };

    const result = FraudRiskEngine.evaluateRisk(fakeTuitionPayload);
    assert.strictEqual(result.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(result.hardRulesTriggered.includes(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE));
    assert.strictEqual(result.dimensions.paymentRisk, 0.98);
  });
});

describe("[PROTOCOL 6] Credential Exfiltration & OTP Theft Hard Safety Rules", () => {
  it("should trigger OTP_REQUEST hard rule and BLOCK immediately", () => {
    const otpScam = {
      text: "Xác thực tài khoản sinh viên: Vui lòng cung cấp mã Smart OTP gửi về điện thoại để hoàn tất đăng ký ký túc xá."
    };

    const result = FraudRiskEngine.evaluateRisk(otpScam);
    assert.strictEqual(result.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(result.hardRulesTriggered.includes(HARD_SAFETY_RULES.OTP_REQUEST));
    assert.strictEqual(result.dimensions.socialEngineeringRisk, 0.98);
  });

  it("should trigger CREDENTIAL_EXFILTRATION_REQUEST and MALWARE_DOWNLOAD hard rules", () => {
    const malwareScam = {
      text: "Cài đặt ứng dụng sinhvien_spkt.apk và nhập mật khẩu cổng thông tin sinh viên để nhận học bổng."
    };

    const result = FraudRiskEngine.evaluateRisk(malwareScam);
    assert.strictEqual(result.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(result.hardRulesTriggered.includes(HARD_SAFETY_RULES.CREDENTIAL_EXFILTRATION_REQUEST));
    assert.ok(result.hardRulesTriggered.includes(HARD_SAFETY_RULES.MALWARE_DOWNLOAD));
  });
});

describe("[PROTOCOL 7] Social Engineering & Coercive Psychology Defense", () => {
  it("should detect fake department identity and coercive psychological threats", () => {
    const coercionPayload = {
      text: "Thông báo từ Ban Thanh Tra Tài Chính Sinh Viên: Sinh viên chưa nộp phí bảo hiểm sẽ bị đình chỉ học tập ngay lập tức và tịch thu bằng tốt nghiệp."
    };

    const result = FraudRiskEngine.evaluateRisk(coercionPayload);
    assert.strictEqual(result.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(result.hardRulesTriggered.includes(HARD_SAFETY_RULES.IMPOSSIBLE_SOURCE_IDENTITY));
    assert.ok(result.dimensions.socialEngineeringRisk >= 0.85);
  });
});

describe("[PROTOCOL 8] False-Positive Defense: Legitimate Regulation Update vs Fake Discrepancy", () => {
  it("should recognize legitimate TOEIC update from TIER_1_OFFICIAL as candidate for Human Review, NOT fraud", () => {
    const legitUpdate = {
      url: "https://hcmute.edu.vn/quy-dinh-k26",
      text: "Quyết định số 2045/QĐ-ĐHSPKT: Chuẩn đầu ra Ngoại ngữ cho khóa K26 là TOEIC 600 / B2 Quốc tế.",
      metadata: {
        sourceTier: "TIER_1_OFFICIAL",
        claimedIssuer: "Phòng Đào Tạo HCMUTE"
      }
    };

    const result = FraudRiskEngine.evaluateRisk(legitUpdate);
    assert.strictEqual(result.decision, FRAUD_DECISIONS.VERIFIED_UPDATED);
    assert.strictEqual(result.hardRulesTriggered.length, 0);
    assert.strictEqual(result.requiresHumanReview, true);
    assert.ok(result.evidence.some(e => e.type === "LEGITIMATE_REGULATION_UPDATE_CANDIDATE"));
  });

  it("should flag unverified source altering academic rules as UNVERIFIED_SEMANTIC_ALTERATION", () => {
    const unverifiedAltered = {
      url: "https://diendan-sinhvien.com/quy-che",
      text: "Thông báo: Từ nay sinh viên SPKT chỉ cần TOEIC 350 là được tốt nghiệp đại học.",
      metadata: { sourceTier: "TIER_4_UNKNOWN" }
    };

    const result = FraudRiskEngine.evaluateRisk(unverifiedAltered);
    assert.ok(result.dimensions.semanticRisk >= 0.80);
    assert.ok(result.evidence.some(e => e.type === "UNVERIFIED_SEMANTIC_ALTERATION"));
  });
});

describe("[PROTOCOL 9] Deterministic Hard Rules Short-Circuiting", () => {
  it("should ensure overallRisk is high and decision is BLOCKED when any hard rule fires", () => {
    const hardRuleInput = {
      text: "Vui lòng gửi mã OTP xác nhận tài khoản"
    };

    const result = FraudRiskEngine.evaluateRisk(hardRuleInput);
    assert.strictEqual(result.decision, FRAUD_DECISIONS.BLOCKED);
    assert.ok(result.overallRisk >= 0.70);
    assert.strictEqual(result.requiresHumanReview, true);
  });
});

describe("[PROTOCOL 10] Master End-to-End Pipeline Integration (Live Source -> Twin)", () => {
  it("should successfully process legitimate prospective update from Tier 1 source through all 8 stages", async () => {
    const studentProfile = {
      studentId: "SV_26110001",
      cohort: 2026,
      programCode: "7480103"
    };

    const previousDoc = {
      text: "Chuẩn đầu ra Ngoại ngữ tốt nghiệp TOEIC 550 / B2 Quốc tế. Tổng số tín chỉ: 150 tín chỉ."
    };

    const incomingPayload = {
      source: {
        sourceId: "DOC_FIT_CURRICULUM_SE",
        sourceTier: "TIER_1_OFFICIAL",
        url: "https://fit.hcmute.edu.vn/ctdt-k26",
        name: "Khoa CNTT - HCMUTE"
      },
      rawBody: "<div>Chuẩn đầu ra Ngoại ngữ tốt nghiệp TOEIC 600 / B2 Quốc tế. Tổng số tín chỉ: 150 tín chỉ.</div>",
      incomingHeaders: { statusCode: 200 },
      previousDoc,
      studentProfile
    };

    const report = await AcademicFraudLiveSyncBridge.processIngestionPipeline(incomingPayload);

    assert.strictEqual(report.pipelineStatus, "CANDIDATE_HELD_FOR_REVIEW");
    assert.strictEqual(report.finalDecision, FRAUD_DECISIONS.VERIFIED_UPDATED);
    assert.strictEqual(report.stages.length, 8);
    assert.strictEqual(report.studentImpact.isAffected, true);
    assert.ok(report.studentImpact.newRequirement.includes("600"));
  });

  it("should quarantine immediately when receiving corrupted or disguised error page", async () => {
    const corruptedPayload = {
      source: {
        sourceId: "DOC_FIT_CURRICULUM_SE",
        sourceTier: "TIER_1_OFFICIAL",
        url: "https://fit.hcmute.edu.vn"
      },
      rawBody: "<html><body><h1>Server Error in '/' Application</h1><p>Runtime Error</p></body></html>",
      incomingHeaders: { statusCode: 200 }
    };

    const report = await AcademicFraudLiveSyncBridge.processIngestionPipeline(corruptedPayload);

    assert.strictEqual(report.pipelineStatus, "QUARANTINED");
    assert.strictEqual(report.finalDecision, FRAUD_DECISIONS.QUARANTINED);
    assert.ok(report.staleFallback);
  });
});
