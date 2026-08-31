import { STAGE_IDS, OPERATION_STATUS, PIPELINE_STATUS, V5_AUDIT_VERSION } from "../contracts.js";

const HARD_NEGATIVE_FINDINGS = new Set(["LOCAL_BLOCK", "THREAT_MATCH"]);
const NON_PASS_ASSURANCE = new Set(["REVIEW_REQUIRED", "RECHECK_REQUIRED", "INCONCLUSIVE", "BLOCKED_BY_MISSING_EVIDENCE"]);

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function bounded(value, length = 600) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, length) : "";
}

function addAnomaly(target, code, severity, details, stageIds = []) {
  if (target.some((item) => item.code === code)) return;
  target.push({
    code,
    severity,
    details: bounded(details),
    stageIds: asArray(stageIds).filter((item) => STAGE_IDS.includes(item)).slice(0, 8),
    source: "deterministic_l5_assurance",
  });
}

function normalizeAiAnomalies(value) {
  return asArray(value).slice(0, 12).map((item) => {
    const record = asObject(item);
    const code = bounded(record.code || record.type, 100);
    return code ? {
      code: `AI_${code}`,
      severity: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(record.severity) ? record.severity : "MEDIUM",
      details: bounded(record.details || record.message || "AI reviewer flagged a bounded inconsistency."),
      stageIds: asArray(record.stageIds).filter((stageId) => STAGE_IDS.includes(stageId)).slice(0, 8),
      source: "optional_ai_assurance_reviewer",
    } : null;
  }).filter(Boolean);
}

function stageMap(input) {
  const pipeline = asObject(input?.pipeline);
  const stages = asObject(input?.stages || pipeline.stages);
  return { pipeline, stages };
}

function stageFinding(stages, id) {
  return bounded(stages?.[id]?.finding, 120).toUpperCase();
}

function stageRaw(stages, id) {
  return asObject(stages?.[id]?.rawMetadata);
}

function validStageSet(stages) {
  return STAGE_IDS.every((stageId) => stages?.[stageId] && typeof stages[stageId] === "object" && stages[stageId].stageId === stageId);
}

function hasHardNegative(stages) {
  return HARD_NEGATIVE_FINDINGS.has(stageFinding(stages, "l1")) || HARD_NEGATIVE_FINDINGS.has(stageFinding(stages, "l2a"));
}

function l4Security(input, stages) {
  const l4 = asObject(input?.l4Result || input?.finalDecision || stages?.l4?.rawMetadata);
  return bounded(l4.securityClassification || l4.security || stages?.l4?.finding, 80).toUpperCase();
}

function l4Enforcement(input, stages) {
  const l4 = asObject(input?.l4Result || input?.finalDecision || stages?.l4?.rawMetadata);
  return bounded(l4.enforcement || l4.action || l4.recommendedAction, 80).toUpperCase();
}

function sourceConcentration(raw) {
  const clusters = asArray(raw.sourceClusters).filter(Boolean);
  const count = Number(raw.sourceCount || 0);
  return count > 1 && clusters.length === 1;
}

function isStale(stages) {
  const l3 = stageRaw(stages, "l3");
  return l3.staleEvidence === true || stageFinding(stages, "l3") === "STALE" || Number(l3.outdatedEvidenceCount) > 0;
}

function isConfidenceInflated(stages) {
  const l2c = stages?.l2c || {};
  const l4 = stages?.l4 || {};
  const l2cRaw = stageRaw(stages, "l2c");
  const l2cMislabelled = l2c.confidence !== null && l2c.confidence !== undefined && /UNCALIBRATED|MODEL_SCORE/i.test(`${l2c.confidenceKind} ${l2cRaw.calibrationStatus || ""}`) && l2cRaw.displayedAsProbability === true;
  const completeness = Number(stageRaw(stages, "l3").completeness);
  const l4HighAgainstWeakEvidence = Number.isFinite(l4.confidence) && Number.isFinite(completeness) && l4.confidence > 0.85 && completeness < 0.35;
  return l2cMislabelled || l4HighAgainstWeakEvidence;
}

function unsupportedNarrative(stages) {
  const refs = asArray(stageRaw(stages, "l4").narrativeEvidenceRefs);
  const evidenceRefs = new Set(asArray(stages?.l4?.evidenceRefs));
  return refs.some((ref) => typeof ref === "string" && !evidenceRefs.has(ref));
}

function stageOrderValid(pipeline, stages) {
  const sequence = asArray(pipeline.audit?.stageSequence);
  if (sequence.length === 0) return false;
  return sequence.length === STAGE_IDS.length && STAGE_IDS.every((stageId, index) => sequence[index] === stageId) && STAGE_IDS.every((stageId) => stages?.[stageId]?.stageId === stageId);
}

