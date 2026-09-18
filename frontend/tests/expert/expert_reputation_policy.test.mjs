import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateStarLevel,
  ExpertReputationPolicy,
  EXPERT_REPUTATION_POLICY_VERSION,
  STAR_THRESHOLDS,
  REPUTATION_DELTAS,
  REWARD_EVENTS_PER_NORMAL_ASSESSMENT,
} from "../../src/lib/server/expert/ExpertReputationPolicy.js";

test("ExpertReputationPolicy exports canonical constants and thresholds", () => {
  assert.equal(ExpertReputationPolicy.version, "EXPERT_REPUTATION_POLICY_V1");
  assert.equal(EXPERT_REPUTATION_POLICY_VERSION, "EXPERT_REPUTATION_POLICY_V1");
  assert.equal(REWARD_EVENTS_PER_NORMAL_ASSESSMENT, 1);
  assert.equal(REPUTATION_DELTAS.EXPERT_ASSESSMENT_COMPLETED, 5);
  assert.equal(REPUTATION_DELTAS.EXPERT_REVIEW_ACCEPTED, 0);

  assert.deepEqual(STAR_THRESHOLDS.STAR_5, { starLevel: 5, minCompletedReviews: 50, minReputation: 250 });
  assert.deepEqual(STAR_THRESHOLDS.STAR_4, { starLevel: 4, minCompletedReviews: 30, minReputation: 150 });
  assert.deepEqual(STAR_THRESHOLDS.STAR_3, { starLevel: 3, minCompletedReviews: 15, minReputation: 75 });
  assert.deepEqual(STAR_THRESHOLDS.STAR_2, { starLevel: 2, minCompletedReviews: 5, minReputation: 25 });
  assert.deepEqual(STAR_THRESHOLDS.STAR_1, { starLevel: 1, minCompletedReviews: 1, minReputation: 10 });
});

test("StarLevel derivation resolves all 4 QA expert baselines correctly", () => {
  // E0: Senior 5★ (>= 50 reviews, >= 250 rep)
  const e0Star = calculateStarLevel({ completedReviews: 50, reputation: 250, qualificationState: "ACTIVE", activationState: "ACTIVE" });
  assert.equal(e0Star, 5);

  // E1: Newly Qualified 1★ (1 review, 10 rep)
  const e1Star = calculateStarLevel({ completedReviews: 1, reputation: 10, qualificationState: "ACTIVE", activationState: "ACTIVE" });
  assert.equal(e1Star, 1);

  // E2: Mid-Level 3★ (20 reviews, 100 rep)
  const e2Star = calculateStarLevel({ completedReviews: 20, reputation: 100, qualificationState: "ACTIVE", activationState: "ACTIVE" });
  assert.equal(e2Star, 3);

  // E3: Near-Promotion 4★ (49 reviews, 245 rep)
  const e3StarBefore = calculateStarLevel({ completedReviews: 49, reputation: 245, qualificationState: "ACTIVE", activationState: "ACTIVE" });
  assert.equal(e3StarBefore, 4);

  // E3 After 1 valid Formal Assessment: 50 reviews, 250 rep -> 5★!
  const e3StarAfter = calculateStarLevel({ completedReviews: 50, reputation: 250, qualificationState: "ACTIVE", activationState: "ACTIVE" });
  assert.equal(e3StarAfter, 5);
});

test("StarLevel quality gates enforce suspension, qualification, and activation state", () => {
  // Suspended expert gets null StarLevel
  assert.equal(
    calculateStarLevel({ completedReviews: 100, reputation: 500, qualificationState: "ACTIVE", activationState: "ACTIVE", suspendedAt: new Date() }),
    null
  );

  // Unqualified expert gets null StarLevel
  assert.equal(
    calculateStarLevel({ completedReviews: 50, reputation: 250, qualificationState: "NOT_APPLIED", activationState: "ACTIVE" }),
    null
  );

  // Inactive activation state gets null StarLevel
  assert.equal(
    calculateStarLevel({ completedReviews: 50, reputation: 250, qualificationState: "ACTIVE", activationState: "PENDING_ACTIVATION" }),
    null
  );

  // Fresh expert with 0 reviews and 0 reputation gets null StarLevel
  assert.equal(
    calculateStarLevel({ completedReviews: 0, reputation: 0, qualificationState: "ACTIVE", activationState: "ACTIVE" }),
    null
  );
});
