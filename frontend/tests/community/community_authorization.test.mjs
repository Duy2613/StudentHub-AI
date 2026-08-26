import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityIntelligenceModel } from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityAuthorizationPrivacy", () => {
  it("should conceal internal behavioral scores and private device fingerprints from public payload", () => {
    const author = CommunityIntelligenceModel.createAuthor({
      authorId: "SV21110999",
      cohort: "K21",
      participationHistory: { postCount: 50, internalRiskScore: 0.12 },
      citationBehavior: { linksSharedCount: 4 }
    });

    const publicView = CommunityIntelligenceModel.redactForPublic(author);
    assert.strictEqual(publicView.authorId, undefined);
    assert.strictEqual(publicView.participationHistory, undefined);
    assert.strictEqual(publicView.citationBehavior, undefined);
    assert.ok(publicView.authorHash);
  });
});
