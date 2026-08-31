import { STAGE_FINDINGS, STAGE_DEFINITIONS, OPERATION_STATUS, createStageEnvelope } from "./contracts.js";

function nowIso() {
  return new Date().toISOString();
}

function safeText(value, fallback = "") {
  return typeof value === "string" ? value.slice(0, 700) : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function statusFor(raw, fallback = "UNKNOWN") {
  return typeof raw === "string" && raw.trim() ? raw.trim().toUpperCase() : fallback;
}

function severityForFinding(finding) {
  if (["THREAT_MATCH", "LOCAL_BLOCK", "CREDENTIAL_SOLICITATION"].includes(finding)) return "CRITICAL";
  if (["LOCAL_SUSPICIOUS", "PAYMENT_SOLICITATION", "MANIPULATION_DETECTED", "SEMANTIC_SUSPICIOUS", "UNKNOWN", "STALE", "REVIEW_REQUIRED", "RECHECK_REQUIRED"].includes(finding)) return "HIGH";
  if (["MIXED", "INSUFFICIENT", "UNKNOWN_STUDENT_RISK"].includes(finding)) return "MEDIUM";
  return "INFO";
}

function stageBase(stageId, requestId, startedAt, completedAt, operationStatus = OPERATION_STATUS.COMPLETED) {
  return {
    stageId,
    requestId,
    startedAt,
    completedAt,
    operationStatus,
    latencyMs: startedAt && completedAt ? Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime()) : 0,
  };
}

function signal(code, details, source = "stage_adapter", severity = "INFO") {
  return { code, details: safeText(details), source, severity };
}

function rawStatus(raw) {
  return statusFor(raw?.status || raw?.classification || raw?.finding);
}

export function stageFromL1(raw, requestId, timing = {}) {
  const status = rawStatus(raw);
  const finding = status === "BLOCK" ? "LOCAL_BLOCK" : status === "SUSPICIOUS" ? "LOCAL_SUSPICIOUS" : status === "PASS" ? "LOCAL_CLEAR" : "LOCAL_UNKNOWN";
  const hardBlock = finding === "LOCAL_BLOCK";
  return createStageEnvelope({
    ...stageBase("l1", requestId, timing.startedAt || nowIso(), timing.completedAt || nowIso()),
    finding,
    severity: severityForFinding(finding),
    providerStatus: "LOCAL_DETERMINISTIC",
    providerId: "layer1_local_screen",
    modelId: raw?.metrics?.modelUsed || null,
    modelVersion: raw?.metrics?.ruleVersion || null,
    confidence: typeof raw?.confidence === "number" ? raw.confidence : null,
    confidenceKind: "HEURISTIC_SCORE_NON_PROBABILISTIC",
    summary: hardBlock
      ? "Layer 1 phát hiện chỉ dấu kỹ thuật hard block; hành động không an toàn bị chặn ngay."
      : finding === "LOCAL_SUSPICIOUS"
        ? "Layer 1 phát hiện tín hiệu kỹ thuật bất thường cần đối chiếu tiếp."
        : finding === "LOCAL_CLEAR"
          ? "Layer 1 không thấy tín hiệu kỹ thuật bất thường đã biết trong input."
          : "Layer 1 không có đủ dữ liệu cục bộ để kết luận đáng tin cậy.",
    reasons: safeArray(raw?.reasons).map((item) => safeText(item)).filter(Boolean),
    signals: safeArray(raw?.signals).slice(0, 40).map((item) => signal(item?.type || "LOCAL_SIGNAL", item?.evidence?.details || item?.evidence || item?.description || "Tín hiệu cục bộ đã được quan sát.", item?.source || "layer1_local_screen", String(item?.severity || "INFO").toUpperCase())),
    evidenceRefs: [],
    meaning: hardBlock
      ? "Input chứa tín hiệu kỹ thuật đủ mạnh để áp dụng BLOCK_INTERACTION trước khi có hành động unsafe."
      : "Đây chỉ là quan sát tất định trên input, dùng để định tuyến các bước tiếp theo.",
    userAction: hardBlock ? "Không mở/tải/thực thi target; chờ phân tích an toàn tiếp tục." : "Không suy diễn SAFE từ kết quả cục bộ.",
    safeToContinue: true,
    rawMetadata: {
      sourceStatus: status,
      hardBlock,
      signalCount: safeArray(raw?.signals).length,
      ruleVersion: raw?.metrics?.ruleVersion || null,
    },
  });
}

