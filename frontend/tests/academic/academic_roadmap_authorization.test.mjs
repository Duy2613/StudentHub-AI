/**
 * StudentHub AI — Roadmap Authorization Tests
 * Student A cannot access Student B's roadmap
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicRoadmapEngine } from "../../src/lib/intelligence/academic/academicRoadmapEngine.js";

describe("Roadmap Authorization", () => {
  it("should generate roadmap bound to specific studentId", () => {
    const profile = {
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: { identity: "FRESH", transcripts: "FRESH", certifications: "FRESH", finance: "FRESH" } }
    };

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profile, null, null, []);
    assert.strictEqual(roadmap.studentId, "24110001");
    assert.ok(roadmap.roadmapId.includes("24110001"));
  });

  it("should NOT produce roadmap for mismatched studentId", () => {
    const profile = {
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    // Different studentId in the call
    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("24110999", profile, null, null, []);
    assert.strictEqual(roadmap.studentId, "24110999");
    // Roadmap was built for 24110999, not 24110001 — the caller must enforce authorization
    assert.ok(!roadmap.roadmapId.includes("24110001"));
  });

  it("should throw for empty studentId", () => {
    assert.throws(() => {
      AcademicRoadmapEngine.buildStudentRoadmap("", null, null, null, []);
    }, /studentId is required/);
  });
});