function stageStatusValid(stages) {
  return STAGE_IDS.every((stageId) => {
    const stage = stages?.[stageId];
    const terminal = [
      OPERATION_STATUS.COMPLETED,
      OPERATION_STATUS.PARTIAL,
      OPERATION_STATUS.FAILED,
      OPERATION_STATUS.BLOCKED,
    ].includes(stage?.operationStatus);
    const expectedL2ASkip = stageId === "l2a" && stage?.operationStatus === OPERATION_STATUS.SKIPPED &&
      stageRaw(stages, "l2a").reputationLookupPolicy === "SKIP";
    return terminal || expectedL2ASkip;
  });
}

function hasPolicyVersionMismatch(stages) {
  const policyVersion = bounded(stageRaw(stages, "l4").policyVersion, 160);
  const pipelineVersion = bounded(stageRaw(stages, "l5").policyVersion, 160);
  return Boolean(policyVersion && pipelineVersion && policyVersion !== pipelineVersion);
}

function l2cEvidenceBridgeGap(stages) {
  const l2c = asObject(stages?.l2c);
  const packageValue = asObject(l2c.verificationPackage);
  const requestedTasks = asArray(packageValue.verificationTasks);
  if (packageValue.status !== "REQUIRED" || requestedTasks.length === 0) return false;
  const l3 = asObject(stages?.l3);
  const l3Summary = asObject(l3.verificationTaskSummary);
  const l3Raw = stageRaw(stages, "l3");
  const observedTasks = Number(l3Summary.l2cTaskCount ?? l3Raw.l2cTaskCount ?? 0);
  const l2cEvidenceCount = Number(l3Raw.l2cEvidenceCount ?? 0);
  return observedTasks < requestedTasks.length || l2cEvidenceCount <= 0;
}

