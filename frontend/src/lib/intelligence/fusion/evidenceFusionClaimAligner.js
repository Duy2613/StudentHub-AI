/**
 * StudentHub AI — Claim Alignment & Semantic Equivalence Engine V1
 * 
 * Normalizes multi-layer incoming statements (Official, Expert, Community, AI)
 * into canonical representation and aligns their semantic relations.
 */

import { EvidenceFusionModel, CLAIM_RELATION_TYPE, KNOWLEDGE_LAYER } from "./evidenceFusionModel.js";

export class EvidenceFusionClaimAligner {
  /**
   * Normalizes any input statement into a canonical claim tuple
   */
  static normalizeClaim(input = {}) {
    const rawText = String(input.statement || input.body || input.content || input.text || "").trim();
    const layer = input.layer || KNOWLEDGE_LAYER.AI_VERIFIED_REASONING;
    const scope = EvidenceFusionModel.createScopeDimension(input.scope || input.context || {});

    const lower = rawText.toLowerCase();

    let subject = input.subject || "ACADEMIC_DEADLINE";
    let predicate = input.predicate || "HAS_VALUE";
    let value = input.value || null;

    // Semantic Parser for HCMUTE Academic Regs & Turnaround
    if (lower.includes("hạn chót") || lower.includes("deadline") || lower.includes("thời hạn") || (lower.includes("hạn") && /\d{1,2}\/\d{1,2}/.test(lower))) {
      subject = "DEADLINE";
      predicate = "EQUALS_DATE";
      if (lower.includes("05/09") || lower.includes("5/9") || lower.includes("september 5")) {
        value = "05/09/2026";
      } else if (lower.includes("30/08") || lower.includes("30/8") || lower.includes("august 30")) {
        value = "30/08/2026";
      } else if (lower.includes("10/09") || lower.includes("10/9")) {
        value = "10/09/2026";
      } else {
        value = "VARIABLE_DATE";
      }
    } else if (lower.includes("toeic") || lower.includes("chuẩn ngoại ngữ") || lower.includes("tiếng anh")) {
      subject = "ENGLISH_EXIT_STANDARD";
      predicate = "MINIMUM_SCORE";
      if (lower.includes("550") || lower.includes("b2")) value = 550;
      else if (lower.includes("500")) value = 500;
      else if (lower.includes("450") || lower.includes("b1")) value = 450;
      else if (lower.includes("600")) value = 600;
    } else if (lower.includes("thời gian xử lý") || lower.includes("mất") || lower.includes("ngày làm việc")) {
      subject = "PROCESSING_TURNAROUND";
      predicate = "DURATION_DAYS";
      if (lower.includes("3 ngày")) value = "3_DAYS";
      else if (lower.includes("6-8") || lower.includes("6–8") || lower.includes("7 ngày")) value = "6_TO_8_DAYS";
      else if (lower.includes("10 ngày")) value = "10_DAYS";
    }

    return EvidenceFusionModel.createCanonicalClaim({
      ...input,
      subject,
      predicate,
      value,
      layer,
      scope,
      normalizedStatement: `${subject} [${predicate}] ${value ?? rawText}`
    });
  }

  /**
   * Evaluates semantic equivalence between two claims
   */
  static isEquivalent(claimA, claimB) {
    if (!claimA || !claimB) return false;
    const cA = claimA.claimHash ? claimA : this.normalizeClaim(claimA);
    const cB = claimB.claimHash ? claimB : this.normalizeClaim(claimB);

    return (
      cA.subject === cB.subject &&
      cA.predicate === cB.predicate &&
      String(cA.value) === String(cB.value) &&
      (cA.scope.cohort === "ALL" || cB.scope.cohort === "ALL" || cA.scope.cohort === cB.scope.cohort) &&
      (cA.scope.faculty === "ALL" || cB.scope.faculty === "ALL" || cA.scope.faculty === cB.scope.faculty)
    );
  }

  /**
   * Classifies the semantic relation between two claims
   */
  static classifyRelation(sourceClaim, targetClaim) {
    if (!sourceClaim || !targetClaim) return CLAIM_RELATION_TYPE.UNCERTAIN_BECAUSE;

    const sC = sourceClaim.claimHash ? sourceClaim : this.normalizeClaim(sourceClaim);
    const tC = targetClaim.claimHash ? targetClaim : this.normalizeClaim(targetClaim);

    // 1. Same claim check
    if (this.isEquivalent(sC, tC)) {
      return CLAIM_RELATION_TYPE.SAME_CLAIM;
    }

    // 2. Supersession check (Official V1 vs Official V2 over time)
    if (
      sC.subject === tC.subject &&
      sC.layer === KNOWLEDGE_LAYER.OFFICIAL_TRUTH &&
      tC.layer === KNOWLEDGE_LAYER.OFFICIAL_TRUTH &&
      sC.value !== tC.value
    ) {
      return CLAIM_RELATION_TYPE.SUPERSEDES;
    }

    // 3. Contradiction check (Same scope & time, mutually exclusive values)
    if (
      sC.subject === tC.subject &&
      sC.predicate === tC.predicate &&
      sC.value !== tC.value &&
      (sC.scope.cohort === tC.scope.cohort || sC.scope.cohort === "ALL" || tC.scope.cohort === "ALL") &&
      (sC.scope.faculty === tC.scope.faculty || sC.scope.faculty === "ALL" || tC.scope.faculty === "ALL")
    ) {
      return CLAIM_RELATION_TYPE.CONTRADICTS;
    }

    // 4. Qualification / Scope bound check (Different cohorts)
    if (
      sC.subject === tC.subject &&
      sC.scope.cohort !== tC.scope.cohort &&
      sC.scope.cohort !== "ALL" &&
      tC.scope.cohort !== "ALL"
    ) {
      return CLAIM_RELATION_TYPE.QUALIFIES;
    }

    // 5. Cross-layer Derivation (AI summarizing Expert or Official)
    if (
      sC.layer === KNOWLEDGE_LAYER.AI_VERIFIED_REASONING &&
      (tC.layer === KNOWLEDGE_LAYER.OFFICIAL_TRUTH || tC.layer === KNOWLEDGE_LAYER.EXPERT_INTERPRETATION)
    ) {
      return CLAIM_RELATION_TYPE.DERIVES_FROM;
    }

    // 6. Expert Interpretation
    if (sC.layer === KNOWLEDGE_LAYER.EXPERT_INTERPRETATION) {
      return CLAIM_RELATION_TYPE.INTERPRETS;
    }

    // 7. Community Observation
    if (sC.layer === KNOWLEDGE_LAYER.COMMUNITY_REALITY) {
      return CLAIM_RELATION_TYPE.OBSERVES;
    }

    return CLAIM_RELATION_TYPE.CONTEXTUALIZES;
  }
}
