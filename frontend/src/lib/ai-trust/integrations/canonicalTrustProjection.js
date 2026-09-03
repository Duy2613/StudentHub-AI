import { createHash } from "node:crypto";

const MAX_EVIDENCE = 240;
const MAX_NODES = 120;
const MAX_EDGES = 240;
const SOURCE_ORIGINS = new Set([
  "LAYER_1_INTERNAL",
  "LAYER_2_PROVIDER",
  "LAYER_3_WEB_EVIDENCE",
  "LAYER_4_INDEPENDENT_RESEARCH",
  "COMMUNITY",
  "EXPERT",
]);

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeText(value, max = 700) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : "";
}

function safeArray(value, max = 40) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function boundedUnit(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? Number(value.toFixed(4)) : null;
}

function boundedScalar(value, max = 160) {
  const unit = boundedUnit(value);
  return unit !== null ? unit : safeText(value, max) || null;
}

function hashId(prefix, value) {
  const digest = createHash("sha256").update(String(value || ""), "utf8").digest("hex").slice(0, 20);
  return `${prefix}:${digest}`;
}

function provenanceScopedId(scope, value, fallback) {
  return `${scope}:${safeText(value, 180) || fallback}`;
}

function canonicalOrigin(value, fallback) {
  const origin = safeText(value, 80).toUpperCase();
  return SOURCE_ORIGINS.has(origin) ? origin : fallback;
}

function canonicalEvidenceItem(input = {}) {
  const origin = canonicalOrigin(input.origin, "LAYER_1_INTERNAL");
  const source = asRecord(input.source);
  return {
    id: safeText(input.id, 180),
    caseId: safeText(input.caseId, 160) || null,
    layer: safeText(input.layer, 40) || null,
    origin,
    type: safeText(input.type, 100) || "OBSERVATION",
    claim: safeText(input.claim, 800) || null,
    observation: safeText(input.observation, 1200) || null,
    source: {
      id: safeText(source.id, 180) || null,
      url: safeText(source.url, 4096) || null,
      title: safeText(source.title, 240) || null,
    },
    provider: safeText(input.provider, 160) || null,
    retrievedAt: typeof input.retrievedAt === "string" ? input.retrievedAt : null,
    provenance: {
      origin,
      sourceMode: safeText(input.provenance?.sourceMode, 40) || "LIVE",
      providerStatus: safeText(input.provenance?.providerStatus, 80) || "UNKNOWN",
      liveEvidence: input.provenance?.liveEvidence === true,
    },
    reliabilityMetadata: {
      confidence: boundedUnit(input.reliabilityMetadata?.confidence),
      evidenceCoverage: boundedUnit(input.reliabilityMetadata?.evidenceCoverage),
      sourceAgreement: boundedScalar(input.reliabilityMetadata?.sourceAgreement),
    },
    limitations: safeArray(input.limitations, 8).map((item) => safeText(item, 500)).filter(Boolean),
    rawReference: safeText(input.rawReference, 180) || null,
    status: safeText(input.status, 100) || "OBSERVED",
  };
}

function pushEvidence(target, item) {
  if (!item.id || target.some((existing) => existing.id === item.id)) return;
  target.push(item);
}

function layer1Evidence(layer, requestId) {
  return safeArray(layer?.signals, 40).map((signal, index) => {
    const item = asRecord(signal);
    return canonicalEvidenceItem({
      id: safeText(item.signalId, 180) || `l1:${requestId}:${index + 1}`,
      layer: "L1",
      origin: "LAYER_1_INTERNAL",
      type: "SECURITY_SIGNAL",
      claim: null,
      observation: item.details || item.description || item.code,
      source: { id: "layer1_local_screen", title: "StudentHub internal security screen" },
      provider: "layer1_local_screen",
      retrievedAt: layer?.checkedAt || null,
      provenance: { sourceMode: "LIVE", providerStatus: layer?.status || "COMPLETED", liveEvidence: false },
      reliabilityMetadata: { confidence: null },
      limitations: ["Internal signal only; does not prove the input or target is safe."],
      rawReference: item.signalId || item.code,
      status: "OBSERVED",
    });
  });
}

