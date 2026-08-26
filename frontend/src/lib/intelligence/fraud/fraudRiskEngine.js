/**
 * StudentHub AI — Fraud & Risk Intelligence Engine (Production Grade — Audit V2 Hardened)
 * 
 * Evaluates 9 risk dimensions, deterministic hard safety rules, domain spoofing,
 * impersonation, payment fraud, social engineering, credential theft, and document tampering.
 * 
 * Audit V2 Hardening:
 * - Fail-closed input contract (null/undefined/{} → INSUFFICIENT_DATA, never VERIFIED)
 * - Case-insensitive URL canonicalization with trailing-dot and userinfo defense
 * - Targeted IDN/homoglyph detection (no blanket xn-- false positives)
 * - Payment text normalization for spaced/dashed/dotted digit evasion
 * - Contextual credential exfiltration semantic patterns
 * - Evidence-based completeness scoring (replaces hardcoded confidence)
 * - temporalRisk documented as RESERVED_NOT_DECISION_ACTIVE
 */

import { AcademicTruthEngine } from "../academic/academicTruthEngine.js";

export const FRAUD_DECISIONS = {
  VERIFIED_OFFICIAL: "VERIFIED_OFFICIAL",
  VERIFIED_UPDATED: "VERIFIED_UPDATED",
  SUSPICIOUS_NEEDS_REVIEW: "SUSPICIOUS_NEEDS_REVIEW",
  HIGH_RISK: "HIGH_RISK",
  BLOCKED: "BLOCKED",
  QUARANTINED: "QUARANTINED",
  STALE_VERIFIED_STATE: "STALE_VERIFIED_STATE",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA"
};

export const HARD_SAFETY_RULES = {
  KNOWN_MALICIOUS_DOMAIN: "KNOWN_MALICIOUS_DOMAIN",
  OFFICIAL_DOMAIN_MISMATCH: "OFFICIAL_DOMAIN_MISMATCH",
  CREDENTIAL_EXFILTRATION_REQUEST: "CREDENTIAL_EXFILTRATION_REQUEST",
  OTP_REQUEST: "OTP_REQUEST",
  PAYMENT_DESTINATION_CHANGE: "PAYMENT_DESTINATION_CHANGE",
  MALWARE_DOWNLOAD: "MALWARE_DOWNLOAD",
  IMPOSSIBLE_SOURCE_IDENTITY: "IMPOSSIBLE_SOURCE_IDENTITY",
  FORGED_OFFICIAL_SIGNATURE: "FORGED_OFFICIAL_SIGNATURE",
  SOURCE_INTEGRITY_FAILURE: "SOURCE_INTEGRITY_FAILURE",
  PARSER_COLLAPSE: "PARSER_COLLAPSE"
};

/**
 * CONFIGURED_SECURITY_POLICY — HCM-UTE Official Domain Allowlist
 *
 * Provenance note: This is a manually configured security policy, NOT an
 * authoritative registry with cryptographic provenance. It represents the
 * known official domains at configuration time and should be reviewed
 * periodically against live university DNS/web infrastructure.
 *
 * configuredAt: 2026-08-26
 * source: Manual verification of hcmute.edu.vn subdomains
 * reviewer: System configuration
 * version: 1
 */
export const OFFICIAL_HCMUTE_ALLOWLIST = [
  "hcmute.edu.vn",
  "www.hcmute.edu.vn",
  "daotao.hcmute.edu.vn",
  "fit.hcmute.edu.vn",
  "feee.hcmute.edu.vn",
  "ctsv.hcmute.edu.vn",
  "online.hcmute.edu.vn",
  "tuyensinh.hcmute.edu.vn"
];

// ---------------------------------------------------------------------------
// INTERNAL HELPERS
// ---------------------------------------------------------------------------

/**
 * Canonicalizes a URL to its lowercase hostname, stripping trailing dots
 * and handling case-insensitive schemes, userinfo attacks, etc.
 * @param {string} rawUrl
 * @returns {{ hostname: string, hasUserinfo: boolean, parseError: boolean }}
 */
function canonicalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { hostname: "", hasUserinfo: false, parseError: false };
  }

  try {
    // Case-insensitive scheme detection
    const prefixed = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(prefixed);

    // Detect userinfo attack: https://hcmute.edu.vn@attacker.com
    const hasUserinfo = Boolean(parsed.username || parsed.password);

    // Normalize: lowercase + strip trailing dots
    let hostname = parsed.hostname.toLowerCase().replace(/\.+$/, "");

    return { hostname, hasUserinfo, parseError: false };
  } catch {
    // Fallback: lowercase raw string, strip trailing dots
    return {
      hostname: rawUrl.toLowerCase().replace(/\.+$/, ""),
      hasUserinfo: false,
      parseError: true
    };
  }
}

/**
 * Normalizes text for payment/credential detection:
 * - NFKC Unicode normalization
 * - Collapses spaces/dashes/dots between digits (contextual, not global)
 * - Removes zero-width characters
 * - Preserves original text for evidence
 * @param {string} rawText
 * @returns {{ raw: string, normalized: string, hasZeroWidth: boolean }}
 */
function normalizeText(rawText) {
  if (typeof rawText !== "string") return { raw: "", normalized: "", hasZeroWidth: false };

  const raw = rawText;
  let text = rawText.normalize("NFKC");

  // Detect zero-width characters (potential evasion)
  const hasZeroWidth = /[\u200B\u200C\u200D\uFEFF\u00AD]/.test(text);

  // Remove zero-width characters
  text = text.replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, "");

  // Collapse spaces/dashes/dots between digits: "0 9 8 7" → "0987"
  text = text.replace(/(\d)[\s.\-\/]+(?=\d)/g, "$1");

  return { raw, normalized: text, hasZeroWidth };
}

/**
 * Checks whether a Punycode hostname is a confusable homoglyph of a known official domain.
 * Uses targeted detection instead of blanket xn-- flagging to avoid IDN false positives.
 * @param {string} hostname - Already lowercased canonical hostname
 * @param {string} rawUrl - Original raw URL for Cyrillic/Greek script detection
 * @returns {{ isHomoglyph: boolean, reason: string }}
 */
