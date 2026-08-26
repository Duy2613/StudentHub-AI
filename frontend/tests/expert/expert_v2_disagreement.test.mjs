import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertDisagreementMap } from "../../src/lib/intelligence/expert/expertDisagreementMap.js";
import {
  ExpertIntelligenceModel,
  DISAGREEMENT_REASON,
  EXPERTISE_LEVEL
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertV2DisagreementMap", () => {
  const expertMinh = ExpertIntelligenceModel.createExpert({
    expertId: "EXP_MINH",
    name: "TS. Nguyễn Văn Minh",
    institution: "HCMUTE",
    scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.ESTABLISHED }]
  });

  const expertLan = ExpertIntelligenceModel.createExpert({
    expertId: "EXP_LAN",
    name: "TS. Lê Thị Lan",
    institution: "HCMUTE",
    scopes: [{ domain: "EDTECH", level: EXPERTISE_LEVEL.ESTABLISHED }]
  });

  it("should generate a structured Disagreement Map between two experts without choosing an arbitrary winner", () => {
    const claimA = ExpertIntelligenceModel.createExpertClaim({
      expertId: expertMinh.expertId,
      statement: "LLM có thể tự động chấm bài code chính xác 90%.",
      domain: "AI_ML"
    });

    const claimB = ExpertIntelligenceModel.createExpertClaim({
      expertId: expertLan.expertId,
      statement: "Đánh giá đồ án cần tương tác trực tiếp, LLM dễ gây ngụy biện điểm số.",
      domain: "EDTECH"
    });

    const map = ExpertDisagreementMap.analyzeDisagreement({
      topic: "Tự động chấm điểm đồ án bằng AI",
      domain: "AI_ML",
      expertA: expertMinh,
      claimA,
      evidenceA: ["Thực nghiệm trên 250 sinh viên FIT HCMUTE."],
      expertB: expertLan,
      claimB,
      evidenceB: ["Khảo sát sư phạm trên 400 sinh viên."],
      divergenceReason: DISAGREEMENT_REASON.DIFFERENT_METHODOLOGIES
    });

    assert.strictEqual(map.topic, "Tự động chấm điểm đồ án bằng AI");
    assert.strictEqual(map.expertA.name, "TS. Nguyễn Văn Minh");
    assert.strictEqual(map.expertB.name, "TS. Lê Thị Lan");
    assert.strictEqual(map.divergenceReason, DISAGREEMENT_REASON.DIFFERENT_METHODOLOGIES);
    assert.ok(map.analysis.includes("TS. Nguyễn Văn Minh"));
    assert.ok(map.analysis.includes("TS. Lê Thị Lan"));
  });

  it("should detect disagreement reasons across datasets, cohorts, and timeframes", () => {
    const reasons = [
      DISAGREEMENT_REASON.DIFFERENT_DATASETS,
      DISAGREEMENT_REASON.DIFFERENT_COHORTS,
      DISAGREEMENT_REASON.DIFFERENT_TIMEFRAMES,
      DISAGREEMENT_REASON.DIFFERENT_METHODOLOGIES
    ];

    for (const r of reasons) {
      const map = ExpertDisagreementMap.analyzeDisagreement({
        expertA: expertMinh,
        claimA: { statement: "Claim 1" },
        expertB: expertLan,
        claimB: { statement: "Claim 2" },
        divergenceReason: r
      });
      assert.strictEqual(map.divergenceReason, r);
      assert.ok(map.analysis.length > 10);
    }
  });
});
