/**
 * StudentHub AI — Epistemic Claim Graph DAG Engine V2
 * 
 * Manages the Directed Acyclic Graph (DAG) of atomic claims, premises, dependencies,
 * and qualified scopes. Prevents circular dependencies, computes structural coverage,
 * and maintains causal derivation traces (Premise A + Premise B + Rule R -> Conclusion C).
 */

import {
  AiTrustModel,
  CLAIM_RELATION,
  EPISTEMIC_STATE
} from "./aiTrustModel.js";

export class EpistemicClaimGraph {
  #nodes = new Map();
  #edges = [];
  #dependencies = new Map();
  #supports = new Map();

  constructor() {
    this.#nodes = new Map();
    this.#edges = [];
    this.#dependencies = new Map();
    this.#supports = new Map();
  }

  addClaim(claimData) {
    const claim = AiTrustModel.createClaim(claimData);
    this.#nodes.set(claim.claimId, claim);
    return claim;
  }

  addEdge(fromClaimId, toClaimId, relation = CLAIM_RELATION.SUPPORTS, options = {}) {
    if (!this.#nodes.has(fromClaimId) || !this.#nodes.has(toClaimId)) {
      throw new Error(`[EPISTEMIC_GRAPH] Both fromClaim (${fromClaimId}) and toClaim (${toClaimId}) must exist.`);
    }

    // Check for circular dependency across graph
    if (this.#detectPath(toClaimId, fromClaimId)) {
      throw new Error(`[EPISTEMIC_GRAPH] Circular dependency detected between ${fromClaimId} and ${toClaimId}`);
    }

    const edge = AiTrustModel.createClaimEdge({
      fromClaimId,
      toClaimId,
      relation,
      weight: options.weight,
      reason: options.reason
    });

    this.#edges.push(edge);

    if (relation === CLAIM_RELATION.DEPENDS_ON || relation === CLAIM_RELATION.DERIVES_FROM) {
      if (!this.#dependencies.has(toClaimId)) this.#dependencies.set(toClaimId, []);
      this.#dependencies.get(toClaimId).push(fromClaimId);
    } else if (relation === CLAIM_RELATION.SUPPORTS) {
      if (!this.#supports.has(toClaimId)) this.#supports.set(toClaimId, []);
      this.#supports.get(toClaimId).push(fromClaimId);
    }

    return edge;
  }

  #detectPath(startNodeId, targetNodeId, visited = new Set()) {
    if (startNodeId === targetNodeId) return true;
    visited.add(startNodeId);

    const neighbors = this.#edges
      .filter(e => e.fromClaimId === startNodeId)
      .map(e => e.toClaimId);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (this.#detectPath(neighbor, targetNodeId, visited)) return true;
      }
    }
    return false;
  }

  getClaim(claimId) {
    return this.#nodes.get(claimId) || null;
  }

  getAllClaims() {
    return Array.from(this.#nodes.values());
  }

  getAllEdges() {
    return [...this.#edges];
  }

  computeCoverage() {
    const claims = Array.from(this.#nodes.values());
    const total = claims.length;
    if (total === 0) {
      return AiTrustModel.createEvidenceCoverage({ totalClaims: 0, supportedClaims: 0 });
    }

    const supported = claims.filter(c => 
      c.epistemicState === EPISTEMIC_STATE.VERIFIED || 
      c.epistemicState === EPISTEMIC_STATE.SUPPORTED ||
      c.epistemicState === EPISTEMIC_STATE.KNOWN
    ).length;

    return AiTrustModel.createEvidenceCoverage({
      totalClaims: total,
      supportedClaims: supported,
      totalSources: total,
      officialSources: supported
    });
  }

  getInferenceTrace(claimId) {
    const claim = this.getClaim(claimId);
    if (!claim) return null;

    const premises = (this.#dependencies.get(claimId) || []).map(id => this.getClaim(id));
    return {
      targetClaim: claim,
      premises,
      inferenceRule: claim.inferenceTrace?.rule || "DIRECT_ASSERTION",
      isValidDerivation: premises.every(p => p && (p.epistemicState === EPISTEMIC_STATE.VERIFIED || p.epistemicState === EPISTEMIC_STATE.SUPPORTED))
    };
  }
}
