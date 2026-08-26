import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicPlannerModel, CREDIT_BOUNDS } from "../../src/lib/intelligence/academic/academicPlannerModel.js";
import { AcademicSemesterPlannerEngine } from "../../src/lib/intelligence/academic/academicSemesterPlannerEngine.js";

describe("AcademicPlannerConstraints", () => {
  it("should validate and enforce standard credit boundaries", () => {
    assert.strictEqual(CREDIT_BOUNDS.MIN_CREDITS_PER_SEMESTER, 6);
    assert.strictEqual(CREDIT_BOUNDS.MAX_CREDITS_PER_SEMESTER, 20);

    // Valid planning input
    const validCheck = AcademicPlannerModel.validatePlanningInput({
      targetTerm: "2026-HK1",
      creditTarget: 15
    });
    assert.strictEqual(validCheck.valid, true);
    assert.strictEqual(validCheck.errors.length, 0);

    // Invalid term
    const invalidTermCheck = AcademicPlannerModel.validatePlanningInput({
      targetTerm: "2099-INVALID"
    });
    assert.strictEqual(invalidTermCheck.valid, false);
    assert.ok(invalidTermCheck.errors.length > 0);

    // Invalid credit target (> 20)
    const invalidCreditsCheck = AcademicPlannerModel.validatePlanningInput({
      creditTarget: 25
    });
    assert.strictEqual(invalidCreditsCheck.valid, false);
    assert.ok(invalidCreditsCheck.errors[0].includes("từ 6 đến 20 tín chỉ"));
  });

  it("should guarantee that all generated candidate plans strictly obey credit limits", () => {
    const plansResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    assert.ok(plansResult.candidatePlans.length > 0);
    for (const plan of plansResult.candidatePlans) {
      assert.ok(plan.totalCredits <= CREDIT_BOUNDS.MAX_CREDITS_PER_SEMESTER);
      assert.ok(plan.totalCredits >= 0);
      assert.ok(typeof plan.score === "number");
    }
  });
});
