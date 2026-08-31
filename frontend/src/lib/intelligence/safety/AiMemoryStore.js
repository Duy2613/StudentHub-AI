/**
 * StudentHub AI — Durable AI Memory Store
 * 
 * Provides crash-safe atomic persistence for approved AI memories and candidate memories.
 * Segregated strictly by subjectId to eliminate cross-tenant leakage.
 * File storage: .data/ai_memory_store.json
 */

import fs from "node:fs";
import path from "node:path";
import { createSecureId } from "../../security/secureId.js";

const DEFAULT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, "ai_memory_store.json");

export class AiMemoryStore {
  static #storageFilePath = DEFAULT_STORE_FILE;
  static #memoriesBySubject = new Map(); // subjectId -> { approvedMemories: [], candidateMemories: [] }
  static #isHydrated = false;

  static setStoragePath(customPath) {
    if (customPath) {
      this.#storageFilePath = customPath;
      this.rehydrate();
    }
  }

  static clear() {
    this.#memoriesBySubject.clear();
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
      this.#memoriesBySubject.clear();
      this.#isHydrated = true;
      return;
    }

    try {
      const raw = fs.readFileSync(this.#storageFilePath, "utf8");
      const data = JSON.parse(raw);
      this.#memoriesBySubject.clear();

      if (data && typeof data === "object" && data.memories) {
        for (const [subjectId, record] of Object.entries(data.memories)) {
          this.#memoriesBySubject.set(subjectId, {
            approvedMemories: Array.isArray(record.approvedMemories) ? record.approvedMemories : [],
            candidateMemories: Array.isArray(record.candidateMemories) ? record.candidateMemories : []
          });
        }
      }
      this.#isHydrated = true;
    } catch {
      this.#memoriesBySubject.clear();
      this.#isHydrated = true;
    }
  }

  static persist() {
    this.#ensureStorageDir();
    const memoriesObj = {};
    for (const [subj, record] of this.#memoriesBySubject.entries()) {
      memoriesObj[subj] = record;
    }

    const payload = {
      version: "1.0.0",
      updatedAt: new Date().toISOString(),
      memories: memoriesObj
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

  static getMemoryRecord(subjectId) {
    if (!this.#isHydrated) this.rehydrate();
    if (!this.#memoriesBySubject.has(subjectId)) {
      this.#memoriesBySubject.set(subjectId, { approvedMemories: [], candidateMemories: [] });
    }
    return this.#memoriesBySubject.get(subjectId);
  }

  static saveMemoryRecord(subjectId, record) {
    if (!this.#isHydrated) this.rehydrate();
    this.#memoriesBySubject.set(subjectId, record);
    this.persist();
    return record;
  }
}
