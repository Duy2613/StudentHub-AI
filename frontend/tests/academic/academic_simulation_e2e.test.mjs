/**
 * StudentHub AI — Academic Simulation End-to-End Tests
 * Covers: Full golden loop from DataLoader -> Scenario Execution -> Delta Projection -> Real State Invariance
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getAuthoritativeCommandCenterData } from "../../src/lib/intelligence/academic/academicCommandCenterDataLoader.js";
import { AcademicSimulationEngine } from "../../src/lib/intelligence/academic/academicSimulationEngine.js";
import { SCENARIO_OPERATIONS } from "../../src/lib/intelligence/academic/academicSimulationModel.js";
import { ELIGIBILITY_STATUS } from "../../src/lib/intelligence/academic/academicEligibilityEngine.js";
import { MILESTONE_TYPES, MILESTONE_STATES } from "../../src/lib/intelligence/academic/academicMilestoneModel.js";

describe("Academic Simulation E2E Pipeline", () => {
  it("should run full end-to-end simulation from authoritative server data", () => {
    // 1. Load authoritative real data
    const serverData = getAuthoritativeCommandCenterData({ studentId: "24110001" });
    assert.ok(serverData.success);

    const currentCredits = serverData.digitalTwin?.earnedCredits ?? serverData.studentProfile.earnedCredits;
    const initialCgpa = serverData.studentProfile.cgpa;
    const creditsNeeded = Math.max(1, 150 - currentCredits);

    // 2. Define hypothetical scenario
    const scenario = [
      { type: SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE, certificateType: "TOEIC", score: 650 },
      { type: SCENARIO_OPERATIONS.ADD_CREDITS, value: creditsNeeded },
      { type: SCENARIO_OPERATIONS.SET_GPA, value: 3.40 }
    ];

    // 3. Execute pure in-memory simulation
    const simResult = AcademicSimulationEngine.simulateScenario({
      studentId: serverData.studentProfile.studentId,
      scenario,
      profile360: serverData.profile360,
      digitalTwin: serverData.digitalTwin,
      activeTasks: serverData.academicTasks
    });

    // 4. Verify simulation projection
    assert.strictEqual(simResult.mode, "SIMULATION");
    assert.strictEqual(simResult.isSimulated, true);
    assert.strictEqual(simResult.projected.earnedCredits, 150);
    assert.strictEqual(simResult.projected.cgpa, 3.40);
    assert.strictEqual(simResult.projected.eligibilityStatus, ELIGIBILITY_STATUS.ELIGIBLE);
    assert.strictEqual(simResult.projected.isEligible, true);

    const gradAppMilestone = simResult.simulatedRoadmap.allMilestones.find(
      m => m.type === MILESTONE_TYPES.GRADUATION_APPLICATION
    );
    assert.ok(gradAppMilestone);
    assert.strictEqual(gradAppMilestone.state, MILESTONE_STATES.READY);

    // 5. Verify real data was NOT mutated
    const verifyData = getAuthoritativeCommandCenterData({ studentId: "24110001" });
    const verifyCredits = verifyData.digitalTwin?.earnedCredits ?? verifyData.studentProfile.earnedCredits;
    assert.strictEqual(verifyCredits, currentCredits);
    assert.strictEqual(verifyData.studentProfile.cgpa, initialCgpa);
  });
});
