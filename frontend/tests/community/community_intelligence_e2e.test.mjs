import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CommunityStore } from "../../src/lib/intelligence/community/communityStore.js";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CONSENSUS_SIGNAL
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityIntelligenceE2E", () => {
  beforeEach(() => {
    CommunityStore.clear();
  });

  it("should run full E2E flow: load stored experiences -> evaluate consensus -> calculate median duration", () => {
    const toeicPosts = CommunityStore.getPostsByTopic("TOEIC_SUBMISSION_TIME");
    assert.ok(toeicPosts.length >= 3);

    const consensus = CommunityExperienceEngine.evaluateConsensus("TOEIC_SUBMISSION_TIME", toeicPosts);

    assert.strictEqual(consensus.consensusSignal, CONSENSUS_SIGNAL.STRONG_EXPERIENCE_CONSENSUS);
    assert.strictEqual(consensus.independentAccountsCount, 3);
    assert.strictEqual(consensus.medianProcedureDays, 7);
    assert.ok(consensus.summary.includes("7 ngày"));
  });
});
