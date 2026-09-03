/**
 * StudentHub AI — Comprehensive Threat Intelligence Test Suite
 * 
 * Verifies:
 * 1. URLhaus (abuse.ch) Client: URL normalization, caching, and status mapping
 * 2. APWG Threat Taxonomy: Quishing (QR Phishing), Combosquatting, and Sector classification
 * 3. FTC Consumer Sentinel Taxonomy: Impersonation and Advance-Fee payment vectors
 * 4. Fraud Knowledge Graph: Entity nodes, edges, and cross-modal contradiction detection
 * 5. Master Threat Intelligence Engine: Multi-source evidence fusion
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { normalizeUrlForQuery, URLHAUS_STATUS, queryUrlhausUrl } from "../../src/lib/ai-trust/threat-intel/urlhausClient.js";
import { evaluateApwgThreatVectors } from "../../src/lib/ai-trust/threat-intel/apwgTaxonomy.js";
import { evaluateFtcSentinelIndicators } from "../../src/lib/ai-trust/threat-intel/ftcSentinelTaxonomy.js";
import { buildFraudEntityGraph } from "../../src/lib/ai-trust/threat-intel/fraudKnowledgeGraph.js";
import { investigateThreatIntelligence } from "../../src/lib/ai-trust/threat-intel/threatIntelligenceEngine.js";

describe("Threat Intelligence Protocol 1: URLhaus Client & URL Normalization", () => {
  it("should normalize and canonicalize raw URL inputs", () => {
    const norm = normalizeUrlForQuery("HTTP://Example.COM/path/to/file?a=1");
    assert.strictEqual(norm.hostname, "example.com");
    assert.strictEqual(norm.fullUrl, "http://example.com/path/to/file?a=1");
    assert.strictEqual(norm.isIp, false);

    const normIp = normalizeUrlForQuery("192.168.1.1/malware.exe");
    assert.strictEqual(normIp.isIp, true);
  });

  it("should handle offline/timeout gracefully without throwing", async () => {
    const res = await queryUrlhausUrl("https://example-test-safe-url.com", { timeoutMs: 50 });
    assert.ok(res.source === "URLHAUS_ABUSE_CH");
    assert.ok([URLHAUS_STATUS.NO_KNOWN_THREAT, URLHAUS_STATUS.API_UNAVAILABLE].includes(res.status));
  });
});

describe("Threat Intelligence Protocol 2: APWG & FTC Taxonomies", () => {
  it("should detect Quishing (QR Phishing) and Combosquatting vectors", () => {
    const apwg = evaluateApwgThreatVectors({
      text: "Quét mã QR để nhận học phí Vietcombank Smart OTP",
      qrUrl: "https://vietcombank-xacnhan-otp.vip/login",
      domain: "vietcombank-xacnhan-otp.vip",
    });

    assert.strictEqual(apwg.hasHighRiskVector, true);
    assert.ok(apwg.detectedVectors.some((v) => v.vector === "VECTOR_QUISHING"));
    assert.ok(apwg.detectedVectors.some((v) => v.vector === "VECTOR_COMBOSQUATTING"));
    assert.strictEqual(apwg.matchedSector.sector, "FINANCIAL_INSTITUTIONS");
  });

  it("should match FTC Consumer Sentinel Impersonation and Advance Fee vectors", () => {
    const ftc = evaluateFtcSentinelIndicators(
      "Công an TP Hà Nội yêu cầu chuyển khoản trước 2 triệu đồng tiền đặt cọc vào tài khoản tạm giữ"
    );

    assert.strictEqual(ftc.hasSevereFinancialRisk, true);
    assert.ok(ftc.matchedCategories.some((c) => c.category === "IMPERSONATION_SCAMS"));
    assert.ok(ftc.detectedPaymentVectors.some((p) => p.code === "ADVANCE_FEE"));
  });
});

describe("Threat Intelligence Protocol 3: Fraud Knowledge Graph & Master Fusion", () => {
  it("should detect cross-modal contradictions in Entity Graph", () => {
    const graphResult = buildFraudEntityGraph({
      claimedOrg: "Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)",
      officialDomain: "hcmute.edu.vn",
      officialBeneficiary: "TRUONG DAI HOC SU PHAM KY THUAT TPHCM",
      observedDomain: "hcmute-daotao-online.top",
      observedAccount: "098765432188",
      observedHolder: "NGUYEN VAN LUA",
    });

    assert.strictEqual(graphResult.hasContradictions, true);
    assert.ok(graphResult.contradictions.some((c) => c.type === "BRAND_DOMAIN_CONTRADICTION"));
    assert.ok(graphResult.contradictions.some((c) => c.type === "BENEFICIARY_NAME_CONTRADICTION"));
  });

  it("should execute full multi-source threat intelligence investigation", async () => {
    const report = await investigateThreatIntelligence({
      text: "Viện kiểm sát nhân dân yêu cầu đóng cọc làm hồ sơ",
      domain: "hcmute-daotao.xyz",
      claimedOrg: "HCMUTE",
      officialDomain: "hcmute.edu.vn",
    });

    assert.strictEqual(report.isThreatDetected, true);
    assert.strictEqual(report.severity, "CRITICAL");
    assert.ok(report.sources.ncsc.isThreatDetected === true);
    assert.ok(report.executionTimeMs > 0);
  });
});
