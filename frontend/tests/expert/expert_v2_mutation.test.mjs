import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import { ExpertEntityResolver } from "../../src/lib/intelligence/expert/expertEntityResolver.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS,
  RESOLUTION_STATUS,
  CREDENTIAL_STATUS,
  JURISDICTION_TYPE,
  CLAIM_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertV2MutationTestSuite", () => {
  it("Mutant 1: Name-only identity must never mutate to EXACT_MATCH when multiple candidates exist", () => {
    const candidates = [
      ExpertIntelligenceModel.createExpert({ name: "Nguyễn Văn X", institution: "Trường A" }),
      ExpertIntelligenceModel.createExpert({ name: "Nguyễn Văn X", institution: "Trường B" })
    ];
    const res = ExpertEntityResolver.resolve({ name: "Nguyễn Văn X" }, candidates);
    assert.strictEqual(res.status, RESOLUTION_STATUS.IDENTITY_AMBIGUOUS);
  });

  it("Mutant 2: Self-claimed credential must never mutate to VERIFIED", () => {
    const cred = ExpertIntelligenceModel.createCredential({
      title: "Self claimed PhD",
      isVerified: false,
      status: CREDENTIAL_STATUS.UNVERIFIED
    });
    assert.strictEqual(cred.isVerified, false);
  });

  it("Mutant 3: Expired role must never mutate to isCurrent = true", () => {
    const role = ExpertIntelligenceModel.createRole({
      roleTitle: "HEAD_OF_DEPT",
      validFrom: "2020-01-01",
      validUntil: "2023-12-31"
    });
    assert.strictEqual(role.isCurrent, false);
  });

  it("Mutant 4: Out-of-scope domain must never mutate to QUALIFIED_EXPERT_OPINION", () => {
    const exp = ExpertIntelligenceModel.createExpert({
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }]
    });
    const claim = ExpertIntelligenceModel.createExpertClaim({ domain: "AGRICULTURE", text: "Trồng trọt." });
    const res = ExpertScopeEngine.evaluateClaimScope(exp, claim);
    assert.strictEqual(res.claimStatus, EXPERT_CLAIM_STATUS.OUT_OF_SCOPE);
  });

  it("Mutant 5: Shared evidence from 3 experts must never mutate to isIndependentConsensus = true", () => {
    const claims = [
      ExpertIntelligenceModel.createExpertClaim({ expertId: "A", citedEvidenceIds: ["DOI_1"] }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "B", citedEvidenceIds: ["DOI_1"] }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "C", citedEvidenceIds: ["DOI_1"] })
    ];
    const consensus = ExpertScopeEngine.clusterExpertConsensus(claims);
    assert.strictEqual(consensus.isIndependentConsensus, false);
  });

  it("Mutant 6: Retracted claim must never mutate to SUPPORTED", () => {
    const exp = ExpertIntelligenceModel.createExpert({
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }]
    });
    const claim = ExpertIntelligenceModel.createExpertClaim({
      domain: "AI_ML",
      status: CLAIM_STATUS.RETRACTED,
      isRetracted: true
    });
    const res = ExpertScopeEngine.evaluateClaimScope(exp, claim);
    assert.strictEqual(res.claimStatus, EXPERT_CLAIM_STATUS.RETRACTED);
  });

  it("Mutant 7: Fake portal must never mutate to verified institutional domain", () => {
    const res = ExpertEntityResolver.resolve({
      name: "TS. Test",
      directoryUrl: "http://attacker-fake-domain.ru/profile"
    }, []);
    assert.strictEqual(res.status, RESOLUTION_STATUS.UNRESOLVED);
  });

  it("Mutant 8: Injected client credential with expiresAt in the past must never remain active", () => {
    const cred = ExpertIntelligenceModel.createCredential({
      title: "Expired Degree",
      expiresAt: "2021-01-01"
    });
    assert.strictEqual(cred.status, CREDENTIAL_STATUS.EXPIRED);
    assert.strictEqual(cred.isVerified, false);
  });

  it("Mutant 9: Commercial conflict must never mutate to hasConflictOfInterest = false", () => {
    const exp = ExpertIntelligenceModel.createExpert({
      conflicts: [{ entity: "Commercial Corp", nature: "SPONSOR", isActive: true }]
    });
    const claim = ExpertIntelligenceModel.createExpertClaim({ isCommercialEndorsement: true });
    const res = ExpertScopeEngine.evaluateClaimScope(exp, claim);
    assert.strictEqual(res.hasConflictOfInterest, true);
  });

  it("Mutant 10: Institutional policy authority must never be automatically inferred for professors", () => {
    const prof = ExpertIntelligenceModel.createExpert({
      name: "GS. AI Researcher",
      hasRegistrarAuthority: false
    });
    const claim = ExpertIntelligenceModel.createExpertClaim({
      domain: "ACADEMIC_REGULATION",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });
    const res = ExpertScopeEngine.evaluateClaimScope(prof, claim);
    assert.strictEqual(res.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
  });
});
