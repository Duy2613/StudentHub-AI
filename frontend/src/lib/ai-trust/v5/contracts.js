import { createSecureId } from "../../security/secureId.js";

export const V5_SCHEMA_VERSION = "trust.v5";
export const V5_STAGE_SCHEMA_VERSION = "trust.v5.stage.v1";
export const TRUST_RICH_RESPONSE_CONTRACT_VERSION = "trust.rich.v1";
export const V5_PIPELINE_VERSION = "trust-pipeline-v5.0.0";
export const V5_POLICY_VERSION = "trust-policy-v5.0.0";
export const V5_AUDIT_VERSION = "trust-assurance-v5.0.0";

export const OPERATION_STATUS = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  PARTIAL: "PARTIAL",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
  BLOCKED: "BLOCKED",
});

export const PIPELINE_STATUS = Object.freeze({
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  PARTIAL: "PARTIAL",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
});

export const STAGE_IDS = Object.freeze(["l1", "l2a", "l2b", "l2c", "l3", "l4", "l5"]);
export const FOUR_LAYER_STAGE_IDS = Object.freeze(["l1", "l2", "l3", "l4"]);
export const FOUR_LAYER_PIPELINE_VERSION = "trust-pipeline-four-layer-final-predict-1.0.0";
export const FOUR_LAYER_MODEL = "FOUR_LAYER";

export const STAGE_FINDINGS = Object.freeze({
  l1: Object.freeze(["LOCAL_BLOCK", "LOCAL_SUSPICIOUS", "LOCAL_CLEAR", "LOCAL_UNKNOWN"]),
  l2: Object.freeze([
    "THREAT_MATCH",
    "NO_KNOWN_THREAT",
    "SEMANTIC_NORMAL",
    "SEMANTIC_SUSPICIOUS",
    "MANIPULATION_DETECTED",
    "PARTIAL",
    "UNKNOWN",
    "NOT_APPLICABLE",
  ]),
  l2a: Object.freeze(["THREAT_MATCH", "NO_KNOWN_THREAT", "UNKNOWN", "NOT_APPLICABLE", "SKIPPED_PRIVACY_SAFETY"]),
  l2b: Object.freeze([
    "SEMANTIC_NORMAL",
    "SEMANTIC_SUSPICIOUS",
    "MANIPULATION_DETECTED",
    "IMPERSONATION_INDICATOR",
    "CREDENTIAL_SOLICITATION",
    "PAYMENT_SOLICITATION",
    "UNKNOWN",
  ]),
  l2c: Object.freeze([
    "FAKE_SCHOLARSHIP",
    "TUITION_PAYMENT_SCAM",
    "UNIVERSITY_IMPERSONATION",
    "FACULTY_IMPERSONATION",
    "STUDENT_ORG_IMPERSONATION",
    "FAKE_INTERNSHIP",
    "FAKE_PART_TIME_JOB",
    "ADVANCE_FEE_SCAM",
    "FAKE_KTX_HOUSING",
    "FAKE_EVENT_TICKET",
    "FAKE_CERTIFICATE",
    "ACCOUNT_RECOVERY_SCAM",
    "ACCOUNT_TAKEOVER",
    "PHISHING_SOCIAL_ENGINEERING",
    "QR_PAYMENT_SCAM",
    "PAYMENT_REDIRECTION",
    "FAKE_REFUND",
    "FAKE_REWARD",
    "AUTHORITY_PAYMENT_SCAM",
    "EMERGENCY_TRANSFER_SCAM",
    "GUARANTEED_INVESTMENT_SCAM",
    "LOAN_ADVANCE_FEE",
    "FAKE_ESCROW",
    "ACCOUNT_VERIFICATION_SCAM",
    "PERSONAL_TRANSFER_IMPERSONATION",
    "FAKE_STUDENT_SUPPORT",
    "MONEY_MULE_RECRUITMENT",
    "CREDENTIAL_HARVESTING",
    "URGENCY_MANIPULATION",
    "SOCIAL_PROOF_MANIPULATION",
    "NO_MATERIAL_STUDENT_RISK",
    "UNKNOWN_STUDENT_RISK",
  ]),
  l3: Object.freeze(["SUPPORTED", "CONTRADICTED", "MIXED", "INSUFFICIENT", "STALE", "UNAVAILABLE"]),
  l4: Object.freeze(["MALICIOUS", "SUSPICIOUS", "SAFE", "NO_KNOWN_THREAT", "UNKNOWN", "NOT_APPLICABLE"]),
  l5: Object.freeze([
    "ASSURANCE_PASS",
    "REVIEW_REQUIRED",
    "RECHECK_REQUIRED",
    "INCONCLUSIVE",
    "BLOCKED_BY_MISSING_EVIDENCE",
  ]),
});

export const STAGE_DEFINITIONS = Object.freeze({
  l1: Object.freeze({
    id: "l1",
    architecturalLayer: "L1",
    stageName: "LOCAL SECURITY",
    role: "Local Security Screening",
    checking: "Kiểm tra các thuộc tính kỹ thuật nhìn thấy trực tiếp trong input mà không tin provider bên ngoài.",
    notProve: "Kết quả sạch ở đây không chứng minh nội dung, URL hoặc người gửi an toàn.",
    limitations: ["Chỉ quan sát input đã nhận; không xác minh danh tính, nguồn bên ngoài hoặc tính đúng của claim."],
    nextStage: "l2a",
  }),
  l2a: Object.freeze({
    id: "l2a",
    architecturalLayer: "L2A",
    stageName: "THREAT INTELLIGENCE",
    role: "Threat Intelligence",
    checking: "Phân loại disclosure URL bằng policy ALLOW/REDACT/SKIP rồi, nếu được phép, chỉ đối chiếu reputation; không fetch/render/execute target.",
    notProve: "NO_KNOWN_THREAT không phải là Verified Safe và không loại trừ mối đe dọa chưa biết.",
    limitations: ["Phụ thuộc khả dụng, phạm vi và độ tươi của provider; lỗi/timeout luôn giữ UNKNOWN.", "Private/local/link-local/metadata/SSRF-sensitive target bị SKIP và không tạo provider finding."],
    nextStage: "l2b",
  }),
  l2b: Object.freeze({
    id: "l2b",
    architecturalLayer: "L2B",
    stageName: "SEMANTIC INTELLIGENCE",
    role: "Semantic Intelligence",
    checking: "Phân tích intent, claim, entity, urgency, payment/credential pressure và dấu hiệu thao túng.",
    notProve: "Phân tích ngữ nghĩa không tự tạo THREAT_MATCH, không chứng minh sự thật và không cấp SAFE.",
    limitations: ["Tín hiệu semantic là advisory; nội dung ngoài phạm vi, provider lỗi hoặc prompt injection có thể yêu cầu review."],
    nextStage: "l2c",
  }),
  l2c: Object.freeze({
    id: "l2c",
    architecturalLayer: "L2C",
    stageName: "STUDENTHUB DOMAIN AI",
    role: "StudentHub Domain Risk Model",
    checking: "So khớp pattern lừa đảo/thao túng đặc thù đời sống sinh viên Việt Nam bằng baseline có version và tạo verification task candidate-only cho L3.",
    notProve: "Domain score chưa hiệu chuẩn không phải xác suất và không thể hạ cấp hard negative.",
    limitations: ["Runtime hiện là baseline rule model; chưa có artifact fine-tuned và không thay thế bằng chứng/Chính sách L4.", "Verification package chỉ là yêu cầu kiểm tra, không phải evidence hoặc citation."],
    nextStage: "l3",
  }),
  l3: Object.freeze({
    id: "l3",
    architecturalLayer: "L3",
    stageName: "EVIDENCE & PROVENANCE",
    role: "Evidence & Provenance",
    checking: "Đánh giá nguồn, quan hệ hỗ trợ/mâu thuẫn, freshness, authority, independence và completeness; merge task L2B với yêu cầu xác minh L2C.",
    notProve: "Giải thích do model sinh ra không phải evidence; local KB không phải xác minh bên ngoài.",
    limitations: ["Thiếu nguồn, nguồn stale, trùng lineage hoặc retrieval outage làm giảm completeness và không được nâng confidence.", "Task từ L2C không tự tạo source, evidence hoặc citation."],
    nextStage: "l4",
  }),
  l4: Object.freeze({
    id: "l4",
    architecturalLayer: "L4",
    stageName: "FINAL POLICY",
    role: "Deterministic Trust Policy",
    checking: "Áp dụng precedence tất định lên toàn bộ signal/evidence để tách SECURITY, TRUTH và ENFORCEMENT.",
    notProve: "Quyết định policy không biến NO_KNOWN_THREAT thành chứng nhận an toàn tuyệt đối.",
    limitations: ["Đây là quyết định bảo vệ và hành động theo evidence hiện có; UNKNOWN/thiếu evidence vẫn cần REVIEW."],
    nextStage: "l5",
  }),
  l5: Object.freeze({
    id: "l5",
    architecturalLayer: "L5",
    stageName: "ASSURANCE AUDIT",
    role: "Adversarial Assurance",
    checking: "Kiểm tra mất hard negative, failure-induced optimism, evidence concentration, stale/conflict, stage skip và overconfidence.",
    notProve: "ASSURANCE_PASS chỉ nói audit không thấy lỗi đã kiểm tra; không nâng safety và không thay thế L4.",
    limitations: ["Assurance chỉ bao phủ các kiểm tra deterministic đã khai báo; dữ liệu ngoài phạm vi vẫn có thể chưa được phát hiện."],
    nextStage: null,
  }),
});

