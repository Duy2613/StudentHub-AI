/**
 * StudentHub AI — Unified Evidence Fusion Graph Engine V1
 * 
 * Merges heterogeneous graph nodes from Official Sources, T1 Epistemic Graphs,
 * T2 Expert Scope Graphs, and T3 Community Reality Graphs into a single navigable DAG.
 */

import {
  CLAIM_RELATION_TYPE,
  KNOWLEDGE_LAYER,
  AUTHORITY_CLASS
} from "./evidenceFusionModel.js";
import { createSecureId } from "../../security/secureId.js";

export class EvidenceFusionGraph {
  #nodes = new Map();
  #edges = [];

  constructor() {
    this.#nodes = new Map();
    this.#edges = [];
  }

  /**
   * Adds a node to the fusion graph
   */
  addNode(node = {}) {
    const id = node.id || node.claimId || node.sourceId || node.expertId || node.postId || createSecureId("NODE");
    const type = node.type || (node.claimId ? "CLAIM" : (node.expertId ? "EXPERT" : "SOURCE"));

    const normalizedNode = {
      id,
      type,
      label: node.label || node.statement || node.name || node.title || id,
      layer: node.layer || KNOWLEDGE_LAYER.AI_VERIFIED_REASONING,
      authorityClass: node.authorityClass || AUTHORITY_CLASS.AI_SYNTHESIS,
      metadata: { ...node }
    };

    this.#nodes.set(id, Object.freeze(normalizedNode));
    return normalizedNode;
  }

  /**
   * Adds a directional edge between two nodes
   */
  addEdge(sourceId, targetId, relation = CLAIM_RELATION_TYPE.SUPPORTS, metadata = {}) {
    if (!this.#nodes.has(sourceId) || !this.#nodes.has(targetId)) {
      return null;
    }

    const edge = Object.freeze({
      sourceId,
      targetId,
      relation,
      metadata: Object.freeze({ ...metadata })
    });

    this.#edges.push(edge);
    return edge;
  }

  /**
   * Traces the complete backward lineage for a target node
   */
  traceLineage(targetId, maxDepth = 10, visited = new Set()) {
    if (!targetId || visited.has(targetId) || maxDepth <= 0) return [];
    visited.add(targetId);

    const incomingEdges = this.#edges.filter(e => e.targetId === targetId);
    const lineage = [];

    for (const edge of incomingEdges) {
      const sourceNode = this.#nodes.get(edge.sourceId);
      if (sourceNode) {
        lineage.push({
          node: sourceNode,
          relation: edge.relation,
          upstream: this.traceLineage(edge.sourceId, maxDepth - 1, new Set(visited))
        });
      }
    }

    return lineage;
  }

  /**
   * Returns all graph nodes and edges
   */
  toJSON() {
    return {
      nodes: Array.from(this.#nodes.values()),
      edges: [...this.#edges],
      nodeCount: this.#nodes.size,
      edgeCount: this.#edges.length
    };
  }
}
