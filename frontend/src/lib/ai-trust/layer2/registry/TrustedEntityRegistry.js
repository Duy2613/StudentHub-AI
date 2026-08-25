/**
 * Layer 2 — TrustedEntityRegistry
 * 
 * Extensible knowledge repository of authentic organizations, universities, banks,
 * government agencies, and tech platforms.
 * 
 * Provides:
 * - Entity resolution & canonical name mapping
 * - Official domain lookups for cross-modal and impersonation verification
 * - Authority status verification for Layer 3 planning
 */

export const TRUSTED_ENTITIES = [
  // ==========================================
  // 1. VIETNAMESE UNIVERSITIES & HIGHER EDUCATION
  // ==========================================
  {
    id: "hcmute",
    name: "Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)",
    shortName: "HCMUTE",
    type: "university",
    country: "VN",
    aliases: [
      "hcmute",
      "spkt",
      "spkt tphcm",
      "đại học sư phạm kỹ thuật",
      "truong dai hoc su pham ky thuat",
      "sư phạm kỹ thuật tp.hcm",
    ],
    officialDomains: ["hcmute.edu.vn"],
    authorityRank: "high",
  },
  {
    id: "vnuhcm",
    name: "Đại học Quốc gia TP.HCM (VNU-HCM)",
    shortName: "VNU-HCM",
    type: "university",
    country: "VN",
    aliases: ["vnuhcm", "vnu-hcm", "đhqg tphcm", "đại học quốc gia tp.hcm", "dhqg tphcm"],
    officialDomains: ["vnuhcm.edu.vn"],
    authorityRank: "high",
  },
  {
    id: "hcmut",
    name: "Trường Đại học Bách Khoa TP.HCM (HCMUT)",
    shortName: "HCMUT / Bách Khoa TP.HCM",
    type: "university",
    country: "VN",
    aliases: ["hcmut", "bách khoa tphcm", "bach khoa tphcm", "bk tphcm", "dh bách khoa"],
    officialDomains: ["hcmut.edu.vn"],
    authorityRank: "high",
  },
  {
    id: "uit",
    name: "Trường Đại học Công nghệ Thông tin (UIT)",
    shortName: "UIT",
    type: "university",
    country: "VN",
    aliases: ["uit", "đại học công nghệ thông tin", "dh cntt", "cntt đhqg"],
    officialDomains: ["uit.edu.vn"],
    authorityRank: "high",
  },
  {
    id: "hust",
    name: "Đại học Bách Khoa Hà Nội (HUST)",
    shortName: "HUST / Bách Khoa HN",
    type: "university",
    country: "VN",
    aliases: ["hust", "bách khoa hà nội", "bach khoa ha noi", "bk hn", "đại học bách khoa hn"],
    officialDomains: ["hust.edu.vn"],
    authorityRank: "high",
  },
  {
    id: "neu",
    name: "Trường Đại học Kinh tế Quốc dân (NEU)",
    shortName: "NEU",
    type: "university",
    country: "VN",
    aliases: ["neu", "kinh tế quốc dân", "kinh te quoc dan", "đh ktqd"],
    officialDomains: ["neu.edu.vn"],
    authorityRank: "high",
  },
  {
    id: "ftu",
    name: "Trường Đại học Ngoại thương (FTU)",
    shortName: "FTU",
    type: "university",
    country: "VN",
    aliases: ["ftu", "ngoại thương", "ngoai thuong", "đh ngoại thương"],
    officialDomains: ["ftu.edu.vn"],
    authorityRank: "high",
  },
  {
    id: "ueh",
    name: "Đại học Kinh tế TP.HCM (UEH)",
    shortName: "UEH",
    type: "university",
    country: "VN",
    aliases: ["ueh", "đại học kinh tế tphcm", "kinh te tphcm", "đh kinh tế"],
    officialDomains: ["ueh.edu.vn"],
    authorityRank: "high",
  },

  // ==========================================
  // 2. VIETNAMESE BANKS & FINTECH
  // ==========================================
  {
    id: "vietcombank",
    name: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
    shortName: "Vietcombank",
    type: "bank",
    country: "VN",
    aliases: ["vietcombank", "vcb", "vcb digibank", "vietcombank ebanking", "ngân hàng ngoại thương"],
    officialDomains: ["vietcombank.com.vn"],
    authorityRank: "critical",
  },
  {
    id: "mbbank",
    name: "Ngân hàng TMCP Quân đội (MBBank)",
    shortName: "MBBank",
    type: "bank",
    country: "VN",
    aliases: ["mbbank", "mb bank", "mb", "ngân hàng quân đội", "ngan hang quan doi"],
    officialDomains: ["mbbank.com.vn"],
    authorityRank: "critical",
  },
  {
    id: "techcombank",
    name: "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)",
    shortName: "Techcombank",
    type: "bank",
    country: "VN",
    aliases: ["techcombank", "tcb", "ngân hàng kỹ thương"],
    officialDomains: ["techcombank.com", "techcombank.com.vn"],
    authorityRank: "critical",
  },
  {
    id: "bidv",
    name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)",
    shortName: "BIDV",
    type: "bank",
    country: "VN",
    aliases: ["bidv", "bidv smartbanking", "ngân hàng đầu tư và phát triển"],
    officialDomains: ["bidv.com.vn"],
    authorityRank: "critical",
  },
  {
    id: "acb",
    name: "Ngân hàng TMCP Á Châu (ACB)",
    shortName: "ACB",
    type: "bank",
    country: "VN",
    aliases: ["acb", "acbbank", "acb-bank", "acbone", "ngân hàng á châu"],
    officialDomains: ["acb.com.vn"],
    authorityRank: "critical",
  },
  {
    id: "momo",
    name: "Ví điện tử MoMo (M-Service)",
    shortName: "MoMo",
    type: "fintech",
    country: "VN",
    aliases: ["momo", "ví momo", "vi momo", "ví điện tử momo"],
    officialDomains: ["momo.vn"],
    authorityRank: "high",
  },
  {
    id: "zalopay",
    name: "Ví điện tử ZaloPay",
    shortName: "ZaloPay",
    type: "fintech",
    country: "VN",
    aliases: ["zalopay", "zalo pay", "ví zalopay"],
    officialDomains: ["zalopay.vn"],
    authorityRank: "high",
  },

  // ==========================================
  // 3. GOVERNMENT & PUBLIC PORTALS
  // ==========================================
  {
    id: "dichvucong",
    name: "Cổng Dịch vụ công Quốc gia",
    shortName: "Dịch vụ công Quốc gia",
    type: "government",
    country: "VN",
    aliases: ["dịch vụ công", "dich vu cong", "cổng dịch vụ công quốc gia", "dichvucong"],
    officialDomains: ["dichvucong.gov.vn"],
    authorityRank: "critical",
  },
  {
    id: "vneid",
    name: "Ứng dụng Định danh điện tử Quốc gia (VNeID - Bộ Công An)",
    shortName: "VNeID",
    type: "government",
    country: "VN",
    aliases: ["vneid", "định danh điện tử", "dinh danh dien tu", "vneid cấp 2", "bộ công an"],
    officialDomains: ["vneid.gov.vn", "bocongan.gov.vn"],
    authorityRank: "critical",
  },
  {
    id: "moet",
    name: "Bộ Giáo dục và Đào tạo (MOET)",
    shortName: "Bộ GD&ĐT",
    type: "government",
    country: "VN",
    aliases: ["bộ giáo dục", "bo giao duc", "bộ gd&đt", "bộ gdđt", "moet"],
    officialDomains: ["moet.gov.vn"],
    authorityRank: "high",
  },

  // ==========================================
  // 4. GLOBAL TECH PLATFORMS
  // ==========================================
  {
    id: "google",
    name: "Google LLC",
    shortName: "Google",
    type: "tech",
    country: "US",
    aliases: ["google", "google security", "google workspace", "gmail", "google drive"],
    officialDomains: ["google.com", "google.com.vn", "gmail.com"],
    authorityRank: "high",
  },
  {
    id: "microsoft",
    name: "Microsoft Corporation",
    shortName: "Microsoft",
    type: "tech",
    country: "US",
    aliases: ["microsoft", "msft", "office 365", "microsoft 365", "outlook"],
    officialDomains: ["microsoft.com", "office.com", "outlook.com"],
    authorityRank: "high",
  },
  {
    id: "apple",
    name: "Apple Inc.",
    shortName: "Apple",
    type: "tech",
    country: "US",
    aliases: ["apple", "apple id", "icloud", "app store"],
    officialDomains: ["apple.com", "icloud.com"],
    authorityRank: "high",
  },
  {
    id: "shopee",
    name: "Shopee Vietnam",
    shortName: "Shopee",
    type: "ecommerce",
    country: "VN",
    aliases: ["shopee", "shopee vn", "sàn shopee", "ctv shopee"],
    officialDomains: ["shopee.vn"],
    authorityRank: "medium",
  },
];

