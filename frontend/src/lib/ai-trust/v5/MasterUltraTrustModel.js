import { TRUST_MACRO_STAGES } from "./TrustPresentationModel.js";

/**
 * Public presentation state names. The seven internal V5 stages remain an
 * implementation detail; the product exposes four analysis layers and a
 * separately gated Final Predict result.
 */
export const MASTER_ULTRA_STATES = Object.freeze([
  "IDLE",
  "INPUT_READY",
  "SUBMITTING",
  "L1_READY",
  "L1_ENTER",
  "L1_RUNNING",
  "L1_COMPLETE",
  "TRANSITION_1_2",
  "L2_ENTER",
  "L2_RUNNING",
  "L2_COMPLETE",
  "TRANSITION_2_3",
  "L3_ENTER",
  "L3_RUNNING",
  "L3_COMPLETE",
  "TRANSITION_3_4",
  "L4_ENTER",
  "L4_RUNNING",
  "L4_COMPLETE",
  "FINAL_PREDICT_LOCKED",
  "FINAL_PREDICT_PUBLISHED",
  "COMPLETE_OVERVIEW",
  "INSPECT_LAYER",
  "ERROR_RECOVERABLE",
  "ERROR_FATAL",
]);

export const MASTER_ULTRA_LAYERS = Object.freeze([
  Object.freeze({
    id: "l1",
    presentationId: "deterministic-screen",
    code: "01",
    shortName: "Screen",
    name: "Deterministic Screen",
    question: "What can be established deterministically from this input?",
    questionVi: "Đầu vào này cho phép xác lập điều gì bằng kiểm tra tất định?",
    internalStageIds: Object.freeze(["l1"]),
    tone: "ice",
  }),
  Object.freeze({
    id: "l2",
    presentationId: "threat-semantic-intelligence",
    code: "02",
    shortName: "Intelligence",
    name: "Threat & Semantic Intelligence",
    question: "What risks, claims, and meanings need to be examined?",
    questionVi: "Rủi ro, mệnh đề và ngữ nghĩa nào cần được xem xét?",
    internalStageIds: Object.freeze(["l2a", "l2b", "l2c"]),
    tone: "cyan",
  }),
  Object.freeze({
    id: "l3",
    presentationId: "evidence-retrieval",
    code: "03",
    shortName: "Retrieval",
    name: "Evidence Retrieval",
    question: "Which sources and evidence items were actually retrieved?",
    questionVi: "Nguồn và evidence nào thực sự đã được truy xuất?",
    internalStageIds: Object.freeze(["l3"]),
    tone: "tension",
  }),
  Object.freeze({
    id: "l4",
    presentationId: "synthesis-reasoning",
    code: "04",
    shortName: "Synthesis",
    name: "Synthesis & Reasoning",
    question: "How do the evidence and policy support a conclusion?",
    questionVi: "Evidence và policy hiện có nâng đỡ kết luận nào?",
    internalStageIds: Object.freeze(["l4", "l5"]),
    tone: "violet",
  }),
]);

const COMPLETE_STATES = new Set(["COMPLETED", "COMPLETE", "DONE", "SUCCESS"]);

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function text(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 900);
}

function unique(values, limit = 12) {
  return values
    .flatMap((value) => Array.isArray(value) ? value : value == null ? [] : [value])
    .map((value) => typeof value === "string" ? text(value) : text(value?.details || value?.label || value?.text || value?.summary))
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, limit);
}

function stageMap(pipeline) {
  return record(pipeline?.stages);
}

function macroStageIds(id, pipeline) {
  const stages = stageMap(pipeline);
  const internalStageIds = MASTER_ULTRA_LAYERS.find((layer) => layer.id === id)?.internalStageIds || [];
  if (id === "l2" && stages.l2 && !stages.l2a && !stages.l2b && !stages.l2c) return ["l2"];
  if (id === "l4" && stages.l4 && !stages.l5) return ["l4"];
  return internalStageIds;
}

function stageStatus(stage) {
  const value = String(stage?.operationStatus || "NOT_STARTED").toUpperCase();
  if (COMPLETE_STATES.has(value)) return "COMPLETE";
  if (["RUNNING", "QUEUED", "IN_PROGRESS", "PROCESSING"].includes(value)) return "RUNNING";
  if (["PARTIAL", "DEGRADED"].includes(value)) return "PARTIAL";
  if (["FAILED", "BLOCKED", "ERROR"].includes(value)) return "FAILED";
  return "WAITING";
}

function macroStatus(id, presentation, pipeline) {
  const definition = MASTER_ULTRA_LAYERS.find((layer) => layer.id === id);
  const presented = presentation?.macroStages?.find((stage) => stage.id === definition?.presentationId);
  const stages = stageMap(pipeline);
  const statuses = macroStageIds(id, pipeline).map((stageId) => stageStatus(stages[stageId]));
  if (presented?.status && presented.status !== "WAITING") return presented.status;
  if (statuses.includes("FAILED")) return statuses.includes("COMPLETE") ? "PARTIAL" : "FAILED";
  if (statuses.includes("PARTIAL")) return "PARTIAL";
  if (statuses.includes("RUNNING")) return "RUNNING";
  if (statuses.length && statuses.every((value) => value === "COMPLETE")) return "COMPLETE";
  return "WAITING";
}

