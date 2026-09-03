import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicDecisionEngine } from "../../src/lib/intelligence/academic/academicDecisionEngine.js";

describe("AcademicPlanComparison", () => {
  it("should provide normalized side-by-side comparison metrics for all candidate plans", () => {
    const result = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    const planA = result.plans.find(p => p.planType === "RECOMMENDED");
    const planB = result.plans.find(p => p.planType === "FAST_TRACK");
    const planC = result.plans.find(p => p.planType === "LIGHT_LOAD");

    assert.ok(planA && planB && planC);

    // Plan B has highest credits
    assert.ok(planB.totalCredits >= planA.totalCredits);
    assert.ok(planA.totalCredits >= planC.totalCredits);

    // Plan B has highest projected credits and roadmap progress
    assert.ok(planB.projectedCredits >= planA.projectedCredits);
    assert.ok(planA.projectedCredits >= planC.projectedCredits);

    // Goal alignment strings are clear and explainable
    assert.ok(planB.goalAlignment.includes("ACCELERATED"));
    assert.ok(planA.goalAlignment.includes("ON_TRACK"));
    assert.ok(planC.goalAlignment.includes("CAUTION"));
  });
});
