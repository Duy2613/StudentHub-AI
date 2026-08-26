/**
 * StudentHub AI — Academic Task Model & Deterministic ID Test Suite
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AcademicTaskModel } from "../../src/lib/intelligence/academic/academicTaskModel.js";
import { WORKFLOW_STATES } from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";

test("▶ [TASK-MODEL-1] Deterministic ID Derivation", async (t) => {
  await t.test("TM1.1: derives identical plan ID for same student, insight, and version", () => {
    const id1 = AcademicTaskModel.derivePlanId("24110001", "INS_DEADLINE_2026", "1.0");
    const id2 = AcademicTaskModel.derivePlanId("24110001", "INS_DEADLINE_2026", "1.0");
    assert.equal(id1, "PLAN_24110001_INS_DEADLINE_2026_v1.0");
    assert.equal(id1, id2);
  });

  await t.test("TM1.2: derives distinct plan IDs for distinct students", () => {
    const idA = AcademicTaskModel.derivePlanId("24110001", "INS_DEADLINE_2026");
    const idB = AcademicTaskModel.derivePlanId("24110002", "INS_DEADLINE_2026");
    assert.notEqual(idA, idB);
  });
});

test("▶ [TASK-MODEL-2] Progress Math & Next Action Resolution", async (t) => {
  await t.test("TM2.1: accurately computes progress percentages across steps", () => {
    const steps = [
      { stepId: "S1", title: "Bước 1", status: WORKFLOW_STATES.COMPLETED },
      { stepId: "S2", title: "Bước 2", status: WORKFLOW_STATES.COMPLETED },
      { stepId: "S3", title: "Bước 3", status: WORKFLOW_STATES.NOT_STARTED },
      { stepId: "S4", title: "Bước 4", status: WORKFLOW_STATES.NOT_STARTED }
    ];

    const progress = AcademicTaskModel.calculateProgress(steps);
    assert.equal(progress.completedSteps, 2);
    assert.equal(progress.totalSteps, 4);
    assert.equal(progress.percentage, 50);
  });

  await t.test("TM2.2: resolves the next actionable step in the workflow sequence", () => {
    const steps = [
      { stepId: "S1", index: 0, title: "Bước 1", status: WORKFLOW_STATES.COMPLETED },
      { stepId: "S2", index: 1, title: "Bước 2: Nộp hồ sơ", status: WORKFLOW_STATES.NOT_STARTED },
      { stepId: "S3", index: 2, title: "Bước 3", status: WORKFLOW_STATES.NOT_STARTED }
    ];

    const next = AcademicTaskModel.resolveNextAction(steps);
    assert.ok(next);
    assert.equal(next.stepId, "S2");
    assert.equal(next.title, "Bước 2: Nộp hồ sơ");
  });
});
