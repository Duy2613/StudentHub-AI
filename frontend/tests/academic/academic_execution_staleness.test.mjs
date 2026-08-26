import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicPlanDriftEngine } from "../../src/lib/intelligence/academic/academicPlanDriftEngine.js";
import { AcademicDecisionStore } from "../../src/lib/intelligence/academic/academicDecisionStore.js";
import { AcademicDecisionModel } from "../../src/lib/intelligence/academic/academicDecisionModel.js";
import { EXECUTION_STATUS, REPLAN_RECOMMENDATION } from "../../src/lib/intelligence/academic/academicExecutionModel.js";

describe("AcademicExecutionStaleness", () => {
  beforeEach(() => {
    AcademicDecisionStore.clear();
  });

  it("should mark execution status as STALE when profile or twin revision changes", () => {
    // Plan adopted under Profile Revision 1 & Twin Revision 1
    const adopted = AcademicDecisionModel.createAdoptedPlanRecord({
      studentId: "24110001",
      planId: "PLAN_24110001_2026-HK1_RECOMMENDED",
      targetTerm: "2026-HK1",
      totalCredits: 6,
      selectedCourses: [
        { code: "MATH102", name: "Toán 2", credits: 3 }
      ],
      baseRevisions: { profileRevision: 1, twinRevision: 1 }
    });

    AcademicDecisionStore.saveAdoption(adopted);

    // Live state updated to Profile Revision 2
    const exec = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      profile360: { profileRevision: 2 },
      digitalTwin: { revision: 1 }
    });

    assert.strictEqual(exec.status, EXECUTION_STATUS.STALE);
    assert.strictEqual(exec.drift.recommendedResponse, REPLAN_RECOMMENDATION.REVIEW_REQUIRED);
    assert.ok(exec.drift.driftReasons.some(r => r.includes("Phiên bản hồ sơ học vụ đã thay đổi")));
  });
});