function detectHomoglyphAttack(hostname, rawUrl) {
  // Stage 1: Direct detection of Cyrillic/Greek characters in the raw URL
  // targeting known official domain patterns
  const hasSuspiciousScript = /[\u0400-\u04FF\u0370-\u03FF]/.test(rawUrl || "");

  if (hasSuspiciousScript) {
    // Check if the suspicious characters appear in a domain-like context
    // that resembles hcmute/spkt/daotao patterns
    const domainPart = (rawUrl || "").replace(/^https?:\/\//i, "").split(/[\/\?#]/)[0];
    const hasCyrillicGreek = /[\u0400-\u04FF\u0370-\u03FF]/.test(domainPart);

    if (hasCyrillicGreek) {
      return {
        isHomoglyph: true,
        reason: `Phát hiện ký tự Cyrillic/Greek trong tên miền "${domainPart}" — Homoglyph Attack.`
      };
    }
  }

  // Stage 2: For Punycode domains, check if they decode to something confusable
  // with known official domains. Only flag xn-- domains that contain patterns
  // similar to official domain names.
  if (hostname.startsWith("xn--") || hostname.includes(".xn--")) {
    // Extract the xn-- labels
    const labels = hostname.split(".");
    const punycodeLabels = labels.filter(l => l.startsWith("xn--"));

    // Check if any punycode label, when decoded, could be confused with official patterns
    // Known confusable patterns for hcmute: xn--hcmut-* (Cyrillic е for Latin e)
    const officialStemPatterns = [
      /^xn--hcmut/i,    // hcmute with character substitution
      /^xn--daota/i,    // daotao with character substitution
      /^xn--spkt/i,     // spkt with character substitution
    ];

    const isSuspiciousPunycode = punycodeLabels.some(label =>
      officialStemPatterns.some(pattern => pattern.test(label))
    );

    if (isSuspiciousPunycode) {
      return {
        isHomoglyph: true,
        reason: `Phát hiện tên miền Punycode (${hostname}) có thể giả mạo tên miền chính thức HCMUTE.`
      };
    }
  }

  return { isHomoglyph: false, reason: "" };
}

/**
 * Computes evidence completeness based on which risk dimensions actually received
 * non-default signal. Replaces the previous hardcoded confidence: 0.95.
 * @param {object} dimensions - The 9 risk dimension values
 * @param {string[]} hardRulesTriggered - Hard rules that fired
 * @param {object[]} evidenceList - Evidence items collected
 * @returns {number} Value 0.0–1.0 representing how much evidence was available
 */
function computeEvidenceCompleteness(dimensions, hardRulesTriggered, evidenceList) {
  const defaultRisk = 0.05;
  let signalCount = 0;
  let totalDimensions = 0;

  for (const [key, value] of Object.entries(dimensions)) {
    totalDimensions++;
    // temporalRisk is RESERVED_NOT_DECISION_ACTIVE, skip it
    if (key === "temporalRisk") continue;
    if (value !== defaultRisk) signalCount++;
  }

  // Hard rules provide strong evidence
  const hardRuleBonus = Math.min(hardRulesTriggered.length * 0.15, 0.3);

  // Evidence items provide additional completeness signal
  const evidenceBonus = Math.min(evidenceList.length * 0.05, 0.2);

  // Base completeness from active dimensions
  const activeDimensionCount = totalDimensions - 1; // exclude temporalRisk
  const dimensionCompleteness = activeDimensionCount > 0 ? signalCount / activeDimensionCount : 0;

  return Math.min(1.0, Number((dimensionCompleteness + hardRuleBonus + evidenceBonus).toFixed(2)));
}

export class FraudRiskEngine {
  /**
   * Evaluates comprehensive fraud and risk signals across 9 dimensions.
   *
   * INPUT CONTRACT (Audit V2 — Fail-Closed):
   * - null / undefined / non-object → INSUFFICIENT_DATA
   * - {} / empty strings only → INSUFFICIENT_DATA
   * - Valid object with at least url or text → full evaluation
   *
   * @param {object} inputPayload
   * @param {string} inputPayload.url - Origin or embedded URL
   * @param {string} inputPayload.text - Extracted text or body content
   * @param {object} [inputPayload.metadata] - Document metadata, sender, issuer, sourceTier
   * @returns {object} Standardized Explainable Fraud Evaluation Contract
   */
  static evaluateRisk(inputPayload) {
    // ---------------------------------------------------------------
    // FIX 1 — FAIL-CLOSED INPUT CONTRACT (Audit V2)
    // null, undefined, non-object, or empty input MUST NOT become VERIFIED
    // ---------------------------------------------------------------
    if (inputPayload === null || inputPayload === undefined || typeof inputPayload !== "object" || Array.isArray(inputPayload)) {
      return {
        decision: FRAUD_DECISIONS.INSUFFICIENT_DATA,
        overallRisk: 0,
        evidenceCompleteness: 0,
        dimensions: {
          sourceRisk: 0, domainRisk: 0, identityRisk: 0, documentRisk: 0,
          semanticRisk: 0, paymentRisk: 0, socialEngineeringRisk: 0,
          provenanceRisk: 0, temporalRisk: 0
        },
        hardRulesTriggered: [],
        evidence: [],
        reasons: ["Dữ liệu đầu vào không hợp lệ hoặc rỗng. Không đủ thông tin để đánh giá."],
        recommendedAction: "Không thể xác minh: dữ liệu đầu vào null/undefined/không hợp lệ.",
        requiresHumanReview: false,
        provenanceTrace: { timestamp: new Date().toISOString() }
      };
    }

    const url = typeof inputPayload.url === "string" ? inputPayload.url : "";
    const rawText = typeof inputPayload.text === "string" ? inputPayload.text : "";
    const metadata = (inputPayload.metadata && typeof inputPayload.metadata === "object" && !Array.isArray(inputPayload.metadata))
      ? inputPayload.metadata
      : {};

    // Check if there's ANY usable evidence at all
    const hasUsableUrl = url.trim().length > 0;
    const hasUsableText = rawText.trim().length > 0;

    if (!hasUsableUrl && !hasUsableText) {
      return {
        decision: FRAUD_DECISIONS.INSUFFICIENT_DATA,
        overallRisk: 0,
        evidenceCompleteness: 0,
        dimensions: {
          sourceRisk: 0, domainRisk: 0, identityRisk: 0, documentRisk: 0,
          semanticRisk: 0, paymentRisk: 0, socialEngineeringRisk: 0,
          provenanceRisk: 0, temporalRisk: 0
        },
        hardRulesTriggered: [],
        evidence: [],
        reasons: ["Không có URL hoặc nội dung văn bản nào được cung cấp. Không đủ dữ liệu để đánh giá rủi ro."],
        recommendedAction: "Không thể xác minh: thiếu URL và nội dung văn bản.",
        requiresHumanReview: false,
        provenanceTrace: { timestamp: new Date().toISOString() }
      };
    }

    const { sourceTier = "TIER_4_UNKNOWN", claimedIssuer = "", isOfficialChannel = false } = metadata;

    const hardRulesTriggered = [];
    const evidenceList = [];
    const reasons = [];

    let sourceRisk = 0.05;
    let domainRisk = 0.05;
    let identityRisk = 0.05;
    let documentRisk = 0.05;
    let semanticRisk = 0.05;
    let paymentRisk = 0.05;
    let socialEngineeringRisk = 0.05;
    let provenanceRisk = 0.05;
    // RESERVED_NOT_DECISION_ACTIVE: temporalRisk is kept as a dimension placeholder.
    // It does not currently influence the final decision. Future implementation
    // will use publication_date, effective_date, expiration_date, and retrieval_age
    // to compute meaningful temporal risk.
    let temporalRisk = 0.05;

    // ---------------------------------------------------------------
    // FIX 4 — TEXT NORMALIZATION (Audit V2)
    // Normalize text for detection while preserving raw text for evidence
    // ---------------------------------------------------------------
    const textAnalysis = normalizeText(rawText);
    const text = textAnalysis.normalized;

    if (textAnalysis.hasZeroWidth) {
      evidenceList.push({ type: "ZERO_WIDTH_CHARACTERS_DETECTED", value: "Phát hiện ký tự zero-width trong văn bản" });
      reasons.push("Phát hiện ký tự ẩn zero-width trong văn bản — có thể là kỹ thuật che giấu nội dung.");
      semanticRisk = Math.max(semanticRisk, 0.40);
    }

    // -------------------------------------------------------------
    // 1. DOMAIN & URL RISK ANALYSIS (FIX 2 — URL CANONICALIZATION)
    // -------------------------------------------------------------
    const urlAnalysis = canonicalizeUrl(url);
    const parsedHostname = urlAnalysis.hostname;

    // Detect userinfo attack: https://hcmute.edu.vn@attacker.com
    if (urlAnalysis.hasUserinfo) {
      domainRisk = 0.99;
      hardRulesTriggered.push(HARD_SAFETY_RULES.KNOWN_MALICIOUS_DOMAIN);
      reasons.push("Phát hiện tấn công userinfo trong URL — hostname thực tế khác với hostname hiển thị.");
      evidenceList.push({ type: "USERINFO_ATTACK", hostname: parsedHostname, originalUrl: url });
    }

    // Check URL Shorteners
    const shorteners = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "shorturl.at", "is.gd"];
    if (shorteners.some(s => parsedHostname.includes(s) || text.includes(s))) {
      domainRisk = Math.max(domainRisk, 0.85);
      reasons.push("Sử dụng dịch vụ rút gọn link (URL Shortener) để che giấu đích đến thực tế.");
      evidenceList.push({ type: "URL_SHORTENER_DETECTED", value: parsedHostname });
    }

    // Check Lookalike / Typosquatting
    const lookalikePatterns = [
      /hcmute[-_.]edu/i,
      /daotao[-_.]hcmute/i,
      /hcmute\.(?:xyz|top|site|club|online|cc|vip|info|pro)/i,
      /spkt[-_.]hcm/i,
      /daihocsuphamkythuat\.(?:com|net)/i
    ];
    const isExactOfficial = OFFICIAL_HCMUTE_ALLOWLIST.includes(parsedHostname);
    const isOfficialSubdomain = !isExactOfficial && parsedHostname.endsWith(".hcmute.edu.vn");
    const isLookalike = !isExactOfficial && !isOfficialSubdomain && lookalikePatterns.some(p => p.test(parsedHostname));

    // FIX 3 — TARGETED IDN/HOMOGLYPH DETECTION (Audit V2)
    // Instead of blanket xn-- flagging, use targeted confusable detection
    const homoglyphResult = detectHomoglyphAttack(parsedHostname, url);

    if (homoglyphResult.isHomoglyph) {
      domainRisk = 0.99;
      hardRulesTriggered.push(HARD_SAFETY_RULES.KNOWN_MALICIOUS_DOMAIN);
      reasons.push(homoglyphResult.reason);
      evidenceList.push({ type: "HOMOGLYPH_ATTACK", hostname: parsedHostname, originalUrl: url });
    } else if (isLookalike) {
      domainRisk = 0.95;
      hardRulesTriggered.push(HARD_SAFETY_RULES.OFFICIAL_DOMAIN_MISMATCH);
      reasons.push(`Tên miền [${parsedHostname}] là tên miền giả mạo (Lookalike Domain), không thuộc danh bạ chính thức của trường.`);
      evidenceList.push({ type: "LOOKALIKE_DOMAIN", hostname: parsedHostname });
    } else if (parsedHostname && !isExactOfficial && !isOfficialSubdomain && (sourceTier === "TIER_1_OFFICIAL" || isOfficialChannel)) {
      domainRisk = 0.90;
      hardRulesTriggered.push(HARD_SAFETY_RULES.OFFICIAL_DOMAIN_MISMATCH);
      reasons.push("Kênh phát hành tự xưng là nguồn chính thức của trường nhưng tên miền không khớp Allowlist.");
      evidenceList.push({ type: "OFFICIAL_DOMAIN_MISMATCH", hostname: parsedHostname });
    }

    // -------------------------------------------------------------
    // 2. CREDENTIAL & OTP EXFILTRATION (HARD SAFETY RULE)
    // -------------------------------------------------------------
    const otpKeywords = [
      /mã smart otp/i,
      /gửi mã otp/i,
      /nhập mã otp/i,
      /cung cấp mã xác thực otp/i,
      /forward mã otp/i
    ];
    if (otpKeywords.some(k => k.test(text))) {
      socialEngineeringRisk = Math.max(socialEngineeringRisk, 0.98);
      hardRulesTriggered.push(HARD_SAFETY_RULES.OTP_REQUEST);
      reasons.push("Phát hiện hành vi yêu cầu cung cấp mã xác thực OTP — Vi phạm an toàn nghiêm trọng.");
      evidenceList.push({ type: "OTP_EXFILTRATION_REQUEST" });
    }

    // FIX 5 — CONTEXTUAL CREDENTIAL EXFILTRATION PATTERNS (Audit V2)
    const passwordKeywords = [
      /nhập mật khẩu cổng thông tin/i,
      /nhập mật khẩu vcb digibank/i,
      /cung cấp mật khẩu tài khoản/i,
      /xác thực mật khẩu email sinh viên/i
    ];
    // Semantic credential-exfiltration: action verb + credential entity + outward direction
    const credentialSemanticPatterns = [
      /(?:gửi|chuyển tiếp|forward|reply|trả lời)[\s\S]{0,30}(?:mã xác thực|mã bảo mật|mật khẩu|password|security code|authentication code)/i,
      /(?:mã xác thực|mã bảo mật|mật khẩu|password|security code)[\s\S]{0,30}(?:gửi lại|gửi cho|chuyển cho|reply|forward)/i,
      /chuyển tiếp[\s\S]{0,20}\d{4,8}[\s\S]{0,20}(?:bảo mật|xác thực|xác nhận)/i
    ];

    if (passwordKeywords.some(k => k.test(text))) {
      socialEngineeringRisk = Math.max(socialEngineeringRisk, 0.98);
      hardRulesTriggered.push(HARD_SAFETY_RULES.CREDENTIAL_EXFILTRATION_REQUEST);
      reasons.push("Yêu cầu nhập hoặc cung cấp mật khẩu tài khoản cá nhân/ngân hàng.");
      evidenceList.push({ type: "CREDENTIAL_THEFT_REQUEST" });
    } else if (credentialSemanticPatterns.some(p => p.test(text))) {
      // Semantic detection — elevated risk but may be SUSPICIOUS_NEEDS_REVIEW
      // unless combined with other hard-rule signals
      socialEngineeringRisk = Math.max(socialEngineeringRisk, 0.85);
      reasons.push("Phát hiện mẫu ngữ nghĩa yêu cầu chuyển tiếp mã bảo mật / thông tin xác thực — Credential Exfiltration Candidate.");
      evidenceList.push({ type: "CREDENTIAL_SEMANTIC_EXFILTRATION_CANDIDATE" });
    }

    // Check Malware / APK Download
    if (/\.apk\b|\.exe\b|\.scr\b|\.vbs\b/i.test(text) || /\.apk\b|\.exe\b/i.test(url)) {
      documentRisk = Math.max(documentRisk, 0.96);
      hardRulesTriggered.push(HARD_SAFETY_RULES.MALWARE_DOWNLOAD);
      reasons.push("Yêu cầu tải tệp thực thi độc hại (.apk / .exe) ngụy trang dưới dạng ứng dụng sinh viên.");
      evidenceList.push({ type: "MALWARE_DOWNLOAD_ATTACHMENT" });
    }

    // -------------------------------------------------------------
    // 3. PAYMENT & FINANCIAL FRAUD ANALYSIS (FIX 4 — NORMALIZED TEXT)
    // Uses normalized text where spaced/dashed digits are collapsed
    // -------------------------------------------------------------
    // Known official beneficiary names (case-insensitive comparison)
    const OFFICIAL_BENEFICIARY_PATTERNS = [
      /trường đại học sư phạm kỹ thuật/i,
      /đh spkt/i,
      /đhspkt/i,
      /trường đh sư phạm kỹ thuật/i
    ];

    const personalPaymentPatterns = [
      /(?:momo|zalopay|viettelpay|shopeepay)\s*:\s*\d{9,11}/i,
      /stk cá nhân/i,
      /tài khoản cá nhân/i
    ];

    // Check "chủ tài khoản:" separately with programmatic beneficiary validation
    // (The previous negative lookahead regex was broken due to \s* backtracking)
    const beneficiaryMatch = text.match(/chủ tài khoản\s*:\s*(.{0,80})/i);
    let hasPersonalBeneficiary = false;
    if (beneficiaryMatch) {
      const beneficiaryName = beneficiaryMatch[1].trim();
      const isOfficialBeneficiary = OFFICIAL_BENEFICIARY_PATTERNS.some(p => p.test(beneficiaryName));
      if (!isOfficialBeneficiary && beneficiaryName.length > 0) {
        hasPersonalBeneficiary = true;
      }
    }

    const isTuitionContext = /(?:học phí|lệ phí|phí giữ chỗ|tiền cọc|học bổng|tài trợ)/i.test(text);

    if (isTuitionContext && (personalPaymentPatterns.some(p => p.test(text)) || hasPersonalBeneficiary)) {
      paymentRisk = 0.98;
      hardRulesTriggered.push(HARD_SAFETY_RULES.PAYMENT_DESTINATION_CHANGE);
      reasons.push("Yêu cầu chuyển tiền học phí/lệ phí vào tài khoản cá nhân hoặc ví điện tử không chính thống.");
      evidenceList.push({ type: "PERSONAL_PAYMENT_DESTINATION" });
    } else if (/(?:chuyển khoản gấp|nộp phạt trong 24h|nộp cọc nhận việc)/i.test(text)) {
      paymentRisk = Math.max(paymentRisk, 0.85);
      reasons.push("Tạo áp lực tài chính khẩn cấp, đòi tiền cọc hoặc nộp phạt bất thường.");
      evidenceList.push({ type: "FINANCIAL_PRESSURE" });
    }

    // -------------------------------------------------------------
    // 4. IDENTITY & SOCIAL ENGINEERING COERCION
    // -------------------------------------------------------------
    const fakeDepartments = [
      /ban thanh tra tài chính sinh viên/i,
      /tổ thu học phí đặc biệt/i,
      /hội đồng kỷ luật khẩn cấp/i,
      /cục quản lý đào tạo quốc tế spkt/i
    ];
    if (fakeDepartments.some(d => d.test(text))) {
      identityRisk = 0.95;
      hardRulesTriggered.push(HARD_SAFETY_RULES.IMPOSSIBLE_SOURCE_IDENTITY);
      reasons.push("Sử dụng danh xưng phòng ban/tổ chức giả mạo không tồn tại trong cơ cấu trường.");
      evidenceList.push({ type: "FABRICATED_DEPARTMENT_IDENTITY" });
    }

    const coercionPatterns = [
      /đình chỉ học tập ngay lập tức/i,
      /tịch thu bằng tốt nghiệp/i,
      /hủy tư cách sinh viên vĩnh viễn/i,
      /tuyệt đối không chia sẻ thông báo này/i
    ];
    if (coercionPatterns.some(c => c.test(text))) {
      socialEngineeringRisk = Math.max(socialEngineeringRisk, 0.88);
      reasons.push("Sử dụng thủ đoạn tâm lý đe dọa (Coercion) tước đoạt quyền lợi học tập hoặc ép buộc giữ bí mật.");
      evidenceList.push({ type: "COERCIVE_PSYCHOLOGY" });
    }

    // -------------------------------------------------------------
    // 5. SEMANTIC DISCREPANCY & FALSE-POSITIVE DEFENSE
    // -------------------------------------------------------------
    const englishMatch = text.match(/TOEIC\s*(\d{3})/i);
    if (englishMatch) {
      const statedScore = parseInt(englishMatch[1], 10);
      const isOfficialTier = sourceTier === "TIER_1_OFFICIAL" || sourceTier === "TIER_2_OFFICIAL_MIRROR";

      if (isOfficialTier && statedScore !== 550) {
        // Legitimate prospective regulation from Tier 1 -> Route to Human Review Gate, NOT Fraud!
        semanticRisk = 0.15;
        reasons.push(`Phát hiện điều chỉnh chuẩn ngoại ngữ (TOEIC ${statedScore}) từ nguồn chính thống TIER_1. Chuyển tiếp vào quy trình đối soát Rule DAG & Human Review.`);
        evidenceList.push({ type: "LEGITIMATE_REGULATION_UPDATE_CANDIDATE", statedScore });
      } else if (!isOfficialTier && statedScore !== 550 && statedScore !== 450) {
        // Unverified source altering academic rules
        semanticRisk = 0.80;
        reasons.push(`Nguồn chưa xác minh tuyên bố chuẩn ngoại ngữ bất thường (TOEIC ${statedScore}), mâu thuẫn với Gold Ruleset.`);
        evidenceList.push({ type: "UNVERIFIED_SEMANTIC_ALTERATION", statedScore });
      }
    }

    // -------------------------------------------------------------
    // 6. PROVENANCE & SOURCE TIER RESOLUTION
    // -------------------------------------------------------------
    if (sourceTier === "TIER_1_OFFICIAL" && isExactOfficial) {
      sourceRisk = 0.02;
      provenanceRisk = 0.02;
    } else if (sourceTier === "TIER_5_UNTRUSTED" || (!isExactOfficial && url)) {
      sourceRisk = Math.max(sourceRisk, 0.80);
      provenanceRisk = Math.max(provenanceRisk, 0.85);
    }

    // -------------------------------------------------------------
    // 7. COMPOSITE RISK CALCULATION & DECISION RESOLUTION
    // -------------------------------------------------------------
    const dimensions = {
      sourceRisk: Number(sourceRisk.toFixed(2)),
      domainRisk: Number(domainRisk.toFixed(2)),
      identityRisk: Number(identityRisk.toFixed(2)),
      documentRisk: Number(documentRisk.toFixed(2)),
      semanticRisk: Number(semanticRisk.toFixed(2)),
      paymentRisk: Number(paymentRisk.toFixed(2)),
      socialEngineeringRisk: Number(socialEngineeringRisk.toFixed(2)),
      provenanceRisk: Number(provenanceRisk.toFixed(2)),
      temporalRisk: Number(temporalRisk.toFixed(2))
    };

    const maxRisk = Math.max(...Object.values(dimensions));
    const avgRisk = Object.values(dimensions).reduce((a, b) => a + b, 0) / Object.values(dimensions).length;
    let overallRisk = Number((maxRisk * 0.7 + avgRisk * 0.3).toFixed(2));
    
    if (hardRulesTriggered.length > 0) {
      overallRisk = Math.max(overallRisk, 0.95);
    }

    // FIX 6 — EVIDENCE-BASED COMPLETENESS (Audit V2)
    // Replaces hardcoded confidence: 0.95
    const evidenceCompleteness = computeEvidenceCompleteness(dimensions, hardRulesTriggered, evidenceList);

    let decision = FRAUD_DECISIONS.VERIFIED_OFFICIAL;
    let recommendedAction = "Cho phép hiển thị và đồng bộ bình thường.";
    let requiresHumanReview = false;

    // Hard Rule Short-Circuit: Deterministic Hazards BLOCK immediately
    if (hardRulesTriggered.length > 0) {
      decision = FRAUD_DECISIONS.BLOCKED;
      recommendedAction = "CHẶN KHẨN CẤP: Kích hoạt quy tắc an ninh cứng (Hard Safety Rule). Tuyệt đối không nạp vào hệ thống.";
      requiresHumanReview = true;
    } else if (overallRisk >= 0.70) {
      decision = FRAUD_DECISIONS.HIGH_RISK;
      recommendedAction = "CẢNH BÁO RỦI RO CAO: Có dấu hiệu lừa đảo/giả mạo. Đưa vào diện cách ly kiểm tra.";
      requiresHumanReview = true;
    } else if (sourceTier === "TIER_1_OFFICIAL" && evidenceList.some(e => e.type === "LEGITIMATE_REGULATION_UPDATE_CANDIDATE")) {
      decision = FRAUD_DECISIONS.VERIFIED_UPDATED;
      recommendedAction = "CẬP NHẬT CHÍNH THỨC: Nguồn TIER_1 hợp lệ, kích hoạt cập nhật quy tắc sau khi qua Human Review.";
      requiresHumanReview = true;
    } else if (overallRisk >= 0.30 || semanticRisk >= 0.30) {
      decision = FRAUD_DECISIONS.SUSPICIOUS_NEEDS_REVIEW;
      recommendedAction = "CẦN ĐỐI SOÁT: Chuyển qua Human Review Gate để quản trị viên học vụ phê duyệt.";
      requiresHumanReview = true;
    }

    return {
      decision,
      overallRisk,
      evidenceCompleteness,
      dimensions,
      hardRulesTriggered,
      evidence: evidenceList,
      reasons,
      recommendedAction,
      requiresHumanReview,
      provenanceTrace: {
        claimedIssuer,
        sourceTier,
        evaluatedUrl: url,
        hostname: parsedHostname,
        timestamp: new Date().toISOString()
      }
    };
  }
}
