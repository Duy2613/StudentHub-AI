import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicSemesterPlannerEngine } from "../../src/lib/intelligence/academic/academicSemesterPlannerEngine.js";
import { PLANNING_MODE } from "../../src/lib/intelligence/academic/academicPlannerModel.js";

describe("AcademicSemesterPlannerEngine", () => {
  it("should generate structured semester plans with What-If projection integration", () => {
    const plansResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    assert.strictEqual(plansResult.mode, PLANNING_MODE);
    assert.strictEqual(plansResult.studentId, "24110001");
    assert.strictEqual(plansResult.targetTerm, "2026-HK1");
    assert.ok(plansResult.candidatePlans.length >= 2);
    assert.ok(plansResult.limitations.length > 0);

    const recPlan = plansResult.candidatePlans[0];
    assert.ok(recPlan.selectedCourses.length > 0);
    assert.ok(recPlan.projectedOutcome !== null);
    assert.ok(recPlan.projectedOutcome.projectedCredits >= plansResult.baseline.earnedCredits);
  });

  it("should adapt to different terms (e.g. Summer HK3)", () => {
    const summerResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: "24110001",
      targetTerm: "2026-HK3"
    });

    assert.strictEqual(summerResult.targetTerm, "2026-HK3");
    assert.ok(summerResult.candidatePlans.length > 0);
  });
});
