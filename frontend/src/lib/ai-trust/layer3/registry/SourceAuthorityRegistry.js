/**
 * Layer 3 — SourceAuthorityRegistry
 * 
 * Manages domain- and claim-specific authority tiers and scores.
 * Enforces the core principle: "Authority is claim-specific, not absolute."
 */

import { SOURCE_AUTHORITY_TIER } from "../types.js";
import { LAYER_3_CONFIG } from "../config/Layer3Config.js";
import { BRAND_REGISTRY } from "../../layer1/registry/BrandRegistry.js";
import { CANONICAL_AUTHORITY_CATALOG, CONTEXTUAL_OFFICIAL_DOMAIN_RULES } from "./CanonicalAuthorityCatalog.js";

const MANUAL_DOMAIN_AUTHORITY_CATALOG = [
  // ==========================================
  // 1. VIETNAMESE UNIVERSITIES (.edu.vn)
  // ==========================================
  {
    domain: "hcmute.edu.vn",
    organization: "Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)",
    aliases: ["đại học sư phạm kỹ thuật tp hcm", "hcmute"],
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
    aliases: ["đại học quốc gia tp hcm", "vietnam national university ho chi minh city", "vnuhcm"],
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
    aliases: ["đại học bách khoa tp hcm", "hcmut"],
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { institutional: 0.98, admission: 0.98 },
    isOfficial: true,
  },
  {
    domain: "uit.edu.vn",
    organization: "Trường Đại học Công nghệ Thông tin (UIT)",
    aliases: ["đại học công nghệ thông tin", "uit"],
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { institutional: 0.98, admission: 0.98 },
    isOfficial: true,
  },
  {
    domain: "hust.edu.vn",
    organization: "Đại học Bách Khoa Hà Nội (HUST)",
    aliases: ["đại học bách khoa hà nội", "hust"],
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { institutional: 0.98, admission: 0.98 },
    isOfficial: true,
  },
  {
    domain: "neu.edu.vn",
    organization: "Trường Đại học Kinh tế Quốc dân (NEU)",
    aliases: ["đại học kinh tế quốc dân", "neu", "national economics university"],
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { institutional: 0.98, admission: 0.98, tuition: 0.99, scholarship: 0.99 },
    isOfficial: true,
  },
  {
    domain: "ftu.edu.vn",
    organization: "Trường Đại học Ngoại thương (FTU)",
    aliases: ["đại học ngoại thương", "ftu", "foreign trade university vietnam"],
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { institutional: 0.98, admission: 0.98, tuition: 0.99, scholarship: 0.99 },
    isOfficial: true,
  },
  {
    domain: "ueh.edu.vn",
    organization: "Đại học Kinh tế TP.HCM (UEH)",
    aliases: ["đại học kinh tế tp hcm", "ueh", "university of economics ho chi minh city"],
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { institutional: 0.98, admission: 0.98, tuition: 0.99, scholarship: 0.99 },
    isOfficial: true,
  },

  // ==========================================
  // 2. VIETNAMESE GOVERNMENT & PUBLIC SERVICES (.gov.vn)
  // ==========================================
  {
    domain: "moet.gov.vn",
    organization: "Bộ Giáo dục và Đào tạo (MOET)",
    aliases: ["bộ giáo dục và đào tạo", "moet", "ministry of education and training vietnam", "vietnam ministry of education"],
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
    aliases: ["cổng dịch vụ công quốc gia", "national public service portal vietnam"],
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { legal: 0.99, public_service: 0.99 },
    isOfficial: true,
  },
  {
    domain: "vneid.gov.vn",
    organization: "Định danh điện tử VNeID - Bộ Công An",
    aliases: ["vneid", "định danh điện tử quốc gia"],
    tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
    authorityProfiles: { identity: 0.99, biometrics: 0.99, legal: 0.99 },
    isOfficial: true,
  },
  {
    domain: "bocongan.gov.vn",
    organization: "Bộ Công An Việt Nam",
    aliases: ["bộ công an", "ministry of public security vietnam"],
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

const seenDomains = new Set([
  ...MANUAL_DOMAIN_AUTHORITY_CATALOG,
  ...CANONICAL_AUTHORITY_CATALOG,
].map((item) => item.domain.toLowerCase()));
const curatedEducationAuthorityEntries = [];
for (const brand of BRAND_REGISTRY) {
  if (brand?.category !== "education" || !Array.isArray(brand.canonicalDomains)) continue;
  for (const value of brand.canonicalDomains) {
    const domain = typeof value === "string" ? value.toLowerCase().replace(/^www\./, "") : "";
    if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(domain) || !domain.includes(".") || seenDomains.has(domain)) continue;
    seenDomains.add(domain);
    curatedEducationAuthorityEntries.push({
      domain,
      organization: brand.name || domain,
      tier: SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE,
      authorityProfiles: { institutional: 0.92, admission: 0.90, tuition: 0.90, scholarship: 0.90 },
      isOfficial: true,
    });
  }
}

export const DOMAIN_AUTHORITY_CATALOG = [
  ...MANUAL_DOMAIN_AUTHORITY_CATALOG,
  ...CANONICAL_AUTHORITY_CATALOG,
  ...curatedEducationAuthorityEntries,
];

function normalizedAuthorityText(value) {
  return typeof value === "string"
    ? value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\btp\b/g, "thanh pho")
      .replace(/\bdh\b/g, "dai hoc")
      .replace(/\b(?:hcmc|hcm)\b/g, "ho chi minh")
      .replace(/\btruong\b/g, " ")
      .replace(/\s+/g, " ").trim()
    : "";
}

