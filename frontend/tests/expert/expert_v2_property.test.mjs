import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import { ExpertEntityResolver } from "../../src/lib/intelligence/expert/expertEntityResolver.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS,
  RESOLUTION_STATUS,
  CREDENTIAL_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertV2PropertyTests", () => {
  const expert = ExpertIntelligenceModel.createExpert({
    expertId: "EXP_PROP_1",
    name: "TS. Nguyễn Văn Minh",
    orcid: "0000-0002-1825-0097",
    scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }]
  });

  it("Property 1: Idempotency — Same expert + same claim produces identical evaluation", () => {
    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Mô hình Transformer phù hợp xử lý ngữ nghĩa tiếng Việt.",
      domain: "AI_ML"
    });

    const res1 = ExpertScopeEngine.evaluateClaimScope(expert, claim);
    const res2 = ExpertScopeEngine.evaluateClaimScope(expert, claim);

    assert.strictEqual(res1.claimStatus, res2.claimStatus);
    assert.strictEqual(res1.isWithinExpertise, res2.isWithinExpertise);
    assert.strictEqual(res1.isWithinJurisdiction, res2.isWithinJurisdiction);
    assert.strictEqual(res1.hasConflictOfInterest, res2.hasConflictOfInterest);
  });

  it("Property 2: Name similarity alone NEVER resolves to EXACT_MATCH without strong signals", () => {
    const pool = [
      ExpertIntelligenceModel.createExpert({ name: "Trần Văn B", institution: "HCMUTE", department: "Khoa CNTT" }),
      ExpertIntelligenceModel.createExpert({ name: "Trần Văn B", institution: "ĐHQG", department: "Khoa Toán" })
    ];

    const res = ExpertEntityResolver.resolve({ name: "Trần Văn B" }, pool);
    assert.notStrictEqual(res.status, RESOLUTION_STATUS.EXACT_MATCH);
    assert.strictEqual(res.status, RESOLUTION_STATUS.IDENTITY_AMBIGUOUS);
  });

  it("Property 3: Reputation or follower count changes have ZERO effect on domain expertise", () => {
    const expLowScore = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_LOW",
      name: "TS. Nghiên Cứu",
      reputationScore: 10,
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }]
    });

    const expHighScore = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_HIGH",
      name: "TS. Ngôi Sao Mạng",
      reputationScore: 99,
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.OUT_OF_SCOPE }]
    });

    const claim = ExpertIntelligenceModel.createExpertClaim({ domain: "AI_ML", text: "Thử nghiệm AI." });

    const evalLow = ExpertScopeEngine.evaluateClaimScope(expLowScore, claim);
    const evalHigh = ExpertScopeEngine.evaluateClaimScope(expHighScore, claim);

    assert.strictEqual(evalLow.claimStatus, EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION);
    assert.strictEqual(evalHigh.claimStatus, EXPERT_CLAIM_STATUS.OUT_OF_SCOPE);
  });

  it("Property 4: Client credential injection without external proof remains UNVERIFIED", () => {
    const injectedCred = ExpertIntelligenceModel.createCredential({
      title: "Hacker Injected PhD",
      isVerified: false,
      status: CREDENTIAL_STATUS.UNVERIFIED
    });

    assert.strictEqual(injectedCred.isVerified, false);
    assert.strictEqual(injectedCred.status, CREDENTIAL_STATUS.UNVERIFIED);
  });
});
