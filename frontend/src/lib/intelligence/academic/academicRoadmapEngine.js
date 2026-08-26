/**
 * StudentHub AI — Academic Roadmap Projection Engine V1
 * 
 * Pure projection engine that reads existing canonical state (Profile360, DigitalTwin,
 * Eligibility, Workflow, Deadline) and produces an immutable roadmap snapshot.
 * 
 * The roadmap NEVER mutates upstream state. It is a downstream read model.
 */

import { AcademicMilestoneModel, MILESTONE_TYPES, MILESTONE_STATES } from "./academicMilestoneModel.js";
import { AcademicEligibilityEngine } from "./academicEligibilityEngine.js";
import { AcademicTaskModel } from "./academicTaskModel.js";
import { getCurriculumForStudent } from "./versionedCurricula.js";
import { AcademicClock } from "./academicClock.js";
import { SECTION_FRESHNESS } from "./studentDataProvenanceMatrix.js";

// ─── Roadmap Freshness States ───
export const ROADMAP_FRESHNESS = Object.freeze({
  FRESH: "FRESH",
  STALE: "STALE",
  REBUILDING: "REBUILDING",
  CONFLICTED: "CONFLICTED",
  UNKNOWN: "UNKNOWN"
});

// ─── Goal Confidence Levels ───
export const GOAL_CONFIDENCE = Object.freeze({
  VERIFIED: "VERIFIED",
  DERIVED: "DERIVED",
  ESTIMATED: "ESTIMATED",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  UNKNOWN: "UNKNOWN"
});

// ─── Journey Stages ───
export const JOURNEY_STAGES = Object.freeze({
  FOUNDATION: "FOUNDATION",
  CORE_STUDY: "CORE_STUDY",
  SPECIALIZATION: "SPECIALIZATION",
  LANGUAGE_REQUIREMENT: "LANGUAGE_REQUIREMENT",
  THESIS_PREPARATION: "THESIS_PREPARATION",
  GRADUATION_PREPARATION: "GRADUATION_PREPARATION",
  GRADUATION: "GRADUATION",
  COMPLETED: "COMPLETED",
  UNKNOWN: "UNKNOWN"
});