export function stageFromL2A(raw, requestId, timing = {}, notApplicable = false) {
  const providerStatus = statusFor(raw?.providerStatus, notApplicable ? "NOT_APPLICABLE" : "UNKNOWN");
  const finding = notApplicable || raw?.finding === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : STAGE_FINDINGS.l2a.includes(raw?.finding) ? raw.finding : "UNKNOWN";
  const hardNegative = finding === "THREAT_MATCH";
  const hasProviderScore = typeof raw?.providerConfidence === "number" && Number.isFinite(raw.providerConfidence);
  const success = providerStatus === "SUCCESS";
  return createStageEnvelope({
    ...stageBase("l2a", requestId, timing.startedAt || nowIso(), timing.completedAt || nowIso()),
    finding,
    severity: hardNegative ? "CRITICAL" : finding === "UNKNOWN" ? "HIGH" : "INFO",
    providerStatus,
    providerId: raw?.provider || null,
    confidence: hasProviderScore ? raw.providerConfidence : null,
    confidenceKind: hasProviderScore ? "PROVIDER_ASSERTED_SCORE_NON_PROBABILISTIC" : "NOT_DISCLOSED",
    summary: hardNegative
      ? "Threat intelligence trả về khớp mối đe dọa đã biết; đây là hard negative."
      : finding === "NO_KNOWN_THREAT"
        ? "Không phát hiện mối đe dọa đã biết trong provider lần này."
        : finding === "NOT_APPLICABLE"
          ? "Input không phải URL tương thích nên threat lookup không áp dụng."
          : "Threat intelligence không trả về kết quả đủ tin cậy.",
    reasons: [raw?.message, raw?.errorCode, ...(safeArray(raw?.threatTypes).map((item) => `Threat type: ${item}`))].filter(Boolean).map((item) => safeText(item)).slice(0, 12),
    signals: [
      signal(`L2A_${finding}`, finding === "NO_KNOWN_THREAT" ? "Provider không có khớp đã biết trong lần lookup này." : `Finding của adapter: ${finding}.`, raw?.provider || "layer2a_adapter", hardNegative ? "CRITICAL" : "INFO"),
      ...(providerStatus !== "SUCCESS" && finding !== "NOT_APPLICABLE" ? [signal("PROVIDER_NOT_HEALTHY", `Provider status: ${providerStatus}.`, raw?.provider || "layer2a_adapter", "HIGH")] : []),
    ],
    evidenceRefs: success && !notApplicable ? [`provider-observation:${requestId}`] : [],
    meaning: hardNegative
      ? "Mọi stage sau phải giữ nguyên security MALICIOUS/BLOCK; semantic/domain không được hạ cấp."
      : finding === "NO_KNOWN_THREAT"
        ? "Chỉ là NO_KNOWN_THREAT trong phạm vi provider và thời điểm đã kiểm tra."
        : "Không có kết quả provider đáng tin cậy để dùng làm clearance.",
    userAction: hardNegative ? "Dừng target và không tiếp tục hành động." : "Chờ semantic/domain/evidence và policy; không gọi là Verified Safe.",
    safeToContinue: true,
    rawMetadata: {
      hardNegative,
      rawVerdict: raw?.rawVerdict || null,
      threatTypes: safeArray(raw?.threatTypes).slice(0, 20),
      providerResults: safeArray(raw?.providerResults).slice(0, 20),
      notApplicable: Boolean(notApplicable || raw?.notApplicable),
    },
  });
}

