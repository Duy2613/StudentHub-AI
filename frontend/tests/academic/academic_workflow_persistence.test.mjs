/**
 * StudentHub AI — Academic Workflow Persistence Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { WORKFLOW_STATES } from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";

const TEST_STORAGE_PATH = path.resolve(process.cwd(), ".data", "test_academic_workflow_persistence.json");

test("▶ [WORKFLOW-PERSISTENCE-1] Durable Write-Through & Atomic File Storage", async (t) => {
  AcademicTaskStore.setStoragePath(TEST_STORAGE_PATH);
  AcademicTaskStore.resetStore();

  const plan = {
    planId: "PLAN_TEST_001",
    studentId: "24110001",
    title: "Kế hoạch tốt nghiệp K24",
    status: "READY",
    revision: 1
  };

  const task = {
    taskId: "TASK_TEST_001",
    planId: "PLAN_TEST_001",
    studentId: "24110001",
    type: "GRADUATION_SUBMISSION",
    title: "Nộp hồ sơ tốt nghiệp",
    status: WORKFLOW_STATES.IN_PROGRESS,
    progress: { completedSteps: 1, totalSteps: 3, percentage: 33 },
    steps: [
      { stepId: "S1", title: "Kiểm tra tín chỉ", status: WORKFLOW_STATES.COMPLETED },
      { stepId: "S2", title: "Nộp chứng chỉ TOEIC", status: WORKFLOW_STATES.NOT_STARTED },
      { stepId: "S3", title: "Xác nhận học phí", status: WORKFLOW_STATES.NOT_STARTED }
    ],
    revision: 1
  };

  await t.test("WP1.1: saves plan and task and automatically flushes to disk", () => {
    AcademicTaskStore.savePlan(plan);
    AcademicTaskStore.saveTask(task);

    assert.ok(fs.existsSync(TEST_STORAGE_PATH), "Storage file should exist on disk");
    const content = JSON.parse(fs.readFileSync(TEST_STORAGE_PATH, "utf-8"));
    assert.equal(content.plans.length, 1);
    assert.equal(content.tasks.length, 1);
    assert.equal(content.tasks[0].taskId, "TASK_TEST_001");
  });

  await t.test("WP1.2: rehydrates identical state from disk into clean in-memory store", () => {
    // Rehydrate
    AcademicTaskStore.rehydrate();

    const retrievedPlan = AcademicTaskStore.getPlan("PLAN_TEST_001");
    const retrievedTask = AcademicTaskStore.getTask("TASK_TEST_001");

    assert.ok(retrievedPlan);
    assert.equal(retrievedPlan.title, "Kế hoạch tốt nghiệp K24");

    assert.ok(retrievedTask);
    assert.equal(retrievedTask.status, WORKFLOW_STATES.IN_PROGRESS);
    assert.equal(retrievedTask.steps.length, 3);
    assert.equal(retrievedTask.steps[0].status, WORKFLOW_STATES.COMPLETED);
    assert.equal(retrievedTask.progress.percentage, 33);
  });

  await t.test("WP1.3: enforces event deduplication by eventId", () => {
    const event = {
      eventId: "EVT_TEST_UNIQUE_001",
      taskId: "TASK_TEST_001",
      type: "TASK_STARTED",
      actor: "STUDENT",
      timestamp: new Date().toISOString()
    };

    AcademicTaskStore.recordEvent("TASK_TEST_001", event);
    AcademicTaskStore.recordEvent("TASK_TEST_001", event); // Duplicate attempt

    const events = AcademicTaskStore.getEvents("TASK_TEST_001");
    const matching = events.filter(e => e.eventId === "EVT_TEST_UNIQUE_001");
    assert.equal(matching.length, 1, "Duplicate eventId must be ignored");
  });

  // Cleanup test file
  AcademicTaskStore.resetStore();
});
