/**
 * Layer 1 — Brand Registry & Authoritative Domain Directory
 * 
 * Maps recognized brand identities, canonical domains, and aliases.
 * Provides structural domain dissection to distinguish true owners from deceptive subdomains.
 */

export const BRAND_REGISTRY = [
  // 1. Vietnamese Higher Education & Academic Institutions
  {
    id: "hcmute",
    name: "Trường ĐH Sư phạm Kỹ thuật TP.HCM (HCMUTE)",
    canonicalDomains: ["hcmute.edu.vn"],
    aliases: ["hcmute", "spkt", "ute"],
    category: "education",
  },
  {
    id: "vnuhcm",
    name: "Đại học Quốc gia TP.HCM (VNU-HCM)",
    canonicalDomains: ["vnuhcm.edu.vn"],
    aliases: ["vnuhcm", "dhqg-tphcm", "vnu-hcm"],
    category: "education",
  },
  {
    id: "hcmut",
    name: "Trường ĐH Bách Khoa - ĐHQG TP.HCM",
    canonicalDomains: ["hcmut.edu.vn", "bknet.vn"],
    aliases: ["bachkhoa", "hcmut", "bk-tphcm"],
    category: "education",
  },
  {
    id: "uit",
    name: "Trường ĐH Công nghệ Thông tin - ĐHQG TP.HCM",
    canonicalDomains: ["uit.edu.vn"],
    aliases: ["uit", "cntt-dhqg"],
    category: "education",
  },
  {
    id: "hust",
    name: "Đại học Bách Khoa Hà Nội (HUST)",
    canonicalDomains: ["hust.edu.vn"],
    aliases: ["hust", "bachkhoa-hn"],
    category: "education",
  },
  {
    id: "vnu",
    name: "Đại học Quốc gia Hà Nội (VNU)",
    canonicalDomains: ["vnu.edu.vn"],
    aliases: ["vnu", "dhqg-hn"],
    category: "education",
  },

  // 2. Global Tech & Authentication Providers
  {
    id: "google",
    name: "Google / Gmail Services",
    canonicalDomains: ["google.com", "google.com.vn", "mail.google.com", "accounts.google.com"],
    aliases: ["google", "gmail", "googlemail"],
    category: "tech",
  },
  {
    id: "facebook",
    name: "Meta / Facebook",
    canonicalDomains: ["facebook.com", "fb.com", "meta.com"],
    aliases: ["facebook", "meta"],
    category: "tech",
  },
  {
    id: "apple",
    name: "Apple Inc.",
    canonicalDomains: ["apple.com", "icloud.com"],
    aliases: ["apple", "icloud"],
    category: "tech",
  },
  {
    id: "microsoft",
    name: "Microsoft Corporation",
    canonicalDomains: ["microsoft.com", "live.com", "office.com", "outlook.com"],
    aliases: ["microsoft", "office365", "outlook"],
    category: "tech",
  },
  {
    id: "github",
    name: "GitHub",
    canonicalDomains: ["github.com"],
    aliases: ["github"],
    category: "tech",
  },

  // 3. Banking & Financial Providers in Vietnam
  {
    id: "vietcombank",
    name: "Ngân hàng Vietcombank",
    canonicalDomains: ["vietcombank.com.vn"],
    aliases: ["vietcombank", "vcb"],
    category: "bank",
  },
  {
    id: "mbbank",
    name: "Ngân hàng Quân đội (MBBank)",
    canonicalDomains: ["mbbank.com.vn"],
    aliases: ["mbbank", "mb-bank"],
    category: "bank",
  },
  {
    id: "techcombank",
    name: "Ngân hàng Techcombank",
    canonicalDomains: ["techcombank.com", "techcombank.com.vn"],
    aliases: ["techcombank", "tcb"],
    category: "bank",
  },
  {
    id: "bidv",
    name: "Ngân hàng BIDV",
    canonicalDomains: ["bidv.com.vn"],
    aliases: ["bidv"],
    category: "bank",
  },
  {
    id: "vnpay",
    name: "Ví điện tử VNPAY",
    canonicalDomains: ["vnpay.vn"],
    aliases: ["vnpay"],
    category: "payment",
  },
  {
    id: "momo",
    name: "Ví điện tử MoMo",
    canonicalDomains: ["momo.vn"],
    aliases: ["momo"],
    category: "payment",
  },
  {
    id: "paypal",
    name: "PayPal International",
    canonicalDomains: ["paypal.com"],
    aliases: ["paypal"],
    category: "payment",
  },

  // 4. E-Commerce Platforms
  {
    id: "shopee",
    name: "Shopee Vietnam",
    canonicalDomains: ["shopee.vn"],
    aliases: ["shopee"],
    category: "ecommerce",
  },
  {
    id: "lazada",
    name: "Lazada Vietnam",
    canonicalDomains: ["lazada.vn"],
    aliases: ["lazada"],
    category: "ecommerce",
  },
  {
    id: "tiktok",
    name: "TikTok",
    canonicalDomains: ["tiktok.com"],
    aliases: ["tiktok"],
    category: "social",
  },
];

