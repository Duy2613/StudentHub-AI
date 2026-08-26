/**
 * StudentHub AI — Canonical Academic Data Provenance & Source-of-Truth Matrix V1
 * 
 * Establishes formal authority hierarchy, freshness windows, and conflict
 * precedence rules for every student identity and academic record attribute.
 */

export const DATA_AUTHORITY_LEVELS = Object.freeze({
  AUTHORITATIVE: "AUTHORITATIVE",         // Canonical source verified by institution
  DERIVED: "DERIVED",                     // Computed deterministically by verified rules
  AUDITED_OVERRIDE: "AUDITED_OVERRIDE",   // Academic registrar manual correction
  UNVERIFIED_CLAIM: "UNVERIFIED_CLAIM"    // Student self-submitted draft
});

export const CANONICAL_SOURCES = Object.freeze({
  HCMUTE_SIS_PORTAL: "HCMUTE_SIS_PORTAL",             // Hệ thống Quản lý Đào tạo (dkmh.hcmute.edu.vn)
  HCMUTE_DAOTAO_PORTAL: "HCMUTE_DAOTAO_PORTAL",       // Phòng Đào tạo (daotao.hcmute.edu.vn)
  HCMUTE_FINANCE_PORTAL: "HCMUTE_FINANCE_PORTAL",     // Phòng Kế hoạch - Tài chính
  HCMUTE_STUDENT_AFFAIRS: "HCMUTE_STUDENT_AFFAIRS",   // Phòng Công tác Sinh viên (ctsv.hcmute.edu.vn)
  IIG_VIETNAM: "IIG_VIETNAM",                         // Tổ chức Khảo thí IIG (TOEIC)
  BRITISH_COUNCIL: "BRITISH_COUNCIL",                 // Hội đồng Anh (IELTS)
  SUPABASE_AUTH: "SUPABASE_AUTH",                     // Hệ thống Xác thực Định danh Sinh viên
  STUDENT_SUBMISSION: "STUDENT_SUBMISSION"            // Đề nghị điều chỉnh từ sinh viên
});

export const SECTION_FRESHNESS = Object.freeze({
  FRESH: "FRESH",             // Dữ liệu mới nhất trong khung thời gian hợp lệ
  STALE: "STALE",             // Dữ liệu cũ nhưng vẫn là bản xác minh gần nhất
  UNKNOWN: "UNKNOWN",         // Chưa có dữ liệu hoặc nguồn không khả dụng
  CONFLICTED: "CONFLICTED"    // Xuất hiện mâu thuẫn giữa các nguồn chính thức
});

export const SOURCE_PRECEDENCE_ORDER = Object.freeze([
  CANONICAL_SOURCES.SUPABASE_AUTH,
  CANONICAL_SOURCES.HCMUTE_DAOTAO_PORTAL,
  CANONICAL_SOURCES.HCMUTE_SIS_PORTAL,
  CANONICAL_SOURCES.IIG_VIETNAM,
  CANONICAL_SOURCES.BRITISH_COUNCIL,
  CANONICAL_SOURCES.HCMUTE_FINANCE_PORTAL,
  CANONICAL_SOURCES.HCMUTE_STUDENT_AFFAIRS,
  CANONICAL_SOURCES.STUDENT_SUBMISSION
]);

