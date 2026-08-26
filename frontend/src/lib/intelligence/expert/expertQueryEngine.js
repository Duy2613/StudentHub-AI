/**
 * StudentHub AI — Expert Query & Knowledge Engine V2
 * 
 * Supports 7 Canonical Expert Intelligence Query Types:
 * 1. "Is this person an expert in X?"
 * 2. "Is this person currently affiliated with Y?"
 * 3. "Is this expert qualified to comment on Z?"
 * 4. "Who has verified expertise in X?"
 * 5. "Why is this expert relevant?"
 * 6. "When was this expert last active in X?"
 * 7. "Where is this expert outside established scope?"
 */

import { ExpertStore } from "./expertStore.js";
import { ExpertScopeEngine } from "./expertScopeEngine.js";
import { ExpertContextEngine } from "./expertContextEngine.js";
import {
  EXPERTISE_LEVEL,
  QUERY_ANSWER_MODE,
  JURISDICTION_TYPE,
  EXPERT_STATUS
} from "./expertIntelligenceModel.js";

export class ExpertQueryEngine {
  /**
   * 1. Query: "Who has verified expertise in X?"
   */
  static findExpertsForDomain(domain = "AI_ML", options = {}) {
    const targetDomain = String(domain).trim().toUpperCase();
    const allExperts = ExpertStore.getAllExperts({ redactPrivate: true });

    const strongMatches = [];
    const moderateMatches = [];

    for (const exp of allExperts) {
      if (!exp.isVerified) continue;

      const matchedScope = exp.scopes.find(s => s.domain === targetDomain);
      if (matchedScope) {
        if (matchedScope.level === EXPERTISE_LEVEL.ESTABLISHED) {
          strongMatches.push({
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
        } else if (matchedScope.level === EXPERTISE_LEVEL.SUPPORTED || matchedScope.level === EXPERTISE_LEVEL.EMERGING) {
          moderateMatches.push({
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
      totalMatches: strongMatches.length + moderateMatches.length,
      strongMatches,
      moderateMatches,
      limitations: [
        "Chuyên môn học thuật không đồng nghĩa với thẩm quyền ban hành quy chế hành chính.",
        "Ý kiến chuyên gia mang tính nhận định tham khảo và phương pháp luận nghiên cứu."
      ]
    };
  }

  /**
   * 2. Query: "Is this person an expert in X?"
   */
  static isExpertInDomain(expertId, domain) {
    const expert = ExpertStore.getExpert(expertId);
    if (!expert) return { isExpert: false, status: "NOT_FOUND", explanation: "Không tìm thấy chuyên gia." };

    const targetDomain = String(domain).trim().toUpperCase();
    const scope = expert.scopes.find(s => s.domain === targetDomain);

    if (scope && (scope.level === EXPERTISE_LEVEL.ESTABLISHED || scope.level === EXPERTISE_LEVEL.SUPPORTED)) {
      return {
        isExpert: true,
        expertId: expert.expertId,
        name: expert.name,
        domain: targetDomain,
        level: scope.level,
        subdomain: scope.subdomain,
        citationCount: scope.citationCount,
        recencyYear: scope.recencyYear,
        explanation: `Đã xác thực chuyên môn ${scope.level} trong lĩnh vực ${targetDomain}.`
      };
    }

    return {
      isExpert: false,
      expertId: expert.expertId,
      name: expert.name,
      domain: targetDomain,
      level: scope?.level || EXPERTISE_LEVEL.OUT_OF_SCOPE,
      explanation: `Chuyên gia không có bằng chứng nghiên cứu được xác thực trong lĩnh vực ${targetDomain}.`
    };
  }

  /**
   * 3. Query: "Is this person currently affiliated with Y?"
   */
  static isCurrentlyAffiliatedWith(expertId, institution) {
    const expert = ExpertStore.getExpert(expertId);
    if (!expert) return { isAffiliated: false, status: "NOT_FOUND" };

    const targetInst = String(institution).trim().toLowerCase();
    const activeRole = expert.roles.find(r => r.isCurrent && r.organization.toLowerCase().includes(targetInst));

    const isMatch = expert.institution.toLowerCase().includes(targetInst) && (expert.affiliationStatus === "VERIFIED_ACTIVE" || Boolean(activeRole));

    return {
      isAffiliated: isMatch,
      expertId: expert.expertId,
      name: expert.name,
      institution: expert.institution,
      currentRole: activeRole?.roleTitle || expert.title,
      affiliationStatus: expert.affiliationStatus,
      isCurrent: isMatch
    };
  }

  /**
   * 4. Query: "Is this expert qualified to comment on Z?"
   */
  static isQualifiedToComment(expertId, claimText, claimDomain, claimJurisdiction = "TECHNICAL_DOMAIN") {
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
        isVerified: expert.isVerified,
        hasRegistrarAuthority: expert.hasRegistrarAuthority
      },
      evaluation
    };
  }

  /**
   * 5. Query: "Why is this expert relevant?"
   */
  static whyThisExpertRelevant(expertId) {
    const expert = ExpertStore.getExpert(expertId, { redactPrivate: true });
    if (!expert) return null;
    return ExpertContextEngine.generateWhyThisExpert(expert);
  }

  /**
   * 6. Query: "When was this expert last active in X?"
   */
  static whenLastActiveInDomain(expertId, domain) {
    const expert = ExpertStore.getExpert(expertId);
    if (!expert) return { lastActiveYear: null, status: "NOT_FOUND" };

    const targetDomain = String(domain).trim().toUpperCase();
    const domainPubs = expert.publications.filter(p => p.domain === targetDomain);

    if (domainPubs.length > 0) {
      const maxYear = Math.max(...domainPubs.map(p => p.year));
      return {
        expertId: expert.expertId,
        name: expert.name,
        domain: targetDomain,
        lastActiveYear: maxYear,
        totalDomainPublications: domainPubs.length,
        isRecentlyActive: maxYear >= (new Date().getFullYear() - 2)
      };
    }

    const scope = expert.scopes.find(s => s.domain === targetDomain);
    return {
      expertId: expert.expertId,
      name: expert.name,
      domain: targetDomain,
      lastActiveYear: scope?.recencyYear || null,
      totalDomainPublications: 0,
      isRecentlyActive: Boolean(scope && scope.recencyYear >= (new Date().getFullYear() - 2))
    };
  }

  /**
   * 7. Query: "Where is this expert outside established scope?"
   */
  static whereOutsideEstablishedScope(expertId) {
    const expert = ExpertStore.getExpert(expertId);
    if (!expert) return null;
    return ExpertScopeEngine.generateScopeBoundaries(expert);
  }

  /**
   * Compatibility alias for evaluateExpertAuthority
   */
  static evaluateExpertAuthority(expertId, claimText, claimDomain, claimJurisdiction = "TECHNICAL_DOMAIN") {
    return this.isQualifiedToComment(expertId, claimText, claimDomain, claimJurisdiction);
  }
}
