import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicSemesterPlannerEngine } from "../../src/lib/intelligence/academic/academicSemesterPlannerEngine.js";
import { PLAN_TYPES } from "../../src/lib/intelligence/academic/academicPlannerModel.js";

describe("AcademicPlannerRanking", () => {
  it("should rank candidate plans deterministically with clear explainability", () => {
    const plansResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    const plans = plansResult.candidatePlans;
    assert.strictEqual(plans.length, 3);

    // Plan A is Recommended
    assert.strictEqual(plans[0].planType, PLAN_TYPES.RECOMMENDED);
    assert.ok(plans[0].score >= plans[1].score);
    assert.ok(plans[0].explanation.length > 20);

    // Plan B is Fast-Track
    assert.strictEqual(plans[1].planType, PLAN_TYPES.FAST_TRACK);
    assert.ok(plans[1].totalCredits >= plans[0].totalCredits);
    assert.strictEqual(plans[1].riskLevel, "MEDIUM");

    // Plan C is Light-Load
    assert.strictEqual(plans[2].planType, PLAN_TYPES.LIGHT_LOAD);
    assert.ok(plans[2].totalCredits <= plans[0].totalCredits);
    assert.strictEqual(plans[2].riskLevel, "LOW");
  });
});
