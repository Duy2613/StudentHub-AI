/**
 * StudentHub AI — Canonical Academic Execution Store V1
 * 
 * Persistent/in-memory storage for student execution snapshots and plan drift logs.
 * Provides multi-student isolation, revision pinning, and history preservation.
 */

import { EXECUTION_STATUS } from "./academicExecutionModel.js";

export class AcademicExecutionStore {
  static #executionsById = new Map();
  static #executionsByStudent = new Map(); // studentId -> Array of ExecutionRecords

  /**
   * Deep clone helper to prevent mutation leaks
   */
  static #clone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    try {
      if (typeof structuredClone === "function") return structuredClone(obj);
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return { ...obj };
    }
  }

  /**
   * Saves or updates an execution snapshot.
   * If a new execution for the same term with a different adoptedPlanId is saved, marks older ones as SUPERSEDED.
   * @param {object} executionRecord 
   * @returns {object} Stored execution record
   */
  static saveExecution(executionRecord) {
    if (!executionRecord || !executionRecord.studentId || !executionRecord.executionId) {
      throw new Error("[EXECUTION_STORE_ERROR] Invalid execution record.");
    }

    const cloned = this.#clone(executionRecord);
    const studentId = cloned.studentId;
    const targetTerm = cloned.targetTerm;
    const adoptedPlanId = cloned.adoptedPlanId;

    const list = this.#executionsByStudent.get(studentId) || [];

    // Mark previous executions for the same term with different adoptedPlanId as SUPERSEDED
    const updatedList = list.map(item => {
      if (
        item.targetTerm === targetTerm &&
        item.adoptedPlanId !== adoptedPlanId &&
        item.status !== EXECUTION_STATUS.SUPERSEDED
      ) {
        const superseded = {
          ...item,
          status: EXECUTION_STATUS.SUPERSEDED,
          supersededAt: new Date().toISOString()
        };
        this.#executionsById.set(superseded.executionId, superseded);
        return superseded;
      }
      return item;
    });

    // Replace if same executionId exists, otherwise append
    const existingIdx = updatedList.findIndex(e => e.executionId === cloned.executionId);
    if (existingIdx >= 0) {
      updatedList[existingIdx] = cloned;
    } else {
      updatedList.push(cloned);
    }

    this.#executionsById.set(cloned.executionId, cloned);
    this.#executionsByStudent.set(studentId, updatedList);

    return this.#clone(cloned);
  }

  /**
   * Retrieves active execution for a student and target term
   * @param {string} studentId 
   * @param {string} targetTerm 
   * @returns {object|null}
   */
  static getActiveExecution(studentId, targetTerm = "2026-HK1") {
    if (!studentId) return null;
    const list = this.#executionsByStudent.get(studentId) || [];
    const found = list.find(
      item => item.targetTerm.toUpperCase() === String(targetTerm).trim().toUpperCase() &&
              item.status !== EXECUTION_STATUS.SUPERSEDED
    );
    return found ? this.#clone(found) : null;
  }

  /**
   * Retrieves execution record by executionId
   * @param {string} executionId 
   * @returns {object|null}
   */
  static getExecutionById(executionId) {
    if (!executionId) return null;
    const found = this.#executionsById.get(executionId);
    return found ? this.#clone(found) : null;
  }

  /**
   * Retrieves all historical executions for a student
   * @param {string} studentId 
   * @returns {Array<object>}
   */
  static getExecutionsByStudent(studentId) {
    if (!studentId) return [];
    const list = this.#executionsByStudent.get(studentId) || [];
    return list.map(item => this.#clone(item));
  }

  /**
   * Clears all executions (for test isolation)
   */
  static clear() {
    this.#executionsById.clear();
    this.#executionsByStudent.clear();
  }
}
