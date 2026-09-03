import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicPlanDriftEngine } from "../../src/lib/intelligence/academic/academicPlanDriftEngine.js";
import { AcademicDecisionStore } from "../../src/lib/intelligence/academic/academicDecisionStore.js";
import { AcademicDecisionModel } from "../../src/lib/intelligence/academic/academicDecisionModel.js";
import { DRIFT_SEVERITY, EXECUTION_STATUS, REPLAN_RECOMMENDATION } from "../../src/lib/intelligence/academic/academicExecutionModel.js";

describe("AcademicPlanDriftEngine", () => {
  beforeEach(() => {
    AcademicDecisionStore.clear();
  });

  it("should detect CRITICAL drift when a prerequisite course fails (Grade F)", () => {
    const adopted = AcademicDecisionModel.createAdoptedPlanRecord({
      studentId: "24110001",
      planId: "PLAN_24110001_2026-HK1_RECOMMENDED",
      targetTerm: "2026-HK1",
      totalCredits: 7,
      selectedCourses: [
        { code: "DSA202", name: "Cấu trúc dữ liệu & Giải thuật", credits: 4, unlockedDownstreamCount: 3 },
        { code: "DB201", name: "Cơ sở dữ liệu", credits: 3, unlockedDownstreamCount: 2 }
      ],
      selectedActions: [],
      baseRevisions: { profileRevision: 1, twinRevision: 1 }
    });

    AcademicDecisionStore.saveAdoption(adopted);

    const exec = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      academicRecords: {
        courses: [
          { courseCode: "DSA202", grade: "F", status: "FAILED" }
        ]
      },
      digitalTwin: { revision: 1, certificates: [] },
      profile360: { profileRevision: 1 }
    });

    assert.strictEqual(exec.status, EXECUTION_STATUS.BLOCKED);
    assert.strictEqual(exec.drift.driftState, DRIFT_SEVERITY.CRITICAL);
    assert.strictEqual(exec.drift.recommendedResponse, REPLAN_RECOMMENDATION.REPLAN);
    assert.ok(exec.drift.driftReasons.some(r => r.includes("tiên quyết của 3 học phần")));
    assert.ok(exec.drift.replanRationale.includes("nghẽn lộ trình tốt nghiệp"));
  });

  it("should detect NO_DRIFT and 100% completion when all planned items succeed", () => {
    const adopted = AcademicDecisionModel.createAdoptedPlanRecord({
      studentId: "24110001",
      planId: "PLAN_24110001_2026-HK1_RECOMMENDED",
      targetTerm: "2026-HK1",
      totalCredits: 6,
      selectedCourses: [
        { code: "MATH102", name: "Toán 2", credits: 3 },
        { code: "DB201", name: "Cơ sở dữ liệu", credits: 3 }
      ],
      selectedActions: [],
      baseRevisions: { profileRevision: 1, twinRevision: 1 }
    });

    AcademicDecisionStore.saveAdoption(adopted);

    const exec = AcademicPlanDriftEngine.evaluateExecution({
      studentId: "24110001",
      targetTerm: "2026-HK1",
      academicRecords: {
        courses: [
          { courseCode: "MATH102", grade: "A", status: "COMPLETED" },
          { courseCode: "DB201", grade: "B", status: "COMPLETED" }
        ]
      },
      digitalTwin: { revision: 1, certificates: [] },
      profile360: { profileRevision: 1 }
    });

    assert.strictEqual(exec.status, EXECUTION_STATUS.COMPLETED);
    assert.strictEqual(exec.drift.driftState, DRIFT_SEVERITY.NONE);
    assert.strictEqual(exec.progress.progressPercentage, 100);
    assert.strictEqual(exec.progress.actualCompletedCredits, 6);
  });
});
