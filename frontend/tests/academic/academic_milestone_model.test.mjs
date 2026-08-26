/**
 * StudentHub AI — Academic Milestone Model Tests
 * Covers: milestone types, states, dependency graph, state derivation, canonical build
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { 
  AcademicMilestoneModel, 
  MILESTONE_TYPES, 
  MILESTONE_STATES 
} from "../../src/lib/intelligence/academic/academicMilestoneModel.js";

describe("AcademicMilestoneModel", () => {
  it("should have all 7 canonical milestone types", () => {
    const expected = [
      "ACADEMIC_PROGRESS", "GPA_STANDING", "LANGUAGE_REQUIREMENT",
      "TUITION_CLEARANCE", "THESIS_ELIGIBILITY", "GRADUATION_APPLICATION",
      "GRADUATION"
    ];
    for (const t of expected) {
      assert.ok(MILESTONE_TYPES[t], `Missing type: ${t}`);
    }
    assert.strictEqual(Object.keys(MILESTONE_TYPES).length, 7);
  });

  it("should have all 8 milestone states", () => {
    const expected = [
      "NOT_STARTED", "IN_PROGRESS", "BLOCKED", "READY",
      "COMPLETED", "WAIVED", "NOT_APPLICABLE", "REVIEW_REQUIRED"
    ];
    for (const s of expected) {
      assert.ok(MILESTONE_STATES[s], `Missing state: ${s}`);
    }
    assert.strictEqual(Object.keys(MILESTONE_STATES).length, 8);
  });

  it("should create a valid immutable milestone entity", () => {
    const ms = AcademicMilestoneModel.createMilestone({
      milestoneId: "MS_TEST",
      type: MILESTONE_TYPES.ACADEMIC_PROGRESS,
      title: "Test Milestone",
      requiredValue: 150,
      currentValue: 115,
      state: MILESTONE_STATES.IN_PROGRESS,
      isSatisfied: false,
      dependsOn: [],
      sourceRevision: 1
    });

    assert.strictEqual(ms.milestoneId, "MS_TEST");
    assert.strictEqual(ms.type, MILESTONE_TYPES.ACADEMIC_PROGRESS);
    assert.strictEqual(ms.requiredValue, 150);
    assert.strictEqual(ms.currentValue, 115);
    assert.strictEqual(ms.state, MILESTONE_STATES.IN_PROGRESS);
    assert.strictEqual(ms.isSatisfied, false);
    assert.ok(Object.isFrozen(ms));
  });

  it("should reject milestone with invalid type", () => {
    assert.throws(() => {
      AcademicMilestoneModel.createMilestone({ type: "INVALID", title: "X" });
    }, /Invalid milestone type/);
  });

  it("should reject milestone without title", () => {
    assert.throws(() => {
      AcademicMilestoneModel.createMilestone({ type: MILESTONE_TYPES.GPA_STANDING, title: "" });
    }, /title is required/);
  });
});

describe("Milestone Dependency Graph", () => {
  it("should return valid dependency graph", () => {
    const graph = AcademicMilestoneModel.getMilestoneDependencyGraph();
    assert.ok(graph);
    assert.deepStrictEqual(graph[MILESTONE_TYPES.ACADEMIC_PROGRESS], []);
    assert.deepStrictEqual(graph[MILESTONE_TYPES.GPA_STANDING], []);
    assert.ok(graph[MILESTONE_TYPES.THESIS_ELIGIBILITY].includes(MILESTONE_TYPES.ACADEMIC_PROGRESS));
    assert.ok(graph[MILESTONE_TYPES.THESIS_ELIGIBILITY].includes(MILESTONE_TYPES.GPA_STANDING));
    assert.ok(graph[MILESTONE_TYPES.GRADUATION].includes(MILESTONE_TYPES.GRADUATION_APPLICATION));
  });

  it("should return canonical topological order", () => {
    const order = AcademicMilestoneModel.getMilestoneOrder();
    assert.strictEqual(order.length, 7);
    assert.strictEqual(order[0], MILESTONE_TYPES.ACADEMIC_PROGRESS);
    assert.strictEqual(order[6], MILESTONE_TYPES.GRADUATION);
  });
});

describe("Milestone State Derivation", () => {
  it("should derive COMPLETED state when evidence is satisfied", () => {
    const state = AcademicMilestoneModel.deriveMilestoneState(
      MILESTONE_TYPES.ACADEMIC_PROGRESS,
      { satisfied: true, actualValue: 150, requiredValue: 150 },
      null,
      {}
    );
    assert.strictEqual(state, MILESTONE_STATES.COMPLETED);
  });

  it("should derive IN_PROGRESS state when evidence has progress but not satisfied", () => {
    const state = AcademicMilestoneModel.deriveMilestoneState(
      MILESTONE_TYPES.ACADEMIC_PROGRESS,
      { satisfied: false, actualValue: 80, requiredValue: 150 },
      null,
      {}
    );
    assert.strictEqual(state, MILESTONE_STATES.IN_PROGRESS);
  });

  it("should derive BLOCKED for thesis when credits are not done", () => {
    const state = AcademicMilestoneModel.deriveMilestoneState(
      MILESTONE_TYPES.THESIS_ELIGIBILITY,
      null,
      {},
      { 
        [MILESTONE_TYPES.ACADEMIC_PROGRESS]: MILESTONE_STATES.IN_PROGRESS,
        [MILESTONE_TYPES.GPA_STANDING]: MILESTONE_STATES.COMPLETED 
      }
    );
    assert.strictEqual(state, MILESTONE_STATES.BLOCKED);
  });

  it("should derive READY for graduation application when all prereqs done", () => {
    const state = AcademicMilestoneModel.deriveMilestoneState(
      MILESTONE_TYPES.GRADUATION_APPLICATION,
      null,
      {},
      {
        [MILESTONE_TYPES.ACADEMIC_PROGRESS]: MILESTONE_STATES.COMPLETED,
        [MILESTONE_TYPES.GPA_STANDING]: MILESTONE_STATES.COMPLETED,
        [MILESTONE_TYPES.LANGUAGE_REQUIREMENT]: MILESTONE_STATES.COMPLETED,
        [MILESTONE_TYPES.TUITION_CLEARANCE]: MILESTONE_STATES.COMPLETED
      }
    );
    assert.strictEqual(state, MILESTONE_STATES.READY);
  });
});

describe("Build Milestones From Canonical State", () => {
  it("should build 7 milestones from valid Profile360 + Eligibility + Twin", () => {
    const profile360 = {
      studentId: "24110001",
      profileRevision: 3,
      identity: { cohort: 2024, programCode: "7480103" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
      graduationRequirements: [
        { requirementId: "REQ_TOTAL_CREDITS", requirementType: "CREDITS_MIN", currentValue: 115, requiredValue: 150 },
        { requirementId: "REQ_MIN_GPA", requirementType: "GPA_MIN", currentValue: 2.85, requiredValue: 2.0 },
        { requirementId: "REQ_ENGLISH_TOEIC", requirementType: "CERTIFICATE_PRESENT", currentValue: 560, requiredValue: 500 },
        { requirementId: "REQ_TUITION_CLEARANCE", requirementType: "TUITION_CLEAR", currentValue: 0, requiredValue: 0 }
      ],
      financialClearance: { isCleared: true, remainingDebt: 0 }
    };
    
    const eligibility = {
      evidence: [
        { type: "CREDITS_MIN", satisfied: false, actualValue: 115, requiredValue: 150 },
        { type: "GPA_MIN", satisfied: true, actualValue: 2.85, requiredValue: 2.0 },
        { type: "CERTIFICATE_PRESENT", satisfied: true, actualValue: 560, requiredValue: 500 },
        { type: "TUITION_CLEAR", satisfied: true, actualValue: 0, requiredValue: 0 }
      ],
      missingRequirements: []
    };
    
    const twin = { studentId: "24110001" };

    const milestones = AcademicMilestoneModel.buildMilestonesFromCanonicalState(profile360, eligibility, twin);
    
    assert.strictEqual(milestones.length, 7);
    assert.ok(Object.isFrozen(milestones));
    
    // Credits: IN_PROGRESS (not yet 150)
    const credits = milestones.find(m => m.type === MILESTONE_TYPES.ACADEMIC_PROGRESS);
    assert.strictEqual(credits.state, MILESTONE_STATES.IN_PROGRESS);
    
    // GPA: COMPLETED
    const gpa = milestones.find(m => m.type === MILESTONE_TYPES.GPA_STANDING);
    assert.strictEqual(gpa.state, MILESTONE_STATES.COMPLETED);
    
    // TOEIC: COMPLETED (560 >= 500 for K2024)
    const lang = milestones.find(m => m.type === MILESTONE_TYPES.LANGUAGE_REQUIREMENT);
    assert.strictEqual(lang.state, MILESTONE_STATES.COMPLETED);
  });

  it("should return empty array for null profile", () => {
    const milestones = AcademicMilestoneModel.buildMilestonesFromCanonicalState(null, null, null);
    assert.strictEqual(milestones.length, 0);
  });
});
