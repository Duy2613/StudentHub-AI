import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicDecisionEngine } from "../../src/lib/intelligence/academic/academicDecisionEngine.js";
import { AcademicDecisionStore } from "../../src/lib/intelligence/academic/academicDecisionStore.js";
import { ADOPTION_STATUS } from "../../src/lib/intelligence/academic/academicDecisionModel.js";

describe("AcademicPlanAdoption", () => {
  beforeEach(() => {
    AcademicDecisionStore.clear();
  });

  it("should adopt a valid candidate plan and store adoption record", () => {
    const studio = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    const targetPlan = studio.plans[0];
    const adoptRes = AcademicDecisionEngine.adoptPlan({
      studentId: "24110001",
      planId: targetPlan.planId,
      targetTerm: "2026-HK1"
    });

    assert.strictEqual(adoptRes.success, true);
    assert.strictEqual(adoptRes.adoptedPlan.planId, targetPlan.planId);
    assert.strictEqual(adoptRes.adoptedPlan.status, ADOPTION_STATUS.ADOPTED);
    assert.ok(adoptRes.actionBridge.workflowUrl.includes("/academic"));

    // Verify retrieval from store
    const active = AcademicDecisionStore.getActiveAdoption("24110001", "2026-HK1");
    assert.ok(active);
    assert.strictEqual(active.planId, targetPlan.planId);
  });

  it("should mark previous adoption for the same term as SUPERSEDED when a new plan is adopted", () => {
    const studio = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: "24110001",
      targetTerm: "2026-HK1"
    });

    const plan1 = studio.plans[0];
    const plan2 = studio.plans[1];

    AcademicDecisionEngine.adoptPlan({ studentId: "24110001", planId: plan1.planId, targetTerm: "2026-HK1" });
    AcademicDecisionEngine.adoptPlan({ studentId: "24110001", planId: plan2.planId, targetTerm: "2026-HK1" });

    const active = AcademicDecisionStore.getActiveAdoption("24110001", "2026-HK1");
    assert.strictEqual(active.planId, plan2.planId);

    const history = AcademicDecisionStore.getAdoptionsByStudent("24110001");
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].status, ADOPTION_STATUS.SUPERSEDED);
    assert.strictEqual(history[1].status, ADOPTION_STATUS.ADOPTED);
  });
});
