import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicPrerequisiteEngine } from "../../src/lib/intelligence/academic/academicPrerequisiteEngine.js";
import { AcademicSemesterPlannerEngine } from "../../src/lib/intelligence/academic/academicSemesterPlannerEngine.js";
import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";

describe("AcademicPlannerMutationGuard", () => {
  it("Mutant 1: Should never recommend a course whose prerequisite is uncompleted", () => {
    // Student with NO completed courses
    const feasible = AcademicPrerequisiteEngine.getFeasibleCourses({
      completedCourses: [],
      targetSemester: 1
    });

    // OOP requires PROG130103 -> MUST NOT be feasible
    const codes = feasible.map(c => c.code);
    assert.ok(!codes.includes("OOPL230103"), "Mutant Killed: Unmet prerequisite course must never be recommended");
  });

  it("Mutant 2: Should never exceed institutional credit bounds", () => {
    const plansResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    for (const plan of plansResult.candidatePlans) {
      assert.ok(plan.totalCredits <= 20, "Mutant Killed: Total credits must never exceed 20");
    }
  });

  it("Mutant 3: Should never leak side-effects into TaskStore or NotificationStore", () => {
    const taskCountBefore = AcademicTaskStore.getTasksByStudent("24110001").length;
    const notifCountBefore = AcademicNotificationStore.getNotificationsByStudent("24110001").length;

    AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    const taskCountAfter = AcademicTaskStore.getTasksByStudent("24110001").length;
    const notifCountAfter = AcademicNotificationStore.getNotificationsByStudent("24110001").length;

    assert.strictEqual(taskCountAfter, taskCountBefore, "Mutant Killed: Planning must never create real tasks");
    assert.strictEqual(notifCountAfter, notifCountBefore, "Mutant Killed: Planning must never send notifications");
  });

  it("Mutant 4: Mode must strictly be PLANNING", () => {
    const plansResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: "24110001"
    });
    assert.strictEqual(plansResult.mode, "PLANNING", "Mutant Killed: Mode must strictly be PLANNING");
  });
});
