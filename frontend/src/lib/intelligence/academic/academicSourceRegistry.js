/**
 * StudentHub AI — Canonical Academic Source Registry
 * 
 * Enforces Official Authority & Source Governance:
 * - Only verified official university domains (matching OFFICIAL_HCMUTE_ALLOWLIST) can hold TIER_1_OFFICIAL status.
 * - Manages canonical source identities, SLAs, crawl policies, and expected content types.
 */

import { OFFICIAL_HCMUTE_ALLOWLIST } from "../fraud/fraudRiskEngine.js";

export const ACADEMIC_SOURCE_TIERS = {
  TIER_1_OFFICIAL: { level: 1, label: "Official Primary University Portal", priority: 100, isOfficial: true },
  TIER_2_OFFICIAL_MIRROR: { level: 2, label: "Official Mirror / Faculty Subdomain", priority: 80, isOfficial: true },
  TIER_3_VERIFIED_INSTITUTIONAL: { level: 3, label: "Verified Institutional Partner", priority: 60, isOfficial: false },
  TIER_4_UNKNOWN: { level: 4, label: "Unverified External Source", priority: 20, isOfficial: false },
  TIER_5_UNTRUSTED: { level: 5, label: "Untrusted / Suspicious Origin", priority: 0, isOfficial: false }
};

export const ACADEMIC_CONTENT_TYPES = {
  HTML: "text/html",
  PDF: "application/pdf",
  JSON: "application/json",
  PLAIN: "text/plain"
};

export const ACADEMIC_FETCH_POLICIES = {
  CRITICAL: { pollFrequencyMinutes: 30, maxStalenessHours: 1, timeoutMs: 10000, retryLimit: 3 },
  STANDARD: { pollFrequencyMinutes: 120, maxStalenessHours: 6, timeoutMs: 15000, retryLimit: 2 },
  CURRICULUM: { pollFrequencyMinutes: 720, maxStalenessHours: 24, timeoutMs: 20000, retryLimit: 2 },
  REGULATION: { pollFrequencyMinutes: 1440, maxStalenessHours: 168, timeoutMs: 30000, retryLimit: 1 }
};

export const CANONICAL_HCMUTE_SOURCES = [
  {
    sourceId: "SRC_HCMUTE_PORTAL",
    name: "Cổng Thông Tin Chính Thức HCMUTE",
    canonicalUrl: "https://hcmute.edu.vn",
    hostname: "hcmute.edu.vn",
    sourceTier: "TIER_1_OFFICIAL",
    sourceType: "UNIVERSITY_PORTAL",
    fetchPolicy: "STANDARD",
    expectedContentType: ACADEMIC_CONTENT_TYPES.HTML,
    enabled: true,
    description: "Thông báo tổng thể, sự kiện, kế hoạch năm học của toàn trường."
  },
  {
    sourceId: "SRC_HCMUTE_DAOTAO",
    name: "Phòng Đào Tạo & Học Vụ HCMUTE",
    canonicalUrl: "https://daotao.hcmute.edu.vn",
    hostname: "daotao.hcmute.edu.vn",
    sourceTier: "TIER_1_OFFICIAL",
    sourceType: "ACADEMIC_PORTAL",
    fetchPolicy: "CRITICAL",
    expectedContentType: ACADEMIC_CONTENT_TYPES.HTML,
    enabled: true,
    description: "Quy chế đào tạo, kế hoạch đăng ký môn, lịch thi, cảnh báo học vụ, chuẩn đầu ra."
  },
  {
    sourceId: "SRC_HCMUTE_CTSV",
    name: "Phòng Công Tác Sinh Viên HCMUTE",
    canonicalUrl: "https://ctsv.hcmute.edu.vn",
    hostname: "ctsv.hcmute.edu.vn",
    sourceTier: "TIER_1_OFFICIAL",
    sourceType: "STUDENT_AFFAIRS_PORTAL",
    fetchPolicy: "STANDARD",
    expectedContentType: ACADEMIC_CONTENT_TYPES.HTML,
    enabled: true,
    description: "Học bổng, học phí, điểm rèn luyện, bảo hiểm y tế, hỗ trợ sinh viên."
  },
  {
    sourceId: "SRC_HCMUTE_FIT",
    name: "Khoa Công Nghệ Thông Tin (FIT)",
    canonicalUrl: "https://fit.hcmute.edu.vn",
    hostname: "fit.hcmute.edu.vn",
    sourceTier: "TIER_1_OFFICIAL",
    sourceType: "FACULTY_PORTAL",
    fetchPolicy: "CURRICULUM",
    expectedContentType: ACADEMIC_CONTENT_TYPES.HTML,
    enabled: true,
    description: "Khung chương trình đào tạo, môn học tiên quyết, đồ án tốt nghiệp khoa CNTT."
  }
];

