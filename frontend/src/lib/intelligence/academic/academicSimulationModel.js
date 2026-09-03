/**
 * StudentHub AI — Canonical Academic Simulation Model V1
 * 
 * Defines typed scenario inputs, safe operations, validation logic, and delta models
 * for the What-If Academic Planning Simulator.
 * 
 * Absolute Invariant: SIMULATION != REALITY
 * Simulation inputs express hypothetical facts/conditions, NEVER forced outcomes.
 */

export const SIMULATION_MODE = "SIMULATION";

// ─── Supported Scenario Operations ───
export const SCENARIO_OPERATIONS = Object.freeze({
  SET_GPA: "SET_GPA",
  GPA_CHANGE: "GPA_CHANGE",
  ADD_CREDITS: "ADD_CREDITS",
  CREDITS_CHANGE: "CREDITS_CHANGE",
  COMPLETE_COURSE: "COMPLETE_COURSE",
  COURSE_COMPLETION: "COURSE_COMPLETION",
  SET_CERTIFICATE_SCORE: "SET_CERTIFICATE_SCORE",
  CERTIFICATE_SCORE_CHANGE: "CERTIFICATE_SCORE_CHANGE",
  VERIFY_CERTIFICATE: "VERIFY_CERTIFICATE",
  CERTIFICATE_VERIFICATION: "CERTIFICATE_VERIFICATION",
  SET_TUITION_CLEARANCE: "SET_TUITION_CLEARANCE",
  TUITION_CLEARANCE_CHANGE: "TUITION_CLEARANCE_CHANGE",
  SATISFY_REQUIREMENT: "SATISFY_REQUIREMENT",
  REQUIREMENT_SATISFIED: "REQUIREMENT_SATISFIED"
});

// ─── Forbidden Scenario Mutation Guard ───
export const FORBIDDEN_OPERATIONS = Object.freeze([
  "FORCE_ELIGIBLE",
  "FORCE_COMPLETED",
  "FORCE_GRADUATION",
  "OVERRIDE_STATUS",
  "OVERRIDE_STUDENT_ID",
  "SET_GRADUATION_READY",
  "SET_THESIS_ELIGIBLE",
  "DELETE_RECORD",
  "DROP_TABLE"
]);

// ─── Delta Types ───
export const DELTA_TYPES = Object.freeze({
  ADDED: "ADDED",
  REMOVED: "REMOVED",
  CHANGED: "CHANGED",
  RESOLVED: "RESOLVED",
  BLOCKED: "BLOCKED",
  UNBLOCKED: "UNBLOCKED",
  NO_CHANGE: "NO_CHANGE"
});

export const MAX_OPERATIONS_PER_SCENARIO = 10;

