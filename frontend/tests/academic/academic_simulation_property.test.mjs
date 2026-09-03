/**
 * StudentHub AI — Academic Simulation Property & Metamorphic Tests
 * Covers: Monotonic progress invariance, serialization invariance, and idempotency
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicSimulationEngine } from "../../src/lib/intelligence/academic/academicSimulationEngine.js";
import { SCENARIO_OPERATIONS } from "../../src/lib/intelligence/academic/academicSimulationModel.js";

describe("Academic Simulation Property & Metamorphic Invariants", () => {
  it("[PROPERTY-1: Monotonicity] Increasing earned credits never decreases roadmap progress", () => {
    const profile = {
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 100, cgpa: 2.85 },
      graduationRequirements: [
        { requirementId: "REQ_TOTAL_CREDITS", requirementType: "CREDITS_MIN", currentValue: 100, requiredValue: 150 }
      ],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const simLow = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario: [{ type: SCENARIO_OPERATIONS.ADD_CREDITS, value: 10 }],
      profile360: profile
    });

    const simHigh = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario: [{ type: SCENARIO_OPERATIONS.ADD_CREDITS, value: 50 }],
      profile360: profile
    });

    assert.ok(simHigh.projected.roadmapProgress.percentage >= simLow.projected.roadmapProgress.percentage);
    assert.ok(simHigh.projected.earnedCredits > simLow.projected.earnedCredits);
  });

  it("[METAMORPHIC-1: Serialization Invariance] Serializing and parsing scenario produces identical results", () => {
    const profile = {
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const rawScenario = [
      { type: SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE, certificateType: "TOEIC", score: 650 },
      { type: SCENARIO_OPERATIONS.ADD_CREDITS, value: 15 }
    ];

    const serializedScenario = JSON.parse(JSON.stringify(rawScenario));

    const sim1 = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario: rawScenario,
      profile360: profile
    });

    const sim2 = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario: serializedScenario,
      profile360: profile
    });

    assert.deepStrictEqual(sim1.baseline, sim2.baseline);
    assert.deepStrictEqual(sim1.projected, sim2.projected);
    assert.strictEqual(sim1.deltas.length, sim2.deltas.length);
  });
});