function layer2Evidence(layer, requestId) {
  return safeArray(layer?.providerResults, 20).map((provider, index) => {
    const item = asRecord(provider);
    const providerId = safeText(item.provider, 160) || `provider-${index + 1}`;
    return canonicalEvidenceItem({
      id: hashId(`l2:${requestId}`, providerId),
      layer: "L2",
      origin: "LAYER_2_PROVIDER",
      type: "THREAT_INTELLIGENCE_OBSERVATION",
      claim: "Known-threat lookup observation",
      observation: [item.verdict, item.message].filter(Boolean).join(" · ") || "Provider returned an observation without a message.",
      source: { id: providerId, title: providerId },
      provider: providerId,
      retrievedAt: layer?.checkedAt || null,
      provenance: { sourceMode: "LIVE", providerStatus: item.success === true ? "SUCCESS" : "UNKNOWN", liveEvidence: false },
      reliabilityMetadata: { confidence: boundedUnit(item.confidence) },
      limitations: ["A no-match is not proof that the target is safe."],
      rawReference: providerId,
      status: safeText(item.verdict, 80).toUpperCase() || "UNKNOWN",
    });
  });
}

function layer3Evidence(layer) {
  const evidence = safeArray(layer?.evidence, 160);
  const sources = safeArray(layer?.sources, 80);
  const sourceById = new Map(sources.map((source) => [safeText(source?.sourceId, 180), source]));
  const records = evidence.map((value, index) => {
    const item = asRecord(value);
    const source = asRecord(sourceById.get(safeText(item.sourceId, 180)));
    const rawReference = safeText(item.evidenceId, 180) || safeText(item.sourceId, 180);
    const id = provenanceScopedId("l3", rawReference, `evidence:${index + 1}`);
    return canonicalEvidenceItem({
      id,
      layer: "L3",
      origin: "LAYER_3_WEB_EVIDENCE",
      type: "WEB_EVIDENCE",
      claim: item.claimId,
      observation: item.excerpt || item.relation || item.status,
      source: { id: item.sourceId || source.sourceId, url: item.sourceUrl || source.url, title: item.sourceTitle || source.title || source.publisher },
      provider: item.provider || layer?.metrics?.retrievalProvider,
      retrievedAt: item.retrievedAt || source.retrievedAt || null,
      provenance: { sourceMode: "LIVE", providerStatus: item.providerStatus || layer?.retrievalStatus || "UNKNOWN", liveEvidence: item.liveEvidence === true },
      reliabilityMetadata: { confidence: boundedUnit(item.strength), evidenceCoverage: boundedUnit(layer?.verificationCompleteness), sourceAgreement: layer?.crossSourceAgreement?.unresolved ? "UNRESOLVED" : null },
      limitations: item.liveEvidence === true ? [] : ["Source/evidence provenance is not independently verified as live by this projection."],
      rawReference,
      status: item.relation || "OBSERVED",
    });
  });
  if (records.length) return records;
  return sources.map((value, index) => {
    const source = asRecord(value);
    const rawReference = safeText(source.sourceId, 180);
    const id = provenanceScopedId("l3", rawReference, `source:${index + 1}`);
    return canonicalEvidenceItem({
      id,
      layer: "L3",
      origin: "LAYER_3_WEB_EVIDENCE",
      type: "WEB_SOURCE_OBSERVATION",
      observation: source.title || source.publisher || source.domain || "Source returned without an evidence excerpt.",
      source: { id: rawReference || id, url: source.url, title: source.title || source.publisher || source.domain },
      provider: source.provider || layer?.metrics?.retrievalProvider,
      retrievedAt: source.retrievedAt || null,
      provenance: { sourceMode: "LIVE", providerStatus: source.providerStatus || layer?.retrievalStatus || "UNKNOWN", liveEvidence: source.liveEvidence === true },
      reliabilityMetadata: { evidenceCoverage: boundedUnit(layer?.verificationCompleteness) },
      limitations: ["A source record without an evidence excerpt does not prove a claim."],
      rawReference,
      status: "SOURCE_ONLY",
    });
  });
}

