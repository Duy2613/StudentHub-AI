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
  }) {
    const ownerId = resolveOwnerId(principal);
    // OPTION B: Anonymous callers remain strictly ephemeral
    if (!ownerId) {
      return null;
    }

    const caseId = ensureUuid(pipelineResult.verificationId || pipelineResult.caseId);

    // 1. Case State Mapping
    const verdict = pipelineResult.decision?.verdict
      || pipelineResult.finalDecision?.action
      || pipelineResult.state
      || "INSUFFICIENT_EVIDENCE";

    const caseRecord = {
      id: caseId,
      ownerId,
      state: String(verdict).toUpperCase(),
      visibility: "PRIVATE",
    };

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
    };
  }
}
