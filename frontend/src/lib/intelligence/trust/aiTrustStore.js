/**
 * StudentHub AI — Durable AI Trust Evaluation Store V1
 * 
 * Provides crash-resilient in-memory indexing, persistence, and audit retrieval
 * for AI Trust Evaluations and Claim Graph snapshots.
 */

import fs from "node:fs";
import path from "node:path";
import { AiTrustModel } from "./aiTrustModel.js";

const DEFAULT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, "ai_trust_evaluations.json");

export class AiTrustStore {
  static #storageFilePath = DEFAULT_STORE_FILE;
  static #evaluationsById = new Map();
  static #claimsById = new Map();
  static #isHydrated = false;

  static setStoragePath(customPath) {
    if (customPath) {
      this.#storageFilePath = customPath;
      this.rehydrate();
    }
  }

  static clear() {
    this.#evaluationsById.clear();
    this.#claimsById.clear();
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

  static flushToDisk() {
    try {
      this.#ensureStorageDir();
      const payload = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        evaluations: Array.from(this.#evaluationsById.values())
      };
      const serialized = JSON.stringify(payload, null, 2);
      const tempPath = `${this.#storageFilePath}.tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      fs.writeFileSync(tempPath, serialized, "utf-8");
      fs.renameSync(tempPath, this.#storageFilePath);
    } catch {
      // Fallback
    }
  }

  static rehydrate() {
    try {
      if (!fs.existsSync(this.#storageFilePath)) {
        this.#isHydrated = true;
        return false;
      }
      const raw = fs.readFileSync(this.#storageFilePath, "utf-8");
      if (!raw || !raw.trim()) {
        this.#isHydrated = true;
        return false;
      }
      const parsed = JSON.parse(raw);
      this.#evaluationsById.clear();
      this.#claimsById.clear();

      if (Array.isArray(parsed.evaluations)) {
        for (const item of parsed.evaluations) {
          if (item && item.evaluationId) {
            this.#evaluationsById.set(item.evaluationId, item);
            if (Array.isArray(item.claims)) {
              for (const cl of item.claims) {
                if (cl && cl.claimId) {
                  this.#claimsById.set(cl.claimId, cl);
                }
              }
            }
          }
        }
      }
      this.#isHydrated = true;
      return true;
    } catch {
      this.#isHydrated = true;
      return false;
    }
  }

  static #ensureHydrated() {
    if (!this.#isHydrated) {
      this.rehydrate();
    }
  }

  static saveEvaluation(evaluation) {
    this.#ensureHydrated();
    if (!evaluation || !evaluation.evaluationId) {
      throw new Error("[AI_TRUST_STORE] Valid evaluation with evaluationId is required.");
    }

    const validated = AiTrustModel.createTrustEvaluation(evaluation);
    this.#evaluationsById.set(validated.evaluationId, validated);

    if (Array.isArray(validated.claims)) {
      for (const cl of validated.claims) {
        if (cl && cl.claimId) {
          this.#claimsById.set(cl.claimId, cl);
        }
      }
    }

    this.flushToDisk();
    return validated;
  }

  static getEvaluation(evaluationId) {
    this.#ensureHydrated();
    if (!evaluationId) return null;
    return this.#evaluationsById.get(String(evaluationId).trim()) || null;
  }

  static getClaim(claimId) {
    this.#ensureHydrated();
    if (!claimId) return null;
    return this.#claimsById.get(String(claimId).trim()) || null;
  }

  static getAllEvaluations() {
    this.#ensureHydrated();
    return Array.from(this.#evaluationsById.values());
  }
}