// Public four-layer presentation. The older L2A/L2B/L2C and L5 definitions
// remain available for historical/internal compatibility, but are never
// emitted by the canonical own-backend route.
export const FOUR_LAYER_STAGE_DEFINITIONS = Object.freeze({
  l1: Object.freeze({
    id: "l1",
    architecturalLayer: "L1",
    stageName: "DETERMINISTIC SCREEN",
    role: "Deterministic Screen",
    checking: "Kiểm tra tất định trên input đã nhận và công bố đúng các detector thực sự đã chạy.",
    notProve: "PASS ở Layer 1 không chứng minh nội dung, URL hoặc người gửi là đúng hay an toàn.",
    limitations: ["Chỉ quan sát input đã nhận; chưa xác minh nguồn bên ngoài, danh tính hoặc tính đúng của claim."],
    nextStage: "l2",
  }),
  l2: Object.freeze({
    id: "l2",
    architecturalLayer: "L2",
    stageName: "THREAT & SEMANTIC INTELLIGENCE",
    role: "Threat & Semantic Intelligence",
    checking: "Gộp threat/reputation, semantic/entity/manipulation và student scam/context từ các provider StudentHub đã thực sự chạy.",
    notProve: "Không có provider result hoặc provider lỗi không phải SAFE; Layer 2 chỉ tạo tín hiệu cần đối chiếu.",
    limitations: ["Provider failure giữ UNKNOWN/PARTIAL; semantic và domain signal không tự chứng minh sự thật."],
    nextStage: "l3",
  }),
  l3: Object.freeze({
    id: "l3",
    architecturalLayer: "L3",
    stageName: "EVIDENCE RETRIEVAL",
    role: "Tavily Evidence Retrieval",
    checking: "Truy vấn Tavily theo bounded query strategy, xác thực URL/nội dung và giữ provenance của nguồn thực.",
    notProve: "Task hoặc claim candidate không phải evidence; zero usable sources là INSUFFICIENT_EVIDENCE/UNKNOWN.",
    limitations: ["Tavily outage, nguồn lỗi, nguồn stale hoặc thiếu độc lập đều làm giảm completeness và không được nâng confidence."],
    nextStage: "l4",
  }),
  l4: Object.freeze({
    id: "l4",
    architecturalLayer: "L4",
    stageName: "AI SYNTHESIS & REASONING",
    role: "Gemini Synthesis & Reasoning",
    checking: "Dùng evidence Tavily làm context, nêu support/contradiction/uncertainty và có thể bổ sung URL độc lập nếu URL đó vượt qua kiểm tra an toàn/truy cập.",
    notProve: "AI không được đổi policy hoặc biến thiếu evidence thành kết luận chắc chắn; URL AI bổ sung không được đưa ra ngoài nếu chưa validate.",
    limitations: ["Gemini failure giữ partial/unknown; Final Predict vẫn là projection tất định sau Layer 4."],
    nextStage: null,
  }),
});

const ALLOWED_OPERATION_STATUSES = new Set(Object.values(OPERATION_STATUS));

function boundedString(value, maxLength) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength)
    : "";
}

function boundedList(value, maxLength, mapper) {
  return Array.isArray(value) ? value.slice(0, maxLength).map(mapper).filter(Boolean) : [];
}

function normalizeSignal(value, index) {
  if (typeof value === "string") {
    const code = boundedString(value, 120);
    return code ? { code, source: "stage_observation", signalId: `signal-${index + 1}` } : null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const code = boundedString(value.code || value.type || value.signal, 120);
  if (!code) return null;
  return {
    signalId: boundedString(value.signalId, 160) || `signal-${index + 1}`,
    code,
    severity: boundedString(value.severity, 40) || "INFO",
    source: boundedString(value.source, 120) || "stage_observation",
    details: boundedString(value.details || value.description, 500),
  };
}

function safeRawMetadata(value, depth = 0) {
  if (depth > 2 || !value || typeof value !== "object" || Array.isArray(value)) return {};
  const output = {};
  for (const [key, item] of Object.entries(value).slice(0, 32)) {
    const safeKey = boundedString(key, 80).replace(/[^a-zA-Z0-9_.-]/g, "_");
    if (!safeKey) continue;
    if (typeof item === "string") output[safeKey] = boundedString(item, 600);
    else if (typeof item === "number" && Number.isFinite(item)) output[safeKey] = item;
    else if (typeof item === "boolean" || item === null) output[safeKey] = item;
    else if (Array.isArray(item)) output[safeKey] = item.slice(0, 20).map((entry) => typeof entry === "object" ? safeRawMetadata(entry, depth + 1) : boundedString(entry, 240)).filter(Boolean);
    else if (typeof item === "object") output[safeKey] = safeRawMetadata(item, depth + 1);
  }
  return output;
}

function publicText(value, maxLength = 900) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, maxLength) : null;
}

function isPrivateOrLocalHostname(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "::1" || host === "0.0.0.0") return true;
  const octets = host.split(".").map((item) => Number(item));
  if (octets.length !== 4 || octets.some((item) => !Number.isInteger(item) || item < 0 || item > 255)) return host.includes(":");
  const [a, b] = octets;
  return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function safeHttpUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return null;
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || isPrivateOrLocalHostname(parsed.hostname)) return null;
    return parsed.toString().slice(0, 4096);
  } catch {
    return null;
  }
}

function publicMetrics(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowed = [
    "signalCount", "detectorCount", "detectorsExecuted", "latencyMs", "executionTimeMs", "inputLength", "ruleVersion", "modelUsed", "providerStatus",
    "providerCallCount", "providerDurationMs", "queriesExecutedCount", "sourcesRetrievedCount", "evidenceItemsCount", "validatedSourceCount",
    "providerRawResultCount", "providerAcceptedResultCount", "providerAcceptedHostCount", "providerRejectedResultCount", "independentHostCount",
    "independentClusterCount", "verificationTasksCount", "l2cVerificationTasksCount", "initialQueryCount", "initialSourceCount",
    "initialEvidenceCount", "supplementalQueryCount", "supplementalSourceCount", "supplementalEvidenceCount", "finalValidatedSourceCount",
    "directInputSourceCount", "directInputEvidenceCount", "directInputValidatedSourceCount", "confidenceBasis",
  ];
  const output = {};
  for (const key of allowed) {
    const item = value[key];
    if (typeof item === "string") output[key] = publicText(item, 180);
    else if (typeof item === "number" && Number.isFinite(item)) output[key] = item;
    else if (typeof item === "boolean") output[key] = item;
    else if (key === "detectorsExecuted" && Array.isArray(item)) {
      output[key] = item.slice(0, 24).map((detector) => publicText(detector, 160)).filter(Boolean);
    }
  }
  return output;
}

function publicConfidenceExplanation(value, confidenceKind) {
  const explicit = publicText(value, 500);
  if (explicit) return explicit;
  const kind = String(confidenceKind || "NOT_DISCLOSED").toUpperCase();
  const explanations = {
    RULE_COVERAGE_CONFIDENCE: "Phản ánh độ phủ của các rule/detector đã thực thi; không phải xác suất claim đúng.",
    HEURISTIC_SCORE_NON_PROBABILISTIC: "Đây là điểm heuristic tất định, không phải xác suất đã hiệu chuẩn.",
    PROVIDER_ASSERTED_SCORE_NON_PROBABILISTIC: "Đây là điểm do provider công bố trong phạm vi provider; không phải xác suất độc lập.",
    SEMANTIC_CANDIDATE_SCORE_NON_PROBABILISTIC: "Đây là điểm semantic candidate để định tuyến xác minh; không phải xác suất claim đúng.",
    EVIDENCE_CONFIDENCE: "Phản ánh chất lượng, độ phủ và mức đồng thuận của evidence đã xác thực; không phải xác suất sự thật.",
    EVIDENCE_CONFIDENCE_NON_PROBABILISTIC: "Phản ánh chất lượng, độ phủ và mức đồng thuận của evidence đã xác thực; không phải xác suất sự thật.",
    EVIDENCE_COMPLETENESS_SCORE_NON_PROBABILISTIC: "Phản ánh mức độ đầy đủ của việc kiểm tra evidence; không phải xác suất claim đúng.",
    MODEL_SCORE_UNCALIBRATED: "Model score chưa được hiệu chuẩn; không được diễn giải như probability.",
    DETERMINISTIC_POLICY_SCORE_NON_PROBABILISTIC: "Phản ánh điểm policy tất định trên signal/evidence hiện có; không phải xác suất.",
    NOT_DISCLOSED: "Runtime không công bố confidence đã hiệu chuẩn cho stage này.",
  };
  return explanations[kind] || `Confidence kind ${kind} chỉ mô tả loại điểm được quan sát, không phải xác suất nếu chưa hiệu chuẩn.`;
}

function publicChecks(value) {
  const checks = Array.isArray(value) ? value : [];
  return checks.slice(0, 24).map((item) => {
    if (typeof item === "string") return { name: publicText(item, 160), status: "EXECUTED", result: null };
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    return {
      name: publicText(item.name || item.check || item.id, 160) || "UNNAMED_CHECK",
      status: publicText(item.status, 60) || "UNKNOWN",
      result: publicText(item.result, 120) || null,
      details: publicText(item.details, 500) || null,
      executedAt: publicText(item.executedAt, 80) || null,
    };
  }).filter(Boolean);
}