export class AdversarialAssuranceAuditor {
  static async audit(input = {}, options = {}) {
    const { pipeline, stages } = stageMap(input);
    const anomalies = [];
    const crossLayerConflicts = [];
    const evidenceWeaknesses = [];
    const providerWeaknesses = [];
    const modelWeaknesses = [];
    const recommendedRechecks = [];
    const deterministicChecks = [];

    if (!validStageSet(stages)) {
      addAnomaly(anomalies, "MISSING_REQUIRED_STAGE", "CRITICAL", "Không đủ bảy stage để audit assurance.", STAGE_IDS);
      deterministicChecks.push("required_stage_presence:FAIL");
    } else {
      deterministicChecks.push("required_stage_presence:PASS");
    }

    if (!stageOrderValid(pipeline, stages)) {
      addAnomaly(anomalies, "STAGE_ORDER_INVALID", "CRITICAL", "Stage sequence không khớp thứ tự L1 → L2A → L2B → L2C → L3 → L4 → L5.", STAGE_IDS);
      crossLayerConflicts.push("stage_order");
    } else {
      deterministicChecks.push("stage_order:PASS");
    }

    if (!stageStatusValid(stages)) {
      addAnomaly(anomalies, "STAGE_SKIP_OR_INCOMPLETE", "HIGH", "Có stage chưa có terminal operation status; không coi pipeline completed là an toàn.", STAGE_IDS);
      recommendedRechecks.push("rerun_missing_or_incomplete_stage");
    } else {
      deterministicChecks.push("terminal_stage_status:PASS");
    }

    const hardNegativePresent = hasHardNegative(stages);
    const finalSecurity = l4Security(input, stages);
    const finalAction = l4Enforcement(input, stages);
    if (hardNegativePresent && (finalSecurity !== "MALICIOUS" || finalAction !== "BLOCK")) {
      addAnomaly(anomalies, "DROPPED_HARD_NEGATIVE", "CRITICAL", "L1/L2A hard negative không được phản ánh thành MALICIOUS/BLOCK ở L4.", ["l1", "l2a", "l4"]);
      crossLayerConflicts.push("hard_negative_lost");
    } else {
      deterministicChecks.push("hard_negative_propagation:PASS");
    }

    const l2aProviderStatus = bounded(stages?.l2a?.providerStatus, 80).toUpperCase();
    if (l2aProviderStatus && !["SUCCESS", "NOT_APPLICABLE", "NOT_STARTED"].includes(l2aProviderStatus) && finalSecurity === "NO_KNOWN_THREAT") {
      addAnomaly(anomalies, "FAILURE_IMPROVED_RESULT", "CRITICAL", "L2A provider failure nhưng L4 lại cải thiện kết quả thành NO_KNOWN_THREAT.", ["l2a", "l4"]);
      providerWeaknesses.push("l2a_failure");
    }

    if (sourceConcentration(stageRaw(stages, "l3"))) {
      addAnomaly(anomalies, "EVIDENCE_INDEPENDENCE_OVERSTATED", "HIGH", "Nhiều source dùng cùng independence cluster; không được coi là nhiều nguồn độc lập.", ["l3", "l4"]);
      evidenceWeaknesses.push("single_independence_cluster");
      recommendedRechecks.push("retrieve_independent_source_lineage");
    }

    if (isStale(stages)) {
      addAnomaly(anomalies, "STALE_EVIDENCE", "HIGH", "Evidence stale/outdated vẫn đang được dùng như căn cứ hiện tại.", ["l3", "l4"]);
      evidenceWeaknesses.push("stale_evidence");
      recommendedRechecks.push("refresh_evidence");
    }

    if (isConfidenceInflated(stages)) {
      addAnomaly(anomalies, "CONFIDENCE_EVIDENCE_MISMATCH", "HIGH", "Confidence/model score bị trình bày hoặc dùng vượt quá semantics/calibration/evidence completeness.", ["l2c", "l3", "l4"]);
      modelWeaknesses.push("uncalibrated_or_inflated_confidence");
      recommendedRechecks.push("remove_probability_language_and_recalibrate");
    }

    if (unsupportedNarrative(stages)) {
      addAnomaly(anomalies, "UNSUPPORTED_NARRATIVE_CLAIM", "HIGH", "AI narrative tham chiếu evidence không tồn tại trong evidenceRefs.", ["l3", "l4"]);
      modelWeaknesses.push("unsupported_narrative");
    }

    if (l2cEvidenceBridgeGap(stages)) {
      addAnomaly(anomalies, "L2C_EVIDENCE_BRIDGE_GAP", "HIGH", "L2C đã yêu cầu verification task nhưng L3 chưa quan sát đủ task hoặc chưa trả evidence gắn với candidate domain claim.", ["l2c", "l3", "l4"]);
      evidenceWeaknesses.push("l2c_evidence_bridge_gap");
      recommendedRechecks.push("verify_l2c_tasks_and_independent_evidence");
    }

    if (hasPolicyVersionMismatch(stages)) {
      addAnomaly(anomalies, "POLICY_VERSION_MISMATCH", "HIGH", "Policy version giữa decision và assurance không khớp.", ["l4", "l5"]);
      crossLayerConflicts.push("policy_version");
    }

    if (pipeline.pipelineStatus === PIPELINE_STATUS.COMPLETED && stages?.l5?.operationStatus === OPERATION_STATUS.NOT_STARTED) {
      addAnomaly(anomalies, "PREMATURE_PIPELINE_COMPLETION", "CRITICAL", "Pipeline báo completed khi L5 chưa có result.", ["l5"]);
    }

    let aiAuditStatus = "NOT_CONFIGURED";
    let aiAuditProvider = null;
    const aiReviewer = options.aiReviewer;
    if (typeof aiReviewer === "function") {
      try {
        const boundedReviewInput = {
          stageFindings: Object.fromEntries(STAGE_IDS.map((stageId) => [stageId, stageFinding(stages, stageId)])),
          operationStatuses: Object.fromEntries(STAGE_IDS.map((stageId) => [stageId, bounded(stages?.[stageId]?.operationStatus, 40)])),
          l4Security: finalSecurity,
          l4Action: finalAction,
          deterministicAnomalyCodes: anomalies.map((item) => item.code),
        };
        const candidate = await aiReviewer(boundedReviewInput);
        const candidateObject = asObject(candidate);
        aiAuditStatus = "SUCCESS_UNTRUSTED";
        aiAuditProvider = bounded(candidateObject.provider, 120) || "optional_ai_assurance_reviewer";
        for (const anomaly of normalizeAiAnomalies(candidateObject.anomalies)) {
          anomalies.push(anomaly);
        }
      } catch (error) {
        aiAuditStatus = "FALLBACK_DETERMINISTIC";
        aiAuditProvider = null;
        providerWeaknesses.push(`ai_assurance_failure:${bounded(error?.name || "AI_REVIEW_FAILURE", 80)}`);
      }
    }

    const criticalCodes = new Set(["DROPPED_HARD_NEGATIVE", "FAILURE_IMPROVED_RESULT", "STAGE_ORDER_INVALID", "MISSING_REQUIRED_STAGE", "PREMATURE_PIPELINE_COMPLETION"]);
    const highCodes = new Set(["EVIDENCE_INDEPENDENCE_OVERSTATED", "STALE_EVIDENCE", "CONFIDENCE_EVIDENCE_MISMATCH", "UNSUPPORTED_NARRATIVE_CLAIM", "L2C_EVIDENCE_BRIDGE_GAP", "POLICY_VERSION_MISMATCH", "STAGE_SKIP_OR_INCOMPLETE"]);
    let status = "ASSURANCE_PASS";
    if (!validStageSet(stages)) status = "BLOCKED_BY_MISSING_EVIDENCE";
    else if (anomalies.some((item) => criticalCodes.has(item.code))) status = "REVIEW_REQUIRED";
    else if (anomalies.some((item) => highCodes.has(item.code))) status = "RECHECK_REQUIRED";
    else if (anomalies.length > 0) status = "INCONCLUSIVE";

    return {
      status,
      anomalies: anomalies.slice(0, 40),
      assuranceReasons: status === "ASSURANCE_PASS"
        ? ["Deterministic assurance checks passed; L5 giữ nguyên quyết định L4 và không nâng safety."]
        : ["Assurance phát hiện điểm cần thận trọng hơn; L5 không được xóa hard negative hoặc upgrade safety."],
      crossLayerConflicts: Array.from(new Set(crossLayerConflicts)).slice(0, 20),
      evidenceWeaknesses: Array.from(new Set(evidenceWeaknesses)).slice(0, 20),
      providerWeaknesses: Array.from(new Set(providerWeaknesses)).slice(0, 20),
      modelWeaknesses: Array.from(new Set(modelWeaknesses)).slice(0, 20),
      recommendedRechecks: Array.from(new Set(recommendedRechecks)).slice(0, 20),
      assuranceConfidence: null,
      assuranceConfidenceKind: "NOT_CALIBRATED_ASSURANCE_RESULT",
      auditVersion: V5_AUDIT_VERSION,
      deterministicChecks,
      aiAuditStatus,
      aiAuditProvider,
      downgradeOnly: true,
    };
  }
}