export class TrustedEntityRegistry {
  /**
   * Finds an entity by name, alias or domain
   * @param {string} text
   * @returns {object|null}
   */
  static findEntity(text) {
    if (!text || typeof text !== "string") return null;
    const lower = text.toLowerCase().trim();

    for (const entity of TRUSTED_ENTITIES) {
      if (entity.id === lower || entity.name.toLowerCase() === lower || entity.shortName.toLowerCase() === lower) {
        return entity;
      }
      for (const alias of entity.aliases) {
        if (alias === lower || lower.includes(alias)) {
          return entity;
        }
      }
      for (const domain of entity.officialDomains) {
        if (lower.includes(domain)) {
          return entity;
        }
      }
    }
    return null;
  }

  /**
   * Extracts all referenced entities from text
   * @param {string} text
   * @returns {Array<object>}
   */
  static extractAllEntities(text) {
    if (!text || typeof text !== "string") return [];
    const lower = text.toLowerCase();
    const matches = [];
    const matchedIds = new Set();

    for (const entity of TRUSTED_ENTITIES) {
      let isMatch = false;

      // Check aliases with token boundary safety
      for (const alias of entity.aliases) {
        if (alias.length <= 4) {
          const regex = new RegExp(`\\b${alias}\\b`, "i");
          if (regex.test(text)) {
            isMatch = true;
            break;
          }
        } else if (lower.includes(alias)) {
          isMatch = true;
          break;
        }
      }

      if (isMatch && !matchedIds.has(entity.id)) {
        matchedIds.add(entity.id);
        matches.push(entity);
      }
    }

    return matches;
  }
}
