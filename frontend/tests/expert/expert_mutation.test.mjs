import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertEntityResolver } from "../../src/lib/intelligence/expert/expertEntityResolver.js";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS,
  JURISDICTION_TYPE,
  RESOLUTION_STATUS,
  CREDENTIAL_STATUS,
  QUERY_ANSWER_MODE
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertIntelligenceMutationGuard", () => {
  it("Mutant 1: Unverified self-claim must NEVER be marked as verified or produce verified opinions", () => {
    const unverified = ExpertIntelligenceModel.createExpert({
      name: "Tự Xưng",
      isVerified: false,
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG }]
    });

    const claim = ExpertIntelligenceModel.createExpertClaim({ text: "AI là tương lai", domain: "AI_ML" });
    const result = ExpertScopeEngine.evaluateClaimScope(unverified, claim);
    assert.strictEqual(result.answerMode, QUERY_ANSWER_MODE.UNVERIFIED_EXPERT);
    assert.notStrictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION);
  });

  it("Mutant 2: Same-name collision must NEVER merge silently into a single profile", () => {
    const pool = [
      ExpertIntelligenceModel.createExpert({ expertId: "E1", name: "Trần Văn B", institution: "HCMUTE" }),
      ExpertIntelligenceModel.createExpert({ expertId: "E2", name: "Trần Văn B", institution: "Bách Khoa" })
    ];

    const resolution = ExpertEntityResolver.resolve({ name: "Trần Văn B" }, pool);
    assert.strictEqual(resolution.status, RESOLUTION_STATUS.IDENTITY_AMBIGUOUS);
    assert.strictEqual(resolution.expert, null);
  });

  it("Mutant 3: Academic rank alone must NEVER expand authority to official institutional regulations", () => {
    const prof = ExpertIntelligenceModel.createExpert({
      name: "GS. Hàng Đầu",
      hasRegistrarAuthority: false,
      orcid: "0000-0001-2345-6789",
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG }]
    });

    const policyClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Điểm chuẩn tốt nghiệp K24 là TOEIC 600.",
      domain: "ACADEMIC_REGULATION",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });

    const evalResult = ExpertScopeEngine.evaluateClaimScope(prof, policyClaim);
    assert.strictEqual(evalResult.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
    assert.strictEqual(evalResult.isWithinJurisdiction, false);
  });

  it("Mutant 4: Expired role must NEVER retain active administrative authority", () => {
    const pastHead = ExpertIntelligenceModel.createExpert({
      name: "Cựu Trưởng Phòng",
      orcid: "0000-0002-3456-7890",
      roles: [{ roleTitle: "REGISTRAR_DIRECTOR", validFrom: "2019-01-01", validUntil: "2023-12-31" }]
    });

    const adminClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Thông báo hoãn thi học kỳ.",
      domain: "ACADEMIC_REGULATION",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });

    const evalResult = ExpertScopeEngine.evaluateClaimScope(pastHead, adminClaim);
    assert.strictEqual(evalResult.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
  });

  it("Mutant 5: Commercial conflict must NEVER be counted as independent qualified expert opinion", () => {
    const prof = ExpertIntelligenceModel.createExpert({
      name: "TS. AI",
      orcid: "0000-0003-4567-8901",
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG }],
      conflicts: [{ entityName: "Vendor X", isActive: true }]
    });

    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Nên dùng sản phẩm Vendor X.",
      domain: "AI_ML"
    });

    const evalResult = ExpertScopeEngine.evaluateClaimScope(prof, claim);
    assert.strictEqual(evalResult.claimStatus, EXPERT_CLAIM_STATUS.CONFLICT_OF_INTEREST);
    assert.strictEqual(evalResult.hasConflictOfInterest, true);
  });

  it("Mutant 6: Shared single-source citation must NEVER be counted as multiple independent confirmations", () => {
    const claims = [
      ExpertIntelligenceModel.createExpertClaim({ expertId: "E1", citedEvidenceIds: ["SAME_PAPER_1"] }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "E2", citedEvidenceIds: ["SAME_PAPER_1"] }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "E3", citedEvidenceIds: ["SAME_PAPER_1"] })
    ];

    const result = ExpertScopeEngine.clusterExpertConsensus(claims);
    assert.strictEqual(result.clusterCount, 1);
    assert.strictEqual(result.isIndependentConsensus, false);
  });

  it("Mutant 7: Self-claimed credential without issuer/verification must NEVER be VERIFIED", () => {
    const unverifiedCred = ExpertIntelligenceModel.createCredential({
      type: "DEGREE_PHD",
      status: CREDENTIAL_STATUS.UNVERIFIED,
      isVerified: false
    });

    assert.strictEqual(unverifiedCred.status, CREDENTIAL_STATUS.UNVERIFIED);
    assert.strictEqual(unverifiedCred.isVerified, false);
  });
});
