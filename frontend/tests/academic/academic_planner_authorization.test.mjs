import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicSemesterPlannerEngine } from "../../src/lib/intelligence/academic/academicSemesterPlannerEngine.js";
import { AcademicPlannerModel } from "../../src/lib/intelligence/academic/academicPlannerModel.js";

describe("AcademicPlannerAuthorization", () => {
  it("should throw error if studentId is missing or empty", () => {
    assert.throws(() => {
      AcademicSemesterPlannerEngine.generateSemesterPlans({ studentId: "" });
    }, /studentId is required/);

    assert.throws(() => {
      AcademicPlannerModel.createPlan({ studentId: "", title: "Test" });
    }, /studentId is required/);
  });

  it("should isolate student plans by studentId", () => {
    const planA = AcademicSemesterPlannerEngine.generateSemesterPlans({ studentId: "24110001" });
    const planB = AcademicSemesterPlannerEngine.generateSemesterPlans({ studentId: "24110002" });

    assert.strictEqual(planA.studentId, "24110001");
    assert.strictEqual(planB.studentId, "24110002");
    assert.notStrictEqual(planA.studentId, planB.studentId);
  });
});
