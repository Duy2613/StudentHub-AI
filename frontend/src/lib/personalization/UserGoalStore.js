/**
 * StudentHub AI — Durable User Goal Store
 * 
 * Provides crash-safe atomic persistence and retrieval for student academic goals.
 * File storage: .data/user_goals_store.json
 */

import fs from "node:fs";
import path from "node:path";

const DEFAULT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, "user_goals_store.json");

export class UserGoalStore {
  static #storageFilePath = DEFAULT_STORE_FILE;
  static #goalsBySubject = new Map(); // subjectId -> Array<GoalObject>
  static #isHydrated = false;

  static setStoragePath(customPath) {
    if (customPath) {
      this.#storageFilePath = customPath;
      this.rehydrate();
    }
  }

  static clear() {
    this.#goalsBySubject.clear();
    this.#isHydrated = true;
    try {
      if (fs.existsSync(this.#storageFilePath)) {
        fs.unlinkSync(this.#storageFilePath);
      }
    } catch {
      // ignore
    }
  }

  static #ensureStorageDir() {
    const dir = path.dirname(this.#storageFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static rehydrate() {
    this.#ensureStorageDir();
    if (!fs.existsSync(this.#storageFilePath)) {
      this.#goalsBySubject.clear();
      this.#isHydrated = true;
      return;
    }

    try {
      const raw = fs.readFileSync(this.#storageFilePath, "utf8");
      const data = JSON.parse(raw);
      this.#goalsBySubject.clear();

      if (data && typeof data === "object" && data.goals) {
        for (const [subjectId, goalsList] of Object.entries(data.goals)) {
          if (Array.isArray(goalsList)) {
            this.#goalsBySubject.set(subjectId, goalsList);
          }
        }
      }
      this.#isHydrated = true;
    } catch {
      this.#goalsBySubject.clear();
      this.#isHydrated = true;
    }
  }

  static persist() {
    this.#ensureStorageDir();
    const goalsObj = {};
    for (const [subj, list] of this.#goalsBySubject.entries()) {
      goalsObj[subj] = list;
    }

    const payload = {
      version: "1.0.0",
      updatedAt: new Date().toISOString(),
      goals: goalsObj
    };

    const tempFile = `${this.#storageFilePath}.tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), "utf8");
      fs.renameSync(tempFile, this.#storageFilePath);
    } catch (err) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {
        // ignore
      }
    }
  }

  static getGoalsForSubject(subjectId) {
    if (!this.#isHydrated) this.rehydrate();
    return this.#goalsBySubject.get(subjectId) || [];
  }

  static saveGoal(subjectId, goal) {
    if (!this.#isHydrated) this.rehydrate();
    if (!this.#goalsBySubject.has(subjectId)) {
      this.#goalsBySubject.set(subjectId, []);
    }
    const list = this.#goalsBySubject.get(subjectId);
    const existingIndex = list.findIndex(g => g.goalId === goal.goalId);
    if (existingIndex >= 0) {
      list[existingIndex] = goal;
    } else {
      list.push(goal);
    }
    this.persist();
    return goal;
  }

  static deleteGoal(subjectId, goalId) {
    if (!this.#isHydrated) this.rehydrate();
    const list = this.#goalsBySubject.get(subjectId);
    if (!list) return false;
    const initialLen = list.length;
    const updated = list.filter(g => g.goalId !== goalId);
    this.#goalsBySubject.set(subjectId, updated);
    this.persist();
    return updated.length < initialLen;
  }
}