function layer4Evidence(layer) {
  const integration = asRecord(layer?.legacyIntegration);
  const sourceRecords = safeArray(integration.sources || layer?.independentResearchSources, 80);
  const records = sourceRecords.map((value, index) => {
    const source = asRecord(value);
    const rawReference = safeText(source.sourceId || source.id, 180);
    const id = provenanceScopedId("l4", rawReference, `source:${index + 1}`);
    return canonicalEvidenceItem({
      id,
      layer: "L4",
      origin: "LAYER_4_INDEPENDENT_RESEARCH",
      type: "INDEPENDENT_RESEARCH_SOURCE",
      observation: source.title || source.publisher || source.domain || "Independent research source returned without a summary.",
      source: { id: rawReference || id, url: source.url, title: source.title || source.publisher || source.domain },
      provider: source.provider || integration.providerId || "legacy_verification_layer4",
      retrievedAt: source.retrievedAt || null,
      provenance: { sourceMode: "LIVE", providerStatus: source.providerStatus || integration.providerStatus || "UNKNOWN", liveEvidence: source.liveEvidence === true },
      reliabilityMetadata: { confidence: boundedUnit(integration.assessmentConfidence), sourceAgreement: boundedScalar(integration.evidenceAgreement) },
      limitations: ["Independent synthesis sources remain separate from Layer 3 and cannot override deterministic policy."],
      rawReference,
      status: "CANDIDATE_RESEARCH",
    });
  });
  if (integration.status === "COMPLETED" && (integration.reason || integration.rawVerdict)) {
    records.push(canonicalEvidenceItem({
      id: `l4:synthesis:${safeText(layer?.requestId || "run", 80)}`,
      layer: "L4",
      origin: "LAYER_4_INDEPENDENT_RESEARCH",
      type: "MODEL_ASSESSMENT",
      observation: integration.reason || integration.rawVerdict,
      source: { id: integration.providerId || "legacy_verification_layer4", title: "Legacy Layer 4 independent synthesis" },
      provider: integration.providerId || "legacy_verification_layer4",
      retrievedAt: null,
      provenance: { sourceMode: "LIVE", providerStatus: integration.providerStatus || "SUCCESS", liveEvidence: false },
      reliabilityMetadata: { confidence: boundedUnit(integration.assessmentConfidence), sourceAgreement: boundedScalar(integration.evidenceAgreement) },
      limitations: ["Model assessment is not evidence, safety probability, or final decision confidence."],
      rawReference: integration.rawVerdict || "legacy-layer4-synthesis",
      status: "CANDIDATE_ASSESSMENT",
    }));
  }
  return records;
}

export function buildCanonicalEvidence({ requestId, layers = {}, input = {} } = {}) {
  const result = [];
  for (const item of layer1Evidence(layers.layer1, requestId)) pushEvidence(result, item);
  for (const item of layer2Evidence(layers.layer2A, requestId)) pushEvidence(result, item);
  for (const item of layer3Evidence(layers.layer3)) pushEvidence(result, item);
  for (const item of layer4Evidence(layers.layer4)) pushEvidence(result, item);
  return result.slice(0, MAX_EVIDENCE).map((item) => ({
    ...item,
    caseId: safeText(input.caseId, 160) || null,
  }));
}

function nodeLabelForEvidence(item) {
  return item.source.title || item.source.id || item.provider || item.type;
}

