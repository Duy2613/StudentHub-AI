/**
 * StudentHub AI — Academic Workflow Authorization & Privacy Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AcademicTaskAuthorization } from "../../src/lib/intelligence/academic/academicTaskAuthorization.js";
import { WORKFLOW_STATES } from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";

test("▶ [AUTHORIZATION-1] Student Task Privacy & Ownership Guard", async (t) => {
  const taskA = {
    taskId: "TASK_A_001",
    studentId: "24110001",
    title: "Hồ sơ xét tốt nghiệp"
  };

  await t.test("AUTH1.1: permits task owner to access task", () => {
    assert.doesNotThrow(() => {
      AcademicTaskAuthorization.assertTaskOwnership(taskA, "24110001");
    });
  });

  await t.test("AUTH1.2: strictly blocks unauthorized students from accessing or mutating tasks", () => {
    assert.throws(() => {
      AcademicTaskAuthorization.assertTaskOwnership(taskA, "24119999");
    }, /Bạn không có quyền truy cập/);
  });
});

test("▶ [AUTHORIZATION-2] Step Dependency Validation", async (t) => {
  const task = {
    taskId: "TASK_001",
    studentId: "24110001",
    steps: [
      { stepId: "S1", title: "Bước 1: Kiểm tra", status: WORKFLOW_STATES.NOT_STARTED },
      { stepId: "S2", title: "Bước 2: Nộp hồ sơ", status: WORKFLOW_STATES.NOT_STARTED }
    ]
  };

  await t.test("AUTH2.1: rejects completing step 2 when step 1 is incomplete", () => {
    assert.throws(() => {
      AcademicTaskAuthorization.assertStepDependenciesMet(task, "S2");
    }, /Bạn cần hoàn thành bước 'Bước 1: Kiểm tra'/);
  });

  await t.test("AUTH2.2: permits completing step 2 once step 1 is COMPLETED", () => {
    task.steps[0].status = WORKFLOW_STATES.COMPLETED;
    assert.doesNotThrow(() => {
      AcademicTaskAuthorization.assertStepDependenciesMet(task, "S2");
    });
  });
});
