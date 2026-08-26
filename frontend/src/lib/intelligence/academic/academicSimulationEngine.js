/**
 * StudentHub AI — Canonical Academic Planning & What-If Simulation Engine V1
 * 
 * Executes hypothetical academic scenarios against an isolated, in-memory sandbox.
 * Composes existing deterministic engines (AcademicEligibilityEngine, AcademicRoadmapEngine)
 * without mutating real database, Profile360, DigitalTwin, Tasks, or Notifications.
 * 
 * Absolute Invariant: SIMULATION != REALITY
 */

import { 
  AcademicSimulationModel, 
  SIMULATION_MODE, 
  SCENARIO_OPERATIONS, 
  DELTA_TYPES 
} from "./academicSimulationModel.js";
import { AcademicEligibilityEngine, ELIGIBILITY_STATUS } from "./academicEligibilityEngine.js";
import { AcademicRoadmapEngine } from "./academicRoadmapEngine.js";
import { MILESTONE_STATES, MILESTONE_TYPES } from "./academicMilestoneModel.js";
import { getCurriculumForStudent } from "./versionedCurricula.js";
import { AcademicClock } from "./academicClock.js";

export class AcademicSimulationEngine {
  /**
   * Simulates a hypothetical scenario against authoritative baseline data
   * @param {object} params
   * @returns {object} Immutable SimulationResult
   */
  static simulateScenario({
    studentId,
    scenario,
    profile360 = null,
    digitalTwin = null,
    activeTasks = [],
    clock = AcademicClock
  }) {
    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      throw new Error("[SIMULATION_ERROR] studentId is required for simulation.");
    }

    const cleanStudentId = String(studentId).trim();
    const nowIso = clock.nowIso ? clock.nowIso() : new Date().toISOString();

    // 1. Validate scenario operations
    const validation = AcademicSimulationModel.validateScenario(scenario);
    if (!validation.valid) {
      throw new Error(`[SIMULATION_ERROR] Invalid scenario: ${validation.errors.join("; ")}`);
    }

    // 2. Clone baseline state into isolated sandbox objects (deep clone)
    const baseProfile = profile360 ? JSON.parse(JSON.stringify(profile360)) : this.#createDefaultProfile(cleanStudentId);
    const baseTwin = digitalTwin ? JSON.parse(JSON.stringify(digitalTwin)) : this.#createDefaultTwin(baseProfile);

    const cohort = baseProfile.identity?.cohort || 2024;
    const programCode = baseProfile.identity?.programCode || "7480103";
    const curriculum = getCurriculumForStudent(programCode, cohort);
    const curriculumVersion = curriculum?.version?.versionId || `HCMUTE_SE_${cohort}`;

    // 3. Evaluate Authoritative BASELINE Outcomes
    const baseEligibility = AcademicEligibilityEngine.evaluateEligibility(baseTwin);
    const baseRoadmap = AcademicRoadmapEngine.buildStudentRoadmap(
      cleanStudentId,
      baseProfile,
      baseTwin,
      baseEligibility,
      activeTasks,
      [],
      clock
    );

    // 4. Create isolated Sandbox Copies for Simulation
    const simProfile = JSON.parse(JSON.stringify(baseProfile));
    const simTwin = JSON.parse(JSON.stringify(baseTwin));

    // 5. Apply Scenario Operations to Sandbox Clones
    this.#applyScenarioToSandbox(validation.operations, simProfile, simTwin);

    // 6. Evaluate SIMULATED Outcomes using canonical engines
    const simEligibility = AcademicEligibilityEngine.evaluateEligibility(simTwin);
    const simRoadmap = AcademicRoadmapEngine.buildStudentRoadmap(
      cleanStudentId,
      simProfile,
      simTwin,
      simEligibility,
      activeTasks,
      [],
      clock
    );

