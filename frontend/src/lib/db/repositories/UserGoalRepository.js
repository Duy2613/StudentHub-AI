/**
 * StudentHub AI — UserGoalRepository
 * Production repository abstraction for student academic aspirations and goal tracking.
 */

import { DatabaseAdapter } from "../DatabaseAdapter.js";

export class UserGoalRepository {
  static #adapter = new DatabaseAdapter("user_goals");

  static async getGoalsForSubject(subjectId) {
    if (!subjectId) return [];
    return this.#adapter.find({ subjectId });
  }

  static async getGoalById(goalId) {
    return this.#adapter.findById(goalId, "goalId");
  }

  static async saveGoal(subjectId, goal) {
    if (!subjectId || !goal.goalId) {
      throw new Error("[REPO_ERROR] subjectId and goalId are required.");
    }
    const record = {
      ...goal,
      subjectId
    };
    return this.#adapter.save(record, "goalId");
  }

  static async deleteGoal(subjectId, goalId) {
    const existing = await this.getGoalById(goalId);
    if (existing && existing.subjectId === subjectId) {
      return this.#adapter.delete(goalId, "goalId");
    }
    return false;
  }

  static async clear() {
    return this.#adapter.clear();
  }
}
