/**
 * StudentHub AI — Canonical Authoritative Student Profile 360 Store V1
 * 
 * Provides crash-safe atomic disk persistence (.tmp -> renameSync),
 * boot-time rehydration, and optimistic revision concurrency locking.
 */

import fs from "node:fs";
import path from "node:path";
import { StudentProfile360Model } from "./studentProfile360Model.js";

export class StudentProfile360Store {
  static #storageDir = path.resolve(process.cwd(), ".data");
  static #storageFilePath = path.resolve(this.#storageDir, "student_profile_360_store.json");
  static #tempFilePath = path.resolve(this.#storageDir, "student_profile_360_store.json.tmp");

  static #profilesByStudentId = new Map();
  static #isInitialized = false;

  static #clone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  static #ensureDir() {
    if (!fs.existsSync(this.#storageDir)) {
      fs.mkdirSync(this.#storageDir, { recursive: true });
    }
  }

  /**
   * Flushes in-memory profiles to disk atomically
   */
  static flushToDisk() {
    this.#ensureDir();
    const payload = {
      version: "1.0.0",
      flushedAt: new Date().toISOString(),
      profiles: Array.from(this.#profilesByStudentId.values())
    };

    fs.writeFileSync(this.#tempFilePath, JSON.stringify(payload, null, 2), "utf-8");
    fs.renameSync(this.#tempFilePath, this.#storageFilePath);
  }

  /**
   * Rehydrates profiles from disk on startup
   */
  static rehydrate() {
    try {
      this.#ensureDir();
      if (!fs.existsSync(this.#storageFilePath)) {
        this.#isInitialized = true;
        return false;
      }

      const raw = fs.readFileSync(this.#storageFilePath, "utf-8");
      if (!raw || !raw.trim()) {
        this.#isInitialized = true;
        return false;
      }

      const parsed = JSON.parse(raw);
      this.#profilesByStudentId.clear();

      if (Array.isArray(parsed.profiles)) {
        for (const profile of parsed.profiles) {
          if (profile && profile.studentId) {
            this.#profilesByStudentId.set(profile.studentId, profile);
          }
        }
      }

      this.#isInitialized = true;
      return true;
    } catch {
      this.#isInitialized = true;
      return false;
    }
  }

  static #ensureInitialized() {
    if (!this.#isInitialized) {
      this.rehydrate();
    }
  }

  /**
   * Saves or updates a Student Profile 360 aggregate
   * @param {object} profileInput 
   * @returns {object}
   */
  static saveProfile(profileInput) {
    this.#ensureInitialized();
    if (!profileInput || !profileInput.studentId) {
      throw new Error("[PROFILE_STORE_ERROR] Valid profile with studentId is required");
    }

    const validated = StudentProfile360Model.createProfile(profileInput);
    const existing = this.#profilesByStudentId.get(validated.studentId);

    const currentRevision = (existing?.profileRevision || 0);
    const incomingRevision = validated.profileRevision !== undefined ? validated.profileRevision : (currentRevision + 1);

    if (existing && validated.profileRevision !== undefined && validated.profileRevision < currentRevision) {
      throw new Error(`[STALE_PROFILE_REVISION] Cannot overwrite profile for ${validated.studentId} (current revision: ${currentRevision}, incoming: ${validated.profileRevision})`);
    }

    const mutableCopy = this.#clone(validated);
    mutableCopy.profileRevision = incomingRevision;
    mutableCopy.updatedAt = new Date().toISOString();

    this.#profilesByStudentId.set(mutableCopy.studentId, mutableCopy);
    this.flushToDisk();
    return this.#clone(mutableCopy);
  }

  /**
   * Retrieves a Profile 360 aggregate by studentId
   * @param {string} studentId 
   * @returns {object|null}
   */
  static getProfileByStudentId(studentId) {
    this.#ensureInitialized();
    if (!studentId) return null;
    const profile = this.#profilesByStudentId.get(String(studentId).trim());
    return profile ? this.#clone(profile) : null;
  }

  /**
   * Gets all Profile 360 aggregates
   * @returns {Array}
   */
  static getAllProfiles() {
    this.#ensureInitialized();
    return Array.from(this.#profilesByStudentId.values()).map(p => this.#clone(p));
  }

  /**
   * Resets profile store (clears both memory and disk file)
   */
  static resetStore() {
    this.#profilesByStudentId.clear();
    this.#isInitialized = true;

    try {
      if (fs.existsSync(this.#storageFilePath)) {
        fs.unlinkSync(this.#storageFilePath);
      }
    } catch {
      // ignore
    }
  }

  static clear() {
    this.resetStore();
  }
}
