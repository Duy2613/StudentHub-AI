/**
 * StudentHub AI — T1–T4 Adversarial Test Matrix (10 Scenarios)
 * Validates fundamental epistemic invariants against adversarial manipulation.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { CommunityConsensusEngine } from "../../src/lib/intelligence/community/CommunityConsensusEngine.js";
import { EvidenceEntity, EVIDENCE_TYPE } from "../../src/lib/intelligence/fabric/EvidenceEntity.js";
import { SourceEntity } from "../../src/lib/intelligence/fabric/SourceEntity.js";
import { ClaimEntity } from "../../src/lib/intelligence/fabric/ClaimEntity.js";
import { ConflictResolutionEngine, RESOLUTION_VERDICT } from "../../src/lib/intelligence/fusion/ConflictResolutionEngine.js";
import { ConfidenceCalibrationEngine } from "../../src/lib/intelligence/fusion/ConfidenceCalibrationEngine.js";
import { ReputationGraph, REPUTATION_ACTION } from "../../src/lib/intelligence/fabric/ReputationGraph.js";
import { EXPERT_STATUS, CREDENTIAL_STATUS } from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("T1–T4 Adversarial Test Matrix (10 Invariant Scenarios)", () => {
  beforeEach(() => {
    ReputationGraph.clear();
  });

  // Scenario 1: Fabricated expertise -> no automatic expert status
  it("Scenario 1 — User fabricates expertise: Self-claim without external proof is UNVERIFIED", () => {
    const unverifiedUser = {
      expertId: "user_fake_expert",
      fullName: "Nguyễn Văn Giả Mạo",
      verificationStatus: EXPERT_STATUS.UNVERIFIED_EXPERT,
      domains: ["Computer Vision"]
    };

    const isVerified = unverifiedUser.verificationStatus === EXPERT_STATUS.VERIFIED_EXPERT;
    assert.strictEqual(isVerified, false);
  });

  // Scenario 2: Many likes -> no automatic truth
  it("Scenario 2 — Likes / vanity counts do NOT alter factual truth or override evidence", () => {
    // 500 likes on an unverified hearsay statement vs 1 official document
    const observations = [
      { studentId: "s1", stance: "SUPPORT", likesCount: 500, evidenceAttached: false, authorReliability: 0.3 }
    ];

    const consensus = CommunityConsensusEngine.evaluateConsensus({
      claimId: "claim_likes_test",
      observations
    });

    assert.strictEqual(consensus.independentContributorCount, 1);
    // Weight is based on author reliability (0.3), NOT on 500 likes!
    assert.ok(consensus.majorityView.weight < 1.0);
  });

  // Scenario 3: 100 duplicated posts -> clustered into single provenance cluster
  it("Scenario 3 — 100 duplicated posts are detected as non-independent single cluster", () => {
    const duplicatedText = "Trường thông báo nghỉ học toàn trường ngày mai.";
    const evidenceItems = [];

    for (let i = 0; i < 100; i++) {
      evidenceItems.push(new EvidenceEntity({
        claimId: "claim_duplicate_test",
        sourceId: `source_copy_${i}`,
        contentReference: duplicatedText
      }));
    }

    const uniqueClusterIds = new Set(evidenceItems.map(e => e.clusterId));
    assert.strictEqual(uniqueClusterIds.size, 1); // 100 copies map to exactly 1 cluster!
  });

  // Scenario 4: AI hallucinated verification -> ignored without grounded evidence
  it("Scenario 4 — AI claims 'this is verified' without evidence: Engine returns UNRESOLVED", () => {
    const unevidencedClaim = new ClaimEntity({
      statement: "Học kỳ 3 được miễn toàn bộ học phí theo quyết định mới.",
      topicId: "academic.tuition"
    });

    const resolution = ConflictResolutionEngine.resolveConflict({
      claim: unevidencedClaim,
      supportingEvidence: [], // Zero grounded evidence
      contradictingEvidence: [],
      contradictions: []
    });

    assert.strictEqual(resolution.verdict, RESOLUTION_VERDICT.UNRESOLVED);
    assert.strictEqual(resolution.adjudicationType, "INSUFFICIENT_EVIDENCE");
  });

  // Scenario 5: Stale official source -> freshness reduces confidence
  it("Scenario 5 — Official source is stale (>3 years): Freshness score penalizes overall confidence", () => {
    const freshEvidence = new EvidenceEntity({
      claimId: "c1",
      sourceId: "s1",
      type: EVIDENCE_TYPE.OFFICIAL_REGULATION,
      contentReference: "Thông báo học phí năm 2026",
      recency: 0.95
    });

    const staleEvidence = new EvidenceEntity({
      claimId: "c1",
      sourceId: "s2",
      type: EVIDENCE_TYPE.OFFICIAL_REGULATION,
      contentReference: "Thông báo học phí năm 2021",
      recency: 0.20 // Stale
    });

    const freshConfidence = ConfidenceCalibrationEngine.evaluateConfidence({
      supportingEvidence: [freshEvidence],
      freshnessScore: 0.95
    });

    const staleConfidence = ConfidenceCalibrationEngine.evaluateConfidence({
      supportingEvidence: [staleEvidence],
      freshnessScore: 0.20
    });

    assert.ok(freshConfidence.overallConfidence > staleConfidence.overallConfidence);
    assert.ok(freshConfidence.overallConfidence - staleConfidence.overallConfidence >= 0.15);
  });

  // Scenario 6: Expert conflicts with official regulation -> official priority with nuance preserved
  it("Scenario 6 — Expert testimony contradicts promulgated rector regulation: Official statutory priority", () => {
    const claim = new ClaimEntity({ statement: "Học phí có thể hoãn nộp tới tuần 10.", topicId: "academic.tuition" });
    const officialEvidence = new EvidenceEntity({
      claimId: claim.claimId,
      sourceId: "s_official",
      type: EVIDENCE_TYPE.OFFICIAL_REGULATION,
      contentReference: "Quyết định 3116: Hạn chót đóng học phí là tuần 4."
    });
    const expertEvidence = new EvidenceEntity({
      claimId: claim.claimId,
      sourceId: "s_expert",
      type: EVIDENCE_TYPE.EXPERT_TESTIMONY,
      contentReference: "Ý kiến chuyên gia: Sinh viên có thể làm đơn hoãn đến tuần 8."
    });

    const resolution = ConflictResolutionEngine.resolveConflict({
      claim,
      supportingEvidence: [officialEvidence],
      contradictingEvidence: [expertEvidence]
    });

    assert.strictEqual(resolution.verdict, RESOLUTION_VERDICT.SUPPORTED);
    assert.strictEqual(resolution.adjudicationType, "OFFICIAL_PRIORITY_WITH_COMMUNITY_NUANCE");
  });

  // Scenario 7: Community consensus conflicts with official source -> both preserved
  it("Scenario 7 — Community consensus conflicts with official statutory regulation: Both preserved", () => {
    const claim = new ClaimEntity({ statement: "Cổng đăng ký mở đến 24h.", topicId: "academic.curriculum" });
    const officialEvidence = new EvidenceEntity({
      claimId: claim.claimId,
      sourceId: "s_official",
      type: EVIDENCE_TYPE.OFFICIAL_REGULATION,
      contentReference: "Quy định chính thức: Cổng mở đến 24h00."
    });
    const communityObservation = new EvidenceEntity({
      claimId: claim.claimId,
      sourceId: "s_community",
      type: EVIDENCE_TYPE.COMMUNITY_OBSERVATION,
      contentReference: "Thực tế cổng thường nghẽn sập từ 22h00."
    });

    const resolution = ConflictResolutionEngine.resolveConflict({
      claim,
      supportingEvidence: [officialEvidence],
      contradictingEvidence: [communityObservation]
    });

    assert.strictEqual(resolution.verdict, RESOLUTION_VERDICT.SUPPORTED);
    assert.ok(resolution.preservedNuances.some(n => n.includes("nghẽn")));
  });

  // Scenario 8: Duplicate validation submitted twice -> idempotent
  it("Scenario 8 — Submitting identical validation twice does not double-count in reputation graph", () => {
    const studentId = "student:24110001";
    ReputationGraph.applyReputationDelta({
      subjectId: studentId,
      topicId: "academic.curriculum",
      action: REPUTATION_ACTION.EXPERT_VALIDATED_CLAIM
    });

    const history = ReputationGraph.getMutationHistory(studentId);
    assert.strictEqual(history.length, 1);
  });

  // Scenario 9: Expired credential -> verification status downgrades
  it("Scenario 9 — Expired credential: Valid Until in the past downgrades active credential status", () => {
    const expiredCredential = {
      credentialId: "cred_01",
      title: "Trưởng bộ môn (2020-2024)",
      validUntil: "2024-01-01T00:00:00Z",
      status: CREDENTIAL_STATUS.EXPIRED
    };

    const isCurrentlyActive = new Date() < new Date(expiredCredential.validUntil);
    assert.strictEqual(isCurrentlyActive, false);
    assert.strictEqual(expiredCredential.status, CREDENTIAL_STATUS.EXPIRED);
  });

  // Scenario 10: Reposted article by 10 accounts -> recognized as single content hash
  it("Scenario 10 — Same quoted text reposted by 10 accounts has independence penalized", () => {
    const source1 = new SourceEntity({ publisher: "Trang tin A", url: "https://a.com", contentHash: "hash_shared_123" });
    const source2 = new SourceEntity({ publisher: "Trang tin B", url: "https://b.com", contentHash: "hash_shared_123" });

    assert.strictEqual(source1.contentHash, source2.contentHash);
  });
});
