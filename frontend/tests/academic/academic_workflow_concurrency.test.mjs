/**
 * StudentHub AI — Academic Workflow Concurrency & Revision Conflict Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { AcademicWorkflowService } from "../../src/lib/intelligence/academic/academicWorkflowService.js";
import { WORKFLOW_STATES } from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";

const CONCURRENCY_STORAGE_PATH = path.resolve(process.cwd(), ".data", "test_academic_workflow_concurrency.json");

test("▶ [WORKFLOW-CONCURRENCY-1] Idempotency & Revision Conflict Defense", async (t) => {
  AcademicTaskStore.setStoragePath(CONCURRENCY_STORAGE_PATH);
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
      insightId: "INS_CONCURRENCY_TEST",
      type: "DEADLINE_ALERT",
      title: "Đăng ký đề tài tốt nghiệp",
      whatChanged: "Mở cổng đăng ký đề tài.",
      impact: "HIGH",
      deadline: "2026-09-05"
    }
  ];

  const { tasks } = AcademicWorkflowService.generateActionPlansForStudent(studentProfile, sampleInsights);
  const taskId = tasks[0].taskId;

  await t.test("CC1.1: concurrent START calls result in single canonical IN_PROGRESS state without duplication", async () => {
    // Fire multiple simultaneous start calls
    const [res1, res2, res3] = await Promise.all([
      Promise.resolve().then(() => AcademicWorkflowService.startTask(taskId, "24110001")),
      Promise.resolve().then(() => AcademicWorkflowService.startTask(taskId, "24110001")),
      Promise.resolve().then(() => AcademicWorkflowService.startTask(taskId, "24110001"))
    ]);

    assert.equal(res1.status, WORKFLOW_STATES.IN_PROGRESS);
    assert.equal(res2.status, WORKFLOW_STATES.IN_PROGRESS);
    assert.equal(res3.status, WORKFLOW_STATES.IN_PROGRESS);

    // Verify task count is still 1
    const studentTasks = AcademicTaskStore.getTasksByStudent("24110001");
    assert.equal(studentTasks.length, 1);
  });

  await t.test("CC1.2: rejects writing a task with a stale revision", () => {
    const currentTask = AcademicTaskStore.getTask(taskId);
    assert.ok(currentTask.revision >= 1);

    // Stale object with revision 0
    const staleTask = {
      ...currentTask,
      revision: 0,
      title: "Hacked title overwrite"
    };

    assert.throws(() => {
      AcademicTaskStore.saveTask(staleTask);
    }, /STALE_REVISION_CONFLICT/);
  });

  // Cleanup
  AcademicTaskStore.resetStore();
});
