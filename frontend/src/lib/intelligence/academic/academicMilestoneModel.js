/**
 * StudentHub AI — Canonical Academic Milestone Model V1
 * 
 * Defines typed milestone entities representing coarse academic checkpoints
 * in the student's journey toward graduation. Milestones are higher-level
 * groupings of existing requirements from Profile360 and EligibilityEngine.
 * 
 * Milestones are NOT tasks. They reference requirements and may link to tasks,
 * but they do not duplicate the workflow execution graph.
 */

import { getCurriculumForStudent } from "./versionedCurricula.js";

// ─── Milestone Types ───
export const MILESTONE_TYPES = Object.freeze({
  ACADEMIC_PROGRESS: "ACADEMIC_PROGRESS",
  GPA_STANDING: "GPA_STANDING",
  LANGUAGE_REQUIREMENT: "LANGUAGE_REQUIREMENT",
  TUITION_CLEARANCE: "TUITION_CLEARANCE",
  THESIS_ELIGIBILITY: "THESIS_ELIGIBILITY",
  GRADUATION_APPLICATION: "GRADUATION_APPLICATION",
  GRADUATION: "GRADUATION"
});

// ─── Milestone States ───
export const MILESTONE_STATES = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  READY: "READY",
  COMPLETED: "COMPLETED",
  WAIVED: "WAIVED",
  NOT_APPLICABLE: "NOT_APPLICABLE",
  REVIEW_REQUIRED: "REVIEW_REQUIRED"
});

// ─── Milestone Dependency Graph (static, deterministic) ───
const MILESTONE_DEPENDENCY_GRAPH = Object.freeze({
  [MILESTONE_TYPES.ACADEMIC_PROGRESS]: [],
  [MILESTONE_TYPES.GPA_STANDING]: [],
  [MILESTONE_TYPES.LANGUAGE_REQUIREMENT]: [],
  [MILESTONE_TYPES.TUITION_CLEARANCE]: [],
  [MILESTONE_TYPES.THESIS_ELIGIBILITY]: [
    MILESTONE_TYPES.ACADEMIC_PROGRESS,
    MILESTONE_TYPES.GPA_STANDING
  ],
  [MILESTONE_TYPES.GRADUATION_APPLICATION]: [
    MILESTONE_TYPES.ACADEMIC_PROGRESS,
    MILESTONE_TYPES.GPA_STANDING,
    MILESTONE_TYPES.LANGUAGE_REQUIREMENT,
    MILESTONE_TYPES.TUITION_CLEARANCE
  ],
  [MILESTONE_TYPES.GRADUATION]: [
    MILESTONE_TYPES.GRADUATION_APPLICATION
  ]
});

// ─── Topological ordering for display and resolution ───
const MILESTONE_ORDER = Object.freeze([
  MILESTONE_TYPES.ACADEMIC_PROGRESS,
  MILESTONE_TYPES.GPA_STANDING,
  MILESTONE_TYPES.LANGUAGE_REQUIREMENT,
  MILESTONE_TYPES.TUITION_CLEARANCE,
  MILESTONE_TYPES.THESIS_ELIGIBILITY,
  MILESTONE_TYPES.GRADUATION_APPLICATION,
  MILESTONE_TYPES.GRADUATION
]);

export class AcademicMilestoneModel {
  /**
   * Creates an immutable milestone entity
   * @param {object} params
   * @returns {object} Frozen Milestone
   */
  static createMilestone({
    milestoneId,
    type,
    title,
    description = "",
    requirementId = null,
    requiredValue = null,
    currentValue = null,
    state = MILESTONE_STATES.NOT_STARTED,
    isSatisfied = false,
    blockerReason = null,
    dependsOn = [],
    linkedTaskId = null,
    linkedWorkflowAction = null,
    sourceRevision = null,
    studentFacingExplanation = ""
  }) {
    if (!type || !MILESTONE_TYPES[type]) {
      throw new Error(`[MILESTONE_ERROR] Invalid milestone type: ${type}`);
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new Error("[MILESTONE_ERROR] Milestone title is required");
    }

    return Object.freeze({
      milestoneId: milestoneId || `MS_${type}_${Date.now()}`,
      type,
      title: title.trim(),
      description: (description || "").trim(),
      requirementId,
      requiredValue,
      currentValue,
      state,
      isSatisfied,
      blockerReason,
      dependsOn: Object.freeze([...(Array.isArray(dependsOn) ? dependsOn : [])]),
      linkedTaskId,
      linkedWorkflowAction,
      sourceRevision,
      studentFacingExplanation: (studentFacingExplanation || "").trim()
    });
  }