function layerPayloadPublished(id, { layers, pipeline, sources, evidenceItems, claims }) {
  const stages = stageMap(pipeline);
  if (macroStageIds(id, pipeline).some((stageId) => stageStatus(stages[stageId]) !== "WAITING")) return true;
  if (id === "l2") return claims.length > 0 || Boolean(layers.layer2?.summary);
  if (id === "l3") return sources.length > 0 || evidenceItems.length > 0 || Boolean(layers.layer3?.summary);
  if (id === "l4") return Boolean(layers.layer4?.summary || layers.layer4?.aiVerification || layers.layer4?.reasoning || layers.layer4?.truthStatus);
  return false;
}

function firstText(...values) {
  for (const value of values) {
    const candidate = text(value);
    if (candidate) return candidate;
  }
  return null;
}

function rawClaims({ layers, canonicalResult, pipeline }) {
  const canonical = record(canonicalResult);
  const pipelineClaims = list(pipeline?.claims).length ? pipeline.claims : list(pipeline?.layers?.claims);
  const layerClaims = list(layers?.layer2?.claims).length ? layers.layer2.claims : list(layers?.layer2?.claimCandidates);
  const canonicalClaims = list(canonical.claims);
  return [...layerClaims, ...canonicalClaims, ...pipelineClaims]
    .map((value, index) => {
      const item = typeof value === "string" ? { text: value } : record(value);
      const statement = firstText(item.text, item.claim, item.statement, item.label);
      if (!statement) return null;
      return {
        id: text(item.id || item.claimId, `claim-${index + 1}`),
        text: statement,
        status: text(item.status || item.relationship || item.relation, "UNKNOWN").toUpperCase(),
        type: text(item.type || item.claimType, null),
      };
    })
    .filter(Boolean)
    .filter((claim, index, all) => all.findIndex((item) => item.id === claim.id || item.text === claim.text) === index)
    .slice(0, 16);
}

function rawSources({ layers, canonicalResult, pipeline }) {
  const canonical = record(canonicalResult);
  const evidence = record(canonical.evidence);
  const layer3 = record(layers?.layer3);
  const pipelineEvidence = record(pipeline?.evidence);
  const values = [
    ...list(canonical.sources),
    ...list(evidence.sources),
    ...list(canonical.sourceRecords),
    ...list(pipeline?.sources),
    ...list(pipelineEvidence.sources),
    ...list(layer3.sources),
    ...list(layer3.verifiedSources),
  ];
  return values
    .map((value, index) => {
      const item = typeof value === "string" ? { url: value, title: value } : record(value);
      const url = /^https?:\/\//i.test(text(item.url || item.canonicalUrl)) ? text(item.url || item.canonicalUrl) : null;
      const title = firstText(item.title, item.sourceName, item.publisher, item.domain, url);
      if (!title) return null;
      return {
        id: text(item.sourceId || item.id, url || `source-${index + 1}`),
        title,
        publisher: firstText(item.publisher, item.sourceName, item.provider),
        domain: firstText(item.domain, url ? (() => { try { return new URL(url).hostname; } catch { return null; } })() : null),
        url,
        publishedAt: firstText(item.publishedAt, item.issuedAt, item.date),
        retrievedAt: firstText(item.retrievedAt, item.observedAt),
        sourceType: firstText(item.sourceType, item.type, item.authority, item.status),
        provider: firstText(item.provider, item.providerId),
        language: firstText(item.language, item.locale),
        httpStatus: (item.httpStatus ?? item.statusCode) != null && Number.isFinite(Number(item.httpStatus ?? item.statusCode)) ? Number(item.httpStatus ?? item.statusCode) : null,
        independenceGroup: firstText(item.independenceGroup, item.independenceGroupId, item.clusterId, item.groupId),
        usedBy: list(item.usedBy || item.usedByLayers || item.layersUsed).map((value) => text(value)).filter(Boolean).slice(0, 8),
        snippet: firstText(item.summary, item.description),
        contentHash: firstText(item.contentHash, item.contentDigest, item.sha256),
      };
    })
    .filter(Boolean)
    .filter((source, index, all) => all.findIndex((item) => item.id === source.id || (item.url && item.url === source.url)) === index);
}