export function buildTrustGraph({ requestId, input = {}, layers = {}, evidence = [], caseId = null } = {}) {
  const nodes = [];
  const edges = [];
  const nodeIds = new Set();
  const edgeKeys = new Set();
  const inputId = `input:${safeText(requestId, 160) || "run"}`;
  const addNode = (node) => {
    if (!node?.id || nodeIds.has(node.id) || nodes.length >= MAX_NODES) return;
    nodeIds.add(node.id);
    nodes.push(node);
  };
  const addEdge = (from, to, label) => {
    if (!nodeIds.has(from) || !nodeIds.has(to) || edges.length >= MAX_EDGES) return;
    const key = `${from}|${to}|${label}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ from, to, label });
  };

  addNode({ id: inputId, kind: "INPUT", label: input.type === "url" ? safeText(input.content, 240) : "Trust input", detail: "Actual input received by the canonical Trust API.", origin: "LAYER_1_INTERNAL" });
  if (caseId) {
    const caseNodeId = `case:${caseId}`;
    addNode({ id: caseNodeId, kind: "CASE", label: `Case #${caseId.slice(0, 8)}`, detail: "Authoritative owner-bound case in PostgreSQL.", origin: "POSTGRES_DB" });
    addEdge(inputId, caseNodeId, "recorded_as");
  }

  const claims = safeArray(layers.layer2?.claims, 40).filter((claim) => safeText(claim?.claimId, 180));
  for (const claim of claims) {
    const claimId = safeText(claim.claimId, 180);
    const id = `claim:${claimId}`;
    addNode({ id, kind: "CLAIM", label: safeText(claim.rawText || claim.text || claim.claim || claim.statement, 240) || claimId, detail: "Candidate claim extracted by semantic analysis; not yet truth.", origin: "LAYER_1_INTERNAL", rawReference: claimId });
    addEdge(inputId, id, "contains");
  }
  for (const item of safeArray(evidence, MAX_EVIDENCE)) {
    const sourceId = safeText(item.source?.id, 180) || safeText(item.provider, 180) || safeText(item.id, 180);
    if (!sourceId) continue;
    const origin = canonicalOrigin(item.origin, "LAYER_1_INTERNAL").toLowerCase();
    const id = `source:${origin}:${sourceId}`;
    addNode({ id, kind: "SOURCE", label: nodeLabelForEvidence(item), detail: `${item.origin} · ${item.status}`, origin: item.origin, rawReference: item.rawReference || item.id });
    const claimId = safeText(item.claim, 180);
    const claimNodeId = claimId ? `claim:${claimId}` : null;
    if (claimNodeId && nodeIds.has(claimNodeId)) {
      const relation = safeText(item.status, 100).toUpperCase();
      addEdge(claimNodeId, id, relation.includes("CONTRADICT") ? "contradicted_by" : "supported_by");
    } else {
      addEdge(inputId, id, "reported_by");
    }
  }
  return { schemaVersion: "trust.graph.v1", nodes, edges, source: "CANONICAL_NORMALIZED_RECORDS" };
}

function passportEvent(id, type, status, references = [], metadata = {}) {
  return {
    id,
    type,
    status: safeText(status, 80) || "UNKNOWN",
    references: safeArray(references, 20).map((value) => safeText(value, 180)).filter(Boolean),
    metadata: Object.fromEntries(Object.entries(asRecord(metadata)).slice(0, 12).map(([key, value]) => [safeText(key, 80), safeText(value, 240)]).filter(([key, value]) => key && value)),
  };
}