function normalizeL4Decision(l4 = {}) {
  const value = asObject(l4);
  const securityClassification = ["MALICIOUS", "SUSPICIOUS", "NO_KNOWN_THREAT", "UNKNOWN", "NOT_APPLICABLE"].includes(value.securityClassification)
    ? value.securityClassification
    : "UNKNOWN";
  const truthStatus = bounded(value.truthStatus, 80).toUpperCase() || "INSUFFICIENT_EVIDENCE";
  const enforcement = ["BLOCK", "WARN", "ALLOW_WITH_CAUTION", "REVIEW"].includes(value.enforcement || value.recommendedAction)
    ? (value.enforcement || value.recommendedAction)
    : "REVIEW";
  return { ...value, securityClassification, truthStatus, enforcement };
}

export function applyAssuranceDowngrade(l4Input, assurance) {
  const l4 = normalizeL4Decision(l4Input);
  // A missing, malformed, failed, or non-pass assurance result is itself an
  // evidence gap. It may only make the presentation more cautious; it must
  // never leave an ALLOW_WITH_CAUTION path looking fully cleared.
  const nonPass = assurance?.status !== "ASSURANCE_PASS" || NON_PASS_ASSURANCE.has(assurance?.status);
  const enforcement = nonPass && l4.enforcement === "ALLOW_WITH_CAUTION" ? "REVIEW" : l4.enforcement;
  const truthPresentation = nonPass && l4.truthStatus === "SUPPORTED" ? "NEEDS_RECHECK" : l4.truthStatus;
  return {
    security: l4.securityClassification,
    truth: truthPresentation,
    action: enforcement,
    securityClassification: l4.securityClassification,
    truthStatus: l4.truthStatus,
    enforcement: l4.enforcement,
    presentedTruthStatus: truthPresentation,
    presentedEnforcement: enforcement,
    l4Decision: {
      security: l4.securityClassification,
      truth: l4.truthStatus,
      action: l4.enforcement,
    },
    assuranceStatus: assurance?.status || "INCONCLUSIVE",
    assuranceApplied: nonPass && (enforcement !== l4.enforcement || truthPresentation !== l4.truthStatus),
    decisionAuthority: "L4_DETERMINISTIC_POLICY",
    assuranceAuthority: "L5_DOWNGRADE_ONLY",
    isHardNegative: l4.securityClassification === "MALICIOUS" || l4.enforcement === "BLOCK",
  };
}

export function isAssuranceDowngradeOnly(l4Input, finalDecision) {
  const l4 = normalizeL4Decision(l4Input);
  const finalValue = asObject(finalDecision);
  if (l4.securityClassification === "MALICIOUS" && finalValue.securityClassification !== "MALICIOUS") return false;
  if (l4.enforcement === "BLOCK" && finalValue.presentedEnforcement !== "BLOCK") return false;
  if (l4.enforcement === "REVIEW" && finalValue.presentedEnforcement !== "REVIEW") return false;
  if (l4.enforcement === "ALLOW_WITH_CAUTION" && !["ALLOW_WITH_CAUTION", "REVIEW"].includes(finalValue.presentedEnforcement)) return false;
  return true;
}