function semanticFinding(raw) {
  const context = safeArray(raw?.contextSignals).map((item) => String(item?.type || "").toLowerCase());
  if (context.some((item) => item.includes("credential"))) return "CREDENTIAL_SOLICITATION";
  if (context.some((item) => item.includes("financial") || item.includes("payment"))) return "PAYMENT_SOLICITATION";
  if (context.some((item) => item.includes("impersonation"))) return "IMPERSONATION_INDICATOR";
  if (context.some((item) => item.includes("urgency") || item.includes("authority")) || raw?.classification === "DECEPTIVE") return "MANIPULATION_DETECTED";
  if (raw?.status === "UNKNOWN" || raw?.classification === "UNKNOWN") return "UNKNOWN";
  if (["SUSPICIOUS", "NEEDS_VERIFICATION", "REVIEW_REQUIRED"].includes(raw?.status)) return "SEMANTIC_SUSPICIOUS";
  return ["BENIGN", "INFORMATIVE"].includes(raw?.classification) || raw?.status === "PASS" ? "SEMANTIC_NORMAL" : "SEMANTIC_SUSPICIOUS";
}

export function stageFromL2B(raw, requestId, timing = {}) {
  const finding = semanticFinding(raw);
  const promptInjection = raw?.details?.promptInjectionDetected === true;
  const claims = safeArray(raw?.claims);
  const entities = safeArray(raw?.entities);
  return createStageEnvelope({
    ...stageBase("l2b", requestId, timing.startedAt || nowIso(), timing.completedAt || nowIso()),
    finding,
    severity: severityForFinding(finding),
    providerStatus: raw?.metrics?.providerStatus || raw?.details?.providerStatus || "LOCAL_DETERMINISTIC",
    providerId: raw?.details?.providerId || raw?.metrics?.modelUsed || "layer2b_semantic",
    modelId: raw?.details?.modelUsed || null,
    modelVersion: raw?.details?.modelUsed || null,
    confidence: typeof raw?.confidence === "number" ? raw.confidence : null,
    confidenceKind: raw?.details?.confidenceKind || "SEMANTIC_CANDIDATE_SCORE_NON_PROBABILISTIC",
    summary: finding === "SEMANTIC_NORMAL" ? "Chưa thấy pattern semantic đáng kể trong phạm vi bộ phân tích." : finding === "UNKNOWN" ? "Semantic boundary/provider không đủ dữ liệu để kết luận." : `Semantic layer phát hiện ${finding.replaceAll("_", " ")} cần đối chiếu.`,
    reasons: [raw?.semanticSummary, raw?.details?.decisionRationale].filter(Boolean).map((item) => safeText(item)).slice(0, 12),
    signals: [
      ...safeArray(raw?.contextSignals).slice(0, 30).map((item) => signal(item?.type || "SEMANTIC_SIGNAL", item?.details || "Semantic context signal.", item?.source || "layer2b_semantic", String(item?.severity || "INFO").toUpperCase())),
      signal("CLAIMS_EXTRACTED", `${claims.length} claim(s), ${entities.length} entity(ies) được bóc tách; đều là dữ liệu chưa xác minh.`, "layer2b_semantic", "INFO"),
      ...(promptInjection ? [signal("PROMPT_INJECTION_ISOLATED", "Instruction-like content được coi là untrusted content, không phải system instruction.", "layer2b_boundary", "HIGH")] : []),
    ],
    evidenceRefs: [],
    meaning: "Layer 2B mô tả intent/claim/context để lập verification task; nó không phải threat-intelligence fact hay final policy.",
    userAction: "Đọc claim như dữ liệu chưa xác minh; chờ domain và evidence.",
    safeToContinue: true,
    rawMetadata: {
      claims: claims.slice(0, 40),
      entities: entities.slice(0, 40),
      promptInjectionDetected: promptInjection,
      classification: raw?.classification || null,
    },
  });
}