export function buildPassportProjection({ requestId, pipelineStatus, stages = {}, finalDecision = null, evidence = [], caseId = null } = {}) {
  const events = [];
  for (const stageId of ["l1", "l2a", "l3", "l4"]) {
    const stage = asRecord(stages[stageId]);
    if (!stage.operationStatus || stage.operationStatus === "NOT_STARTED") continue;
    const references = safeArray(stage.evidenceRefs, 8);
    const type = stage.operationStatus === "PARTIAL" || stage.operationStatus === "FAILED"
      ? "PROVIDER_UNAVAILABLE"
      : `LAYER_${stageId === "l2a" ? "2" : stageId.slice(1)}_COMPLETED`;
    events.push(passportEvent(`${requestId}:${stageId}:${stage.operationStatus}`, type, stage.operationStatus, references, { finding: stage.finding || "UNKNOWN", origin: stageId === "l3" ? "LAYER_3_WEB_EVIDENCE" : "TRUST_ENGINE" }));
  }
  if (evidence.length) events.push(passportEvent(`${requestId}:evidence`, "EVIDENCE_ADDED", "COMPLETED", evidence.slice(0, 20).map((item) => item.id), { count: String(evidence.length) }));
  if (finalDecision) events.push(passportEvent(`${requestId}:verdict`, "VERDICT_COMPOSED", pipelineStatus, [], { security: finalDecision.security, truth: finalDecision.truth, action: finalDecision.action }));
  return {
    schemaVersion: "trust.passport-projection.v1",
    persistenceStatus: caseId ? "PERSISTED" : "NOT_PERSISTED",
    appendOnly: true,
    caseId: caseId || null,
    revision: caseId ? 1 : null,
    reason: caseId ? "The canonical Trust run is durably bound to authenticated case." : "The canonical Trust run has no authenticated case owner/revision scope; events are representable but not persisted here.",
    events,
  };
}

export function buildCanonicalTrustProjection({ requestId, input, pipeline, layers, finalDecision, caseId = null } = {}) {
  const evidence = buildCanonicalEvidence({ requestId, input, layers });
  const graph = buildTrustGraph({ requestId, input, layers, evidence, caseId });
  const passport = buildPassportProjection({ requestId, pipelineStatus: pipeline?.pipelineStatus, stages: pipeline?.stages, finalDecision, evidence, caseId });
  const layer3 = asRecord(layers?.layer3);
  const layer4 = asRecord(layers?.layer4);
  const unresolvedSignals = [
    ...safeArray(pipeline?.assurance?.assuranceReasons, 20),
    ...safeArray(layer4.userExplanation?.uncertainties, 20),
    ...(layer4.legacyIntegration?.status === "UNAVAILABLE" ? ["Legacy Layer 4 independent synthesis unavailable."] : []),
  ].map((item) => safeText(item, 500)).filter(Boolean).slice(0, 40);
  return {
    verificationId: safeText(requestId, 160),
    requestId: safeText(requestId, 160),
    mode: "LIVE",
    state: pipeline?.pipelineStatus || "UNKNOWN",
    input: { type: safeText(input?.type, 40), contentLength: typeof input?.content === "string" ? input.content.length : 0 },
    layers: ["l1", "l2a", "l2b", "l2c", "l3", "l4"].map((id) => {
      const stage = asRecord(pipeline?.stages?.[id]);
      if (!stage.stageId) return null;
      return {
        stageId: safeText(stage.stageId, 40),
        operationStatus: safeText(stage.operationStatus, 40),
        finding: safeText(stage.finding, 120) || null,
        summary: safeText(stage.summary, 900),
        providerStatus: safeText(stage.providerStatus, 100),
        providerId: safeText(stage.providerId, 160) || null,
        completedAt: typeof stage.completedAt === "string" ? stage.completedAt : null,
        evidenceRefs: safeArray(stage.evidenceRefs, 20).map((item) => safeText(item, 180)).filter(Boolean),
      };
    }).filter(Boolean),
    decision: {
      verdict: safeText(finalDecision?.security || finalDecision?.truth, 120) || "UNKNOWN",
      risk: safeText(layer4.riskAssessment?.level || finalDecision?.security, 80) || "UNKNOWN",
      decisionConfidence: boundedUnit(layer4.decisionConfidence),
      evidenceCoverage: boundedUnit(layer3.verificationCompleteness),
      sourceAgreement: (boundedUnit(layer3.crossSourceAgreement?.agreementScore) ?? safeText(layer3.status, 80)) || null,
      unresolvedSignals,
      recommendedAction: safeText(finalDecision?.action, 120) || "REVIEW",
    },
    evidence,
    graph,
    passport,
  };
}
