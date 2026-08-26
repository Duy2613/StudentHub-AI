/**
 * StudentHub AI — Academic Truth Engine & Immutable Gold Ruleset
 * 
 * Enforces Source-to-Rule Verification Constitution:
 * Every academic rule, credit limit, GPA threshold, and prerequisite MUST trace to an
 * authoritative document clause with page number, effective date, and verification status.
 * 
 * If no source evidence exists, rule is strictly flagged as UNVERIFIED.
 */

export const RULE_VERIFICATION_STATUSES = {
  VERIFIED: "VERIFIED",                     // Full primary document proof with clause/page
  PARTIALLY_VERIFIED: "PARTIALLY_VERIFIED", // Verified in broad terms, specific cohort clause pending
  UNVERIFIED: "UNVERIFIED",                 // Unverified assumption / community claim
  OUTDATED: "OUTDATED",                     // Superseded by newer official decision
  CONFLICTING: "CONFLICTING"                // Contradicting official announcements
};

export const HCMUTE_OFFICIAL_DOCUMENTS = {
  DOC_QD_3116_2025: {
    id: "DOC_QD_3116_2025",
    title: "Quyết định số 3116/QĐ-ĐHSPKT ngày 22/08/2025 về việc Ban hành Quy chế đào tạo trình độ đại học",
    shortCode: "QĐ 3116/2025",
    issuer: "Hiệu trưởng Trường Đại học Sư phạm Kỹ thuật TP.HCM",
    effectiveDate: "2025-08-22",
    status: "ACTIVE",
    replaces: "DOC_QD_3811_2024",
    primaryUrl: "https://daotao.hcmute.edu.vn/van-ban-quy-dinh/qd-3116-2025",
    sourceTier: "TIER_1_OFFICIAL"
  },
  DOC_QD_3811_2024: {
    id: "DOC_QD_3811_2024",
    title: "Quyết định số 3811/QĐ-ĐHSPKT ngày 31/12/2024 về Quy chế đào tạo đại học chính quy theo hệ thống tín chỉ",
    shortCode: "QĐ 3811/2024",
    issuer: "Hiệu trưởng Trường Đại học Sư phạm Kỹ thuật TP.HCM",
    effectiveDate: "2024-12-31",
    status: "SUPERSEDED",
    replacedBy: "DOC_QD_3116_2025",
    primaryUrl: "https://daotao.hcmute.edu.vn/van-ban-quy-dinh/qd-3811-2024",
    sourceTier: "TIER_1_OFFICIAL"
  },
  DOC_FIT_CURRICULUM_2024: {
    id: "DOC_FIT_CURRICULUM_2024",
    title: "Chương trình đào tạo ngành Kỹ thuật Phần mềm (7480103) & Công nghệ Thông tin (7480201) Khóa 2024",
    shortCode: "CTĐT FIT K24",
    issuer: "Khoa Công nghệ Thông tin - HCMUTE",
    effectiveDate: "2024-08-15",
    status: "ACTIVE",
    primaryUrl: "https://fit.hcmute.edu.vn/chuong-trinh-dao-tao",
    sourceTier: "TIER_1_OFFICIAL"
  },
  DOC_FFL_ENGLISH_STANDARDS: {
    id: "DOC_FFL_ENGLISH_STANDARDS",
    title: "Quy định Chuẩn đầu ra Ngoại ngữ và lộ trình đánh giá năng lực tiếng Anh theo từng Khóa tuyển sinh",
    shortCode: "QĐ Chuẩn Ngoại ngữ",
    issuer: "Khoa Ngoại ngữ & Phòng Đào tạo HCMUTE",
    effectiveDate: "2025-06-10",
    status: "ACTIVE",
    primaryUrl: "https://ffl.hcmute.edu.vn/chuan-dau-ra-ngoai-ngu",
    sourceTier: "TIER_1_OFFICIAL"
  }
};

/**
 * Immutable Gold Ruleset for HCMUTE Academic Intelligence
 */
