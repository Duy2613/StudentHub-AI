import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AiTrustEngine } from "../../src/lib/intelligence/trust/aiTrustEngine.js";
import {
  EPISTEMIC_STATE,
  STAKE_LEVEL
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustV2MutationGuard", () => {
  it("Mutant 1: AI hallucinated authority must NEVER become VERIFIED without official evidence", () => {
    const res = AiTrustEngine.evaluate({
      query: "Quy chế học phí",
      rawAnswer: "Học phí được miễn giảm 100%.",
      stakeLevel: STAKE_LEVEL.CRITICAL,
      evidenceSpans: []
    });
    assert.notStrictEqual(res.epistemicState, EPISTEMIC_STATE.VERIFIED);
    assert.strictEqual(res.requiresAbstention, true);
  });

  it("Mutant 2: Citation mismatch must NEVER be marked as fully verified", () => {
    const res = AiTrustEngine.evaluate({
      query: "Môn tiên quyết",
      rawAnswer: "Toán 1 là tiên quyết của Triết học Mác-Lênin.",
      evidenceSpans: [
        { evidenceId: "E1", passage: "Toán 1 là tiên quyết của Toán 2.", authorityTier: 100 }
      ]
    });
    assert.notStrictEqual(res.epistemicState, EPISTEMIC_STATE.VERIFIED);
  });

  it("Mutant 3: Counter-evidence from active official source must prevent confident answer", () => {
    const res = AiTrustEngine.evaluate({
      query: "Chuẩn tiếng Anh",
      rawAnswer: "TOEIC 500",
      counterEvidencePool: [
        { passage: "Quyết định 2025: Chuẩn TOEIC là 550 điểm.", authorityTier: 100, validFrom: "2025-08-22" }
      ]
    });
    assert.notStrictEqual(res.epistemicState, EPISTEMIC_STATE.VERIFIED);
  });
});
