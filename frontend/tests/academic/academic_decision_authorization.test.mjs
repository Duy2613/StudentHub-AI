import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicDecisionEngine } from "../../src/lib/intelligence/academic/academicDecisionEngine.js";
import { AcademicDecisionModel } from "../../src/lib/intelligence/academic/academicDecisionModel.js";

describe("AcademicDecisionAuthorization", () => {
  it("should throw error if studentId is missing or empty", () => {
    assert.throws(() => {
      AcademicDecisionEngine.evaluateDecisionStudio({ studentId: "" });
    }, /studentId is required/);

    assert.throws(() => {
      AcademicDecisionEngine.adoptPlan({ studentId: "", planId: "PLAN_123" });
    }, /studentId and planId are required/);

    assert.throws(() => {
      AcademicDecisionModel.createAdoptedPlanRecord({ studentId: "", planId: "PLAN_123" });
    }, /studentId and planId are required/);
  });

  it("should isolate comparison results strictly by studentId", () => {
    const resA = AcademicDecisionEngine.evaluateDecisionStudio({ studentId: "24110001" });
    const resB = AcademicDecisionEngine.evaluateDecisionStudio({ studentId: "24110002" });

    assert.strictEqual(resA.studentId, "24110001");
    assert.strictEqual(resB.studentId, "24110002");
    assert.notStrictEqual(resA.comparisonId, resB.comparisonId);
  });
});
