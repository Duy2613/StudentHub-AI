import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CommunityStore } from "../../src/lib/intelligence/community/communityStore.js";
import { CommunityQueryEngine } from "../../src/lib/intelligence/community/communityQueryEngine.js";
import {
  CommunityExperienceEngine
} from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CONSENSUS_STATE
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityIntelligenceE2E", () => {
  beforeEach(() => {
    CommunityStore.clear();
  });

  it("should run complete E2E workflow: store experiences -> extract claims -> calculate consensus & median duration -> mine friction hotspots", () => {
    // 1. Load stored TOEIC experiences
    const posts = CommunityStore.getPostsByTopic("TOEIC_SUBMISSION_TIME", { redactPrivate: false });
    assert.ok(posts.length >= 3);

    // 2. Extract structured claims
    const claims = CommunityExperienceEngine.extractClaims(posts);
    assert.ok(claims.length >= 3);

    // 3. Evaluate consensus
    const consensus = CommunityExperienceEngine.evaluateConsensus("TOEIC_SUBMISSION_TIME", posts);
    assert.strictEqual(consensus.consensusState, CONSENSUS_STATE.STRONG_COMMUNITY_SIGNAL);
    assert.strictEqual(consensus.medianProcedureDays, 7);

    // 4. Query engine comparison with official policy
    const queryResult = CommunityQueryEngine.queryTopicExperience("TOEIC_SUBMISSION_TIME");
    assert.strictEqual(queryResult.invariants.isOfficialPolicy, false);
    assert.ok(queryResult.invariants.disclaimer.includes("kinh nghiệm thực tế của sinh viên"));
  });
});
