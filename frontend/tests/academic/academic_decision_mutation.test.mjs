import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicDecisionEngine } from "../../src/lib/intelligence/academic/academicDecisionEngine.js";
import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";

describe("AcademicDecisionMutationGuard", () => {
  it("Mutant 1: Should reject adoption of non-existent plan ID", () => {
    assert.throws(() => {
      AcademicDecisionEngine.adoptPlan({
        studentId: "24110001",
        planId: "NON_EXISTENT_PLAN_999",
        targetTerm: "2026-HK1"
      });
    }, /không tồn tại trong danh mục/);
  });

  it("Mutant 2: Should reject adoption if base revisions are stale", () => {
    const studio = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: "24110001",
      profile360: { profileRevision: 1 },
      digitalTwin: { revision: 1 }
    });

    const planId = studio.plans[0].planId;

    assert.throws(() => {
      AcademicDecisionEngine.adoptPlan({
        studentId: "24110001",
        planId,
        expectedBaseRevisions: studio.plans[0].baseRevisions,
        profile360: { profileRevision: 2 }, // Revision changed
        digitalTwin: { revision: 1 }
      });
    }, /STALE_PLAN_ERROR/);
  });

  it("Mutant 3: Should never leak tasks into TaskStore or notifications into NotificationStore on adoption", () => {
    const taskCountBefore = AcademicTaskStore.getTasksByStudent("24110001").length;
    const notifCountBefore = AcademicNotificationStore.getNotificationsByStudent("24110001").length;

    const studio = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    AcademicDecisionEngine.adoptPlan({
      studentId: "24110001",
      planId: studio.plans[0].planId,
      targetTerm: "2026-HK1"
    });

    const taskCountAfter = AcademicTaskStore.getTasksByStudent("24110001").length;
    const notifCountAfter = AcademicNotificationStore.getNotificationsByStudent("24110001").length;

    assert.strictEqual(taskCountAfter, taskCountBefore, "Mutant Killed: Adoption must never create tasks directly");
    assert.strictEqual(notifCountAfter, notifCountBefore, "Mutant Killed: Adoption must never send notifications");
  });

  it("Mutant 4: Mode must strictly be DECISION_SUPPORT", () => {
    const result = AcademicDecisionEngine.evaluateDecisionStudio({ studentId: "24110001" });
    assert.strictEqual(result.mode, "DECISION_SUPPORT", "Mutant Killed: Mode must strictly be DECISION_SUPPORT");
  });
});