export class SourceAuthorityRegistry {
  /**
   * Resolve only explicit organization/service mentions to curated official
   * domains. Ambiguous generic suffixes and inferred TLDs are never used.
   */
  static resolveCanonicalDomains(text, { limit = 3 } = {}) {
    const query = ` ${normalizedAuthorityText(text)} `;
    if (query.trim().length < 4) return [];

    const matches = [];
    for (const item of DOMAIN_AUTHORITY_CATALOG) {
      if (item.isOfficial !== true) continue;
      const organizationAcronym = typeof item.organization === "string"
        ? item.organization.match(/\(([A-Z0-9]{2,8})\)\s*$/)?.[1]
        : null;
      const organizationWithoutAcronym = organizationAcronym
        ? item.organization.replace(/\s*\([A-Z0-9]{2,8}\)\s*$/, "")
        : null;
      const aliases = [item.organization, organizationWithoutAcronym, ...(Array.isArray(item.aliases) ? item.aliases : [])]
        .map(normalizedAuthorityText)
        .filter((alias) => alias.length >= 3);
      const matchedAlias = aliases
        .filter((alias) => alias === "mit"
          ? /\bMIT\b/.test(text)
          : query.includes(` ${alias} `))
        .sort((left, right) => right.length - left.length)[0];
      if (matchedAlias) matches.push({ domain: item.domain, matchLength: matchedAlias.length });
    }

    for (const rule of CONTEXTUAL_OFFICIAL_DOMAIN_RULES) {
      if (rule.pattern.test(text)) {
        for (const domain of rule.domains) matches.push({ domain, matchLength: 0 });
      }
    }

    const strongestByDomain = new Map();
    for (const match of matches.sort((left, right) => right.matchLength - left.matchLength)) {
      if (!strongestByDomain.has(match.domain)) strongestByDomain.set(match.domain, match.matchLength);
    }
    const boundedLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(5, Math.floor(Number(limit)))) : 3;
    return [...strongestByDomain.keys()].slice(0, boundedLimit);
  }

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

    if (typeof urlOrDomain !== "string") {
      return {
        tier: SOURCE_AUTHORITY_TIER.TIER_1_UNKNOWN_LOW,
        score: LAYER_3_CONFIG.AUTHORITY_SCORES.TIER_1_UNKNOWN_LOW,
        basis: ["invalid_source_identifier"],
        organization: "Unknown Source",
        isOfficial: false,
      };
    }

    let hostname = urlOrDomain.toLowerCase().trim().replace(/\.$/, "");
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
        const hasClaimProfile = Object.prototype.hasOwnProperty.call(item.authorityProfiles, claimType);
        const typeScore = hasClaimProfile
          ? item.authorityProfiles[claimType]
          : Math.min(LAYER_3_CONFIG.AUTHORITY_SCORES.TIER_3_REPUTABLE_SECONDARY, item.isOfficial ? 0.60 : 0.55);
        return {
          tier: item.tier,
          score: typeScore,
          basis: [
              item.isOfficial ? "registered_institutional_domain" : "reputable_secondary_press",
              `claim_type_relevance_${claimType}`,
              ...(hasClaimProfile ? [] : ["claim_type_not_explicitly_authorized"]),
            ],
            organization: item.organization,
            isOfficial: item.isOfficial,
            authorityScope: Object.keys(item.authorityProfiles),
            claimSpecificMatch: hasClaimProfile,
        };
      }
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
