import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicPlanDriftEngine } from "../../src/lib/intelligence/academic/academicPlanDriftEngine.js";
import { AcademicDecisionStore } from "../../src/lib/intelligence/academic/academicDecisionStore.js";
import { AcademicDecisionModel, ADOPTION_STATUS } from "../../src/lib/intelligence/academic/academicDecisionModel.js";
import { EXECUTION_STATUS, ITEM_EXECUTION_STATUS } from "../../src/lib/intelligence/academic/academicExecutionModel.js";

describe("AcademicExecutionCenter", () => {
  beforeEach(() => {
    AcademicDecisionStore.clear();
  });

  it("should return unstarted execution state if no plan has been adopted", () => {
    const exec = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    assert.strictEqual(exec.status, EXECUTION_STATUS.NOT_STARTED);
    assert.strictEqual(exec.adoptedPlanId, "NONE");
    assert.ok(exec.drift.driftReasons[0].includes("chưa chọn kế hoạch"));
  });

  it("should evaluate adopted plan and construct plan-vs-actual matrix", () => {
    const adopted = AcademicDecisionModel.createAdoptedPlanRecord({
      studentId: "24110001",
      planId: "PLAN_24110001_2026-HK1_RECOMMENDED",
      planType: "RECOMMENDED",
      planTitle: "Kế hoạch Chuẩn (14 TC)",
      targetTerm: "2026-HK1",
      totalCredits: 14,
      selectedCourses: [
        { code: "MATH102", name: "Toán 2", credits: 3 },
        { code: "OOP201", name: "Lập trình Hướng đối tượng", credits: 4 }
      ],
      selectedActions: ["Đạt chứng chỉ TOEIC 550+"],
      baseRevisions: { profileRevision: 1, twinRevision: 1 }
    });

    AcademicDecisionStore.saveAdoption(adopted);

    const exec = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      academicRecords: {
        courses: [
          { courseCode: "MATH102", grade: "B+", status: "COMPLETED" }
        ]
      },
      digitalTwin: {
        revision: 1,
        certificates: [{ type: "TOEIC", score: 450 }]
      },
      profile360: {
        profileRevision: 1
      }
    });

    assert.strictEqual(exec.status, EXECUTION_STATUS.ACTIVE);
    assert.strictEqual(exec.progress.plannedTotalCredits, 14);
    assert.strictEqual(exec.progress.actualCompletedCredits, 3); // MATH102 completed
    assert.strictEqual(exec.progress.completedItemCount, 1);
    assert.strictEqual(exec.progress.totalItemCount, 3); // 2 courses + 1 action
    assert.strictEqual(exec.progress.progressPercentage, 33);

    const mathItem = exec.plannedItems.find(i => i.itemCode === "MATH102");
    assert.ok(mathItem);
    assert.strictEqual(mathItem.status, ITEM_EXECUTION_STATUS.COMPLETED);
    assert.strictEqual(mathItem.actualState, "COMPLETED (B+)");

    const oopItem = exec.plannedItems.find(i => i.itemCode === "OOP201");
    assert.ok(oopItem);
    assert.strictEqual(oopItem.status, ITEM_EXECUTION_STATUS.PLANNED);
  });
});
