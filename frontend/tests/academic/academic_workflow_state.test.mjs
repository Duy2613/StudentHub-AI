/**
 * StudentHub AI — Academic Workflow State Machine Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  AcademicWorkflowStateMachine,
  WORKFLOW_STATES,
  WORKFLOW_EVENTS
} from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";

test("▶ [STATE-MACHINE-1] Valid State Transitions", async (t) => {
  await t.test("SM1.1: permits standard progression from NOT_STARTED to COMPLETED", () => {
    assert.equal(AcademicWorkflowStateMachine.canTransition(WORKFLOW_STATES.NOT_STARTED, WORKFLOW_STATES.READY), true);
    assert.equal(AcademicWorkflowStateMachine.canTransition(WORKFLOW_STATES.READY, WORKFLOW_STATES.IN_PROGRESS), true);
    assert.equal(AcademicWorkflowStateMachine.canTransition(WORKFLOW_STATES.IN_PROGRESS, WORKFLOW_STATES.PENDING_VERIFICATION), true);
    assert.equal(AcademicWorkflowStateMachine.canTransition(WORKFLOW_STATES.PENDING_VERIFICATION, WORKFLOW_STATES.COMPLETED), true);
  });

  await t.test("SM1.2: permits transitioning to BLOCKED and recovering to IN_PROGRESS", () => {
    assert.equal(AcademicWorkflowStateMachine.canTransition(WORKFLOW_STATES.IN_PROGRESS, WORKFLOW_STATES.BLOCKED), true);
    assert.equal(AcademicWorkflowStateMachine.canTransition(WORKFLOW_STATES.BLOCKED, WORKFLOW_STATES.IN_PROGRESS), true);
  });

  await t.test("SM1.3: allows idempotent transition to the same state", () => {
    assert.equal(AcademicWorkflowStateMachine.canTransition(WORKFLOW_STATES.IN_PROGRESS, WORKFLOW_STATES.IN_PROGRESS), true);
  });
});

test("▶ [STATE-MACHINE-2] Illegal State Transition Rejections", async (t) => {
  await t.test("SM2.1: rejects COMPLETED reverting to NOT_STARTED or IN_PROGRESS", () => {
    assert.equal(AcademicWorkflowStateMachine.canTransition(WORKFLOW_STATES.COMPLETED, WORKFLOW_STATES.NOT_STARTED), false);
    assert.equal(AcademicWorkflowStateMachine.canTransition(WORKFLOW_STATES.COMPLETED, WORKFLOW_STATES.IN_PROGRESS), false);
    assert.throws(() => {
      AcademicWorkflowStateMachine.validateTransition(WORKFLOW_STATES.COMPLETED, WORKFLOW_STATES.NOT_STARTED);
    }, /Cannot transition workflow/);
  });

  await t.test("SM2.2: rejects CANCELLED transitioning to COMPLETED", () => {
    assert.equal(AcademicWorkflowStateMachine.canTransition(WORKFLOW_STATES.CANCELLED, WORKFLOW_STATES.COMPLETED), false);
  });
});

test("▶ [STATE-MACHINE-3] Immutable Event Creation", async (t) => {
  await t.test("SM3.1: creates valid immutable workflow events", () => {
    const ev = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_STEP_COMPLETED, {
      taskId: "TASK_001",
      fromState: WORKFLOW_STATES.IN_PROGRESS,
      toState: WORKFLOW_STATES.IN_PROGRESS,
      actor: "24110001",
      reason: "Nộp hồ sơ thành công"
    });

    assert.equal(ev.type, "TASK_STEP_COMPLETED");
    assert.equal(ev.taskId, "TASK_001");
    assert.equal(ev.actor, "24110001");
    assert.ok(ev.timestamp);
    assert.ok(Object.isFrozen(ev));
  });
});
