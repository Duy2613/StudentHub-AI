/**
 * StudentHub AI — Academic Roadmap Workflow Link Tests
 * Covers: nextAction resolves correctly from canonical workflow tasks, no duplicate tasks created
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AcademicRoadmapEngine } from "../../src/lib/intelligence/academic/academicRoadmapEngine.js";
import { WORKFLOW_STATES } from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";

describe("Academic Roadmap Workflow Linkage", () => {
  it("should extract nextAction from active multi-step workflow task", () => {
    const profile = {
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
      graduationRequirements: [],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const activeTasks = [
      {
        taskId: "TASK_TOEIC_REGISTRATION",
        title: "Đăng ký nộp chứng chỉ TOEIC",
        steps: [
          { stepId: "STEP_01", title: "Chuẩn bị bản scan chứng chỉ", label: "Chuẩn bị bản scan chứng chỉ", status: WORKFLOW_STATES.COMPLETED },
          { stepId: "STEP_02", title: "Nộp hồ sơ trên cổng học vụ", label: "Nộp hồ sơ trên cổng học vụ", status: WORKFLOW_STATES.NOT_STARTED }
        ]
      }
    ];

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profile, null, null, activeTasks);
    
    assert.ok(roadmap.nextAction);
    assert.strictEqual(roadmap.nextAction.taskId, "TASK_TOEIC_REGISTRATION");
    assert.strictEqual(roadmap.nextAction.stepId, "STEP_02");
    assert.strictEqual(roadmap.nextAction.label, "Nộp hồ sơ trên cổng học vụ");
    assert.strictEqual(roadmap.nextAction.source, "WORKFLOW");
  });

  it("should fallback to milestone-derived nextAction when no active tasks exist", () => {
    const profile = {
      studentId: "24110001",
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
      graduationRequirements: [
        { requirementType: "CREDITS_MIN", currentValue: 115, requiredValue: 150 }
      ],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: {} }
    };

    const roadmap = AcademicRoadmapEngine.buildStudentRoadmap("24110001", profile, null, null, []);
    
    assert.ok(roadmap.nextAction);
    assert.strictEqual(roadmap.nextAction.source, "MILESTONE");
    assert.ok(roadmap.nextAction.label.length > 0);
  });
});
