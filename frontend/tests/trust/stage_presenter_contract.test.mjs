import test from "node:test";
import assert from "node:assert/strict";
import {
  presentStageForUser,
  USER_FACING_STAGE_NAMES,
  STAGE_ROUTE_DECISIONS
} from "../../src/lib/ai-trust/v5/stagePresenter.js";

test("Stage Presenter: Maps all 7 user-facing stage names accurately", () => {
  assert.equal(USER_FACING_STAGE_NAMES.l1, "Tín hiệu đầu vào");
  assert.equal(USER_FACING_STAGE_NAMES.l2a, "Kiểm tra nguồn nguy cơ");
  assert.equal(USER_FACING_STAGE_NAMES.l2b, "Phân tích nội dung");
  assert.equal(USER_FACING_STAGE_NAMES.l2c, "Phân loại rủi ro");
  assert.equal(USER_FACING_STAGE_NAMES.l3, "Bằng chứng");
  assert.equal(USER_FACING_STAGE_NAMES.l4, "Kết luận");
  assert.equal(USER_FACING_STAGE_NAMES.l5, "Kiểm định cuối");
});

test("Stage Presenter: Calibration Rule - Uncalibrated score displays 'Điểm rủi ro X/100', NOT probability percentage", () => {
  const uncalibratedStage = {
    operationStatus: "COMPLETED",
    finding: "LOCAL_SUSPICIOUS",
    riskScore: 84,
    calibrated: false,
    confidence: 0.88,
  };

  const presented = presentStageForUser("l1", uncalibratedStage);
  assert.equal(presented.calibrated, false);
  assert.equal(presented.riskScore, 84);
  assert.equal(presented.calibratedProbability, null);
  assert.equal(presented.riskDisplayLabel, "Điểm rủi ro 84/100");
  assert.equal(presented.riskDisplayLabel.includes("%"), false, "Must NOT show % when uncalibrated");
});

test("Stage Presenter: Calibration Rule - Calibrated score with provenance displays percentage", () => {
  const calibratedStage = {
    operationStatus: "COMPLETED",
    finding: "SEMANTIC_SUSPICIOUS",
    riskScore: 78,
    calibrated: true,
    calibrationStatus: "CALIBRATED",
    confidence: 0.95,
  };

  const presented = presentStageForUser("l2b", calibratedStage);
  assert.equal(presented.calibrated, true);
  assert.equal(presented.calibratedProbability, 78);
  assert.equal(presented.riskDisplayLabel, "78% xác suất");
});

test("Stage Presenter: Produces exact 9 user-facing attributes and isolates technical details", () => {
  const mockStage = {
    operationStatus: "COMPLETED",
    finding: "THREAT_MATCH",
    threatTypes: ["PHISHING", "SOCIAL_ENGINEERING"],
    role: "Threat Intelligence Screening",
    checking: "URL DNS & TLS verification",
    notProve: "Clean URL does not prove content safe",
    limitations: ["Depends on provider freshness"],
    evidenceRefs: ["ref-dns-01", "ref-tls-02"],
    userAction: "Không bấm vào liên kết",
    latencyMs: 12,
  };

  const presented = presentStageForUser("l2a", mockStage);

  // 1. Stage name
  assert.equal(presented.headline, "Kiểm tra nguồn nguy cơ");
  // 2. Result
  assert.ok(presented.resultLabel);
  // 3. Risk score
  assert.ok(presented.riskScore !== undefined);
  assert.ok(presented.riskDisplayLabel);
  // 4. Confidence
  assert.ok(presented.confidenceLabel);
  // 5. 2-4 important findings
  assert.ok(Array.isArray(presented.topFindings));
  assert.ok(presented.topFindings.length >= 1 && presented.topFindings.length <= 4);
  // 6. Main conclusion
  assert.ok(presented.summary);
  // 7. Next stage
  assert.equal(presented.nextStageId, "l2b");
  // 8. Why next stage required
  assert.ok(presented.nextReason);
  // 9. User action
  assert.equal(presented.recommendedAction, "Không bấm vào liên kết");

  // Technical noise strictly kept in technicalDetails
  assert.ok(presented.technicalDetails);
  assert.equal(presented.technicalDetails.whatThisDoesNotProve, "Clean URL does not prove content safe");
  assert.deepEqual(presented.technicalDetails.rawEvidenceRefs, ["ref-dns-01", "ref-tls-02"]);
  assert.deepEqual(presented.technicalDetails.technicalLimitations, ["Depends on provider freshness"]);
});
