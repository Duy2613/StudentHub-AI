import { TRUST_MACRO_STAGES } from "./TrustPresentationModel.js";

/**
 * Public presentation state names. The seven internal V5 stages remain an
 * implementation detail; the Master Ultra surface only exposes these five
 * macro layers.
 */
export const MASTER_ULTRA_STATES = Object.freeze([
  "IDLE",
  "INPUT_READY",
  "SUBMITTING",
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
  "TRANSITION_4_5",
  "L5_ENTER",
  "L5_RUNNING",
  "L5_COMPLETE",
  "CONVERGENCE",
  "COMPLETE_OVERVIEW",
  "INSPECT_LAYER",
  "ERROR_RECOVERABLE",
  "ERROR_FATAL",
]);

export const MASTER_ULTRA_LAYERS = Object.freeze([
  Object.freeze({
    id: "l1",
    code: "01",
    shortName: "Claim",
    name: "Claim Intelligence",
    question: "What exactly is being claimed?",
    questionVi: "Điều gì thực sự đang được khẳng định?",
    internalStageIds: Object.freeze(["l1", "l2b"]),
    tone: "ice",
  }),
  Object.freeze({
    id: "l2",
    code: "02",
    shortName: "Discovery",
    name: "Evidence Discovery",
    question: "What evidence exists around this claim?",
    questionVi: "Xung quanh mệnh đề này đang có bằng chứng nào?",
    internalStageIds: Object.freeze(["l2a", "l2c"]),
    tone: "cyan",
  }),
  Object.freeze({
    id: "l3",
    code: "03",
    shortName: "Forensics",
    name: "Evidence Forensics",
    question: "Does the evidence support or contradict the claim?",
    questionVi: "Bằng chứng ủng hộ hay mâu thuẫn với mệnh đề?",
    internalStageIds: Object.freeze(["l3"]),
    tone: "tension",
  }),
  Object.freeze({
    id: "l4",
    code: "04",
    shortName: "AI",
    name: "AI Verification",
    question: "How does Gemini interpret the evidence without owning the decision?",
    questionVi: "Gemini đọc bằng chứng ra sao mà không nắm quyền quyết định?",
    internalStageIds: Object.freeze(["l4"]),
    tone: "violet",
  }),
  Object.freeze({
    id: "l5",
    code: "05",
    shortName: "Decision",
    name: "Decision Intelligence",
    question: "What is the best supported conclusion?",
    questionVi: "Kết luận nào được bằng chứng hiện có nâng đỡ tốt nhất?",
    internalStageIds: Object.freeze(["l5"]),
    tone: "gold",
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

function stageStatus(stage) {
  const value = String(stage?.operationStatus || "NOT_STARTED").toUpperCase();
  if (COMPLETE_STATES.has(value)) return "COMPLETE";
  if (["RUNNING", "QUEUED", "IN_PROGRESS", "PROCESSING"].includes(value)) return "RUNNING";
  if (["PARTIAL", "DEGRADED"].includes(value)) return "PARTIAL";
  if (["FAILED", "BLOCKED", "ERROR"].includes(value)) return "FAILED";
  return "WAITING";
}

function macroStatus(id, presentation, pipeline, processing) {
  const presented = presentation?.macroStages?.find((stage) => stage.id === id);
  const definition = MASTER_ULTRA_LAYERS.find((layer) => layer.id === id);
  const stages = stageMap(pipeline);
  const statuses = definition?.internalStageIds.map((stageId) => stageStatus(stages[stageId])) || [];
  const pipelineIsComplete = ["COMPLETED", "COMPLETE", "SUCCESS"].includes(String(pipeline?.pipelineStatus || "").toUpperCase());
  if (pipelineIsComplete && (pipeline?.finalDecision || pipeline?.decision || pipeline?.layerResults)) return "COMPLETE";
  if (presented?.status && presented.status !== "WAITING") return presented.status;
  if (statuses.includes("FAILED")) return statuses.includes("COMPLETE") ? "PARTIAL" : "FAILED";
  if (statuses.includes("PARTIAL")) return "PARTIAL";
  if (statuses.includes("RUNNING")) return "RUNNING";
  if (statuses.length && statuses.every((value) => value === "COMPLETE")) return "COMPLETE";
  return processing && id === "l1" ? "RUNNING" : "WAITING";
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

function rawEvidence({ layers, canonicalResult, pipeline }) {
  const canonical = record(canonicalResult);
  const evidence = record(canonical.evidence);
  const layer3 = record(layers?.layer3);
  const pipelineEvidence = record(pipeline?.evidence);
  const values = [
    ...list(canonical.evidence),
    ...list(canonical.sources),
    ...list(evidence.items),
    ...list(evidence.sources),
    ...list(pipelineEvidence.items),
    ...list(pipelineEvidence.sources),
    ...list(layer3.evidence),
    ...list(layer3.sources),
    ...list(layer3.verifiedSources),
    ...list(layer3.evidenceItems),
  ];
  return values
    .map((value, index) => {
      const item = typeof value === "string" ? { url: value, title: value } : record(value);
      const url = /^https?:\/\//i.test(text(item.url || item.canonicalUrl)) ? text(item.url || item.canonicalUrl) : null;
      const title = firstText(item.title, item.sourceName, item.publisher, item.domain, url);
      if (!title) return null;
      return {
        id: text(item.id || item.sourceId || item.evidenceId, url || `source-${index + 1}`),
        title,
        publisher: firstText(item.publisher, item.sourceName, item.provider),
        domain: firstText(item.domain, url ? (() => { try { return new URL(url).hostname; } catch { return null; } })() : null),
        url,
        publishedAt: firstText(item.publishedAt, item.issuedAt, item.date),
        retrievedAt: firstText(item.retrievedAt, item.observedAt),
        sourceType: firstText(item.sourceType, item.type, item.authority, item.status),
        independenceGroup: firstText(item.independenceGroup, item.independenceGroupId, item.clusterId, item.groupId),
        relationship: text(item.relationship || item.relation || item.claimRelation, "context").toLowerCase(),
        usedBy: list(item.usedBy || item.usedByLayers || item.layersUsed).map((value) => text(value)).filter(Boolean).slice(0, 8),
        snippet: firstText(item.snippet, item.summary, item.description, item.quality),
        contentHash: firstText(item.contentHash, item.contentDigest, item.sha256),
      };
    })
    .filter(Boolean)
    .filter((source, index, all) => all.findIndex((item) => item.id === source.id || (item.url && item.url === source.url)) === index)
    .slice(0, 30);
}

function sourceRelationship(source) {
  const value = source.relationship.toUpperCase();
  if (value.includes("CONTRAD") || value.includes("REFUTE") || value.includes("DISPROVE")) return "contradicting";
  if (value.includes("SUPPORT") || value.includes("CORROBOR")) return "supporting";
  return "context";
}

function evidenceBuckets(sources, canonicalResult, layers, pipeline) {
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
  const relationById = new Map(relationships.map((item) => {
    const value = record(item);
    return [text(value.sourceId || value.evidenceId || value.id), text(value.relationship || value.relation || value.type, "context").toLowerCase()];
  }).filter(([key]) => key));
  const normalized = sources.map((source) => ({
    ...source,
    relationship: relationById.get(source.id) || source.relationship,
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
      memberCount: Number.isFinite(Number(value.memberCount)) ? Number(value.memberCount) : list(value.members).length || null,
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

function decisionRecord({ canonicalResult, pipeline, layers, presentation }) {
  const canonical = record(canonicalResult);
  const layer4 = record(layers?.layer4);
  return record(presentation?.finalDecision && Object.keys(presentation.finalDecision).length
    ? presentation.finalDecision
    : canonical.decision || pipeline?.finalDecision || layer4.decision);
}

function humanReview({ canonicalResult, pipeline, layers, presentation }) {
  const canonical = record(canonicalResult);
  const decision = decisionRecord({ canonicalResult, pipeline, layers, presentation });
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
  const internal = MASTER_ULTRA_LAYERS.find((layer) => layer.id === id)?.internalStageIds || [];
  const raw = internal.map((stageId) => stages[stageId]).find((stage) => text(stage?.summary) || text(stage?.finding));
  const layerData = id === "l1" ? layers?.layer1 : id === "l2" ? layers?.layer2 : id === "l3" ? layers?.layer3 : id === "l4" ? layers?.layer4 : pipeline?.finalDecision;
  return {
    status: macroStatus(id, presentation, pipeline, false),
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
  const sources = rawEvidence({ layers, canonicalResult, pipeline });
  const buckets = evidenceBuckets(sources, canonicalResult, layers, pipeline);
  const groups = independenceGroups({ canonicalResult, layers, pipeline, sources });
  const resolvedProviders = providers.length ? providers : providerRecords({ layers, canonicalResult, pipeline });
  const analysisStreams = streams({ layers, canonicalResult, pipeline, providers: resolvedProviders });
  const decision = decisionRecord({ canonicalResult, pipeline, layers, presentation });
  const review = humanReview({ canonicalResult, pipeline, layers, presentation });
  const inputData = inputEnvelope({ input, pipeline, canonicalResult });
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
    decision.sourceAgreement,
    decision.evidenceAgreement,
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
    sources: list(value.sources).slice(0, 8),
    status: text(value.status || value.providerStatus, "OBSERVED").toUpperCase(),
  }));
  const decisionTwin = canonical.decisionTwin || pipeline?.decisionTwin || decision.decisionTwin || null;
  const layerData = {
    l1: {
      ...layerSummary("l1", { layers, pipeline, presentation }),
      claims,
      entities: list(layers.layer2?.entities || layers.layer1?.entities || pipeline?.entities).slice(0, 24),
      inputType: inputData.type,
      inputExcerpt: inputData.excerpt,
      technicalSignals: unique([stages.l1?.signals, layers.layer1?.signals, layers.layer1?.reasons], 10),
      metricLabel: claims.length ? `${claims.length} claim${claims.length === 1 ? "" : "s"} extracted` : null,
    },
    l2: {
      ...layerSummary("l2", { layers, pipeline, presentation }),
      sources,
      groups,
      providerSignals: resolvedProviders.filter((item) => ["l2a", "security", "safe", "threat"].some((token) => `${item.provider}`.toLowerCase().includes(token))),
      officialCount: sources.length ? sources.filter((source) => `${source.sourceType}`.toLowerCase().includes("official") || `${source.sourceType}`.toLowerCase().includes("primary")).length : null,
      metricLabel: sources.length ? `${sources.length} source${sources.length === 1 ? "" : "s"} discovered` : null,
    },
    l3: {
      ...layerSummary("l3", { layers, pipeline, presentation }),
      ...buckets,
      conflicts: list(record(canonical.evidence).conflicts).length ? record(canonical.evidence).conflicts : list(canonical.conflicts || layers.layer3?.conflicts),
      uncertainty,
      sourceAgreement,
      metricLabel: sources.length ? `${buckets.supporting.length} support · ${buckets.contradicting.length} contradict · ${buckets.context.length} context` : null,
    },
    l4: {
      ...layerSummary("l4", { layers, pipeline, presentation }),
      streams: analysisStreams,
      providers: resolvedProviders,
      sequentialSignals,
      aiVerification: layers.layer4?.aiVerification || canonical.aiVerification || stages.l4?.rawMetadata?.aiVerification || null,
      aiVerificationStatus: layers.layer4?.aiVerificationStatus || canonical.aiVerificationStatus || stages.l4?.rawMetadata?.aiVerificationStatus || "NOT_REQUESTED",
      aiVerificationTransport: layers.layer4?.aiVerificationTransport || stages.l4?.rawMetadata?.aiVerificationTransport || null,
      aiVerificationThinkingLevel: layers.layer4?.aiVerificationThinkingLevel || stages.l4?.rawMetadata?.aiVerificationThinkingLevel || null,
      aiVerificationLatencyMs: layers.layer4?.aiVerificationLatencyMs ?? stages.l4?.rawMetadata?.aiVerificationLatencyMs ?? null,
      agreement: firstText(canonical.metrics?.evidenceAgreement, decision.evidenceAgreement, decision.agreement, sourceAgreement),
      operationStatus: stageStatus(stages.l4),
      operations: [
        { id: "research", label: "Additional research", available: Boolean(sources.length || canonical.additionalResearch || layers.layer4?.additionalResearch) },
        { id: "comparison", label: "Evidence comparison", available: Boolean(sources.length || buckets.relationships.length || canonical.evidenceComparison) },
        { id: "quality", label: "Source quality evaluation", available: Boolean(sources.some((source) => source.sourceType || source.contentHash) || canonical.sourceQuality) },
        { id: "ai", label: "Gemini verification", available: Boolean(layers.layer4?.aiVerification || canonical.aiVerification || analysisStreams.length || stageStatus(stages.l4) === "COMPLETE") },
      ],
      metricLabel: layers.layer4?.aiVerificationStatus === "UNAVAILABLE" ? "AI verification unavailable" : analysisStreams.length ? `${analysisStreams.length} analysis stream${analysisStreams.length === 1 ? "" : "s"}` : null,
    },
    l5: {
      ...layerSummary("l5", { layers, pipeline, presentation }),
      decision,
      verdict: presentation?.finalDecisionLabel || firstText(decision.label, decision.truthStatus, decision.epistemicState, decision.security),
      confidence,
      evidenceSufficiency,
      sourceAgreement,
      reasons: presentation?.reasons || unique([decision.reasons, decision.rationale, layers.layer4?.userExplanation?.why], 8),
      contradictions: presentation?.counterEvidence || unique([decision.counterEvidence, decision.contradictions, decision.conflicts], 8),
      uncertainty,
      nextAction: presentation?.recommendedAction || firstText(decision.recommendedAction, canonical.recommendedAction, layers.layer4?.userExplanation?.recommendedActionNote),
      humanReview: review,
      decisionTwin,
      metricLabel: decisionTwin ? "Decision Twin available" : null,
    },
  };
  const completedRun = !processing && Boolean(canonical.decision || canonical.finalDecision || pipeline?.finalDecision || pipeline?.decision || pipeline?.pipelineStatus === "COMPLETED");
  const macroStages = MASTER_ULTRA_LAYERS.map((definition) => {
    const source = layerData[definition.id];
    const status = source.status === "WAITING" && completedRun ? definition.id === "l5" ? "COMPLETE" : "PARTIAL" : source.status;
    return {
      ...definition,
      status,
      summary: source.summary,
      data: { ...source, status },
    };
  });

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
    providers: resolvedProviders,
    noRerunOnInspect: true,
  };
}

export function layerDefinition(id) {
  return MASTER_ULTRA_LAYERS.find((layer) => layer.id === id) || MASTER_ULTRA_LAYERS[0];
}

export { TRUST_MACRO_STAGES };
