/**
 * StudentHub AI — Expert Query & Context Answering Engine V1
 * 
 * Provides evidence-backed answers for expert knowledge queries,
 * matching requested domains against verified scope graphs and enforcing
 * transparent limitations (never presenting false authority scores).
 */

import { ExpertStore } from "./expertStore.js";
import { ExpertScopeEngine } from "./expertScopeEngine.js";
import {
  EXPERTISE_LEVEL,
  QUERY_ANSWER_MODE,
  JURISDICTION_TYPE
} from "./expertIntelligenceModel.js";

export class ExpertQueryEngine {
  /**
   * Evaluates a domain query to find credible, verified experts
   * @param {string} domain Domain identifier (e.g. "AI_ML", "ACADEMIC_REGULATION")
   * @param {object} options Query options
   * @returns {object} Query response
   */
  static findExpertsForDomain(domain = "AI_ML", options = {}) {
    const targetDomain = String(domain).trim().toUpperCase();
    const allExperts = ExpertStore.getAllExperts({ redactPrivate: true });

    const matchedExperts = [];
    const partialExperts = [];

    for (const exp of allExperts) {
      const matchedScope = exp.scopes.find(s => s.domain === targetDomain);
      if (matchedScope) {
        if (matchedScope.level === EXPERTISE_LEVEL.STRONG) {
          matchedExperts.push({
            expertId: exp.expertId,
            name: exp.name,
            title: exp.title,
            institution: exp.institution,
            department: exp.department,
            isVerified: exp.isVerified,
            scopeLevel: matchedScope.level,
            subdomain: matchedScope.subdomain,
            citationCount: matchedScope.citationCount,
            recencyYear: matchedScope.recencyYear,
            hasRegistrarAuthority: exp.hasRegistrarAuthority
          });
        } else if (matchedScope.level === EXPERTISE_LEVEL.MODERATE) {
          partialExperts.push({
            expertId: exp.expertId,
            name: exp.name,
            title: exp.title,
            institution: exp.institution,
            department: exp.department,
            isVerified: exp.isVerified,
            scopeLevel: matchedScope.level,
            subdomain: matchedScope.subdomain,
            citationCount: matchedScope.citationCount,
            recencyYear: matchedScope.recencyYear,
            hasRegistrarAuthority: exp.hasRegistrarAuthority
          });
        }
      }
    }

    return {
      domain: targetDomain,
      totalMatches: matchedExperts.length + partialExperts.length,
      strongMatches: matchedExperts,
      moderateMatches: partialExperts,
      limitations: [
        "Chuyên môn học thuật không đồng nghĩa với thẩm quyền ban hành quy chế hành chính.",
        "Ý kiến chuyên gia mang tính nhận định tham khảo và phương pháp luận nghiên cứu."
      ]
    };
  }

  /**
   * Answers a specific query about an expert's authority/expertise
   * @param {string} expertId Expert ID
   * @param {string} claimText Question or statement to evaluate
   * @param {string} claimDomain Claim domain
   * @param {string} claimJurisdiction Jurisdiction
   * @returns {object}
   */
  static evaluateExpertAuthority(expertId, claimText, claimDomain, claimJurisdiction = "TECHNICAL_DOMAIN") {
    const expert = ExpertStore.getExpert(expertId, { redactPrivate: false });
    if (!expert) {
      return {
        success: false,
        answerMode: QUERY_ANSWER_MODE.UNVERIFIED_EXPERT,
        explanation: `Không tìm thấy chuyên gia với mã ID: ${expertId}`
      };
    }

    const evaluation = ExpertScopeEngine.evaluateClaimScope(expert, {
      expertId,
      text: claimText,
      domain: claimDomain,
      claimJurisdiction
    });

    return {
      success: true,
      expert: {
        expertId: expert.expertId,
        name: expert.name,
        title: expert.title,
        institution: expert.institution,
        department: expert.department,
        isVerified: expert.isVerified,
        hasRegistrarAuthority: expert.hasRegistrarAuthority
      },
      evaluation
    };
  }
}
