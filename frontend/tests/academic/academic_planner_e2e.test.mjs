import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAuthoritativeCommandCenterData } from "../../src/lib/intelligence/academic/academicCommandCenterDataLoader.js";
import { AcademicSemesterPlannerEngine } from "../../src/lib/intelligence/academic/academicSemesterPlannerEngine.js";

describe("AcademicPlannerE2E", () => {
  it("should run full end-to-end semester planning from authoritative server state", () => {
    // 1. Fetch server-authoritative baseline
    const serverData = getAuthoritativeCommandCenterData({ studentId: "24110001" });
    assert.ok(serverData.success);

    const initialEarnedCredits = serverData.studentProfile.earnedCredits;
    const initialCgpa = serverData.studentProfile.cgpa;

    // 2. Run Semester Planner
    const planResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: serverData.studentProfile.studentId,
      targetTerm: "2026-HK1",
      profile360: serverData.profile360,
      digitalTwin: serverData.digitalTwin
    });

    assert.strictEqual(planResult.mode, "PLANNING");
    assert.strictEqual(planResult.studentId, "24110001");
    assert.ok(planResult.candidatePlans.length >= 2);

    // 3. Verify that real student stores were NOT mutated
    const verifyData = getAuthoritativeCommandCenterData({ studentId: "24110001" });
    assert.strictEqual(verifyData.studentProfile.earnedCredits, initialEarnedCredits);
    assert.strictEqual(verifyData.studentProfile.cgpa, initialCgpa);
  });
});
