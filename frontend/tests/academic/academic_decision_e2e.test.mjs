import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAuthoritativeCommandCenterData } from "../../src/lib/intelligence/academic/academicCommandCenterDataLoader.js";
import { AcademicDecisionEngine } from "../../src/lib/intelligence/academic/academicDecisionEngine.js";
import { STUDENT_PREFERENCES } from "../../src/lib/intelligence/academic/academicDecisionModel.js";

describe("AcademicDecisionE2E", () => {
  it("should run full end-to-end decision evaluation and plan adoption from authoritative server state", () => {
    // 1. Authoritative baseline
    const serverData = getAuthoritativeCommandCenterData({ studentId: "24110001" });
    assert.ok(serverData.success);

    const initialEarnedCredits = serverData.studentProfile.earnedCredits;
    const initialCgpa = serverData.studentProfile.cgpa;

    // 2. Evaluate Decision Studio
    const decisionRes = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: serverData.studentProfile.studentId,
      targetTerm: "2026-HK1",
      studentPreference: STUDENT_PREFERENCES.BALANCED,
      profile360: serverData.profile360,
      digitalTwin: serverData.digitalTwin
    });

    assert.strictEqual(decisionRes.mode, "DECISION_SUPPORT");
    assert.ok(decisionRes.plans.length === 3);
    assert.ok(decisionRes.tradeOffs.length >= 2);

    // 3. Adopt Top Recommendation
    const topPlan = decisionRes.plans[0];
    const adoptRes = AcademicDecisionEngine.adoptPlan({
      studentId: serverData.studentProfile.studentId,
      planId: topPlan.planId,
      targetTerm: "2026-HK1",
      profile360: serverData.profile360,
      digitalTwin: serverData.digitalTwin
    });

    assert.strictEqual(adoptRes.success, true);
    assert.strictEqual(adoptRes.adoptedPlan.planId, topPlan.planId);

    // 4. Verify authoritative student data remains UNTOUCHED
    const verifyData = getAuthoritativeCommandCenterData({ studentId: "24110001" });
    assert.strictEqual(verifyData.studentProfile.earnedCredits, initialEarnedCredits);
    assert.strictEqual(verifyData.studentProfile.cgpa, initialCgpa);
  });
});
