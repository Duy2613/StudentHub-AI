/**
 * StudentHub AI — Claim Decomposition & Compound Sentence Engine V1
 * 
 * Decomposes complex AI answers and natural language responses into atomic,
 * independently-verifiable Claim entities.
 * 
 * Features:
 * - Compound sentence splitting ("A và B" -> Claim A, Claim B)
 * - Exact numeric & score requirement extraction (TOEIC, GPA, credits, deadlines)
 * - Cohort scoping (K23, K24, K25, K26) and stake classification
 */

import { AiTrustModel, CLAIM_TYPE, STAKE_LEVEL, TRUST_STATUS } from "./aiTrustModel.js";

export class ClaimDecompositionEngine {
  /**
   * Decomposes raw response text into a list of atomic Claim objects
   * @param {string} text 
   * @param {object} context 
   * @returns {Array<object>}
   */
  static decompose(text, context = {}) {
    if (!text || typeof text !== "string") return [];

    const defaultSubject = context.subject || "HCMUTE";
    const defaultJurisdiction = context.jurisdiction || "HCMUTE";
    const defaultStake = context.stakeLevel || STAKE_LEVEL.MEDIUM;

    // 1. Split into primary sentences
    const rawSentences = text
      .split(/(?<=[.!?\n])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    const atomicClauses = [];

    // 2. Compound sentence defense: split conjunctions
    for (const sentence of rawSentences) {
      const subClauses = this.#splitCompoundClauses(sentence);
      for (const clause of subClauses) {
        if (clause && clause.length > 5) {
          atomicClauses.push(clause);
        }
      }
    }

    // 3. Transform clauses into structured Claim objects
    const claims = atomicClauses.map((clauseText, index) => {
      const extracted = this.#extractClaimComponents(clauseText, {
        defaultSubject,
        defaultJurisdiction,
        defaultStake
      });

      return AiTrustModel.createClaim({
        claimId: `CLAIM_${index + 1}_${Math.random().toString(36).slice(2, 6)}`,
        text: clauseText,
        subject: extracted.subject,
        predicate: extracted.predicate,
        object: extracted.object,
        qualifiers: extracted.qualifiers,
        scope: extracted.scope,
        jurisdiction: extracted.jurisdiction,
        claimType: extracted.claimType,
        stakeLevel: extracted.stakeLevel,
        numericValue: extracted.numericValue,
        numericUnit: extracted.numericUnit,
        status: TRUST_STATUS.UNVERIFIED
      });
    });

    return claims;
  }

  /**
   * Splits compound sentences containing coordinating conjunctions
   */
  static #splitCompoundClauses(sentence) {
    // Look for conjunctions: " và ", " đồng thời ", " cũng như ", " and ", " ; "
    const conjunctionRegex = /\s+(?:và|đồng thời|cũng như|and|nhưng|tuy nhiên)\s+|;\s*/i;
    const parts = sentence.split(conjunctionRegex);
    
    // If splitting results in fragments that are too short to stand alone, keep together
    if (parts.length > 1 && parts.every(p => p.trim().split(/\s+/).length >= 3)) {
      return parts.map(p => p.trim());
    }
    return [sentence];
  }

  /**
   * Extracts typed semantics from a single clause
   */
  static #extractClaimComponents(clause, defaults) {
    let subject = defaults.defaultSubject;
    let predicate = "STATES";
    let object = clause;
    let scope = "ALL";
    let claimType = CLAIM_TYPE.FACTUAL;
    let stakeLevel = defaults.defaultStake;
    let numericValue = null;
    let numericUnit = null;
    const qualifiers = [];

    // Detect Cohort scope (e.g. K24, K23, K25, K26)
    const cohortMatch = clause.match(/\b(K2[0-9])\b/i);
    if (cohortMatch) {
      scope = cohortMatch[1].toUpperCase();
      qualifiers.push(`cohort:${scope}`);
    }

    // Detect TOEIC / Language requirements
    const toeicMatch = clause.match(/TOEIC\s*(?:>=|>=|đạt|tối thiểu|yêu cầu)?\s*(\d{3})/i);
    if (toeicMatch) {
      predicate = "REQUIRES_LANGUAGE_SCORE";
      numericValue = Number(toeicMatch[1]);
      numericUnit = "TOEIC_POINTS";
      object = `TOEIC_${numericValue}`;
      claimType = CLAIM_TYPE.ACADEMIC_POLICY;
      stakeLevel = STAKE_LEVEL.HIGH;
    }

    // Detect Deadlines / Dates (e.g. 05/09/2026, 30/08)
    const dateMatch = clause.match(/(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/);
    if (dateMatch) {
      const lower = clause.toLowerCase();
      if (lower.includes("hạn") || lower.includes("deadline") || lower.includes("nộp") || lower.includes("hoàn tất") || lower.includes("trước ngày") || lower.includes("ngày")) {
        predicate = "SUBMISSION_DEADLINE";
        object = `DEADLINE_${dateMatch[1]}`;
        claimType = CLAIM_TYPE.TEMPORAL;
        stakeLevel = STAKE_LEVEL.HIGH;
        qualifiers.push(`date:${dateMatch[1]}`);
      }
    }

    // Detect Credit requirements
    const creditMatch = clause.match(/(\d{1,3})\s*(?:tín chỉ|credits?)/i);
    if (creditMatch && !numericValue) {
      predicate = "REQUIRES_CREDITS";
      numericValue = Number(creditMatch[1]);
      numericUnit = "CREDITS";
      object = `CREDITS_${numericValue}`;
      claimType = CLAIM_TYPE.NUMERIC;
      stakeLevel = STAKE_LEVEL.HIGH;
    }

    // Detect Disciplinary / Regulatory policy
    if (clause.toLowerCase().includes("kỷ luật") || clause.toLowerCase().includes("buộc thôi học") || clause.toLowerCase().includes("cảnh báo học vụ")) {
      claimType = CLAIM_TYPE.REGULATORY;
      stakeLevel = STAKE_LEVEL.CRITICAL;
    }

    return {
      subject,
      predicate,
      object,
      qualifiers,
      scope,
      jurisdiction: defaults.defaultJurisdiction,
      claimType,
      stakeLevel,
      numericValue,
      numericUnit
    };
  }
}
