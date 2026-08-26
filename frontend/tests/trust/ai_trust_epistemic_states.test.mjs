import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AiTrustModel,
  EPISTEMIC_STATE
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustEpistemicStates", () => {
  it("should support all 13 distinct epistemic states without collapsing into binary true/false", () => {
    const states = [
      EPISTEMIC_STATE.KNOWN,
      EPISTEMIC_STATE.VERIFIED,
      EPISTEMIC_STATE.SUPPORTED,
      EPISTEMIC_STATE.PARTIALLY_SUPPORTED,
      EPISTEMIC_STATE.INFERRED,
      EPISTEMIC_STATE.PLAUSIBLE,
      EPISTEMIC_STATE.UNCERTAIN,
      EPISTEMIC_STATE.UNSUPPORTED,
      EPISTEMIC_STATE.CONTRADICTED,
      EPISTEMIC_STATE.CONFLICTED,
      EPISTEMIC_STATE.OUTDATED,
      EPISTEMIC_STATE.RETRACTED,
      EPISTEMIC_STATE.UNKNOWN
    ];

    assert.strictEqual(states.length, 13);
    const unique = new Set(states);
    assert.strictEqual(unique.size, 13);

    const claim = AiTrustModel.createClaim({
      text: "Quy định TOEIC 550",
      epistemicState: EPISTEMIC_STATE.PARTIALLY_SUPPORTED
    });
    assert.strictEqual(claim.epistemicState, EPISTEMIC_STATE.PARTIALLY_SUPPORTED);
  });
});
