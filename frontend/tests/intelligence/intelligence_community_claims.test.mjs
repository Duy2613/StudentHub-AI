/**
 * StudentHub AI — T3 Community Claims & Consensus Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { CommunityClaimExtractor } from "../../src/lib/intelligence/community/CommunityClaimExtractor.js";
import { CommunityConsensusEngine } from "../../src/lib/intelligence/community/CommunityConsensusEngine.js";
import { CommunityCorrectionSystem, CORRECTION_STATUS } from "../../src/lib/intelligence/community/CommunityCorrectionSystem.js";
import { ProvenanceGraph } from "../../src/lib/intelligence/fabric/ProvenanceGraph.js";

describe("T3 Community Intelligence & Claim Governance", () => {
  beforeEach(() => {
    ProvenanceGraph.clear();
    CommunityCorrectionSystem.clear();
  });

  it("should extract structured claim while strictly preserving original post text for provenance", () => {
    const rawPost = {
      postId: "post_999",
      authorId: "student:24110001",
      content: "Mọi người ơi cho mình hỏi học phí kỳ này được gia hạn đến khi nào ạ?",
      topicHint: "academic.tuition",
      createdAt: "2026-08-26T10:00:00Z"
    };

    const extraction = CommunityClaimExtractor.extractClaimsFromPost(rawPost);
    assert.ok(extraction.claim.claimId);
    assert.strictEqual(extraction.preservedRawText, rawPost.content);
    assert.strictEqual(extraction.claim.originalText, rawPost.content);

    // Verify Provenance Graph record
    const lineage = ProvenanceGraph.getProvenanceForEntity(extraction.claim.claimId);
    assert.strictEqual(lineage.length, 1);
    assert.strictEqual(lineage[0].targetEntityType, "CLAIM");
  });

  it("should evaluate consensus and preserve minority opinion signals", () => {
    const observations = [
      { studentId: "s1", stance: "SUPPORT", evidenceAttached: true, cohort: "K24" },
      { studentId: "s2", stance: "SUPPORT", evidenceAttached: false, cohort: "K24" },
      { studentId: "s3", stance: "SUPPORT", evidenceAttached: true, cohort: "K23" },
      { studentId: "s4", stance: "OPPOSE", evidenceAttached: true, cohort: "K22 CLC", commentary: "Khóa mình áp dụng thông tư khác" }
    ];

    const consensus = CommunityConsensusEngine.evaluateConsensus({
      claimId: "claim_test_1",
      observations
    });

    assert.strictEqual(consensus.independentContributorCount, 4);
    assert.strictEqual(consensus.consensusStatus, "MODERATE_CONSENSUS");
    assert.ok(consensus.majorityView.percentage >= 65);

    // Minority Signal must be preserved, not suppressed!
    assert.strictEqual(consensus.minoritySignals.length, 1);
    assert.ok(consensus.minoritySignals[0].explanation.includes("K22 CLC"));
  });

  it("should track proposed corrections without destroying historical claim state", () => {
    const correction = CommunityCorrectionSystem.proposeCorrection({
      claimId: "claim_001",
      originalStatement: "Hạn chót nộp hồ sơ là 10/03/2026",
      correctedStatement: "Hạn chót nộp hồ sơ được gia hạn tới 15/03/2026",
      reason: "Phòng Đào tạo đã ra Thông báo số 128 gia hạn đợt 1",
      authorId: "student:24110001"
    });

    assert.strictEqual(correction.status, CORRECTION_STATUS.PROPOSED);

    // Resolve correction by authorized validator
    const resolved = CommunityCorrectionSystem.resolveCorrection(correction.correctionId, {
      status: CORRECTION_STATUS.ACCEPTED,
      validatorId: "expert:academic_advisor_01",
      reviewNotes: "Đã đối chiếu Thông báo 128/TB-ĐTH chính thức."
    });

    assert.strictEqual(resolved.status, CORRECTION_STATUS.ACCEPTED);

    // Check history
    const history = CommunityCorrectionSystem.getCorrectionsForClaim("claim_001");
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].originalStatement, "Hạn chót nộp hồ sơ là 10/03/2026");
  });
});
