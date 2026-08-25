/**
 * Layer 3 — SourceAuthorityRegistry
 * 
 * Manages domain- and claim-specific authority tiers and scores.
 * Enforces the core principle: "Authority is claim-specific, not absolute."
 */

import { SOURCE_AUTHORITY_TIER } from "../types.js";
import { LAYER_3_CONFIG } from "../config/Layer3Config.js";

export const DOMAIN_AUTHORITY_CATALOG = [
  // ==========================================
  // 1. VIETNAMESE UNIVERSITIES (.edu.vn)
  // ==========================================
  {
    domain: "hcmute.edu.vn",
    organization: "Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: {
      institutional: 0.98,
      admission: 0.98,
      tuition: 0.99,
      scholarship: 0.99,
      scientific_claim: 0.75,
    },
    isOfficial: true,
  },
  {
    domain: "vnuhcm.edu.vn",
    organization: "Đại học Quốc gia TP.HCM (VNU-HCM)",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: {
      institutional: 0.98,
      scholarship: 0.98,
      policy: 0.98,
    },
    isOfficial: true,
  },
  {
    domain: "hcmut.edu.vn",
    organization: "Trường Đại học Bách Khoa TP.HCM (HCMUT)",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { institutional: 0.98, admission: 0.98 },
    isOfficial: true,
  },
  {
    domain: "uit.edu.vn",
    organization: "Trường Đại học Công nghệ Thông tin (UIT)",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { institutional: 0.98, admission: 0.98 },
    isOfficial: true,
  },
  {
    domain: "hust.edu.vn",
    organization: "Đại học Bách Khoa Hà Nội (HUST)",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { institutional: 0.98, admission: 0.98 },
    isOfficial: true,
  },

  // ==========================================
  // 2. VIETNAMESE GOVERNMENT & PUBLIC SERVICES (.gov.vn)
  // ==========================================
  {
    domain: "moet.gov.vn",
    organization: "Bộ Giáo dục và Đào tạo (MOET)",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: {
      legal: 0.99,
      policy: 0.99,
      education_standard: 0.99,
      institutional: 0.95,
    },
    isOfficial: true,
  },
  {
    domain: "dichvucong.gov.vn",
    organization: "Cổng Dịch vụ công Quốc gia",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { legal: 0.99, public_service: 0.99 },
    isOfficial: true,
  },
  {
    domain: "vneid.gov.vn",
    organization: "Định danh điện tử VNeID - Bộ Công An",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { identity: 0.99, biometrics: 0.99, legal: 0.99 },
    isOfficial: true,
  },
  {
    domain: "bocongan.gov.vn",
    organization: "Bộ Công An Việt Nam",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { legal: 0.99, security_alert: 0.99 },
    isOfficial: true,
  },

  // ==========================================
  // 3. VIETNAMESE BANKS & FINTECH
  // ==========================================
  {
    domain: "vietcombank.com.vn",
    organization: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: {
      financial: 0.99,
      banking_security: 0.99,
      biometrics_policy: 0.99,
    },
    isOfficial: true,
  },
  {
    domain: "mbbank.com.vn",
    organization: "Ngân hàng TMCP Quân đội (MBBank)",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { financial: 0.99, banking_security: 0.99 },
    isOfficial: true,
  },
  {
    domain: "techcombank.com",
    organization: "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)",
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { financial: 0.99, banking_security: 0.99 },
    isOfficial: true,
  },

  // ==========================================
  // 4. MAJOR REPUTABLE PRESS & MAINSTREAM NEWS (TIER 4)
  // ==========================================
  {
    domain: "vnexpress.net",
    organization: "Báo điện tử VnExpress",
    tier: SOURCE_AUTHORITY_TIER.TIER_4_HIGH_REPUTABLE_SECONDARY,
    authorityProfiles: {
      breaking_news: 0.88,
      education_news: 0.88,
      institutional: 0.80,
    },
    isOfficial: false,
  },
  {
    domain: "tuoitre.vn",
    organization: "Báo Tuổi Trẻ",
    tier: SOURCE_AUTHORITY_TIER.TIER_4_HIGH_REPUTABLE_SECONDARY,
    authorityProfiles: {
      breaking_news: 0.88,
      education_news: 0.88,
      institutional: 0.80,
    },
    isOfficial: false,
  },
  {
    domain: "thanhnien.vn",
    organization: "Báo Thanh Niên",
    tier: SOURCE_AUTHORITY_TIER.TIER_4_HIGH_REPUTABLE_SECONDARY,
    authorityProfiles: {
      breaking_news: 0.85,
      education_news: 0.85,
      institutional: 0.78,
    },
    isOfficial: false,
  },
  {
    domain: "dantri.com.vn",
    organization: "Báo điện tử Dân Trí",
    tier: SOURCE_AUTHORITY_TIER.TIER_4_HIGH_REPUTABLE_SECONDARY,
    authorityProfiles: {
      breaking_news: 0.85,
      education_news: 0.85,
      institutional: 0.78,
    },
    isOfficial: false,
  },
  {
    domain: "vtv.vn",
    organization: "Đài Truyền hình Việt Nam (VTV)",
    tier: SOURCE_AUTHORITY_TIER.TIER_4_HIGH_REPUTABLE_SECONDARY,
    authorityProfiles: {
      breaking_news: 0.90,
      education_news: 0.88,
      institutional: 0.82,
    },
    isOfficial: false,
  },
];

