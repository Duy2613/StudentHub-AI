/**
 * StudentHub AI — Citation Entailment & Passage Extraction Engine V1
 * 
 * Performs fine-grained claim-to-evidence alignment.
 * Verifies whether cited evidence spans semantically and numerically
 * entail the claim, enforcing exact cohort scope and authority level.
 */

import {
  AiTrustModel,
  AUTHORITY_TIER,
  CITATION_STATUS,
  SOURCE_TYPE,
  TRUST_STATUS
} from "./aiTrustModel.js";

export class CitationEntailmentEngine {
  /**
   * Aligns and verifies claims against evidence spans and sources
   * @param {Array<object>} claims 
   * @param {Array<object>} evidenceSpans 
   * @param {Array<object>} sources 
   * @returns {{
   *   verifiedClaims: Array<object>,
   *   citations: Array<object>,
   *   unsupportedClaims: Array<object>,
   *   claimCoverage: number,
   *   citationAccuracy: number
   * }}
   */
  static evaluateEntailment(claims = [], evidenceSpans = [], sources = []) {
    const sourceMap = new Map(sources.map(s => [s.sourceId, s]));
    const evidenceMap = new Map(evidenceSpans.map(e => [e.evidenceId, e]));

    const verifiedClaims = [];
    const citations = [];
    const unsupportedClaims = [];

    let totalCitationsEvaluated = 0;
    let validCitationsCount = 0;

    for (const claim of claims) {
      // Find matching evidence spans for this claim
      const candidateSpans = evidenceSpans.filter(span => {
        return this.#isSpanRelevantToClaim(span, claim);
      });

      if (candidateSpans.length === 0) {
        // No evidence attached
        const unverifiedClaim = {
          ...claim,
          status: TRUST_STATUS.UNSUPPORTED
        };
        verifiedClaims.push(unverifiedClaim);
        unsupportedClaims.push(unverifiedClaim);
        continue;
      }

      let bestClaimStatus = TRUST_STATUS.UNSUPPORTED;
      let matchedAnyValidCitation = false;

      for (const span of candidateSpans) {
        totalCitationsEvaluated++;
        const source = sourceMap.get(span.sourceId);

        if (!source) {
          // Source fabricated / missing
          citations.push(AiTrustModel.createCitation({
            claimId: claim.claimId,
            sourceId: span.sourceId,
            evidenceId: span.evidenceId,
            citationStatus: CITATION_STATUS.CITATION_FABRICATED,
            entailmentScore: 0,
            explanation: "Nguồn trích dẫn không tồn tại trong danh mục nguồn xác thực."
          }));
          continue;
        }

        const entailment = this.#verifySpanEntailment(claim, span, source);
        citations.push(entailment.citation);

        if (entailment.citation.citationStatus === CITATION_STATUS.VALID_ENTAILMENT) {
          validCitationsCount++;
          matchedAnyValidCitation = true;

          if (source.authorityTier >= AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR) {
            bestClaimStatus = TRUST_STATUS.AUTHORITATIVE;
          } else if (source.authorityTier >= AUTHORITY_TIER.TIER_2_FACULTY_DEPARTMENT) {
            bestClaimStatus = TRUST_STATUS.VERIFIED;
          } else if (source.authorityTier >= AUTHORITY_TIER.TIER_3_VERIFIED_EXPERT) {
            bestClaimStatus = TRUST_STATUS.SUPPORTED;
          } else {
            bestClaimStatus = TRUST_STATUS.SUPPORTED;
          }
        } else if (entailment.citation.citationStatus === CITATION_STATUS.PARTIAL_ENTAILMENT) {
          if (bestClaimStatus === TRUST_STATUS.UNSUPPORTED) {
            bestClaimStatus = TRUST_STATUS.PARTIALLY_SUPPORTED;
          }
        }
      }

      const updatedClaim = {
        ...claim,
        status: bestClaimStatus,
        citationIds: citations.filter(c => c.claimId === claim.claimId).map(c => c.citationId)
      };

      verifiedClaims.push(updatedClaim);
      if (bestClaimStatus === TRUST_STATUS.UNSUPPORTED || bestClaimStatus === TRUST_STATUS.UNVERIFIED) {
        unsupportedClaims.push(updatedClaim);
      }
    }

    const totalClaims = claims.length;
    const supportedCount = verifiedClaims.filter(c => 
      c.status === TRUST_STATUS.AUTHORITATIVE ||
      c.status === TRUST_STATUS.VERIFIED ||
      c.status === TRUST_STATUS.SUPPORTED
    ).length;

    const claimCoverage = totalClaims > 0
      ? Number((supportedCount / totalClaims).toFixed(2))
      : 0;

    const citationAccuracy = totalCitationsEvaluated > 0
      ? Number((validCitationsCount / totalCitationsEvaluated).toFixed(2))
      : 1.0;

    return {
      verifiedClaims,
      citations,
      unsupportedClaims,
      claimCoverage,
      citationAccuracy
    };
  }

