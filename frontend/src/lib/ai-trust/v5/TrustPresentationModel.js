import { STAGE_IDS } from "./contracts.js";

/**
 * Presentation contract for the ordinary Trust workspace.
 *
 * The Trust engine remains authoritative for the seven internal stages. This
 * adapter only groups those stages into four product layers and a separately
 * published final prediction, keeping raw stage payload out of the default product surface.
 */
export const TRUST_PRIMARY_PIPELINE_COUNT = 4;
export const STALE_RUN_EVENT_RENDER = 0;

export const TRUST_MACRO_STAGE_IDS = Object.freeze([
  "deterministic-screen",
  "threat-semantic-intelligence",
  "evidence-retrieval",
  "synthesis-reasoning",
]);

export const TRUST_MACRO_STAGES = Object.freeze([
  Object.freeze({
    id: "deterministic-screen",
    publicStageId: "l1",
    name: "Deterministic Screen",
    description: "Chuẩn hóa đầu vào và kiểm tra tín hiệu kỹ thuật tất định.",
    internalStageIds: Object.freeze(["l1"]),
  }),
  Object.freeze({
    id: "threat-semantic-intelligence",
    publicStageId: "l2",
    name: "Threat & Semantic Intelligence",
    description: "Đối chiếu rủi ro, ngữ nghĩa và các mệnh đề cần xác minh.",
    internalStageIds: Object.freeze(["l2a", "l2b", "l2c"]),
  }),
  Object.freeze({
    id: "evidence-retrieval",
    publicStageId: "l3",
    name: "Evidence Retrieval",
    description: "Tìm nguồn và evidence, giữ provenance, quan hệ và trạng thái retrieval.",
    internalStageIds: Object.freeze(["l3"]),
  }),
  Object.freeze({
    id: "synthesis-reasoning",
    publicStageId: "l4",
    name: "Synthesis & Reasoning",
    description: "Tổng hợp evidence và kiểm tra kết luận theo policy tất định.",
    internalStageIds: Object.freeze(["l4", "l5"]),
  }),
]);

const INTERNAL_TO_MACRO = Object.freeze(
  TRUST_MACRO_STAGES.reduce((mapping, stage) => {
    stage.internalStageIds.forEach((internalStageId) => {
      mapping[internalStageId] = stage.id;
    });
    return mapping;
  }, {}),
);

const COMPLETE_STATES = new Set(["COMPLETED", "COMPLETE", "DONE", "SUCCESS"]);
const RUNNING_STATES = new Set(["QUEUED", "RUNNING", "IN_PROGRESS", "PROCESSING"]);
const PARTIAL_STATES = new Set(["PARTIAL", "DEGRADED"]);
const FAILED_STATES = new Set(["FAILED", "BLOCKED", "ERROR"]);

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function boundedText(value, maxLength = 600) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength) : "";
}

function uniqueText(values, max = 6) {
  return values
    .map((value) => boundedText(value))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, max);
}

function safeIdentifier(value) {
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 160);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function bindingFrom(value) {
  const source = asRecord(value);
  const binding = {
    requestId: safeIdentifier(source.requestId),
    runId: safeIdentifier(source.runId),
    caseId: safeIdentifier(source.caseId),
    caseRevision: Number.isInteger(source.caseRevision) ? source.caseRevision : null,
  };
  return Object.values(binding).some((item) => item !== null) ? binding : null;
}

/**
 * Combines binding fragments from the pipeline, canonical result and event
 * envelope. Conflicting identifiers are reported instead of being silently
 * overwritten, so a result cannot hide a stale case or revision.
 */
export function mergeTrustBindings(...values) {
  const binding = {
    requestId: null,
    runId: null,
    caseId: null,
    caseRevision: null,
  };
  let conflict = false;

  for (const value of values) {
    const source = bindingFrom(value);
    if (!source) continue;
    for (const key of Object.keys(binding)) {
      if (source[key] == null) continue;
      if (binding[key] != null && String(binding[key]) !== String(source[key])) conflict = true;
      else if (binding[key] == null) binding[key] = source[key];
    }
  }

  return {
    binding: Object.values(binding).some((item) => item !== null) ? binding : null,
    conflict,
  };
}

/**
 * Returns false when an incoming event belongs to another request, run, case,
 * or revision. Missing identifiers are tolerated for compatibility with old
 * providers, but a present identifier must agree with the active binding.
 */
export function isCurrentTrustBinding(incoming, active) {
  if (!active) return true;
  const incomingBinding = bindingFrom(incoming) || {};
  return ["requestId", "runId", "caseId", "caseRevision"].every((key) => {
    if (active[key] == null || incomingBinding[key] == null) return true;
    return String(active[key]) === String(incomingBinding[key]);
  });
}

function normalizeStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (COMPLETE_STATES.has(normalized)) return "COMPLETE";
  if (RUNNING_STATES.has(normalized)) return normalized === "QUEUED" ? "WAITING" : "RUNNING";
  if (PARTIAL_STATES.has(normalized)) return "PARTIAL";
  if (FAILED_STATES.has(normalized)) return "FAILED";
  return "WAITING";
}

