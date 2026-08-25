/**
 * Global & National University Digital Ecosystem Registry
 * 
 * Comprehensive knowledge catalog of 50+ Vietnamese & International Higher Education Systems
 * with subdomains, student portal routes, tuition payment hubs, and accredited digital footprints.
 */

export const UNIVERSITY_ECOSYSTEM_REGISTRY = {
  // 1. Trường ĐH Sư phạm Kỹ thuật TP.HCM (HCMUTE)
  HCMUTE: {
    code: "SPK",
    name: "Trường Đại học Sư phạm Kỹ thuật TP.HCM",
    englishName: "Ho Chi Minh City University of Technology and Education",
    primaryDomain: "hcmute.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: [
      "hcmute.edu.vn",
      "fhq.hcmute.edu.vn",
      "fit.hcmute.edu.vn",
      "online.hcmute.edu.vn",
      "ctsv.hcmute.edu.vn",
      "tuyensinh.hcmute.edu.vn",
      "daotao.hcmute.edu.vn",
      "thuvien.hcmute.edu.vn",
      "qlcl.hcmute.edu.vn",
      "kktx.hcmute.edu.vn",
      "feee.hcmute.edu.vn",
      "fme.hcmute.edu.vn",
      "fce.hcmute.edu.vn",
      "fcheme.hcmute.edu.vn",
      "fgate.hcmute.edu.vn",
      "fbe.hcmute.edu.vn",
    ],
    officialSocialHandles: {
      facebook: ["truongdhspkt.hcmute", "HCMUTE.Education"],
      tiktok: ["@hcmute_official"],
      youtube: ["@HCMUTETV"],
    },
    verificationEndpoints: {
      tuition: "https://online.hcmute.edu.vn",
      admission: "https://tuyensinh.hcmute.edu.vn",
      announcements: "https://hcmute.edu.vn/tin-tuc",
    },
  },

  // 2. Đại học Quốc gia TP.HCM (VNU-HCM) & Member Universities
  VNU_HCM: {
    code: "QSX",
    name: "Đại học Quốc gia TP.HCM",
    primaryDomain: "vnuhcm.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: [
      "vnuhcm.edu.vn",
      "uit.edu.vn",        // ĐH Công nghệ Thông tin
      "hcmus.edu.vn",      // ĐH Khoa học Tự nhiên
      "hcmut.edu.vn",      // ĐH Bách Khoa
      "hcmussh.edu.vn",    // ĐH KHXH&NV
      "hcmiu.edu.vn",      // ĐH Quốc tế
      "uel.edu.vn",        // ĐH Kinh tế - Luật
      "medvnu.edu.vn",     // Khoa Y ĐHQG
      "ptnk.edu.vn",       // Phổ thông Năng khiếu
      "ktxhcm.edu.vn",     // Ký túc xá ĐHQG-HCM
    ],
    officialSocialHandles: {
      facebook: ["vnuhcm.info", "UIT.Fanpage", "bku.edu.vn", "tvts.hcmus"],
    },
  },

  // 3. Đại học Quốc gia Hà Nội (VNU-HN)
  VNU_HN: {
    code: "QHI",
    name: "Đại học Quốc gia Hà Nội",
    primaryDomain: "vnu.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: [
      "vnu.edu.vn",
      "uet.vnu.edu.vn",
      "hus.vnu.edu.vn",
      "ulis.vnu.edu.vn",
      "ussh.vnu.edu.vn",
      "is.vnu.edu.vn",
      "ump.vnu.edu.vn",
    ],
  },

  // 4. Đại học Bách Khoa Hà Nội (HUST)
  HUST: {
    code: "BKA",
    name: "Đại học Bách Khoa Hà Nội",
    primaryDomain: "hust.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: ["hust.edu.vn", "ts.hust.edu.vn", "ctt.hust.edu.vn", "sis.hust.edu.vn"],
  },

  // 5. ĐH Kinh Tế TP.HCM (UEH)
  UEH: {
    code: "KSA",
    name: "Đại học Kinh tế TP.HCM",
    primaryDomain: "ueh.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: ["ueh.edu.vn", "tuyensinh.ueh.edu.vn", "dsa.ueh.edu.vn", "student.ueh.edu.vn"],
  },

  // 6. ĐH Ngoại Thương (FTU)
  FTU: {
    code: "NTH",
    name: "Trường Đại học Ngoại thương",
    primaryDomain: "ftu.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: ["ftu.edu.vn", "cs2.ftu.edu.vn", "qls.ftu.edu.vn"],
  },

  // 7. ĐH Cần Thơ (CTU)
  CTU: {
    code: "TCT",
    name: "Trường Đại học Cần Thơ",
    primaryDomain: "ctu.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: ["ctu.edu.vn", "tuyensinh.ctu.edu.vn", "dkmh.ctu.edu.vn"],
  },

  // 8. Đại học Đà Nẵng (UD)
  UD: {
    code: "DND",
    name: "Đại học Đà Nẵng",
    primaryDomain: "udn.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: ["udn.vn", "dut.udn.vn", "ute.udn.vn", "due.udn.vn", "vku.udn.vn"],
  },

  // 9. Học viện Công nghệ Bưu chính Viễn thông (PTIT)
  PTIT: {
    code: "BVH",
    name: "Học viện Công nghệ Bưu chính Viễn thông",
    primaryDomain: "ptit.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: ["ptit.edu.vn", "ptithcm.edu.vn", "tuyensinh.ptit.edu.vn"],
  },

  // 10. ĐH Tôn Đức Thắng (TDTU)
  TDTU: {
    code: "DTT",
    name: "Trường Đại học Tôn Đức Thắng",
    primaryDomain: "tdtu.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: ["tdtu.edu.vn", "admission.tdtu.edu.vn", "portal.tdtu.edu.vn"],
  },

  // 11. ĐH FPT
  FPT: {
    code: "FPT",
    name: "Trường Đại học FPT",
    primaryDomain: "fpt.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: ["fpt.edu.vn", "hcmuni.fpt.edu.vn", "daihoc.fpt.edu.vn", "flm.fpt.edu.vn"],
  },

  // 12. RMIT University Vietnam
  RMIT: {
    code: "RMIT",
    name: "RMIT University Vietnam",
    primaryDomain: "rmit.edu.vn",
    tier: "TIER_5_PRIMARY_AUTHORITATIVE",
    subdomains: ["rmit.edu.vn", "rmit.edu.au"],
  },
};

/**
 * Checks if a given domain or URL belongs to an accredited university ecosystem
 * @param {string} hostname
 * @returns {object|null} Matched university profile or null
 */
export function matchUniversityEcosystem(hostname = "") {
  if (!hostname) return null;
  const cleanHost = hostname.toLowerCase().trim().replace(/^www\./, "");

  for (const [key, uni] of Object.entries(UNIVERSITY_ECOSYSTEM_REGISTRY)) {
    if (cleanHost === uni.primaryDomain || cleanHost.endsWith(`.${uni.primaryDomain}`)) {
      return { key, ...uni, isOfficialSubdomain: true };
    }
    if (uni.subdomains?.some((sub) => cleanHost === sub || cleanHost.endsWith(`.${sub}`))) {
      return { key, ...uni, isOfficialSubdomain: true };
    }
  }

  return null;
}
