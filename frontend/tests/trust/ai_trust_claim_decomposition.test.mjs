import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ClaimDecompositionEngine } from "../../src/lib/intelligence/trust/claimDecompositionEngine.js";
import { CLAIM_TYPE, STAKE_LEVEL } from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustClaimDecomposition", () => {
  it("should split compound sentences with conjunctions into independent atomic claims", () => {
    const text = "HCMUTE yêu cầu chuẩn đầu ra TOEIC 550 đối với K24 và sinh viên phải hoàn tất trước ngày 05/09/2026.";
    const claims = ClaimDecompositionEngine.decompose(text);

    assert.strictEqual(claims.length, 2);
    
    // Claim 1: TOEIC 550 for K24
    assert.strictEqual(claims[0].scope, "K24");
    assert.strictEqual(claims[0].numericValue, 550);
    assert.strictEqual(claims[0].predicate, "REQUIRES_LANGUAGE_SCORE");
    assert.strictEqual(claims[0].claimType, CLAIM_TYPE.ACADEMIC_POLICY);

    // Claim 2: Deadline 05/09/2026
    assert.strictEqual(claims[1].predicate, "SUBMISSION_DEADLINE");
    assert.strictEqual(claims[1].claimType, CLAIM_TYPE.TEMPORAL);
  });

  it("should correctly extract credit thresholds and cohort scoping", () => {
    const text = "Sinh viên K23 cần tích lũy tối thiểu 150 tín chỉ để làm đồ án tốt nghiệp.";
    const claims = ClaimDecompositionEngine.decompose(text);

    assert.strictEqual(claims.length, 1);
    assert.strictEqual(claims[0].scope, "K23");
    assert.strictEqual(claims[0].numericValue, 150);
    assert.strictEqual(claims[0].numericUnit, "CREDITS");
    assert.strictEqual(claims[0].predicate, "REQUIRES_CREDITS");
  });
});