  /**
   * Derives milestone state from canonical eligibility evidence and twin state
   * Pure function — no side effects.
   * @param {string} milestoneType 
   * @param {object} evidenceItem - from EligibilityEngine evidence array
   * @param {object} twinState - Digital Twin snapshot
   * @param {object} [allMilestoneStates] - map of type -> state for dependency checks
   * @returns {string} MILESTONE_STATES
   */
  static deriveMilestoneState(milestoneType, evidenceItem, twinState, allMilestoneStates = {}) {
    // For milestone types with direct evidence mapping
    if (evidenceItem) {
      if (evidenceItem.satisfied) {
        return MILESTONE_STATES.COMPLETED;
      }

      // Check if blocked by unmet dependencies
      const deps = MILESTONE_DEPENDENCY_GRAPH[milestoneType] || [];
      const hasUnmetDeps = deps.some(dep => {
        const depState = allMilestoneStates[dep];
        return depState && depState !== MILESTONE_STATES.COMPLETED && depState !== MILESTONE_STATES.WAIVED;
      });

      if (hasUnmetDeps) {
        return MILESTONE_STATES.BLOCKED;
      }

      // Has progress but not yet satisfied
      if (evidenceItem.actualValue !== undefined && evidenceItem.actualValue !== null && evidenceItem.actualValue > 0) {
        return MILESTONE_STATES.IN_PROGRESS;
      }

      return MILESTONE_STATES.NOT_STARTED;
    }

    // For derived milestones (THESIS_ELIGIBILITY, GRADUATION_APPLICATION, GRADUATION)
    switch (milestoneType) {
      case MILESTONE_TYPES.THESIS_ELIGIBILITY: {
        if (twinState && twinState.isThesisEligible) {
          return MILESTONE_STATES.COMPLETED;
        }
        const creditsDone = allMilestoneStates[MILESTONE_TYPES.ACADEMIC_PROGRESS] === MILESTONE_STATES.COMPLETED;
        const gpaDone = allMilestoneStates[MILESTONE_TYPES.GPA_STANDING] === MILESTONE_STATES.COMPLETED;
        if (!creditsDone || !gpaDone) {
          return MILESTONE_STATES.BLOCKED;
        }
        return MILESTONE_STATES.IN_PROGRESS;
      }

      case MILESTONE_TYPES.GRADUATION_APPLICATION: {
        const allPrereqsDone = [
          MILESTONE_TYPES.ACADEMIC_PROGRESS,
          MILESTONE_TYPES.GPA_STANDING,
          MILESTONE_TYPES.LANGUAGE_REQUIREMENT,
          MILESTONE_TYPES.TUITION_CLEARANCE
        ].every(dep => allMilestoneStates[dep] === MILESTONE_STATES.COMPLETED || allMilestoneStates[dep] === MILESTONE_STATES.WAIVED);

        if (allPrereqsDone) {
          return MILESTONE_STATES.READY;
        }
        return MILESTONE_STATES.BLOCKED;
      }

      case MILESTONE_TYPES.GRADUATION: {
        const appDone = allMilestoneStates[MILESTONE_TYPES.GRADUATION_APPLICATION] === MILESTONE_STATES.COMPLETED;
        if (twinState && twinState.isGraduationReady && appDone) {
          return MILESTONE_STATES.COMPLETED;
        }
        if (allMilestoneStates[MILESTONE_TYPES.GRADUATION_APPLICATION] === MILESTONE_STATES.READY ||
            allMilestoneStates[MILESTONE_TYPES.GRADUATION_APPLICATION] === MILESTONE_STATES.COMPLETED) {
          return MILESTONE_STATES.IN_PROGRESS;
        }
        return MILESTONE_STATES.BLOCKED;
      }

      default:
        return MILESTONE_STATES.NOT_STARTED;
    }
  }