export class AcademicSimulationModel {
  /**
   * Validates a scenario payload and its constituent operations
   * @param {object|Array} scenarioInput 
   * @returns {{ valid: boolean, operations: Array, errors: Array }}
   */
  static validateScenario(scenarioInput) {
    const rawOps = Array.isArray(scenarioInput) 
      ? scenarioInput 
      : (scenarioInput && Array.isArray(scenarioInput.operations) ? scenarioInput.operations : []);

    const errors = [];
    const validOperations = [];

    if (!Array.isArray(rawOps) || rawOps.length === 0) {
      return {
        valid: false,
        operations: [],
        errors: ["Kịch bản giả lập cần chứa ít nhất một thao tác giả định hợp lệ."]
      };
    }

    if (rawOps.length > MAX_OPERATIONS_PER_SCENARIO) {
      return {
        valid: false,
        operations: [],
        errors: [`Kịch bản vượt quá giới hạn tối đa ${MAX_OPERATIONS_PER_SCENARIO} thao tác đồng thời.`]
      };
    }

    for (let i = 0; i < rawOps.length; i++) {
      const op = rawOps[i];
      if (!op || typeof op !== "object") {
        errors.push(`Thao tác thứ ${i + 1} không hợp lệ.`);
        continue;
      }

      const opType = String(op.type || op.operation || "").trim().toUpperCase();

      // Check for forbidden mutations
      if (FORBIDDEN_OPERATIONS.includes(opType)) {
        errors.push(`Thao tác [${opType}] bị cấm: Giả lập chỉ được thay đổi dữ kiện học vụ, không được áp đặt trực tiếp kết quả xét duyệt.`);
        continue;
      }

      if (!SCENARIO_OPERATIONS[opType]) {
        errors.push(`Loại thao tác [${opType}] không được hỗ trợ trong hệ thống giả lập.`);
        continue;
      }

      // Semantic validation per operation type
      switch (opType) {
        case SCENARIO_OPERATIONS.SET_GPA:
        case SCENARIO_OPERATIONS.GPA_CHANGE: {
          const gpaVal = Number(op.value ?? op.gpa);
          if (Number.isNaN(gpaVal) || gpaVal < 0.0 || gpaVal > 4.0) {
            errors.push(`Điểm GPA giả định phải là số thực trong khoảng từ 0.00 đến 4.00 (nhận được: ${op.value ?? op.gpa}).`);
          } else {
            validOperations.push({
              type: SCENARIO_OPERATIONS.SET_GPA,
              value: Number(gpaVal.toFixed(2))
            });
          }
          break;
        }

        case SCENARIO_OPERATIONS.ADD_CREDITS:
        case SCENARIO_OPERATIONS.CREDITS_CHANGE: {
          const creditsVal = Number(op.value ?? op.credits ?? op.addedCredits);
          if (!Number.isInteger(creditsVal) || creditsVal <= 0 || creditsVal > 150) {
            errors.push(`Số tín chỉ bổ sung phải là số nguyên dương từ 1 đến 150 (nhận được: ${op.value ?? op.credits}).`);
          } else {
            validOperations.push({
              type: SCENARIO_OPERATIONS.ADD_CREDITS,
              value: creditsVal
            });
          }
          break;
        }

        case SCENARIO_OPERATIONS.COMPLETE_COURSE:
        case SCENARIO_OPERATIONS.COURSE_COMPLETION: {
          const courseCode = String(op.courseCode || op.code || "").trim();
          if (!courseCode || courseCode.length < 3) {
            errors.push("Mã học phần giả định hoàn thành không được để trống.");
          } else {
            validOperations.push({
              type: SCENARIO_OPERATIONS.COMPLETE_COURSE,
              courseCode,
              courseName: op.courseName ? String(op.courseName).trim() : null,
              credits: op.credits ? Number(op.credits) : 3,
              grade: op.grade ? Number(op.grade) : 8.0
            });
          }
          break;
        }

        case SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE:
        case SCENARIO_OPERATIONS.CERTIFICATE_SCORE_CHANGE: {
          const certType = String(op.certificateType || op.certType || "TOEIC").trim().toUpperCase();
          const score = Number(op.score ?? op.value);
          if (Number.isNaN(score) || score < 0 || (certType === "TOEIC" && score > 990)) {
            errors.push(`Điểm chứng chỉ ${certType} không hợp lệ (nhận được: ${op.score ?? op.value}).`);
          } else {
            validOperations.push({
              type: SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE,
              certificateType: certType,
              score,
              isVerified: op.isVerified ?? true
            });
          }
          break;
        }

        case SCENARIO_OPERATIONS.VERIFY_CERTIFICATE:
        case SCENARIO_OPERATIONS.CERTIFICATE_VERIFICATION: {
          const certType = String(op.certificateType || op.certType || "TOEIC").trim().toUpperCase();
          validOperations.push({
            type: SCENARIO_OPERATIONS.VERIFY_CERTIFICATE,
            certificateType: certType
          });
          break;
        }

        case SCENARIO_OPERATIONS.SET_TUITION_CLEARANCE:
        case SCENARIO_OPERATIONS.TUITION_CLEARANCE_CHANGE: {
          const isCleared = op.isCleared ?? (op.remainingDebt === 0);
          const remainingDebt = isCleared ? 0 : Number(op.remainingDebt || 0);
          validOperations.push({
            type: SCENARIO_OPERATIONS.SET_TUITION_CLEARANCE,
            isCleared: Boolean(isCleared),
            remainingDebt: Math.max(0, remainingDebt)
          });
          break;
        }

        case SCENARIO_OPERATIONS.SATISFY_REQUIREMENT:
        case SCENARIO_OPERATIONS.REQUIREMENT_SATISFIED: {
          const reqId = String(op.requirementId || op.id || "").trim();
          if (!reqId) {
            errors.push("Mã yêu cầu (requirementId) không được để trống.");
          } else {
            validOperations.push({
              type: SCENARIO_OPERATIONS.SATISFY_REQUIREMENT,
              requirementId: reqId
            });
          }
          break;
        }

        default:
          errors.push(`Thao tác [${opType}] không xác định.`);
          break;
      }
    }

    return {
      valid: errors.length === 0,
      operations: Object.freeze(validOperations.map(o => Object.freeze({ ...o }))),
      errors: Object.freeze([...errors])
    };
  }

  /**
   * Deterministically creates a Scenario entity
   * @param {object} params
   * @returns {object} Canonical Scenario
   */
  static createScenario({
    scenarioId = null,
    title = "Kịch bản Giả định Học vụ",
    description = "",
    operations = [],
    studentId = "ANON",
    baseProfileRevision = 1,
    baseTwinRevision = 1
  }) {
    const validation = this.validateScenario(operations);
    if (!validation.valid) {
      throw new Error(`[SCENARIO_VALIDATION_ERROR] ${validation.errors.join("; ")}`);
    }

    const cleanStudent = String(studentId).trim();
    const id = scenarioId || `SCEN_${cleanStudent}_${Date.now()}`;

    return Object.freeze({
      scenarioId: id,
      title: String(title).trim(),
      description: String(description || "").trim(),
      operations: validation.operations,
      studentId: cleanStudent,
      baseProfileRevision: Number(baseProfileRevision) || 1,
      baseTwinRevision: Number(baseTwinRevision) || 1,
      mode: SIMULATION_MODE,
      createdAt: new Date().toISOString()
    });
  }
}
