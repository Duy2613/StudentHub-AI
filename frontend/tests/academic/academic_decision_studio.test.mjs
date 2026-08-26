import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicDecisionEngine } from "../../src/lib/intelligence/academic/academicDecisionEngine.js";
import { STUDENT_PREFERENCES, DECISION_MODE } from "../../src/lib/intelligence/academic/academicDecisionModel.js";

describe("AcademicDecisionStudio", () => {
  it("should evaluate decision studio with BALANCED preference recommending Plan A", () => {
    const result = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      studentPreference: STUDENT_PREFERENCES.BALANCED
    });

    assert.strictEqual(result.mode, DECISION_MODE);
    assert.strictEqual(result.studentId, "24110001");
    assert.strictEqual(result.studentPreference, STUDENT_PREFERENCES.BALANCED);
    assert.ok(result.plans.length === 3);

    // Under BALANCED, top recommendation is RECOMMENDED (Plan A)
    assert.strictEqual(result.recommendation.recommendedPlanType, "RECOMMENDED");
    assert.ok(result.recommendation.rationale.includes("toàn diện nhất"));
  });

  it("should re-rank plans when student selects GRADUATE_ASAP preference", () => {
    const result = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      studentPreference: STUDENT_PREFERENCES.GRADUATE_ASAP
    });

    assert.strictEqual(result.studentPreference, STUDENT_PREFERENCES.GRADUATE_ASAP);

    // Under GRADUATE_ASAP, top recommendation is FAST_TRACK (Plan B)
    assert.strictEqual(result.recommendation.recommendedPlanType, "FAST_TRACK");
    assert.strictEqual(result.plans[0].planType, "FAST_TRACK");
    assert.ok(result.recommendation.rationale.includes("Tốt Nghiệp Sớm"));
  });
});
