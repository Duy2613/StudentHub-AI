/**
 * StudentHub AI — Durable Early Warning Store
 * 
 * Provides crash-safe atomic persistence for emerging operational warnings and incidents.
 * File storage: .data/early_warnings_store.json
 */

import fs from "node:fs";
import path from "node:path";
import { createSecureId } from "../../security/secureId.js";

const DEFAULT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, "early_warnings_store.json");

export class EarlyWarningStore {
  static #storageFilePath = DEFAULT_STORE_FILE;
  static #warningsByKey = new Map(); // warningKey -> WarningObject
  static #isHydrated = false;

  static setStoragePath(customPath) {
    if (customPath) {
      this.#storageFilePath = customPath;
      this.rehydrate();
    }
  }

  static clear() {
    this.#warningsByKey.clear();
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
      this.#warningsByKey.clear();
      this.#isHydrated = true;
      return;
    }

    try {
      const raw = fs.readFileSync(this.#storageFilePath, "utf8");
      const data = JSON.parse(raw);
      this.#warningsByKey.clear();

      if (data && typeof data === "object" && data.warnings) {
        for (const [key, warning] of Object.entries(data.warnings)) {
          this.#warningsByKey.set(key, warning);
        }
      }
      this.#isHydrated = true;
    } catch {
      this.#warningsByKey.clear();
      this.#isHydrated = true;
    }
  }

  static persist() {
    this.#ensureStorageDir();
    const warningsObj = {};
    for (const [key, warning] of this.#warningsByKey.entries()) {
      warningsObj[key] = warning;
    }

    const payload = {
      version: "1.0.0",
      updatedAt: new Date().toISOString(),
      warnings: warningsObj
    };

    const tempFile = `${this.#storageFilePath}.tmp_${createSecureId("tmp")}`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), "utf8");
      try {
        fs.renameSync(tempFile, this.#storageFilePath);
      } catch {
        fs.copyFileSync(tempFile, this.#storageFilePath);
        try { fs.unlinkSync(tempFile); } catch {}
      }
    } catch {
      try {
        fs.writeFileSync(this.#storageFilePath, JSON.stringify(payload, null, 2), "utf8");
      } catch {}
    }
  }

  static getWarning(warningKey) {
    if (!this.#isHydrated) this.rehydrate();
    return this.#warningsByKey.get(warningKey) || null;
  }

  static getAllWarnings() {
    if (!this.#isHydrated) this.rehydrate();
    return Array.from(this.#warningsByKey.values());
  }

  static saveWarning(warningKey, warning) {
    if (!this.#isHydrated) this.rehydrate();
    this.#warningsByKey.set(warningKey, warning);
    this.persist();
    return warning;
  }

  static deleteWarning(warningKey) {
    if (!this.#isHydrated) this.rehydrate();
    const deleted = this.#warningsByKey.delete(warningKey);
    if (deleted) this.persist();
    return deleted;
  }
}