export function stageFromL2C(raw, requestId, timing = {}) {
  const classification = STAGE_FINDINGS.l2c.includes(raw?.classification) ? raw.classification : "UNKNOWN_STUDENT_RISK";
  const highRisk = !["NO_MATERIAL_STUDENT_RISK", "UNKNOWN_STUDENT_RISK"].includes(classification);
  const modelScore = typeof raw?.modelScore === "number" ? raw.modelScore : null;
  return createStageEnvelope({
    ...stageBase("l2c", requestId, timing.startedAt || nowIso(), timing.completedAt || nowIso()),
    finding: classification,
    severity: raw?.severity || (highRisk ? "HIGH" : "INFO"),
    providerStatus: raw?.modelStatus || "BASELINE_RULE_MODEL",
    providerId: "student_domain_intelligence",
    modelId: raw?.modelType || "BASELINE_RULE_MODEL",
    modelVersion: raw?.modelVersion || null,
    confidence: null,
    confidenceKind: raw?.confidenceKind || "MODEL_SCORE_UNCALIBRATED",
    summary: highRisk ? `Baseline domain nhận diện pattern ${classification.replaceAll("_", " ")}.` : classification === "NO_MATERIAL_STUDENT_RISK" ? "Baseline chưa thấy pattern rủi ro sinh viên đặc thù đủ mạnh." : "Baseline không đủ tín hiệu để phân loại domain.",
    reasons: [raw?.explanation].filter(Boolean).map((item) => safeText(item)),
    signals: [
      ...safeArray(raw?.riskSignals).slice(0, 32).map((item) => signal(item?.code || item?.type || "DOMAIN_SIGNAL", item?.details || "Domain signal.", item?.source || "student_domain_rule_baseline", item?.severity || "INFO")),
      ...(modelScore !== null ? [signal("MODEL_SCORE", `MODEL_SCORE=${modelScore}; calibration=NOT_CALIBRATED; đây không phải probability.`, "student_domain_intelligence", "INFO")] : []),
    ],
    evidenceRefs: [],
    meaning: highRisk ? "Đây là candidate risk theo bối cảnh sinh viên Việt Nam để nâng suspicion và yêu cầu evidence." : "Không thấy pattern domain không đồng nghĩa với nội dung an toàn.",
    notProve: "MODEL_SCORE chưa hiệu chuẩn không phải xác suất; L2C không thể clear L1/L2A hard negative hoặc thay L4.",
    limitations: raw?.limitations,
    userAction: highRisk ? "Không chuyển tiền/cung cấp credential trước khi xác minh nguồn chính thức." : "Vẫn chờ evidence và policy; không gọi là SAFE.",
    safeToContinue: true,
    rawMetadata: {
      modelScore,
      calibrationStatus: raw?.calibrationStatus || "NOT_CALIBRATED",
      taxonomyVersion: raw?.taxonomyVersion || null,
      datasetVersion: raw?.datasetVersion || null,
      promptInjectionDetected: raw?.promptInjectionDetected === true,
      secondaryClassifications: safeArray(raw?.secondaryClassifications).slice(0, 8),
    },
  });
}

function evidenceFinding(raw) {
  const status = statusFor(raw?.status);
  if (status.includes("STALE") || Number(raw?.temporalAssessment?.outdatedEvidenceCount) > 0) return "STALE";
  if (status.includes("CONTEST") || status.includes("MIXED") || safeArray(raw?.conflicts).length > 0) return "MIXED";
  if (status.includes("VERIFIED") || status === "SUPPORTED") return "SUPPORTED";
  if (status.includes("CONTRADICT")) return "CONTRADICTED";
  if (status.includes("UNAVAILABLE") || status.includes("FAIL")) return "UNAVAILABLE";
  return "INSUFFICIENT";
}