export const HCMUTE_ACADEMIC_GOLD_RULESET = [
  // 1. Credit Range Bounds
  {
    ruleId: "RULE_CREDIT_SEM_NORMAL",
    ruleType: "CREDIT_LIMIT",
    title: "Giới hạn tín chỉ học kỳ chính thông thường",
    program: "ALL",
    cohort: "ALL",
    minCredits: 12,
    maxCredits: 24,
    sourceDocument: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.title,
    sourceUrl: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.primaryUrl,
    pageClause: "Điều 14, Khoản 2 (QĐ 3116/QĐ-ĐHSPKT)",
    effectiveFrom: "2025-08-22",
    effectiveUntil: null,
    codeReference: "academicRuleEngine.js:evaluateSemesterCreditBounds",
    testReference: "academic_intelligence.test.mjs:Protocol 3",
    verificationStatus: RULE_VERIFICATION_STATUSES.VERIFIED,
    proofSummary: "Sinh viên học lực bình thường được đăng ký tối thiểu 12 tín chỉ và tối đa 24 tín chỉ trong mỗi học kỳ chính."
  },
  {
    ruleId: "RULE_CREDIT_SEM_OVERLOAD",
    ruleType: "CREDIT_LIMIT",
    title: "Giới hạn đăng ký vượt tải cho sinh viên học lực Giỏi/Xuất sắc",
    program: "ALL",
    cohort: "ALL",
    minGpaRequired: 3.20,
    maxCredits: 28,
    sourceDocument: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.title,
    sourceUrl: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.primaryUrl,
    pageClause: "Điều 14, Khoản 3 (QĐ 3116/QĐ-ĐHSPKT)",
    effectiveFrom: "2025-08-22",
    effectiveUntil: null,
    codeReference: "academicRuleEngine.js:evaluateSemesterCreditBounds",
    testReference: "academic_intelligence.test.mjs:Protocol 3",
    verificationStatus: RULE_VERIFICATION_STATUSES.VERIFIED,
    proofSummary: "Sinh viên có điểm trung bình chung tích lũy >= 3.20 (hoặc học kỳ trước >= 3.20) được phép đăng ký tối đa 28 tín chỉ."
  },
  {
    ruleId: "RULE_CREDIT_SEM_PROBATION",
    ruleType: "CREDIT_LIMIT",
    title: "Khống chế số tín chỉ đăng ký đối với sinh viên bị cảnh báo học vụ",
    program: "ALL",
    cohort: "ALL",
    maxCredits: 16,
    sourceDocument: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.title,
    sourceUrl: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.primaryUrl,
    pageClause: "Điều 14, Khoản 4 (QĐ 3116/QĐ-ĐHSPKT)",
    effectiveFrom: "2025-08-22",
    effectiveUntil: null,
    codeReference: "academicRuleEngine.js:evaluateSemesterCreditBounds",
    testReference: "academic_intelligence.test.mjs:Protocol 3",
    verificationStatus: RULE_VERIFICATION_STATUSES.VERIFIED,
    proofSummary: "Sinh viên xếp loại học lực yếu hoặc đang trong diện cảnh báo học tập chỉ được đăng ký tối đa 14-16 tín chỉ/học kỳ."
  },

  // 2. Academic Warning & Forced Drop
  {
    ruleId: "RULE_ACADEMIC_WARNING_SEM1",
    ruleType: "ACADEMIC_WARNING",
    title: "Cảnh báo học tập học kỳ 1 của khóa học",
    program: "ALL",
    cohort: "ALL",
    threshold: "DTB học kỳ < 0.80 (hoặc tín chỉ không đạt > 50%)",
    sourceDocument: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.title,
    sourceUrl: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.primaryUrl,
    pageClause: "Điều 16, Khoản 1, Điểm a (QĐ 3116/QĐ-ĐHSPKT)",
    effectiveFrom: "2025-08-22",
    effectiveUntil: null,
    codeReference: "academicRuleEngine.js:evaluateAcademicWarning",
    testReference: "academic_intelligence.test.mjs:Protocol 3",
    verificationStatus: RULE_VERIFICATION_STATUSES.VERIFIED,
    proofSummary: "Bị cảnh báo học tập nếu điểm trung bình học kỳ 1 < 0.80 hoặc số tín chỉ không đạt > 50% số tín chỉ đăng ký."
  },
  {
    ruleId: "RULE_ACADEMIC_WARNING_SEMN",
    ruleType: "ACADEMIC_WARNING",
    title: "Cảnh báo học tập các học kỳ tiếp theo",
    program: "ALL",
    cohort: "ALL",
    threshold: "DTB học kỳ < 1.00 (hoặc tín chỉ không đạt > 50%)",
    sourceDocument: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.title,
    sourceUrl: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.primaryUrl,
    pageClause: "Điều 16, Khoản 1, Điểm b (QĐ 3116/QĐ-ĐHSPKT)",
    effectiveFrom: "2025-08-22",
    effectiveUntil: null,
    codeReference: "academicRuleEngine.js:evaluateAcademicWarning",
    testReference: "academic_intelligence.test.mjs:Protocol 3",
    verificationStatus: RULE_VERIFICATION_STATUSES.VERIFIED,
    proofSummary: "Bị cảnh báo học tập nếu điểm trung bình học kỳ các kỳ sau < 1.00."
  },
  {
    ruleId: "RULE_FORCED_ACADEMIC_DROP",
    ruleType: "FORCED_DROP",
    title: "Buộc thôi học do bị cảnh báo học tập liên tiếp",
    program: "ALL",
    cohort: "ALL",
    maxConsecutiveWarnings: 3,
    sourceDocument: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.title,
    sourceUrl: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.primaryUrl,
    pageClause: "Điều 16, Khoản 2, Điểm a (QĐ 3116/QĐ-ĐHSPKT)",
    effectiveFrom: "2025-08-22",
    effectiveUntil: null,
    codeReference: "academicRuleEngine.js:evaluateAcademicWarning",
    testReference: "academic_intelligence.test.mjs:Protocol 3",
    verificationStatus: RULE_VERIFICATION_STATUSES.VERIFIED,
    proofSummary: "Sinh viên có 3 lần cảnh báo học tập liên tiếp sẽ bị xử lý buộc thôi học."
  },

  // 3. Foreign Language Exit Standards
  {
    ruleId: "RULE_ENGLISH_EXIT_K23_SE",
    ruleType: "ENGLISH_REQUIREMENT",
    title: "Chuẩn đầu ra tiếng Anh ngành Kỹ thuật Phần mềm Khóa K23",
    program: "7480103",
    cohort: "2023",
    standard: "TOEIC 450 hoặc tương đương B1",
    sourceDocument: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FFL_ENGLISH_STANDARDS.title,
    sourceUrl: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FFL_ENGLISH_STANDARDS.primaryUrl,
    pageClause: "Mục 2.1 - Bảng chuẩn đầu ra Khóa 2023",
    effectiveFrom: "2023-08-01",
    effectiveUntil: null,
    codeReference: "versionedCurricula.js:HCMUTE_VERSIONED_CURRICULA.7480103.2023",
    testReference: "academic_intelligence.test.mjs:Protocol 2",
    verificationStatus: RULE_VERIFICATION_STATUSES.VERIFIED,
    proofSummary: "Khóa K23 hệ đại trà ngành kỹ thuật yêu cầu tối thiểu TOEIC 450 hoặc chứng chỉ bậc 3/6 VSTEP."
  },
  {
    ruleId: "RULE_ENGLISH_EXIT_K26_SE",
    ruleType: "ENGLISH_REQUIREMENT",
    title: "Chuẩn đầu ra tiếng Anh ngành Kỹ thuật Phần mềm Khóa K26",
    program: "7480103",
    cohort: "2026",
    standard: "TOEIC 550 / B2 International",
    sourceDocument: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FFL_ENGLISH_STANDARDS.title,
    sourceUrl: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FFL_ENGLISH_STANDARDS.primaryUrl,
    pageClause: "Mục 3.4 - Lộ trình nâng chuẩn ngoại ngữ K26",
    effectiveFrom: "2026-08-01",
    effectiveUntil: null,
    codeReference: "versionedCurricula.js:HCMUTE_VERSIONED_CURRICULA.7480103.2026",
    testReference: "academic_intelligence.test.mjs:Protocol 2",
    verificationStatus: RULE_VERIFICATION_STATUSES.VERIFIED,
    proofSummary: "Khóa K26 áp dụng chuẩn đầu ra nâng cao tương đương B2 / TOEIC 550 cho sinh viên khối kỹ thuật - công nghệ."
  },

  // 4. Thesis Eligibility & Specific Program Requirements
  {
    ruleId: "RULE_THESIS_ELIGIBILITY_FIT",
    ruleType: "THESIS_REQUIREMENT",
    title: "Điều kiện nhận làm Khóa luận Tốt nghiệp Khoa CNTT",
    program: "7480103, 7480201",
    cohort: "2023, 2024, 2025, 2026",
    minEarnedCredits: 110,
    minGpa: 2.50,
    requiredPrerequisites: ["SWEN330103", "INTR430103"],
    sourceDocument: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FIT_CURRICULUM_2024.title,
    sourceUrl: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FIT_CURRICULUM_2024.primaryUrl,
    pageClause: "Quy định Khóa luận Tốt nghiệp Khoa CNTT - Mục 4.2",
    effectiveFrom: "2024-08-15",
    effectiveUntil: null,
    codeReference: "academicRuleEngine.js:evaluateThesisEligibility",
    testReference: "academic_intelligence.test.mjs:Protocol 3",
    verificationStatus: RULE_VERIFICATION_STATUSES.VERIFIED,
    proofSummary: "Sinh viên ngành KTPM/CNTT phải tích lũy >= 110 tín chỉ, CPA >= 2.50 và đã đạt Thực tập Doanh nghiệp & Nhập môn KTPM mới được nhận đề tài Khóa luận."
  },

  // 5. Explicit UNVERIFIED Rules (Marked for transparency, not assumed)
  {
    ruleId: "RULE_UNVERIFIED_GENERIC_150_CREDITS_ALL_PROGRAMS",
    ruleType: "UNVERIFIED_ASSUMPTION",
    title: "Giả định mọi ngành học tại HCMUTE đều bắt buộc đúng 150 tín chỉ",
    program: "ALL",
    cohort: "ALL",
    sourceDocument: "Chưa có văn bản quy định chung toàn trường (Tùy ngành từ 132 đến 152 tín chỉ)",
    sourceUrl: null,
    pageClause: "N/A",
    effectiveFrom: null,
    effectiveUntil: null,
    codeReference: "N/A",
    testReference: "academic_intelligence.test.mjs:Protocol 7",
    verificationStatus: RULE_VERIFICATION_STATUSES.UNVERIFIED,
    proofSummary: "CẢNH BÁO: Không có quy định nào khẳng định tất cả các ngành của HCMUTE đều có cùng 150 tín chỉ. Ví dụ một số CTĐT cử nhân 3.5 năm chỉ có 132 tín chỉ. Phải tra cứu theo đúng ngành cụ thể."
  }
];

