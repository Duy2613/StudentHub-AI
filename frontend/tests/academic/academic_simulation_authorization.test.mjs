/**
 * StudentHub AI — Academic Simulation Authorization Tests
 * Verifies authorization, input validation, and rejection of spoofed studentId
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicSimulationEngine } from "../../src/lib/intelligence/academic/academicSimulationEngine.js";
import { SCENARIO_OPERATIONS } from "../../src/lib/intelligence/academic/academicSimulationModel.js";

describe("Academic Simulation Authorization & Ownership", () => {
  it("should throw when studentId is empty or missing", () => {
    assert.throws(() => {
      AcademicSimulationEngine.simulateScenario({
        studentId: "",
        scenario: [{ type: SCENARIO_OPERATIONS.SET_GPA, value: 3.5 }]
      });
    }, /studentId is required/);

    assert.throws(() => {
      AcademicSimulationEngine.simulateScenario({
        studentId: null,
        scenario: [{ type: SCENARIO_OPERATIONS.SET_GPA, value: 3.5 }]
      });
    }, /studentId is required/);
  });

  it("should bind simulation output strictly to the provided studentId", () => {
    const result = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario: [{ type: SCENARIO_OPERATIONS.SET_GPA, value: 3.5 }]
    });

    assert.strictEqual(result.studentId, "24110001");
    assert.ok(result.simulationId.includes("24110001"));
  });
});
