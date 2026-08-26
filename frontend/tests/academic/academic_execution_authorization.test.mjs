import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicPlanDriftEngine } from "../../src/lib/intelligence/academic/academicPlanDriftEngine.js";
import { AcademicExecutionStore } from "../../src/lib/intelligence/academic/academicExecutionStore.js";
import { AcademicExecutionModel } from "../../src/lib/intelligence/academic/academicExecutionModel.js";

describe("AcademicExecutionAuthorization", () => {
  beforeEach(() => {
    AcademicExecutionStore.clear();
  });

  it("should throw error if studentId is missing or empty", () => {
    assert.throws(() => {
      AcademicPlanDriftEngine.evaluateExecution({ studentId: "" });
    }, /studentId is required/);

    assert.throws(() => {
      AcademicExecutionModel.createExecutionRecord({ studentId: "", adoptedPlanId: "PLAN_1" });
    }, /studentId is required/);

    assert.throws(() => {
      AcademicExecutionStore.saveExecution({ studentId: "", executionId: "EXEC_1" });
    }, /Invalid execution record/);
  });

  it("should enforce strict multi-student isolation in ExecutionStore", () => {
    const execA = AcademicExecutionModel.createExecutionRecord({
      studentId: "24110001",
      adoptedPlanId: "PLAN_A",
      targetTerm: "2026-HK1"
    });
    const execB = AcademicExecutionModel.createExecutionRecord({
      studentId: "24110002",
      adoptedPlanId: "PLAN_B",
      targetTerm: "2026-HK1"
    });

    AcademicExecutionStore.saveExecution(execA);
    AcademicExecutionStore.saveExecution(execB);

    const activeA = AcademicExecutionStore.getActiveExecution("24110001", "2026-HK1");
    const activeB = AcademicExecutionStore.getActiveExecution("24110002", "2026-HK1");

    assert.strictEqual(activeA.studentId, "24110001");
    assert.strictEqual(activeA.adoptedPlanId, "PLAN_A");

    assert.strictEqual(activeB.studentId, "24110002");
    assert.strictEqual(activeB.adoptedPlanId, "PLAN_B");

    assert.notStrictEqual(activeA.executionId, activeB.executionId);
  });
});
