import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ExpertStore } from "../../src/lib/intelligence/expert/expertStore.js";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS,
  JURISDICTION_TYPE
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertIntelligenceE2E", () => {
  beforeEach(() => {
    ExpertStore.clear();
  });

  it("should run full E2E flow: load expert profile -> evaluate claim against scope -> verify boundary", () => {
    const experts = ExpertStore.getAllExperts();
    assert.ok(experts.length >= 2);

    const drMinh = ExpertStore.getExpert("EXP_DR_MINH_AI");
    assert.ok(drMinh);
    assert.strictEqual(drMinh.name, "TS. Nguyễn Văn Minh");

    // Case 1: Within Strong Scope
    const technicalClaim = ExpertIntelligenceModel.createExpertClaim({
      expertId: drMinh.expertId,
      text: "Mạng nơ-ron tích chập CNN hoạt động tối ưu cho bài toán nhận diện biển số xe.",
      domain: "AI_ML",
      claimJurisdiction: JURISDICTION_TYPE.TECHNICAL_DOMAIN
    });

    const eval1 = ExpertScopeEngine.evaluateClaimScope(drMinh, technicalClaim);
    assert.strictEqual(eval1.claimStatus, EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION);
    assert.strictEqual(eval1.isWithinExpertise, true);

    // Case 2: Institutional Regulation Mismatch
    const regulationClaim = ExpertIntelligenceModel.createExpertClaim({
      expertId: drMinh.expertId,
      text: "Học phí năm học 2026 sẽ được cố định không tăng.",
      domain: "TUITION_POLICY",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });

    const eval2 = ExpertScopeEngine.evaluateClaimScope(drMinh, regulationClaim);
    assert.strictEqual(eval2.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
    assert.strictEqual(eval2.isWithinJurisdiction, false);
  });
});
