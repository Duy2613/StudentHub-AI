/**
 * StudentHub AI — Academic Workflow Process Restart & Crash Recovery Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { AcademicWorkflowService } from "../../src/lib/intelligence/academic/academicWorkflowService.js";
import { WORKFLOW_STATES } from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";

const RESTART_STORAGE_PATH = path.resolve(process.cwd(), ".data", `test_academic_workflow_restart_${process.pid}.json`);

test("▶ [WORKFLOW-RESTART-1] Golden Scenario: Full Crash Recovery & State Integrity Across Restarts", async (t) => {
  AcademicTaskStore.setStoragePath(RESTART_STORAGE_PATH);
  AcademicTaskStore.resetStore();

  const studentProfile = {
    studentId: "24110001",
    fullName: "Nguyễn Văn Duy",
    cohort: 2024,
    programCode: "7480103",
    programName: "Kỹ thuật Phần mềm",
    earnedCredits: 115,
    cgpa: 2.85
  };

  const sampleInsights = [
    {
      insightId: "INS_CRASH_RECOVERY_TEST",
      type: "DEADLINE_ALERT",
      title: "Hồ sơ bảo vệ khóa luận K24",
      whatChanged: "Hạn nộp báo cáo chuyên đề đến 05/09/2026.",
      whyItMatters: "Sinh viên đủ điều kiện cần nộp hồ sơ trước thời hạn.",
      impact: "HIGH",
      deadline: "2026-09-05",
      source: { sourceId: "SRC_HCMUTE_DAOTAO" }
    }
  ];

  let originalTaskId;

  await t.test("RS1.1: generates plan, starts task, and completes step 1 & 2 before crash", () => {
    const { plans, tasks } = AcademicWorkflowService.generateActionPlansForStudent(studentProfile, sampleInsights);
    assert.equal(plans.length, 1);
    assert.equal(tasks.length, 1);

    const task = tasks[0];
    originalTaskId = task.taskId;

    // Start task
    AcademicWorkflowService.startTask(task.taskId, "24110001");

    // Complete Step 2 with evidence
    AcademicWorkflowService.completeStep(task.taskId, task.steps[1].stepId, "24110001", {
      type: "FILE_UPLOAD",
      filename: "bao_cao_chuyen_de_k24.pdf"
    });

    const currentTask = AcademicTaskStore.getTask(originalTaskId);
    assert.equal(currentTask.status, WORKFLOW_STATES.IN_PROGRESS);
    assert.equal(currentTask.progress.completedSteps, 2);
    assert.equal(currentTask.progress.percentage, 50);
  });

  await t.test("RS1.2: simulates full process crash and rehydration from durable storage", () => {
    // Force rehydrate to simulate a new Node process booting up
    AcademicTaskStore.rehydrate();

    const recoveredTask = AcademicTaskStore.getTask(originalTaskId);
    assert.ok(recoveredTask, "Task must survive process restart");
    assert.equal(recoveredTask.taskId, originalTaskId);
    assert.equal(recoveredTask.status, WORKFLOW_STATES.IN_PROGRESS);
    assert.equal(recoveredTask.progress.completedSteps, 2);
    assert.equal(recoveredTask.progress.percentage, 50);

    // Verify step 2 evidence survived
    assert.ok(recoveredTask.steps[1].evidence);
    assert.equal(recoveredTask.steps[1].evidence.filename, "bao_cao_chuyen_de_k24.pdf");

    // Verify audit history survived
    assert.ok(recoveredTask.history && recoveredTask.history.length >= 2);
  });

  await t.test("RS1.3: continues execution post-restart and completes task", () => {
    const task = AcademicTaskStore.getTask(originalTaskId);
    const step3 = task.steps[2];
    const step4 = task.steps[3];

    AcademicWorkflowService.completeStep(task.taskId, step3.stepId, "24110001");
    AcademicWorkflowService.completeStep(task.taskId, step4.stepId, "24110001");

    const finalTask = AcademicTaskStore.getTask(originalTaskId);
    assert.equal(finalTask.status, WORKFLOW_STATES.COMPLETED);
    assert.equal(finalTask.progress.percentage, 100);
  });

  await t.test("RS1.4: second process restart confirms COMPLETED state remains durable", () => {
    AcademicTaskStore.rehydrate();

    const finalRecovered = AcademicTaskStore.getTask(originalTaskId);
    assert.equal(finalRecovered.status, WORKFLOW_STATES.COMPLETED);
    assert.equal(finalRecovered.progress.percentage, 100);
    assert.ok(finalRecovered.completedAt);
  });

  // Cleanup
  AcademicTaskStore.resetStore();
});
