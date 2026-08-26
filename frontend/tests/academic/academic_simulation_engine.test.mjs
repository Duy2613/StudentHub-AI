/**
 * StudentHub AI — Academic Simulation Engine Tests
 * Covers: Scenario validation, sandbox cloning, typed operations, eligibility & roadmap projection, delta computation
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicSimulationEngine } from "../../src/lib/intelligence/academic/academicSimulationEngine.js";
import { AcademicSimulationModel, SCENARIO_OPERATIONS, DELTA_TYPES } from "../../src/lib/intelligence/academic/academicSimulationModel.js";
import { ELIGIBILITY_STATUS } from "../../src/lib/intelligence/academic/academicEligibilityEngine.js";
import { MILESTONE_TYPES, MILESTONE_STATES } from "../../src/lib/intelligence/academic/academicMilestoneModel.js";

function makeBaseProfile() {
  return {
    studentId: "24110001",
    profileRevision: 3,
    identity: { cohort: 2024, programCode: "7480103", fullName: "Nguyễn Văn Duy" },
    academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
    graduationRequirements: [
      { requirementId: "REQ_TOTAL_CREDITS", requirementType: "CREDITS_MIN", currentValue: 115, requiredValue: 150, isSatisfied: false },
      { requirementId: "REQ_MIN_GPA", requirementType: "GPA_MIN", currentValue: 2.85, requiredValue: 2.0, isSatisfied: true },
      { requirementId: "REQ_ENGLISH_TOEIC", requirementType: "CERTIFICATE_PRESENT", currentValue: 450, requiredValue: 500, isSatisfied: false },
      { requirementId: "REQ_TUITION_CLEARANCE", requirementType: "TUITION_CLEAR", currentValue: 0, requiredValue: 0, isSatisfied: true }
    ],
    financialClearance: { isCleared: true, remainingDebt: 0 },
    freshness: { sections: { identity: "FRESH", transcripts: "FRESH" } }
  };
}

function makeBaseTwin() {
  return {
    studentId: "24110001",
    revision: 2,
    cgpa: 2.85,
    earnedCredits: 115,
    courses: [
      { courseCode: "SWEN330103", credits: 3, isPassed: true, status: "COMPLETED" },
      { courseCode: "INTR430103", credits: 3, isPassed: true, status: "COMPLETED" }
    ],
    certificates: [
      { type: "TOEIC", score: 450, verificationStatus: "VERIFIED" }
    ],
    tuitionPaid: true,
    debtAmount: 0,
    isThesisEligible: false,
    isGraduationReady: false
  };
}

describe("AcademicSimulationEngine", () => {
  it("should run simulation with TOEIC score upgrade and unlock milestone", () => {
    const profile = makeBaseProfile();
    const twin = makeBaseTwin();

    const scenario = [
      { type: SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE, certificateType: "TOEIC", score: 550 }
    ];

    const result = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario,
      profile360: profile,
      digitalTwin: twin
    });

    assert.strictEqual(result.mode, "SIMULATION");
    assert.strictEqual(result.isSimulated, true);
    assert.strictEqual(result.studentId, "24110001");
    
    // Baseline had 450 TOEIC (2/7 milestones completed = 29%), Simulated has 550 (3/7 = 43%)
    assert.strictEqual(result.baseline.roadmapProgress.percentage, 29);
    assert.ok(result.projected.roadmapProgress.percentage > 29);

    // Verify deltas
    const langDelta = result.deltas.find(d => d.field === MILESTONE_TYPES.LANGUAGE_REQUIREMENT);
    assert.ok(langDelta);
    assert.strictEqual(langDelta.before, MILESTONE_STATES.IN_PROGRESS);
    assert.strictEqual(langDelta.after, MILESTONE_STATES.COMPLETED);
    assert.ok(langDelta.whyItChanged.includes("CTĐT"));
  });

  it("should simulate credit addition and update earnedCredits", () => {
    const profile = makeBaseProfile();
    const twin = makeBaseTwin();

    const scenario = [
      { type: SCENARIO_OPERATIONS.ADD_CREDITS, value: 35 } // 115 + 35 = 150
    ];

    const result = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario,
      profile360: profile,
      digitalTwin: twin
    });

    assert.strictEqual(result.projected.earnedCredits, 150);
    const creditsDelta = result.deltas.find(d => d.field === MILESTONE_TYPES.ACADEMIC_PROGRESS);
    assert.ok(creditsDelta);
    assert.strictEqual(creditsDelta.after, MILESTONE_STATES.COMPLETED);
  });

  it("should simulate multi-operation scenario (TOEIC + Credits) unlocking graduation readiness", () => {
    const profile = makeBaseProfile();
    const twin = makeBaseTwin();

    const scenario = [
      { type: SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE, certificateType: "TOEIC", score: 600 },
      { type: SCENARIO_OPERATIONS.ADD_CREDITS, value: 35 }
    ];

    const result = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario,
      profile360: profile,
      digitalTwin: twin
    });

    assert.strictEqual(result.projected.eligibilityStatus, ELIGIBILITY_STATUS.ELIGIBLE);
    assert.strictEqual(result.projected.isEligible, true);

    const gradAppDelta = result.deltas.find(d => d.field === MILESTONE_TYPES.GRADUATION_APPLICATION);
    assert.ok(gradAppDelta);
    assert.strictEqual(gradAppDelta.after, MILESTONE_STATES.READY);
  });

  it("should reject invalid scenario or forbidden operations", () => {
    const profile = makeBaseProfile();
    const twin = makeBaseTwin();

    assert.throws(() => {
      AcademicSimulationEngine.simulateScenario({
        studentId: "24110001",
        scenario: [{ type: "FORCE_ELIGIBLE" }],
        profile360: profile,
        digitalTwin: twin
      });
    }, /Invalid scenario/);
  });
});
