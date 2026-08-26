/**
 * StudentHub AI — Academic Rule Extraction Engine
 * 
 * Enforces Rule Extraction Constitution:
 * - Transforms normalized document text & semantic diffs into structured AcademicRule entities.
 * - Extracts condition matrices (cohorts, majors, credits, GPA, prerequisites).
 * - Binds explicit text span evidence and source provenance.
 * - Enforces verification status: VERIFIED for Tier 1/2 official sources, PENDING_REVIEW for unverified/unknown sources.
 */

import { AcademicDocumentNormalizer } from "./academicDocumentNormalizer.js";

export const ACADEMIC_RULE_TYPES = {
  DEADLINE: "DEADLINE",
  TUITION_FEE: "TUITION_FEE",
  GRADUATION_REQUIREMENT: "GRADUATION_REQUIREMENT",
  ENGLISH_STANDARD: "ENGLISH_STANDARD",
  ACADEMIC_WARNING: "ACADEMIC_WARNING",
  COURSE_REGISTRATION: "COURSE_REGISTRATION",
  GENERAL_REGULATION: "GENERAL_REGULATION"
};

export const RULE_VERIFICATION_STATUSES = {
  VERIFIED: "VERIFIED",
  PENDING_REVIEW: "PENDING_REVIEW",
  UNVERIFIED: "UNVERIFIED"
};

