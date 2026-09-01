import { createSecureId } from "../../security/secureId.js";

export const V5_SCHEMA_VERSION = "trust.v5";
export const V5_STAGE_SCHEMA_VERSION = "trust.v5.stage.v1";
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

export const STAGE_FINDINGS = Object.freeze({
  l1: Object.freeze(["LOCAL_BLOCK", "LOCAL_SUSPICIOUS", "LOCAL_CLEAR", "LOCAL_UNKNOWN"]),
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
    "FAKE_STUDENT_SUPPORT",
    "MONEY_MULE_RECRUITMENT",
    "CREDENTIAL_HARVESTING",
    "URGENCY_MANIPULATION",
    "SOCIAL_PROOF_MANIPULATION",
    "NO_MATERIAL_STUDENT_RISK",
    "UNKNOWN_STUDENT_RISK",
  ]),
  l3: Object.freeze(["SUPPORTED", "CONTRADICTED", "MIXED", "INSUFFICIENT", "STALE", "UNAVAILABLE"]),
  l4: Object.freeze(["MALICIOUS", "SUSPICIOUS", "NO_KNOWN_THREAT", "UNKNOWN", "NOT_APPLICABLE"]),
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
  return Array.isArray(value) ? value.slice(0, 40).map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    return publicRecord(item, [
      "evidenceId", "claimId", "sourceId", "sourceUrl", "url", "title", "publisher", "domain", "sourceType",
      "authorityTier", "freshness", "publishedAt", "retrievedAt", "relation", "status", "retrievalOutcome",
      "sourceFingerprint", "clusterId", "excerpt", "relevance", "strength", "liveEvidence", "providerStatus",
      "origin", "provider",
    ]);
  }).filter(Boolean) : [];
}

