import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import { COORDINATION_RISK } from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunitySyntheticContent", () => {
  it("should classify repetitive synthetic phrasing as SUSPECTED_SYNTHETIC with caution", () => {
    const aiPosts = [
      { body: "Tổng kết lại rằng với tư cách là một sinh viên, quy trình này rất hữu ích và đáng cân nhắc." },
      { body: "Tổng kết lại rằng trong bối cảnh học thuật số, môn học rất hữu ích và đáng cân nhắc." },
      { body: "Tổng kết lại rằng với tư cách là một sinh viên, việc nộp đơn rất hữu ích và đáng cân nhắc." }
    ];

    const result = CommunityExperienceEngine.detectCoordinationRisk(aiPosts);
    assert.strictEqual(result.risk, COORDINATION_RISK.SUSPECTED_SYNTHETIC);
    assert.ok(result.reason.includes("AI-generated"));
  });
});