function publicProviderSummary(value) {
  if (typeof value === "string") {
    const providerId = publicText(value, 160);
    return providerId ? { providerId, status: null } : null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return publicRecord(value, [
    "provider", "providerId", "status", "providerStatus", "queryCount", "sourceCount", "acceptedHostCount",
    "latencyMs", "errorCode", "retrievalOrigin", "retrievalMode", "externalEvidence",
  ]);
}

function publicCrossSourceAgreement(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return publicRecord(value, ["agreementScore", "supportingSourcesCount", "contradictingSourcesCount", "unresolved", "status"]);
}

function publicSourceIndependence(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const output = publicRecord(value, ["totalClusters", "independentSourcesCount"]);
  if (output) output.clusters = publicStringList(value.clusters, 40, 180);
  return output;
}

function publicTemporalAssessment(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return publicRecord(value, ["allCurrent", "outdatedEvidenceCount", "unknownDateCount"]);
}

function publicEvidenceCollection(value, maxItems = null) {
  if (!Array.isArray(value)) return [];
  const entries = maxItems === null ? value : value.slice(0, maxItems);
  return entries.map((item) => {
    if (typeof item === "string") return { details: publicText(item, 700) };
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    return publicSources([item])[0] || publicRecord(item, ["evidenceId", "sourceId", "claimId", "relation", "status", "excerpt", "details"]);
  }).filter(Boolean);
}

function publicAiProvenance(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const aiVerification = value.aiVerification && typeof value.aiVerification === "object" ? value.aiVerification : {};
  const executedModel = publicText(value.aiExecutedModel, 160) || publicText(aiVerification.model, 160) || null;
  const isDeterministicFallback = executedModel === "deterministic_trust_policy" || executedModel === "deterministic_policy";
  return {
    provider: publicText(aiVerification.provider, 80) || null,
    requestedModel: publicText(value.aiRequestedPrimaryModel, 160) || null,
    executedModel: isDeterministicFallback ? null : executedModel,
    status: publicText(value.aiProviderStatus || value.aiVerificationStatus || value.aiOperationStatus, 120)?.toUpperCase() || "NOT_REQUESTED",
    executed: Boolean(!isDeterministicFallback && (aiVerification.model || value.aiExecutedModel)),
    fallback: value.aiFallbackUsed === true,
    fallbackReason: publicText(value.aiFallbackReason, 180) || null,
    latencyMs: typeof value.aiVerificationLatencyMs === "number" && Number.isFinite(value.aiVerificationLatencyMs) ? Math.max(0, value.aiVerificationLatencyMs) : null,
    errorType: publicText(value.aiVerificationErrorType, 120) || null,
    transport: publicText(value.aiVerificationTransport, 120) || null,
    modelTrace: publicModelTrace(value.aiModelTrace || value.gatewayAttempts || value.attempts),
  };
}

function publicPolicyProvenance(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const auditTrail = value.auditTrail && typeof value.auditTrail === "object" && !Array.isArray(value.auditTrail)
    ? value.auditTrail
    : {};
  const rawMetadata = value.rawMetadata && typeof value.rawMetadata === "object" && !Array.isArray(value.rawMetadata)
    ? value.rawMetadata
    : {};
  return {
    authoritative: true,
    ruleVersion: publicText(value.policyVersion || auditTrail.ruleVersion || rawMetadata.policyVersion, 160) || null,
    hardRuleTriggered: publicText(value.hardRuleTriggered || auditTrail.hardRuleTriggered || rawMetadata.hardRuleTriggered, 180) || null,
    precedence: publicStringList(value.policyPrecedence || auditTrail.policyPrecedence || rawMetadata.policyPrecedence, 24, 180),
    decisionAuthority: "DETERMINISTIC_POLICY",
  };
}

function publicRecord(value, fields) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const output = {};
  for (const field of fields) {
    const item = value[field];
    if (typeof item === "string") output[field] = publicText(item);
    else if (typeof item === "number" && Number.isFinite(item)) output[field] = item;
    else if (typeof item === "boolean") output[field] = item;
    else if (item === null) output[field] = null;
  }
  return Object.keys(output).length ? output : null;
}

function publicAiVerification(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const safeList = (items, max = 12) => Array.isArray(items)
    ? items.slice(0, max).map((item) => publicText(item, 700)).filter(Boolean)
    : [];
  const citationsUsed = Array.isArray(value.citationsUsed) ? value.citationsUsed.map((item) => {
    const url = safeHttpUrl(item?.url);
    if (!item || typeof item !== "object" || Array.isArray(item) || !url) return null;
    const httpStatus = Number(item.httpStatus);
    const redirectCount = Number(item.redirectCount);
    return {
      id: publicText(item.id, 180) || url,
      url,
      retrievalOrigin: publicText(item.retrievalOrigin, 120) || null,
      validationStatus: publicText(item.validationStatus, 80) || null,
      requestedUrl: safeHttpUrl(item.requestedUrl),
      httpStatus: Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599 ? httpStatus : null,
      redirectCount: Number.isInteger(redirectCount) && redirectCount >= 0 ? redirectCount : 0,
    };
  }).filter(Boolean) : [];
  return {
    verdictSignal: publicText(value.verdictSignal, 60) || "UNCERTAIN",
    supportReasons: safeList(value.supportReasons),
    contradictionReasons: safeList(value.contradictionReasons),
    missingEvidence: safeList(value.missingEvidence),
    uncertainty: publicText(value.uncertainty, 700) || "Gemini uncertainty chưa được công bố.",
    citationsUsed,
    supportingSourceIds: publicStringList(value.supportingSourceIds, null, 180),
    contradictingSourceIds: publicStringList(value.contradictingSourceIds, null, 180),
    citationValidation: value.citationValidation && typeof value.citationValidation === "object" && !Array.isArray(value.citationValidation)
      ? {
        checkedCount: Number.isFinite(Number(value.citationValidation.checkedCount)) ? Math.max(0, Number(value.citationValidation.checkedCount)) : 0,
        acceptedCount: Number.isFinite(Number(value.citationValidation.acceptedCount)) ? Math.max(0, Number(value.citationValidation.acceptedCount)) : 0,
        rejectedCount: Number.isFinite(Number(value.citationValidation.rejectedCount)) ? Math.max(0, Number(value.citationValidation.rejectedCount)) : 0,
        allLinksValidated: value.citationValidation.allLinksValidated === true,
      }
      : null,
    provider: publicText(value.provider, 80) || null,
    model: /^deterministic_/i.test(publicText(value.model, 120) || "") ? null : (publicText(value.model, 120) || null),
  };
}

function publicModelTrace(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const startedAt = typeof item.startedAt === "string" && !Number.isNaN(new Date(item.startedAt).getTime())
      ? new Date(item.startedAt).toISOString()
      : null;
    const durationMs = Number(item.durationMs ?? item.latencyMs);
    const httpStatus = Number(item.httpStatus);
    return {
      model: publicText(item.model, 160),
      attemptNumber: Number.isInteger(Number(item.attemptNumber)) && Number(item.attemptNumber) > 0 ? Number(item.attemptNumber) : 0,
      startedAt,
      durationMs: Number.isFinite(durationMs) ? Math.max(0, Math.min(durationMs, 120000)) : 0,
      httpStatus: Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599 ? httpStatus : null,
      providerErrorCode: publicText(item.providerErrorCode, 80)?.toUpperCase() || null,
      result: publicText(item.result, 80)?.toUpperCase() || "FAILED",
    };
  }).filter(Boolean);
}

function publicCooldownResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    skippedModels: publicStringList(value.skippedModels, 8, 160),
    cooldownModels: publicStringList(value.cooldownModels, 8, 160),
    activeCooldowns: Array.isArray(value.activeCooldowns) ? value.activeCooldowns.slice(0, 8).map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const date = item.cooldownUntil ? new Date(item.cooldownUntil) : null;
      return {
        model: publicText(item.model, 160),
        cooldownUntil: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
        cooldownRemainingMs: Number.isFinite(Number(item.cooldownRemainingMs)) ? Math.max(0, Math.min(Number(item.cooldownRemainingMs), 86400000)) : null,
      };
    }).filter((item) => item?.model) : [],
  };
}

function publicSignals(value) {
  return Array.isArray(value) ? value.slice(0, 40).map((item, index) => {
    if (typeof item === "string") return { signalId: `signal-${index + 1}`, code: publicText(item, 120), severity: "INFO", source: "stage_result", details: "" };
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    return {
      signalId: publicText(item.signalId, 160) || `signal-${index + 1}`,
      code: publicText(item.code || item.type || item.signal, 120) || "UNSPECIFIED_SIGNAL",
      severity: publicText(item.severity, 40) || "INFO",
      source: publicText(item.source, 120) || "stage_result",
      details: publicText(item.details || item.description, 700) || "",
    };
  }).filter(Boolean) : [];
}

function publicRetrievalPhase(value) {
  return publicRecord(value, [
    "status", "queryCount", "sourceCount", "evidenceCount", "validatedSourceCount",
    "directInputSourceCount", "directInputEvidenceCount", "directInputValidatedSourceCount",
    "provider", "providerStatus", "retrievalOrigin",
  ]) || {
    status: "NOT_REQUESTED",
    queryCount: 0,
    sourceCount: 0,
    evidenceCount: 0,
    validatedSourceCount: 0,
    directInputSourceCount: 0,
    directInputEvidenceCount: 0,
    directInputValidatedSourceCount: 0,
    provider: null,
    providerStatus: null,
    retrievalOrigin: null,
  };
}

