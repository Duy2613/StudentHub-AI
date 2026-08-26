/**
 * StudentHub AI — Academic Roadmap End-to-End Tests
 * Covers: Full integration from DataLoader -> Profile360 -> Digital Twin -> Eligibility -> Roadmap projection
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getAuthoritativeCommandCenterData } from "../../src/lib/intelligence/academic/academicCommandCenterDataLoader.js";
import { ROADMAP_FRESHNESS } from "../../src/lib/intelligence/academic/academicRoadmapEngine.js";

describe("Academic Roadmap E2E Pipeline", () => {
  it("should generate a complete, valid roadmap via getAuthoritativeCommandCenterData()", () => {
    const data = getAuthoritativeCommandCenterData({ studentId: "24110001" });

    assert.ok(data.success);
    assert.ok(data.roadmap);
    
    const { roadmap } = data;
    assert.strictEqual(roadmap.studentId, "24110001");
    assert.ok(roadmap.roadmapId.startsWith("ROADMAP_24110001"));
    assert.ok(roadmap.progress.total >= 7);
    assert.ok(roadmap.progress.percentage >= 0 && roadmap.progress.percentage <= 100);
    assert.ok(roadmap.curriculum);
    assert.strictEqual(roadmap.curriculum.cohort, 2024);
    assert.strictEqual(roadmap.curriculum.programCode, "7480103");
    
    // Milestones partition correctly
    const totalPartitioned = roadmap.completedMilestones.length +
                             roadmap.activeMilestones.length +
                             roadmap.nextMilestones.length +
                             roadmap.upcomingMilestones.length;
    assert.strictEqual(totalPartitioned, roadmap.allMilestones.length);

    // Goal projection present
    assert.ok(roadmap.goal);
    assert.strictEqual(roadmap.goal.type, "GRADUATION");
    assert.strictEqual(roadmap.goal.targetYear, 2028);

    // Freshness is computed
    assert.ok(Object.values(ROADMAP_FRESHNESS).includes(roadmap.freshness));
  });
});
