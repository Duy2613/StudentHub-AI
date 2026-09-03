import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityFrictionEngine } from "../../src/lib/intelligence/community/communityFrictionEngine.js";
import {
  CommunityIntelligenceModel,
  FRICTION_STATE,
  FRICTION_TREND
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityV2FrictionGraph", () => {
  it("should extract structured operational friction signals with process, step, cohort, and severity", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({
        authorId: "S1",
        body: "Hệ thống đăng ký môn học bị timeout nghẽn mạng không lưu thời khóa biểu được.",
        topic: "COURSE_REGISTRATION",
        authorCohort: "K24"
      }),
      CommunityIntelligenceModel.createCommunityPost({
        authorId: "S2",
        body: "Cổng đăng ký bị sập web liên tục từ 8h sáng.",
        topic: "COURSE_REGISTRATION",
        authorCohort: "K24"
      })
    ];

    const signals = CommunityFrictionEngine.extractFrictionSignals(posts);

    assert.strictEqual(signals.length, 1);
    const sig = signals[0];
    assert.strictEqual(sig.process, "Đăng ký Môn học Trực tuyến");
    assert.strictEqual(sig.step, "Chọn lớp & Lưu thời khóa biểu");
    assert.strictEqual(sig.frictionType, "PORTAL_REGISTRATION_TIMEOUT");
    assert.strictEqual(sig.cohort, "K24");
    assert.strictEqual(sig.severity, "CRITICAL");
    assert.strictEqual(sig.independentReportCount, 2);
  });

  it("should generate a 2D Friction Heatmap Matrix across processes and cohorts K21-K26", () => {
    const sig1 = CommunityIntelligenceModel.createFrictionSignal({
      process: "Xét duyệt Tốt nghiệp",
      step: "Thẩm định hồ sơ",
      frictionType: "DELAY",
      cohort: "K24",
      independentReportCount: 27,
      severity: "HIGH",
      trend: FRICTION_TREND.NEW_SPIKE
    });

    const sig2 = CommunityIntelligenceModel.createFrictionSignal({
      process: "Đăng ký Môn học",
      step: "Lưu TKB",
      frictionType: "TIMEOUT",
      cohort: "K25",
      independentReportCount: 5,
      severity: "CRITICAL"
    });

    const heatmap = CommunityFrictionEngine.buildFrictionHeatmap([sig1, sig2]);

    assert.deepStrictEqual(heatmap.columns, ["K21", "K22", "K23", "K24", "K25", "K26"]);
    assert.strictEqual(heatmap.rows.length, 2);
    
    const row1 = heatmap.rows.find(r => r.processName === "Xét duyệt Tốt nghiệp");
    assert.ok(row1);
    assert.strictEqual(row1.cohorts.K24.count, 27);
    assert.strictEqual(row1.cohorts.K24.severity, "HIGH");
    assert.strictEqual(row1.cohorts.K21.count, 0);
  });
});