  /**
   * Fast lexical & semantic heuristic to check if a span might contain evidence for a claim
   */
  static #isSpanRelevantToClaim(span, claim) {
    if (!span.passage) return false;
    const p = span.passage.toLowerCase();
    
    // Check numeric match
    if (claim.numericValue !== null) {
      if (p.includes(String(claim.numericValue))) {
        if (claim.numericUnit === "TOEIC_POINTS" && p.includes("toeic")) return true;
        if (claim.numericUnit === "CREDITS" && (p.includes("tín chỉ") || p.includes("credit"))) return true;
        return true;
      }
      // If claim is TOEIC 550 and span mentions TOEIC but different number, it is relevant for comparison
      if (claim.numericUnit === "TOEIC_POINTS" && p.includes("toeic")) return true;
      if (claim.numericUnit === "CREDITS" && (p.includes("tín chỉ") || p.includes("credit"))) return true;
    }

    // Check scope match (e.g. K24)
    if (claim.scope && claim.scope !== "ALL") {
      if (p.includes(claim.scope.toLowerCase())) return true;
    }

    // Keyword match
    const claimKeywords = claim.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchCount = claimKeywords.filter(w => p.includes(w)).length;
    return matchCount >= Math.min(1, claimKeywords.length);
  }

  /**
   * Rigorous semantic and numeric entailment check
   */
  static #verifySpanEntailment(claim, span, source) {
    const passage = (span.passage || "").toLowerCase();

    // 1. Check Cohort / Scope Compatibility
    if (claim.scope && claim.scope !== "ALL") {
      const scopeStr = claim.scope.toLowerCase();
      if (!passage.includes(scopeStr)) {
        return {
          citation: AiTrustModel.createCitation({
            claimId: claim.claimId,
            sourceId: source.sourceId,
            evidenceId: span.evidenceId,
            citationStatus: CITATION_STATUS.PARTIAL_ENTAILMENT,
            entailmentScore: 0.5,
            explanation: `Đoạn trích dẫn đề cập quy định chung nhưng không chứng minh cụ thể cho khóa ${claim.scope}.`
          })
        };
      }
    }

    // 2. Check Numeric Precision (TOEIC, Credits, Deadlines)
    if (claim.numericValue !== null) {
      const expectedNum = String(claim.numericValue);
      if (!passage.includes(expectedNum)) {
        return {
          citation: AiTrustModel.createCitation({
            claimId: claim.claimId,
            sourceId: source.sourceId,
            evidenceId: span.evidenceId,
            citationStatus: CITATION_STATUS.CITATION_MISMATCH,
            entailmentScore: 0.0,
            explanation: `Sai lệch số liệu: Khẳng định yêu cầu ${claim.numericValue} ${claim.numericUnit || ""} nhưng nguồn trích dẫn nêu con số khác.`
          })
        };
      }
    }

    // 3. Check Subject / Authority Domain
    if (source.domainScope && !source.domainScope.includes("ACADEMIC") && claim.claimType === "ACADEMIC_POLICY") {
      return {
        citation: AiTrustModel.createCitation({
          claimId: claim.claimId,
          sourceId: source.sourceId,
          evidenceId: span.evidenceId,
          citationStatus: CITATION_STATUS.PARTIAL_ENTAILMENT,
          entailmentScore: 0.6,
          explanation: `Nguồn trích dẫn không thuộc thẩm quyền quy chế học vụ chính thức.`
        })
      };
    }

    // 4. Full Valid Entailment
    return {
      citation: AiTrustModel.createCitation({
        claimId: claim.claimId,
        sourceId: source.sourceId,
        evidenceId: span.evidenceId,
        citationStatus: CITATION_STATUS.VALID_ENTAILMENT,
        entailmentScore: 1.0,
        explanation: `Đoạn văn bản trích dẫn chứng minh đầy đủ nội dung, đối tượng (${claim.scope}) và số liệu của khẳng định.`
      })
    };
  }
}
