/**
 * StudentHub AI — Social to Official Pipeline & Early Warning Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { EarlyWarningEngine, WARNING_LIFECYCLE, WARNING_CATEGORY } from "../../src/lib/intelligence/social/EarlyWarningEngine.js";
import { SocialToOfficialPipeline } from "../../src/lib/intelligence/social/SocialToOfficialPipeline.js";

describe("Early Warning Engine & Social-to-Official Pipeline", () => {
  beforeEach(() => {
    EarlyWarningEngine.clear();
  });

  it("should advance early warning lifecycle through UNVERIFIED -> EMERGING -> CORROBORATED", () => {
    // 1 report
    const w1 = EarlyWarningEngine.recordSignal({
      category: WARNING_CATEGORY.PORTAL_OUTAGE,
      title: "Lỗi kết nối cổng online.hcmute.edu.vn",
      affectedEntity: "SYSTEM:online_portal",
      authorId: "sv_01"
    });
    assert.strictEqual(w1.status, WARNING_LIFECYCLE.UNVERIFIED);
    assert.strictEqual(w1.distinctReporterCount, 1);

    // 3 reports
    EarlyWarningEngine.recordSignal({ category: WARNING_CATEGORY.PORTAL_OUTAGE, affectedEntity: "SYSTEM:online_portal", authorId: "sv_02" });
    const w3 = EarlyWarningEngine.recordSignal({ category: WARNING_CATEGORY.PORTAL_OUTAGE, affectedEntity: "SYSTEM:online_portal", authorId: "sv_03" });
    assert.strictEqual(w3.status, WARNING_LIFECYCLE.EMERGING);
    assert.strictEqual(w3.distinctReporterCount, 3);

    // 6 reports
    EarlyWarningEngine.recordSignal({ category: WARNING_CATEGORY.PORTAL_OUTAGE, affectedEntity: "SYSTEM:online_portal", authorId: "sv_04" });
    EarlyWarningEngine.recordSignal({ category: WARNING_CATEGORY.PORTAL_OUTAGE, affectedEntity: "SYSTEM:online_portal", authorId: "sv_05" });
    const w6 = EarlyWarningEngine.recordSignal({ category: WARNING_CATEGORY.PORTAL_OUTAGE, affectedEntity: "SYSTEM:online_portal", authorId: "sv_06" });
    assert.strictEqual(w6.status, WARNING_LIFECYCLE.CORROBORATED);
    assert.strictEqual(w6.distinctReporterCount, 6);
  });

  it("should produce dual-layer advisory fusing statutory policy with operational ground truth", () => {
    const advisory = SocialToOfficialPipeline.evaluateSignalAgainstOfficial({
      topic: "academic.registration",
      claimText: "Cổng đăng ký học phần thường bị quá tải và sập lúc 22h00 đêm cuối.",
      authorId: "student_reporter"
    });

    assert.ok(advisory.pipelineId);
    assert.strictEqual(advisory.officialPolicy.status, "STATUTORY_AUTHORITY");
    assert.strictEqual(advisory.operationalSignal.status, "OPERATIONAL_REALITY");
    assert.ok(advisory.recommendedStudentAction.length > 10);
    assert.ok(advisory.contradictionAnalysis);
  });
});