export class AcademicSourceRegistry {
  static #customSources = new Map();

  /**
   * Validates if a hostname belongs to the approved HCMUTE allowlist
   * @param {string} hostname 
   * @returns {boolean}
   */
  static isOfficialAuthority(hostname) {
    if (!hostname || typeof hostname !== "string") return false;
    const cleanHost = hostname.toLowerCase().trim().replace(/\.+$/, "");
    return OFFICIAL_HCMUTE_ALLOWLIST.includes(cleanHost) || 
      (cleanHost.endsWith(".hcmute.edu.vn") && !cleanHost.includes("/") && !cleanHost.includes("@"));
  }

  /**
   * Registers or updates a source in the registry
   * @param {object} sourceDef 
   * @returns {object} Registered source
   */
  static registerSource(sourceDef) {
    if (!sourceDef || !sourceDef.sourceId || !sourceDef.canonicalUrl) {
      throw new Error("[SourceRegistry] Invalid source definition: sourceId and canonicalUrl are required.");
    }

    let parsedHostname = "";
    try {
      const parsed = new URL(sourceDef.canonicalUrl);
      parsedHostname = parsed.hostname.toLowerCase().replace(/\.+$/, "");
    } catch {
      throw new Error(`[SourceRegistry] Invalid URL syntax: ${sourceDef.canonicalUrl}`);
    }

    const isOfficial = this.isOfficialAuthority(parsedHostname);
    const assignedTier = isOfficial 
      ? (sourceDef.sourceTier || "TIER_1_OFFICIAL")
      : "TIER_4_UNKNOWN";

    const record = {
      sourceId: sourceDef.sourceId,
      name: sourceDef.name || sourceDef.sourceId,
      canonicalUrl: sourceDef.canonicalUrl,
      hostname: parsedHostname,
      sourceTier: assignedTier,
      sourceType: sourceDef.sourceType || "UNKNOWN",
      fetchPolicy: sourceDef.fetchPolicy || "STANDARD",
      expectedContentType: sourceDef.expectedContentType || ACADEMIC_CONTENT_TYPES.HTML,
      enabled: sourceDef.enabled !== false,
      description: sourceDef.description || "",
      isOfficialAuthority: isOfficial,
      registeredAt: new Date().toISOString()
    };

    this.#customSources.set(record.sourceId, record);
    return { ...record };
  }

  /**
   * Retrieves a source by ID
   * @param {string} sourceId 
   * @returns {object|null}
   */
  static getSource(sourceId) {
    if (this.#customSources.has(sourceId)) {
      return { ...this.#customSources.get(sourceId) };
    }
    const defaultSrc = CANONICAL_HCMUTE_SOURCES.find(s => s.sourceId === sourceId);
    return defaultSrc ? { ...defaultSrc, isOfficialAuthority: this.isOfficialAuthority(defaultSrc.hostname) } : null;
  }

  /**
   * Retrieves all active sources
   * @returns {object[]}
   */
  static getAllSources() {
    const list = [...CANONICAL_HCMUTE_SOURCES.map(s => ({
      ...s,
      isOfficialAuthority: this.isOfficialAuthority(s.hostname)
    }))];

    for (const [id, custom] of this.#customSources.entries()) {
      const idx = list.findIndex(s => s.sourceId === id);
      if (idx >= 0) {
        list[idx] = { ...custom };
      } else {
        list.push({ ...custom });
      }
    }

    return list;
  }

  /**
   * Clears custom registered sources (for test isolation)
   */
  static resetRegistry() {
    this.#customSources.clear();
  }
}