export function stageFromL3(raw, requestId, timing = {}) {
  const finding = evidenceFinding(raw);
  const sources = safeArray(raw?.sources);
  const evidence = safeArray(raw?.evidence);
  const clusters = Array.from(new Set(sources.map((item) => item?.clusterId || item?.sourceFingerprint).filter(Boolean)));
  const local = String(raw?.retrievalMode || "").includes("LOCAL") || raw?.externalEvidence !== true;
  const stale = finding === "STALE" || Number(raw?.temporalAssessment?.outdatedEvidenceCount) > 0;
  const partialOperation = ["PARTIAL", "UNAVAILABLE", "FAIL", "ERROR"].some((value) => statusFor(raw?.status).includes(value)) || ["UNAVAILABLE", "FAIL", "ERROR"].some((value) => statusFor(raw?.retrievalStatus).includes(value));
  return createStageEnvelope({
    ...stageBase("l3", requestId, timing.startedAt || nowIso(), timing.completedAt || nowIso(), partialOperation ? OPERATION_STATUS.PARTIAL : OPERATION_STATUS.COMPLETED),
    finding,
    severity: severityForFinding(finding),
    providerStatus: raw?.retrievalStatus || "UNKNOWN",
    providerId: raw?.metrics?.retrievalProvider || raw?.retrievalMode || "evidence_retriever",
    confidence: typeof raw?.verificationCompleteness === "number" ? raw.verificationCompleteness : null,
    confidenceKind: "EVIDENCE_COMPLETENESS_SCORE_NON_PROBABILISTIC",
    summary: finding === "SUPPORTED" ? "Bằng chứng hiện có hỗ trợ claim trong phạm vi nguồn đã kiểm tra." : finding === "CONTRADICTED" ? "Bằng chứng hiện có mâu thuẫn với claim." : finding === "MIXED" ? "Nguồn/evidence có mâu thuẫn hoặc không đồng nhất." : finding === "STALE" ? "Evidence có dấu hiệu stale, không đủ để dùng như current proof." : "Chưa có đủ evidence độc lập và current để xác minh claim.",
    reasons: [raw?.retrievalMode, raw?.retrievalStatus, raw?.crossSourceAgreement].filter(Boolean).map((item) => safeText(item)).slice(0, 12),
    signals: [
      signal("SOURCES_CHECKED", `${sources.length} source(s), ${evidence.length} evidence item(s).`, "layer3_provenance", "INFO"),
      signal(local ? "LOCAL_KNOWLEDGE_BASE_OR_FALLBACK" : "EXTERNAL_EVIDENCE", local ? "Local/fallback không được label externally verified." : "Có source được adapter network guard cho phép.", "layer3_provenance", local ? "HIGH" : "INFO"),
      ...(stale ? [signal("STALE_EVIDENCE", `${raw?.temporalAssessment?.outdatedEvidenceCount || 1} evidence item(s) outdated/stale.`, "layer3_temporal", "HIGH")] : []),
      ...(safeArray(raw?.conflicts).length > 0 ? [signal("EVIDENCE_CONFLICT", `${safeArray(raw.conflicts).length} conflict(s) được giữ lại, không bị xóa.`, "layer3_conflict", "HIGH")] : []),
    ],
    evidenceRefs: evidence.map((item) => item?.evidenceId).filter((item) => typeof item === "string").slice(0, 40),
    meaning: "Layer 3 mô tả provenance, authority, freshness và independence của nguồn; model-generated explanation không phải evidence.",
    userAction: finding === "CONTRADICTED" || finding === "MIXED" ? "Không dựa vào claim; đối chiếu nguồn chính thức và giữ review." : "Xem nguồn/claim cụ thể trước khi hành động.",
    safeToContinue: true,
    rawMetadata: {
      sourceCount: sources.length,
      evidenceCount: evidence.length,
      sourceClusters: clusters,
      independentClusterCount: clusters.length,
      staleEvidence: stale,
      externalEvidence: raw?.externalEvidence === true,
      retrievalMode: raw?.retrievalMode || null,
      retrievalStatus: raw?.retrievalStatus || null,
      completeness: raw?.verificationCompleteness ?? null,
      sourceIndependence: raw?.sourceIndependence || null,
    },
  });
}

