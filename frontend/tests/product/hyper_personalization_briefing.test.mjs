/**
 * StudentHub AI — Hyper-Personalization & Academic Briefing Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { UserGoalEngine, GOAL_PRIORITY, GOAL_STATUS } from "../../src/lib/personalization/UserGoalEngine.js";
import { AcademicBriefingEngine } from "../../src/lib/personalization/AcademicBriefingEngine.js";
import { EarlyWarningEngine, WARNING_CATEGORY } from "../../src/lib/intelligence/social/EarlyWarningEngine.js";

describe("Hyper-Personalization & Academic Briefing Engine", () => {
  beforeEach(() => {
    UserGoalEngine.clear();
    EarlyWarningEngine.clear();
  });

  it("should create, track, and update user academic goals", () => {
    const subjectId = "student:24110001";

    const goal = UserGoalEngine.createGoal(subjectId, {
      title: "Đạt điểm A môn Kiến trúc Phần mềm",
      priority: GOAL_PRIORITY.HIGH,
      linkedCourses: ["COURSE:SOEN3305"]
    });

    assert.ok(goal.goalId);
    assert.strictEqual(goal.currentProgress, 0);

    const updated = UserGoalEngine.updateProgress(subjectId, goal.goalId, 100);
    assert.strictEqual(updated.status, GOAL_STATUS.COMPLETED);
    assert.strictEqual(updated.currentProgress, 100);
  });

  it("should compile comprehensive Academic Briefing with grounded recommendations and early warnings", () => {
    const subjectId = "student:24110001";

    // Trigger an early warning signal
    EarlyWarningEngine.recordSignal({
      category: WARNING_CATEGORY.PORTAL_OUTAGE,
      title: "Lỗi kết nối cổng online.hcmute.edu.vn",
      affectedEntity: "SYSTEM:online_portal",
      authorId: "sv_test"
    });

    const briefing = AcademicBriefingEngine.compileBriefing(subjectId);

    assert.ok(briefing.briefingId);
    assert.strictEqual(briefing.subjectId, subjectId);
    assert.ok(briefing.academicSummary.cgpa >= 3.0);
    assert.ok(briefing.importantChanges.length >= 1);
    assert.ok(briefing.upcomingDeadlines.length >= 1);
    assert.ok(briefing.recommendedActions.length >= 1);

    // Verify Explainability
    assert.ok(briefing.recommendedActions[0].whyAmISeeingThis.length > 5);
    assert.ok(briefing.recommendedActions[0].supportingEvidence.length > 5);
  });
});
