/**
 * StudentHub AI — UserGoalEngine V1
 * 
 * First-class academic goals management engine backed by durable UserGoalStore.
 * Maps student aspirations to courses, certifications, deadlines, and progress metrics.
 */

import { UserGoalStore } from "./UserGoalStore.js";

export const GOAL_PRIORITY = Object.freeze({
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
});

export const GOAL_CATEGORY = Object.freeze({
  GRADUATION: "GRADUATION",
  CERTIFICATION: "CERTIFICATION",
  GPA_TARGET: "GPA_TARGET",
  COURSE_MASTERY: "COURSE_MASTERY",
  CAREER: "CAREER"
});

export const GOAL_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  PAUSED: "PAUSED"
});

export class UserGoalEngine {
  /**
   * Creates a new academic goal for a student
   * @param {string} subjectId 
   * @param {object} goalData 
   * @returns {object} Created Goal
   */
  static createGoal(subjectId, goalData = {}) {
    if (!subjectId) throw new Error("[GOAL_ERROR] subjectId is required.");

    const goal = {
      goalId: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      subjectId,
      title: goalData.title || "Mục tiêu học vụ mới",
      priority: goalData.priority || GOAL_PRIORITY.MEDIUM,
      category: goalData.category || GOAL_CATEGORY.COURSE_MASTERY,
      deadline: goalData.deadline || null,
      status: GOAL_STATUS.ACTIVE,
      linkedCourses: Array.isArray(goalData.linkedCourses) ? goalData.linkedCourses : [],
      targetMetric: goalData.targetMetric || null,
      currentProgress: goalData.currentProgress || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    UserGoalStore.saveGoal(subjectId, goal);
    return Object.freeze({ ...goal });
  }

  /**
   * Retrieves all goals for a subject
   * @param {string} subjectId 
   * @returns {Array<object>}
   */
  static getGoals(subjectId) {
    const list = UserGoalStore.getGoalsForSubject(subjectId);
    if (!list || list.length === 0) {
      // Default goal for demo
      const defaultGoal = {
        goalId: `goal_default_${subjectId.replace("student:", "")}`,
        subjectId,
        title: "Đạt chuẩn đầu ra TOEIC 650+",
        priority: GOAL_PRIORITY.HIGH,
        category: GOAL_CATEGORY.CERTIFICATION,
        deadline: "2026-06-30",
        status: GOAL_STATUS.ACTIVE,
        linkedCourses: ["COURSE:ENGL1301"],
        currentProgress: 75,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      UserGoalStore.saveGoal(subjectId, defaultGoal);
      return [Object.freeze({ ...defaultGoal })];
    }
    return list.map(g => Object.freeze({ ...g }));
  }

  /**
   * Updates goal progress
   * @param {string} subjectId 
   * @param {string} goalId 
   * @param {number} progress 
   * @returns {object|null}
   */
  static updateProgress(subjectId, goalId, progress) {
    const list = UserGoalStore.getGoalsForSubject(subjectId);
    const goal = list.find(g => g.goalId === goalId);
    if (goal) {
      goal.currentProgress = Math.min(100, Math.max(0, progress));
      if (goal.currentProgress === 100) {
        goal.status = GOAL_STATUS.COMPLETED;
      }
      goal.updatedAt = new Date().toISOString();
      UserGoalStore.saveGoal(subjectId, goal);
      return Object.freeze({ ...goal });
    }
    return null;
  }

  /**
   * Clears goals (for testing)
   */
  static clear() {
    UserGoalStore.clear();
  }
}