export function stageFromL4(raw, requestId, timing = {}) {
  const finding = STAGE_FINDINGS.l4.includes(raw?.securityClassification) ? raw.securityClassification : "UNKNOWN";
  const hardNegative = finding === "MALICIOUS" || raw?.enforcement === "BLOCK";
  const truth = raw?.truthStatus || "INSUFFICIENT_EVIDENCE";
  const action = raw?.enforcement || raw?.recommendedAction || "REVIEW";
  return createStageEnvelope({
    ...stageBase("l4", requestId, timing.startedAt || nowIso(), timing.completedAt || nowIso()),
    finding,
    severity: finding === "MALICIOUS" ? "CRITICAL" : finding === "SUSPICIOUS" ? "HIGH" : "INFO",
    providerStatus: "DETERMINISTIC_POLICY",
    providerId: "deterministic_trust_policy_engine",
    modelVersion: raw?.auditTrail?.ruleVersion || null,
    confidence: typeof raw?.decisionConfidence === "number" ? raw.decisionConfidence : null,
    confidenceKind: "DETERMINISTIC_POLICY_SCORE_NON_PROBABILISTIC",
    summary: `L4 quyết định SECURITY=${finding}, TRUTH=${truth}, ENFORCEMENT=${action}.`,
    reasons: [...safeArray(raw?.keyReasons), ...safeArray(raw?.policyPrecedence).map((item) => `Policy: ${item}`)].map((item) => safeText(item)).filter(Boolean).slice(0, 16),
    signals: [
      signal("SECURITY_AXIS", finding, "layer4_deterministic_policy", finding === "MALICIOUS" ? "CRITICAL" : "INFO"),
      signal("TRUTH_AXIS", truth, "layer4_deterministic_policy", "INFO"),
      signal("ENFORCEMENT_AXIS", action, "layer4_deterministic_policy", action === "BLOCK" ? "CRITICAL" : action === "REVIEW" ? "HIGH" : "INFO"),
      ...(raw?.hardRuleTriggered ? [signal("HARD_POLICY_RULE", raw.hardRuleTriggered, "layer4_deterministic_policy", "CRITICAL")] : []),
    ],
    evidenceRefs: safeArray(raw?.evidenceRefs).filter((item) => typeof item === "string").slice(0, 40),
    meaning: hardNegative ? "L4 là authoritative policy boundary; hard negative giữ MALICIOUS/BLOCK." : "L4 tách riêng security, truth và action; UNKNOWN/thiếu evidence phải REVIEW.",
    userAction: action === "BLOCK" ? "Dừng hành động và không tương tác với target." : action === "REVIEW" ? "Tạm dừng và xác minh qua nguồn độc lập." : "Chỉ tiếp tục với caution, không coi là proven safe.",
    safeToContinue: true,
    rawMetadata: {
      securityClassification: finding,
      truthStatus: truth,
      enforcement: action,
      policyPrecedence: safeArray(raw?.policyPrecedence).slice(0, 20),
      policyVersion: raw?.auditTrail?.ruleVersion || null,
      hardNegative,
      narrativeEvidenceRefs: safeArray(raw?.userExplanation?.evidenceRefs).slice(0, 40),
    },
  });
}