  /**
   * Returns the static milestone dependency graph
   * @returns {object}
   */
  static getMilestoneDependencyGraph() {
    return MILESTONE_DEPENDENCY_GRAPH;
  }

  /**
   * Returns the canonical topological order of milestones
   * @returns {string[]}
   */
  static getMilestoneOrder() {
    return [...MILESTONE_ORDER];
  }

  /**
   * Builds the full set of milestones for a student from canonical Profile360 + Eligibility + Twin
   * @param {object} profile360 
   * @param {object} eligibilityResult 
   * @param {object} digitalTwin 
   * @returns {object[]} Array of frozen Milestone entities
   */
  static buildMilestonesFromCanonicalState(profile360, eligibilityResult, digitalTwin) {
    if (!profile360 || !profile360.studentId) {
      return [];
    }

    const cohort = profile360.identity?.cohort || 2024;
    const programCode = profile360.identity?.programCode || "7480103";
    const curriculum = getCurriculumForStudent(programCode, cohort);
    const gradConditions = curriculum?.version?.graduationConditions || { minCredits: 150, minGpa: 2.0 };

    // Parse TOEIC requirement from curriculum
    const englishLevel = gradConditions.englishLevel || "TOEIC 500";
    const toeicMatch = englishLevel.match(/TOEIC\s+(\d+)/i);
    const requiredToeic = toeicMatch ? parseInt(toeicMatch[1], 10) : 500;

    // Build evidence map from eligibility result
    const evidenceMap = {};
    if (eligibilityResult && Array.isArray(eligibilityResult.evidence)) {
      for (const ev of eligibilityResult.evidence) {
        evidenceMap[ev.type] = ev;
      }
    }

    // Extract current values from profile360
    const summary = profile360.academicSummary || {};
    const gradReqs = profile360.graduationRequirements || [];
    const toeicReq = gradReqs.find(r => r.requirementType === "CERTIFICATE_PRESENT");
    const toeicScore = toeicReq ? toeicReq.currentValue : 0;
    const finClearance = profile360.financialClearance || {};

    // Phase 1: Derive states for base milestones
    const milestoneStates = {};

    // Credits
    const earnedCreds = summary.earnedCredits ?? digitalTwin?.earnedCredits ?? 0;
    const creditsEvidence = { 
      type: "CREDITS_MIN",
      satisfied: earnedCreds >= gradConditions.minCredits, 
      actualValue: earnedCreds, 
      requiredValue: gradConditions.minCredits 
    };
    milestoneStates[MILESTONE_TYPES.ACADEMIC_PROGRESS] = this.deriveMilestoneState(
      MILESTONE_TYPES.ACADEMIC_PROGRESS, creditsEvidence, digitalTwin, milestoneStates
    );

    // GPA
    const actualCgpa = summary.cgpa ?? digitalTwin?.cgpa ?? 0;
    const gpaEvidence = { 
      type: "GPA_MIN",
      satisfied: actualCgpa >= gradConditions.minGpa, 
      actualValue: actualCgpa, 
      requiredValue: gradConditions.minGpa 
    };
    milestoneStates[MILESTONE_TYPES.GPA_STANDING] = this.deriveMilestoneState(
      MILESTONE_TYPES.GPA_STANDING, gpaEvidence, digitalTwin, milestoneStates
    );

    // Language
    const actualToeic = toeicScore;
    const langEvidence = { 
      type: "CERTIFICATE_PRESENT",
      satisfied: actualToeic >= requiredToeic, 
      actualValue: actualToeic, 
      requiredValue: requiredToeic 
    };
    milestoneStates[MILESTONE_TYPES.LANGUAGE_REQUIREMENT] = this.deriveMilestoneState(
      MILESTONE_TYPES.LANGUAGE_REQUIREMENT, langEvidence, digitalTwin, milestoneStates
    );

    // Tuition
    const tuitionSatisfied = (finClearance.isCleared === true) || (digitalTwin?.tuitionPaid === true && (digitalTwin?.debtAmount || 0) === 0);
    const tuitionEvidence = { 
      type: "TUITION_CLEAR",
      satisfied: tuitionSatisfied, 
      actualValue: finClearance.remainingDebt || digitalTwin?.debtAmount || 0, 
      requiredValue: 0 
    };
    milestoneStates[MILESTONE_TYPES.TUITION_CLEARANCE] = this.deriveMilestoneState(
      MILESTONE_TYPES.TUITION_CLEARANCE, tuitionEvidence, digitalTwin, milestoneStates
    );

    // Phase 2: Derive states for dependent milestones
    milestoneStates[MILESTONE_TYPES.THESIS_ELIGIBILITY] = this.deriveMilestoneState(
      MILESTONE_TYPES.THESIS_ELIGIBILITY, null, digitalTwin, milestoneStates
    );
    milestoneStates[MILESTONE_TYPES.GRADUATION_APPLICATION] = this.deriveMilestoneState(
      MILESTONE_TYPES.GRADUATION_APPLICATION, null, digitalTwin, milestoneStates
    );
    milestoneStates[MILESTONE_TYPES.GRADUATION] = this.deriveMilestoneState(
      MILESTONE_TYPES.GRADUATION, null, digitalTwin, milestoneStates
    );

    // Phase 3: Construct milestone entities
    const milestones = [
      this.createMilestone({
        milestoneId: "MS_ACADEMIC_PROGRESS",
        type: MILESTONE_TYPES.ACADEMIC_PROGRESS,
        title: `Tích lũy tối thiểu ${gradConditions.minCredits} tín chỉ CTĐT`,
        requirementId: "REQ_TOTAL_CREDITS",
        requiredValue: gradConditions.minCredits,
        currentValue: summary.earnedCredits || 0,
        state: milestoneStates[MILESTONE_TYPES.ACADEMIC_PROGRESS],
        isSatisfied: creditsEvidence.satisfied,
        dependsOn: MILESTONE_DEPENDENCY_GRAPH[MILESTONE_TYPES.ACADEMIC_PROGRESS],
        sourceRevision: profile360.profileRevision,
        studentFacingExplanation: `Đã tích lũy ${summary.earnedCredits || 0}/${gradConditions.minCredits} tín chỉ.`
      }),
      this.createMilestone({
        milestoneId: "MS_GPA_STANDING",
        type: MILESTONE_TYPES.GPA_STANDING,
        title: `Điểm trung bình tích lũy CGPA >= ${gradConditions.minGpa.toFixed(2)}`,
        requirementId: "REQ_MIN_GPA",
        requiredValue: gradConditions.minGpa,
        currentValue: summary.cgpa,
        state: milestoneStates[MILESTONE_TYPES.GPA_STANDING],
        isSatisfied: gpaEvidence.satisfied,
        dependsOn: MILESTONE_DEPENDENCY_GRAPH[MILESTONE_TYPES.GPA_STANDING],
        sourceRevision: profile360.profileRevision,
        studentFacingExplanation: `CGPA hiện tại: ${summary.cgpa !== null && summary.cgpa !== undefined ? summary.cgpa : "Chưa có"}/4.00.`
      }),
      this.createMilestone({
        milestoneId: "MS_LANGUAGE_REQUIREMENT",
        type: MILESTONE_TYPES.LANGUAGE_REQUIREMENT,
        title: `Chuẩn đầu ra ngoại ngữ TOEIC >= ${requiredToeic}`,
        requirementId: "REQ_ENGLISH_TOEIC",
        requiredValue: requiredToeic,
        currentValue: toeicScore,
        state: milestoneStates[MILESTONE_TYPES.LANGUAGE_REQUIREMENT],
        isSatisfied: langEvidence.satisfied,
        blockerReason: !langEvidence.satisfied ? `Điểm TOEIC hiện tại: ${toeicScore}/${requiredToeic}` : null,
        dependsOn: MILESTONE_DEPENDENCY_GRAPH[MILESTONE_TYPES.LANGUAGE_REQUIREMENT],
        sourceRevision: profile360.profileRevision,
        studentFacingExplanation: toeicScore > 0 
          ? `Điểm TOEIC xác minh: ${toeicScore}/${requiredToeic}.`
          : "Chưa nộp hoặc chưa có chứng chỉ TOEIC được xác minh."
      }),
      this.createMilestone({
        milestoneId: "MS_TUITION_CLEARANCE",
        type: MILESTONE_TYPES.TUITION_CLEARANCE,
        title: "Hoàn tất nghĩa vụ học phí và công nợ sinh viên",
        requirementId: "REQ_TUITION_CLEARANCE",
        requiredValue: 0,
        currentValue: finClearance.remainingDebt || 0,
        state: milestoneStates[MILESTONE_TYPES.TUITION_CLEARANCE],
        isSatisfied: tuitionEvidence.satisfied,
        dependsOn: MILESTONE_DEPENDENCY_GRAPH[MILESTONE_TYPES.TUITION_CLEARANCE],
        sourceRevision: profile360.profileRevision,
        studentFacingExplanation: tuitionEvidence.satisfied 
          ? "Đã hoàn tất nghĩa vụ tài chính."
          : `Còn nợ: ${(finClearance.remainingDebt || 0).toLocaleString("vi-VN")} đ.`
      }),
      this.createMilestone({
        milestoneId: "MS_THESIS_ELIGIBILITY",
        type: MILESTONE_TYPES.THESIS_ELIGIBILITY,
        title: "Đủ điều kiện đăng ký Khóa luận Tốt nghiệp",
        requiredValue: null,
        currentValue: null,
        state: milestoneStates[MILESTONE_TYPES.THESIS_ELIGIBILITY],
        isSatisfied: digitalTwin?.isThesisEligible === true,
        dependsOn: MILESTONE_DEPENDENCY_GRAPH[MILESTONE_TYPES.THESIS_ELIGIBILITY],
        sourceRevision: profile360.profileRevision,
        studentFacingExplanation: digitalTwin?.isThesisEligible 
          ? "Đã đủ điều kiện đăng ký khóa luận."
          : "Cần hoàn tất đủ tín chỉ và GPA yêu cầu."
      }),
      this.createMilestone({
        milestoneId: "MS_GRADUATION_APPLICATION",
        type: MILESTONE_TYPES.GRADUATION_APPLICATION,
        title: "Nộp hồ sơ xét tốt nghiệp",
        state: milestoneStates[MILESTONE_TYPES.GRADUATION_APPLICATION],
        isSatisfied: false,
        dependsOn: MILESTONE_DEPENDENCY_GRAPH[MILESTONE_TYPES.GRADUATION_APPLICATION],
        sourceRevision: profile360.profileRevision,
        studentFacingExplanation: milestoneStates[MILESTONE_TYPES.GRADUATION_APPLICATION] === MILESTONE_STATES.READY
          ? "Đã đủ điều kiện nộp hồ sơ xét tốt nghiệp."
          : "Cần hoàn tất tất cả yêu cầu trước khi nộp hồ sơ."
      }),
      this.createMilestone({
        milestoneId: "MS_GRADUATION",
        type: MILESTONE_TYPES.GRADUATION,
        title: "Tốt nghiệp",
        state: milestoneStates[MILESTONE_TYPES.GRADUATION],
        isSatisfied: digitalTwin?.isGraduationReady === true && milestoneStates[MILESTONE_TYPES.GRADUATION_APPLICATION] === MILESTONE_STATES.COMPLETED,
        dependsOn: MILESTONE_DEPENDENCY_GRAPH[MILESTONE_TYPES.GRADUATION],
        sourceRevision: profile360.profileRevision,
        studentFacingExplanation: "Mục tiêu cuối cùng của hành trình học vụ."
      })
    ];

    return Object.freeze(milestones);
  }
}