function publicMediaForensics(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const detector = (item) => {
    const output = publicRecord(item, ["status", "verdict", "score", "scoreKind", "provider", "providerScore", "calibratedConfidence", "confidenceType", "reason"]);
    if (output) {
      if (output.score === undefined) output.score = normalizedConfidence(item?.score ?? item?.providerScore ?? item?.calibratedConfidence);
      if (output.scoreKind === undefined) output.scoreKind = publicText(item?.scoreKind || item?.confidenceType, 120) || null;
      if (output.provider === undefined) output.provider = publicText(item?.provider, 120) || null;
      output.providers = publicProviders(item?.providers);
    }
    return output;
  };
  const summary = publicRecord(value.summary, ["riskLevel", "requiresHumanReview", "disclaimer"]);
  if (summary) summary.primarySignals = publicStringList(value.summary?.primarySignals, 16, 500);
  const metadata = publicRecord(value.metadata, ["status", "exifPresent", "hasGps"]);
  if (metadata) {
    metadata.camera = publicRecord(value.metadata?.camera, ["make", "model"]);
    metadata.software = publicRecord(value.metadata?.software, ["editorDetected", "editorName"]);
    metadata.timestamps = publicRecord(value.metadata?.timestamps, ["creationTime"]);
    metadata.warnings = publicStringList(value.metadata?.warnings, 12, 400);
  }
  const provenance = publicRecord(value.provenance, ["c2paStatus", "claimGenerator", "isVerified"]);
  if (provenance) provenance.warnings = publicStringList(value.provenance?.warnings, 12, 400);
  const ocr = publicRecord(value.ocr, ["status", "text", "available"]);
  if (ocr) {
    // OCR is user-provided evidence. Keep the complete normalized text in the
    // public contract; UI components may render a compact preview separately.
    ocr.text = publicText(value.ocr?.text, 500_000) || "";
    if (ocr.available === undefined) ocr.available = Boolean(ocr.text);
    ocr.regions = Array.isArray(value.ocr?.regions) ? value.ocr.regions.slice(0, 40).map((region) => publicRecord(region, ["text", "confidence", "x", "y", "width", "height"])).filter(Boolean) : [];
    ocr.warnings = publicStringList(value.ocr?.warnings, 12, 400);
  }
  const advisory = value.advisory && typeof value.advisory === "object" ? publicRecord(value.advisory, ["role", "visualContext", "ocrInterpretation", "semanticExplanation"]) : null;
  if (advisory) advisory.sceneElements = publicStringList(value.advisory?.sceneElements, 16, 300);
  return {
    version: publicText(value.version, 120) || null,
    status: publicText(value.status, 80) || "UNKNOWN",
    summary,
    aiGeneration: detector(value.aiGeneration),
    deepfake: detector(value.deepfake),
    manipulation: detector(value.manipulation),
    metadata,
    provenance,
    compression: publicRecord(value.compression, ["signal", "qualityEstimate"]),
    resampling: publicRecord(value.resampling, ["signal", "hasResamplingSignal"]),
    ocr,
    metadataSignals: publicSignals(value.metadataSignals),
    forensicSignals: publicSignals(value.forensicSignals),
    visibleUrls: Array.isArray(value.visibleUrls) ? value.visibleUrls.map((url) => safeHttpUrl(url)).filter(Boolean) : [],
    quality: publicRecord(value.quality, ["width", "height", "byteSize", "isDegraded"]),
    advisory,
    providerAgreement: publicRecord(value.providerAgreement, ["status"]),
  };
}

function publicRetrievalPhases(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    initialSearch: publicRetrievalPhase(value.initialSearch),
    supplementalSearch: publicRetrievalPhase(value.supplementalSearch),
    finalValidatedEvidenceSet: publicRetrievalPhase(value.finalValidatedEvidenceSet),
  };
}

function publicEvidenceGapAnalysis(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    status: publicText(value.status, 80) || "UNKNOWN",
    needsMoreEvidence: value.needsMoreEvidence === true,
    requestedQueryCount: Number.isFinite(Number(value.requestedQueryCount)) ? Math.max(0, Math.min(2, Number(value.requestedQueryCount))) : 0,
    executedQueryCount: Number.isFinite(Number(value.executedQueryCount)) ? Math.max(0, Math.min(2, Number(value.executedQueryCount))) : 0,
    evidenceGaps: Array.isArray(value.evidenceGaps) ? value.evidenceGaps.slice(0, 2).map((gap) => publicRecord(gap, ["reason", "suggestedQuery", "preferredAuthority", "targetClaimId"])).filter(Boolean) : [],
    providerStatus: publicText(value.providerStatus, 100),
    errorCode: publicText(value.errorCode, 120),
    executedModel: publicText(value.executedModel, 160),
  };
}

function publicSupplementalRetrieval(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return publicRecord(value, ["status", "queryCount", "sourceCount", "validatedSourceCount", "retrievalOrigin", "providerStatus"]);
}

function publicClaims(value) {
  return Array.isArray(value) ? value.slice(0, 40).map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    return publicRecord(item, ["claimId", "text", "claim", "statement", "subject", "predicate", "rawText", "status", "authority", "origin", "candidateOnly", "sourceScope", "verificationTaskId"]);
  }).filter(Boolean) : [];
}

function publicVerificationPackage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const domainClaims = Array.isArray(value.domainClaims) ? value.domainClaims.slice(0, 8).map((claim) => {
    if (!claim || typeof claim !== "object" || Array.isArray(claim)) return null;
    return publicRecord(claim, ["claimId", "classification", "statement", "importance", "origin", "candidateOnly", "inputTrust"]);
  }).filter(Boolean) : [];
  const verificationTasks = Array.isArray(value.verificationTasks) ? value.verificationTasks.slice(0, 12).map((task) => {
    if (!task || typeof task !== "object" || Array.isArray(task)) return null;
    const output = publicRecord(task, [
      "taskId", "type", "classification", "priority", "claimId", "purpose", "targetClaim", "sourceScope",
      "origin", "candidateOnly", "inputTrust",
    ]);
    if (output) {
      output.evidenceRequirements = publicStringList(task.evidenceRequirements, 4, 240);
    }
    return output;
  }).filter(Boolean) : [];
  return {
    schemaVersion: publicText(value.schemaVersion, 120) || "l2c.verification.v1",
    status: ["REQUIRED", "NOT_REQUIRED", "UNKNOWN"].includes(value.status) ? value.status : "UNKNOWN",
    domainClaims,
    verificationTasks,
    candidateSourcePurposes: publicStringList(value.candidateSourcePurposes, 12, 180),
    evidenceRequirements: publicStringList(value.evidenceRequirements, 16, 240),
    candidateOnly: value.candidateOnly === true,
    inputTrust: publicText(value.inputTrust, 120) || "UNTRUSTED_MODEL_OUTPUT",
  };
}

function publicVerificationTasks(value) {
  return Array.isArray(value) ? value.slice(0, 80).map((task) => {
    if (!task || typeof task !== "object" || Array.isArray(task)) return null;
    const output = publicRecord(task, [
      "taskId", "type", "classification", "priority", "claimId", "purpose", "targetClaim", "sourceScope",
      "origin", "candidateOnly", "inputTrust",
    ]);
    if (output) output.evidenceRequirements = publicStringList(task.evidenceRequirements, 4, 240);
    return output;
  }).filter(Boolean) : [];
}

function publicSources(value) {
  return Array.isArray(value) ? value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const output = publicRecord(item, [
      "evidenceId", "claimId", "sourceId", "sourceUrl", "url", "title", "sourceTitle", "publisher", "domain", "sourceType",
      "authorityTier", "authorityScore", "freshness", "publishedAt", "retrievedAt", "relation", "status", "retrievalOutcome",
      "sourceFingerprint", "contentFingerprint", "clusterId", "excerpt", "relevance", "strength", "liveEvidence", "providerStatus", "retrievalOrigin",
      "origin", "provider", "validationStatus", "httpStatus", "requestedUrl", "finalUrl", "isOfficial", "isDirectQuote", "evidenceScope", "sourceScope", "contentTrust",
    ]);
    if (!output) return null;
    for (const field of ["sourceUrl", "url", "requestedUrl", "finalUrl"]) {
      const safeUrl = safeHttpUrl(item[field]);
      if (safeUrl) output[field] = safeUrl;
      else delete output[field];
    }
    if (!output.title && output.sourceTitle) output.title = output.sourceTitle;
    if (!output.sourceTitle && output.title) output.sourceTitle = output.title;
    output.authorityBasis = publicStringList(item.authorityBasis, 8, 180);
    return output;
  }).filter(Boolean) : [];
}

function publicConflicts(value) {
  return Array.isArray(value) ? value.slice(0, 30).map((item) => {
    if (typeof item === "string") return { details: publicText(item, 700) };
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const output = publicRecord(item, ["conflictId", "claimId", "conflictType", "type", "details", "resolutionRecommendation"]);
    if (!output) return null;
    output.evidenceIds = publicStringList(item.evidenceIds || item.sourceIds, 12, 180);
    return output;
  }).filter(Boolean) : [];
}

function publicProviders(value) {
  return Array.isArray(value) ? value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    return publicRecord(item, ["provider", "providerId", "success", "verdict", "confidence", "message", "threatTypes", "status", "latencyMs", "reference", "finding", "errorCode", "executed", "observedAt"]);
  }).filter(Boolean) : [];
}

