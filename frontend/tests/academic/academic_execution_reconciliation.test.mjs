import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicExecutionStore } from "../../src/lib/intelligence/academic/academicExecutionStore.js";
import { AcademicPlanDriftEngine } from "../../src/lib/intelligence/academic/academicPlanDriftEngine.js";
import { AcademicDecisionModel } from "../../src/lib/intelligence/academic/academicDecisionModel.js";
import { EXECUTION_STATUS, ITEM_EXECUTION_STATUS } from "../../src/lib/intelligence/academic/academicExecutionModel.js";

describe("AcademicExecutionReconciliation", () => {
  beforeEach(() => {
    AcademicExecutionStore.clear();
  });

  it("should mark older execution for same term as SUPERSEDED when a new plan execution is saved", () => {
    const exec1 = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      profile360: { profileRevision: 1 },
      digitalTwin: { revision: 1 },
      adoptedPlan: AcademicDecisionModel.createAdoptedPlanRecord({
        studentId: "24110001",
        planId: "PLAN_A",
        targetTerm: "2026-HK1",
        selectedCourses: [{ code: "MATH102", name: "Toán 2", credits: 3 }],
        baseRevisions: { profileRevision: 1, twinRevision: 1 }
      })
    });

    const exec2 = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      profile360: { profileRevision: 1 },
      digitalTwin: { revision: 1 },
      adoptedPlan: AcademicDecisionModel.createAdoptedPlanRecord({
        studentId: "24110001",
        planId: "PLAN_B",
        targetTerm: "2026-HK1",
        selectedCourses: [{ code: "DSA202", name: "DSA", credits: 4 }],
        baseRevisions: { profileRevision: 1, twinRevision: 1 }
      })
    });

    AcademicExecutionStore.saveExecution(exec1);
    AcademicExecutionStore.saveExecution(exec2);

    const active = AcademicExecutionStore.getActiveExecution("24110001", "2026-HK1");
    assert.strictEqual(active.adoptedPlanId, "PLAN_B");

    const history = AcademicExecutionStore.getExecutionsByStudent("24110001");
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].status, EXECUTION_STATUS.SUPERSEDED);
    assert.strictEqual(history[1].status, EXECUTION_STATUS.ACTIVE);
  });

  it("should reconcile with active tasks in task store", () => {
    const exec = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      profile360: { profileRevision: 1 },
      digitalTwin: { revision: 1 },
      adoptedPlan: AcademicDecisionModel.createAdoptedPlanRecord({
        studentId: "24110001",
        planId: "PLAN_A",
        targetTerm: "2026-HK1",
        selectedCourses: [{ code: "DSA202", name: "DSA", credits: 4 }],
        baseRevisions: { profileRevision: 1, twinRevision: 1 }
      }),
      tasks: [
        { taskId: "TASK_DSA", payload: { courseCode: "DSA202" }, status: "IN_PROGRESS" }
      ]
    });

    const dsaItem = exec.plannedItems.find(i => i.itemCode === "DSA202");
    assert.ok(dsaItem);
    assert.strictEqual(dsaItem.status, ITEM_EXECUTION_STATUS.IN_PROGRESS);
    assert.strictEqual(dsaItem.actualState, "IN_PROGRESS");
  });
});
