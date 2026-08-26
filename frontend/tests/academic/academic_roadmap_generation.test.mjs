/**
 * StudentHub AI — Roadmap Generation Tests
 * Covers: full roadmap build, progress, current stage, blockers, goal
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicRoadmapEngine, ROADMAP_FRESHNESS, GOAL_CONFIDENCE, JOURNEY_STAGES } from "../../src/lib/intelligence/academic/academicRoadmapEngine.js";
import { MILESTONE_STATES } from "../../src/lib/intelligence/academic/academicMilestoneModel.js";

function makeProfile(overrides = {}) {
  return {
    studentId: "24110001",
    profileRevision: 3,
    identity: { cohort: 2024, programCode: "7480103" },
    academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
    graduationRequirements: [
      { requirementType: "CREDITS_MIN", currentValue: 115, requiredValue: 150 },
      { requirementType: "GPA_MIN", currentValue: 2.85, requiredValue: 2.0 },
      { requirementType: "CERTIFICATE_PRESENT", currentValue: 560, requiredValue: 500 },
      { requirementType: "TUITION_CLEAR", currentValue: 0, requiredValue: 0 }
    ],
    financialClearance: { isCleared: true, remainingDebt: 0 },
    freshness: { sections: { identity: "FRESH", transcripts: "FRESH", certifications: "FRESH", finance: "FRESH" } },
    ...overrides
  };
}

function makeEligibility(overrides = {}) {
  return {
    evidence: [
      { type: "CREDITS_MIN", satisfied: false, actualValue: 115, requiredValue: 150 },
      { type: "GPA_MIN", satisfied: true, actualValue: 2.85, requiredValue: 2.0 },
      { type: "CERTIFICATE_PRESENT", satisfied: true, actualValue: 560, requiredValue: 500 },
      { type: "TUITION_CLEAR", satisfied: true, actualValue: 0, requiredValue: 0 }
    ],
    missingRequirements: [],
    twinRevision: 1,
    ...overrides
  };
}

const fixedClock = { now: () => Date.parse("2026-08-26T10:00:00Z"), nowIso: () => "2026-08-26T10:00:00.000Z" };

describe("AcademicRoadmapEngine.buildStudentRoadmap", () => {
  it("should build a valid roadmap with correct structure", () => {
    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap(
      "24110001", makeProfile(), null, makeEligibility(), [], [], fixedClock
    );

    assert.strictEqual(roadmap.studentId, "24110001");
    assert.ok(roadmap.roadmapId.startsWith("ROADMAP_24110001_r"));
    assert.ok(roadmap.progress);
    assert.ok(roadmap.currentStage);
    assert.ok(Array.isArray(roadmap.completedMilestones));
    assert.ok(Array.isArray(roadmap.activeMilestones));
    assert.ok(Array.isArray(roadmap.nextMilestones));
    assert.ok(Array.isArray(roadmap.upcomingMilestones));
    assert.ok(Array.isArray(roadmap.allMilestones));
    assert.ok(roadmap.goal);
    assert.ok(roadmap.curriculum);
    assert.ok(roadmap.sourceRevisions);
    assert.ok(Object.isFrozen(roadmap));
  });

  it("should throw for missing studentId", () => {
    assert.throws(() => {
      AcademicRoadmapEngine.buildStudentRoadmap(null);
    }, /studentId is required/);
  });

  it("should compute correct progress with 3/7 milestones satisfied (GPA + TOEIC + Tuition)", () => {
    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap(
      "24110001", makeProfile(), null, makeEligibility(), [], [], fixedClock
    );

    // Credits: IN_PROGRESS, GPA: COMPLETED, TOEIC: COMPLETED, Tuition: COMPLETED
    // Thesis: BLOCKED, Grad App: BLOCKED, Graduation: BLOCKED
    assert.strictEqual(roadmap.progress.total, 7);
    assert.strictEqual(roadmap.progress.completed, 3);
    assert.strictEqual(roadmap.progress.percentage, 43);
  });

  it("should correctly identify current stage as SPECIALIZATION for 115 credits", () => {
    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap(
      "24110001", makeProfile(), null, makeEligibility(), [], [], fixedClock
    );
    assert.strictEqual(roadmap.currentStage, JOURNEY_STAGES.SPECIALIZATION);
  });

  it("should set goal confidence as ESTIMATED for incomplete graduation", () => {
    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap(
      "24110001", makeProfile(), null, makeEligibility(), [], [], fixedClock
    );
    assert.strictEqual(roadmap.goal.confidence, GOAL_CONFIDENCE.ESTIMATED);
    assert.strictEqual(roadmap.goal.isEstimated, true);
    assert.strictEqual(roadmap.goal.targetYear, 2028);
  });
});

describe("Roadmap Blockers", () => {
  it("should identify blockers for incomplete milestones", () => {
    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap(
      "24110001", makeProfile(), null, makeEligibility(), [], [], fixedClock
    );

    // Credits is IN_PROGRESS but not satisfied — should appear as a blocker
    assert.ok(roadmap.blockers.length > 0);
  });
});

describe("Roadmap Goal", () => {
  it("should build goal from curriculum and graduation year", () => {
    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap(
      "24110001", makeProfile(), null, makeEligibility(), [], [], fixedClock
    );

    assert.strictEqual(roadmap.goal.type, "GRADUATION");
    assert.ok(roadmap.goal.targetTerm);
    assert.ok(roadmap.goal.studentFacingLabel.includes("Tốt nghiệp"));
  });
});
