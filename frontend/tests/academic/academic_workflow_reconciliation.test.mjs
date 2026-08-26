/**
 * StudentHub AI — Academic Workflow Reconciliation Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AcademicWorkflowReconciliationEngine } from "../../src/lib/intelligence/academic/academicWorkflowReconciliationEngine.js";
import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { WORKFLOW_STATES } from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";

test("▶ [RECONCILIATION-1] Deadline Extension Reconciliation (30/08 -> 05/09)", async (t) => {
  AcademicTaskStore.resetStore();

  const studentId = "24110001";
  const initialTask = {
    taskId: "TASK_GRAD_001",
    planId: "PLAN_GRAD_001",
    studentId,
    insightId: "INS_DEADLINE_GRAD",
    type: "ACADEMIC_DEADLINE",
    title: "Hạn đăng ký xét tốt nghiệp",
    status: WORKFLOW_STATES.IN_PROGRESS,
    dueAt: "30/08/2026",
    steps: [
      { stepId: "S1", title: "Kiểm tra điều kiện", status: WORKFLOW_STATES.COMPLETED },
      { stepId: "S2", title: "Nộp hồ sơ", status: WORKFLOW_STATES.NOT_STARTED }
    ],
    history: []
  };

  AcademicTaskStore.saveTask(initialTask);

  const changes = [
    {
      changeId: "CHG_DEADLINE_NEW",
      category: "DEADLINE_CHANGE",
      field: "DEADLINE_DATE",
      oldValue: "30/08/2026",
      newValue: "05/09/2026"
    }
  ];

  await t.test("RC1.1: updates dueAt and emits TASK_RECONCILED event without altering completed steps", () => {
    const { reconciledTasks, reconciledCount } = AcademicWorkflowReconciliationEngine.reconcileStudentTasks(
      studentId,
      [initialTask],
      changes
    );

    assert.equal(reconciledCount, 1);
    const updated = reconciledTasks[0];
    assert.equal(updated.dueAt, "05/09/2026");
    assert.equal(updated.status, WORKFLOW_STATES.IN_PROGRESS);
    assert.equal(updated.steps[0].status, WORKFLOW_STATES.COMPLETED); // Preserved!

    const events = AcademicTaskStore.getEvents("TASK_GRAD_001");
    const reconEvent = events.find(e => e.type === "TASK_RECONCILED");
    assert.ok(reconEvent);
    assert.equal(reconEvent.metadata.oldDeadline, "30/08/2026");
    assert.equal(reconEvent.metadata.newDeadline, "05/09/2026");
  });

  await t.test("RC1.2: does NOT mutate or reopen already COMPLETED historical tasks", () => {
    const completedTask = {
      taskId: "TASK_COMPLETED_PAST",
      planId: "PLAN_PAST",
      studentId,
      insightId: "INS_DEADLINE_PAST",
      type: "ACADEMIC_DEADLINE",
      title: "Hồ sơ đã nộp thành công",
      status: WORKFLOW_STATES.COMPLETED,
      dueAt: "30/08/2026",
      steps: [{ stepId: "S1", status: WORKFLOW_STATES.COMPLETED }]
    };

    const { reconciledTasks, reconciledCount } = AcademicWorkflowReconciliationEngine.reconcileStudentTasks(
      studentId,
      [completedTask],
      changes
    );

    assert.equal(reconciledCount, 0);
    assert.equal(reconciledTasks[0].status, WORKFLOW_STATES.COMPLETED);
    assert.equal(reconciledTasks[0].dueAt, "30/08/2026"); // Untouched!
  });
});
