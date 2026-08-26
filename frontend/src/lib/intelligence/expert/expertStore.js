/**
 * StudentHub AI — Durable Expert Intelligence Store V1
 * 
 * Provides persistent storage, indexing, multi-signal lookup, and privacy
 * redaction for Expert Profiles, Scope Graphs, Credentials, and Claims.
 */

import fs from "node:fs";
import path from "node:path";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  AFFILIATION_STATUS,
  JURISDICTION_TYPE,
  CREDENTIAL_STATUS,
  CLAIM_TYPE,
  CLAIM_STATUS
} from "./expertIntelligenceModel.js";
import { ExpertEntityResolver } from "./expertEntityResolver.js";

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
    // 1. Dr. Minh - Verified AI Professor (Strong AI/ML, No Institutional Registrar Authority)
    const expertMinh = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_DR_MINH_AI",
      name: "TS. Nguyễn Văn Minh",
      title: "Trưởng Bộ Môn Trí Tuệ Nhân Tạo",
      institution: "HCMUTE",
      department: "Khoa CNTT",
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_ACTIVE,
      orcid: "0000-0002-1825-0097",
      verifiedEmail: "minhnv@hcmute.edu.vn",
      directoryUrl: "https://fit.hcmute.edu.vn/faculty/minhnv",
      privateContact: {
        personalPhone: "+84903123456",
        personalEmail: "minh.private@gmail.com",
        citizenId: "079088001234"
      },
      scopes: [
        { domain: "AI_ML", subdomain: "Deep Learning & NLP", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.TECHNICAL_DOMAIN, citationCount: 450 },
        { domain: "COMPUTER_VISION", subdomain: "Edge Vision", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.TECHNICAL_DOMAIN, citationCount: 220 },
        { domain: "EDTECH", subdomain: "Interactive Learning", level: EXPERTISE_LEVEL.MODERATE, jurisdiction: JURISDICTION_TYPE.PEDAGOGICAL, citationCount: 35 },
        { domain: "TUITION_POLICY", subdomain: "HCMUTE Finance", level: EXPERTISE_LEVEL.NOT_ESTABLISHED, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN, citationCount: 0 }
      ],
      credentials: [
        { credentialId: "CRED_MINH_PHD", type: "DEGREE_PHD", field: "Artificial Intelligence", issuer: "KAIST", issuedYear: 2018, status: CREDENTIAL_STATUS.VERIFIED }
      ],
      roles: [
        { roleId: "ROLE_MINH_1", roleTitle: "HEAD_OF_AI_DEPT", organization: "HCMUTE", validFrom: "2021-01-01", validUntil: null }
      ],
      publications: [
        { pubId: "PUB_MINH_1", title: "Deep Learning for Vietnamese NLP", venue: "IEEE Access", year: 2023, domain: "AI_ML", doi: "10.1109/access.2023.01" }
      ],
      hasRegistrarAuthority: false,
      reputationScore: 94
    });

    // 2. Prof. Hoang - Former Registrar Director (Expired in 2024 to test temporal validity)
    const expertHoang = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_PROF_HOANG_FORMER_REGISTRAR",
      name: "PGS.TS. Trần Quốc Hoàng",
      title: "Nguyên Trưởng Phòng Đào Tạo (Nhiệm kỳ 2020-2024)",
      institution: "HCMUTE",
      department: "Phòng Đào Tạo",
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_FORMER,
      orcid: "0000-0001-9988-7766",
      verifiedEmail: "hoangtq@hcmute.edu.vn",
      scopes: [
        { domain: "ACADEMIC_REGULATION", subdomain: "Quy Chế Đào Tạo Đại Học", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN, citationCount: 120 }
      ],
      credentials: [
        { credentialId: "CRED_HOANG_PHD", type: "DEGREE_PHD", field: "Higher Education Management", issuer: "ĐHQG-HCM", issuedYear: 2012, status: CREDENTIAL_STATUS.VERIFIED }
      ],
      roles: [
        { roleId: "ROLE_HOANG_FORMER", roleTitle: "REGISTRAR_DIRECTOR", organization: "HCMUTE", validFrom: "2020-01-01", validUntil: "2024-06-30" }
      ],
      hasRegistrarAuthority: false, // Expired role in 2026
      reputationScore: 90
    });

    // 3. Prof. Binh - Active Registrar Director (Current in 2026 with active authority)
    const expertBinh = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_PROF_BINH_ACTIVE_REGISTRAR",
      name: "PGS.TS. Lê Văn Bình",
      title: "Trưởng Phòng Đào Tạo Hiện Hành",
      institution: "HCMUTE",
      department: "Phòng Đào Tạo",
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_ACTIVE,
      orcid: "0000-0003-4455-6677",
      verifiedEmail: "binhlv@hcmute.edu.vn",
      scopes: [
        { domain: "ACADEMIC_REGULATION", subdomain: "Quy Chế Học Vụ HCMUTE", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN, citationCount: 210 }
      ],
      credentials: [
        { credentialId: "CRED_BINH_PHD", type: "DEGREE_PHD", field: "Educational Administration", issuer: "HCMUTE", issuedYear: 2015, status: CREDENTIAL_STATUS.VERIFIED }
      ],
      roles: [
        { roleId: "ROLE_BINH_CURRENT", roleTitle: "REGISTRAR_DIRECTOR", organization: "HCMUTE", validFrom: "2024-07-01", validUntil: "2029-06-30" }
      ],
      hasRegistrarAuthority: true,
      reputationScore: 98
    });

    this.#expertsById.set(expertMinh.expertId, expertMinh);
    this.#expertsById.set(expertHoang.expertId, expertHoang);
    this.#expertsById.set(expertBinh.expertId, expertBinh);

    // Seed sample claims
    const claim1 = ExpertIntelligenceModel.createExpertClaim({
      claimId: "CLAIM_MINH_01",
      expertId: expertMinh.expertId,
      text: "Các mô hình Transformer nén (DistilBERT/MobileBERT) phù hợp triển khai bài toán NLP trên thiết bị IoT.",
      domain: "AI_ML",
      claimType: CLAIM_TYPE.TECHNICAL_CLAIM,
      claimJurisdiction: JURISDICTION_TYPE.TECHNICAL_DOMAIN,
      status: CLAIM_STATUS.SUPPORTED,
      citedEvidenceIds: ["PUB_MINH_1"]
    });

    this.#claimsById.set(claim1.claimId, claim1);
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

  static getExpert(expertId, options = { redactPrivate: true }) {
    this.#ensureHydrated();
    if (!expertId) return null;
    const expert = this.#expertsById.get(String(expertId).trim()) || null;
    if (!expert) return null;
    return options.redactPrivate ? ExpertIntelligenceModel.redactForPublic(expert) : expert;
  }

  static getAllExperts(options = { redactPrivate: true, domainFilter: null }) {
    this.#ensureHydrated();
    let list = Array.from(this.#expertsById.values());
    if (options.domainFilter) {
      const targetDomain = options.domainFilter.toUpperCase();
      list = list.filter(exp => exp.scopes.some(s => s.domain === targetDomain));
    }
    return options.redactPrivate 
      ? list.map(exp => ExpertIntelligenceModel.redactForPublic(exp))
      : list;
  }

  static resolveEntity(query) {
    this.#ensureHydrated();
    const candidatePool = Array.from(this.#expertsById.values());
    return ExpertEntityResolver.resolve(query, candidatePool);
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

  static getClaimsByExpert(expertId) {
    this.#ensureHydrated();
    if (!expertId) return [];
    return Array.from(this.#claimsById.values()).filter(c => c.expertId === expertId);
  }
}
