/**
 * StudentHub AI — Durable Expert Intelligence Store V2
 * 
 * Provides persistent storage, indexing, multi-signal lookup, temporal role filtering,
 * claim version tracking (V1 -> V2), retraction cascade propagation, and privacy redaction.
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
  CLAIM_STATUS,
  EXPERT_STATUS
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
      status: EXPERT_STATUS.VERIFIED_EXPERT,
      orcid: "0000-0002-1825-0097",
      verifiedEmail: "minhnv@hcmute.edu.vn",
      directoryUrl: "https://fit.hcmute.edu.vn/faculty/minhnv",
      privateContact: null,
      scopes: [
        { domain: "AI_ML", subdomain: "Deep Learning & NLP", level: EXPERTISE_LEVEL.ESTABLISHED, jurisdiction: JURISDICTION_TYPE.TECHNICAL_DOMAIN, citationCount: 450, recencyYear: 2024 },
        { domain: "COMPUTER_VISION", subdomain: "Edge Vision", level: EXPERTISE_LEVEL.ESTABLISHED, jurisdiction: JURISDICTION_TYPE.TECHNICAL_DOMAIN, citationCount: 220, recencyYear: 2023 },
        { domain: "EDTECH", subdomain: "Interactive Learning", level: EXPERTISE_LEVEL.SUPPORTED, jurisdiction: JURISDICTION_TYPE.PEDAGOGICAL, citationCount: 35, recencyYear: 2022 },
        { domain: "TUITION_POLICY", subdomain: "HCMUTE Finance", level: EXPERTISE_LEVEL.OUT_OF_SCOPE, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN, citationCount: 0, recencyYear: 2020 }
      ],
      credentials: [
        { credentialId: "CRED_MINH_PHD", type: "DEGREE_PHD", field: "Artificial Intelligence", issuer: "KAIST", issuedYear: 2018, status: CREDENTIAL_STATUS.VERIFIED }
      ],
      roles: [
        { roleId: "ROLE_MINH_1", roleTitle: "HEAD_OF_AI_DEPT", organization: "HCMUTE", validFrom: "2021-01-01", validUntil: null }
      ],
      publications: [
        { pubId: "PUB_MINH_1", title: "Deep Learning for Vietnamese NLP", venue: "IEEE Access", year: 2023, domain: "AI_ML", doi: "10.1109/access.2023.01", provenanceClusterId: "CLUSTER_IEEE_NLP_2023" },
        { pubId: "PUB_MINH_2", title: "Vision Transformer for Autonomous Robotics", venue: "CVPR Workshop", year: 2024, domain: "COMPUTER_VISION", doi: "10.1109/cvpr.2024.02", provenanceClusterId: "CLUSTER_CVPR_2024" }
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
      status: EXPERT_STATUS.VERIFIED_EXPERT,
      orcid: "0000-0003-4912-8821",
      verifiedEmail: "hoangtq@hcmute.edu.vn",
      directoryUrl: "https://daotao.hcmute.edu.vn/former-directors/hoangtq",
      scopes: [
        { domain: "ACADEMIC_REGULATION", subdomain: "Credit Regulations 2020-2024", level: EXPERTISE_LEVEL.SUPPORTED, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN, citationCount: 15, recencyYear: 2024 },
        { domain: "HIGHER_ED_ADMIN", subdomain: "Quality Assurance", level: EXPERTISE_LEVEL.ESTABLISHED, jurisdiction: JURISDICTION_TYPE.PEDAGOGICAL, citationCount: 80, recencyYear: 2023 }
      ],
      credentials: [
        { credentialId: "CRED_HOANG_PHD", type: "DEGREE_PHD", field: "Educational Management", issuer: "ĐHQG TP.HCM", issuedYear: 2012, status: CREDENTIAL_STATUS.VERIFIED }
      ],
      roles: [
        { roleId: "ROLE_HOANG_FORMER", roleTitle: "REGISTRAR_DIRECTOR", organization: "HCMUTE", validFrom: "2020-01-01", validUntil: "2024-06-30" }
      ],
      publications: [
        { pubId: "PUB_HOANG_1", title: "Institutional Credit System Modeling in Vietnam", venue: "VNU Journal", year: 2021, domain: "HIGHER_ED_ADMIN", doi: "10.25073/vnu.2021.09" }
      ],
      hasRegistrarAuthority: false, // Expired role!
      reputationScore: 91
    });

    // 3. Dr. Lan - EdTech & Pedagogy Expert
    const expertLan = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_TS_LAN_EDTECH",
      name: "TS. Lê Thị Lan",
      title: "Phó Trưởng Khoa Sư Phạm Kỹ Thuật",
      institution: "HCMUTE",
      department: "Khoa Sư Phạm Kỹ Thuật",
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_ACTIVE,
      status: EXPERT_STATUS.VERIFIED_EXPERT,
      orcid: "0000-0001-9988-7766",
      verifiedEmail: "lanlt@hcmute.edu.vn",
      directoryUrl: "https://fe.hcmute.edu.vn/faculty/lanlt",
      scopes: [
        { domain: "EDTECH", subdomain: "Blended Learning & Pedagogical AI", level: EXPERTISE_LEVEL.ESTABLISHED, jurisdiction: JURISDICTION_TYPE.PEDAGOGICAL, citationCount: 190, recencyYear: 2024 }
      ],
      roles: [
        { roleId: "ROLE_LAN_1", roleTitle: "VICE_DEAN_PEDAGOGY", organization: "HCMUTE", validFrom: "2022-01-01", validUntil: null }
      ],
      publications: [
        { pubId: "PUB_LAN_1", title: "AI-assisted Pedagogy for Engineering Education", venue: "Springer EdTech", year: 2024, domain: "EDTECH", doi: "10.1007/edtech.2024.01", provenanceClusterId: "CLUSTER_EDTECH_2024" }
      ],
      hasRegistrarAuthority: false,
      reputationScore: 89
    });

    // 4. Dr. Duc - Robotics & Control (With Commercial Sponsorship / COI)
    const expertDuc = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_DR_DUC_ROBOTICS",
      name: "TS. Phạm Hữu Đức",
      title: "Giảng Viên Cơ Điện Tử & Robotics",
      institution: "HCMUTE",
      department: "Khoa Cơ Khí Chế Tạo Máy",
      affiliationStatus: AFFILIATION_STATUS.VERIFIED_ACTIVE,
      status: EXPERT_STATUS.VERIFIED_EXPERT,
      orcid: "0000-0002-3344-5566",
      verifiedEmail: "ducph@hcmute.edu.vn",
      scopes: [
        { domain: "ROBOTICS", subdomain: "Autonomous Mobile Robots", level: EXPERTISE_LEVEL.ESTABLISHED, jurisdiction: JURISDICTION_TYPE.TECHNICAL_DOMAIN, citationCount: 310, recencyYear: 2024 }
      ],
      conflicts: [
        { conflictId: "COI_DUC_1", entity: "TechBot Industrial Automation Ltd.", nature: "COMMERCIAL_SPONSORSHIP", domain: "ROBOTICS", isActive: true }
      ],
      roles: [
        { roleId: "ROLE_DUC_1", roleTitle: "LECTURER", organization: "HCMUTE", validFrom: "2019-01-01", validUntil: null }
      ],
      publications: [
        { pubId: "PUB_DUC_1", title: "Kinematics Control of Autonomous Mobile Robots", venue: "IEEE Transactions on Industrial Electronics", year: 2023, domain: "ROBOTICS", doi: "10.1109/tie.2023.01" }
      ],
      hasRegistrarAuthority: false,
      reputationScore: 88
    });

    // 5. Unverified / Impersonator Profile (For Anti-Impersonation Testing)
    const expertFake = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_FAKE_CLONE",
      name: "GS. Bịa Đặt Nguyễn",
      title: "Viện Trưởng Ảo",
      institution: "Đại Học Ảo",
      department: "Không xác định",
      affiliationStatus: AFFILIATION_STATUS.UNVERIFIED,
      status: EXPERT_STATUS.UNVERIFIED_EXPERT,
      orcid: null,
      verifiedEmail: null,
      directoryUrl: "https://fake-university-scam.com/profile",
      scopes: [
        { domain: "AI_ML", subdomain: "Superintelligence", level: EXPERTISE_LEVEL.OUT_OF_SCOPE, jurisdiction: JURISDICTION_TYPE.TECHNICAL_DOMAIN, citationCount: 0 }
      ],
      hasRegistrarAuthority: false,
      isVerified: false,
      reputationScore: 10
    });

    this.#expertsById.set(expertMinh.expertId, expertMinh);
    this.#expertsById.set(expertHoang.expertId, expertHoang);
    this.#expertsById.set(expertLan.expertId, expertLan);
    this.#expertsById.set(expertDuc.expertId, expertDuc);
    this.#expertsById.set(expertFake.expertId, expertFake);

    // Default seed claims
    const claim1 = ExpertIntelligenceModel.createExpertClaim({
      claimId: "CLM_MINH_TRANSFORMER",
      expertId: expertMinh.expertId,
      statement: "Kiến trúc Transformer với bộ Tokenizer tối ưu cho tiếng Việt tăng độ chính xác phân loại 12% so với RNN truyền thống.",
      claimType: CLAIM_TYPE.RESEARCH_CLAIM,
      domain: "AI_ML",
      scope: "Vietnamese NLP Architecture",
      status: CLAIM_STATUS.SUPPORTED,
      citedPublicationDoi: "10.1109/access.2023.01",
      evidenceRefs: ["PUB_MINH_1"]
    });

    const claim2 = ExpertIntelligenceModel.createExpertClaim({
      claimId: "CLM_MINH_TUITION_OPINION",
      expertId: expertMinh.expertId,
      statement: "Năm 2026 trường sẽ miễn toàn bộ học phí cho sinh viên ngành AI.",
      claimType: CLAIM_TYPE.OFFICIAL_POLICY_CLAIM,
      domain: "TUITION_POLICY",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN,
      scope: "HCMUTE Tuition Waiver",
      status: CLAIM_STATUS.SUPPORTED
    });

    this.#claimsById.set(claim1.claimId, claim1);
    this.#claimsById.set(claim2.claimId, claim2);
  }

  static rehydrate() {
    this.#ensureStorageDir();
    if (!fs.existsSync(this.#storageFilePath)) {
      this.clear();
      this.persist();
      return;
    }

    try {
      const raw = fs.readFileSync(this.#storageFilePath, "utf8");
      const data = JSON.parse(raw);
      this.#expertsById.clear();
      this.#claimsById.clear();

      if (Array.isArray(data.experts)) {
        for (const exp of data.experts) {
          const expertObj = ExpertIntelligenceModel.createExpert(exp);
          this.#expertsById.set(expertObj.expertId, expertObj);
        }
      }

      if (Array.isArray(data.claims)) {
        for (const clm of data.claims) {
          const claimObj = ExpertIntelligenceModel.createExpertClaim(clm);
          this.#claimsById.set(claimObj.claimId, claimObj);
        }
      }

      this.#isHydrated = true;
    } catch {
      this.clear();
      this.persist();
    }
  }

  static persist() {
    this.#ensureStorageDir();
    const data = {
      version: "2.0.0",
      updatedAt: new Date().toISOString(),
      experts: Array.from(this.#expertsById.values()),
      claims: Array.from(this.#claimsById.values())
    };

    try {
      fs.writeFileSync(this.#storageFilePath, JSON.stringify(data, null, 2), "utf8");
    } catch {
      // ignore
    }
  }

  static getAllExperts({ redactPrivate = true } = {}) {
    if (!this.#isHydrated) this.rehydrate();
    const experts = Array.from(this.#expertsById.values());
    if (!redactPrivate) return experts;
    return experts.map(e => this.#redactPrivateContact(e));
  }

  static getExpert(expertId, { redactPrivate = true } = {}) {
    if (!this.#isHydrated) this.rehydrate();
    const expert = this.#expertsById.get(expertId);
    if (!expert) return null;
    return redactPrivate ? this.#redactPrivateContact(expert) : expert;
  }

  static upsertExpert(expertData = {}) {
    if (!this.#isHydrated) this.rehydrate();
    const expert = ExpertIntelligenceModel.createExpert(expertData);
    this.#expertsById.set(expert.expertId, expert);
    this.persist();
    return expert;
  }

  static deleteExpert(expertId) {
    if (!this.#isHydrated) this.rehydrate();
    const deleted = this.#expertsById.delete(expertId);
    if (deleted) this.persist();
    return deleted;
  }

  static getClaim(claimId) {
    if (!this.#isHydrated) this.rehydrate();
    return this.#claimsById.get(claimId) || null;
  }

  static getClaimsByExpert(expertId) {
    if (!this.#isHydrated) this.rehydrate();
    return Array.from(this.#claimsById.values()).filter(c => c.expertId === expertId);
  }

  static getAllClaims() {
    if (!this.#isHydrated) this.rehydrate();
    return Array.from(this.#claimsById.values());
  }

  static upsertClaim(claimData = {}) {
    if (!this.#isHydrated) this.rehydrate();
    const claim = ExpertIntelligenceModel.createExpertClaim(claimData);
    this.#claimsById.set(claim.claimId, claim);
    this.persist();
    return claim;
  }

  /**
   * Corrects an existing claim: creates V2 that supersedes V1
   */
  static correctClaim(oldClaimId, newStatement, reason = "") {
    if (!this.#isHydrated) this.rehydrate();
    const oldClaim = this.#claimsById.get(oldClaimId);
    if (!oldClaim) return null;

    // Update old claim to CORRECTED
    const updatedOldClaim = ExpertIntelligenceModel.createExpertClaim({
      ...oldClaim,
      status: CLAIM_STATUS.CORRECTED,
      correctionReason: reason
    });
    this.#claimsById.set(oldClaimId, updatedOldClaim);

    // Create new V2 claim
    const newClaim = ExpertIntelligenceModel.createExpertClaim({
      ...oldClaim,
      claimId: `EXP_CLM_${Date.now()}_V2`,
      statement: newStatement,
      version: (oldClaim.version || 1) + 1,
      status: CLAIM_STATUS.SUPPORTED,
      supersedesClaimId: oldClaimId,
      correctionReason: reason,
      publishedAt: new Date().toISOString()
    });
    this.#claimsById.set(newClaim.claimId, newClaim);

    this.persist();
    return newClaim;
  }

  /**
   * Retracts a cited publication and cascades retraction to all dependent claims
   */
  static retractPublication(doi) {
    if (!this.#isHydrated) this.rehydrate();
    const normalizedDoi = String(doi).trim().toLowerCase();
    const affectedClaims = [];

    // Scan all claims that cite this DOI
    for (const [claimId, claim] of this.#claimsById.entries()) {
      if (claim.citedPublicationDoi && claim.citedPublicationDoi.toLowerCase() === normalizedDoi) {
        const retractedClaim = ExpertIntelligenceModel.createExpertClaim({
          ...claim,
          status: CLAIM_STATUS.NEEDS_REEVALUATION,
          isRetracted: true,
          correctionReason: `Công trình trích dẫn [DOI: ${doi}] đã bị thu hồi bởi tác giả/hội đồng chuyên môn.`
        });
        this.#claimsById.set(claimId, retractedClaim);
        affectedClaims.push(retractedClaim);
      }
    }

    this.persist();
    return affectedClaims;
  }

  static resolveIdentity(inputQuery = {}) {
    if (!this.#isHydrated) this.rehydrate();
    return ExpertEntityResolver.resolve(inputQuery, Array.from(this.#expertsById.values()));
  }

  static resolveEntity(inputQuery = {}) {
    return this.resolveIdentity(inputQuery);
  }

  static #redactPrivateContact(expert) {
    if (!expert) return null;
    const clone = { ...expert };
    if (clone.privateContact) {
      clone.privateContact = {
        hasPrivateContact: true,
        redactedNotice: "[BẢO VỆ DỮ LIỆU CÁ NHÂN] Thông tin liên hệ cá nhân được mã hóa và ẩn trên giao diện công khai."
      };
    }
    return Object.freeze(clone);
  }
}
