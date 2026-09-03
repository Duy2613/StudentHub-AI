import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ExpertStore } from "../../src/lib/intelligence/expert/expertStore.js";
import { ExpertQueryEngine } from "../../src/lib/intelligence/expert/expertQueryEngine.js";
import {
  EXPERT_CLAIM_STATUS,
  RESOLUTION_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertIntelligenceE2E", () => {
  beforeEach(() => {
    ExpertStore.clear();
  });

  it("should execute full E2E flow: entity resolution -> domain scope query -> claim evaluation -> authority boundary check", () => {
    // 1. Multi-signal Entity Resolution via ORCID
    const resolution = ExpertStore.resolveEntity({ orcid: "0000-0002-1825-0097" });
    assert.strictEqual(resolution.status, RESOLUTION_STATUS.EXACT_MATCH);
    assert.strictEqual(resolution.expert.expertId, "EXP_DR_MINH_AI");

    // 2. Domain Query Matching
    const aiExperts = ExpertQueryEngine.findExpertsForDomain("AI_ML");
    assert.ok(aiExperts.strongMatches.length >= 1);
    assert.strictEqual(aiExperts.strongMatches[0].expertId, "EXP_DR_MINH_AI");

    // 3. Authority Scope Boundary Check:
    // Technical Claim -> QUALIFIED_EXPERT_OPINION
    const techResult = ExpertQueryEngine.evaluateExpertAuthority(
      "EXP_DR_MINH_AI",
      "Mô hình Transformer nén hoạt động tối ưu trên thiết bị IoT.",
      "AI_ML",
      "TECHNICAL_DOMAIN"
    );
    assert.strictEqual(techResult.success, true);
    assert.strictEqual(techResult.evaluation.claimStatus, EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION);

    // Administrative Claim -> AUTHORITY_MISMATCH (Expertise != Institutional Authority)
    const adminResult = ExpertQueryEngine.evaluateExpertAuthority(
      "EXP_DR_MINH_AI",
      "HCMUTE chính thức dời hạn đóng học phí sang tháng 12.",
      "TUITION_POLICY",
      "INSTITUTIONAL_ADMIN"
    );
    assert.strictEqual(adminResult.success, true);
    assert.strictEqual(adminResult.evaluation.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
    assert.strictEqual(adminResult.evaluation.isWithinJurisdiction, false);
  });
});
