/**
 * StudentHub AI — Durable Expert Intelligence Store V1
 * 
 * Provides persistent storage and indexing for Expert Profiles, Scope Graphs,
 * Credentials, and Expert Claims.
 */

import fs from "node:fs";
import path from "node:path";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  AFFILIATION_STATUS,
  JURISDICTION_TYPE
} from "./expertIntelligenceModel.js";

const DEFAULT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, "expert_intelligence_store.json");

export class ExpertStore {
  static #storageFilePath = DEFAULT_STORE_FILE;
  static #expertsById = new Map();
  static #claimsById = new Map();
  static #isHydrated = false;

  static setStoragePath(customPath) {
    if (customPath) {
      this.#storageFilePath = customPath;
      this.rehydrate();
    }
  }

  static clear() {
    this.#expertsById.clear();
    this.#claimsById.clear();
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
    const expertA = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_DR_MINH_AI",
      name: "TS. Nguyễn Văn Minh",
      title: "Trưởng Bộ Môn Trí Tuệ Nhân Tạo",
      institution: "HCMUTE",
      department: "Khoa CNTT",
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_ACTIVE,
      scopes: [
        { domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.TECHNICAL_DOMAIN },
        { domain: "COMPUTER_VISION", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.TECHNICAL_DOMAIN },
        { domain: "EDTECH", level: EXPERTISE_LEVEL.MODERATE, jurisdiction: JURISDICTION_TYPE.PEDAGOGICAL },
        { domain: "TUITION_POLICY", level: EXPERTISE_LEVEL.NOT_ESTABLISHED, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN }
      ],
      credentials: [
        { type: "DEGREE_PHD", field: "Artificial Intelligence", issuer: "KAIST", issuedYear: 2018 }
      ],
      publications: [
        { title: "Deep Learning for Vietnamese NLP", venue: "IEEE Access", year: 2023, domain: "AI_ML" }
      ],
      hasRegistrarAuthority: false,
      reputationScore: 92
    });

    const expertB = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_PROF_HOANG_REGISTRAR",
      name: "PGS.TS. Trần Quốc Hoàng",
      title: "Trưởng Phòng Đào Tạo",
      institution: "HCMUTE",
      department: "Phòng Đào Tạo",
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_ACTIVE,
      scopes: [
        { domain: "ACADEMIC_REGULATION", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN },
        { domain: "TUITION_POLICY", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN }
      ],
      credentials: [
        { type: "DEGREE_PHD", field: "Higher Education Management", issuer: "ĐHQG-HCM", issuedYear: 2012 }
      ],
      administrativeRoles: ["REGISTRAR_DIRECTOR"],
      hasRegistrarAuthority: true,
      reputationScore: 98
    });

    this.#expertsById.set(expertA.expertId, expertA);
    this.#expertsById.set(expertB.expertId, expertB);
  }

  static flushToDisk() {
    try {
      this.#ensureStorageDir();
      const payload = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        experts: Array.from(this.#expertsById.values()),
        claims: Array.from(this.#claimsById.values())
      };
      const serialized = JSON.stringify(payload, null, 2);
      const tempPath = `${this.#storageFilePath}.tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      fs.writeFileSync(tempPath, serialized, "utf-8");
      fs.renameSync(tempPath, this.#storageFilePath);
    } catch {
      // fallback
    }
  }

  static rehydrate() {
    try {
      if (!fs.existsSync(this.#storageFilePath)) {
        this.#expertsById.clear();
        this.#claimsById.clear();
        this.#seedDefaults();
        this.#isHydrated = true;
        return false;
      }
      const raw = fs.readFileSync(this.#storageFilePath, "utf-8");
      if (!raw || !raw.trim()) {
        this.#expertsById.clear();
        this.#claimsById.clear();
        this.#seedDefaults();
        this.#isHydrated = true;
        return false;
      }
      const parsed = JSON.parse(raw);
      this.#expertsById.clear();
      this.#claimsById.clear();

      if (Array.isArray(parsed.experts)) {
        for (const item of parsed.experts) {
          if (item && item.expertId) {
            this.#expertsById.set(item.expertId, item);
          }
        }
      }
      if (Array.isArray(parsed.claims)) {
        for (const cl of parsed.claims) {
          if (cl && cl.claimId) {
            this.#claimsById.set(cl.claimId, cl);
          }
        }
      }
      if (this.#expertsById.size === 0) {
        this.#seedDefaults();
      }
      this.#isHydrated = true;
      return true;
    } catch {
      this.#expertsById.clear();
      this.#claimsById.clear();
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

  static saveExpert(expert) {
    this.#ensureHydrated();
    if (!expert || !expert.expertId) {
      throw new Error("[EXPERT_STORE] Valid expert with expertId is required.");
    }
    const validated = ExpertIntelligenceModel.createExpert(expert);
    this.#expertsById.set(validated.expertId, validated);
    this.flushToDisk();
    return validated;
  }

  static getExpert(expertId) {
    this.#ensureHydrated();
    if (!expertId) return null;
    return this.#expertsById.get(String(expertId).trim()) || null;
  }

  static getAllExperts() {
    this.#ensureHydrated();
    return Array.from(this.#expertsById.values());
  }

  static saveClaim(claim) {
    this.#ensureHydrated();
    if (!claim || !claim.claimId) {
      throw new Error("[EXPERT_STORE] Valid claim with claimId is required.");
    }
    const validated = ExpertIntelligenceModel.createExpertClaim(claim);
    this.#claimsById.set(validated.claimId, validated);
    this.flushToDisk();
    return validated;
  }

  static getClaim(claimId) {
    this.#ensureHydrated();
    if (!claimId) return null;
    return this.#claimsById.get(String(claimId).trim()) || null;
  }
}