export function stageFromL5(raw, requestId, timing = {}) {
  const finding = STAGE_FINDINGS.l5.includes(raw?.status) ? raw.status : "INCONCLUSIVE";
  const operationStatus = finding === "BLOCKED_BY_MISSING_EVIDENCE" ? OPERATION_STATUS.PARTIAL : OPERATION_STATUS.COMPLETED;
  return createStageEnvelope({
    ...stageBase("l5", requestId, timing.startedAt || nowIso(), timing.completedAt || nowIso(), operationStatus),
    finding,
    severity: finding === "ASSURANCE_PASS" ? "INFO" : "HIGH",
    providerStatus: raw?.aiAuditStatus || "DETERMINISTIC_ASSURANCE",
    providerId: "adversarial_assurance_auditor",
    modelId: raw?.aiAuditProvider || null,
    modelVersion: raw?.auditVersion || null,
    confidence: typeof raw?.assuranceConfidence === "number" ? raw.assuranceConfidence : null,
    confidenceKind: raw?.assuranceConfidenceKind || "ASSURANCE_SCORE_NON_PROBABILISTIC",
    summary: finding === "ASSURANCE_PASS" ? "Assurance không phát hiện anomaly trong các kiểm tra đã khai báo." : `Assurance yêu cầu thận trọng hơn: ${finding.replaceAll("_", " ")}.`,
    reasons: [...safeArray(raw?.assuranceReasons), ...safeArray(raw?.anomalies).map((item) => item?.code || item)].map((item) => safeText(item)).filter(Boolean).slice(0, 20),
    signals: [
      ...safeArray(raw?.anomalies).slice(0, 40).map((item) => signal(item?.code || "ASSURANCE_ANOMALY", item?.details || item?.message || "Assurance anomaly.", "layer5_assurance", item?.severity || "HIGH")),
      ...(raw?.aiAuditStatus ? [signal("AI_ASSURANCE_STATUS", raw.aiAuditStatus, "layer5_assurance", "INFO")] : []),
    ],
    evidenceRefs: [],
    meaning: finding === "ASSURANCE_PASS" ? "Chỉ giữ nguyên L4; không nâng safety." : "L5 chỉ được giữ hoặc downgrade final presentation, không được erase hard evidence.",
    userAction: finding === "ASSURANCE_PASS" ? "Vẫn tuân theo SECURITY/TRUTH/ENFORCEMENT của L4." : "Giữ REVIEW/RECHECK và thực hiện các recommended recheck.",
    safeToContinue: true,
    rawMetadata: {
      anomalies: safeArray(raw?.anomalies).slice(0, 40),
      crossLayerConflicts: safeArray(raw?.crossLayerConflicts).slice(0, 40),
      evidenceWeaknesses: safeArray(raw?.evidenceWeaknesses).slice(0, 40),
      providerWeaknesses: safeArray(raw?.providerWeaknesses).slice(0, 40),
      modelWeaknesses: safeArray(raw?.modelWeaknesses).slice(0, 40),
      recommendedRechecks: safeArray(raw?.recommendedRechecks).slice(0, 20),
    },
  });
}

export function failedStage(stageId, requestId, errorCode, timing = {}) {
  const definition = STAGE_DEFINITIONS[stageId];
  return createStageEnvelope({
    ...stageBase(stageId, requestId, timing.startedAt || nowIso(), timing.completedAt || nowIso(), OPERATION_STATUS.FAILED),
    finding: stageId === "l2a" && definition ? "UNKNOWN" : stageId === "l2c" ? "UNKNOWN_STUDENT_RISK" : stageId === "l3" ? "UNAVAILABLE" : stageId === "l5" ? "INCONCLUSIVE" : stageId === "l4" ? "UNKNOWN" : stageId === "l2b" ? "UNKNOWN" : "LOCAL_UNKNOWN",
    severity: "HIGH",
    providerStatus: "ERROR",
    confidence: null,
    confidenceKind: "NOT_DISCLOSED",
    summary: `${definition?.stageName || stageId} gặp lỗi; pipeline tiếp tục theo fail-safe.`,
    reasons: [safeText(errorCode, "STAGE_FAILURE")],
    signals: [signal("STAGE_FAILURE", safeText(errorCode, "STAGE_FAILURE"), "orchestrator", "HIGH")],
    evidenceRefs: [],
    meaning: "Stage failure không được diễn giải thành sạch hoặc an toàn.",
    userAction: "Chờ stage sau và giữ REVIEW nếu evidence không đủ.",
    safeToContinue: true,
    rawMetadata: { errorCode: safeText(errorCode, "STAGE_FAILURE") },
  });
}
