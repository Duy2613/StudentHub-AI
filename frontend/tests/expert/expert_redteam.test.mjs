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
  CLAIM_STATUS,
  QUERY_ANSWER_MODE
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertRedTeamAdversarialDefense", () => {
  it("Attack A: Fake professor claiming credentials without verification remains UNVERIFIED", () => {
    const fakeProf = ExpertIntelligenceModel.createExpert({
      name: "GS. Ảo",
      orcid: null,
      verifiedEmail: null,
      directoryUrl: null,
      isVerified: false
    });

    const claim = ExpertIntelligenceModel.createExpertClaim({ text: "Ý kiến về AI", domain: "AI_ML" });
    const evalResult = ExpertScopeEngine.evaluateClaimScope(fakeProf, claim);
    assert.strictEqual(evalResult.answerMode, QUERY_ANSWER_MODE.UNVERIFIED_EXPERT);
  });

  it("Attack B & C: Same-name collision without strong signals must never merge silently", () => {
    const pool = [
      ExpertIntelligenceModel.createExpert({ expertId: "E1", name: "Nguyễn Văn A", department: "FIT", institution: "HCMUTE" }),
      ExpertIntelligenceModel.createExpert({ expertId: "E2", name: "Nguyễn Văn A", department: "FEE", institution: "HCMUTE" })
    ];

    const result = ExpertEntityResolver.resolve({ name: "Nguyễn Văn A" }, pool);
    assert.strictEqual(result.status, RESOLUTION_STATUS.IDENTITY_AMBIGUOUS);
    assert.strictEqual(result.expert, null);
  });

  it("Attack F: Expired administrative position must not have current institutional authority", () => {
    const expiredRoleProf = ExpertIntelligenceModel.createExpert({
      name: "PGS. B",
      orcid: "0000-0001-1111-2222",
      roles: [{ roleTitle: "REGISTRAR_DIRECTOR", validFrom: "2018-01-01", validUntil: "2022-01-01" }],
      scopes: [{ domain: "ACADEMIC_REGULATION", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN }]
    });

    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Quy chế thay đổi năm 2026",
      domain: "ACADEMIC_REGULATION",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });

    const evalResult = ExpertScopeEngine.evaluateClaimScope(expiredRoleProf, claim);
    assert.strictEqual(evalResult.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
  });

  it("Attack G: Expert claim outside domain must remain OUT_OF_SCOPE", () => {
    const csProf = ExpertIntelligenceModel.createExpert({
      name: "TS. CS",
      orcid: "0000-0002-2222-3333",
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG }]
    });

    const bioClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Vắc-xin mới có tác dụng 100%.",
      domain: "BIOLOGY"
    });

    const evalResult = ExpertScopeEngine.evaluateClaimScope(csProf, bioClaim);
    assert.strictEqual(evalResult.claimStatus, EXPERT_CLAIM_STATUS.OUT_OF_SCOPE);
  });

  it("Attack H: Sponsored recommendation must be flagged as CONFLICT_OF_INTEREST", () => {
    const prof = ExpertIntelligenceModel.createExpert({
      name: "TS. Marketing",
      orcid: "0000-0003-3333-4444",
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG }]
    });

    const sponsoredClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Nên mua phần mềm tại cty X.",
      domain: "AI_ML",
      isCommercialEndorsement: true
    });

    const evalResult = ExpertScopeEngine.evaluateClaimScope(prof, sponsoredClaim);
    assert.strictEqual(evalResult.claimStatus, EXPERT_CLAIM_STATUS.CONFLICT_OF_INTEREST);
  });

  it("Attack I: Circular consensus citing single paper must collapse to 1 cluster", () => {
    const claims = [
      ExpertIntelligenceModel.createExpertClaim({ expertId: "E1", citedEvidenceIds: ["DOI_123"] }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "E2", citedEvidenceIds: ["DOI_123"] })
    ];

    const consensus = ExpertScopeEngine.clusterExpertConsensus(claims);
    assert.strictEqual(consensus.clusterCount, 1);
    assert.strictEqual(consensus.isIndependentConsensus, false);
  });

  it("Attack J: Retracted claim must be classified as RETRACTED", () => {
    const prof = ExpertIntelligenceModel.createExpert({
      name: "TS. Retracted",
      orcid: "0000-0005-5555-6666",
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG }]
    });

    const retractedClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Phát hiện mới.",
      domain: "AI_ML",
      status: CLAIM_STATUS.RETRACTED,
      isRetracted: true
    });

    const evalResult = ExpertScopeEngine.evaluateClaimScope(prof, retractedClaim);
    assert.strictEqual(evalResult.claimStatus, EXPERT_CLAIM_STATUS.RETRACTED);
  });
});
