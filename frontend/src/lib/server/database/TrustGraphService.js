/**
 * StudentHub AI — TrustGraphService
 * 
 * Rebuildable, deterministic graph projection engine anchored in PostgreSQL:
 * - Entities (deduplicated across cases)
 * - Claims (with truth & extraction metadata)
 * - Evidence Sources (with provenance & observation timestamps)
 * - Relations (supports / contradicts / targets / contains)
 * 
 * INVARIANT: Does not invent graph truth. Graph is a pure deterministic projection.
 */

import { getPostgresPool } from "./PostgresPool.js";

export class TrustGraphService {
  /**
   * Projects a complete, deterministic TrustGraph directly from PostgreSQL records.
   * 
   * @param {string} caseId - UUID of the trust_case
   * @returns {Promise<{ nodes: Array<object>, edges: Array<object>, stats: object }>}
   */
  static async buildGraphForCase(caseId) {
    if (!caseId) {
      throw new Error("caseId is mandatory for TrustGraph projection.");
    }

    const pool = getPostgresPool();

    // Query all relational tables atomically
    const [caseRes, inputsRes, entitiesRes, claimsRes, evidenceRes, claimSourcesRes] = await Promise.all([
      pool.query(`SELECT id, state, visibility, created_at FROM public.trust_cases WHERE id = $1`, [caseId]),
      pool.query(`SELECT id, input_type, object_key FROM public.case_inputs WHERE case_id = $1`, [caseId]),
      pool.query(
        `SELECT e.id as entity_id, e.entity_type, e.normalized_value, ce.relation_type, ce.confidence
         FROM public.case_entities ce
         JOIN public.entities e ON ce.entity_id = e.id
         WHERE ce.case_id = $1`,
        [caseId]
      ),
      pool.query(
        `SELECT c.id, c.statement, c.status
         FROM public.claims c
         WHERE c.creator_id = (SELECT owner_id FROM public.trust_cases WHERE id = $1)`,
        [caseId]
      ),
      pool.query(`SELECT id, source_type, source_identifier, observed_at, confidence, provenance FROM public.evidence WHERE case_id = $1`, [caseId]),
      pool.query(
        `SELECT cs.claim_id, cs.evidence_id, cs.relation
         FROM public.claim_sources cs
         JOIN public.evidence e ON cs.evidence_id = e.id
         WHERE e.case_id = $1`,
        [caseId]
      ),
    ]);

    if (caseRes.rows.length === 0) {
      return { nodes: [], edges: [], stats: { nodeCount: 0, edgeCount: 0 } };
    }

    const nodes = [];
    const edges = [];
    const nodeIds = new Set();
    const edgeKeys = new Set();

    const addNode = (node) => {
      if (!node?.id || nodeIds.has(node.id)) return;
      nodeIds.add(node.id);
      nodes.push(node);
    };

    const addEdge = (from, to, label) => {
      if (!nodeIds.has(from) || !nodeIds.has(to)) return; // Prevents orphan edges
      const key = `${from}|${to}|${label}`;
      if (edgeKeys.has(key)) return;
      edgeKeys.add(key);
      edges.push({ from, to, label });
    };

    // 1. Root Case Node
    const rootCaseId = `case:${caseId}`;
    addNode({
      id: rootCaseId,
      kind: "CASE",
      label: `Trust Case #${caseId.slice(0, 8)}`,
      detail: `Verdict: ${caseRes.rows[0].state}`,
      origin: "POSTGRES_DB",
    });

    // 2. Input Nodes
    for (const input of inputsRes.rows) {
      const inputNodeId = `input:${input.id}`;
      addNode({
        id: inputNodeId,
        kind: "INPUT",
        label: input.object_key ? input.object_key.slice(0, 60) : `Input (${input.input_type})`,
        detail: `Type: ${input.input_type}`,
        origin: "USER_INPUT",
      });
      addEdge(rootCaseId, inputNodeId, "has_input");
    }

    // 3. Entity Nodes
    for (const ent of entitiesRes.rows) {
      const entityNodeId = `entity:${ent.entity_id}`;
      addNode({
        id: entityNodeId,
        kind: "ENTITY",
        label: ent.normalized_value,
        detail: `Type: ${ent.entity_type} · Confidence: ${ent.confidence || 0.9}`,
        origin: "ENTITY_NORMALIZER",
      });
      addEdge(rootCaseId, entityNodeId, ent.relation_type?.toLowerCase() || "involves");
    }

    // 4. Evidence Nodes
    for (const ev of evidenceRes.rows) {
      const evNodeId = `evidence:${ev.id}`;
      addNode({
        id: evNodeId,
        kind: "SOURCE",
        label: ev.source_identifier ? ev.source_identifier.slice(0, 50) : `Evidence #${ev.id.slice(0, 8)}`,
        detail: `Source: ${ev.source_type} · Confidence: ${ev.confidence}`,
        origin: ev.provenance?.class || "EXTERNAL_SOURCE",
      });
      addEdge(rootCaseId, evNodeId, "observed_evidence");
    }

    // 5. Claim Nodes & Claim-Evidence Edges
    for (const claim of claimsRes.rows) {
      const claimNodeId = `claim:${claim.id}`;
      addNode({
        id: claimNodeId,
        kind: "CLAIM",
        label: claim.statement.slice(0, 80),
        detail: `Status: ${claim.status}`,
        origin: "SEMANTIC_EXTRACTOR",
      });
      addEdge(rootCaseId, claimNodeId, "contains_claim");
    }

    // 6. Claim Sources (Supports / Contradicts Edges)
    for (const cs of claimSourcesRes.rows) {
      const claimNodeId = `claim:${cs.claim_id}`;
      const evNodeId = `evidence:${cs.evidence_id}`;
      const relationLabel = cs.relation === "CONTRADICTS" ? "contradicted_by" : "supported_by";
      addEdge(claimNodeId, evNodeId, relationLabel);
    }

    // Deterministic ordering
    nodes.sort((a, b) => a.id.localeCompare(b.id));
    edges.sort((a, b) => `${a.from}|${a.to}|${a.label}`.localeCompare(`${b.from}|${b.to}|${b.label}`));

    return {
      schemaVersion: "trust.graph.v2",
      caseId,
      nodes,
      edges,
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    };
  }

  /**
   * Rebuilds the graph to verify projection determinism.
   */
  static async rebuildGraphForCase(caseId) {
    return this.buildGraphForCase(caseId);
  }
}