function publicProviderObservations(value) {
  return Array.isArray(value) ? value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const output = publicRecord(item, [
      "provider", "providerId", "status", "finding", "verdict", "success", "confidence", "message",
      "latencyMs", "errorCode", "source", "executed", "scope", "observedAt",
    ]);
    if (!output) return null;
    output.signals = publicStringList(item.signals, 12, 500);
    output.threatTypes = publicStringList(item.threatTypes, 12, 120);
    return output;
  }).filter(Boolean) : [];
}

function publicLegacyIntegration(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const output = publicRecord(value, [
    "status", "providerStatus", "providerId", "rawVerdict", "legacyAssessmentConfidence", "assessmentConfidence",
    "evidenceAgreement", "sourceQuality", "stop", "canContinueToLayer4", "continuationDerived", "reason",
    "sourceOrigin", "sourceCount", "evidenceCount", "errorCode", "latencyMs",
  ]);
  if (!output) return null;
  output.contradictoryEvidence = publicStringList(value.contradictoryEvidence, 20, 700);
  output.sources = publicSources(value.sources);
  output.limitations = publicStringList(value.limitations, 8, 600);
  output.unresolvedSignals = publicStringList(value.unresolvedSignals, 20, 500);
  return output;
}

function publicRelatedCases(value) {
  return Array.isArray(value) ? value.slice(0, 20).map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const output = publicRecord(item, ["id", "title", "similarity", "observedAt", "status"]);
    if (output && Array.isArray(item.sharedSignals)) output.sharedSignals = item.sharedSignals.slice(0, 12).map((signal) => publicText(signal, 180)).filter(Boolean);
    return output;
  }).filter(Boolean) : [];
}

function publicStringList(value, maxItems = 40, maxLength = 240) {
  if (!Array.isArray(value)) return [];
  const entries = maxItems === null ? value : value.slice(0, maxItems);
  return entries.map((item) => publicText(item, maxLength)).filter(Boolean);
}

function publicAssurance(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const anomalies = Array.isArray(value.anomalies) ? value.anomalies.slice(0, 40).map((item) => {
    if (typeof item === "string") return { code: publicText(item, 120), severity: "HIGH", details: "" };
    const output = publicRecord(item, ["code", "severity", "details", "message"]);
    if (output && Array.isArray(item.affectedStages)) {
      output.affectedStages = item.affectedStages.slice(0, 8).map((stageId) => publicText(stageId, 40)).filter(Boolean);
    }
    return output;
  }).filter(Boolean) : [];
  return {
    status: publicText(value.status, 80) || "INCONCLUSIVE",
    anomalies,
    assuranceReasons: publicStringList(value.assuranceReasons, 20, 700),
    crossLayerConflicts: publicStringList(value.crossLayerConflicts, 20, 160),
    evidenceWeaknesses: publicStringList(value.evidenceWeaknesses, 20, 160),
    providerWeaknesses: publicStringList(value.providerWeaknesses, 20, 160),
    modelWeaknesses: publicStringList(value.modelWeaknesses, 20, 160),
    recommendedRechecks: publicStringList(value.recommendedRechecks, 20, 240),
    assuranceConfidence: normalizedConfidence(value.assuranceConfidence),
    assuranceConfidenceKind: publicText(value.assuranceConfidenceKind, 120) || "NOT_CALIBRATED_ASSURANCE_RESULT",
    auditVersion: publicText(value.auditVersion, 160) || "unknown",
    deterministicChecks: publicStringList(value.deterministicChecks, 40, 180),
    aiAuditStatus: publicText(value.aiAuditStatus, 80) || "NOT_CONFIGURED",
    aiAuditProvider: publicText(value.aiAuditProvider, 160) || null,
    downgradeOnly: value.downgradeOnly === true,
  };
}

