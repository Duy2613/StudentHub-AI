import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ExpertStore } from "../../src/lib/intelligence/expert/expertStore.js";
import { ExpertEntityResolver } from "../../src/lib/intelligence/expert/expertEntityResolver.js";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import { ExpertDisagreementMap } from "../../src/lib/intelligence/expert/expertDisagreementMap.js";
import { ExpertContextEngine } from "../../src/lib/intelligence/expert/expertContextEngine.js";
import {
  ExpertIntelligenceModel,
  RESOLUTION_STATUS,
  EXPERT_CLAIM_STATUS,
  JURISDICTION_TYPE
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertV2GoldenScenariosE2E", () => {
  beforeEach(() => {
    ExpertStore.clear();
  });

  it("Scenario A: Known HCMUTE professor with verified profile resolves to EXACT_MATCH", () => {
    const res = ExpertStore.resolveIdentity({ orcid: "0000-0002-1825-0097" });
    assert.strictEqual(res.status, RESOLUTION_STATUS.EXACT_MATCH);
    assert.strictEqual(res.expert.expertId, "EXP_DR_MINH_AI");
    assert.strictEqual(res.expert.isVerified, true);
  });

  it("Scenario B: Same-name query with ambiguous institution resolves to IDENTITY_AMBIGUOUS", () => {
    const res = ExpertEntityResolver.resolve({ name: "Nguyễn Văn Minh", institution: "Đại Học Bách Khoa" }, ExpertStore.getAllExperts());
    assert.strictEqual(res.status, RESOLUTION_STATUS.IDENTITY_AMBIGUOUS);
    assert.strictEqual(res.expert, null);
  });

  it("Scenario C: Verified AI researcher asked about HCMUTE tuition regulation is flagged as AUTHORITY_MISMATCH", () => {
    const expMinh = ExpertStore.getExpert("EXP_DR_MINH_AI");
    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Năm 2026 trường sẽ miễn toàn bộ học phí cho sinh viên ngành AI.",
      domain: "TUITION_POLICY",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });

    const evalResult = ExpertScopeEngine.evaluateClaimScope(expMinh, claim);
    assert.strictEqual(evalResult.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
    assert.strictEqual(evalResult.isWithinJurisdiction, false);
  });

  it("Scenario D: Former department head from 2022 has historical role preserved while current role is inactive", () => {
    const expHoang = ExpertStore.getExpert("EXP_PROF_HOANG_FORMER_REGISTRAR");
    assert.strictEqual(expHoang.hasRegistrarAuthority, false);
    assert.strictEqual(expHoang.roles[0].isCurrent, false);
  });

  it("Scenario E: Expert citing retracted publication triggers automatic retraction cascade", () => {
    // Add publication and claim citing DOI
    const doi = "10.1109/retracted.2023";
    ExpertStore.upsertClaim({
      claimId: "CLM_TO_RETRACT",
      expertId: "EXP_DR_MINH_AI",
      statement: "Nhận định dựa trên công trình cũ.",
      citedPublicationDoi: doi
    });

    const affected = ExpertStore.retractPublication(doi);
    assert.strictEqual(affected.length, 1);
    assert.strictEqual(affected[0].status, "NEEDS_REEVALUATION");
    assert.strictEqual(affected[0].isRetracted, true);
  });

  it("Scenario F: Three experts citing the same study collapse into 1 provenance cluster", () => {
    const claims = [
      ExpertIntelligenceModel.createExpertClaim({ expertId: "EXP_1", citedEvidenceIds: ["DOI_SAME"] }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "EXP_2", citedEvidenceIds: ["DOI_SAME"] }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "EXP_3", citedEvidenceIds: ["DOI_SAME"] })
    ];

    const consensus = ExpertScopeEngine.clusterExpertConsensus(claims);
    assert.strictEqual(consensus.clusterCount, 1);
    assert.strictEqual(consensus.isIndependentConsensus, false);
  });

  it("Scenario G: Two experts disagreeing produces structured Disagreement Map", () => {
    const expMinh = ExpertStore.getExpert("EXP_DR_MINH_AI");
    const expLan = ExpertStore.getExpert("EXP_TS_LAN_EDTECH");

    const disMap = ExpertDisagreementMap.analyzeDisagreement({
      topic: "Ứng dụng AI trong chấm thi",
      expertA: expMinh,
      claimA: { statement: "AI chấm chính xác 90%." },
      expertB: expLan,
      claimB: { statement: "AI cần giảng viên kiểm tra lại." }
    });

    assert.strictEqual(disMap.expertA.name, expMinh.name);
    assert.strictEqual(disMap.expertB.name, expLan.name);
    assert.ok(disMap.analysis.length > 20);
  });

  it("Scenario H: Fake professor account remains UNVERIFIED", () => {
    const expFake = ExpertStore.getExpert("EXP_FAKE_CLONE");
    assert.strictEqual(expFake.isVerified, false);
    assert.strictEqual(expFake.status, "UNVERIFIED_EXPERT");
  });
});
