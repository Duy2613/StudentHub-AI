import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionModel } from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionAuthorizationTestSuite", () => {
  it("should prevent cross-student private data leakage during public serialization", () => {
    const rawData = {
      knowledgeObjectId: "KNO_AUTH_CHECK",
      communityReality: {
        firstHandEvidence: [
          { authorId: "STUDENT_SECRET_ID", ip: "10.0.0.1", statement: "Báo cáo nộp" }
        ]
      }
    };

    const redacted = EvidenceFusionModel.redactForPublic(rawData);
    assert.strictEqual(redacted.communityReality.firstHandEvidence[0].authorId, undefined);
    assert.strictEqual(redacted.communityReality.firstHandEvidence[0].ip, undefined);
  });
});
