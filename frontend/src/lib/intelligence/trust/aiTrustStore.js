/**
 * StudentHub AI — Durable AI Trust Evaluation Store V2
 * 
 * Provides crash-resilient in-memory indexing, persistence, trust blast radius calculation,
 * dependency tracking, and immutable audit retrieval for AI Trust Evaluations.
 */

import fs from "node:fs";
import path from "node:path";
import { AiTrustModel, EPISTEMIC_STATE } from "./aiTrustModel.js";

const DEFAULT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, "ai_trust_evaluations.json");

export class AiTrustStore {
  static #storageFilePath = DEFAULT_STORE_FILE;
  static #evaluationsById = new Map();
  static #claimsById = new Map();
  static #evidenceById = new Map();
  static #corrections = [];
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
    this.#evidenceById.clear();
    this.#corrections = [];
    this.#seedDefaults();
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

  static #seedDefaults() {
    const defaultEval = AiTrustModel.createEpistemicEvaluation({
      evaluationId: "EVAL_TOEIC_K24_GOLD",
      query: "Quy định chuẩn đầu ra TOEIC của sinh viên K24 là bao nhiêu?",
      answerMode: "DIRECT_VERIFIED",
      epistemicState: EPISTEMIC_STATE.VERIFIED,
      claims: [
        {
          claimId: "CLAIM_TOEIC_K24",
          text: "Sinh viên khóa K24 cần đạt chứng chỉ TOEIC >= 550 hoặc tương đương để đủ điều kiện xét tốt nghiệp.",
          scope: "K24",
          epistemicState: EPISTEMIC_STATE.VERIFIED,
          numericValue: 550,
          citationIds: ["EVID_QĐ_3116_2025"]
        }
      ],
      evidenceSpans: [
        {
          evidenceId: "EVID_QĐ_3116_2025",
          sourceId: "SRC_HCMUTE_REGISTRAR",
          documentId: "QĐ_3116_QD_DHPKT_2025",
          passage: "Chuẩn ngoại ngữ đầu ra áp dụng cho sinh viên trình độ đại học chính quy từ khóa 2024 (K24) trở đi là TOEIC 550 điểm.",
          authorityTier: 100,
          validFrom: "2025-08-22"
        }
      ]
    });

    this.#evaluationsById.set(defaultEval.evaluationId, defaultEval);
    if (Array.isArray(defaultEval.claims)) {
      for (const cl of defaultEval.claims) {
        this.#claimsById.set(cl.claimId, cl);
      }
    }
    if (Array.isArray(defaultEval.evidenceSpans)) {
      for (const ev of defaultEval.evidenceSpans) {
        this.#evidenceById.set(ev.evidenceId, ev);
      }
    }
  }

  static flushToDisk() {
    try {
      this.#ensureStorageDir();
      const payload = {
        version: "2.0",
        timestamp: new Date().toISOString(),
        evaluations: Array.from(this.#evaluationsById.values()),
        corrections: this.#corrections
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
        this.#evaluationsById.clear();
        this.#claimsById.clear();
        this.#evidenceById.clear();
        this.#corrections = [];
        this.#seedDefaults();
        this.#isHydrated = true;
        return false;
      }
      const raw = fs.readFileSync(this.#storageFilePath, "utf-8");
      if (!raw || !raw.trim()) {
        this.#evaluationsById.clear();
        this.#seedDefaults();
        this.#isHydrated = true;
        return false;
      }
      const parsed = JSON.parse(raw);
      this.#evaluationsById.clear();
      this.#claimsById.clear();
      this.#evidenceById.clear();
      this.#corrections = Array.isArray(parsed.corrections) ? parsed.corrections : [];

      if (Array.isArray(parsed.evaluations)) {
        for (const item of parsed.evaluations) {
          if (item && item.evaluationId) {
            this.#evaluationsById.set(item.evaluationId, item);
            if (Array.isArray(item.claims)) {
              for (const cl of item.claims) {
                if (cl && cl.claimId) this.#claimsById.set(cl.claimId, cl);
              }
            }
            if (Array.isArray(item.evidenceSpans)) {
              for (const ev of item.evidenceSpans) {
                if (ev && ev.evidenceId) this.#evidenceById.set(ev.evidenceId, ev);
              }
            }
          }
        }
      }
      if (this.#evaluationsById.size === 0) {
        this.#seedDefaults();
      }
      this.#isHydrated = true;
      return true;
    } catch {
      this.#evaluationsById.clear();
      this.#seedDefaults();
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

    this.#evaluationsById.set(evaluation.evaluationId, evaluation);

    if (Array.isArray(evaluation.claims)) {
      for (const cl of evaluation.claims) {
        if (cl && cl.claimId) {
          this.#claimsById.set(cl.claimId, cl);
        }
      }
    }
    if (Array.isArray(evaluation.evidenceSpans)) {
      for (const ev of evaluation.evidenceSpans) {
        if (ev && ev.evidenceId) {
          this.#evidenceById.set(ev.evidenceId, ev);
        }
      }
    }

    this.flushToDisk();
    return evaluation;
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

  static getEvidence(evidenceId) {
    this.#ensureHydrated();
    if (!evidenceId) return null;
    return this.#evidenceById.get(String(evidenceId).trim()) || null;
  }

  static getAllEvaluations() {
    this.#ensureHydrated();
    return Array.from(this.#evaluationsById.values());
  }

  /**
   * Computes the trust blast radius when an upstream source or document is invalidated
   */
  static computeBlastRadius(invalidatedSourceOrDocId) {
    this.#ensureHydrated();
    const affectedEvaluations = [];
    const targetId = String(invalidatedSourceOrDocId || "").toLowerCase();

    for (const evaluation of this.#evaluationsById.values()) {
      const usesSource = (evaluation.evidenceSpans || []).some(
        e => (e.sourceId && e.sourceId.toLowerCase().includes(targetId)) ||
             (e.documentId && e.documentId.toLowerCase().includes(targetId))
      );
      if (usesSource) {
        affectedEvaluations.push({
          evaluationId: evaluation.evaluationId,
          query: evaluation.query,
          currentStatus: evaluation.epistemicState || evaluation.trustStatus,
          actionRequired: "NEEDS_REEVALUATION"
        });
      }
    }

    return {
      invalidatedEntity: invalidatedSourceOrDocId,
      affectedCount: affectedEvaluations.length,
      affectedEvaluations
    };
  }

  /**
   * Records a formal user-facing Trust Correction Event
   */
  static recordCorrection(correctionData = {}) {
    this.#ensureHydrated();
    const correction = {
      correctionId: `CORR_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      previousEvaluationId: correctionData.previousEvaluationId,
      reason: correctionData.reason || "Cập nhật theo văn bản ban hành mới nhất.",
      oldAnswer: correctionData.oldAnswer,
      correctedAnswer: correctionData.correctedAnswer,
      newEvidenceIds: correctionData.newEvidenceIds || []
    };
    this.#corrections.push(correction);
    this.flushToDisk();
    return correction;
  }

  static getAllCorrections() {
    this.#ensureHydrated();
    return [...this.#corrections];
  }
}