// Top-Level Domains (TLDs) with high statistical correlation to cheap scam campaigns
export const SUSPICIOUS_TLDS = new Set([
  "xyz", "top", "site", "online", "club", "work", "vip", "click", "buzz",
  "cam", "live", "monster", "rest", "bar", "cfd", "sbs", "icu", "cyou", "gq", "ml", "cf", "tk"
]);

// URL Shortener Hostnames
export const KNOWN_URL_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "shorturl.at",
  "gg.gg", "rb.gy", "buff.ly", "ow.ly", "rebrand.ly", "s.id", "v.gd"
]);

export class BrandRegistry {
  /**
   * Checks if domain is in authentic education/government whitelist
   * @param {string} hostname
   * @returns {boolean}
   */
  static isWhitelistedDomain(hostname) {
    if (!hostname) return false;
    const cleanHost = hostname.toLowerCase();

    // 1. National higher education & government suffixes
    if (cleanHost.endsWith(".edu.vn") || cleanHost.endsWith(".gov.vn")) {
      return true;
    }

    // 2. Direct canonical domain match
    return BRAND_REGISTRY.some((brand) =>
      brand.canonicalDomains.some(
        (canonical) => cleanHost === canonical || cleanHost.endsWith("." + canonical)
      )
    );
  }

  /**
   * Extracts registrable domain (eTLD+1 approximation)
   * @param {string} hostname
   * @returns {string}
   */
  static getRegistrableDomain(hostname) {
    if (!hostname) return "";
    const parts = hostname.toLowerCase().split(".");
    if (parts.length <= 2) return hostname.toLowerCase();

    // Two-part TLDs (e.g. .edu.vn, .com.vn, .gov.vn, .co.uk)
    const secondLast = parts[parts.length - 2];
    const last = parts[parts.length - 1];
    if (["vn", "uk", "jp", "kr", "au"].includes(last) && ["edu", "gov", "com", "net", "org", "co"].includes(secondLast)) {
      return parts.slice(-3).join(".");
    }

    return parts.slice(-2).join(".");
  }

  /**
   * Detects brand impersonation outside the authentic registrable domain
   * @param {string} hostname
   * @returns {object|null}
   */
  static checkBrandImpersonation(hostname) {
    if (!hostname) return null;
    const cleanHost = hostname.toLowerCase();
    const registrableDomain = this.getRegistrableDomain(cleanHost);
    const subdomainsOnly = cleanHost.replace("." + registrableDomain, "");

    for (const brand of BRAND_REGISTRY) {
      const matchesBrandAlias = brand.aliases.some((alias) => {
        return (
          cleanHost.includes(alias) ||
          cleanHost.includes(alias.replace(".", "-")) ||
          brand.canonicalDomains.some((d) => cleanHost.includes(d))
        );
      });

      if (!matchesBrandAlias) continue;

      const isOfficialDomain = brand.canonicalDomains.some(
        (canonical) => registrableDomain === canonical || cleanHost === canonical || cleanHost.endsWith("." + canonical)
      );

      if (!isOfficialDomain) {
        const isSubdomainHijack =
          brand.canonicalDomains.some((d) => cleanHost.includes(d)) ||
          brand.aliases.some((alias) => subdomainsOnly.includes(alias));

        return {
          brand: brand.name,
          brandId: brand.id,
          canonicalDomains: brand.canonicalDomains,
          registrableDomain,
          hostname: cleanHost,
          isSubdomainHijack: Boolean(isSubdomainHijack),
        };
      }
    }

    return null;
  }
}
