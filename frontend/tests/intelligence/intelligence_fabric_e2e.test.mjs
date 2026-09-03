/**
 * StudentHub AI — T1–T4 Intelligence Fabric End-to-End Test Suite
 * Tests the complete closed-loop lifecycle:
 * Post -> Extract Claim -> Attach Evidence -> Detect Contradictions -> Resolve Conflict -> Calibrate Confidence -> Grounded Recommendation -> Outcome Feedback.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { ClaimEntity, CLAIM_STATUS } from "../../src/lib/intelligence/fabric/ClaimEntity.js";
import { EvidenceEntity, EVIDENCE_TYPE, EVIDENCE_DIRECTNESS } from "../../src/lib/intelligence/fabric/EvidenceEntity.js";
import { SourceEntity, SOURCE_TYPE } from "../../src/lib/intelligence/fabric/SourceEntity.js";
import { ProvenanceGraph } from "../../src/lib/intelligence/fabric/ProvenanceGraph.js";
import { ReputationGraph, REPUTATION_ACTION } from "../../src/lib/intelligence/fabric/ReputationGraph.js";
import { TrustIntelligenceEngine } from "../../src/lib/intelligence/trust/TrustIntelligenceEngine.js";
import { ExpertDiscoveryEngine } from "../../src/lib/intelligence/expert/ExpertDiscoveryEngine.js";
import { CommunityClaimExtractor } from "../../src/lib/intelligence/community/CommunityClaimExtractor.js";
import { CommunityConsensusEngine } from "../../src/lib/intelligence/community/CommunityConsensusEngine.js";
import { ContradictionEngine, CONTRADICTION_TYPE } from "../../src/lib/intelligence/fusion/ContradictionEngine.js";
import { ConflictResolutionEngine, RESOLUTION_VERDICT } from "../../src/lib/intelligence/fusion/ConflictResolutionEngine.js";
import { ConfidenceCalibrationEngine } from "../../src/lib/intelligence/fusion/ConfidenceCalibrationEngine.js";
import { AiRecommendationEngine } from "../../src/lib/intelligence/recommendation/AiRecommendationEngine.js";
import { OutcomeFeedbackEngine, OUTCOME_STATUS } from "../../src/lib/intelligence/recommendation/OutcomeFeedbackEngine.js";

describe("T1–T4 Intelligence Fabric — End-to-End Closed Loop", () => {
  beforeEach(() => {
    ProvenanceGraph.clear();
    ReputationGraph.clear();
    ConfidenceCalibrationEngine.clear();
    OutcomeFeedbackEngine.clear();
  });

  it("should execute full pipeline from student post to calibrated AI recommendation and outcome feedback", () => {
    // 1. Ingest raw student community observation
    const rawPost = {
      postId: "post_1001",
      authorId: "student:24110001",
      content: "Cho mình hỏi rớt Giải tích 1 trong HK1 thì HK2 có được đăng ký Giải tích 2 không mọi người?",
      topicHint: "academic.curriculum.registration",
      createdAt: "2026-08-25T08:00:00Z"
    };

    const extraction = CommunityClaimExtractor.extractClaimsFromPost(rawPost);
    assert.strictEqual(extraction.claim instanceof ClaimEntity, true);
    assert.strictEqual(extraction.topicId, "academic.curriculum.registration");
    assert.ok(extraction.claim.claimId.startsWith("claim_"));

    // 2. Attach Official Source & Evidence
    const officialSource = new SourceEntity({
      sourceType: SOURCE_TYPE.OFFICIAL,
      publisher: "Phòng Đào tạo HCMUTE",
      url: "https://online.hcmute.edu.vn/regulation/syllabus",
      publishedAt: "2026-08-20T00:00:00Z"
    });

    const officialEvidence = new EvidenceEntity({
      claimId: extraction.claim.claimId,
      sourceId: officialSource.sourceId,
      type: EVIDENCE_TYPE.OFFICIAL_REGULATION,
      contentReference: "Môn MATH141701 (Giải tích 1) là môn tiên quyết bắt buộc của môn MATH141801 (Giải tích 2).",
      authority: 0.98,
      recency: 0.95
    });

    // 3. Evaluate Community Consensus with minority observation
    const communityObservations = [
      { studentId: "student:24110002", stance: "SUPPORT", evidenceAttached: true, cohort: "K24" },
      { studentId: "student:24110003", stance: "SUPPORT", evidenceAttached: false, cohort: "K24" },
      { studentId: "student:24110004", stance: "SUPPORT", evidenceAttached: true, cohort: "K23" },
      { studentId: "student:24110005", stance: "OPPOSE", evidenceAttached: false, cohort: "K22 CLC", commentary: "Có đơn bảo lãnh thì được" }
    ];

    const consensus = CommunityConsensusEngine.evaluateConsensus({
      claimId: extraction.claim.claimId,
      observations: communityObservations
    });

    assert.strictEqual(consensus.consensusStatus, "STRONG_CONSENSUS");
    assert.strictEqual(consensus.independentContributorCount, 4);
    assert.ok(consensus.minoritySignals.length >= 1);

    // 4. Resolve Conflict & Calibrate Confidence
    const conflictResolution = ConflictResolutionEngine.resolveConflict({
      claim: extraction.claim,
      supportingEvidence: [officialEvidence],
      contradictingEvidence: [],
      contradictions: []
    });

    assert.strictEqual(conflictResolution.verdict, RESOLUTION_VERDICT.SUPPORTED);

    const confidenceAssessment = ConfidenceCalibrationEngine.evaluateConfidence({
      supportingEvidence: [officialEvidence],
      contradictingEvidence: [],
      consensusData: consensus,
      freshnessScore: 0.95
    });

    assert.ok(confidenceAssessment.overallConfidence >= 0.80);
    assert.strictEqual(confidenceAssessment.confidenceBand, "RẤT ĐÁNG TIN CẬY (HIGH)");

    // 5. Generate Grounded AI Recommendation
    const studentProfile = {
      academicSummary: { cohort: 2024, programCode: "7480103", cgpa: 2.8, earnedCredits: 18 },
      courses: [] // Has not passed MATH141701
    };

    const recResult = AiRecommendationEngine.generateAcademicRecommendations({
      subjectId: "student:24110001",
      studentProfile,
      fusedClaims: [extraction.claim],
      availableEvidence: [officialEvidence]
    });

    assert.ok(recResult.recommendations.length >= 1);
    const topRec = recResult.recommendations[0];
    assert.ok(topRec.action.includes("Giải tích 1"));
    assert.strictEqual(topRec.confidenceBand, "HIGH_CONFIDENCE");
    assert.ok(topRec.alternatives.length > 0);

    // 6. Closed-Loop Outcome Feedback
    const feedbackResult = OutcomeFeedbackEngine.recordOutcome({
      recommendationId: topRec.recommendationId,
      subjectId: "student:24110001",
      outcomeStatus: OUTCOME_STATUS.SUCCESSFUL,
      associatedClaimIds: [extraction.claim.claimId],
      associatedExpertIds: []
    });

    assert.strictEqual(feedbackResult.success, true);
    assert.strictEqual(feedbackResult.calibrationRecorded, 1);

    // Verify Brier Score is calibrated
    const brier = ConfidenceCalibrationEngine.calculateBrierScore();
    assert.strictEqual(brier.sampleSize, 1);
    assert.ok(brier.brierScore < 0.10); // Close to 0 for successful prediction!
  });
});
