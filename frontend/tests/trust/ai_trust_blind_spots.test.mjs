import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BlindSpotDetector } from "../../src/lib/intelligence/trust/blindSpotDetector.js";
import {
  AiTrustModel,
  BLIND_SPOT_TYPE
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustBlindSpots", () => {
  it("should discover missing cohort scope and emit structured Knowledge Gap Report", () => {
    const claim = AiTrustModel.createClaim({
      text: "Hạn chót đăng ký khóa luận tốt nghiệp là ngày 15/09",
      scope: "K24"
    });

    const generalEvidence = [
      AiTrustModel.createEvidenceSpan({
        passage: "Hạn chót đăng ký khóa luận tốt nghiệp là ngày 15/09 cho toàn trường."
      })
    ];

    const gapReport = BlindSpotDetector.detectBlindSpots(claim, generalEvidence, { cohort: "K24" });
    assert.ok(gapReport.blindSpots.some(b => b.type === BLIND_SPOT_TYPE.MISSING_COHORT_SCOPE));
    assert.strictEqual(gapReport.requiredEvidenceRequests.length, 1);
  });
});
