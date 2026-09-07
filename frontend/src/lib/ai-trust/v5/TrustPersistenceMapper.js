/**
 * StudentHub AI — TrustPersistenceMapper
 * 
 * Maps Native Trust Engine V5 runtime pipeline results into
 * normalized relational entities for durable PostgreSQL persistence.
 * 
 * Enforces OPTION B: If principal?.id is absent (anonymous user),
 * returns null so the pipeline remains completely ephemeral with zero DB writes.
 */

import crypto from "node:crypto";
import { STAGE_IDS } from "./contracts.js";
import { computeTrustInputHash } from "../../server/database/TrustInputHash.js";

function isValidUuid(str) {
  return typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function ensureUuid(candidate) {
  if (isValidUuid(candidate)) return candidate;
  return crypto.randomUUID();
}

function resolveOwnerId(principal) {
  if (!principal) return null;
  const raw = principal.id || principal.subjectId || "";
  const cleaned = String(raw).replace(/^(student|expert|user):/, "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleaned) ? cleaned : null;
}

function boundedText(value, max = 240) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : null;
}

function safeStageSummary(stage) {
  return {
    finding: boundedText(stage?.finding, 120),
    summary: boundedText(stage?.summary, 600),
    evidenceRefs: Array.isArray(stage?.evidenceRefs) ? stage.evidenceRefs.filter((value) => typeof value === "string").slice(0, 40) : [],
    limitations: Array.isArray(stage?.limitations) ? stage.limitations.filter((value) => typeof value === "string").map((value) => value.slice(0, 240)).slice(0, 20) : [],
  };

}

export class TrustPersistenceMapper {
  /**
   * Maps a Trust V5 execution result into durable persistence DTOs.
   * Returns null if principal is unauthenticated.
   * 
   * @param {object} params
   * @param {object} params.pipelineResult - The V5 pipeline result
   * @param {object} params.input - Raw normalized input { type, content, metadata }
   * @param {object} [params.principal] - Requesting principal from SecurityFabric
   * @param {string} params.requestId - Correlation ID / request ID
   * @returns {object|null} DTO ready for DurableTrustRepository.persistTrustRecord, or null if anonymous
   */
  static mapPipelineToDurableRecord({
    pipelineResult = {},
    input = {},
    principal = null,
    requestId = "",
    idempotencyKey = null,
  }) {
    const ownerId = resolveOwnerId(principal);
    // OPTION B: Anonymous callers remain strictly ephemeral
    if (!ownerId) {
      return null;
    }

    const caseId = ensureUuid(pipelineResult.verificationId || pipelineResult.caseId);
    const runId = ensureUuid(pipelineResult.runId || pipelineResult.executionId);

    // 1. Case State Mapping
    const caseVerdict = pipelineResult.decision?.verdict
      || pipelineResult.finalDecision?.action
      || pipelineResult.state
      || "INSUFFICIENT_EVIDENCE";

    const caseRecord = {
      id: caseId,
      ownerId,
      state: String(caseVerdict).toUpperCase(),
      visibility: "PRIVATE",
    };

    const pipelineStatus = ["COMPLETED", "PARTIAL", "FAILED", "CANCELLED"].includes(String(pipelineResult.pipelineStatus || "").toUpperCase())
      ? String(pipelineResult.pipelineStatus).toUpperCase()
      : "COMPLETED";
    const stageEntries = STAGE_IDS
      .map((stageId) => [stageId, pipelineResult.stages?.[stageId]])
      .filter(([, stage]) => stage && typeof stage === "object" && !Array.isArray(stage));
    const stageRuns = stageEntries.map(([stageId, stage], stageIndex) => ({
      id: ensureUuid(stage?.runId || stage?.id),
      runId,
      caseId,
      ownerId,
      stageId,
      stageIndex,
      status: ["NOT_STARTED", "IDLE", "VALIDATING", "QUEUED", "RUNNING", "FOLLOWING", "INSPECTING", "DEGRADED", "RECONNECTING", "COMPLETED", "CANCEL_REQUESTED", "CANCELLED", "FAILED", "PARTIAL", "BLOCKED"].includes(String(stage?.operationStatus || "").toUpperCase())
        ? String(stage.operationStatus).toUpperCase()
        : "NOT_STARTED",
      attempt: Math.max(1, Number(stage?.audit?.attemptCount || stage?.audit?.attempt || 1)),
      requestId,
      startedAt: stage?.startedAt || null,
      completedAt: stage?.completedAt || null,
      latencyMs: Number.isFinite(stage?.latencyMs) && stage.latencyMs >= 0 ? Math.round(stage.latencyMs) : null,
      resultDigest: crypto.createHash("sha256").update(JSON.stringify(safeStageSummary(stage))).digest(),
      summary: safeStageSummary(stage),
    }));
    const decision = pipelineResult.finalDecision || pipelineResult.decision || {};
    const snapshot = {
      schemaVersion: "trust.case.snapshot.v1",
      runId,
      pipelineStatus,
      state: caseRecord.state,
      stageIds: stageEntries.map(([stageId]) => stageId).slice(0, 7),
      evidenceRefs: Array.isArray(pipelineResult.evidence) ? pipelineResult.evidence.map((entry) => entry?.evidenceId || entry?.id).filter(Boolean).slice(0, 80) : [],
      unknowns: Array.isArray(pipelineResult.assurance?.assuranceReasons) ? pipelineResult.assurance.assuranceReasons.map((value) => boundedText(value, 240)).filter(Boolean).slice(0, 40) : [],
    };
    const verdict = {
      security: boundedText(decision.security || decision.verdict, 120),
      truth: boundedText(decision.truth, 120),
      action: boundedText(decision.action, 120),
      pipelineStatus,
    };
    const decisionDigest = crypto.createHash("sha256").update(JSON.stringify(verdict)).digest();

    // 2. Case Input Mapping
    const caseInput = {
      id: ensureUuid(pipelineResult.input?.id),
      type: input.type || "text",
      content: input.content || "",
      metadata: input.metadata || {},
    };

    // 3. Entity Extraction & Normalization
    const entities = [];
    const seenEntities = new Set();

    const addEntity = (type, val, rel, conf) => {
      if (!val || typeof val !== "string") return;
      const cleanVal = val.trim();
      if (!cleanVal) return;
      const key = `${type}:${cleanVal.toLowerCase()}`;
      if (seenEntities.has(key)) return;
      seenEntities.add(key);
      entities.push({
        entityType: type,
        value: cleanVal,
        relationType: rel || "TARGET",
        confidence: Number.isFinite(conf) ? conf : 0.9,
      });
    };

    // Extract URL / Domain
    if (input.type === "url" || input.metadata?.url) {
      const rawUrl = input.content || input.metadata?.url;
      try {
        const u = new URL(rawUrl);
        addEntity("URL", rawUrl, "TARGET", 1.0);
        addEntity("DOMAIN", u.hostname, "TARGET_DOMAIN", 1.0);
      } catch {
        addEntity("URL", rawUrl, "TARGET", 0.8);
      }
    }

    // Extract from text patterns (phone numbers, telegram handles, emails)
    const textToScan = `${input.content || ""} ${input.metadata?.ocrText || ""}`;
    const emailMatches = textToScan.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    for (const em of emailMatches) addEntity("EMAIL", em, "MENTIONED", 0.95);

    const phoneMatches = textToScan.match(/(?:\+84|0)[1-9][0-9]{8,9}\b/g) || [];
    for (const ph of phoneMatches) addEntity("PHONE", ph, "MENTIONED", 0.9);

    const telegramMatches = textToScan.match(/@([a-zA-Z0-9_]{5,32})\b/g) || [];
    for (const tg of telegramMatches) addEntity("TELEGRAM", tg, "MENTIONED", 0.85);

    // Extract from Layer 2 / Layer 2C extracted entities
    const layer2Entities = pipelineResult.layers?.layer2?.entities || [];
    for (const e of layer2Entities) {
      addEntity(e.type || "UNKNOWN", e.value || e.text, e.role || "MENTIONED", e.confidence);
    }

    // 4. Evidence Mapping (per layer)
    const evidence = [];
    const layers = pipelineResult.layers || {};

    // Layer 1: Local Screening
    if (layers.layer1) {
      evidence.push({
        id: ensureUuid(layers.layer1.id),
        sourceType: "LOCAL_RULES",
        identifier: "layer1.screen",
        observedAt: layers.layer1.timestamp || new Date().toISOString(),
        extractorVersion: layers.layer1.ruleVersion || "layer1-v1.0.0",
        confidence: layers.layer1.confidence,
        provenance: {
          status: layers.layer1.status,
          reasons: layers.layer1.reasons || [],
          signals: layers.layer1.signals || [],
          detectors: layers.layer1.detectorsExecuted || [],
        },
      });
    }

    // Layer 2A: Threat Intelligence / Reputation
    if (layers.layer2A) {
      evidence.push({
        id: ensureUuid(layers.layer2A.id),
        sourceType: "THREAT_INTELLIGENCE",
        identifier: layers.layer2A.provider || "google-safe-browsing",
        observedAt: layers.layer2A.timestamp || new Date().toISOString(),
        extractorVersion: "layer2a-v1.0.0",
        confidence: layers.layer2A.confidence,
        provenance: {
          threatMatch: layers.layer2A.threatMatch,
          threatType: layers.layer2A.threatType,
          cacheHit: layers.layer2A.cacheHit,
          findings: layers.layer2A.findings || [],
        },
      });
    }

    // Layer 2B: Semantic Trust / NLP
    if (layers.layer2) {
      evidence.push({
        id: ensureUuid(layers.layer2.id),
        sourceType: "SEMANTIC_AI",
        identifier: "layer2.semantic",
        observedAt: layers.layer2.timestamp || new Date().toISOString(),
        extractorVersion: layers.layer2.modelVersion || "layer2-v1.0.0",
        confidence: layers.layer2.confidence,
        provenance: {
          classification: layers.layer2.classification,
          riskLevel: layers.layer2.riskLevel,
          claimsCount: layers.layer2.claims?.length || 0,
        },
      });
    }

    // Layer 3: External Corroboration
    if (layers.layer3) {
      evidence.push({
        id: ensureUuid(layers.layer3.id),
        sourceType: "EXTERNAL_EVIDENCE",
        identifier: layers.layer3.source || "web-search-tavily",
        observedAt: layers.layer3.timestamp || new Date().toISOString(),
        extractorVersion: "layer3-v1.0.0",
        confidence: layers.layer3.confidence,
        provenance: {
          verified: layers.layer3.verified,
          sources: (layers.layer3.sources || []).slice(0, 10),
          conflicts: layers.layer3.conflicts || [],
        },
      });
    }

    // Layer 4: Deterministic Policy Verdict
    if (layers.layer4) {
      evidence.push({
        id: ensureUuid(layers.layer4.id),
        sourceType: "DETERMINISTIC_POLICY",
        identifier: "layer4.policy",
        observedAt: layers.layer4.timestamp || new Date().toISOString(),
        extractorVersion: layers.layer4.policyVersion || "layer4-v1.0.0",
        confidence: layers.layer4.confidence,
        provenance: {
          verdict: layers.layer4.verdict,
          rulesTriggered: layers.layer4.rulesTriggered || [],
          explanation: layers.layer4.explanation,
        },
      });
    }

    // 5. Claims Mapping
    const claims = [];
    const rawClaims = layers.layer2?.claims || layers.layer3?.claims || [];
    for (const c of rawClaims) {
      const stmt = typeof c === "string" ? c : c.statement || c.text;
      if (!stmt) continue;
      claims.push({
        id: ensureUuid(c.id),
        statement: stmt,
        status: (c.status || "UNVERIFIED").toUpperCase(),
        evidenceRelations: evidence.slice(0, 2).map((ev) => ({
          evidenceId: ev.id,
          relation: "SUPPORTS",
        })),
      });
    }

    // 6. Audit Trail
    const audit = {
      eventType: "TRUST_PIPELINE_ANALYZED",
      actorId: ownerId,
      requestId,
      metadata: {
        contractVersion: pipelineResult.contractVersion || "trust.v5",
        verdict: caseRecord.state,
        inputModality: input.type,
        entitiesCount: entities.length,
        evidenceCount: evidence.length,
        claimsCount: claims.length,
      },
    };

    return {
      caseRecord,
      input: caseInput,
      entities,
      evidence,
      claims,
      audit,
      runRecord: {
        id: runId,
        caseId,
        ownerId,
        requestId,
        idempotencyKey: typeof idempotencyKey === "string" && /^[A-Za-z0-9._:-]{1,160}$/.test(idempotencyKey.trim()) ? idempotencyKey.trim() : null,
        inputFingerprint: computeTrustInputHash(input),
        status: pipelineStatus,
        pipelineVersion: pipelineResult.contractVersion || "trust.v5",
        startedAt: pipelineResult.startedAt || new Date().toISOString(),
        completedAt: pipelineResult.completedAt || new Date().toISOString(),
      },
      stageRuns,
      caseRevision: { revision: 1, runId, state: caseRecord.state, snapshot },
      verdictRevision: { revision: 1, runId, verdict, decisionDigest },
    };
  }
}