    // 7. Compute Detailed Comparison & Deltas
    const deltas = this.#computeDeltas(
      baseProfile, simProfile,
      baseTwin, simTwin,
      baseEligibility, simEligibility,
      baseRoadmap, simRoadmap,
      validation.operations,
      curriculumVersion
    );

    // 8. Assemble Immutable Simulation Result
    const simulationId = `SIM_${cleanStudentId}_${Date.now()}`;
    const baseProfileRev = baseProfile.profileRevision || 1;
    const baseTwinRev = baseTwin.revision || 1;

    return Object.freeze({
      simulationId,
      mode: SIMULATION_MODE,
      isSimulated: true,
      studentId: cleanStudentId,
      evaluatedAt: nowIso,
      baseRevisions: Object.freeze({
        profileRevision: baseProfileRev,
        twinRevision: baseTwinRev,
        curriculumVersion
      }),
      appliedOperations: validation.operations,
      baseline: Object.freeze({
        cgpa: baseTwin.cgpa ?? baseProfile.academicSummary?.cgpa ?? 0,
        earnedCredits: baseTwin.earnedCredits ?? baseProfile.academicSummary?.earnedCredits ?? 0,
        eligibilityStatus: baseEligibility.status,
        isEligible: baseEligibility.eligible,
        roadmapProgress: baseRoadmap.progress,
        currentStage: baseRoadmap.currentStage,
        blockerCount: baseRoadmap.blockers.length,
        nextAction: baseRoadmap.nextAction
      }),
      projected: Object.freeze({
        cgpa: simTwin.cgpa ?? simProfile.academicSummary?.cgpa ?? 0,
        earnedCredits: simTwin.earnedCredits ?? simProfile.academicSummary?.earnedCredits ?? 0,
        eligibilityStatus: simEligibility.status,
        isEligible: simEligibility.eligible,
        roadmapProgress: simRoadmap.progress,
        currentStage: simRoadmap.currentStage,
        blockerCount: simRoadmap.blockers.length,
        nextAction: simRoadmap.nextAction
      }),
      deltas: Object.freeze(deltas),
      simulatedEligibility: simEligibility,
      simulatedRoadmap: simRoadmap,
      limitations: Object.freeze([
        "Kết quả giả định chỉ mang tính chất tham khảo học vụ cá nhân trong môi trường sandbox.",
        "Hệ thống không tự động thay đổi bảng điểm hay hồ sơ chính thức của Nhà trường.",
        "Mọi hành động thật cần được nộp và phê duyệt qua các quy trình học vụ chính thống của HCMUTE."
      ])
    });
  }

  // ─── Private Sandbox Helpers ───

  static #applyScenarioToSandbox(operations, profile, twin) {
    if (!profile.academicSummary) {
      profile.academicSummary = {};
    }
    if (!profile.graduationRequirements) {
      profile.graduationRequirements = [];
    }
    if (!twin.courses) {
      twin.courses = [];
    }
    if (!twin.certificates) {
      twin.certificates = [];
    }

    for (const op of operations) {
      switch (op.type) {
        case SCENARIO_OPERATIONS.SET_GPA: {
          twin.cgpa = op.value;
          profile.academicSummary.cgpa = op.value;
          const gpaReq = profile.graduationRequirements.find(r => r.requirementType === "GPA_MIN");
          if (gpaReq) {
            gpaReq.currentValue = op.value;
            gpaReq.isSatisfied = op.value >= (gpaReq.requiredValue || 2.0);
            gpaReq.status = gpaReq.isSatisfied ? "SATISFIED" : "PENDING";
          }
          break;
        }

        case SCENARIO_OPERATIONS.ADD_CREDITS: {
          const currentCredits = twin.earnedCredits || 0;
          const newCredits = currentCredits + op.value;
          twin.earnedCredits = newCredits;
          profile.academicSummary.earnedCredits = newCredits;
          const reqCredits = profile.graduationRequirements.find(r => r.requirementType === "CREDITS_MIN");
          if (reqCredits) {
            reqCredits.currentValue = newCredits;
            reqCredits.isSatisfied = newCredits >= (reqCredits.requiredValue || 150);
            reqCredits.status = reqCredits.isSatisfied ? "SATISFIED" : "PENDING";
          }
          break;
        }

        case SCENARIO_OPERATIONS.COMPLETE_COURSE: {
          const existingCourse = twin.courses.find(c => c.courseCode === op.courseCode);
          if (existingCourse) {
            existingCourse.isPassed = true;
            existingCourse.status = "COMPLETED";
            existingCourse.grade = op.grade || 8.0;
          } else {
            const addedCredits = op.credits || 3;
            twin.courses.push({
              courseCode: op.courseCode,
              courseName: op.courseName || op.courseCode,
              credits: addedCredits,
              grade: op.grade || 8.0,
              isPassed: true,
              status: "COMPLETED"
            });
            twin.earnedCredits = (twin.earnedCredits || 0) + addedCredits;
            profile.academicSummary.earnedCredits = twin.earnedCredits;
          }
          break;
        }

        case SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE: {
          const certType = op.certificateType || "TOEIC";
          const existingCert = twin.certificates.find(c => c.type === certType);
          if (existingCert) {
            existingCert.score = op.score;
            existingCert.verificationStatus = "VERIFIED";
          } else {
            twin.certificates.push({
              type: certType,
              score: op.score,
              verificationStatus: "VERIFIED"
            });
          }

          const certReq = profile.graduationRequirements.find(r => r.requirementType === "CERTIFICATE_PRESENT");
          if (certReq) {
            certReq.currentValue = op.score;
            certReq.isSatisfied = op.score >= (certReq.requiredValue || 500);
            certReq.status = certReq.isSatisfied ? "SATISFIED" : "PENDING";
          }
          break;
        }

        case SCENARIO_OPERATIONS.VERIFY_CERTIFICATE: {
          const certType = op.certificateType || "TOEIC";
          const cert = twin.certificates.find(c => c.type === certType);
          if (cert) {
            cert.verificationStatus = "VERIFIED";
          }
          break;
        }

        case SCENARIO_OPERATIONS.SET_TUITION_CLEARANCE: {
          twin.tuitionPaid = op.isCleared;
          twin.debtAmount = op.remainingDebt;
          if (profile.financialClearance) {
            profile.financialClearance.isCleared = op.isCleared;
            profile.financialClearance.remainingDebt = op.remainingDebt;
          }
          const finReq = profile.graduationRequirements.find(r => r.requirementType === "TUITION_CLEAR");
          if (finReq) {
            finReq.currentValue = op.remainingDebt;
            finReq.isSatisfied = op.isCleared;
            finReq.status = op.isCleared ? "SATISFIED" : "PENDING";
          }
          break;
        }

        case SCENARIO_OPERATIONS.SATISFY_REQUIREMENT: {
          const req = profile.graduationRequirements.find(r => r.requirementId === op.requirementId);
          if (req) {
            req.isSatisfied = true;
            req.status = "SATISFIED";
          }
          break;
        }
      }
    }
  }

  static #computeDeltas(
    baseProfile, simProfile,
    baseTwin, simTwin,
    baseEligibility, simEligibility,
    baseRoadmap, simRoadmap,
    operations,
    curriculumVersion
  ) {
    const deltas = [];

    // 1. Eligibility Status Delta
    if (baseEligibility.status !== simEligibility.status) {
      deltas.push({
        deltaId: `DELTA_ELIGIBILITY`,
        type: DELTA_TYPES.CHANGED,
        category: "ELIGIBILITY",
        field: "status",
        before: baseEligibility.status,
        after: simEligibility.status,
        summary: `Điều kiện xét duyệt học vụ chuyển từ [${baseEligibility.status}] sang [${simEligibility.status}].`,
        whyItChanged: simEligibility.eligible 
          ? `Tất cả các tiêu chí xét tốt nghiệp theo khung CTĐT ${curriculumVersion} đã được đáp ứng trong kịch bản giả định.`
          : `Trạng thái điều kiện đã được cập nhật nhưng vẫn còn một số tiêu chí chưa hoàn thành.`
      });
    }

    // 2. Roadmap Progress Percentage Delta
    const basePct = baseRoadmap.progress.percentage;
    const simPct = simRoadmap.progress.percentage;
    if (basePct !== simPct) {
      deltas.push({
        deltaId: `DELTA_ROADMAP_PROGRESS`,
        type: simPct > basePct ? DELTA_TYPES.CHANGED : DELTA_TYPES.NO_CHANGE,
        category: "ROADMAP",
        field: "progressPercentage",
        before: `${basePct}%`,
        after: `${simPct}%`,
        summary: `Tiến độ hoàn thành lộ trình tăng từ ${basePct}% lên ${simPct}% (+${simPct - basePct}%).`,
        whyItChanged: `Có thêm ${simRoadmap.progress.completed - baseRoadmap.progress.completed} cột mốc học vụ chuyển sang trạng thái hoàn thành.`
      });
    }

    // 3. Milestone State Transitions (e.g. BLOCKED -> READY, IN_PROGRESS -> COMPLETED)
    for (const simMs of simRoadmap.allMilestones) {
      const baseMs = baseRoadmap.allMilestones.find(m => m.type === simMs.type);
      if (baseMs && baseMs.state !== simMs.state) {
        const isUnlocked = (baseMs.state === MILESTONE_STATES.BLOCKED && simMs.state === MILESTONE_STATES.READY) ||
                           (baseMs.state === MILESTONE_STATES.IN_PROGRESS && simMs.state === MILESTONE_STATES.COMPLETED);
        
        deltas.push({
          deltaId: `DELTA_MILESTONE_${simMs.type}`,
          type: isUnlocked ? DELTA_TYPES.UNBLOCKED : DELTA_TYPES.CHANGED,
          category: "MILESTONE",
          field: simMs.type,
          milestoneTitle: simMs.title,
          before: baseMs.state,
          after: simMs.state,
          summary: `Cột mốc [${simMs.title}]: chuyển từ [${baseMs.state}] sang [${simMs.state}].`,
          whyItChanged: this.#explainMilestoneTransition(simMs.type, baseMs.state, simMs.state, curriculumVersion)
        });
      }
    }

    // 4. Blocker Resolution Deltas
    const resolvedBlockers = baseRoadmap.blockers.filter(b => 
      !simRoadmap.blockers.some(sb => sb.blockerId === b.blockerId)
    );
    for (const b of resolvedBlockers) {
      deltas.push({
        deltaId: `DELTA_RESOLVED_${b.blockerId}`,
        type: DELTA_TYPES.RESOLVED,
        category: "BLOCKER",
        field: b.type,
        before: b.reason,
        after: "ĐÃ GIẢI TỎA",
        summary: `Yếu tố cản trở [${b.title}] đã được giải tỏa thành công.`,
        whyItChanged: `Dữ kiện giả định đã đáp ứng đầy đủ định mức yêu cầu của quy chế.`
      });
    }

    return deltas;
  }

  static #explainMilestoneTransition(type, before, after, curriculumVersion) {
    switch (type) {
      case MILESTONE_TYPES.LANGUAGE_REQUIREMENT:
        return `Điểm chứng chỉ ngoại ngữ giả định đạt hoặc vượt định mức chuẩn đầu ra theo CTĐT ${curriculumVersion}.`;
      case MILESTONE_TYPES.ACADEMIC_PROGRESS:
        return `Tín chỉ tích lũy đạt mốc yêu cầu của khung chương trình.`;
      case MILESTONE_TYPES.THESIS_ELIGIBILITY:
        return `Sinh viên thỏa mãn đồng thời điều kiện tín chỉ tối thiểu (>=110 TC) và điểm trung bình tích lũy CGPA.`;
      case MILESTONE_TYPES.GRADUATION_APPLICATION:
        return `Toàn bộ các điều kiện tiên quyết (tín chỉ, GPA, chuẩn ngoại ngữ, học phí) đã được đáp ứng đầy đủ, mở khóa bước Nộp hồ sơ tốt nghiệp.`;
      case MILESTONE_TYPES.GRADUATION:
        return `Lộ trình học vụ hoàn tất 100% các tiêu chuẩn tốt nghiệp của Nhà trường.`;
      default:
        return `Trạng thái cột mốc thay đổi theo kết quả tính toán lại của động cơ học vụ.`;
    }
  }

  static #createDefaultProfile(studentId) {
    return {
      studentId,
      profileRevision: 1,
      identity: { cohort: 2024, programCode: "7480103", fullName: "Sinh viên" },
      academicSummary: { earnedCredits: 115, cgpa: 2.85, expectedGraduationYear: 2028 },
      graduationRequirements: [
        { requirementId: "REQ_TOTAL_CREDITS", requirementType: "CREDITS_MIN", currentValue: 115, requiredValue: 150, isSatisfied: false },
        { requirementId: "REQ_MIN_GPA", requirementType: "GPA_MIN", currentValue: 2.85, requiredValue: 2.0, isSatisfied: true },
        { requirementId: "REQ_ENGLISH_TOEIC", requirementType: "CERTIFICATE_PRESENT", currentValue: 450, requiredValue: 500, isSatisfied: false },
        { requirementId: "REQ_TUITION_CLEARANCE", requirementType: "TUITION_CLEAR", currentValue: 0, requiredValue: 0, isSatisfied: true }
      ],
      courseRecords: [],
      certifications: [{ type: "TOEIC", score: 450, verificationStatus: "VERIFIED" }],
      financialClearance: { isCleared: true, remainingDebt: 0 },
      freshness: { sections: { identity: "FRESH", transcripts: "FRESH" } }
    };
  }

  static #createDefaultTwin(profile) {
    return {
      studentId: profile.studentId,
      revision: profile.profileRevision || 1,
      cgpa: profile.academicSummary?.cgpa ?? 2.85,
      earnedCredits: profile.academicSummary?.earnedCredits ?? 115,
      courses: profile.courseRecords || [],
      certificates: profile.certifications || [],
      tuitionPaid: profile.financialClearance?.isCleared !== false,
      debtAmount: profile.financialClearance?.remainingDebt || 0,
      isThesisEligible: false,
      isGraduationReady: false
    };
  }
}
