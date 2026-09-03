import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicPlanDriftEngine } from "../../src/lib/intelligence/academic/academicPlanDriftEngine.js";
import { AcademicDecisionStore } from "../../src/lib/intelligence/academic/academicDecisionStore.js";
import { AcademicDecisionModel } from "../../src/lib/intelligence/academic/academicDecisionModel.js";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";
import { DRIFT_SEVERITY } from "../../src/lib/intelligence/academic/academicExecutionModel.js";

describe("AcademicExecutionMutationGuard", () => {
  beforeEach(() => {
    AcademicDecisionStore.clear();
  });

  it("Mutant 1: Should never mark a course completed without authoritative transcript/task proof", () => {
    const adopted = AcademicDecisionModel.createAdoptedPlanRecord({
      studentId: "24110001",
      planId: "PLAN_A",
      targetTerm: "2026-HK1",
      selectedCourses: [{ code: "DSA202", name: "DSA", credits: 4 }]
    });
    AcademicDecisionStore.saveAdoption(adopted);

    // Evaluated with empty transcript
    const exec = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      academicRecords: { courses: [] }
    });

    const dsaItem = exec.plannedItems.find(i => i.itemCode === "DSA202");
    assert.notStrictEqual(dsaItem.status, "COMPLETED", "Mutant Killed: Cannot mark completed without transcript evidence");
    assert.strictEqual(exec.progress.actualCompletedCredits, 0);
  });

  it("Mutant 2: Should never mutate or rewrite adopted plan when drift occurs", () => {
    const adopted = AcademicDecisionModel.createAdoptedPlanRecord({
      studentId: "24110001",
      planId: "PLAN_A",
      targetTerm: "2026-HK1",
      selectedCourses: [{ code: "DSA202", name: "DSA", credits: 4 }]
    });
    AcademicDecisionStore.saveAdoption(adopted);

    AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      academicRecords: { courses: [{ courseCode: "DSA202", grade: "F", status: "FAILED" }] }
    });

    const storedAdopted = AcademicDecisionStore.getActiveAdoption("24110001", "2026-HK1");
    assert.strictEqual(storedAdopted.planId, "PLAN_A", "Mutant Killed: Adopted plan must remain immutable");
    assert.strictEqual(storedAdopted.selectedCourses.length, 1);
  });

  it("Mutant 3: Should never leak notifications into NotificationStore directly during drift evaluation", () => {
    const notifCountBefore = AcademicNotificationStore.getNotificationsByStudent("24110001").length;

    const adopted = AcademicDecisionModel.createAdoptedPlanRecord({
      studentId: "24110001",
      planId: "PLAN_A",
      targetTerm: "2026-HK1",
      selectedCourses: [{ code: "DSA202", name: "DSA", credits: 4 }]
    });
    AcademicDecisionStore.saveAdoption(adopted);

    AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      academicRecords: { courses: [{ courseCode: "DSA202", grade: "F", status: "FAILED" }] }
    });

    const notifCountAfter = AcademicNotificationStore.getNotificationsByStudent("24110001").length;
    assert.strictEqual(notifCountAfter, notifCountBefore, "Mutant Killed: Drift engine must not emit notifications directly");
  });

  it("Mutant 4: Failing a prerequisite course must never downgrade drift from CRITICAL to NONE", () => {
    const adopted = AcademicDecisionModel.createAdoptedPlanRecord({
      studentId: "24110001",
      planId: "PLAN_A",
      targetTerm: "2026-HK1",
      selectedCourses: [{ code: "DSA202", name: "DSA", credits: 4, unlockedDownstreamCount: 3 }]
    });
    AcademicDecisionStore.saveAdoption(adopted);

    const exec = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      academicRecords: { courses: [{ courseCode: "DSA202", grade: "F", status: "FAILED" }] }
    });

    assert.strictEqual(exec.drift.driftState, DRIFT_SEVERITY.CRITICAL, "Mutant Killed: Failed prerequisite must trigger CRITICAL drift");
  });
});