function rawEvidenceItems({ layers, canonicalResult, pipeline }) {
  const canonical = record(canonicalResult);
  const canonicalEvidence = record(canonical.evidence);
  const layer3 = record(layers?.layer3);
  const pipelineEvidence = record(pipeline?.evidence);
  const values = [
    ...(Array.isArray(canonical.evidence) ? canonical.evidence : []),
    ...list(canonicalEvidence.items),
    ...list(canonical.evidenceItems),
    ...(Array.isArray(pipelineEvidence) ? pipelineEvidence : []),
    ...list(pipelineEvidence.items),
    ...list(layer3.evidence),
    ...list(layer3.evidenceItems),
  ];

  return values
    .map((value, index) => {
      const item = record(value);
      const embeddedSource = record(item.source);
      const id = firstText(item.evidenceId, item.id, item.idempotencyKey);
      const sourceId = firstText(item.sourceId, embeddedSource.sourceId, embeddedSource.id);
      const excerpt = firstText(item.excerpt, item.quote, item.text, item.snippet, item.summary);
      if (!id && !sourceId && !excerpt) return null;
      return {
        id: id || `evidence-${index + 1}`,
        sourceId,
        claimIds: list(item.claimIds || (item.claimId ? [item.claimId] : [])).map((claimId) => text(claimId)).filter(Boolean).slice(0, 20),
        type: firstText(item.type, item.evidenceType, item.kind),
        relationship: firstText(item.relationship, item.relation, item.claimRelation, item.classification)?.toLowerCase() || null,
        temporalRelevance: firstText(item.temporalRelevance, item.temporalStatus, item.freshness),
        provider: firstText(item.provider, item.providerId),
        excerpt,
        locator: firstText(item.locator, item.sourceSpan, item.page, item.timestamp),
        observedAt: firstText(item.observedAt, item.retrievedAt),
        contentHash: firstText(item.contentHash, item.contentDigest, item.sha256),
      };
    })
    .filter(Boolean)
    .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
}

function sourceRelationship(source) {
  const value = source.relationship.toUpperCase();
  if (value.includes("CONTRAD") || value.includes("REFUTE") || value.includes("DISPROVE")) return "contradicting";
  if (value.includes("SUPPORT") || value.includes("CORROBOR")) return "supporting";
  return "context";
}

function evidenceBuckets(evidenceItems, canonicalResult, layers, pipeline) {
  const canonical = record(canonicalResult);
  const evidence = record(canonical.evidence);
  const layer3 = record(layers?.layer3);
  const pipelineEvidence = record(pipeline?.evidence);
  const relationships = [
    ...list(evidence.relationships),
    ...list(canonical.relationships),
    ...list(layer3.relationships),
    ...list(pipelineEvidence.relationships),
  ];
  const relationById = new Map(relationships.flatMap((item) => {
    const value = record(item);
    const relation = text(value.relationship || value.relation || value.type, "context").toLowerCase();
    return [value.evidenceId, value.id, value.sourceId].filter(Boolean).map((key) => [text(key), relation]);
  }).filter(([key]) => key));
  const normalized = evidenceItems.map((item) => ({
    ...item,
    relationship: relationById.get(item.id) || relationById.get(item.sourceId) || item.relationship || "context",
  }));
  const supporting = normalized.filter((source) => sourceRelationship(source) === "supporting");
  const contradicting = normalized.filter((source) => sourceRelationship(source) === "contradicting");
  const context = normalized.filter((source) => !supporting.includes(source) && !contradicting.includes(source));
  return { supporting, contradicting, context, relationships };
}

function independenceGroups({ canonicalResult, layers, pipeline, sources }) {
  const canonical = record(canonicalResult);
  const evidence = record(canonical.evidence);
  const layer3 = record(layers?.layer3);
  const pipelineEvidence = record(pipeline?.evidence);
  const groups = [
    ...list(evidence.independenceGroups),
    ...list(canonical.independenceGroups),
    ...list(layer3.independenceGroups),
    ...list(pipelineEvidence.independenceGroups),
  ];
  if (groups.length) return groups.slice(0, 20).map((item, index) => {
    const value = record(item);
    return {
      id: text(value.id || value.groupId, `group-${index + 1}`),
      label: firstText(value.label, value.origin, value.rootSource, `Group ${index + 1}`),
      memberCount: Number.isFinite(Number(value.memberCount)) ? Number(value.memberCount) : Array.isArray(value.members) ? value.members.length : null,
      independentWeight: Number.isFinite(Number(value.effectiveIndependentWeight)) ? Number(value.effectiveIndependentWeight) : null,
    };
  });
  const grouped = new Map();
  sources.forEach((source) => {
    if (!source.independenceGroup) return;
    const current = grouped.get(source.independenceGroup) || { id: source.independenceGroup, label: source.independenceGroup, memberCount: 0, independentWeight: null };
    current.memberCount += 1;
    grouped.set(source.independenceGroup, current);
  });
  return [...grouped.values()];
}

