import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AiTrustStore } from "../../src/lib/intelligence/trust/aiTrustStore.js";
import { AiTrustModel, EPISTEMIC_STATE } from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustBlastRadius", () => {
  beforeEach(() => {
    AiTrustStore.clear();
  });

  it("should calculate affected evaluation blast radius when an upstream source document is invalidated", () => {
    const eval1 = AiTrustModel.createEpistemicEvaluation({
      evaluationId: "EVAL_TEST_BLAST_1",
      query: "TOEIC K24",
      epistemicState: EPISTEMIC_STATE.VERIFIED,
      evidenceSpans: [
        { evidenceId: "EV1", sourceId: "SRC_OLD_DECISION", passage: "TOEIC 500" }
      ]
    });

    AiTrustStore.saveEvaluation(eval1);

    const blastRadius = AiTrustStore.computeBlastRadius("SRC_OLD_DECISION");
    assert.strictEqual(blastRadius.affectedCount, 1);
    assert.strictEqual(blastRadius.affectedEvaluations[0].actionRequired, "NEEDS_REEVALUATION");
  });
});
