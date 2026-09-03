import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicPrerequisiteEngine } from "../../src/lib/intelligence/academic/academicPrerequisiteEngine.js";

describe("AcademicPrerequisiteEngine", () => {
  it("should validate satisfied and unsatisfied prerequisites", () => {
    // OOP requires PROG130103
    const checkUnsatisfied = AcademicPrerequisiteEngine.validatePrerequisites("OOPL230103", []);
    assert.strictEqual(checkUnsatisfied.isSatisfied, false);
    assert.deepStrictEqual(checkUnsatisfied.missingPrerequisites, ["PROG130103"]);

    const checkSatisfied = AcademicPrerequisiteEngine.validatePrerequisites("OOPL230103", ["PROG130103"]);
    assert.strictEqual(checkSatisfied.isSatisfied, true);
    assert.strictEqual(checkSatisfied.missingPrerequisites.length, 0);
  });

  it("should verify semester availability correctly", () => {
    // PROG130103 available in semesters 1, 2, 3
    assert.strictEqual(AcademicPrerequisiteEngine.isAvailableInSemester("PROG130103", 1), true);
    assert.strictEqual(AcademicPrerequisiteEngine.isAvailableInSemester("PROG130103", 2), true);
    assert.strictEqual(AcademicPrerequisiteEngine.isAvailableInSemester("PROG130103", 3), true);

    // Invalid course returns false
    assert.strictEqual(AcademicPrerequisiteEngine.isAvailableInSemester("NON_EXISTENT", 1), false);
  });

  it("should compute downstream unlocks cascade", () => {
    const unlocks = AcademicPrerequisiteEngine.getCourseDownstreamUnlocks("PROG130103");
    assert.ok(unlocks.length >= 3);
    assert.ok(unlocks.includes("OOPL230103"));
    assert.ok(unlocks.includes("DSAA230203"));
  });

  it("should detect that institutional course catalog has no prerequisite cycles", () => {
    const cycleCheck = AcademicPrerequisiteEngine.detectPrerequisiteCycles();
    assert.strictEqual(cycleCheck.hasCycle, false);
    assert.strictEqual(cycleCheck.cycleNodes.length, 0);
  });

  it("should filter feasible courses excluding completed courses", () => {
    const completed = ["PROG130103", "MATH1411"];
    const feasible = AcademicPrerequisiteEngine.getFeasibleCourses({
      completedCourses: completed,
      targetSemester: 1
    });

    // Feasible list should contain OOPL230103 (prereq met) but NOT PROG130103 (already completed)
    const codes = feasible.map(c => c.code);
    assert.ok(codes.includes("OOPL230103"));
    assert.ok(!codes.includes("PROG130103"));
  });
});
