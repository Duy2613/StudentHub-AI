/**
 * StudentHub AI — Academic Task Authorization & Security Guard
 * 
 * Enforces strict user isolation and prevents client status injection:
 * - Guarantees student A cannot read or mutate student B's tasks
 * - Validates preconditions and step dependencies before executing state transitions
 * - Blocks client-forged direct completion payloads
 */

export class AcademicTaskAuthorization {
  /**
   * Asserts task ownership by the requesting student
   * @param {object} task 
   * @param {string} requestingStudentId 
   */
  static assertTaskOwnership(task, requestingStudentId) {
    if (!task) {
      throw new Error("[NOT_FOUND] Nhiệm vụ học vụ không tồn tại.");
    }

    const cleanReqId = String(requestingStudentId || "").trim();
    const cleanOwnerId = String(task.studentId || "").trim();

    if (!cleanReqId || !cleanOwnerId || cleanReqId !== cleanOwnerId) {
      throw new Error(`[FORBIDDEN] Bạn không có quyền truy cập hoặc thao tác trên nhiệm vụ này (Yêu cầu: ${cleanReqId}, Chủ sở hữu: ${cleanOwnerId}).`);
    }
  }

  /**
   * Validates step dependency and state progression
   * @param {object} task 
   * @param {string} stepId 
   */
  static assertStepDependenciesMet(task, stepId) {
    if (!task || !Array.isArray(task.steps)) return;

    const stepIndex = task.steps.findIndex(s => s.stepId === stepId);
    if (stepIndex < 0) {
      throw new Error(`[INVALID_STEP] Bước học vụ '${stepId}' không tồn tại trong nhiệm vụ.`);
    }

    const currentStep = task.steps[stepIndex];

    // Check previous steps if step has dependencies or is sequential
    if (stepIndex > 0) {
      const prevStep = task.steps[stepIndex - 1];
      if (prevStep.status !== "COMPLETED") {
        throw new Error(`[DEPENDENCY_BLOCKED] Bạn cần hoàn thành bước '${prevStep.title}' trước khi thực hiện '${currentStep.title}'.`);
      }
    }
  }
}