function providerRecords({ layers, canonicalResult, pipeline }) {
  const canonical = record(canonicalResult);
  const layer2A = record(layers?.layer2A);
  const layer3 = record(layers?.layer3);
  const layer4 = record(layers?.layer4);
  const stage4 = record(stageMap(pipeline).l4);
  const aiVerification = record(layer4.aiVerification || canonical.aiVerification || stage4.rawMetadata?.aiVerification);
  const candidates = [
    ...list(layer3.providerResults),
    ...list(canonical.providerObservations),
    ...list(layer4.providerResults),
    layer2A.provider || layer2A.providerId ? layer2A : null,
    stage4.providerId || stage4.modelId ? stage4 : null,
    Object.keys(aiVerification).length ? aiVerification : null,
  ];
  return candidates
    .map((item) => {
      const value = record(item);
      const provider = firstText(value.provider, value.providerId, value.modelProvider, value.modelId);
      if (!provider) return null;
      return {
        provider,
        model: firstText(value.model, value.modelId, value.modelVersion),
        status: text(value.status || value.providerStatus || value.operationStatus, "UNKNOWN").toUpperCase(),
        signals: unique([value.signals, value.finding, value.reason, value.message], 8),
        latencyMs: Number.isFinite(Number(value.latencyMs)) ? Number(value.latencyMs) : null,
      };
    })
    .filter(Boolean)
    .filter((item, index, all) => all.findIndex((entry) => entry.provider === item.provider && entry.model === item.model) === index)
    .slice(0, 20);
}

function streams({ layers, canonicalResult, pipeline, providers }) {
  const canonical = record(canonicalResult);
  const layer4 = record(layers?.layer4);
  const sources = [
    ...list(canonical.analysisStreams),
    ...list(canonical.modelObservations),
    ...list(canonical.analyses),
    ...list(layer4.analysisStreams),
    ...list(layer4.analyses),
    ...list(record(pipeline?.analysis).streams),
  ];
  const normalized = sources.map((item, index) => {
    const value = record(item);
    return {
      id: text(value.id || value.streamId, `analysis-${index + 1}`),
      label: firstText(value.label, value.name, value.role, `Analysis ${index + 1}`),
      provider: firstText(value.provider, value.providerId, value.modelProvider),
      model: firstText(value.model, value.modelId, value.modelVersion),
      status: text(value.status || value.executionStatus, "OBSERVED").toUpperCase(),
      summary: firstText(value.summary, value.rationale, value.reasoning),
    };
  }).filter((item) => item.provider || item.model || item.summary);
  if (normalized.length) return normalized.slice(0, 8);
  return providers.filter((item) => item.model || item.provider).slice(0, 8).map((item, index) => ({
    id: `provider-analysis-${index + 1}`,
    label: `Provider signal ${index + 1}`,
    provider: item.provider,
    model: item.model,
    status: item.status,
    summary: item.signals[0] || null,
  }));
}

