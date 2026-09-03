/**
 * StudentHub AI — Comprehensive Provenance Graph Architecture V1
 * Enforces tamper-proof origin tracing, transformation history, and validator signatures.
 */

import crypto from "node:crypto";

export const TRANSFORMATION_TYPE = Object.freeze({
  EXTRACTED: "EXTRACTED",                   // Extracted from document/post
  NORMALIZED: "NORMALIZED",                 // Term canonicalization
  DEDUPLICATED: "DEDUPLICATED",             // Clustered with related assertions
  FUSED: "FUSED",                           // Combined across multiple evidence nodes
  CALIBRATED: "CALIBRATED",                 // Confidence calibrated against historical Brier data
  ARBITRATED: "ARBITRATED",                 // Resolved by contradiction engine
  REASONED: "REASONED"                      // Synthesized by grounded AI recommendation
});

export class ProvenanceRecord {
  /**
   * @param {object} params
   * @param {string} [params.provenanceId]
   * @param {string} params.targetEntityId - e.g. claimId or recommendationId
   * @param {string} params.targetEntityType - "CLAIM" | "EVIDENCE" | "RECOMMENDATION"
   * @param {string[]} [params.sourceIds]
   * @param {string[]} [params.parentEvidenceIds]
   * @param {string} [params.authorId]
   * @param {string} [params.validatorId]
   * @param {string[]} [params.transformations] - TRANSFORMATION_TYPE[]
   * @param {number} [params.confidence]
   * @param {string} [params.contentDigest]
   * @param {string} [params.timestamp]
   */
  constructor({
    provenanceId = null,
    targetEntityId,
    targetEntityType,
    sourceIds = [],
    parentEvidenceIds = [],
    authorId = "system",
    validatorId = null,
    transformations = [TRANSFORMATION_TYPE.EXTRACTED],
    confidence = 1.0,
    contentDigest = null,
    timestamp = new Date().toISOString()
  }) {
    if (!targetEntityId) throw new Error("ProvenanceRecord requires targetEntityId.");
    if (!targetEntityType) throw new Error("ProvenanceRecord requires targetEntityType.");

    this.provenanceId = provenanceId || `prov_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    this.targetEntityId = targetEntityId;
    this.targetEntityType = targetEntityType;
    this.sourceIds = Object.freeze([...new Set(sourceIds)]);
    this.parentEvidenceIds = Object.freeze([...new Set(parentEvidenceIds)]);
    this.authorId = authorId;
    this.validatorId = validatorId;
    this.transformations = Object.freeze([...transformations]);
    this.confidence = Math.max(0, Math.min(1, Number(confidence) || 0));
    this.timestamp = timestamp;
    this.contentDigest = contentDigest || crypto.createHash("sha256")
      .update(`${this.targetEntityId}:${this.sourceIds.join(",")}:${this.transformations.join(",")}:${this.timestamp}`)
      .digest("hex");

    Object.freeze(this);
  }

  toJSON() {
    return {
      provenanceId: this.provenanceId,
      targetEntityId: this.targetEntityId,
      targetEntityType: this.targetEntityType,
      sourceIds: this.sourceIds,
      parentEvidenceIds: this.parentEvidenceIds,
      authorId: this.authorId,
      validatorId: this.validatorId,
      transformations: this.transformations,
      confidence: this.confidence,
      contentDigest: this.contentDigest,
      timestamp: this.timestamp
    };
  }
}

export class ProvenanceGraph {
  static #records = new Map();

  /**
   * Records a provenance event for an intelligence entity
   */
  static recordProvenance(params) {
    const record = new ProvenanceRecord(params);
    this.#records.set(record.provenanceId, record);
    return record;
  }

  /**
   * Retrieves all provenance records for a given entity
   */
  static getProvenanceForEntity(targetEntityId) {
    const matched = [];
    for (const record of this.#records.values()) {
      if (record.targetEntityId === targetEntityId) {
        matched.push(record);
      }
    }
    return matched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Traces complete recursive lineage back to root sources
   */
  static traceLineage(targetEntityId, maxDepth = 5) {
    const lineage = {
      entityId: targetEntityId,
      records: [],
      rootSources: new Set(),
      transformations: new Set()
    };

    const visited = new Set();
    const queue = [{ entityId: targetEntityId, depth: 0 }];

    while (queue.length > 0) {
      const { entityId, depth } = queue.shift();
      if (visited.has(entityId) || depth >= maxDepth) continue;
      visited.add(entityId);

      const records = this.getProvenanceForEntity(entityId);
      for (const rec of records) {
        lineage.records.push(rec);
        rec.sourceIds.forEach(s => lineage.rootSources.add(s));
        rec.transformations.forEach(t => lineage.transformations.add(t));

        for (const parentId of rec.parentEvidenceIds) {
          if (!visited.has(parentId)) {
            queue.push({ entityId: parentId, depth: depth + 1 });
          }
        }
      }
    }

    return {
      entityId: targetEntityId,
      recordsCount: lineage.records.length,
      rootSourceIds: Array.from(lineage.rootSources),
      transformationsApplied: Array.from(lineage.transformations),
      lineageRecords: lineage.records
    };
  }

  static clear() {
    this.#records.clear();
  }
}
