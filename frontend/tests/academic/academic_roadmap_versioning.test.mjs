/**
 * StudentHub AI — Academic Roadmap Versioning Tests
 * Covers: Stale source revisions -> stale roadmap, Idempotent rebuild, deterministic output
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicRoadmapEngine, ROADMAP_FRESHNESS } from "../../src/lib/intelligence/academic/academicRoadmapEngine.js";

describe("Academic Roadmap Versioning & Freshness", () => {
  it("should inherit FRESH state when all profile sections are fresh", () => {
    const profile = {
      studentId: "24110001",
      profileRevision: 5,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 120, cgpa: 3.1, expectedGraduationYear: 2028 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: {
        sections: {
          identity: "FRESH",
          transcripts: "FRESH",
          certifications: "FRESH",
          finance: "FRESH"
        }
      }
    };

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profile, null, null, []);
    assert.strictEqual(roadmap.freshness, ROADMAP_FRESHNESS.FRESH);
    assert.strictEqual(roadmap.roadmapId, "ROADMAP_24110001_r5");
    assert.strictEqual(roadmap.sourceRevisions.profileRevision, 5);
  });

  it("should inherit STALE state if any section is stale", () => {
    const profile = {
      studentId: "24110001",
      profileRevision: 2,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 100, cgpa: 2.7, expectedGraduationYear: 2028 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: {
        sections: {
          identity: "FRESH",
          transcripts: "STALE",
          certifications: "FRESH",
          finance: "FRESH"
        }
      }
    };

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profile, null, null, []);
    assert.strictEqual(roadmap.freshness, ROADMAP_FRESHNESS.STALE);
  });

  it("should inherit CONFLICTED state if any section has conflict", () => {
    const profile = {
      studentId: "24110001",
      profileRevision: 3,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 100, cgpa: 2.7, expectedGraduationYear: 2028 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: {
        sections: {
          identity: "FRESH",
          transcripts: "CONFLICTED",
          certifications: "FRESH",
          finance: "FRESH"
        }
      }
    };

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profile, null, null, []);
    assert.strictEqual(roadmap.freshness, ROADMAP_FRESHNESS.CONFLICTED);
  });

  it("should produce deterministic and idempotent output given same inputs", () => {
    const fixedClock = { now: () => 1771984800000, nowIso: () => "2026-08-26T10:00:00.000Z" };
    const profile = {
      studentId: "24110001",
      profileRevision: 4,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: { identity: "FRESH" } }
    };

    const roadmap1 = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profile, null, null, [], [], fixedClock);
    const roadmap2 = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profile, null, null, [], [], fixedClock);

    assert.deepStrictEqual(roadmap1, roadmap2);
  });
});
