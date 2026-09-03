/**
 * StudentHub AI — T2 Expert Discovery & Historical Reliability Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { ExpertDiscoveryEngine } from "../../src/lib/intelligence/expert/ExpertDiscoveryEngine.js";
import { ExpertReliabilityTracker } from "../../src/lib/intelligence/expert/ExpertReliabilityTracker.js";
import { EXPERT_STATUS } from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("T2 Expert Intelligence & Scope Boundaries", () => {
  beforeEach(() => {
    ExpertReliabilityTracker.clear();
  });

  it("should discover and rank experts by topic relevance and verification status", () => {
    const discovery = ExpertDiscoveryEngine.discoverExperts({
      topic: "Giải tích 1",
      limit: 5
    });

    assert.ok(discovery.totalMatched >= 1);
    const top = discovery.topMatches[0];
    assert.ok(top.expertId);
    assert.ok(top.signals.domainMatchPercentage > 50);
    assert.ok(top.signals.historicalAccuracyPercentage > 50);
  });

  it("should separate disciplinary domain expertise from historical reliability", () => {
    const expertId = "expert:math_prof_01";

    // Record 3 claims: 2 confirmed by peer reviews, 1 disputed
    ExpertReliabilityTracker.recordExpertClaim({
      expertId,
      claimId: "claim_01",
      topicId: "academic.curriculum",
      statement: "Quy chế 2026 cho phép đăng ký tối đa 24 tín chỉ."
    });
    ExpertReliabilityTracker.updateClaimOutcome(expertId, "claim_01", "VALIDATED");

    ExpertReliabilityTracker.recordExpertClaim({
      expertId,
      claimId: "claim_02",
      topicId: "academic.curriculum",
      statement: "Học phần Giải tích 1 được miễn nếu có điểm SAT Math >= 700."
    });
    ExpertReliabilityTracker.updateClaimOutcome(expertId, "claim_02", "VALIDATED");

    ExpertReliabilityTracker.recordExpertClaim({
      expertId,
      claimId: "claim_03",
      topicId: "academic.curriculum",
      statement: "Hạn đóng học phí kéo dài đến tuần 12."
    });
    ExpertReliabilityTracker.updateClaimOutcome(expertId, "claim_03", "CONTRADICTED");

    const reliability = ExpertReliabilityTracker.getExpertReliability(expertId);
    assert.strictEqual(reliability.totalClaims, 3);
    assert.strictEqual(reliability.confirmedClaims, 2);
    assert.strictEqual(reliability.disputedClaims, 1);
    assert.ok(reliability.historicalAccuracy < 1.0 && reliability.historicalAccuracy > 0.4);
  });
});
