import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getAuthoritativeCommandCenterData } from "../../src/lib/intelligence/academic/academicCommandCenterDataLoader.js";
import { AcademicDecisionEngine } from "../../src/lib/intelligence/academic/academicDecisionEngine.js";
import { AcademicDecisionStore } from "../../src/lib/intelligence/academic/academicDecisionStore.js";
import { AcademicPlanDriftEngine } from "../../src/lib/intelligence/academic/academicPlanDriftEngine.js";
import { DRIFT_SEVERITY, REPLAN_RECOMMENDATION } from "../../src/lib/intelligence/academic/academicExecutionModel.js";

describe("AcademicExecutionE2E", () => {
  beforeEach(() => {
    AcademicDecisionStore.clear();
  });

  it("should run full end-to-end flow from plan adoption to execution and drift detection", () => {
    // 1. Authoritative baseline
    const serverData = getAuthoritativeCommandCenterData({ studentId: "24110001" });
    assert.ok(serverData.success);

    // 2. Evaluate Decision Studio & Adopt Plan
    const studio = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      profile360: serverData.profile360,
      digitalTwin: serverData.digitalTwin
    });

    const targetPlan = studio.plans[0];
    const adoptRes = AcademicDecisionEngine.adoptPlan({
      studentId: "24110001",
      planId: targetPlan.planId,
      targetTerm: "2026-HK1",
      profile360: serverData.profile360,
      digitalTwin: serverData.digitalTwin
    });
    assert.ok(adoptRes.success);

    // 3. Execution evaluation against current transcript
    const exec1 = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      profile360: serverData.profile360,
      digitalTwin: serverData.digitalTwin
    });
    assert.strictEqual(exec1.adoptedPlanId, targetPlan.planId);
    assert.strictEqual(exec1.status, "ACTIVE");

    // 4. Simulate a grade F update in transcript for the first planned course
    const firstCourse = targetPlan.selectedCourses[0];
    const updatedRecords = {
      courses: [
        { courseCode: firstCourse.code, grade: "F", status: "FAILED" }
      ]
    };

    const exec2 = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      academicRecords: updatedRecords,
      profile360: serverData.profile360,
      digitalTwin: serverData.digitalTwin
    });

    // 5. Verify Drift Engine triggers drift and replanning recommendation
    assert.ok(exec2.drift.driftState === DRIFT_SEVERITY.CRITICAL || exec2.drift.driftState === DRIFT_SEVERITY.HIGH);
    assert.ok(exec2.drift.recommendedResponse === REPLAN_RECOMMENDATION.REPLAN || exec2.drift.recommendedResponse === REPLAN_RECOMMENDATION.ADJUST);
    assert.ok(exec2.drift.replanRationale.length > 0);
  });
});
