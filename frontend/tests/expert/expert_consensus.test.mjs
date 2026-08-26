import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import { ExpertIntelligenceModel } from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertConsensus", () => {
  it("should cluster claims citing the same paper into a single shared evidence cluster rather than independent consensus", () => {
    const claims = [
      ExpertIntelligenceModel.createExpertClaim({ expertId: "EXP_1", citedEvidenceIds: ["PAPER_DOI_001"], text: "Mô hình A đạt 99%." }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "EXP_2", citedEvidenceIds: ["PAPER_DOI_001"], text: "Đồng ý mô hình A đạt 99%." }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "EXP_3", citedEvidenceIds: ["PAPER_DOI_001"], text: "Xác nhận kết quả mô hình A." })
    ];

    const result = ExpertScopeEngine.clusterExpertConsensus(claims);
    assert.strictEqual(result.clusterCount, 1);
    assert.strictEqual(result.isIndependentConsensus, false);
    assert.ok(result.explanation.includes("Cụm bằng chứng dùng chung"));
  });

  it("should recognize true independent consensus when >= 3 experts provide independent evidence", () => {
    const independentClaims = [
      ExpertIntelligenceModel.createExpertClaim({ expertId: "EXP_1", citedEvidenceIds: ["PAPER_DOI_001"], text: "Kết quả độc lập nhóm 1." }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "EXP_2", citedEvidenceIds: ["PAPER_DOI_002"], text: "Kết quả độc lập nhóm 2." }),
      ExpertIntelligenceModel.createExpertClaim({ expertId: "EXP_3", citedEvidenceIds: ["PAPER_DOI_003"], text: "Kết quả độc lập nhóm 3." })
    ];

    const result = ExpertScopeEngine.clusterExpertConsensus(independentClaims);
    assert.strictEqual(result.clusterCount, 3);
    assert.strictEqual(result.isIndependentConsensus, true);
  });
});
