import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicExecutionModel, DRIFT_SEVERITY, EXECUTION_STATUS } from "../../src/lib/intelligence/academic/academicExecutionModel.js";

describe("AcademicExecutionUIModel", () => {
  it("should construct valid immutable read model for UI presentation", () => {
    const record = AcademicExecutionModel.createExecutionRecord({
      executionId: "EXEC_TEST_001",
      adoptedPlanId: "PLAN_TEST_001",
      studentId: "24110001",
      targetTerm: "2026-HK1",
      planType: "RECOMMENDED",
      planTitle: "Kế hoạch Chuẩn (14 TC)",
      status: EXECUTION_STATUS.ACTIVE,
      progress: {
        plannedTotalCredits: 14,
        actualCompletedCredits: 7,
        completedItemCount: 2,
        totalItemCount: 4,
        progressPercentage: 50
      },
      drift: {
        driftState: DRIFT_SEVERITY.NONE,
        driftScore: 0,
        driftReasons: ["Kế hoạch diễn ra đúng tiến độ"],
        recommendedResponse: "NO_ACTION",
        replanRationale: ""
      },
      plannedItems: [
        AcademicExecutionModel.createPlanVsActualItem({
          itemCode: "MATH102",
          itemName: "Toán 2",
          credits: 3,
          plannedState: "COMPLETED",
          actualState: "COMPLETED (A)",
          status: "COMPLETED"
        })
      ]
    });

    assert.strictEqual(record.executionId, "EXEC_TEST_001");
    assert.strictEqual(record.progress.progressPercentage, 50);
    assert.strictEqual(record.plannedItems.length, 1);
    assert.strictEqual(record.plannedItems[0].itemName, "Toán 2");
    assert.ok(Object.isFrozen(record));
    assert.ok(Object.isFrozen(record.progress));
    assert.ok(Object.isFrozen(record.drift));
    assert.ok(Object.isFrozen(record.plannedItems[0]));
  });
});