export class AcademicRoadmapEngine {
  /**
   * Builds a complete, deterministic student roadmap from canonical state.
   * Same source revisions → same roadmap output (idempotent).
   * 
   * @param {string} studentId
   * @param {object} profile360 - from StudentProfile360Model
   * @param {object} digitalTwin - from StudentDigitalTwinModel
   * @param {object} eligibilityResult - from AcademicEligibilityEngine
   * @param {Array} activeTasks - from AcademicTaskStore
   * @param {Array} activeDeadlines - from AcademicDeadlineEngine
   * @param {object} [clock] - injectable clock for deterministic testing
   * @returns {object} Immutable StudentRoadmap aggregate
   */
  static buildStudentRoadmap(
    studentId,
    profile360 = null,
    digitalTwin = null,
    eligibilityResult = null,
    activeTasks = [],
    activeDeadlines = [],
    clock = AcademicClock
  ) {
    if (!studentId) {
      throw new Error("[ROADMAP_ERROR] studentId is required for roadmap generation.");
    }

    const cleanStudentId = String(studentId).trim();
    const nowIso = clock.nowIso ? clock.nowIso() : new Date().toISOString();

    // ─── 1. Resolve curriculum ───
    const cohort = profile360?.identity?.cohort || profile360?.cohort || 2024;
    const programCode = profile360?.identity?.programCode || profile360?.programCode || "7480103";
    const curriculum = getCurriculumForStudent(programCode, cohort);
    const curriculumInfo = curriculum ? {
      programCode: curriculum.programCode,
      programName: curriculum.programName,
      cohort,
      versionId: curriculum.version?.versionId || `HCMUTE_SE_${cohort}`,
      totalCredits: curriculum.totalCredits || 150
    } : {
      programCode, programName: "Kỹ thuật Phần mềm", cohort,
      versionId: `HCMUTE_SE_${cohort}`, totalCredits: 150
    };

    // ─── 2. Build or use eligibility ───
    const effectiveEligibility = eligibilityResult || (digitalTwin 
      ? AcademicEligibilityEngine.evaluateEligibility(digitalTwin)
      : null);

    // ─── 3. Build milestones from canonical state ───
    const milestones = AcademicMilestoneModel.buildMilestonesFromCanonicalState(
      profile360, effectiveEligibility, digitalTwin
    );

    // ─── 4. Categorize milestones ───
    const completedMilestones = [];
    const activeMilestones = [];   // NOW
    const nextMilestones = [];     // NEXT
    const upcomingMilestones = []; // UPCOMING

    for (const ms of milestones) {
      switch (ms.state) {
        case MILESTONE_STATES.COMPLETED:
        case MILESTONE_STATES.WAIVED:
          completedMilestones.push(ms);
          break;
        case MILESTONE_STATES.IN_PROGRESS:
        case MILESTONE_STATES.BLOCKED:
        case MILESTONE_STATES.REVIEW_REQUIRED:
          activeMilestones.push(ms);
          break;
        case MILESTONE_STATES.READY:
          nextMilestones.push(ms);
          break;
        case MILESTONE_STATES.NOT_STARTED:
        case MILESTONE_STATES.NOT_APPLICABLE:
        default:
          upcomingMilestones.push(ms);
          break;
      }
    }

    // ─── 5. Resolve current stage ───
    const currentStage = this.#resolveCurrentStage(milestones);

    // ─── 6. Extract blockers ───
    const blockers = this.#extractBlockers(milestones, effectiveEligibility);

    // ─── 7. Resolve next action from canonical workflow ───
    const nextAction = this.#resolveNextAction(activeTasks, activeMilestones, nextMilestones);

    // ─── 8. Compute progress ───
    const progress = this.#computeProgress(milestones);

    // ─── 9. Build goal ───
    const expectedGraduationYear = profile360?.academicSummary?.expectedGraduationYear || (cohort + 4);
    const goal = this.#buildGoal(milestones, expectedGraduationYear, blockers, curriculum);

    // ─── 10. Determine freshness ───
    const freshness = this.#determineFreshness(profile360);

    // ─── 11. Source revision chain ───
    const sourceRevisions = Object.freeze({
      profileRevision: profile360?.profileRevision || null,
      twinRevision: digitalTwin?.revision || null,
      eligibilityTwinRevision: effectiveEligibility?.twinRevision || null,
      asOf: nowIso
    });

    // ─── 12. Assemble roadmap ───
    const profileRev = profile360?.profileRevision || 0;
    const roadmapId = `ROADMAP_${cleanStudentId}_r${profileRev}`;

    return Object.freeze({
      roadmapId,
      studentId: cleanStudentId,
      asOf: nowIso,
      progress: Object.freeze(progress),
      currentStage,
      completedMilestones: Object.freeze(completedMilestones),
      activeMilestones: Object.freeze(activeMilestones),
      nextMilestones: Object.freeze(nextMilestones),
      upcomingMilestones: Object.freeze(upcomingMilestones),
      allMilestones: Object.freeze([...milestones]),
      goal: Object.freeze(goal),
      blockers: Object.freeze(blockers),
      nextAction: nextAction ? Object.freeze(nextAction) : null,
      curriculum: Object.freeze(curriculumInfo),
      freshness,
      sourceRevisions
    });
  }

  // ─── Private Helpers ───

  /**
   * Resolves the current journey stage from milestone states
   */
  static #resolveCurrentStage(milestones) {
    const stateMap = {};
    for (const ms of milestones) {
      stateMap[ms.type] = ms.state;
    }