function decisionRecord({ canonicalResult, pipeline, presentation }) {
  const canonical = record(canonicalResult);
  const candidates = [
    presentation?.finalDecisionPublished ? presentation.finalDecision : null,
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
  return candidates.map(record).find(hasPublishedDecision) || {};
}

function hasPublishedDecision(decision) {
  return [
    "verdict", "truthVerdict", "truthStatus", "epistemicState", "classification", "label",
    "conclusion", "security", "risk", "recommendedAction", "action",
  ].some((key) => {
    const value = decision?.[key];
    return (typeof value === "string" && value.trim().length > 0)
      || (typeof value === "number" && Number.isFinite(value));
  });
}

function humanReview({ canonicalResult, pipeline, layers, presentation }) {
  const canonical = record(canonicalResult);
  const decision = decisionRecord({ canonicalResult, pipeline, presentation });
  const review = record(canonical.humanReview || decision.humanReview || layers?.layer4?.humanReview || presentation?.humanReview);
  return Object.keys(review).length ? review : null;
}

function inputEnvelope({ input, pipeline, canonicalResult }) {
  const canonical = record(canonicalResult);
  const value = record(input || pipeline?.input || canonical.input);
  return {
    type: firstText(value.type, value.inputType, value.kind),
    excerpt: firstText(value.content, value.text, value.label),
  };
}

function layerSummary(id, { layers, pipeline, presentation }) {
  const stages = stageMap(pipeline);
  const raw = macroStageIds(id, pipeline).map((stageId) => stages[stageId]).find((stage) => text(stage?.summary) || text(stage?.finding));
  const layerData = id === "l1" ? layers?.layer1 : id === "l2" ? layers?.layer2 : id === "l3" ? layers?.layer3 : layers?.layer4;
  return {
    status: macroStatus(id, presentation, pipeline),
    summary: firstText(layerData?.summary, layerData?.userExplanation?.why, raw?.summary, raw?.finding, "Chưa có dữ liệu công bố."),
  };
}

/**
 * Normalize the engine response once. Rendering code consumes this DTO and
 * never needs to know whether a value came from V5, a compatibility response,
 * or an optional Sequential adapter signal.
 */
export function normalizeMasterUltraRun({
  pipeline = null,
  canonicalResult = null,
  layers = {},
  presentation = null,
  input = null,
  sourceProvenance = null,
  providers = [],
  processing = false,
} = {}) {
  const canonical = record(canonicalResult);
  const stages = stageMap(pipeline);
  const claims = rawClaims({ layers, canonicalResult, pipeline });
  const sources = rawSources({ layers, canonicalResult, pipeline });
  const evidenceItems = rawEvidenceItems({ layers, canonicalResult, pipeline });
  const buckets = evidenceBuckets(evidenceItems, canonicalResult, layers, pipeline);
  const groups = independenceGroups({ canonicalResult, layers, pipeline, sources });
  const resolvedProviders = providers.length ? providers : providerRecords({ layers, canonicalResult, pipeline });
  const analysisStreams = streams({ layers, canonicalResult, pipeline, providers: resolvedProviders });
  const decision = decisionRecord({ canonicalResult, pipeline, layers, presentation });
  const review = humanReview({ canonicalResult, pipeline, layers, presentation });
  const inputData = inputEnvelope({ input, pipeline, canonicalResult });
  const inputType = String(inputData.type || "").toLowerCase();
  const uncertainty = unique([
    canonical.uncertainty,
    canonical.unknowns,
    decision.uncertainty,
    decision.unknowns,
    layers.layer3?.uncertainty,
    layers.layer3?.unknowns,
    layers.layer4?.uncertainty,
    layers.layer4?.unknowns,
  ], 10);
  const sourceAgreement = firstText(
    canonical.metrics?.sourceAgreement,
    layers.layer3?.sourceAgreement,
    layers.layer3?.crossSourceAgreement?.agreementScore,
  );
  const confidence = presentation?.confidence || firstText(canonical.metrics?.confidence, decision.confidence, layers.layer4?.confidence);
  const evidenceSufficiency = presentation?.evidenceSufficiency || firstText(canonical.metrics?.evidenceCoverage, decision.evidenceSufficiency, layers.layer3?.evidenceCompleteness);
  const sequentialSignals = [
    record(layers.layer4?.legacyIntegration),
    record(canonical.sequentialSignal),
    record(canonical.sequential),
  ].filter((value) => Object.keys(value).length).map((value) => ({
    provider: firstText(value.provider, value.providerId, value.sourceOrigin),
    verdict: firstText(value.rawVerdict, value.verdict, value.status),
    reasoning: firstText(value.reason, value.rationale, value.summary),
    sources: list(value.sources),
    status: text(value.status || value.providerStatus, "OBSERVED").toUpperCase(),
  }));
  const decisionTwin = canonical.decisionTwin || pipeline?.decisionTwin || decision.decisionTwin || null;
  const finalPredictPublished = hasPublishedDecision(decision);
  const evidenceReported = Array.isArray(canonical.evidence)
    || Array.isArray(canonical.evidence?.items)
    || Array.isArray(pipeline?.evidence?.items)
    || Array.isArray(layers.layer3?.evidence)
    || Array.isArray(layers.layer3?.evidenceItems)
    || stageStatus(stages.l3) !== "WAITING";
  const sourcesReported = Array.isArray(canonical.sources)
    || Array.isArray(canonical.evidence?.sources)
    || Array.isArray(pipeline?.sources)
    || Array.isArray(pipeline?.evidence?.sources)
    || Array.isArray(layers.layer3?.sources)
    || Array.isArray(layers.layer3?.verifiedSources)
    || stageStatus(stages.l3) !== "WAITING";
  const layerData = {
    l1: {
      ...layerSummary("l1", { layers, pipeline, presentation, processing }),
      inputType,
      inputExcerpt: inputData.excerpt,
      technicalSignals: unique([stages.l1?.signals, layers.layer1?.signals, layers.layer1?.reasons], 10),
      screenResult: stages.l1?.finding === "LOCAL_BLOCK" ? "BLOCK" : stages.l1?.finding === "LOCAL_SUSPICIOUS" ? "REVIEW" : stages.l1?.finding === "LOCAL_CLEAR" ? "PASS" : "NOT_ASSESSED",
      risk: stages.l1?.severity || layers.layer1?.riskLevel || "UNKNOWN",
      confidence: stages.l1?.confidence ?? layers.layer1?.confidence ?? null,
      qrDetected: layers.layer1?.qrDetected === true || Boolean(layers.layer1?.metadata?.qrContent || stages.l1?.signals?.some((s) => /QR_DETECTED/i.test(s.code || s.details || "")))
        ? true
        : layers.layer1?.qrDetected === false || layers.layer1?.metadata?.qrScanCompleted === true
          ? false
          : null,
      ocrStatus: inputType === "image" || inputType === "qr"
        ? (layers.layer1?.ocrStatus || (layers.layer1?.metadata?.ocrText ? "SUCCESS" : "NOT_REPORTED"))
        : "NOT_APPLICABLE",
      detectedUrls: [...list(layers.layer1?.detectedUrls), layers.layer1?.metadata?.url].filter((value) => typeof value === "string" && value.trim()),
      mediaArtifact: layers.layer1?.metadata?.mediaArtifactId || layers.layer1?.mediaArtifactId || null,
      imageType: layers.layer1?.metadata?.imageType || null,
      dimensions: layers.layer1?.metadata?.width && layers.layer1?.metadata?.height ? `${layers.layer1.metadata.width} × ${layers.layer1.metadata.height}` : null,
      ocrPreview: layers.layer1?.metadata?.ocrText || null,
      qrCount: Number.isFinite(layers.layer1?.metadata?.qrCount)
        ? layers.layer1.metadata.qrCount
        : layers.layer1?.metadata?.qrContent
          ? 1
          : Array.isArray(layers.layer1?.metadata?.qrCodes)
            ? layers.layer1.metadata.qrCodes.length
            : layers.layer1?.metadata?.qrScanCompleted === true ? 0 : null,
      visibleUrls: list(layers.layer1?.metadata?.visibleUrls || []),
      qrDetails: layers.layer1?.metadata?.qrIntake || null,
      nextStage: "Threat & Semantic Intelligence",
      metricLabel: stages.l1?.operationStatus ? `${stageStatus(stages.l1)} · deterministic checks` : null,
    },
    l2: {
      ...layerSummary("l2", { layers, pipeline, presentation, processing }),
      claims,
      canonicalClaim: claims[0]?.text || null,
      entities: list(layers.layer2?.entities || layers.layer1?.entities || pipeline?.entities).slice(0, 24),
      groups,
      threatIntelligence: {
        provider: layers.layer2A?.provider || stages.l2a?.providerId || null,
        status: layers.layer2A?.finding || stages.l2a?.finding || (inputType === "url" ? "NOT_CHECKED" : "NOT_APPLICABLE"),
        confidence: typeof layers.layer2A?.providerConfidence === "number" ? `${Math.round(layers.layer2A.providerConfidence * 100)}%` : "Not provided",
        reason: layers.layer2A?.message || layers.layer2A?.reason || stages.l2a?.summary || (inputType === "url" ? "Chưa có kết quả threat-intelligence được ghi nhận." : "Threat intelligence không áp dụng cho nội dung phi URL."),
        threatCategories: list(layers.layer2A?.threatTypes || stages.l2a?.rawMetadata?.threatTypes),
      },
      semanticIntelligence: {
        urgency: layers.layer2?.urgency || (stages.l2b?.finding === "MANIPULATION_DETECTED" ? "HIGH" : "NOT_ASSESSED"),
        impersonation: layers.layer2?.impersonation === true || stages.l2b?.finding === "IMPERSONATION_INDICATOR"
          ? "YES"
          : layers.layer2?.impersonation === false
            ? "NO"
            : "NOT_ASSESSED",
        manipulationSignals: list(stages.l2b?.signals?.map((s) => s.details || s.code) || layers.layer2?.signals),
        intent: layers.layer2?.intent || stages.l2b?.finding?.replaceAll("_", " ") || "NOT_CLASSIFIED",
        entities: list(layers.layer2?.entities || layers.layer1?.entities).slice(0, 10),
        suspiciousLanguage: list(layers.layer2?.suspiciousPhrases || []),
      },
      studentDomainRisk: {
        matchedPattern: layers.layer2C?.classification || stages.l2c?.finding || "NOT_ASSESSED",
        domainRisk: layers.layer2C?.severity || (stages.l2c?.severity === "CRITICAL" || stages.l2c?.severity === "HIGH" ? "HIGH" : stages.l2c?.severity === "MEDIUM" ? "MEDIUM" : stages.l2c?.severity === "LOW" ? "LOW" : "UNKNOWN"),
        reason: layers.layer2C?.explanation || stages.l2c?.summary || "Chưa có đánh giá rủi ro theo miền được ghi nhận.",
        recommendedCaution: layers.layer2C?.recommendedCaution || null,
      },
      mediaForensics: layers.layer2?.mediaForensics || stages.l2b?.rawMetadata?.mediaForensics || null,
      providerSignals: resolvedProviders.filter((item) => ["l2a", "security", "safe", "threat"].some((token) => `${item.provider}`.toLowerCase().includes(token))),
      officialCount: null,
      nextStage: "Evidence Retrieval",
      metricLabel: claims.length ? `${claims.length} claim${claims.length === 1 ? "" : "s"} extracted` : null,
    },
    l3: {
      ...layerSummary("l3", { layers, pipeline, presentation, processing }),
      ...buckets,
      sources,
      evidenceItems,
      retrievalProvider: firstText(
        resolvedProviders.find((provider) => /tavily/i.test(provider.provider))?.provider,
        resolvedProviders.find((provider) => /retriev|search/i.test(provider.provider))?.provider,
      ),
      retrievalStatus: firstText(
        resolvedProviders.find((provider) => /tavily/i.test(provider.provider))?.status,
        stages.l3?.providerStatus,
      ) || "NOT_REPORTED",
      tavilyStatus: resolvedProviders.find((provider) => /tavily/i.test(provider.provider))?.status || "NOT_RUN",
      sourceCount: sourcesReported ? sources.length : null,
      evidenceCount: evidenceReported ? evidenceItems.length : null,
      conflicts: list(record(canonical.evidence).conflicts).length ? record(canonical.evidence).conflicts : list(canonical.conflicts || layers.layer3?.conflicts),
      uncertainty,
      sourceAgreement,
      supportingCount: evidenceReported ? buckets.supporting.length : null,
      contradictingCount: evidenceReported ? buckets.contradicting.length : null,
      contextCount: evidenceReported ? buckets.context.length : null,
      sourceIndependence: firstText(layers.layer3?.sourceIndependence, canonical.metrics?.sourceIndependence),
      freshness: firstText(layers.layer3?.freshness, canonical.metrics?.freshness),
      evidenceStatus: firstText(
        layers.layer3?.evidenceSufficiency,
        layers.layer3?.evidenceStatus,
        stages.l3?.finding === "SUPPORTED" || stages.l3?.finding === "CONTRADICTED" ? "SUFFICIENT" : null,
        stages.l3?.finding === "MIXED" ? "CONFLICTED" : null,
        evidenceItems.length === 0 && stageStatus(stages.l3) === "COMPLETE" ? "INSUFFICIENT_EVIDENCE" : null,
      ) || "NOT_ASSESSED",
      layer3Verdict: stages.l3?.finding || "UNKNOWN",
      deferredNote: "Retrieval records sources and evidence. The final assessment is published separately by Final Predict.",
      nextStage: "Synthesis & Reasoning",
      metricLabel: sources.length || evidenceItems.length ? `${sources.length} source${sources.length === 1 ? "" : "s"} · ${evidenceItems.length} evidence item${evidenceItems.length === 1 ? "" : "s"}` : null,
    },
    l4: {
      ...layerSummary("l4", { layers, pipeline, presentation, processing }),
      streams: analysisStreams,
      providers: resolvedProviders,
      sequentialSignals,
      checklist: {
        research: Boolean(sources.length || canonical.additionalResearch || layers.layer4?.additionalResearch),
        comparison: Boolean(evidenceItems.length || buckets.relationships.length || canonical.evidenceComparison),
        quality: Boolean(sources.some((source) => source.sourceType || source.contentHash) || canonical.sourceQuality),
        verification: Boolean(layers.layer4?.aiVerification || canonical.aiVerification || analysisStreams.length || stageStatus(stages.l4) === "COMPLETE"),
      },
      advisoryResult: layers.layer4?.truthStatus || stages.l4?.rawMetadata?.truthStatus || "Chưa công bố",
      aiVerification: layers.layer4?.aiVerification || canonical.aiVerification || stages.l4?.rawMetadata?.aiVerification || null,
      aiVerificationStatus: layers.layer4?.aiVerificationStatus || canonical.aiVerificationStatus || stages.l4?.rawMetadata?.aiVerificationStatus || "NOT_REQUESTED",
      aiVerificationTransport: layers.layer4?.aiVerificationTransport || stages.l4?.rawMetadata?.aiVerificationTransport || null,
      aiVerificationThinkingLevel: layers.layer4?.aiVerificationThinkingLevel || stages.l4?.rawMetadata?.aiVerificationThinkingLevel || null,
      aiVerificationLatencyMs: layers.layer4?.aiVerificationLatencyMs ?? stages.l4?.rawMetadata?.aiVerificationLatencyMs ?? null,
      aiRequestedPrimaryModel: layers.layer4?.aiRequestedPrimaryModel || stages.l4?.aiRequestedPrimaryModel || null,
      aiExecutedModel: layers.layer4?.aiExecutedModel || stages.l4?.aiExecutedModel || null,
      aiFallbackUsed: layers.layer4?.aiFallbackUsed === true || stages.l4?.aiFallbackUsed === true,
      aiFallbackReason: layers.layer4?.aiFallbackReason || stages.l4?.aiFallbackReason || null,
      aiProviderStatus: layers.layer4?.aiProviderStatus || stages.l4?.aiProviderStatus || null,
      aiOperationStatus: layers.layer4?.aiOperationStatus || stages.l4?.aiOperationStatus || null,
      aiModelTrace: layers.layer4?.aiModelTrace || stages.l4?.aiModelTrace || [],
      aiCooldownResult: layers.layer4?.aiCooldownResult || stages.l4?.aiCooldownResult || null,
      agreement: firstText(canonical.metrics?.evidenceAgreement, layers.layer3?.crossSourceAgreement?.agreementScore, layers.layer3?.evidenceAgreement),
      sourceQuality: firstText(canonical.metrics?.sourceQuality, layers.layer3?.sourceQuality),
      evidenceSufficiency: firstText(layers.layer4?.evidenceSufficiency, decision.evidenceSufficiency),
      reasoningSummary: layers.layer4?.summary || stages.l4?.summary || null,
      citationsUsed: evidenceItems.filter((item) => item.sourceId && sources.some((source) => source.id === item.sourceId)),
      sources,
      evidenceItems,
      supportingCount: evidenceReported ? buckets.supporting.length : null,
      contradictingCount: evidenceReported ? buckets.contradicting.length : null,
      contextCount: evidenceReported ? buckets.context.length : null,
      independentGroupsCount: groups.length || null,
      conflicts: list(record(canonical.evidence).conflicts).length ? record(canonical.evidence).conflicts : list(canonical.conflicts || layers.layer3?.conflicts || layers.layer4?.conflicts),
      uncertainties: uncertainty,
      reasons: list(layers.layer4?.reasons || stages.l4?.rawMetadata?.reasons || stages.l4?.reasons),
      isAdvisory: true,
      advisoryNote: "AI and provider statements are advisory; Final Predict is published separately by the deterministic policy path.",
      operationStatus: macroStatus("l4", presentation, pipeline),
      operations: [
        { id: "research", label: "Additional research", available: Boolean(sources.length || canonical.additionalResearch || layers.layer4?.additionalResearch) },
        { id: "comparison", label: "Evidence comparison", available: Boolean(evidenceItems.length || buckets.relationships.length || canonical.evidenceComparison) },
        { id: "quality", label: "Source quality evaluation", available: Boolean(sources.some((source) => source.sourceType || source.contentHash) || canonical.sourceQuality) },
        { id: "ai", label: "Gemini verification", available: Boolean(layers.layer4?.aiVerification || canonical.aiVerification || analysisStreams.length || stageStatus(stages.l4) === "COMPLETE") },
      ],
      nextStage: "Final Predict · Deterministic",
      metricLabel: layers.layer4?.aiVerificationStatus === "UNAVAILABLE" ? "AI verification unavailable" : analysisStreams.length ? `${analysisStreams.length} analysis stream${analysisStreams.length === 1 ? "" : "s"}` : null,
    },
  };
  const macroStages = MASTER_ULTRA_LAYERS.map((definition) => {
    const source = layerData[definition.id];
    const status = source.status;
    const locked = definition.id !== "l1" && !layerPayloadPublished(definition.id, { layers, pipeline, sources, evidenceItems, claims });
    return {
      ...definition,
      status,
      locked,
      summary: source.summary,
      data: { ...source, status },
    };
  });

  const finalPredict = {
    status: finalPredictPublished ? "PUBLISHED" : "LOCKED",
    authority: "MAIN_TRUST_V5",
    decision: finalPredictPublished ? decision : null,
    verdict: finalPredictPublished
      ? firstText(presentation?.finalDecisionLabel, decision.label, decision.verdict, decision.truthVerdict, decision.truthStatus, decision.epistemicState, decision.security)
      : null,
    confidence: finalPredictPublished ? confidence || null : null,
    evidenceSufficiency: finalPredictPublished ? evidenceSufficiency || null : null,
    sourceAgreement: finalPredictPublished ? sourceAgreement || null : null,
    reasons: finalPredictPublished ? presentation?.reasons || unique([decision.reasons, decision.rationale], 3) : [],
    nextAction: finalPredictPublished ? presentation?.recommendedAction || firstText(decision.recommendedAction, canonical.recommendedAction) : null,
    humanReview: finalPredictPublished ? review : null,
    humanReviewState: finalPredictPublished ? (review ? review.status || review.state || "STATUS_NOT_REPORTED" : "NOT_RECORDED") : "LOCKED",
    keyEvidence: finalPredictPublished ? evidenceItems : [],
    sources: finalPredictPublished ? sources : [],
    securityRisk: finalPredictPublished ? firstText(decision.security, decision.risk) : null,
    contradictions: finalPredictPublished ? presentation?.counterEvidence || unique([decision.counterEvidence, decision.contradictions, decision.conflicts], 8) : [],
    decisionTwin: finalPredictPublished ? decisionTwin : null,
  };

  return {
    schemaVersion: "trust.master-ultra.v1",
    authority: {
      main: "MAIN_TRUST_V5",
      sequential: sequentialSignals.length ? "ADAPTER_SIGNAL" : "NOT_PRESENT",
      finalDecision: "MAIN_TRUST_V5",
    },
    state: processing ? "RUNNING" : pipeline?.pipelineStatus || canonical.pipelineStatus || "IDLE",
    input: inputData,
    provenance: sourceProvenance || null,
    layers: layerData,
    macroStages,
    sources,
    evidence: evidenceItems,
    finalPredict,
    providers: resolvedProviders,
    noRerunOnInspect: true,
  };
}

export function layerDefinition(id) {
  return MASTER_ULTRA_LAYERS.find((layer) => layer.id === id) || MASTER_ULTRA_LAYERS[0];
}

export { TRUST_MACRO_STAGES };
