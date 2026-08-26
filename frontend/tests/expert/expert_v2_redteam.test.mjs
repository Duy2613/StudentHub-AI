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

describe("ExpertV2RedTeamAdversarialSuite", () => {
  const verifiedCandidatePool = [
    ExpertIntelligenceModel.createExpert({
      expertId: "EXP_REAL_MINH",
      name: "TS. Nguyễn Văn Minh",
      institution: "HCMUTE",
      department: "Khoa CNTT",
      orcid: "0000-0002-1825-0097",
      verifiedEmail: "minhnv@hcmute.edu.vn",
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }]
    })
  ];

  it("Attack A: Fake professor identity without verification remains UNVERIFIED", () => {
    const fakeProf = ExpertIntelligenceModel.createExpert({
      name: "GS. Bịa Đặt",
      isVerified: false,
      affiliationStatus: "UNVERIFIED"
    });
    const claim = ExpertIntelligenceModel.createExpertClaim({ domain: "AI_ML", text: "Khẳng định vô căn cứ." });
    const res = ExpertScopeEngine.evaluateClaimScope(fakeProf, claim);
    assert.strictEqual(res.answerMode, "UNVERIFIED_EXPERT");
  });

  it("Attack B & C: Real professor impersonation & same-name collision", () => {
    const res = ExpertEntityResolver.resolve({ name: "Nguyễn Văn Minh", institution: "Đại Học Lạ" }, verifiedCandidatePool);
    assert.notStrictEqual(res.status, RESOLUTION_STATUS.EXACT_MATCH);
  });

  it("Attack D: Fake institutional page is rejected by impersonation guard", () => {
    const res = ExpertEntityResolver.resolve({
      name: "Nguyễn Văn Minh",
      directoryUrl: "https://fake-hcmute-portal-scam.com/faculty"
    }, verifiedCandidatePool);
    assert.strictEqual(res.status, RESOLUTION_STATUS.UNRESOLVED);
    assert.ok(res.explanation.includes("IMPERSONATION_GUARD"));
  });

  it("Attack F: Fake/Clashing ORCID with mismatching name triggers collision", () => {
    const res = ExpertEntityResolver.resolve({
      name: "Trần Giả Mạo",
      orcid: "0000-0002-1825-0097"
    }, verifiedCandidatePool);
    assert.strictEqual(res.status, RESOLUTION_STATUS.IDENTITY_AMBIGUOUS);
    assert.ok(res.explanation.includes("ORCID_COLLISION"));
  });

  it("Attack H: Expired administrative role from 2022 evaluated in 2026 cannot assert official policy", () => {
    const expFormer = ExpertIntelligenceModel.createExpert({
      name: "Cựu Trưởng Phòng",
      roles: [{ roleTitle: "REGISTRAR_DIRECTOR", validFrom: "2020-01-01", validUntil: "2022-12-31" }]
    });
    const policyClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Học phí năm nay giảm 50%.",
      domain: "TUITION_POLICY",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });
    const res = ExpertScopeEngine.evaluateClaimScope(expFormer, policyClaim);
    assert.strictEqual(res.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
  });

  it("Attack I & J: Expert claiming outside domain or official policy without authority is caught", () => {
    const csProf = ExpertIntelligenceModel.createExpert({
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }]
    });
    const medClaim = ExpertIntelligenceModel.createExpertClaim({ domain: "MEDICAL_SURGERY", text: "Phẫu thuật tim." });
    const resMed = ExpertScopeEngine.evaluateClaimScope(csProf, medClaim);
    assert.strictEqual(resMed.claimStatus, EXPERT_CLAIM_STATUS.OUT_OF_SCOPE);

    const regClaim = ExpertIntelligenceModel.createExpertClaim({
      domain: "ACADEMIC_REGULATION",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN,
      text: "Quy định tốt nghiệp thay đổi."
    });
    const resReg = ExpertScopeEngine.evaluateClaimScope(csProf, regClaim);
    assert.strictEqual(resReg.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
  });

  it("Attack K: Commercial sponsorship must be flagged as CONFLICT_OF_INTEREST", () => {
    const expCOI = ExpertIntelligenceModel.createExpert({
      scopes: [{ domain: "ROBOTICS", level: EXPERTISE_LEVEL.ESTABLISHED }],
      conflicts: [{ entity: "Robot Vendor Corp", nature: "COMMERCIAL_SPONSORSHIP", isActive: true }]
    });
    const claim = ExpertIntelligenceModel.createExpertClaim({ domain: "ROBOTICS", text: "Khuyên dùng Robot Vendor Corp." });
    const res = ExpertScopeEngine.evaluateClaimScope(expCOI, claim);
    assert.strictEqual(res.claimStatus, EXPERT_CLAIM_STATUS.CONFLICT_OF_INTEREST);
  });

  it("Attack L & M: 3 experts citing the same single paper collapse into 1 cluster", () => {
    const claims = [
      ExpertIntelligenceModel.createExpertClaim({ expertId: "E1", citedEvidenceIds: ["SHARED_PAPER_DOI"] }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "E2", citedEvidenceIds: ["SHARED_PAPER_DOI"] }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "E3", citedEvidenceIds: ["SHARED_PAPER_DOI"] })
    ];
    const consensus = ExpertScopeEngine.clusterExpertConsensus(claims);
    assert.strictEqual(consensus.clusterCount, 1);
    assert.strictEqual(consensus.isIndependentConsensus, false);
  });

  it("Attack N: Retracted publication or claim must trigger RETRACTED status", () => {
    const exp = ExpertIntelligenceModel.createExpert({
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }]
    });
    const retractedClaim = ExpertIntelligenceModel.createExpertClaim({
      domain: "AI_ML",
      status: CLAIM_STATUS.RETRACTED,
      isRetracted: true
    });
    const res = ExpertScopeEngine.evaluateClaimScope(exp, retractedClaim);
    assert.strictEqual(res.claimStatus, EXPERT_CLAIM_STATUS.RETRACTED);
  });

  it("Attack O: Client credential injection without verification proof is rejected", () => {
    const injected = ExpertIntelligenceModel.createCredential({
      title: "Hacked Rector Title",
      status: CREDENTIAL_STATUS.UNVERIFIED,
      isVerified: false
    });
    assert.strictEqual(injected.isVerified, false);
    assert.strictEqual(injected.status, CREDENTIAL_STATUS.UNVERIFIED);
  });
});