    // Check from the end — find the first non-completed milestone
    if (stateMap[MILESTONE_TYPES.GRADUATION] === MILESTONE_STATES.COMPLETED) {
      return JOURNEY_STAGES.COMPLETED;
    }
    if (stateMap[MILESTONE_TYPES.GRADUATION_APPLICATION] === MILESTONE_STATES.READY ||
        stateMap[MILESTONE_TYPES.GRADUATION_APPLICATION] === MILESTONE_STATES.IN_PROGRESS) {
      return JOURNEY_STAGES.GRADUATION_PREPARATION;
    }
    if (stateMap[MILESTONE_TYPES.THESIS_ELIGIBILITY] === MILESTONE_STATES.IN_PROGRESS ||
        stateMap[MILESTONE_TYPES.THESIS_ELIGIBILITY] === MILESTONE_STATES.READY) {
      return JOURNEY_STAGES.THESIS_PREPARATION;
    }

    // Check if language requirement is the blocker
    if (stateMap[MILESTONE_TYPES.LANGUAGE_REQUIREMENT] === MILESTONE_STATES.IN_PROGRESS ||
        stateMap[MILESTONE_TYPES.LANGUAGE_REQUIREMENT] === MILESTONE_STATES.BLOCKED ||
        stateMap[MILESTONE_TYPES.LANGUAGE_REQUIREMENT] === MILESTONE_STATES.NOT_STARTED) {
      // But only if credits are reasonably advanced
      const creditsMs = milestones.find(m => m.type === MILESTONE_TYPES.ACADEMIC_PROGRESS);
      if (creditsMs && creditsMs.currentValue >= 80) {
        return JOURNEY_STAGES.LANGUAGE_REQUIREMENT;
      }
    }

    // Determine based on credit progress
    const creditsMs = milestones.find(m => m.type === MILESTONE_TYPES.ACADEMIC_PROGRESS);
    if (creditsMs) {
      const pct = (creditsMs.currentValue || 0) / (creditsMs.requiredValue || 150);
      if (pct >= 0.7) return JOURNEY_STAGES.SPECIALIZATION;
      if (pct >= 0.3) return JOURNEY_STAGES.CORE_STUDY;
    }

