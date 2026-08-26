/**
 * StudentHub AI — Canonical Academic Task & Plan Store
 * 
 * Thread-safe, memory-durable structured store with deep defensive cloning,
 * deterministic deduplication, and complete audit trail retention.
 */

export class AcademicTaskStore {
  static #plansById = new Map();
  static #plansByStudent = new Map();
  static #tasksById = new Map();
  static #tasksByStudent = new Map();
  static #eventsByTask = new Map();

  /**
   * Deep clone helper to prevent memory mutation leaks
   */
  static #clone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    try {
      if (typeof structuredClone === "function") {
        return structuredClone(obj);
      }
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return { ...obj };
    }
  }

  /**
   * Saves or updates an ActionPlan
   * @param {object} plan 
   * @returns {object} Stored ActionPlan clone
   */
  static savePlan(plan) {
    if (!plan || !plan.planId || !plan.studentId) {
      throw new Error("[TASK_STORE_ERROR] Valid plan with planId and studentId is required");
    }

    const cloned = this.#clone(plan);
    cloned.updatedAt = new Date().toISOString();

    this.#plansById.set(cloned.planId, cloned);

    const studentPlans = this.#plansByStudent.get(cloned.studentId) || [];
    const existingIdx = studentPlans.findIndex(p => p.planId === cloned.planId);

    if (existingIdx >= 0) {
      studentPlans[existingIdx] = cloned;
    } else {
      studentPlans.push(cloned);
    }
    this.#plansByStudent.set(cloned.studentId, studentPlans);

    return this.#clone(cloned);
  }

  /**
   * Gets an ActionPlan by planId
   * @param {string} planId 
   * @returns {object|null}
   */
  static getPlan(planId) {
    if (!planId) return null;
    const plan = this.#plansById.get(planId);
    return plan ? this.#clone(plan) : null;
  }

  /**
   * Gets all ActionPlans for a student
   * @param {string} studentId 
   * @returns {Array}
   */
  static getPlansByStudent(studentId) {
    if (!studentId) return [];
    const list = this.#plansByStudent.get(String(studentId).trim()) || [];
    return list.map(p => this.#clone(p));
  }

  /**
   * Saves or updates an AcademicTask
   * @param {object} task 
   * @returns {object} Stored AcademicTask clone
   */
  static saveTask(task) {
    if (!task || !task.taskId || !task.studentId) {
      throw new Error("[TASK_STORE_ERROR] Valid task with taskId and studentId is required");
    }

    const cloned = this.#clone(task);
    cloned.updatedAt = new Date().toISOString();

    this.#tasksById.set(cloned.taskId, cloned);

    const studentTasks = this.#tasksByStudent.get(cloned.studentId) || [];
    const existingIdx = studentTasks.findIndex(t => t.taskId === cloned.taskId);

    if (existingIdx >= 0) {
      studentTasks[existingIdx] = cloned;
    } else {
      studentTasks.push(cloned);
    }
    this.#tasksByStudent.set(cloned.studentId, studentTasks);

    return this.#clone(cloned);
  }

  /**
   * Gets an AcademicTask by taskId
   * @param {string} taskId 
   * @returns {object|null}
   */
  static getTask(taskId) {
    if (!taskId) return null;
    const task = this.#tasksById.get(taskId);
    return task ? this.#clone(task) : null;
  }

  /**
   * Gets all AcademicTasks for a student
   * @param {string} studentId 
   * @returns {Array}
   */
  static getTasksByStudent(studentId) {
    if (!studentId) return [];
    const list = this.#tasksByStudent.get(String(studentId).trim()) || [];
    return list.map(t => this.#clone(t));
  }

  /**
   * Records an immutable WorkflowEvent
   * @param {string} taskId 
   * @param {object} event 
   */
  static recordEvent(taskId, event) {
    if (!taskId || !event) return;

    const list = this.#eventsByTask.get(taskId) || [];
    list.push(this.#clone(event));
    this.#eventsByTask.set(taskId, list);

    // Also sync to task.history if task exists
    const task = this.#tasksById.get(taskId);
    if (task) {
      task.history = [...(task.history || []), this.#clone(event)];
      task.updatedAt = new Date().toISOString();
      this.saveTask(task);
    }
  }

  /**
   * Gets all workflow events for a task
   * @param {string} taskId 
   * @returns {Array}
   */
  static getEvents(taskId) {
    if (!taskId) return [];
    const list = this.#eventsByTask.get(taskId) || [];
    return list.map(e => this.#clone(e));
  }

  /**
   * Resets all task and plan state (for test isolation)
   */
  static resetStore() {
    this.#plansById.clear();
    this.#plansByStudent.clear();
    this.#tasksById.clear();
    this.#tasksByStudent.clear();
    this.#eventsByTask.clear();
  }
}
