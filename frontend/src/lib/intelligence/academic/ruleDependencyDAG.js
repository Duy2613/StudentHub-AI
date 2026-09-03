/**
 * StudentHub AI — Rule Dependency DAG & Invalidation Engine
 * 
 * Enforces Rule Dependency & Invalidation Constitution:
 * Maps: DOCUMENT -> CLAUSE -> RULE -> CODE -> TEST -> FEATURE
 * When an authoritative document mutates:
 * - Old rules transition: ACTIVE -> SUPERSEDED
 * - New extracted rules transition: CANDIDATE (requiring verification & regression)
 * - Enforces Human Review Gate for high-impact rules (Graduation, Warnings, Dismissal, Thesis, English).
 */

export const RULE_LIFECYCLE_STATES = {
  ACTIVE: "ACTIVE",
  SUPERSEDED: "SUPERSEDED",
  CANDIDATE: "CANDIDATE",
  REJECTED: "REJECTED"
};

export const RULE_DEPENDENCY_EDGES = [
  {
    documentId: "DOC_QD_3116",
    clause: "Dieu_14_Dang_ky_tin_chi",
    ruleId: "RULE_CREDIT_SEM_NORMAL",
    codeFile: "academicRuleEngine.js",
    codeFunction: "evaluateSemesterCreditBounds",
    testFile: "academic_intelligence.test.mjs",
    testProtocol: "Protocol 2",
    downstreamFeatures: ["CreditValidator", "TimetableScheduler", "AcademicRadar"],
    isHighImpact: true
  },
  {
    documentId: "DOC_QD_3116",
    clause: "Dieu_16_Canh_bao_hoc_tap",
    ruleId: "RULE_ACADEMIC_WARNING_SEM1",
    codeFile: "academicRuleEngine.js",
    codeFunction: "evaluateAcademicWarning",
    testFile: "academic_intelligence.test.mjs",
    testProtocol: "Protocol 2",
    downstreamFeatures: ["AcademicProbationRadar", "StudentDashboardAlert", "AdvisorNotification"],
    isHighImpact: true
  },
  {
    documentId: "DOC_FIT_CURRICULUM_SE",
    clause: "Yeu_cau_Khoa_luan_110_TC",
    ruleId: "RULE_THESIS_ELIGIBILITY_FIT",
    codeFile: "academicRuleEngine.js",
    codeFunction: "evaluateThesisEligibility",
    testFile: "academic_intelligence.test.mjs",
    testProtocol: "Protocol 2",
    downstreamFeatures: ["ThesisEligibilityRadar", "WhatIfEngine", "GraduationPathPlanner"],
    isHighImpact: true
  },
  {
    documentId: "DOC_FIT_CURRICULUM_SE",
    clause: "Chuan_TOEIC_550_B2",
    ruleId: "RULE_ENGLISH_EXIT_K26_SE",
    codeFile: "versionedCurricula.js",
    codeFunction: "getCurriculumForStudent",
    testFile: "academic_intelligence.test.mjs",
    testProtocol: "Protocol 3",
    downstreamFeatures: ["GraduationChecklist", "EnglishStandardRadar"],
    isHighImpact: true
  }
];

export class RuleDependencyDAG {
  /**
   * Identifies all downstream code, tests, and user features affected by a document change
   * @param {string} documentId 
   * @returns {object} Affected dependency subgraph
   */
  static traceDocumentImpact(documentId) {
    const affectedEdges = RULE_DEPENDENCY_EDGES.filter(e => e.documentId === documentId);

    const affectedRules = [...new Set(affectedEdges.map(e => e.ruleId))];
    const affectedCodeFiles = [...new Set(affectedEdges.map(e => e.codeFile))];
    const affectedTests = [...new Set(affectedEdges.map(e => e.testFile))];
    const affectedFeatures = [...new Set(affectedEdges.flatMap(e => e.downstreamFeatures))];
    const hasHighImpact = affectedEdges.some(e => e.isHighImpact);

    return {
      documentId,
      affectedRulesCount: affectedRules.length,
      affectedRules,
      affectedCodeFiles,
      affectedTests,
      affectedFeatures,
      requiresHumanReviewGate: hasHighImpact,
      invalidationProtocol: "TRANSITION_TO_SUPERSEDED_AND_SPAWN_CANDIDATE"
    };
  }

  /**
   * Executes Invalidation of an old rule and registers a candidate rule
   * @param {string} oldRuleId 
   * @param {object} newCandidatePayload 
   * @returns {object} Invalidation & Candidate Report
   */
  static processRuleTransition(oldRuleId, newCandidatePayload) {
    const edge = RULE_DEPENDENCY_EDGES.find(e => e.ruleId === oldRuleId);

    const oldRuleState = {
      ruleId: oldRuleId,
      previousState: RULE_LIFECYCLE_STATES.ACTIVE,
      newState: RULE_LIFECYCLE_STATES.SUPERSEDED,
      transitionTimestamp: new Date().toISOString(),
      reason: "Superseded by newly retrieved authoritative document snapshot"
    };

    const candidateRule = {
      candidateId: `CANDIDATE_${oldRuleId}_${Date.now()}`,
      replacesRuleId: oldRuleId,
      status: RULE_LIFECYCLE_STATES.CANDIDATE,
      payload: newCandidatePayload,
      requiresHumanReview: edge ? edge.isHighImpact : true,
      humanReviewStatus: "PENDING_APPROVAL",
      regressionPassed: false
    };

    return {
      success: true,
      oldRuleState,
      candidateRule,
      actionRequired: candidateRule.requiresHumanReview
        ? "Bắt buộc quản trị viên phê duyệt tại Human Review Gate trước khi kích hoạt quy tắc mới."
        : "Tự động chạy bộ kiểm thử hồi quy (Regression Test)."
    };
  }
}
