/**
 * StudentHub AI — Canonical Academic Decision & Plan Adoption Store V1
 * 
 * Persistent/in-memory storage for student-adopted semester study plans.
 * Provides multi-student isolation, revision pinning, and staleness detection.
 */

import { ADOPTION_STATUS } from "./academicDecisionModel.js";

export class AcademicDecisionStore {
  static #adoptedById = new Map();
  static #adoptedByStudent = new Map(); // studentId -> Array of adopted records

  /**
   * Deep clone helper to prevent memory mutation leaks
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
   * Saves an adopted plan record. Marks existing plan for same term as SUPERSEDED.
   * @param {object} adoptionRecord 
   * @returns {object} Stored record
   */
  static saveAdoption(adoptionRecord) {
    if (!adoptionRecord || !adoptionRecord.studentId || !adoptionRecord.planId) {
      throw new Error("[DECISION_STORE_ERROR] Invalid adoption record.");
    }

    const cloned = this.#clone(adoptionRecord);
    const studentId = cloned.studentId;
    const targetTerm = cloned.targetTerm;

    const list = this.#adoptedByStudent.get(studentId) || [];

    // Mark previous active adoptions for the same term as SUPERSEDED
    const updatedList = list.map(item => {
      if (item.targetTerm === targetTerm && item.status === ADOPTION_STATUS.ADOPTED) {
        const superseded = { ...item, status: ADOPTION_STATUS.SUPERSEDED, supersededAt: new Date().toISOString() };
        this.#adoptedById.set(superseded.adoptionId, superseded);
        return superseded;
      }
      return item;
    });

    updatedList.push(cloned);
    this.#adoptedById.set(cloned.adoptionId, cloned);
    this.#adoptedByStudent.set(studentId, updatedList);

    return this.#clone(cloned);
  }

  /**
   * Retrieves active adopted plan for student and target term
   * @param {string} studentId 
   * @param {string} targetTerm 
   * @returns {object|null}
   */
  static getActiveAdoption(studentId, targetTerm = "2026-HK1") {
    if (!studentId) return null;
    const list = this.#adoptedByStudent.get(studentId) || [];
    const found = list.find(
      item => item.targetTerm.toUpperCase() === String(targetTerm).trim().toUpperCase() &&
              item.status === ADOPTION_STATUS.ADOPTED
    );
    return found ? this.#clone(found) : null;
  }

  /**
   * Retrieves all adoption history for a student
   * @param {string} studentId 
   * @returns {Array<object>}
   */
  static getAdoptionsByStudent(studentId) {
    if (!studentId) return [];
    const list = this.#adoptedByStudent.get(studentId) || [];
    return list.map(item => this.#clone(item));
  }

  /**
   * Checks if an adopted plan has become stale
   * @param {object} adoptedRecord 
   * @param {number} currentProfileRev 
   * @param {number} currentTwinRev 
   * @returns {boolean}
   */
  static isAdoptionStale(adoptedRecord, currentProfileRev = 1, currentTwinRev = 1) {
    if (!adoptedRecord || !adoptedRecord.baseRevisions) return true;
    return (
      adoptedRecord.baseRevisions.profileRevision !== currentProfileRev ||
      adoptedRecord.baseRevisions.twinRevision !== currentTwinRev
    );
  }

  /**
   * Clears all adoptions (for test isolation)
   */
  static clear() {
    this.#adoptedById.clear();
    this.#adoptedByStudent.clear();
  }
}
