import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import { CommunityProvenanceEngine } from "../../src/lib/intelligence/community/communityProvenanceEngine.js";
import {
  CommunityIntelligenceModel,
  AUTHOR_IDENTITY_STATE,
  CONSENSUS_STATE
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityV2PropertyTests", () => {
  it("Property 1: Idempotency — Clustering identical post arrays produces identical provenance clusters", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({ authorId: "A1", body: "Kinh nghiệm 1" }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "A2", body: "Kinh nghiệm 2" })
    ];

    const res1 = CommunityProvenanceEngine.clusterProvenance(posts);
    const res2 = CommunityProvenanceEngine.clusterProvenance(posts);

    assert.strictEqual(res1.clusterCount, res2.clusterCount);
    assert.strictEqual(res1.isSyndicated, res2.isSyndicated);
    assert.strictEqual(res1.independentObservationUnits, res2.independentObservationUnits);
  });

  it("Property 2: Upvote & Like count changes have ZERO effect on consensus determination", () => {
    const p1 = CommunityIntelligenceModel.createCommunityPost({ authorId: "A1", body: "Báo cáo A", upvotes: 0 });
    const p2 = CommunityIntelligenceModel.createCommunityPost({ authorId: "A1", body: "Báo cáo A", upvotes: 9999 });

    const eval0 = CommunityExperienceEngine.evaluateConsensus("TOPIC_A", [p1]);
    const eval9999 = CommunityExperienceEngine.evaluateConsensus("TOPIC_A", [p2]);

    assert.strictEqual(eval0.consensusState, eval9999.consensusState);
    assert.strictEqual(eval0.independentAuthorsCount, eval9999.independentAuthorsCount);
  });

  it("Property 3: Client cannot inject official authority into community author profile", () => {
    const author = CommunityIntelligenceModel.createAuthor({
      authorId: "ANON_HACKER",
      verificationState: AUTHOR_IDENTITY_STATE.VERIFIED_IDENTITY,
      verifiedIdentity: "FACULTY_STAFF"
    });

    assert.strictEqual(author.authorId, "ANON_HACKER");
    assert.strictEqual(author.authorHash.startsWith("ANON"), true);
  });

  it("Property 4: Duplicate post array never produces extra independent units", () => {
    const basePost = CommunityIntelligenceModel.createCommunityPost({ authorId: "S1", body: "Text copy" });
    const copies = Array(10).fill(basePost);

    const res = CommunityProvenanceEngine.clusterProvenance(copies);
    assert.strictEqual(res.independentObservationUnits, 1);
  });
});
