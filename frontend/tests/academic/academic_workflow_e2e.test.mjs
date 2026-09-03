/**
 * StudentHub AI — Academic Action & Workflow Center E2E Integration Suite
 * 
 * Tests the complete end-to-end lifecycle:
 * Insight ➔ ActionPlan ➔ Task ➔ Step Progression ➔ Verification ➔ Store Idempotency
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AcademicWorkflowService } from "../../src/lib/intelligence/academic/academicWorkflowService.js";
import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { WORKFLOW_STATES } from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";

test("▶ [WORKFLOW-E2E-1] Golden Scenario: Multi-Step Task Execution & Verification Lifecycle", async (t) => {
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
      insightId: "INS_GRADUATION_2026",
      type: "DEADLINE_ALERT",
      title: "Hạn chót xét tốt nghiệp đợt 2",
      whatChanged: "Thời hạn đăng ký gia hạn đến 05/09/2026.",
      whyItMatters: "Bạn thuộc Khóa K24 đủ điều kiện nhưng chưa nộp hồ sơ xét tốt nghiệp.",
      impact: "HIGH",
      deadline: "2026-09-05",
      source: { sourceId: "SRC_HCMUTE_DAOTAO", canonicalUrl: "https://daotao.hcmute.edu.vn" }
    }
  ];

  let task;

  await t.test("E2E1.1: generates authoritative ActionPlan and multi-step AcademicTask from insight", () => {
    const { plans, tasks } = AcademicWorkflowService.generateActionPlansForStudent(studentProfile, sampleInsights);
    assert.equal(plans.length, 1);
    assert.equal(tasks.length, 1);

    task = tasks[0];
    assert.equal(task.studentId, "24110001");
    assert.equal(task.status, WORKFLOW_STATES.READY);
    assert.equal(task.steps.length, 4);
    assert.equal(task.steps[0].status, WORKFLOW_STATES.COMPLETED); // Auto-completed because earnedCredits >= 110
    assert.equal(task.progress.completedSteps, 1);
    assert.equal(task.progress.percentage, 25);
  });

  await t.test("E2E1.2: student starts task (transitions to IN_PROGRESS)", () => {
    task = AcademicWorkflowService.startTask(task.taskId, "24110001");
    assert.equal(task.status, WORKFLOW_STATES.IN_PROGRESS);
  });

  await t.test("E2E1.3: student executes Step 2 and Step 3 sequentially", () => {
    const step2 = task.steps[1];
    task = AcademicWorkflowService.completeStep(task.taskId, step2.stepId, "24110001", {
      type: "DOCUMENT_UPLOAD",
      filename: "chung_chi_toeic.pdf"
    });

    assert.equal(task.steps[1].status, WORKFLOW_STATES.COMPLETED);
    assert.equal(task.progress.completedSteps, 2);
    assert.equal(task.progress.percentage, 50);

    const step3 = task.steps[2];
    task = AcademicWorkflowService.completeStep(task.taskId, step3.stepId, "24110001", {
      type: "APPLICATION_ID",
      reference: "APP_2026_98812"
    });

    assert.equal(task.steps[2].status, WORKFLOW_STATES.COMPLETED);
    assert.equal(task.progress.completedSteps, 3);
    assert.equal(task.progress.percentage, 75);
  });

  await t.test("E2E1.4: student completes final Step 4 -> task transitions to COMPLETED", () => {
    const step4 = task.steps[3];
    task = AcademicWorkflowService.completeStep(task.taskId, step4.stepId, "24110001");

    assert.equal(task.steps[3].status, WORKFLOW_STATES.COMPLETED);
    assert.equal(task.progress.percentage, 100);
    assert.equal(task.status, WORKFLOW_STATES.COMPLETED);
    assert.ok(task.completedAt);
  });

  await t.test("E2E1.5: re-processing the same insight is strictly idempotent (no duplicate task created)", () => {
    const { plans, tasks } = AcademicWorkflowService.generateActionPlansForStudent(studentProfile, sampleInsights);
    assert.equal(plans.length, 1);
    assert.equal(tasks.length, 1);

    const reprocessedTask = tasks[0];
    assert.equal(reprocessedTask.taskId, task.taskId);
    assert.equal(reprocessedTask.status, WORKFLOW_STATES.COMPLETED);
    assert.equal(reprocessedTask.progress.percentage, 100);
  });
});