function publicLayerResult(value, layerId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const base = publicRecord(value, [
    "layer", "status", "finding", "classification", "securityClassification", "truthStatus", "enforcement", "recommendedAction",
    "riskLevel", "decisionConfidence", "confidence", "confidenceScore", "provider", "providerStatus", "providerConfidence", "providerErrorType", "providerHttpStatus",
    "rawVerdict", "notApplicable", "notMatchIsSafetyProof", "modelStatus", "modelType", "modelVersion", "taxonomyVersion",
    "datasetVersion", "modelScore", "calibratedRisk", "calibrationStatus", "confidenceKind", "severity", "explanation",
    "semanticSummary", "sourceAgreement", "verificationCompleteness", "evidenceCompleteness", "externalEvidence", "retrievalMode",
    "retrievalStatus", "hardRuleTriggered", "classificationSource", "inputLength",
    "reputationLookupPolicy", "reputationLookupReason", "reputationLookupStatus", "reputationLookupTargetClass", "reputationLookupDisclosed",
    "aiVerificationStatus", "aiVerificationTransport", "aiVerificationThinkingLevel", "aiVerificationLatencyMs", "aiVerificationErrorType", "aiVerificationHttpStatus",
    "aiRequestedPrimaryModel", "aiExecutedModel", "aiFallbackUsed", "aiFallbackReason", "aiProviderStatus", "aiOperationStatus",
    "conclusion", "continuation", "safeToContinue", "sourceCount", "usableSourceCount", "independentSourceCount", "evidenceSufficiency",
    "sourceQuality", "evidenceAgreement", "assessmentConfidence", "model", "modelId", "providerMessage", "result", "truthAssessment", "securityRisk",
    "executionStatus", "retrievalExecuted",
  ]) || {};

  base.verdict = publicText(value.verdict || value.truthStatus || value.securityClassification || value.finding, 120) || null;
  base.confidenceExplanation = publicConfidenceExplanation(value.confidenceExplanation, base.confidenceKind || value.confidenceKind);
  base.explanation = publicText(value.explanation || value.meaning || value.semanticSummary, 1000) || null;
  base.reason = publicText(value.reason || value.reasons?.[0] || value.keyReasons?.[0], 700) || null;
  base.provider = publicProviderSummary(value.provider);
  base.providers = publicProviderObservations(value.providers || value.providerObservations || value.providerResults);
  base.sources = publicSources(value.sources || value.verifiedSources);
  base.evidence = publicSources(value.evidence || value.evidenceItems);
  base.supportingEvidence = publicEvidenceCollection(value.supportingEvidence || value.supportingSources);
  base.contradictoryEvidence = publicEvidenceCollection(value.contradictoryEvidence || value.contradictingEvidence || value.conflicts);
  base.metrics = publicMetrics(value.metrics);
  base.checks = publicChecks(value.checks || value.checksPerformed || value.actualChecks);
  base.checksPerformed = base.checks;
  base.evidenceSummary = publicText(value.evidenceSummary, 1200) || null;
  base.crossSourceAgreement = publicCrossSourceAgreement(value.crossSourceAgreement);
  base.sourceIndependence = publicSourceIndependence(value.sourceIndependence);
  base.temporalAssessment = publicTemporalAssessment(value.temporalAssessment);
  base.provider = base.provider || (value.providerId ? publicProviderSummary({ providerId: value.providerId, status: value.providerStatus }) : null);
  base.truthStatus = publicText(value.truthStatus, 120) || null;
  base.securityClassification = publicText(value.securityClassification, 120) || null;
  base.enforcement = publicText(value.enforcement, 120) || null;
  base.recommendedAction = publicText(value.recommendedAction, 120) || null;
  base.decisionConfidence = normalizedConfidence(value.decisionConfidence);
  base.keyReasons = publicStringList(value.keyReasons, 20, 700);
  base.claims = publicClaims(value.claims);
  base.entities = publicClaims(value.entities);
  base.semanticSignals = publicSignals(value.semanticSignals);
  base.riskSignals = publicSignals(value.riskSignals);
  base.verificationTasks = publicVerificationTasks(value.verificationTasks);
  base.mediaForensics = publicMediaForensics(value.mediaForensics);

  if (["l1", "l2", "l2b", "l2c"].includes(layerId)) base.signals = publicSignals(value.signals || value.riskSignals || value.contextSignals);
  if (layerId === "l1") {
    base.reasons = Array.isArray(value.reasons) ? value.reasons.slice(0, 12).map((item) => publicText(item, 700)).filter(Boolean) : [];
    base.checksPerformed = Array.isArray(value.checksPerformed || value.actualChecks)
      ? (value.checksPerformed || value.actualChecks).slice(0, 24).map((item) => {
        if (typeof item === "string") return { check: publicText(item, 160), status: "EXECUTED" };
        return publicRecord(item, ["check", "id", "name", "status", "result", "details", "executedAt"]);
      }).filter(Boolean)
      : [];
    base.metrics = publicMetrics(value.metrics);
    base.details = publicRecord(value.details, ["decisionRationale", "promptInjectionDetected", "hardBlock", "source"]);
  }
  if (layerId === "l2") {
    base.providerObservations = publicProviderObservations(value.providerObservations || value.providers || value.providerResults);
    base.providers = base.providerObservations;
    base.semanticSignals = publicSignals(value.semanticSignals || value.contextSignals);
    base.entities = publicClaims(value.entities);
    base.claims = publicClaims(value.claims);
    base.contextSignals = publicSignals(value.contextSignals || value.riskSignals);
    base.threatTypes = publicStringList(value.threatTypes, 20, 120);
    base.secondaryClassifications = publicStringList(value.secondaryClassifications, 12, 160);
    base.verificationTasks = publicVerificationTasks(value.verificationTasks);
    base.verificationTaskSummary = publicRecord(value.verificationTaskSummary, ["totalTasks", "l2bTaskCount", "l2cTaskCount"]);
    base.limitations = publicStringList(value.limitations, 16, 700);
    base.reasons = publicStringList(value.reasons, 16, 700);
    base.details = publicRecord(value.details, [
      "decisionRationale", "promptInjectionDetected", "providerStatus", "providerErrorType", "providerHttpStatus", "providerLatencyMs",
      "inputType", "threatFinding", "semanticProviderStatus", "studentContextModelStatus", "providerPartial",
    ]);
    base.verificationPackage = publicVerificationPackage(value.verificationPackage);
  }
  if (layerId === "l2a") {
    base.threatTypes = Array.isArray(value.threatTypes) ? value.threatTypes.slice(0, 20).map((item) => publicText(item, 120)).filter(Boolean) : [];
    base.providerResults = publicProviders(value.providerResults);
    base.provenance = publicRecord(value.provenance, ["noMatchIsSafetyProof", "observationScope", "observedAt"]);
  }
  if (layerId === "l2b") {
    base.claims = publicClaims(value.claims);
    base.contextSignals = publicSignals(value.contextSignals);
    base.entities = publicClaims(value.entities);
    base.details = publicRecord(value.details, ["confidenceKind", "modelUsed", "providerId", "providerStatus", "providerErrorType", "providerHttpStatus", "providerLatencyMs", "promptInjectionDetected", "decisionRationale"]);
    base.verificationPackage = publicRecord(value.verificationPackage, ["claimCount", "candidateSourceCount", "status"]);
    if (value.mediaForensics && typeof value.mediaForensics === "object") {
      base.mediaForensics = publicMediaForensics(value.mediaForensics);
    }
  }
  if (layerId === "l2c") {
    base.secondaryClassifications = Array.isArray(value.secondaryClassifications) ? value.secondaryClassifications.slice(0, 8).map((item) => publicText(item, 120)).filter(Boolean) : [];
    base.riskSignals = publicSignals(value.riskSignals);
    base.studentContext = publicRecord(value.studentContext, ["language", "inputType", "institutionContext"]);
    base.verificationPackage = publicVerificationPackage(value.verificationPackage);
  }
  if (layerId === "l3") {
    base.metrics = publicRecord(value.metrics, [
      "executionTimeMs", "queriesExecutedCount", "sourcesRetrievedCount", "evidenceItemsCount", "retrievalProvider",
      "retrievalStatus", "retrievalMode", "externalEvidence", "providerIndependent", "providerCallCount", "providerDurationMs",
      "providerTimeoutConfiguredMs", "providerParentTimeoutMs", "providerRawResultCount", "providerAcceptedResultCount",
      "providerAcceptedHostCount", "providerRejectedResultCount", "providerTimeoutClassification", "providerAbortReason",
      "providerRetryCount", "providerRetryExhausted", "providerRetryable", "independentHostCount", "independentClusterCount",
      "verificationTasksCount", "l2cVerificationTasksCount", "retrievalStage", "retrievalOrigin",
      "initialQueryCount", "initialSourceCount", "initialEvidenceCount", "supplementalQueryCount",
      "supplementalSourceCount", "supplementalEvidenceCount", "finalValidatedSourceCount", "geminiGeneratedUrlCount",
      "directInputSourceCount", "directInputEvidenceCount", "directInputValidatedSourceCount",
    ]);
    if (base.metrics) {
      base.metrics.providerRejectionReasons = publicStringList(value.metrics?.providerRejectionReasons, 20, 120);
      base.metrics.providerHttpStatuses = Array.isArray(value.metrics?.providerHttpStatuses)
        ? value.metrics.providerHttpStatuses.slice(-20).map((item) => Number(item)).filter((item) => Number.isInteger(item) && item >= 100 && item <= 599)
        : [];
      base.metrics.providerRequestTrace = Array.isArray(value.metrics?.providerRequestTrace)
        ? value.metrics.providerRequestTrace.slice(-12).map((trace) => publicRecord(trace, [
          "startedAt", "endedAt", "durationMs", "httpStatus", "abortReason", "classification", "outcome", "timeoutMs", "attempt",
        ])).filter(Boolean)
        : [];
    }
    base.claims = publicClaims(value.claims);
    base.limitations = publicStringList(value.limitations, 20, 700);
    base.sources = publicSources(value.sources);
    base.verifiedSources = publicSources(value.verifiedSources);
    base.evidence = publicSources(value.evidence);
    base.evidenceItems = publicSources(value.evidenceItems);
    base.crossSourceAgreement = publicCrossSourceAgreement(value.crossSourceAgreement);
    base.conflicts = publicConflicts(value.conflicts);
    base.sourceAuthority = publicRecord(value.sourceAuthority, ["totalEvaluated", "primaryCount"]);
    if (base.sourceAuthority) {
      base.sourceAuthority.bySource = Array.isArray(value.sourceAuthority?.bySource)
        ? value.sourceAuthority.bySource.slice(0, 40).map((item) => publicRecord(item, ["sourceId", "tier", "scope", "sourceType"])).filter(Boolean)
        : [];
    }
    base.sourceIndependence = publicRecord(value.sourceIndependence, ["totalClusters", "independentSourcesCount"]);
    if (base.sourceIndependence) base.sourceIndependence.clusters = publicStringList(value.sourceIndependence?.clusters, 40, 180);
    base.temporalAssessment = publicRecord(value.temporalAssessment, ["allCurrent", "outdatedEvidenceCount", "unknownDateCount"]);
    base.evidenceConfidence = normalizedConfidence(value.evidenceConfidence);
    base.evidenceSummary = publicText(value.evidenceSummary, 1200) || null;
    base.provider = base.provider || publicProviderSummary({
      providerId: value.metrics?.retrievalProvider || value.retrievalMode || null,
      status: value.retrievalStatus || value.metrics?.retrievalStatus || null,
      queryCount: value.metrics?.queriesExecutedCount,
      sourceCount: value.metrics?.sourcesRetrievedCount,
      acceptedHostCount: value.metrics?.providerAcceptedHostCount,
      latencyMs: value.metrics?.providerDurationMs,
      retrievalOrigin: value.metrics?.retrievalOrigin,
      retrievalMode: value.retrievalMode,
    });
    base.providerResults = publicProviders(value.providerResults);
    base.relatedCases = publicRelatedCases(value.relatedCases);
    base.claimStatuses = publicRecord(value.claimStatuses, Object.keys(value.claimStatuses || {}).slice(0, 40));
    base.verificationTasks = publicVerificationTasks(value.verificationTasks);
    base.verificationTaskSummary = publicRecord(value.verificationTaskSummary, [
      "totalTasks", "l2bTaskCount", "l2cTaskCount", "deduplicatedCount", "highImpactTaskCount", "tasksWithQueries", "tasksWithoutQueries",
    ]);
    base.candidateClaimOrigins = publicStringList(value.candidateClaimOrigins, 20, 120);
    base.evidenceRequirements = publicStringList(value.evidenceRequirements, 16, 240);
    base.retrievalPhases = publicRetrievalPhases(value.retrievalPhases);
    base.legacyIntegration = publicLegacyIntegration(value.legacyIntegration);
  }
  if (layerId === "l4") {
    base.claims = publicClaims(value.claims);
    base.keyReasons = Array.isArray(value.keyReasons) ? value.keyReasons.slice(0, 20).map((item) => publicText(item, 700)).filter(Boolean) : [];
    base.policyPrecedence = Array.isArray(value.policyPrecedence) ? value.policyPrecedence.slice(0, 20).map((item) => publicText(item, 160)).filter(Boolean) : [];
    base.evidenceRefs = Array.isArray(value.evidenceRefs) ? value.evidenceRefs.slice(0, 40).map((item) => publicText(item, 240)).filter(Boolean) : [];
    base.limitations = publicStringList(value.limitations, 20, 700);
    base.conflicts = publicConflicts(value.conflicts);
    base.userExplanation = publicRecord(value.userExplanation, ["verdictTitle", "why", "riskSummary", "recommendedActionNote", "globalComplianceSummary", "matchedUniversity"]);
    if (base.userExplanation) {
      base.userExplanation.evidenceRefs = publicStringList(value.userExplanation?.evidenceRefs, 40, 240);
      base.userExplanation.matchedStandards = publicStringList(value.userExplanation?.matchedStandards, 20, 240);
    }
    base.riskAssessment = publicRecord(value.riskAssessment, ["level", "score", "confidence", "primaryRisk", "uncertainty"]);
    base.metrics = publicRecord(value.metrics, ["modelUsed", "ruleVersion", "providerStatus", "latencyMs"]);
    base.relatedCases = publicRelatedCases(value.relatedCases);
    base.legacyIntegration = publicLegacyIntegration(value.legacyIntegration);
    base.independentResearchSources = publicSources(value.independentResearchSources);
    base.aiVerification = publicAiVerification(value.aiVerification);
    base.ai = publicAiProvenance(value);
    base.policy = publicPolicyProvenance(value);
    base.aiModelTrace = publicModelTrace(value.aiModelTrace || value.gatewayAttempts || value.attempts);
    base.aiCooldownResult = publicCooldownResult(value.aiCooldownResult || value.cooldownResult);
    base.executionStatus = publicText(value.executionStatus, 80)?.toUpperCase() || null;
    base.evidenceGapAnalysis = publicEvidenceGapAnalysis(value.evidenceGapAnalysis);
    base.supplementalRetrieval = publicSupplementalRetrieval(value.supplementalRetrieval);
    base.auditTrail = publicRecord(value.auditTrail, ["requestId", "ruleVersion", "fusedEvidenceCount", "hardRuleTriggered", "evidenceBound", "globalFrameworkCount", "isAccreditedEcosystem"]);
  }
  return base;
}

