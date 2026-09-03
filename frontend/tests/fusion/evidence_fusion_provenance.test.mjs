import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionGraph } from "../../src/lib/intelligence/fusion/evidenceFusionGraph.js";

describe("EvidenceFusionProvenanceTestSuite", () => {
  it("should trace complete backward lineage DAG from Knowledge Object to Official Source", () => {
    const graph = new EvidenceFusionGraph();
    const doc = graph.addNode({ id: "DOC_3116", label: "QĐ 3116/QĐ-ĐHSPKT", layer: "OFFICIAL_TRUTH" });
    const claim = graph.addNode({ id: "CLM_01", label: "TOEIC 550 cho K26", layer: "OFFICIAL_TRUTH" });
    const expert = graph.addNode({ id: "EXP_MINH", label: "Diễn giải TS. Minh", layer: "EXPERT_INTERPRETATION" });
    const ai = graph.addNode({ id: "AI_SYNTH", label: "Tổng hợp AI", layer: "AI_VERIFIED_REASONING" });

    graph.addEdge(doc.id, claim.id, "SUPPORTS");
    graph.addEdge(claim.id, expert.id, "INTERPRETS");
    graph.addEdge(expert.id, ai.id, "DERIVES_FROM");

    const lineage = graph.traceLineage("AI_SYNTH");
    assert.strictEqual(lineage.length, 1);
    assert.strictEqual(lineage[0].node.id, "EXP_MINH");
    assert.strictEqual(lineage[0].upstream[0].node.id, "CLM_01");
    assert.strictEqual(lineage[0].upstream[0].upstream[0].node.id, "DOC_3116");
  });
});