export const STUDENT_DATA_PROVENANCE_MATRIX = Object.freeze({
  studentId: {
    canonicalSource: CANONICAL_SOURCES.SUPABASE_AUTH,
    authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
    ttlHours: 720, // 30 days
    precedencePriority: 100,
    consumers: ["ALL", "SECURITY", "DIGITAL_TWIN", "WORKFLOW"]
  },
  institutionalEmail: {
    canonicalSource: CANONICAL_SOURCES.SUPABASE_AUTH,
    authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
    ttlHours: 720,
    precedencePriority: 100,
    consumers: ["PROFILE", "NOTIFICATION"]
  },
  cohort: {
    canonicalSource: CANONICAL_SOURCES.HCMUTE_DAOTAO_PORTAL,
    authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
    ttlHours: 2160, // 90 days
    precedencePriority: 90,
    consumers: ["DIGITAL_TWIN", "ELIGIBILITY", "RULES"]
  },
  programCode: {
    canonicalSource: CANONICAL_SOURCES.HCMUTE_DAOTAO_PORTAL,
    authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
    ttlHours: 2160,
    precedencePriority: 90,
    consumers: ["DIGITAL_TWIN", "ELIGIBILITY", "RULES"]
  },
  earnedCredits: {
    canonicalSource: CANONICAL_SOURCES.HCMUTE_SIS_PORTAL,
    authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
    ttlHours: 24, // 1 day
    precedencePriority: 80,
    consumers: ["DIGITAL_TWIN", "ELIGIBILITY", "WORKFLOW"]
  },
  cgpa: {
    canonicalSource: CANONICAL_SOURCES.HCMUTE_SIS_PORTAL,
    authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
    ttlHours: 24,
    precedencePriority: 80,
    consumers: ["DIGITAL_TWIN", "ELIGIBILITY", "WORKFLOW"]
  },
  courses: {
    canonicalSource: CANONICAL_SOURCES.HCMUTE_SIS_PORTAL,
    authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
    ttlHours: 24,
    precedencePriority: 80,
    consumers: ["PROFILE", "TRANSCRIPT", "DIGITAL_TWIN"]
  },
  certifications: {
    canonicalSource: CANONICAL_SOURCES.IIG_VIETNAM,
    authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
    ttlHours: 168, // 7 days
    precedencePriority: 85,
    consumers: ["DIGITAL_TWIN", "ELIGIBILITY", "WORKFLOW"]
  },
  tuitionStatus: {
    canonicalSource: CANONICAL_SOURCES.HCMUTE_FINANCE_PORTAL,
    authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
    ttlHours: 12,
    precedencePriority: 80,
    consumers: ["PROFILE", "ELIGIBILITY"]
  },
  graduationEligibility: {
    canonicalSource: "ACADEMIC_ELIGIBILITY_ENGINE",
    authority: DATA_AUTHORITY_LEVELS.DERIVED,
    ttlHours: 1,
    precedencePriority: 70,
    consumers: ["COMMAND_CENTER", "ACTION_CENTER", "WORKFLOW"]
  }
});

export class StudentDataProvenanceMatrix {
  /**
   * Looks up provenance config for a field
   * @param {string} fieldName 
   * @returns {object|null}
   */
  static getFieldProvenance(fieldName) {
    if (!fieldName || !STUDENT_DATA_PROVENANCE_MATRIX[fieldName]) {
      return null;
    }
    return { ...STUDENT_DATA_PROVENANCE_MATRIX[fieldName] };
  }

  /**
   * Resolves precedence between two sources
   * @param {string} sourceA 
   * @param {string} sourceB 
   * @returns {number} positive if sourceA has higher priority, negative if sourceB has higher priority, 0 if equal
   */
  static resolvePrecedence(sourceA, sourceB) {
    const idxA = SOURCE_PRECEDENCE_ORDER.indexOf(sourceA);
    const idxB = SOURCE_PRECEDENCE_ORDER.indexOf(sourceB);

    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return -1;
    if (idxB === -1) return 1;

    // Lower index in SOURCE_PRECEDENCE_ORDER = higher priority
    return idxB - idxA;
  }

  /**
   * Computes freshness status given an asOf timestamp and a max TTL
   * @param {string|number|Date} asOf 
   * @param {number} ttlHours 
   * @param {object} [clock]
   * @returns {string} SECTION_FRESHNESS
   */
  static computeFreshness(asOf, ttlHours = 24, clock = null) {
    if (!asOf) return SECTION_FRESHNESS.UNKNOWN;

    const timestamp = new Date(asOf).getTime();
    if (Number.isNaN(timestamp)) return SECTION_FRESHNESS.UNKNOWN;

    const now = clock && typeof clock.now === "function" ? clock.now() : Date.now();
    const ageMs = now - timestamp;
    const maxAgeMs = ttlHours * 60 * 60 * 1000;

    if (ageMs < 0) return SECTION_FRESHNESS.FRESH;
    return ageMs <= maxAgeMs ? SECTION_FRESHNESS.FRESH : SECTION_FRESHNESS.STALE;
  }
}