    return JOURNEY_STAGES.FOUNDATION;
  }

  /**
   * Extracts blockers from milestones and eligibility
   */
  static #extractBlockers(milestones, eligibility) {
    const blockers = [];

    // From blocked/in-progress milestones with unsatisfied requirements
    for (const ms of milestones) {
      if (ms.state === MILESTONE_STATES.BLOCKED || 
          (ms.state === MILESTONE_STATES.IN_PROGRESS && !ms.isSatisfied)) {
        if (ms.blockerReason) {
          blockers.push({
            blockerId: `BLK_${ms.type}`,
            type: ms.type,
            title: ms.title,
            reason: ms.blockerReason,
            severity: ms.state === MILESTONE_STATES.BLOCKED ? "HIGH" : "MEDIUM",
            milestoneId: ms.milestoneId,
            requirementId: ms.requirementId
          });
        } else if (!ms.isSatisfied && ms.requiredValue !== null) {
          blockers.push({
            blockerId: `BLK_${ms.type}`,
            type: ms.type,
            title: ms.title,
            reason: ms.studentFacingExplanation || `Chưa đạt yêu cầu: ${ms.title}`,
            severity: ms.state === MILESTONE_STATES.BLOCKED ? "HIGH" : "MEDIUM",
            milestoneId: ms.milestoneId,
            requirementId: ms.requirementId
          });
        }
      }
    }

    // From eligibility missing requirements
    if (eligibility && Array.isArray(eligibility.missingRequirements)) {
      for (const missing of eligibility.missingRequirements) {
        // Avoid duplicates — check if already covered by milestone blocker
        const alreadyCovered = blockers.some(b => 
          missing.includes(b.title) || b.reason.includes(missing.substring(0, 20))
        );
        if (!alreadyCovered && missing) {
          blockers.push({
            blockerId: `BLK_ELIG_${blockers.length}`,
            type: "ELIGIBILITY",
            title: "Yêu cầu xét tốt nghiệp",
            reason: missing,
            severity: "HIGH",
            milestoneId: null,
            requirementId: null
          });
        }
      }
    }

    return blockers;
  }

  /**
   * Resolves the next actionable step from canonical workflow
   */
  static #resolveNextAction(activeTasks, activeMilestones, nextMilestones) {
    // First, try to find next action from existing active tasks
    if (Array.isArray(activeTasks) && activeTasks.length > 0) {
      for (const task of activeTasks) {
        if (task.steps && Array.isArray(task.steps)) {
          const next = AcademicTaskModel.resolveNextAction(task.steps);
          if (next) {
            return {
              taskId: task.taskId,
              stepId: next.stepId,
              label: next.title || next.label || task.title || "Tiếp tục quy trình",
              description: next.description || "",
              source: "WORKFLOW"
            };
          }
        }
      }
    }

    // Fallback: derive from active milestones
    if (activeMilestones.length > 0) {
      const firstActive = activeMilestones[0];
      return {
        taskId: firstActive.linkedTaskId,
        stepId: null,
        label: `Giải quyết: ${firstActive.title}`,
        description: firstActive.studentFacingExplanation,
        source: "MILESTONE"
      };
    }

    // Fallback: derive from next milestones
    if (nextMilestones.length > 0) {
      const firstNext = nextMilestones[0];
      return {
        taskId: firstNext.linkedTaskId,
        stepId: null,
        label: firstNext.title,
        description: firstNext.studentFacingExplanation,
        source: "MILESTONE"
      };
    }

    return null;
  }

  /**
   * Computes progress from milestone satisfaction
   */
  static #computeProgress(milestones) {
    if (!milestones || milestones.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    // Only count applicable milestones (exclude NOT_APPLICABLE, WAIVED counts as completed)
    const applicable = milestones.filter(m => 
      m.state !== MILESTONE_STATES.NOT_APPLICABLE
    );
    const completed = applicable.filter(m => 
      m.state === MILESTONE_STATES.COMPLETED || m.state === MILESTONE_STATES.WAIVED
    );

    const total = applicable.length;
    const completedCount = completed.length;
    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return { completed: completedCount, total, percentage };
  }

  /**
   * Builds the graduation goal entity
   */
  static #buildGoal(milestones, expectedGraduationYear, blockers, curriculum) {
    const gradMs = milestones.find(m => m.type === MILESTONE_TYPES.GRADUATION);
    const isCompleted = gradMs && gradMs.state === MILESTONE_STATES.COMPLETED;

    // Determine target term (estimated)
    const targetTerm = `HK2_${expectedGraduationYear - 1}_${expectedGraduationYear}`;

    // Determine confidence
    let confidence = GOAL_CONFIDENCE.ESTIMATED;
    if (isCompleted) {
      confidence = GOAL_CONFIDENCE.VERIFIED;
    } else if (blockers.length > 0) {
      confidence = GOAL_CONFIDENCE.ESTIMATED;
    }

    // Determine status
    let status = "PENDING";
    if (isCompleted) {
      status = "ACHIEVED";
    } else if (blockers.length === 0) {
      status = "ON_TRACK";
    }

    return {
      type: "GRADUATION",
      targetTerm,
      targetYear: expectedGraduationYear,
      status,
      confidence,
      blockerCount: blockers.length,
      curriculumVersion: curriculum?.version?.versionId || null,
      studentFacingLabel: isCompleted 
        ? "Đã tốt nghiệp" 
        : `Tốt nghiệp dự kiến: ${targetTerm.replace(/_/g, " ")}`,
      isEstimated: !isCompleted
    };
  }

  /**
   * Determines roadmap freshness from profile360 freshness
   */
  static #determineFreshness(profile360) {
    if (!profile360 || !profile360.freshness) {
      return ROADMAP_FRESHNESS.UNKNOWN;
    }

    const sections = profile360.freshness.sections || {};
    const values = Object.values(sections);

    if (values.some(v => v === SECTION_FRESHNESS.CONFLICTED)) {
      return ROADMAP_FRESHNESS.CONFLICTED;
    }
    if (values.some(v => v === SECTION_FRESHNESS.STALE)) {
      return ROADMAP_FRESHNESS.STALE;
    }
    if (values.every(v => v === SECTION_FRESHNESS.FRESH)) {
      return ROADMAP_FRESHNESS.FRESH;
    }

    return ROADMAP_FRESHNESS.UNKNOWN;
  }
}
