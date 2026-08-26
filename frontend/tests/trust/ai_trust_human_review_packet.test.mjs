import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AiTrustEngine } from "../../src/lib/intelligence/trust/aiTrustEngine.js";
import {
  STAKE_LEVEL,
  ANSWER_MODE,
  EPISTEMIC_STATE
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustHumanReviewPacket", () => {
  it("should generate comprehensive human review package when critical official conflict occurs", () => {
    const result = AiTrustEngine.evaluate({
      query: "Quy chế kỷ luật và bãi miễn môn học",
      rawAnswer: "Học phần này bị bãi bỏ.",
      stakeLevel: STAKE_LEVEL.CRITICAL,
      counterEvidencePool: [
        {
          passage: "Học phần này bắt buộc và không được bãi bỏ theo quyết định 2025.",
          authorityTier: 100,
          validFrom: "2025-01-01"
        }
      ]
    });

    assert.strictEqual(result.answerMode, ANSWER_MODE.HUMAN_REVIEW_REQUIRED);
    assert.strictEqual(result.epistemicState, EPISTEMIC_STATE.CONFLICTED);
    assert.ok(result.humanReviewPacket);
    assert.strictEqual(result.humanReviewPacket.isHumanAuthorized, false); // Invariant: no fake human verification
  });
});