function normalizedConfidence(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? Number(value.toFixed(4))
    : null;
}

export function createStageEnvelope(input = {}) {
  const value = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const stageId = [...STAGE_IDS, ...FOUR_LAYER_STAGE_IDS].includes(value.stageId) ? value.stageId : "l1";
  const useFourLayerDefinition = value.pipelineModel === FOUR_LAYER_MODEL || stageId === "l2";
  const definition = useFourLayerDefinition ? FOUR_LAYER_STAGE_DEFINITIONS[stageId] : STAGE_DEFINITIONS[stageId];
  const findingOptions = STAGE_FINDINGS[stageId] || [];
  const operationStatus = ALLOWED_OPERATION_STATUSES.has(value.operationStatus)
    ? value.operationStatus
    : OPERATION_STATUS.NOT_STARTED;
  const validFinding = typeof value.finding === "string" && findingOptions.includes(value.finding)
    ? value.finding
    : null;
  const startedAt = typeof value.startedAt === "string" ? value.startedAt : null;
  const completedAt = typeof value.completedAt === "string" ? value.completedAt : null;
  const latencyMs = typeof value.latencyMs === "number" && Number.isFinite(value.latencyMs) && value.latencyMs >= 0
    ? Math.round(value.latencyMs)
    : null;
  const limitations = Array.from(new Set([
    ...definition.limitations,
    ...boundedList(value.limitations, 12, (item) => boundedString(item, 500)),
  ])).slice(0, 16);

  return {
    schemaVersion: V5_STAGE_SCHEMA_VERSION,
    pipelineModel: useFourLayerDefinition ? FOUR_LAYER_MODEL : "INTERNAL_V5",
    requestId: boundedString(value.requestId, 160) || createSecureId("req_v5"),
    stageId,
    architecturalLayer: definition.architecturalLayer,
    stageName: definition.stageName,
    role: definition.role,
    checking: definition.checking,
    operationStatus,
    verdict: boundedString(value.verdict, 120) || validFinding || null,
    finding: validFinding,
    severity: boundedString(value.severity, 40) || "UNKNOWN",
    startedAt,
    completedAt,
    latencyMs,
    providerStatus: boundedString(value.providerStatus, 80) || "NOT_STARTED",
    providerErrorType: boundedString(value.providerErrorType, 120) || null,
    providerHttpStatus: typeof value.providerHttpStatus === "number" && Number.isInteger(value.providerHttpStatus) && value.providerHttpStatus >= 100 && value.providerHttpStatus <= 599 ? value.providerHttpStatus : null,
    providerId: boundedString(value.providerId, 160) || null,
    modelId: boundedString(value.modelId, 160) || null,
    modelVersion: boundedString(value.modelVersion, 160) || null,
    confidence: normalizedConfidence(value.confidence),
    confidenceKind: boundedString(value.confidenceKind, 120) || "NOT_DISCLOSED",
    confidenceExplanation: publicConfidenceExplanation(value.confidenceExplanation, value.confidenceKind),
    explanation: boundedString(value.explanation || value.meaning, 1000) || null,
    reason: boundedString(value.reason || value.reasons?.[0], 700) || null,
    summary: boundedString(value.summary, 1000) || (operationStatus === OPERATION_STATUS.NOT_STARTED ? "Chưa bắt đầu stage này." : "Chưa có kết luận đủ tin cậy."),
    reasons: boundedList(value.reasons, 12, (item) => boundedString(item, 500)),
    signals: boundedList(value.signals, 40, normalizeSignal),
    evidenceRefs: Array.from(new Set(boundedList(value.evidenceRefs, 40, (item) => boundedString(item, 240)))),
    providers: publicProviderObservations(value.providers || value.providerObservations || value.providerResults),
    sources: publicSources(value.sources || value.verifiedSources),
    evidence: publicSources(value.evidence || value.evidenceItems),
    supportingEvidence: publicEvidenceCollection(value.supportingEvidence || value.supportingSources),
    contradictoryEvidence: publicEvidenceCollection(value.contradictoryEvidence || value.contradictingEvidence || value.conflicts),
    metrics: publicMetrics(value.metrics),
    provider: publicProviderSummary(value.provider),
    checks: publicChecks(value.checks || value.checksPerformed || value.actualChecks),
    checksPerformed: publicChecks(value.checksPerformed || value.checks || value.actualChecks),
    sourceCount: Number.isFinite(Number(value.sourceCount)) ? Math.max(0, Math.round(Number(value.sourceCount))) : null,
    evidenceCount: Number.isFinite(Number(value.evidenceCount)) ? Math.max(0, Math.round(Number(value.evidenceCount))) : null,
    sourceQuality: normalizedConfidence(value.sourceQuality),
    evidenceAgreement: typeof value.evidenceAgreement === "number" && Number.isFinite(value.evidenceAgreement)
      ? normalizedConfidence(value.evidenceAgreement)
      : (boundedString(value.evidenceAgreement, 120) || null),
    verificationCompleteness: normalizedConfidence(value.verificationCompleteness),
    evidenceCompleteness: normalizedConfidence(value.evidenceCompleteness),
    evidenceSummary: boundedString(value.evidenceSummary, 1200) || null,
    crossSourceAgreement: publicCrossSourceAgreement(value.crossSourceAgreement),
    sourceIndependence: publicSourceIndependence(value.sourceIndependence),
    temporalAssessment: publicTemporalAssessment(value.temporalAssessment),
    retrievalPhases: publicRetrievalPhases(value.retrievalPhases),
    externalEvidence: value.externalEvidence === true,
    truthStatus: publicText(value.truthStatus, 120) || null,
    securityClassification: publicText(value.securityClassification, 120) || null,
    enforcement: publicText(value.enforcement, 120) || null,
    recommendedAction: publicText(value.recommendedAction, 120) || null,
    decisionConfidence: normalizedConfidence(value.decisionConfidence),
    keyReasons: publicStringList(value.keyReasons, 20, 700),
    claims: publicClaims(value.claims),
    entities: publicClaims(value.entities),
    semanticSignals: publicSignals(value.semanticSignals),
    riskSignals: publicSignals(value.riskSignals),
    verificationTasks: publicVerificationTasks(value.verificationTasks),
    mediaForensics: publicMediaForensics(value.mediaForensics),
    meaning: boundedString(value.meaning, 1000) || "Đây là kết quả trong phạm vi riêng của stage.",
    notProve: boundedString(value.notProve, 1000) || definition.notProve,
    limitations,
    nextStage: definition.nextStage,
    safeToContinue: value.safeToContinue === true,
    userAction: boundedString(value.userAction, 500) || "Đọc finding cùng limitations trước khi hành động.",
    aiVerification: publicAiVerification(value.aiVerification),
    ai: publicAiProvenance(value),
    policy: publicPolicyProvenance(value),
    aiVerificationStatus: publicText(value.aiVerificationStatus, 80) || null,
    aiVerificationTransport: publicText(value.aiVerificationTransport, 120) || null,
    aiVerificationThinkingLevel: publicText(value.aiVerificationThinkingLevel, 40) || null,
    aiVerificationLatencyMs: typeof value.aiVerificationLatencyMs === "number" && Number.isFinite(value.aiVerificationLatencyMs) ? Math.max(0, value.aiVerificationLatencyMs) : null,
    aiVerificationErrorType: publicText(value.aiVerificationErrorType, 120) || null,
    aiVerificationHttpStatus: typeof value.aiVerificationHttpStatus === "number" && Number.isInteger(value.aiVerificationHttpStatus) && value.aiVerificationHttpStatus >= 100 && value.aiVerificationHttpStatus <= 599 ? value.aiVerificationHttpStatus : null,
    aiRequestedPrimaryModel: publicText(value.aiRequestedPrimaryModel, 160) || null,
    aiExecutedModel: publicText(value.aiExecutedModel, 160) || null,
    aiFallbackUsed: value.aiFallbackUsed === true,
    aiFallbackReason: publicText(value.aiFallbackReason, 120)?.toUpperCase() || null,
    aiProviderStatus: publicText(value.aiProviderStatus, 120)?.toUpperCase() || null,
    aiOperationStatus: publicText(value.aiOperationStatus, 80)?.toUpperCase() || null,
    aiModelTrace: publicModelTrace(value.aiModelTrace || value.gatewayAttempts || value.attempts),
    aiCooldownResult: publicCooldownResult(value.aiCooldownResult || value.cooldownResult),
    verificationPackage: publicVerificationPackage(value.verificationPackage),
    verificationTaskSummary: publicRecord(value.verificationTaskSummary, [
      "totalTasks", "l2bTaskCount", "l2cTaskCount", "deduplicatedCount", "highImpactTaskCount", "tasksWithQueries", "tasksWithoutQueries",
    ]),
    audit: {
      attempt: Number.isInteger(value.audit?.attempt) && value.audit.attempt > 0 ? value.audit.attempt : 0,
      attemptCount: Number.isInteger(value.audit?.attemptCount) && value.audit.attemptCount > 0 ? value.audit.attemptCount : 0,
      errorCode: boundedString(value.audit?.errorCode, 120) || null,
      transition: boundedString(value.audit?.transition, 80) || operationStatus,
    },
    rawMetadata: safeRawMetadata(value.rawMetadata),
  };
}

