/**
 * StudentHub AI — Academic Simulation Side-Effect Firewall Tests
 * Proves that running simulations NEVER mutates baseline stores or persistent data
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicSimulationEngine } from "../../src/lib/intelligence/academic/academicSimulationEngine.js";
import { SCENARIO_OPERATIONS } from "../../src/lib/intelligence/academic/academicSimulationModel.js";
import { StudentProfile360Store } from "../../src/lib/intelligence/academic/studentProfile360Store.js";
import { StudentDigitalTwinStore } from "../../src/lib/intelligence/academic/studentDigitalTwinStore.js";
import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";

describe("Academic Simulation Side-Effect Firewall", () => {
  it("should not mutate the input profile or twin objects in memory", () => {
    const originalProfile = Object.freeze({
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85 },
      graduationRequirements: [
        { requirementId: "REQ_ENGLISH_TOEIC", requirementType: "CERTIFICATE_PRESENT", currentValue: 450, requiredValue: 500 }
      ],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    });

    const originalTwin = Object.freeze({
      studentId: "24110001",
      revision: 1,
      cgpa: 2.85,
      earnedCredits: 115,
      courses: [],
      certificates: [{ type: "TOEIC", score: 450, verificationStatus: "VERIFIED" }],
      tuitionPaid: true,
      debtAmount: 0
    });

    const scenario = [
      { type: SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE, certificateType: "TOEIC", score: 990 },
      { type: SCENARIO_OPERATIONS.ADD_CREDITS, value: 50 },
      { type: SCENARIO_OPERATIONS.SET_GPA, value: 4.0 }
    ];

    // Run simulation
    const result = AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario,
      profile360: originalProfile,
      digitalTwin: originalTwin
    });

    // Invariant: original objects were not mutated
    assert.strictEqual(originalProfile.academicSummary.earnedCredits, 115);
    assert.strictEqual(originalProfile.academicSummary.cgpa, 2.85);
    assert.strictEqual(originalTwin.earnedCredits, 115);
    assert.strictEqual(originalTwin.cgpa, 2.85);
    assert.strictEqual(originalTwin.certificates[0].score, 450);

    // Invariant: simulated state reflects the scenario
    assert.strictEqual(result.projected.earnedCredits, 165);
    assert.strictEqual(result.projected.cgpa, 4.0);
  });

  it("should not create tasks or notifications in persistent stores", () => {
    const initialTaskCount = AcademicTaskStore.getAllTasks ? AcademicTaskStore.getAllTasks().length : 0;
    const initialNotifCount = AcademicNotificationStore.getNotificationsByStudent("24110001").length;

    const scenario = [
      { type: SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE, certificateType: "TOEIC", score: 600 }
    ];

    AcademicSimulationEngine.simulateScenario({
      studentId: "24110001",
      scenario
    });

    const afterTaskCount = AcademicTaskStore.getAllTasks ? AcademicTaskStore.getAllTasks().length : 0;
    const afterNotifCount = AcademicNotificationStore.getNotificationsByStudent("24110001").length;

    assert.strictEqual(afterTaskCount, initialTaskCount);
    assert.strictEqual(afterNotifCount, initialNotifCount);
  });
});
