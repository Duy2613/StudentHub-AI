/**
 * StudentHub AI — Canonical Durable Student Digital Twin Store
 * 
 * Provides crash-resilient persistence, rehydration, and boundary isolation
 * for Authoritative Student Academic Digital Twins.
 */

import fs from "node:fs";
import path from "node:path";
import { StudentDigitalTwinModel } from "./studentDigitalTwinModel.js";
import { createSecureId } from "../../security/secureId.js";

const DEFAULT_TWIN_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_TWIN_STORE_FILE = path.join(DEFAULT_TWIN_STORE_DIR, "student_digital_twins.json");

export class StudentDigitalTwinStore {
  static #storageFilePath = DEFAULT_TWIN_STORE_FILE;
  static #isInitialized = false;
  static #twinsByStudentId = new Map();

  /**
   * Configures a custom storage file path (useful for test isolation)
   * @param {string} customPath 
   */
  static setStoragePath(customPath) {
    if (customPath) {
      this.#storageFilePath = customPath;
      this.rehydrate();
    }
  }

  /**
   * Deep clone helper to eliminate shared memory mutation leaks
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
   * Ensures storage directory exists
   */
  static #ensureStorageDir() {
    const dir = path.dirname(this.#storageFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Flushes in-memory digital twins to durable disk with atomic rename strategy
   */
  static flushToDisk() {
    try {
      this.#ensureStorageDir();
      const payload = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        twins: Array.from(this.#twinsByStudentId.values())
      };

      const serialized = JSON.stringify(payload, null, 2);
      const tempPath = `${this.#storageFilePath}.tmp_${createSecureId("tmp")}`;

      fs.writeFileSync(tempPath, serialized, "utf-8");
      fs.renameSync(tempPath, this.#storageFilePath);
    } catch {
      // In constrained environments fallback to memory
    }
  }

  /**
   * Rehydrates all digital twins from durable disk storage
   */
  static rehydrate() {
    try {
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
      this.#twinsByStudentId.clear();

      if (Array.isArray(parsed.twins)) {
        for (const twin of parsed.twins) {
          if (twin && twin.studentId) {
            this.#twinsByStudentId.set(twin.studentId, twin);
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

  /**
   * Ensures store is initialized
   */
  static #ensureInitialized() {
    if (!this.#isInitialized) {
      this.rehydrate();
    }
  }

  /**
   * Saves or updates a Student Digital Twin
   * @param {object} twin 
   * @returns {object}
   */
  static saveTwin(twin) {
    this.#ensureInitialized();
    if (!twin || !twin.studentId) {
      throw new Error("[TWIN_STORE_ERROR] Valid digital twin with studentId is required");
    }

    const validated = StudentDigitalTwinModel.createDigitalTwin(twin);
    const existing = this.#twinsByStudentId.get(validated.studentId);

    // Optimistic concurrency / revision check
    const currentRevision = (existing?.revision || 0);
    const incomingRevision = validated.revision !== undefined ? validated.revision : (currentRevision + 1);

    if (existing && validated.revision !== undefined && validated.revision < currentRevision) {
      throw new Error(`[STALE_TWIN_REVISION] Cannot overwrite Digital Twin for ${validated.studentId} (current revision: ${currentRevision}, incoming revision: ${validated.revision})`);
    }

    const mutableCopy = this.#clone(validated);
    mutableCopy.revision = incomingRevision;
    mutableCopy.asOf = new Date().toISOString();

    this.#twinsByStudentId.set(mutableCopy.studentId, mutableCopy);
    this.flushToDisk();
    return this.#clone(mutableCopy);
  }

  /**
   * Gets a Student Digital Twin by studentId
   * @param {string} studentId 
   * @returns {object|null}
   */
  static getTwin(studentId) {
    this.#ensureInitialized();
    if (!studentId) return null;
    const twin = this.#twinsByStudentId.get(String(studentId).trim());
    return twin ? this.#clone(twin) : null;
  }

  /**
   * Gets all Student Digital Twins
   * @returns {Array}
   */
  static getAllTwins() {
    this.#ensureInitialized();
    return Array.from(this.#twinsByStudentId.values()).map(t => this.#clone(t));
  }

  /**
   * Resets digital twin store (cleans both memory and disk file)
   */
  static resetStore() {
    this.#twinsByStudentId.clear();
    this.#isInitialized = true;

    try {
      if (fs.existsSync(this.#storageFilePath)) {
        fs.unlinkSync(this.#storageFilePath);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Alias for resetStore
   */
  static clear() {
    this.resetStore();
  }
}