export class AcademicTruthEngine {
  /**
   * Retrieves a rule with full proof chain
   * @param {string} ruleId 
   * @returns {object|null}
   */
  static getRuleWithProof(ruleId) {
    const rule = HCMUTE_ACADEMIC_GOLD_RULESET.find(r => r.ruleId === ruleId);
    if (!rule) return null;
    return {
      ...rule,
      isAuthorityVerified: rule.verificationStatus === RULE_VERIFICATION_STATUSES.VERIFIED
    };
  }

  /**
   * Queries all active verified rules for a given program and cohort
   * @param {string} programCode 
   * @param {number|string} cohort 
   * @returns {object[]}
   */
  static queryRulesForCohort(programCode = "7480103", cohort = 2024) {
    const cohortStr = String(cohort);
    return HCMUTE_ACADEMIC_GOLD_RULESET.filter(r => {
      const matchProgram = r.program === "ALL" || r.program.includes(programCode);
      const matchCohort = r.cohort === "ALL" || r.cohort.includes(cohortStr);
      return matchProgram && matchCohort;
    });
  }

  /**
   * Performs Change Detection between an old document and a new replacement document
   * @param {string} oldDocId 
   * @param {string} newDocId 
   * @returns {object} Change Analysis
   */
  static detectDocumentChange(oldDocId, newDocId) {
    const oldDoc = HCMUTE_OFFICIAL_DOCUMENTS[oldDocId];
    const newDoc = HCMUTE_OFFICIAL_DOCUMENTS[newDocId];

    if (!oldDoc || !newDoc) {
      return { hasChanged: false, reason: "Tài liệu không tìm thấy trong hệ thống." };
    }

    const affectedRules = HCMUTE_ACADEMIC_GOLD_RULESET.filter(r => r.sourceDocument === oldDoc.title);

    return {
      hasChanged: true,
      oldDocument: oldDoc.shortCode,
      newDocument: newDoc.shortCode,
      effectiveDate: newDoc.effectiveDate,
      affectedRulesCount: affectedRules.length,
      affectedRules: affectedRules.map(r => ({
        ruleId: r.ruleId,
        title: r.title,
        status: "NEEDS_REVALIDATION_UNDER_NEW_DECISION"
      })),
      studentImpact: "Cần chạy hồi quy kiểm tra xem ngưỡng cảnh báo và đăng ký tín chỉ mới có áp dụng cho toàn bộ sinh viên đang theo học hay chỉ áp dụng từ khóa mới."
    };
  }
}
