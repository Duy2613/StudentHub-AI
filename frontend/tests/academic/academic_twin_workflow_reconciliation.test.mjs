/**
 * StudentHub AI — Digital Twin & Workflow Auto-Reconciliation Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { AcademicWorkflowReconciliationEngine } from "../../src/lib/intelligence/academic/academicWorkflowReconciliationEngine.js";
import { StudentDigitalTwinModel } from "../../src/lib/intelligence/academic/studentDigitalTwinModel.js";
import { WORKFLOW_STATES } from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";

const TWIN_RECON_STORAGE = path.resolve(process.cwd(), ".data", "test_twin_workflow_reconciliation.json");

test("▶ [TWIN-RECONCILIATION-1] Auto-Reconciliation upon Digital Twin State Update (TOEIC 480 -> 560)", async (t) => {
  AcademicTaskStore.setStoragePath(TWIN_RECON_STORAGE);
  AcademicTaskStore.resetStore();

  const studentId = "24110001";

  // Initial task created when TOEIC was 480
  const initialTask = {
    taskId: "TASK_GRADUATION_TOEIC",
    planId: "PLAN_GRADUATION_2026",
    studentId,
    type: "ACADEMIC_DEADLINE",
    title: "Xét tốt nghiệp đợt 2",
    status: WORKFLOW_STATES.IN_PROGRESS,
    progress: { completedSteps: 1, totalSteps: 3, percentage: 33 },
    steps: [
      { stepId: "S1", title: "Kiểm tra điều kiện tích lũy tín chỉ", status: WORKFLOW_STATES.COMPLETED },
      { stepId: "S2", title: "Nộp bổ sung chứng chỉ TOEIC 550+", status: WORKFLOW_STATES.NOT_STARTED },
      { stepId: "S3", title: "Xác nhận hồ sơ tốt nghiệp", status: WORKFLOW_STATES.NOT_STARTED }
    ],
    history: [],
    revision: 1
  };

  AcademicTaskStore.saveTask(initialTask);

  // Student acquires verified TOEIC 560
  const updatedTwin = StudentDigitalTwinModel.createDigitalTwin({
    studentId,
    fullName: "Nguyễn Văn Duy",
    cohort: 2024,
    earnedCredits: 115,
    cgpa: 2.85,
    certificates: [{ type: "TOEIC", score: 560, verificationStatus: "VERIFIED" }],
    revision: 2
  });

  await t.test("TR1.1: automatically resolves TOEIC step when Digital Twin is updated to 560", () => {
    const { reconciledTasks, reconciledCount } = AcademicWorkflowReconciliationEngine.reconcileWithDigitalTwin(
      studentId,
      updatedTwin
    );

    assert.equal(reconciledCount, 1);
    const updated = reconciledTasks[0];
    assert.equal(updated.steps[1].status, WORKFLOW_STATES.COMPLETED);
    assert.ok(updated.steps[1].evidence);
    assert.equal(updated.steps[1].evidence.score, 560);
    assert.equal(updated.progress.completedSteps, 2);
    assert.equal(updated.progress.percentage, 67);

    // Verify audit event
    const events = AcademicTaskStore.getEvents(initialTask.taskId);
    const reconEvent = events.find(e => e.type === "TASK_RECONCILED" && e.actor === "DIGITAL_TWIN_RECONCILIATION");
    assert.ok(reconEvent);
  });

  // Cleanup
  AcademicTaskStore.resetStore();
});