export class AcademicRuleExtractor {
  /**
   * Extracts structured academic rules from a document
   * @param {object} normalizedDoc - { normalizedText, documentCode, extractedDates, rawContentHash }
   * @param {object} options - { source, diffResult }
   * @returns {object[]} Array of extracted AcademicRule records
   */
  static extractRules(normalizedDoc = {}, options = {}) {
    const text = normalizedDoc.normalizedText || "";
    const source = options.source || { sourceId: "SRC_UNKNOWN", sourceTier: "TIER_4_UNKNOWN", canonicalUrl: "" };
    const isOfficialTier = source.sourceTier === "TIER_1_OFFICIAL" || source.sourceTier === "TIER_2_OFFICIAL_MIRROR";
    const verificationStatus = isOfficialTier 
      ? RULE_VERIFICATION_STATUSES.VERIFIED 
      : RULE_VERIFICATION_STATUSES.PENDING_REVIEW;

    const extractedRules = [];

    // 1. Detect Cohort Scope (e.g. Khóa 2024, K24, Khóa 2026, K26)
    const cohortMatches = [...text.matchAll(/(?:khóa|khoa|k)\s*(?:20)?(2[0-9])\b/gi)].map(m => `20${m[1]}`);
    const uniqueCohorts = Array.from(new Set(cohortMatches));
    const affectedCohorts = uniqueCohorts.length > 0 ? uniqueCohorts : ["ALL"];

    // 2. Detect Program Scope (e.g. Kỹ thuật Phần mềm, CNTT, 7480103)
    const programMatches = [...text.matchAll(/\b(7\d{6})\b/g)].map(m => m[1]);
    const affectedPrograms = programMatches.length > 0 ? Array.from(new Set(programMatches)) : ["ALL"];

    // 3. Extract English Exit Standard Rules (TOEIC, IELTS, B2)
    const englishMatch = text.match(/(?:chuẩn đầu ra|ngoại ngữ|tiếng anh|anh văn)\s*[:\.]?[\s\S]{0,50}(TOEIC\s*(\d{3})|IELTS\s*(\d\.\d)|VSTEP\s*B[12]|B[12]\s*Quốc tế)/i);
    if (englishMatch) {
      const toeicScore = englishMatch[2] ? parseInt(englishMatch[2], 10) : null;
      extractedRules.push({
        ruleId: `RULE_ENG_${AcademicDocumentNormalizer.computeSha256(englishMatch[0]).slice(0, 8)}`,
        type: ACADEMIC_RULE_TYPES.ENGLISH_STANDARD,
        subject: "Chuẩn Đầu Ra Ngoại Ngữ",
        conditions: {
          targetCohorts: affectedCohorts,
          targetPrograms: affectedPrograms,
          minScore: toeicScore || englishMatch[1]
        },
        effectiveFrom: normalizedDoc.extractedDates?.[0]?.isoDate || new Date().toISOString().slice(0, 10),
        effectiveTo: null,
        deadline: null,
        values: {
          standard: englishMatch[1],
          toeicScore
        },
        requiredActions: [
          `Nộp chứng chỉ ngoại ngữ đạt chuẩn [${englishMatch[1]}] trước thời hạn xét tốt nghiệp.`
        ],
        affectedScope: {
          cohorts: affectedCohorts,
          programs: affectedPrograms
        },
        source: {
          sourceId: source.sourceId,
          canonicalUrl: source.canonicalUrl,
          sourceTier: source.sourceTier
        },
        evidence: {
          textSpan: englishMatch[0],
          clauseName: "Dieu_Chuan_Dau_Ra_Ngoai_Ngu"
        },
        verificationStatus
      });
    }

    // 4. Extract Deadline & Registration Rules
    const deadlineMatch = text.match(/(?:hạn chót|hạn nộp|thời hạn đăng ký|thời gian đóng|kết thúc đợt)\s*[:\.]?[\s\S]{0,50}(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
    if (deadlineMatch) {
      const rawDate = deadlineMatch[1];
      const parts = rawDate.split(/[/-]/);
      const isoDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;

      extractedRules.push({
        ruleId: `RULE_DEADLINE_${AcademicDocumentNormalizer.computeSha256(deadlineMatch[0]).slice(0, 8)}`,
        type: ACADEMIC_RULE_TYPES.DEADLINE,
        subject: "Thời Hạn Đăng Ký / Nộp Hồ Sơ Học Vụ",
        conditions: {
          targetCohorts: affectedCohorts,
          targetPrograms: affectedPrograms
        },
        effectiveFrom: new Date().toISOString().slice(0, 10),
        effectiveTo: isoDate,
        deadline: isoDate,
        values: {
          deadlineDate: isoDate,
          rawDateText: rawDate
        },
        requiredActions: [
          `Hoàn tất thủ tục học vụ trước 23:59 ngày ${rawDate}.`
        ],
        affectedScope: {
          cohorts: affectedCohorts,
          programs: affectedPrograms
        },
        source: {
          sourceId: source.sourceId,
          canonicalUrl: source.canonicalUrl,
          sourceTier: source.sourceTier
        },
        evidence: {
          textSpan: deadlineMatch[0],
          clauseName: "Dieu_Thoi_Han_Hoc_Vu"
        },
        verificationStatus
      });
    }

    // 5. Extract Tuition Fee Rules
    const feeMatch = text.match(/(?:học phí|lệ phí|mức thu)\s*[:\.]?[\s\S]{0,50}(\d{1,3}(?:[.,]\d{3})+\s*(?:VNĐ|VND|đồng|đ))/i);
    if (feeMatch) {
      const rawFee = feeMatch[1];
      const numericFee = parseInt(rawFee.replace(/[^0-9]/g, ""), 10);

      extractedRules.push({
        ruleId: `RULE_FEE_${AcademicDocumentNormalizer.computeSha256(feeMatch[0]).slice(0, 8)}`,
        type: ACADEMIC_RULE_TYPES.TUITION_FEE,
        subject: "Quy Định Mức Thu Học Phí",
        conditions: {
          targetCohorts: affectedCohorts,
          targetPrograms: affectedPrograms
        },
        effectiveFrom: new Date().toISOString().slice(0, 10),
        effectiveTo: null,
        deadline: null,
        values: {
          feeAmount: numericFee,
          rawFeeText: rawFee
        },
        requiredActions: [
          `Nộp học phí theo đúng mức quy định [${rawFee}] qua cổng thanh toán chính thức của trường.`
        ],
        affectedScope: {
          cohorts: affectedCohorts,
          programs: affectedPrograms
        },
        source: {
          sourceId: source.sourceId,
          canonicalUrl: source.canonicalUrl,
          sourceTier: source.sourceTier
        },
        evidence: {
          textSpan: feeMatch[0],
          clauseName: "Dieu_Quy_Dinh_Hoc_Phi"
        },
        verificationStatus
      });
    }

    // 6. Extract Graduation / Thesis Credit Requirement Rules
    const creditMatch = text.match(/(?:điều kiện|xét|khóa luận|tốt nghiệp)\s*[:\.]?[\s\S]{0,60}(\d{2,3})\s*(?:tín chỉ|credits|TC)/i);
    if (creditMatch) {
      const requiredCredits = parseInt(creditMatch[1], 10);
      extractedRules.push({
        ruleId: `RULE_GRAD_${AcademicDocumentNormalizer.computeSha256(creditMatch[0]).slice(0, 8)}`,
        type: ACADEMIC_RULE_TYPES.GRADUATION_REQUIREMENT,
        subject: "Điều Kiện Tích Lũy Tín Chỉ Tốt Nghiệp / Khóa Luận",
        conditions: {
          targetCohorts: affectedCohorts,
          targetPrograms: affectedPrograms,
          minCredits: requiredCredits
        },
        effectiveFrom: new Date().toISOString().slice(0, 10),
        effectiveTo: null,
        deadline: null,
        values: {
          requiredCredits
        },
        requiredActions: [
          `Tích lũy tối thiểu ${requiredCredits} tín chỉ theo khung chương trình đào tạo.`
        ],
        affectedScope: {
          cohorts: affectedCohorts,
          programs: affectedPrograms
        },
        source: {
          sourceId: source.sourceId,
          canonicalUrl: source.canonicalUrl,
          sourceTier: source.sourceTier
        },
        evidence: {
          textSpan: creditMatch[0],
          clauseName: "Dieu_Dieu_Kien_Tot_Nghiep"
        },
        verificationStatus
      });
    }

    return extractedRules;
  }
}