function macroStatus(internalStages, pipelineStatus) {
  const statuses = internalStages.map((stage) => normalizeStatus(stage?.operationStatus));
  if (statuses.some((status) => status === "FAILED")) {
    return statuses.some((status) => status === "COMPLETE" || status === "PARTIAL") ? "PARTIAL" : "FAILED";
  }
  if (statuses.some((status) => status === "PARTIAL")) return "PARTIAL";
  if (statuses.some((status) => status === "RUNNING")) return "RUNNING";
  if (statuses.length && statuses.every((status) => status === "COMPLETE")) return "COMPLETE";
  if (["FAILED", "ERROR"].includes(String(pipelineStatus || "").toUpperCase())) return "FAILED";
  if (String(pipelineStatus || "").toUpperCase() === "PARTIAL") return "PARTIAL";
  return "WAITING";
}

function statusLabel(status) {
  switch (status) {
    case "RUNNING": return "RUNNING";
    case "COMPLETE": return "COMPLETE";
    case "PARTIAL": return "PARTIAL";
    case "FAILED": return "FAILED";
    default: return "WAITING";
  }
}

function rawStageMap(pipeline) {
  const stages = asRecord(pipeline?.stages);
  const result = STAGE_IDS.reduce((current, stageId) => {
    current[stageId] = stages[stageId] || null;
    return current;
  }, {});
  result.l2 = stages.l2 || null;
  return result;
}

function extractList(...values) {
  return uniqueText(values.flatMap((value) => Array.isArray(value) ? value : value == null ? [] : [value]));
}

function extractDecision(canonicalResult, pipeline) {
  const canonical = asRecord(canonicalResult);
  const candidates = [
    pipeline?.finalPredict?.decision,
    pipeline?.finalPredict?.result,
    pipeline?.finalPredict,
    canonical.finalPredict?.decision,
    canonical.finalPredict?.result,
    canonical.finalPredict,
    pipeline?.finalDecision,
    canonical.finalDecision,
    canonical.decision,
  ];
  return candidates.map(asRecord).find(hasPublishedDecision) || {};
}

function scoreLabel(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return boundedText(value, 80) || null;
  const normalized = number > 1 ? number / 100 : number;
  const clamped = Math.max(0, Math.min(1, normalized));
  return clamped >= 0.8 ? "CAO" : clamped >= 0.55 ? "TRUNG BÌNH" : "THẤP";
}

function decisionLabel(decision) {
  const epistemicState = String(decision?.epistemicState || "").toUpperCase();
  const security = String(decision?.security || "").toUpperCase();
  const truthVerdict = String(decision?.truthVerdict || decision?.verdict || decision?.truthStatus || "").toUpperCase();
  const labels = {
    DANGEROUS: "Nguy hiểm · Không nên tiếp tục",
    MALICIOUS: "Nguy hiểm · Đã chặn",
    HIGH_RISK: "Rủi ro cao · Cần thận trọng",
    SUSPICIOUS: "Đáng ngờ · Cần đối soát",
    DISPUTED: "Đang tranh chấp · Chưa thể kết luận",
    CONFLICTING_EVIDENCE: "Các nguồn xung đột · Chưa an toàn",
    SUPPORTED: "Có cơ sở hỗ trợ · Không đồng nghĩa an toàn",
    CONTRADICTED: "Bằng chứng hiện có phản bác nội dung",
    INSUFFICIENT: "Chưa đủ bằng chứng",
    INSUFFICIENT_EVIDENCE: "Chưa đủ bằng chứng",
    UNKNOWN: "Chưa thể kết luận",
    SAFE: "An toàn · Đã xác minh target",
    NO_KNOWN_THREAT: "Chưa thấy mối đe dọa đã biết",
    NOT_APPLICABLE: "Không áp dụng",
  };
  return labels[epistemicState] || labels[security] || labels[truthVerdict] || "Chưa công bố";
}

function hasPublishedDecision(decision) {
  const fields = [
    "verdict",
    "truthVerdict",
    "truthStatus",
    "epistemicState",
    "classification",
    "label",
    "conclusion",
    "security",
    "risk",
    "action",
    "recommendedAction",
  ];
  return fields.some((field) => {
    const value = decision?.[field];
    return (typeof value === "string" && value.trim().length > 0)
      || (typeof value === "number" && Number.isFinite(value));
  });
}

function evidenceSufficiency(canonicalResult, layers, decision) {
  const canonical = asRecord(canonicalResult);
  const layer3 = asRecord(layers?.layer3);
  const metrics = asRecord(canonical.metrics);
  const raw = metrics.evidenceCoverage
    ?? metrics.evidenceCompleteness
    ?? layer3.verificationCompleteness
    ?? layer3.evidenceCompleteness
    ?? decision.evidenceSufficiency;
  if (raw == null || raw === "") return null;
  const number = Number(raw);
  if (!Number.isFinite(number)) return boundedText(raw, 80) || null;
  const normalized = number > 1 ? number / 100 : number;
  return normalized >= 0.75 ? "MẠNH" : normalized >= 0.4 ? "MỘT PHẦN" : "HẠN CHẾ";
}

