/**
 * StudentHub AI — Academic Roadmap Mutation & Invariant Defense Tests
 * 
 * Invariant checks that catch simulated mutants:
 * - Mutant 1: Hardcoded progress percentage
 * - Mutant 2: Cohort curriculum version bypass
 * - Mutant 3: Masking STALE/CONFLICTED as FRESH
 * - Mutant 4: Unauthenticated/empty studentId bypass
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicRoadmapEngine, ROADMAP_FRESHNESS } from "../../src/lib/intelligence/academic/academicRoadmapEngine.js";
import { AcademicMilestoneModel, MILESTONE_TYPES, MILESTONE_STATES } from "../../src/lib/intelligence/academic/academicMilestoneModel.js";

describe("Academic Roadmap Mutation & Invariant Killers", () => {
  it("[MUTANT-KILLER-1] Must compute dynamic progress from milestone states, never hardcode", () => {
    const profileZero = {
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 0, cgpa: 0, expectedGraduationYear: 2028 },
      graduationRequirements: [],
      financialClearance: { isCleared: false, remainingDebt: 10000000 },
      freshness: { sections: {} }
    };
    const eligibilityZero = {
      evidence: [
        { type: "CREDITS_MIN", satisfied: false, actualValue: 0, requiredValue: 150 },
        { type: "GPA_MIN", satisfied: false, actualValue: 0, requiredValue: 2.0 },
        { type: "CERTIFICATE_PRESENT", satisfied: false, actualValue: 0, requiredValue: 500 },
        { type: "TUITION_CLEAR", satisfied: false, actualValue: 10000000, requiredValue: 0 }
      ],
      missingRequirements: ["Credits", "GPA", "TOEIC", "Tuition"]
    };

    const roadmapZero = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profileZero, null, eligibilityZero, []);
    assert.strictEqual(roadmapZero.progress.completed, 0);
    assert.strictEqual(roadmapZero.progress.percentage, 0);

    const profileFull = {
      studentId: "24110001",
      profileRevision: 2,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 150, cgpa: 3.5, expectedGraduationYear: 2028 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };
    const eligibilityFull = {
      evidence: [
        { type: "CREDITS_MIN", satisfied: true, actualValue: 150, requiredValue: 150 },
        { type: "GPA_MIN", satisfied: true, actualValue: 3.5, requiredValue: 2.0 },
        { type: "CERTIFICATE_PRESENT", satisfied: true, actualValue: 600, requiredValue: 500 },
        { type: "TUITION_CLEAR", satisfied: true, actualValue: 0, requiredValue: 0 }
      ],
      missingRequirements: []
    };
    const twinFull = { isThesisEligible: true, isGraduationReady: true };

    const roadmapFull = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profileFull, twinFull, eligibilityFull, []);
    assert.ok(roadmapFull.progress.percentage > roadmapZero.progress.percentage);
    assert.strictEqual(roadmapFull.progress.completed >= 4, true);
  });

  it("[MUTANT-KILLER-2] Must strictly respect cohort curriculum versioning", () => {
    const profileK26 = {
      studentId: "26110001",
      profileRevision: 1,
      identity: { cohort: 2026, programCode: "7480103" },
      academicSummary: { earnedCredits: 20, cgpa: 3.0, expectedGraduationYear: 2030 },
      graduationRequirements: [
        { requirementType: "CERTIFICATE_PRESENT", currentValue: 500, requiredValue: 550 }
      ],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const roadmapK26 = AcademicRoadmapEngine.buildStudentRoadmap("26110001", profileK26, null, null, []);
    const toeicMs = roadmapK26.allMilestones.find(m => m.type === MILESTONE_TYPES.LANGUAGE_REQUIREMENT);

    // K26 requires 550, so 500 is IN_PROGRESS, not COMPLETED
    assert.strictEqual(toeicMs.requiredValue, 550);
    assert.strictEqual(toeicMs.state, MILESTONE_STATES.IN_PROGRESS);
    assert.strictEqual(toeicMs.isSatisfied, false);
  });

  it("[MUTANT-KILLER-3] Must never mask STALE or CONFLICTED data as FRESH", () => {
    const profileStale = {
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: {
        sections: {
          identity: "FRESH",
          transcripts: "STALE"
        }
      }
    };

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profileStale, null, null, []);
    assert.notStrictEqual(roadmap.freshness, ROADMAP_FRESHNESS.FRESH);
    assert.strictEqual(roadmap.freshness, ROADMAP_FRESHNESS.STALE);
  });

  it("[MUTANT-KILLER-4] Must throw and fail-closed if studentId is missing", () => {
    assert.throws(() => {
      AcademicRoadmapEngine.buildStudentRoadmap("");
    }, /studentId is required/);

    assert.throws(() => {
      AcademicRoadmapEngine.buildStudentRoadmap(undefined);
    }, /studentId is required/);
  });
});