function publicProviders(value) {
  return Array.isArray(value) ? value.slice(0, 20).map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    return publicRecord(item, ["provider", "success", "verdict", "confidence", "message", "threatTypes", "status", "latencyMs", "reference"]);
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
  return Array.isArray(value)
    ? value.slice(0, maxItems).map((item) => publicText(item, maxLength)).filter(Boolean)
    : [];
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
    "riskLevel", "decisionConfidence", "confidence", "confidenceScore", "provider", "providerStatus", "providerConfidence",
    "rawVerdict", "notApplicable", "notMatchIsSafetyProof", "modelStatus", "modelType", "modelVersion", "taxonomyVersion",
    "datasetVersion", "modelScore", "calibratedRisk", "calibrationStatus", "confidenceKind", "severity", "explanation",
    "semanticSummary", "sourceAgreement", "verificationCompleteness", "evidenceCompleteness", "externalEvidence", "retrievalMode",
    "retrievalStatus", "hardRuleTriggered", "classificationSource", "inputLength",
    "reputationLookupPolicy", "reputationLookupReason", "reputationLookupStatus", "reputationLookupTargetClass", "reputationLookupDisclosed",
  ]) || {};

  if (["l1", "l2b", "l2c"].includes(layerId)) base.signals = publicSignals(value.signals || value.riskSignals || value.contextSignals);
  if (layerId === "l1") {
    base.reasons = Array.isArray(value.reasons) ? value.reasons.slice(0, 12).map((item) => publicText(item, 700)).filter(Boolean) : [];
    base.metrics = publicRecord(value.metrics, ["ruleVersion", "modelUsed", "signalCount", "latencyMs", "riskLevel", "inputLength"]);
    base.details = publicRecord(value.details, ["decisionRationale", "promptInjectionDetected", "hardBlock", "source"]);
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
    base.details = publicRecord(value.details, ["confidenceKind", "modelUsed", "providerId", "providerStatus", "promptInjectionDetected", "decisionRationale"]);
    base.verificationPackage = publicRecord(value.verificationPackage, ["claimCount", "candidateSourceCount", "status"]);
  }
  if (layerId === "l2c") {
    base.secondaryClassifications = Array.isArray(value.secondaryClassifications) ? value.secondaryClassifications.slice(0, 8).map((item) => publicText(item, 120)).filter(Boolean) : [];
    base.riskSignals = publicSignals(value.riskSignals);
    base.studentContext = publicRecord(value.studentContext, ["language", "inputType", "institutionContext"]);
    base.verificationPackage = publicVerificationPackage(value.verificationPackage);
  }
  if (layerId === "l3") {
    base.sources = publicSources(value.sources);
    base.verifiedSources = publicSources(value.verifiedSources);
    base.evidence = publicSources(value.evidence);
    base.evidenceItems = publicSources(value.evidenceItems);
    base.conflicts = Array.isArray(value.conflicts) ? value.conflicts.slice(0, 30).map((item) => publicText(typeof item === "string" ? item : item?.details || item?.type, 700)).filter(Boolean) : [];
    base.providerResults = publicProviders(value.providerResults);
    base.relatedCases = publicRelatedCases(value.relatedCases);
    base.claimStatuses = publicRecord(value.claimStatuses, Object.keys(value.claimStatuses || {}).slice(0, 40));
    base.verificationTasks = publicVerificationTasks(value.verificationTasks);
    base.verificationTaskSummary = publicRecord(value.verificationTaskSummary, [
      "totalTasks", "l2bTaskCount", "l2cTaskCount", "deduplicatedCount", "highImpactTaskCount", "tasksWithQueries", "tasksWithoutQueries",
    ]);
    base.candidateClaimOrigins = publicStringList(value.candidateClaimOrigins, 20, 120);
    base.evidenceRequirements = publicStringList(value.evidenceRequirements, 16, 240);
    base.legacyIntegration = publicLegacyIntegration(value.legacyIntegration);
  }
  if (layerId === "l4") {
    base.keyReasons = Array.isArray(value.keyReasons) ? value.keyReasons.slice(0, 20).map((item) => publicText(item, 700)).filter(Boolean) : [];
    base.policyPrecedence = Array.isArray(value.policyPrecedence) ? value.policyPrecedence.slice(0, 20).map((item) => publicText(item, 160)).filter(Boolean) : [];
    base.evidenceRefs = Array.isArray(value.evidenceRefs) ? value.evidenceRefs.slice(0, 40).map((item) => publicText(item, 240)).filter(Boolean) : [];
    base.userExplanation = publicRecord(value.userExplanation, ["verdictTitle", "why", "riskSummary", "recommendedActionNote", "evidenceRefs"]);
    base.riskAssessment = publicRecord(value.riskAssessment, ["level", "score", "confidence", "primaryRisk", "uncertainty"]);
    base.metrics = publicRecord(value.metrics, ["modelUsed", "ruleVersion", "providerStatus", "latencyMs"]);
    base.relatedCases = publicRelatedCases(value.relatedCases);
    base.legacyIntegration = publicLegacyIntegration(value.legacyIntegration);
    base.independentResearchSources = publicSources(value.independentResearchSources);
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
  const stageId = STAGE_IDS.includes(value.stageId) ? value.stageId : "l1";
  const definition = STAGE_DEFINITIONS[stageId];
  const operationStatus = ALLOWED_OPERATION_STATUSES.has(value.operationStatus)
    ? value.operationStatus
    : OPERATION_STATUS.NOT_STARTED;
  const validFinding = typeof value.finding === "string" && STAGE_FINDINGS[stageId].includes(value.finding)
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
    requestId: boundedString(value.requestId, 160) || createSecureId("req_v5"),
    stageId,
    architecturalLayer: definition.architecturalLayer,
    stageName: definition.stageName,
    role: definition.role,
    checking: definition.checking,
    operationStatus,
    finding: validFinding,
    severity: boundedString(value.severity, 40) || "UNKNOWN",
    startedAt,
    completedAt,
    latencyMs,
    providerStatus: boundedString(value.providerStatus, 80) || "NOT_STARTED",
    providerId: boundedString(value.providerId, 160) || null,
    modelId: boundedString(value.modelId, 160) || null,
    modelVersion: boundedString(value.modelVersion, 160) || null,
    confidence: normalizedConfidence(value.confidence),
    confidenceKind: boundedString(value.confidenceKind, 120) || "NOT_DISCLOSED",
    summary: boundedString(value.summary, 1000) || (operationStatus === OPERATION_STATUS.NOT_STARTED ? "Chưa bắt đầu stage này." : "Chưa có kết luận đủ tin cậy."),
    reasons: boundedList(value.reasons, 12, (item) => boundedString(item, 500)),
    signals: boundedList(value.signals, 40, normalizeSignal),
    evidenceRefs: Array.from(new Set(boundedList(value.evidenceRefs, 40, (item) => boundedString(item, 240)))),
    meaning: boundedString(value.meaning, 1000) || "Đây là kết quả trong phạm vi riêng của stage.",
    notProve: boundedString(value.notProve, 1000) || definition.notProve,
    limitations,
    nextStage: definition.nextStage,
    safeToContinue: value.safeToContinue === true,
    userAction: boundedString(value.userAction, 500) || "Đọc finding cùng limitations trước khi hành động.",
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

export function createInitialPipeline({ requestId, startedAt } = {}) {
  const safeRequestId = boundedString(requestId, 160) || createSecureId("req_v5");
  return {
    schemaVersion: V5_SCHEMA_VERSION,
    pipelineVersion: V5_PIPELINE_VERSION,
    requestId: safeRequestId,
    pipelineStatus: PIPELINE_STATUS.IDLE,
    currentStage: null,
    stages: Object.fromEntries(STAGE_IDS.map((stageId) => [stageId, createStageEnvelope({
      stageId,
      requestId: safeRequestId,
      operationStatus: OPERATION_STATUS.NOT_STARTED,
    })])),
    finalDecision: null,
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
  const publicResult = { ...result };
  const layerResults = publicResult.layerResults;
  delete publicResult.layerResults;
  delete publicResult.assurance;
  delete publicResult.audit;
  delete publicResult.rawMetadata;
  return {
    ...publicResult,
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

export function stageDefinition(stageId) {
  return STAGE_DEFINITIONS[stageId] || null;
}

export function isStageComplete(stage) {
  return Boolean(stage && [OPERATION_STATUS.COMPLETED, OPERATION_STATUS.PARTIAL, OPERATION_STATUS.FAILED, OPERATION_STATUS.BLOCKED, OPERATION_STATUS.SKIPPED].includes(stage.operationStatus));
}
