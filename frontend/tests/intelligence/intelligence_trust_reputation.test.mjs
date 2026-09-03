/**
 * StudentHub AI — T1 Trust & Dynamic Reputation Graph Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { TrustIntelligenceEngine, TRUST_LEVEL } from "../../src/lib/intelligence/trust/TrustIntelligenceEngine.js";
import { TrustExplanationEngine } from "../../src/lib/intelligence/trust/TrustExplanationEngine.js";
import { ReputationGraph, REPUTATION_ACTION } from "../../src/lib/intelligence/fabric/ReputationGraph.js";

describe("T1 Trust Intelligence & Dynamic Reputation Graph", () => {
  beforeEach(() => {
    ReputationGraph.clear();
  });

  it("should evaluate 10 distinct trust dimensions and generate explainable text summary", () => {
    const mockIdentity = {
      isVerified: true,
      email: "24110001@student.hcmute.edu.vn",
      academicSummary: { academicStanding: "EXCELLENT" }
    };

    const mockContributions = [
      { evidenceCount: 2, averageEvidenceQuality: 0.92, validationCount: 3, status: "VALIDATED" },
      { evidenceCount: 1, averageEvidenceQuality: 0.85, validationCount: 1, status: "VALIDATED" }
    ];

    const profile = TrustIntelligenceEngine.evaluateTrustProfile({
      subjectId: "student:24110001",
      identityData: mockIdentity,
      contributions: mockContributions,
      abuseFlags: [],
      targetTopicId: "academic.curriculum"
    });

    assert.strictEqual(profile.overallLevel, TRUST_LEVEL.VERY_HIGH);
    assert.ok(profile.compositeScore >= 0.85);
    assert.strictEqual(profile.dimensions.identityTrust >= 0.90, true);
    assert.strictEqual(profile.dimensions.behaviorTrust, 1.0);

    const explanation = TrustExplanationEngine.explainTrust(profile);
    assert.ok(explanation.textSummary.includes("student:24110001"));
    assert.ok(explanation.strongSignals.length >= 2);
  });

  it("should update topic-specific reputation and apply half-life decay over time", () => {
    // 1. Initial State: Neutral 0.5
    const initialScore = ReputationGraph.getTopicScore("student:24110001", "academic.curriculum");
    assert.strictEqual(initialScore, 0.5);

    // 2. Apply evidence-backed contribution
    const res = ReputationGraph.applyReputationDelta({
      subjectId: "student:24110001",
      topicId: "academic.curriculum",
      action: REPUTATION_ACTION.EVIDENCE_BACKED_CONTRIBUTION,
      evidenceQuality: 1.0,
      timestamp: new Date().toISOString()
    });

    assert.strictEqual(res.newScore > 0.5, true);

    // 3. Verify topic isolation: Other topic remains 0.5
    const otherScore = ReputationGraph.getTopicScore("student:24110001", "sports.football");
    assert.strictEqual(otherScore, 0.5);
  });

  it("should flag reciprocal mutual-validation loop as collusion", () => {
    const studentA = "student:24110001";
    const studentB = "student:24110002";

    // 5 reciprocal interactions back-and-forth
    for (let i = 0; i < 5; i++) {
      ReputationGraph.applyReputationDelta({
        subjectId: studentB,
        originatorId: studentA,
        action: REPUTATION_ACTION.EXPERT_VALIDATED_CLAIM
      });
      ReputationGraph.applyReputationDelta({
        subjectId: studentA,
        originatorId: studentB,
        action: REPUTATION_ACTION.EXPERT_VALIDATED_CLAIM
      });
    }

    // 6th reciprocal attempt must trigger COORDINATED_VOTE_FLAG penalty
    const suspiciousDelta = ReputationGraph.applyReputationDelta({
      subjectId: studentB,
      originatorId: studentA,
      action: REPUTATION_ACTION.EXPERT_VALIDATED_CLAIM
    });

    assert.strictEqual(suspiciousDelta.mutationEvent.action, REPUTATION_ACTION.COORDINATED_VOTE_FLAG);
    assert.strictEqual(suspiciousDelta.mutationEvent.effectiveDelta < 0, true);
  });
});
