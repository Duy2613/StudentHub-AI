/**
 * StudentHub AI — T4 Evidence Fusion, Contradiction & Brier Calibration Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { ContradictionEngine, CONTRADICTION_TYPE } from "../../src/lib/intelligence/fusion/ContradictionEngine.js";
import { ConflictResolutionEngine, RESOLUTION_VERDICT } from "../../src/lib/intelligence/fusion/ConflictResolutionEngine.js";
import { ConfidenceCalibrationEngine } from "../../src/lib/intelligence/fusion/ConfidenceCalibrationEngine.js";
import { SnapshotReproducibilityStore } from "../../src/lib/intelligence/fusion/SnapshotReproducibilityStore.js";
import { EvidenceEntity, EVIDENCE_TYPE } from "../../src/lib/intelligence/fabric/EvidenceEntity.js";
import { ClaimEntity } from "../../src/lib/intelligence/fabric/ClaimEntity.js";

describe("T4 Evidence Fusion, Contradictions & Calibration", () => {
  beforeEach(() => {
    ConfidenceCalibrationEngine.clear();
    SnapshotReproducibilityStore.clear();
  });

  it("should detect and classify temporal conflicts across academic revisions", () => {
    const claim2025 = new ClaimEntity({
      statement: "Quy chế yêu cầu bắt buộc nộp chứng chỉ tiếng Anh trước khi đăng ký tốt nghiệp.",
      topicId: "academic.certification",
      temporalContext: { semester: "HK1-2024-2025" }
    });

    const claim2026 = new ClaimEntity({
      statement: "Quy chế mới không yêu cầu nộp trước mà cho phép nợ chứng chỉ đến đợt xét tốt nghiệp cuối.",
      topicId: "academic.certification",
      temporalContext: { semester: "HK2-2025-2026" }
    });

    const conflict = ContradictionEngine.detectContradiction(claim2025, claim2026);
    assert.ok(conflict);
    assert.strictEqual(conflict.contradictionType, CONTRADICTION_TYPE.TEMPORAL_CONFLICT);
  });

  it("should detect direct semantic contradiction within same scope", () => {
    const claimA = { statement: "Sinh viên bắt buộc phải đóng học phí đúng hạn trước tuần 4.", scope: "ALL_STUDENTS" };
    const claimB = { statement: "Sinh viên không được yêu cầu đóng học phí đúng hạn trước tuần 4.", scope: "ALL_STUDENTS" };

    const conflict = ContradictionEngine.detectContradiction(claimA, claimB);
    assert.ok(conflict);
    assert.strictEqual(conflict.contradictionType, CONTRADICTION_TYPE.DIRECT_CONTRADICTION);
  });

  it("should prioritize official current regulation over contradictory hearsay while preserving operational nuance", () => {
    const claim = new ClaimEntity({
      statement: "Hạn đăng ký môn học kết thúc vào 24h ngày thứ Sáu.",
      topicId: "academic.curriculum"
    });

    const officialEvidence = new EvidenceEntity({
      claimId: claim.claimId,
      sourceId: "src_daotao_official",
      type: EVIDENCE_TYPE.OFFICIAL_REGULATION,
      contentReference: "Thông báo chính thức: Cổng đăng ký đóng lúc 24h00 ngày 28/08/2026.",
      authority: 0.98,
      recency: 0.95
    });

    const communityEvidence = new EvidenceEntity({
      claimId: claim.claimId,
      sourceId: "src_community_forum",
      type: EVIDENCE_TYPE.COMMUNITY_OBSERVATION,
      contentReference: "Hệ thống portal thường xuyên bị nghẽn mạng từ 22h00 sát giờ đóng cổng.",
      authority: 0.60
    });

    const resolution = ConflictResolutionEngine.resolveConflict({
      claim,
      supportingEvidence: [officialEvidence],
      contradictingEvidence: [communityEvidence],
      contradictions: []
    });

    assert.strictEqual(resolution.verdict, RESOLUTION_VERDICT.SUPPORTED);
    assert.strictEqual(resolution.adjudicationType, "OFFICIAL_PRIORITY_WITH_COMMUNITY_NUANCE");
    assert.ok(resolution.preservedNuances.length >= 1);
    assert.ok(resolution.preservedNuances[0].includes("portal"));
  });

  it("should compute Brier Score for confidence calibration evaluation", () => {
    // Record 4 historical predictions
    // 2 confident true predictions (p=0.9, outcome=1) -> diff^2 = 0.01
    // 1 confident true prediction (p=0.8, outcome=1) -> diff^2 = 0.04
    // 1 false prediction (p=0.7, outcome=0) -> diff^2 = 0.49
    ConfidenceCalibrationEngine.recordCalibrationData({ claimId: "c1", predictedConfidence: 0.9, observedOutcome: 1 });
    ConfidenceCalibrationEngine.recordCalibrationData({ claimId: "c2", predictedConfidence: 0.9, observedOutcome: 1 });
    ConfidenceCalibrationEngine.recordCalibrationData({ claimId: "c3", predictedConfidence: 0.8, observedOutcome: 1 });
    ConfidenceCalibrationEngine.recordCalibrationData({ claimId: "c4", predictedConfidence: 0.7, observedOutcome: 0 });

    const report = ConfidenceCalibrationEngine.calculateBrierScore();
    assert.strictEqual(report.sampleSize, 4);
    assert.ok(report.brierScore > 0 && report.brierScore < 0.20);
    assert.strictEqual(report.calibrationQuality.includes("ACCEPTABLE") || report.calibrationQuality.includes("WELL CALIBRATED"), true);
  });

  it("should capture and retrieve point-in-time reproducible snapshots", () => {
    const claim = new ClaimEntity({ statement: "Học phần Giải tích 1 có 4 tín chỉ.", topicId: "academic.curriculum" });
    const snap = SnapshotReproducibilityStore.captureSnapshot({
      targetEntityId: claim.claimId,
      claimState: claim.toJSON(),
      confidenceAssessment: { overallConfidence: 0.92, evaluatedAt: "2026-08-27T00:00:00Z" }
    });

    assert.ok(snap.snapshotId.startsWith("snap_"));
    assert.ok(snap.stateDigest);

    const retrieved = SnapshotReproducibilityStore.getSnapshot(snap.snapshotId);
    assert.strictEqual(retrieved.targetEntityId, claim.claimId);
    assert.strictEqual(retrieved.confidenceAssessment.overallConfidence, 0.92);
  });
});