export class SourceAuthorityRegistry {
  /**
   * Looks up authority profile for a given domain or URL
   * @param {string} urlOrDomain
   * @param {string} claimType - 'institutional' | 'financial' | 'legal' | etc.
   * @returns {object} { tier, score, basis, organization, isOfficial }
   */
  static evaluateAuthority(urlOrDomain, claimType = "general") {
    if (!urlOrDomain) {
      return {
        tier: SOURCE_AUTHORITY_TIER.TIER_1_UNKNOWN_LOW,
        score: LAYER_3_CONFIG.AUTHORITY_SCORES.TIER_1_UNKNOWN_LOW,
        basis: ["unknown_domain"],
        organization: "Unknown Source",
        isOfficial: false,
      };
    }

    let hostname = urlOrDomain.toLowerCase().trim();
    try {
      if (hostname.startsWith("http://") || hostname.startsWith("https://")) {
        hostname = new URL(hostname).hostname;
      }
    } catch {
      // keep original
    }

    // Direct match against registry
    for (const item of DOMAIN_AUTHORITY_CATALOG) {
      if (hostname === item.domain || hostname.endsWith(`.${item.domain}`)) {
        const typeScore = item.authorityProfiles[claimType] || item.authorityProfiles.institutional || 0.85;
        return {
          tier: item.tier,
          score: typeScore,
          basis: [
            item.isOfficial ? "official_institutional_domain" : "reputable_secondary_press",
            `claim_type_relevance_${claimType}`,
          ],
          organization: item.organization,
          isOfficial: item.isOfficial,
        };
      }
    }

    // Heuristics for .gov.vn or .edu.vn
    if (hostname.endsWith(".gov.vn")) {
      return {
        tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
        score: 0.95,
        basis: ["national_government_tld"],
        organization: "Cơ quan Nhà nước Việt Nam",
        isOfficial: true,
      };
    }

    if (hostname.endsWith(".edu.vn")) {
      return {
        tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
        score: 0.92,
        basis: ["accredited_higher_education_tld"],
        organization: "Cơ sở Giáo dục Đại học Việt Nam",
        isOfficial: true,
      };
    }

    // Default unverified / unknown domain
    return {
      tier: SOURCE_AUTHORITY_TIER.TIER_1_UNKNOWN_LOW,
      score: LAYER_3_CONFIG.AUTHORITY_SCORES.TIER_1_UNKNOWN_LOW,
      basis: ["unregistered_external_source"],
      organization: hostname,
      isOfficial: false,
    };
  }
}