export function createInitialPipeline({ requestId, startedAt, pipelineModel = null } = {}) {
  const safeRequestId = boundedString(requestId, 160) || createSecureId("req_v5");
  const isFourLayer = pipelineModel === FOUR_LAYER_MODEL;
  const stageIds = isFourLayer ? FOUR_LAYER_STAGE_IDS : STAGE_IDS;
  return {
    schemaVersion: V5_SCHEMA_VERSION,
    responseContractVersion: TRUST_RICH_RESPONSE_CONTRACT_VERSION,
    pipelineVersion: isFourLayer ? FOUR_LAYER_PIPELINE_VERSION : V5_PIPELINE_VERSION,
    pipelineModel: isFourLayer ? FOUR_LAYER_MODEL : "INTERNAL_V5",
    publicLayerCount: isFourLayer ? FOUR_LAYER_STAGE_IDS.length : null,
    requestId: safeRequestId,
    pipelineStatus: PIPELINE_STATUS.IDLE,
    currentStage: null,
    stages: Object.fromEntries(stageIds.map((stageId) => [stageId, createStageEnvelope({
      stageId,
      requestId: safeRequestId,
      operationStatus: OPERATION_STATUS.NOT_STARTED,
      pipelineModel: isFourLayer ? FOUR_LAYER_MODEL : null,
    })])),
    finalDecision: null,
    finalPredict: null,
    assurance: null,
    startedAt: typeof startedAt === "string" ? startedAt : null,
    completedAt: null,
    audit: {
      requestId: safeRequestId,
      stageSequence: [],
      stageAttempts: [],
      hardNegativePropagation: [],
      policyVersion: V5_POLICY_VERSION,
      assuranceVersion: V5_AUDIT_VERSION,
      inputFingerprint: null,
    },
  };
}

export function toPublicStageEnvelope(stage) {
  const safe = createStageEnvelope(stage);
  const { ...publicStage } = safe;
  delete publicStage.rawMetadata;
  return publicStage;
}

export function toPublicPipelineResult(result) {
  if (!result || typeof result !== "object") return null;
  if (result.pipelineModel === FOUR_LAYER_MODEL || result.pipelineVersion === FOUR_LAYER_PIPELINE_VERSION) {
    return toPublicFourLayerPipelineResult(result);
  }
  const publicResult = { ...result };
  const layerResults = publicResult.layerResults;
  delete publicResult.layerResults;
  delete publicResult.assurance;
  delete publicResult.audit;
  delete publicResult.rawMetadata;
  return {
    ...publicResult,
    responseContractVersion: TRUST_RICH_RESPONSE_CONTRACT_VERSION,
    assurance: publicAssurance(result.assurance),
    stages: Object.fromEntries(STAGE_IDS.map((stageId) => [stageId, toPublicStageEnvelope(result.stages?.[stageId] || { stageId, requestId: result.requestId })])),
    ...(layerResults && typeof layerResults === "object" ? {
      layerResults: {
        layer1: publicLayerResult(layerResults.layer1, "l1"),
        layer2A: publicLayerResult(layerResults.layer2A, "l2a"),
        layer2B: publicLayerResult(layerResults.layer2B, "l2b"),
        layer2C: publicLayerResult(layerResults.layer2C, "l2c"),
        layer3: publicLayerResult(layerResults.layer3, "l3"),
        layer4: publicLayerResult(layerResults.layer4, "l4"),
      },
    } : {}),
    audit: {
      requestId: publicText(result.audit?.requestId, 160) || publicText(result.requestId, 160) || "",
      stageSequence: publicStringList(result.audit?.stageSequence, 16, 40).filter((stageId) => STAGE_IDS.includes(stageId)),
      stageAttempts: Array.isArray(result.audit?.stageAttempts) ? result.audit.stageAttempts.slice(0, 80).map((attempt) => publicRecord(attempt, ["stageId", "attempt", "status", "finding", "errorCode", "startedAt", "completedAt"])).filter(Boolean) : [],
      hardNegativePropagation: Array.isArray(result.audit?.hardNegativePropagation) ? result.audit.hardNegativePropagation.slice(0, 40).map((item) => publicRecord(item, ["source", "finding", "destination", "expected"])).filter(Boolean) : [],
      policyVersion: publicText(result.audit?.policyVersion, 160) || V5_POLICY_VERSION,
      assuranceVersion: publicText(result.audit?.assuranceVersion, 160) || V5_AUDIT_VERSION,
    },
  };
}

function publicFinalPredict(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const output = publicRecord(value, [
    "verdict", "truthVerdict", "truthStatus", "truthAssessment", "security", "securityRisk", "securityClassification",
    "recommendedAction", "action", "assessmentConfidence", "decisionConfidence", "confidence", "evidenceAgreement", "sourceQuality", "verificationCompleteness",
    "evidenceSufficiency", "independentSourceCount", "evidenceCount", "sourceCount", "status", "derivedFrom", "confidenceKind", "confidenceExplanation",
    "authoritativeComponent", "securityEvidenceStatus", "geminiVerdictSignal", "geminiCitationCount", "geminiCitationsValidated", "validatedSecuritySourceCount",
  ]) || {};
  if (value.truthAssessment && typeof value.truthAssessment === "object" && !Array.isArray(value.truthAssessment)) {
    output.truthAssessment = publicText(value.truthAssessment.status || value.truthAssessment.verdict, 120) || null;
  }
  output.keyReasons = publicStringList(value.keyReasons, 20, 700);
  output.reason = publicText(value.reason || value.keyReasons?.[0], 700) || null;
  output.remainingUncertainty = publicStringList(value.remainingUncertainty, 20, 700);
  output.uncertainties = publicStringList(value.uncertainties || value.remainingUncertainty, 20, 700);
  output.keySources = publicSources(value.keySources || value.sources);
  output.sources = publicSources(value.sources || value.keySources);
  output.topEvidence = publicEvidenceCollection(value.topEvidence || value.keySources);
  output.evidenceRefs = publicStringList(value.evidenceRefs, 40, 240);
  output.traceability = Array.isArray(value.traceability)
    ? value.traceability.slice(0, 24).map((item) => publicRecord(item, ["source", "stage", "field", "reason", "value"])).filter(Boolean)
    : [];
  output.calls = publicRecord(value.calls, ["tavily", "ai", "gemini", "finalPredict"]);
  return output;
}

function toPublicFourLayerPipelineResult(result) {
  const publicResult = { ...result };
  const layerResults = publicResult.layerResults;
  delete publicResult.layerResults;
  delete publicResult.assurance;
  delete publicResult.audit;
  delete publicResult.rawMetadata;
  const publicStages = Object.fromEntries(FOUR_LAYER_STAGE_IDS.map((stageId) => [
    stageId,
    toPublicStageEnvelope(result.stages?.[stageId] || { stageId, requestId: result.requestId }),
  ]));
  return {
    ...publicResult,
    pipelineModel: FOUR_LAYER_MODEL,
    publicLayerCount: FOUR_LAYER_STAGE_IDS.length,
    responseContractVersion: TRUST_RICH_RESPONSE_CONTRACT_VERSION,
    assurance: null,
    stages: publicStages,
    finalPredict: publicFinalPredict(result.finalPredict),
    // Final Predict is intentionally separate from `stages`; it is not a
    // fifth layer and contains no provider-generated work.
    audit: {
      requestId: publicText(result.audit?.requestId, 160) || publicText(result.requestId, 160) || "",
      stageSequence: publicStringList(result.audit?.stageSequence, 8, 40).filter((stageId) => FOUR_LAYER_STAGE_IDS.includes(stageId)),
      stageAttempts: Array.isArray(result.audit?.stageAttempts)
        ? result.audit.stageAttempts.slice(0, 48).map((attempt) => publicRecord(attempt, ["stageId", "attempt", "status", "finding", "errorCode", "startedAt", "completedAt"])).filter(Boolean)
        : [],
      hardNegativePropagation: Array.isArray(result.audit?.hardNegativePropagation)
        ? result.audit.hardNegativePropagation.slice(0, 24).map((item) => publicRecord(item, ["source", "finding", "destination", "expected"])).filter(Boolean)
        : [],
      policyVersion: publicText(result.audit?.policyVersion, 160) || V5_POLICY_VERSION,
      assuranceVersion: null,
    },
    ...(layerResults && typeof layerResults === "object" ? {
      layerResults: {
        layer1: publicLayerResult(layerResults.layer1, "l1"),
        layer2: publicLayerResult(layerResults.layer2, "l2"),
        layer3: publicLayerResult(layerResults.layer3, "l3"),
        layer4: publicLayerResult(layerResults.layer4, "l4"),
      },
    } : {}),
  };
}

export function stageDefinition(stageId) {
  return FOUR_LAYER_STAGE_DEFINITIONS[stageId] || STAGE_DEFINITIONS[stageId] || null;
}

export function isStageComplete(stage) {
  return Boolean(stage && [OPERATION_STATUS.COMPLETED, OPERATION_STATUS.PARTIAL, OPERATION_STATUS.FAILED, OPERATION_STATUS.BLOCKED, OPERATION_STATUS.SKIPPED].includes(stage.operationStatus));
}
