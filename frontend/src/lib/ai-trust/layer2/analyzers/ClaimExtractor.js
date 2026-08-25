/**
 * Layer 2 — ClaimExtractor
 * 
 * Extracts factual, institutional, financial, academic, and security claims.
 * Assigns importance and verification requirement without pre-judging external truth.
 */

import { CLAIM_TYPES, CLAIM_IMPORTANCE, createClaim } from "../types.js";

export class ClaimExtractor {
  /**
   * Extracts factual claims from text and context
   * @param {string} text
   * @param {Array<object>} entities
   * @param {object} context
   * @returns {Array<object>} Array of Claim DTOs
   */
  static extract(text, entities = [], context = {}) {
    if (!text || typeof text !== "string") return [];

    const claims = [];
    const sentences = text
      .split(/(?<=[.!?\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const lower = sentence.toLowerCase();

      // 1. Institutional Scholarship / Grant Claim
      if (/(?:học bổng|trao tặng|tài trợ|khen thưởng|scholarship|grant)/i.test(sentence)) {
        const entity = entities[0]?.name || "Institutional Entity";
        claims.push(
          createClaim({
            claimId: `claim-inst-${i + 1}`,
            subject: entity,
            predicate: "cấp / trao học bổng",
            object: sentence,
            scope: "sinh viên",
            time: "2026",
            claimType: CLAIM_TYPES.INSTITUTIONAL,
            importance: CLAIM_IMPORTANCE.HIGH,
            verificationRequired: true,
            verificationReason: "institutional_scholarship_claim",
            rawText: sentence,
          })
        );
      }

      // 2. Policy / Tuition / Admission Changes (e.g. HCMUTE changed tuition policy)
      else if (/(?:học phí|chính sách|tuyển sinh|quy chế|thay đổi|ban hành|tuition|admission|policy)/i.test(sentence)) {
        const entity = entities[0]?.name || "Đơn vị đào tạo";
        claims.push(
          createClaim({
            claimId: `claim-policy-${i + 1}`,
            subject: entity,
            predicate: "thay đổi chính sách / học phí / tuyển sinh",
            object: sentence,
            scope: "toàn trường",
            time: "2026",
            claimType: CLAIM_TYPES.INSTITUTIONAL,
            importance: CLAIM_IMPORTANCE.HIGH,
            verificationRequired: true,
            verificationReason: "institutional_policy_change",
            rawText: sentence,
          })
        );
      }

      // 3. Security / Account Lock / OTP Requirement Claim
      else if (/(?:tạm khóa|mở khóa|xác thực|smart otp|mã pin|security alert|lock account)/i.test(sentence)) {
        const entity = entities[0]?.name || "Dịch vụ xác thực";
        claims.push(
          createClaim({
            claimId: `claim-sec-${i + 1}`,
            subject: entity,
            predicate: "yêu cầu xác thực tài khoản / thông báo khóa thẻ",
            object: sentence,
            scope: "người dùng cá nhân",
            claimType: CLAIM_TYPES.SECURITY,
            importance: CLAIM_IMPORTANCE.CRITICAL,
            verificationRequired: true,
            verificationReason: "security_action_demand",
            rawText: sentence,
          })
        );
      }

      // 4. Financial / Task Deposit Claim
      else if (/(?:nạp cọc|hoa hồng|thu nhập|500k|200k|triệu đồng|commission|deposit)/i.test(sentence)) {
        claims.push(
          createClaim({
            claimId: `claim-fin-${i + 1}`,
            subject: "Nhà tuyển dụng / Hệ thống CTV",
            predicate: "cam kết hoa hồng / yêu cầu nạp cọc",
            object: sentence,
            scope: "CTV tìm việc",
            claimType: CLAIM_TYPES.FINANCIAL,
            importance: CLAIM_IMPORTANCE.CRITICAL,
            verificationRequired: true,
            verificationReason: "financial_reward_or_deposit_claim",
            rawText: sentence,
          })
        );
      }

      // 5. Academic / Coursework Statement (General Fact or Lecture)
      else if (/(?:thuật toán|cấu trúc dữ liệu|giải thuật|quicksort|semaphore|mutex|hệ điều hành|phương trình)/i.test(sentence)) {
        claims.push(
          createClaim({
            claimId: `claim-acad-${i + 1}`,
            subject: "Tài liệu học thuật",
            predicate: "mô tả nguyên lý khoa học",
            object: sentence,
            scope: "học tập / nghiên cứu",
            claimType: CLAIM_TYPES.ACADEMIC,
            importance: CLAIM_IMPORTANCE.LOW,
            verificationRequired: false, // Pure educational principle
            verificationReason: "educational_concept",
            rawText: sentence,
          })
        );
      }

      // 6. Generic Statement with Entity
      else if (entities.length > 0 && /(?:thông báo|tổ chức|khai giảng|sự kiện|event)/i.test(sentence)) {
        claims.push(
          createClaim({
            claimId: `claim-gen-${i + 1}`,
            subject: entities[0].name,
            predicate: "công bố thông tin / sự kiện",
            object: sentence,
            scope: "cộng đồng",
            claimType: CLAIM_TYPES.EVENT,
            importance: CLAIM_IMPORTANCE.MEDIUM,
            verificationRequired: true,
            verificationReason: "event_announcement",
            rawText: sentence,
          })
        );
      }
    }

    return claims;
  }
}
