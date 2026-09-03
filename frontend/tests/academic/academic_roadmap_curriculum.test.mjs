/**
 * StudentHub AI — Academic Roadmap Curriculum Tests
 * Covers: Cohort-specific TOEIC thresholds (K23=450, K24=500, K25=500, K26=550), curriculum version awareness
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicRoadmapEngine } from "../../src/lib/intelligence/academic/academicRoadmapEngine.js";
import { MILESTONE_TYPES, MILESTONE_STATES } from "../../src/lib/intelligence/academic/academicMilestoneModel.js";

describe("Academic Roadmap Curriculum Awareness", () => {
  it("should enforce TOEIC 450 for Cohort 2023", () => {
    const profileK23 = {
      studentId: "23110001",
      profileRevision: 1,
      identity: { cohort: 2023, programCode: "7480103" },
      academicSummary: { earnedCredits: 140, cgpa: 3.2, expectedGraduationYear: 2027 },
      graduationRequirements: [
        { requirementType: "CERTIFICATE_PRESENT", currentValue: 460, requiredValue: 450 }
      ],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("23110001", profileK23, null, null, []);
    const toeicMilestone = roadmap.allMilestones.find(m => m.type === MILESTONE_TYPES.LANGUAGE_REQUIREMENT);

    assert.ok(toeicMilestone);
    assert.strictEqual(toeicMilestone.requiredValue, 450);
    assert.strictEqual(toeicMilestone.state, MILESTONE_STATES.COMPLETED);
    assert.strictEqual(roadmap.curriculum.versionId, "HCMUTE_SE_2023");
  });

  it("should enforce TOEIC 500 for Cohort 2024", () => {
    const profileK24 = {
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 100, cgpa: 3.0, expectedGraduationYear: 2028 },
      graduationRequirements: [
        { requirementType: "CERTIFICATE_PRESENT", currentValue: 460, requiredValue: 500 }
      ],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profileK24, null, null, []);
    const toeicMilestone = roadmap.allMilestones.find(m => m.type === MILESTONE_TYPES.LANGUAGE_REQUIREMENT);

    assert.ok(toeicMilestone);
    assert.strictEqual(toeicMilestone.requiredValue, 500);
    assert.strictEqual(toeicMilestone.state, MILESTONE_STATES.IN_PROGRESS);
    assert.strictEqual(roadmap.curriculum.versionId, "HCMUTE_SE_2024");
  });

  it("should enforce TOEIC 550 for Cohort 2026", () => {
    const profileK26 = {
      studentId: "26110001",
      profileRevision: 1,
      identity: { cohort: 2026, programCode: "7480103" },
      academicSummary: { earnedCredits: 30, cgpa: 3.5, expectedGraduationYear: 2030 },
      graduationRequirements: [
        { requirementType: "CERTIFICATE_PRESENT", currentValue: 520, requiredValue: 550 }
      ],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("26110001", profileK26, null, null, []);
    const toeicMilestone = roadmap.allMilestones.find(m => m.type === MILESTONE_TYPES.LANGUAGE_REQUIREMENT);

    assert.ok(toeicMilestone);
    assert.strictEqual(toeicMilestone.requiredValue, 550);
    assert.strictEqual(toeicMilestone.state, MILESTONE_STATES.IN_PROGRESS);
    assert.strictEqual(roadmap.curriculum.versionId, "HCMUTE_SE_2026");
  });
});
