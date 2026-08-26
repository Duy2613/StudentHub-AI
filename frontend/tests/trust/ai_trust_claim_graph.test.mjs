import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EpistemicClaimGraph } from "../../src/lib/intelligence/trust/epistemicClaimGraph.js";
import {
  CLAIM_RELATION,
  EPISTEMIC_STATE
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustClaimGraph", () => {
  it("should build claim graph DAG and prevent circular dependencies", () => {
    const graph = new EpistemicClaimGraph();

    const c1 = graph.addClaim({ claimId: "C1", text: "K24 yêu cầu TOEIC 550", epistemicState: EPISTEMIC_STATE.VERIFIED });
    const c2 = graph.addClaim({ claimId: "C2", text: "Sinh viên K24 đủ điều kiện tốt nghiệp", epistemicState: EPISTEMIC_STATE.SUPPORTED });

    graph.addEdge("C1", "C2", CLAIM_RELATION.DEPENDS_ON);

    assert.throws(() => {
      graph.addEdge("C2", "C1", CLAIM_RELATION.DEPENDS_ON);
    }, /Circular dependency detected/);

    const trace = graph.getInferenceTrace("C2");
    assert.strictEqual(trace.premises.length, 1);
    assert.strictEqual(trace.isValidDerivation, true);
  });
});