export function createTrustPresentationModel({
  pipeline = null,
  canonicalResult = null,
  layers = {},
  processing = false,
  activeBinding = null,
} = {}) {
  const stageMap = rawStageMap(pipeline);
  const mergedBindings = mergeTrustBindings(pipeline, canonicalResult);
  const binding = mergedBindings.binding;
  const stale = Boolean(mergedBindings.conflict || (activeBinding && binding && !isCurrentTrustBinding(binding, activeBinding)));
  const macroStages = TRUST_MACRO_STAGES.map((definition) => {
    const internalStages = definition.internalStageIds.map((stageId) => stageMap[stageId]).filter(Boolean);
    const internalStatus = macroStatus(internalStages, pipeline?.pipelineStatus);
    const publicStatus = normalizeStatus(stageMap[definition.publicStageId]?.operationStatus);
    const status = stale ? "WAITING" : internalStatus === "WAITING" && publicStatus !== "WAITING" ? publicStatus : internalStatus;
    return {
      ...definition,
      status,
      statusLabel: statusLabel(status),
      internalStageIds: [...definition.internalStageIds],
    };
  });

  const decision = stale ? {} : extractDecision(canonicalResult, pipeline);
  const canonical = asRecord(canonicalResult);
  const layer4 = asRecord(layers.layer4);
  const finalDecision = decision;
  const finalDecisionPublished = hasPublishedDecision(finalDecision);
  const reasons = extractList(
    finalDecision.reasons,
    finalDecision.explanation,
    finalDecision.rationale,
    layer4.userExplanation?.why,
    layer4.userExplanation?.riskSummary,
    canonical.reasons,
  );
  const canonicalEvidence = asRecord(canonical.evidence);
  const evidence = Array.isArray(canonical.evidence)
    ? canonical.evidence
      : Array.isArray(canonicalEvidence.items)
        ? canonicalEvidence.items
        : Array.isArray(canonical.evidenceItems)
          ? canonical.evidenceItems
          : Array.isArray(pipeline?.evidence?.items)
            ? pipeline.evidence.items
            : Array.isArray(layers.layer3?.evidence)
              ? layers.layer3.evidence
              : Array.isArray(layers.layer3?.evidenceItems) ? layers.layer3.evidenceItems : [];
  const sources = Array.isArray(canonical.sources)
    ? canonical.sources
    : Array.isArray(canonicalEvidence.sources)
      ? canonicalEvidence.sources
      : Array.isArray(pipeline?.sources)
        ? pipeline.sources
        : Array.isArray(pipeline?.evidence?.sources)
          ? pipeline.evidence.sources
          : Array.isArray(layers.layer3?.sources)
            ? layers.layer3.sources
            : Array.isArray(layers.layer3?.verifiedSources) ? layers.layer3.verifiedSources : [];
  const counterEvidence = extractList(
    canonical.counterEvidence,
    canonical.contradictions,
    finalDecision.counterEvidence,
    finalDecision.conflicts,
    layers.layer3?.contradictions,
  );
  const review = asRecord(canonical.humanReview || finalDecision.humanReview || layer4.humanReview);
  const confidenceValue = canonical.metrics?.confidence ?? finalDecision.confidence ?? layer4.decisionConfidence ?? layer4.confidence;

  return {
    stale,
    binding,
    pipelineStatus: stale ? "WAITING" : String(pipeline?.pipelineStatus || (processing ? "RUNNING" : "IDLE")).toUpperCase(),
    macroStages,
    technicalStages: STAGE_IDS.map((stageId) => ({
      id: stageId,
      operationStatus: stageMap[stageId]?.operationStatus || "NOT_STARTED",
      finding: stageMap[stageId]?.finding || null,
    })),
    finalDecision,
    finalDecisionPublished,
    finalPredictStatus: finalDecisionPublished ? "PUBLISHED" : "LOCKED",
    finalDecisionLabel: decisionLabel(finalDecision),
    confidence: scoreLabel(confidenceValue),
    evidenceSufficiency: evidenceSufficiency(canonicalResult, layers, finalDecision),
    reasons,
    evidence,
    sources,
    counterEvidence,
    humanReview: Object.keys(review).length ? review : null,
    recommendedAction: boundedText(
      finalDecision.recommendedAction || canonical.recommendedAction || layer4.userExplanation?.recommendedActionNote,
      800,
    ) || null,
  };
}

export function isTrustPresentationEventCurrent(event, activeBinding) {
  if (STALE_RUN_EVENT_RENDER !== 0) return true;
  const nested = event?.data && typeof event.data === "object" ? event.data : null;
  const merged = mergeTrustBindings(nested, event);
  return !merged.conflict && isCurrentTrustBinding(merged.binding, activeBinding);
}

export { INTERNAL_TO_MACRO };
