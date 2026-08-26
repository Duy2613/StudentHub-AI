import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ExpertIntelligenceModel,
  CLAIM_TYPE,
  CLAIM_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertClaims", () => {
  it("should preserve claim versioning and immutable history across revisions", () => {
    const claimV1 = ExpertIntelligenceModel.createExpertClaim({
      claimId: "CLAIM_V1",
      expertId: "EXP_1",
      text: "Thuật toán A đạt độ chính xác 95%.",
      version: 1,
      supersededByClaimId: "CLAIM_V2"
    });

    const claimV2 = ExpertIntelligenceModel.createExpertClaim({
      claimId: "CLAIM_V2",
      expertId: "EXP_1",
      text: "Đính chính: Thuật toán A đạt độ chính xác 92% trên tập test mở rộng.",
      version: 2,
      status: CLAIM_STATUS.SUPPORTED
    });

    assert.strictEqual(claimV1.status, CLAIM_STATUS.CORRECTED);
    assert.strictEqual(claimV1.supersededByClaimId, "CLAIM_V2");
    assert.strictEqual(claimV2.status, CLAIM_STATUS.SUPPORTED);
    assert.strictEqual(claimV2.version, 2);
  });
});
