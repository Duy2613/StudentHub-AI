/**
 * StudentHub AI — Academic Roadmap Twin Change Tests
 * Covers: Twin state change (TOEIC score update, credit gain) -> dynamic roadmap milestone transition
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicRoadmapEngine } from "../../src/lib/intelligence/academic/academicRoadmapEngine.js";
import { MILESTONE_TYPES, MILESTONE_STATES } from "../../src/lib/intelligence/academic/academicMilestoneModel.js";

describe("Academic Roadmap Dynamic Projection on Twin Change", () => {
  it("should transition LANGUAGE_REQUIREMENT from IN_PROGRESS to COMPLETED when TOEIC reaches threshold", () => {
    // Twin Before: TOEIC 450 (below K24 threshold 500)
    const profileBefore = {
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
      graduationRequirements: [
        { requirementType: "CERTIFICATE_PRESENT", currentValue: 450, requiredValue: 500 }
      ],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const roadmapBefore = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profileBefore, null, null, []);
    const msBefore = roadmapBefore.allMilestones.find(m => m.type === MILESTONE_TYPES.LANGUAGE_REQUIREMENT);
    assert.strictEqual(msBefore.state, MILESTONE_STATES.IN_PROGRESS);
    assert.strictEqual(msBefore.isSatisfied, false);

    // Twin After: TOEIC 600 (passes K24 threshold 500)
    const profileAfter = {
      ...profileBefore,
      profileRevision: 2,
      graduationRequirements: [
        { requirementType: "CERTIFICATE_PRESENT", currentValue: 600, requiredValue: 500 }
      ]
    };

    const roadmapAfter = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profileAfter, null, null, []);
    const msAfter = roadmapAfter.allMilestones.find(m => m.type === MILESTONE_TYPES.LANGUAGE_REQUIREMENT);
    assert.strictEqual(msAfter.state, MILESTONE_STATES.COMPLETED);
    assert.strictEqual(msAfter.isSatisfied, true);
    assert.strictEqual(roadmapAfter.progress.completed, roadmapBefore.progress.completed + 1);
  });

  it("should unlock GRADUATION_APPLICATION to READY when all prerequisites complete", () => {
    const fullySatisfiedProfile = {
      studentId: "24110001",
      profileRevision: 5,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 150, cgpa: 3.2, expectedGraduationYear: 2028 },
      graduationRequirements: [
        { requirementType: "CREDITS_MIN", currentValue: 150, requiredValue: 150 },
        { requirementType: "GPA_MIN", currentValue: 3.2, requiredValue: 2.0 },
        { requirementType: "CERTIFICATE_PRESENT", currentValue: 600, requiredValue: 500 },
        { requirementType: "TUITION_CLEAR", currentValue: 0, requiredValue: 0 }
      ],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const eligibility = {
      evidence: [
        { type: "CREDITS_MIN", satisfied: true, actualValue: 150, requiredValue: 150 },
        { type: "GPA_MIN", satisfied: true, actualValue: 3.2, requiredValue: 2.0 },
        { type: "CERTIFICATE_PRESENT", satisfied: true, actualValue: 600, requiredValue: 500 },
        { type: "TUITION_CLEAR", satisfied: true, actualValue: 0, requiredValue: 0 }
      ],
      missingRequirements: []
    };

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("24110001", fullySatisfiedProfile, null, eligibility, []);
    const gradAppMs = roadmap.allMilestones.find(m => m.type === MILESTONE_TYPES.GRADUATION_APPLICATION);

    assert.ok(gradAppMs);
    assert.strictEqual(gradAppMs.state, MILESTONE_STATES.READY);
    assert.ok(roadmap.nextMilestones.some(m => m.type === MILESTONE_TYPES.GRADUATION_APPLICATION));
  });
});
