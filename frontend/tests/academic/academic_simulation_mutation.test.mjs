/**
 * StudentHub AI — Academic Simulation Mutation & Invariant Defense Tests
 * 
 * Invariant checks that catch simulated mutants:
 * - Mutant 1: Allowing FORCE_ELIGIBLE bypass
 * - Mutant 2: Allowing out-of-range GPA (>4.0 or <0.0)
 * - Mutant 3: Missing mode="SIMULATION" or isSimulated flag
 * - Mutant 4: Allowing negative or zero credit modifications
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicSimulationEngine } from "../../src/lib/intelligence/academic/academicSimulationEngine.js";
import { AcademicSimulationModel, SCENARIO_OPERATIONS } from "../../src/lib/intelligence/academic/academicSimulationModel.js";

describe("Academic Simulation Mutation & Invariant Killers", () => {
  it("[MUTANT-KILLER-1] Must strictly reject FORCE_ELIGIBLE and FORCE_COMPLETED operations", () => {
    const invalidOps = [
      { type: "FORCE_ELIGIBLE" },
      { type: "FORCE_COMPLETED" },
      { type: "FORCE_GRADUATION" }
    ];

    for (const op of invalidOps) {
      const validation = AcademicSimulationModel.validateScenario([op]);
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.some(e => e.includes("bị cấm")));

      assert.throws(() => {
        AcademicSimulationEngine.simulateScenario({
          studentId: "24110001",
          scenario: [op]
        });
      }, /Invalid scenario/);
    }
  });

  it("[MUTANT-KILLER-2] Must strictly reject GPA values outside [0.0, 4.0]", () => {
    const invalidGpas = [4.5, -0.5, 5.0, "INVALID"];

    for (const gpa of invalidGpas) {
      const validation = AcademicSimulationModel.validateScenario([
        { type: SCENARIO_OPERATIONS.SET_GPA, value: gpa }
      ]);
      assert.strictEqual(validation.valid, false);
    }
  });

  it("[MUTANT-KILLER-3] Must strictly attach mode='SIMULATION' and isSimulated=true", () => {
    const result = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario: [{ type: SCENARIO_OPERATIONS.SET_GPA, value: 3.5 }]
    });

    assert.strictEqual(result.mode, "SIMULATION");
    assert.strictEqual(result.isSimulated, true);
    assert.ok(Array.isArray(result.limitations));
    assert.ok(result.limitations.length > 0);
  });

  it("[MUTANT-KILLER-4] Must reject non-positive or excessive credit additions", () => {
    const invalidCredits = [0, -5, -20, 200, 1.5];

    for (const val of invalidCredits) {
      const validation = AcademicSimulationModel.validateScenario([
        { type: SCENARIO_OPERATIONS.ADD_CREDITS, value: val }
      ]);
      assert.strictEqual(validation.valid, false);
    }
  });
});
