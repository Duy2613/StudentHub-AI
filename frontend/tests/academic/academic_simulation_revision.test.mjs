/**
 * StudentHub AI — Academic Simulation Revision Pinning Tests
 * Covers: Base revisions capture, deterministic output, curriculum version alignment
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicSimulationEngine } from "../../src/lib/intelligence/academic/academicSimulationEngine.js";
import { SCENARIO_OPERATIONS } from "../../src/lib/intelligence/academic/academicSimulationModel.js";

describe("Academic Simulation Revision Pinning", () => {
  it("should capture and pin base profileRevision and twinRevision", () => {
    const profile = {
      studentId: "24110001",
      profileRevision: 7,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const twin = {
      studentId: "24110001",
      revision: 4,
      cgpa: 2.85,
      earnedCredits: 115,
      courses: [],
      certificates: [],
      tuitionPaid: true,
      debtAmount: 0
    };

    const result = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario: [{ type: SCENARIO_OPERATIONS.SET_GPA, value: 3.5 }],
      profile360: profile,
      digitalTwin: twin
    });

    assert.strictEqual(result.baseRevisions.profileRevision, 7);
    assert.strictEqual(result.baseRevisions.twinRevision, 4);
    assert.strictEqual(result.baseRevisions.curriculumVersion, "HCMUTE_SE_2024");
  });

  it("should produce deterministic outputs for identical clock and baseline inputs", () => {
    const fixedClock = { now: () => 1771984800000, nowIso: () => "2026-08-26T10:00:00.000Z" };
    const profile = {
      studentId: "24110001",
      profileRevision: 2,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const sim1 = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario: [{ type: SCENARIO_OPERATIONS.ADD_CREDITS, value: 10 }],
      profile360: profile,
      clock: fixedClock
    });

    const sim2 = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario: [{ type: SCENARIO_OPERATIONS.ADD_CREDITS, value: 10 }],
      profile360: profile,
      clock: fixedClock
    });

    assert.strictEqual(sim1.projected.earnedCredits, sim2.projected.earnedCredits);
    assert.strictEqual(sim1.projected.roadmapProgress.percentage, sim2.projected.roadmapProgress.percentage);
  });
});
