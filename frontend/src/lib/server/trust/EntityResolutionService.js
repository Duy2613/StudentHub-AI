/**
 * StudentHub AI — EntityResolutionService
 *
 * Resolves Vietnamese/English university, government, and organization aliases
 * to canonical ENTITY_IDs, official domains, and institutional metadata.
 * Prevents LLMs from hallucinating domain names or institutional identities.
 */

export const CANONICAL_ENTITIES = {
  HCMUT_VNUHCM: {
    entityId: "HCMUT_VNUHCM",
    canonicalName: "Trường Đại học Bách khoa - ĐHQG TP.HCM",
    shortName: "ĐHBK TP.HCM",
    aliases: [
      "hcmut", "đh bách khoa tp.hcm", "bách khoa tp.hcm", "đại học bách khoa tphcm",
      "bách khoa sài gòn", "trường đại học bách khoa tp.hcm", "ho chi minh city university of technology",
      "đhbk tp.hcm", "đhbk tphcm", "mybk", "bk hcm", "bk tphcm"
    ],
    officialDomain: "hcmut.edu.vn",
    allowedDomains: ["hcmut.edu.vn", "vnuhcm.edu.vn"],
    parentOrg: "VNUHCM",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HCMUTE: {
    entityId: "HCMUTE",
    canonicalName: "Trường Đại học Sư phạm Kỹ thuật TP.HCM",
    shortName: "HCMUTE",
    aliases: [
      "hcmute", "đh sư phạm kỹ thuật", "sư phạm kỹ thuật tp.hcm", "spkt",
      "trường đh sư phạm kỹ thuật tphcm", "ho chi minh city university of technology and education",
      "sư phạm kỹ thuật"
    ],
    officialDomain: "hcmute.edu.vn",
    allowedDomains: ["hcmute.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  UEH: {
    entityId: "UEH",
    canonicalName: "Đại học Kinh tế TP.HCM",
    shortName: "UEH",
    aliases: [
      "ueh", "đh kinh tế tp.hcm", "kinh tế tphcm", "đại học kinh tế", "university of economics hcmc", "ueh career fair"
    ],
    officialDomain: "ueh.edu.vn",
    allowedDomains: ["ueh.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VNUHCM: {
    entityId: "VNUHCM",
    canonicalName: "Đại học Quốc gia Thành phố Hồ Chí Minh",
    shortName: "ĐHQG TP.HCM",
    aliases: [
      "vnuhcm", "đhqg tp.hcm", "đại học quốc gia tp.hcm", "đhqg-hcm", "đại học quốc gia tphcm",
      "vietnam national university ho chi minh city", "sinh viên nghiên cứu khoa học eureka",
      "giải thưởng eureka", "eureka"
    ],
    officialDomain: "vnuhcm.edu.vn",
    allowedDomains: ["vnuhcm.edu.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "NATIONAL_UNIVERSITY"
  },
  VNUHN: {
    entityId: "VNUHN",
    canonicalName: "Đại học Quốc gia Hà Nội",
    shortName: "ĐHQG Hà Nội",
    aliases: [
      "vnuhn", "vnu", "đhqg hà nội", "đại học quốc gia hà nội", "vietnam national university hanoi", "đhqghn", "đhqg hn"
    ],
    officialDomain: "vnu.edu.vn",
    allowedDomains: ["vnu.edu.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "NATIONAL_UNIVERSITY"
  },
  HUST: {
    entityId: "HUST",
    canonicalName: "Đại học Bách khoa Hà Nội",
    shortName: "Bách khoa Hà Nội",
    aliases: [
      "hust", "bách khoa hà nội", "đh bách khoa hà nội", "hanoi university of science and technology",
      "đhbk hà nội", "khảo thí hust", "phòng khảo thí"
    ],
    officialDomain: "hust.edu.vn",
    allowedDomains: ["hust.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  NEU: {
    entityId: "NEU",
    canonicalName: "Trường Đại học Kinh tế Quốc dân",
    shortName: "NEU",
    aliases: [
      "neu", "kinh tế quốc dân", "đh kinh tế quốc dân", "national economics university"
    ],
    officialDomain: "neu.edu.vn",
    allowedDomains: ["neu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  FTU: {
    entityId: "FTU",
    canonicalName: "Trường Đại học Ngoại thương",
    shortName: "Ngoại thương",
    aliases: [
      "ftu", "đh ngoại thương", "ngoại thương hà nội", "foreign trade university", "ngoại thương"
    ],
    officialDomain: "ftu.edu.vn",
    allowedDomains: ["ftu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  MOET_VN: {
    entityId: "MOET_VN",
    canonicalName: "Bộ Giáo dục và Đào tạo",
    shortName: "Bộ GD&ĐT",
    aliases: [
      "moet", "bộ giáo dục", "bộ gd&đt", "bộ gd", "bộ giáo dục và đào tạo", "ministry of education and training"
    ],
    officialDomain: "moet.gov.vn",
    allowedDomains: ["moet.gov.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "MINISTRY_REGULATOR"
  },
  MPS_VN: {
    entityId: "MPS_VN",
    canonicalName: "Bộ Công an",
    shortName: "Bộ Công an",
    aliases: [
      "bocongan", "bộ công an", "công an", "cục an ninh mạng", "ministry of public security"
    ],
    officialDomain: "bocongan.gov.vn",
    allowedDomains: ["bocongan.gov.vn", "congan.com.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "LAW_ENFORCEMENT"
  },
  NCSC_VN: {
    entityId: "NCSC_VN",
    canonicalName: "Trung tâm Giám sát an toàn không gian mạng quốc gia",
    shortName: "NCSC",
    aliases: [
      "ncsc", "tín nhiệm mạng", "cục an toàn thông tin", "tinnhiemmang"
    ],
    officialDomain: "tinnhiemmang.vn",
    allowedDomains: ["tinnhiemmang.vn", "ais.gov.vn", "khonggianmang.vn"],
    parentOrg: "MIC_VN",
    jurisdiction: "VN",
    type: "CYBER_SECURITY_AUTHORITY"
  },
  CTU: {
    entityId: "CTU",
    canonicalName: "Trường Đại học Cần Thơ",
    shortName: "ĐH Cần Thơ",
    aliases: ["ctu", "đại học cần thơ", "đh cần thơ", "đhct"],
    officialDomain: "ctu.edu.vn",
    allowedDomains: ["ctu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  UDN: {
    entityId: "UDN",
    canonicalName: "Đại học Đà Nẵng",
    shortName: "ĐH Đà Nẵng",
    aliases: ["udn", "đại học đà nẵng", "đh đà nẵng", "đhđn", "dut", "bách khoa đà nẵng"],
    officialDomain: "udn.vn",
    allowedDomains: ["udn.vn", "dut.udn.vn", "ued.udn.vn", "due.udn.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  FTU_CS2: {
    entityId: "FTU_CS2",
    canonicalName: "Trường Đại học Ngoại thương Cơ sở 2 TP.HCM",
    shortName: "Ngoại thương CS2",
    aliases: ["ftu cs2", "ngoại thương cơ sở 2", "ftu hcm", "ftu cơ sở 2"],
    officialDomain: "cs2.ftu.edu.vn",
    allowedDomains: ["cs2.ftu.edu.vn", "ftu.edu.vn"],
    parentOrg: "FTU",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HUEUNI: {
    entityId: "HUEUNI",
    canonicalName: "Đại học Huế",
    shortName: "ĐH Huế",
    aliases: ["hueuni", "đại học huế", "đh huế"],
    officialDomain: "hueuni.edu.vn",
    allowedDomains: ["hueuni.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  FPTU: {
    entityId: "FPTU",
    canonicalName: "Trường Đại học FPT",
    shortName: "ĐH FPT",
    aliases: ["fptu", "đại học fpt", "đh fpt", "fpt university"],
    officialDomain: "fpt.edu.vn",
    allowedDomains: ["fpt.edu.vn", "daihoc.fpt.edu.vn"],
    parentOrg: "FPT_GROUP",
    jurisdiction: "VN",
    type: "PRIVATE_UNIVERSITY"
  },
  RMIT_VN: {
    entityId: "RMIT_VN",
    canonicalName: "Đại học RMIT Việt Nam",
    shortName: "RMIT Việt Nam",
    aliases: ["rmit", "rmit việt nam", "rmit vietnam", "đại học rmit"],
    officialDomain: "rmit.edu.vn",
    allowedDomains: ["rmit.edu.vn"],
    parentOrg: "RMIT_AU",
    jurisdiction: "VN",
    type: "FOREIGN_BRANCH_UNIVERSITY"
  },
  PHENIKAA: {
    entityId: "PHENIKAA",
    canonicalName: "Trường Đại học Phenikaa",
    shortName: "Phenikaa",
    aliases: ["phenikaa", "đại học phenikaa", "đh phenikaa"],
    officialDomain: "phenikaa-uni.edu.vn",
    allowedDomains: ["phenikaa-uni.edu.vn"],
    parentOrg: "PHENIKAA_GROUP",
    jurisdiction: "VN",
    type: "PRIVATE_UNIVERSITY"
  },
  TDTU: {
    entityId: "TDTU",
    canonicalName: "Trường Đại học Tôn Đức Thắng",
    shortName: "Tôn Đức Thắng",
    aliases: ["tdtu", "đại học tôn đức thắng", "tôn đức thắng", "đh tôn đức thắng"],
    officialDomain: "tdtu.edu.vn",
    allowedDomains: ["tdtu.edu.vn"],
    parentOrg: "VGCL_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  PTIT: {
    entityId: "PTIT",
    canonicalName: "Học viện Công nghệ Bưu chính Viễn thông",
    shortName: "PTIT",
    aliases: ["ptit", "học viện bưu chính viễn thông", "bưu chính viễn thông", "hv công nghệ bưu chính viễn thông"],
    officialDomain: "ptit.edu.vn",
    allowedDomains: ["ptit.edu.vn"],
    parentOrg: "MIC_VN",
    jurisdiction: "VN",
    type: "ACADEMY"
  },
  DAV: {
    entityId: "DAV",
    canonicalName: "Học viện Ngoại giao",
    shortName: "Học viện Ngoại giao",
    aliases: ["dav", "học viện ngoại giao", "ngoại giao"],
    officialDomain: "dav.edu.vn",
    allowedDomains: ["dav.edu.vn"],
    parentOrg: "MOFA_VN",
    jurisdiction: "VN",
    type: "ACADEMY"
  },
  BAV: {
    entityId: "BAV",
    canonicalName: "Học viện Ngân hàng",
    shortName: "Học viện Ngân hàng",
    aliases: ["bav", "học viện ngân hàng", "hv ngân hàng"],
    officialDomain: "hvnh.edu.vn",
    allowedDomains: ["hvnh.edu.vn"],
    parentOrg: "SBV_VN",
    jurisdiction: "VN",
    type: "ACADEMY"
  },
  HMU: {
    entityId: "HMU",
    canonicalName: "Trường Đại học Y Hà Nội",
    shortName: "ĐH Y Hà Nội",
    aliases: ["hmu", "đại học y hà nội", "y hà nội", "đh y hà nội"],
    officialDomain: "hmu.edu.vn",
    allowedDomains: ["hmu.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "MEDICAL_UNIVERSITY"
  },
  UMP: {
    entityId: "UMP",
    canonicalName: "Đại học Y Dược TP.HCM",
    shortName: "ĐH Y Dược TP.HCM",
    aliases: ["ump", "đại học y dược tphcm", "y dược tphcm", "đh y dược tp.hcm"],
    officialDomain: "ump.edu.vn",
    allowedDomains: ["ump.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "MEDICAL_UNIVERSITY"
  },
  PNTU: {
    entityId: "PNTU",
    canonicalName: "Trường Đại học Y khoa Phạm Ngọc Thạch",
    shortName: "Phạm Ngọc Thạch",
    aliases: ["pntu", "phạm ngọc thạch", "y khoa phạm ngọc thạch", "đh phạm ngọc thạch"],
    officialDomain: "pnt.edu.vn",
    allowedDomains: ["pnt.edu.vn"],
    parentOrg: "HCMC_GOV",
    jurisdiction: "VN",
    type: "MEDICAL_UNIVERSITY"
  },
  ULAW: {
    entityId: "ULAW",
    canonicalName: "Trường Đại học Luật TP.HCM",
    shortName: "ĐH Luật TP.HCM",
    aliases: ["ulaw", "đại học luật tphcm", "đh luật tphcm", "đh luật tp.hcm"],
    officialDomain: "hcmulaw.edu.vn",
    allowedDomains: ["hcmulaw.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "LAW_UNIVERSITY"
  },
  HLU: {
    entityId: "HLU",
    canonicalName: "Trường Đại học Luật Hà Nội",
    shortName: "ĐH Luật Hà Nội",
    aliases: ["hlu", "đại học luật hà nội", "đh luật hà nội", "đh luật hn"],
    officialDomain: "hlu.edu.vn",
    allowedDomains: ["hlu.edu.vn"],
    parentOrg: "MOJ_VN",
    jurisdiction: "VN",
    type: "LAW_UNIVERSITY"
  },
  HNUE: {
    entityId: "HNUE",
    canonicalName: "Trường Đại học Sư phạm Hà Nội",
    shortName: "ĐHSP Hà Nội",
    aliases: ["hnue", "đại học sư phạm hà nội", "đhsp hà nội", "sư phạm hà nội"],
    officialDomain: "hnue.edu.vn",
    allowedDomains: ["hnue.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "PEDAGOGICAL_UNIVERSITY"
  },
  HCMUE: {
    entityId: "HCMUE",
    canonicalName: "Trường Đại học Sư phạm TP.HCM",
    shortName: "ĐHSP TP.HCM",
    aliases: ["hcmue", "đại học sư phạm tphcm", "đhsp tphcm", "sư phạm tphcm"],
    officialDomain: "hcmue.edu.vn",
    allowedDomains: ["hcmue.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "PEDAGOGICAL_UNIVERSITY"
  },
  KTX_VNUHCM: {
    entityId: "KTX_VNUHCM",
    canonicalName: "Trung tâm Quản lý Ký túc xá ĐHQG TP.HCM",
    shortName: "KTX ĐHQG TP.HCM",
    aliases: ["ktx khu b", "ký túc xá đhqg", "ktx khu a", "ký túc xá đại học quốc gia"],
    officialDomain: "ktxb.vnuhcm.edu.vn",
    allowedDomains: ["ktxb.vnuhcm.edu.vn", "vnuhcm.edu.vn"],
    parentOrg: "VNUHCM",
    jurisdiction: "VN",
    type: "STUDENT_SERVICES"
  },
  MOMO_VN: {
    entityId: "MOMO_VN",
    canonicalName: "Công ty Cổ phần Dịch vụ Di động Trực tuyến (MoMo)",
    shortName: "Ví MoMo",
    aliases: ["momo", "ví momo", "công ty m-service"],
    officialDomain: "momo.vn",
    allowedDomains: ["momo.vn"],
    parentOrg: "M_SERVICE",
    jurisdiction: "VN",
    type: "FINTECH"
  },
  ZALOPAY: {
    entityId: "ZALOPAY",
    canonicalName: "Công ty Cổ phần Zion (ZaloPay)",
    shortName: "Ví ZaloPay",
    aliases: ["zalopay", "ví zalopay", "vng zalopay"],
    officialDomain: "zalopay.vn",
    allowedDomains: ["zalopay.vn"],
    parentOrg: "VNG",
    jurisdiction: "VN",
    type: "FINTECH"
  },
  SHOPEEPAY: {
    entityId: "SHOPEEPAY",
    canonicalName: "Ví điện tử ShopeePay",
    shortName: "ShopeePay",
    aliases: ["shopeepay", "ví shopeepay"],
    officialDomain: "shopeepay.vn",
    allowedDomains: ["shopeepay.vn"],
    parentOrg: "SEA_GROUP",
    jurisdiction: "VN",
    type: "FINTECH"
  },
  VIETTEL: {
    entityId: "VIETTEL",
    canonicalName: "Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)",
    shortName: "Viettel",
    aliases: ["viettel", "tập đoàn viettel", "viettel telecom"],
    officialDomain: "viettel.vn",
    allowedDomains: ["viettel.vn", "vietteltelecom.vn"],
    parentOrg: "MOD_VN",
    jurisdiction: "VN",
    type: "TELECOM"
  },
  VINAPHONE: {
    entityId: "VINAPHONE",
    canonicalName: "Tổng công ty Dịch vụ Viễn thông (VNPT VinaPhone)",
    shortName: "VinaPhone",
    aliases: ["vinaphone", "vnpt", "mạng vinaphone"],
    officialDomain: "vinaphone.com.vn",
    allowedDomains: ["vinaphone.com.vn", "vnpt.com.vn"],
    parentOrg: "VNPT_GROUP",
    jurisdiction: "VN",
    type: "TELECOM"
  },
  VCB: {
    entityId: "VCB",
    canonicalName: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
    shortName: "Vietcombank",
    aliases: ["vietcombank", "vcb", "ngân hàng ngoại thương"],
    officialDomain: "vietcombank.com.vn",
    allowedDomains: ["vietcombank.com.vn"],
    parentOrg: "SBV_VN",
    jurisdiction: "VN",
    type: "COMMERCIAL_BANK"
  },
  BIDV: {
    entityId: "BIDV",
    canonicalName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)",
    shortName: "BIDV",
    aliases: ["bidv", "ngân hàng bidv", "đầu tư và phát triển việt nam"],
    officialDomain: "bidv.com.vn",
    allowedDomains: ["bidv.com.vn"],
    parentOrg: "SBV_VN",
    jurisdiction: "VN",
    type: "COMMERCIAL_BANK"
  },
  CTG: {
    entityId: "CTG",
    canonicalName: "Ngân hàng TMCP Công Thương Việt Nam (VietinBank)",
    shortName: "VietinBank",
    aliases: ["vietinbank", "ngân hàng công thương"],
    officialDomain: "vietinbank.vn",
    allowedDomains: ["vietinbank.vn"],
    parentOrg: "SBV_VN",
    jurisdiction: "VN",
    type: "COMMERCIAL_BANK"
  },
  MBB: {
    entityId: "MBB",
    canonicalName: "Ngân hàng TMCP Quân đội (MB Bank)",
    shortName: "MB Bank",
    aliases: ["mb bank", "ngân hàng quân đội", "mbbank"],
    officialDomain: "mbbank.com.vn",
    allowedDomains: ["mbbank.com.vn"],
    parentOrg: "MOD_VN",
    jurisdiction: "VN",
    type: "COMMERCIAL_BANK"
  },
  AMBIGUOUS_DHBK: {
    entityId: "AMBIGUOUS_DHBK",
    canonicalName: "Hệ thống các trường Đại học Bách khoa (Hà Nội, TP.HCM, Đà Nẵng)",
    shortName: "ĐHBK",
    aliases: ["đhbk", "bách khoa"],
    officialDomain: "hust.edu.vn",
    allowedDomains: ["hust.edu.vn", "hcmut.edu.vn", "dut.udn.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_DHQG: {
    entityId: "AMBIGUOUS_DHQG",
    canonicalName: "Đại học Quốc gia (Hà Nội, TP.HCM)",
    shortName: "ĐHQG",
    aliases: ["đhqg"],
    officialDomain: "vnu.edu.vn",
    allowedDomains: ["vnu.edu.vn", "vnuhcm.edu.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_DHSP: {
    entityId: "AMBIGUOUS_DHSP",
    canonicalName: "Hệ thống các trường Đại học Sư phạm",
    shortName: "ĐHSP",
    aliases: ["đhsp"],
    officialDomain: "hnue.edu.vn",
    allowedDomains: ["hnue.edu.vn", "hcmue.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_DHKT: {
    entityId: "AMBIGUOUS_DHKT",
    canonicalName: "Hệ thống các trường Đại học Kinh tế (NEU, UEH, DUE)",
    shortName: "ĐHKT",
    aliases: ["đhkt", "đại học kinh tế"],
    officialDomain: "neu.edu.vn",
    allowedDomains: ["neu.edu.vn", "ueh.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_DHLUAT: {
    entityId: "AMBIGUOUS_DHLUAT",
    canonicalName: "Hệ thống các trường Đại học Luật (HLU, ULAW)",
    shortName: "ĐH Luật",
    aliases: ["đhluat", "đh luật", "đại học luật"],
    officialDomain: "hlu.edu.vn",
    allowedDomains: ["hlu.edu.vn", "ulaw.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_DHMO: {
    entityId: "AMBIGUOUS_DHMO",
    canonicalName: "Hệ thống các trường Đại học Mở (HOU, OU)",
    shortName: "ĐH Mở",
    aliases: ["đhmo", "đh mở", "đại học mở"],
    officialDomain: "hou.edu.vn",
    allowedDomains: ["hou.edu.vn", "ou.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_DHNL: {
    entityId: "AMBIGUOUS_DHNL",
    canonicalName: "Hệ thống các trường Đại học Nông Lâm",
    shortName: "ĐH Nông Lâm",
    aliases: ["đhnl", "đh nông lâm", "đại học nông lâm"],
    officialDomain: "hcmuaf.edu.vn",
    allowedDomains: ["hcmuaf.edu.vn", "tuaf.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_DHNN: {
    entityId: "AMBIGUOUS_DHNN",
    canonicalName: "Hệ thống các trường Đại học Ngoại ngữ (ULIS, UFL)",
    shortName: "ĐH Ngoại ngữ",
    aliases: ["đhnn", "đh ngoại ngữ", "đại học ngoại ngữ"],
    officialDomain: "ulis.vnu.edu.vn",
    allowedDomains: ["ulis.vnu.edu.vn", "hanu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_DHYD: {
    entityId: "AMBIGUOUS_DHYD",
    canonicalName: "Hệ thống các trường Đại học Y Dược (HMU, UMP)",
    shortName: "ĐH Y Dược",
    aliases: ["đhyd", "đh y dược", "đại học y dược"],
    officialDomain: "hmu.edu.vn",
    allowedDomains: ["hmu.edu.vn", "ump.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_UTE: {
    entityId: "AMBIGUOUS_UTE",
    canonicalName: "Hệ thống các trường Đại học Sư phạm Kỹ thuật (HCMUTE, UTEHY, VLUTE)",
    shortName: "UTE",
    aliases: ["ute", "đh spkt", "đh sư phạm kỹ thuật"],
    officialDomain: "hcmute.edu.vn",
    allowedDomains: ["hcmute.edu.vn", "utehy.edu.vn", "vlute.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  TTN: {
    entityId: "TTN",
    canonicalName: "Trường Đại học Tây Nguyên",
    shortName: "ĐH Tây Nguyên",
    aliases: ["ttn", "đại học tây nguyên", "đh tây nguyên", "tây nguyên"],
    officialDomain: "ttn.edu.vn",
    allowedDomains: ["ttn.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  NTU: {
    entityId: "NTU",
    canonicalName: "Trường Đại học Nha Trang",
    shortName: "ĐH Nha Trang",
    aliases: ["ntu", "đại học nha trang", "đh nha trang", "nha trang"],
    officialDomain: "ntu.edu.vn",
    allowedDomains: ["ntu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  QNU: {
    entityId: "QNU",
    canonicalName: "Trường Đại học Quy Nhơn",
    shortName: "ĐH Quy Nhơn",
    aliases: ["qnu", "đại học quy nhơn", "đh quy nhơn", "quy nhơn"],
    officialDomain: "qnu.edu.vn",
    allowedDomains: ["qnu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  NLU: {
    entityId: "NLU",
    canonicalName: "Trường Đại học Nông Lâm TP.HCM",
    shortName: "ĐH Nông Lâm",
    aliases: ["nlu", "đại học nông lâm", "đh nông lâm", "nông lâm tphcm", "nông lâm tp.hcm"],
    officialDomain: "hcmuaf.edu.vn",
    allowedDomains: ["hcmuaf.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  UAH: {
    entityId: "UAH",
    canonicalName: "Trường Đại học Kiến trúc TP.HCM",
    shortName: "ĐH Kiến trúc",
    aliases: ["uah", "đại học kiến trúc tphcm", "đh kiến trúc tphcm", "kiến trúc tphcm", "đại học kiến trúc", "kiến trúc tp.hcm"],
    officialDomain: "uah.edu.vn",
    allowedDomains: ["uah.edu.vn"],
    parentOrg: "MOC_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HAU: {
    entityId: "HAU",
    canonicalName: "Trường Đại học Kiến trúc Hà Nội",
    shortName: "ĐH Kiến trúc Hà Nội",
    aliases: ["hau", "đại học kiến trúc hà nội", "đh kiến trúc hà nội", "kiến trúc hà nội"],
    officialDomain: "hau.edu.vn",
    allowedDomains: ["hau.edu.vn"],
    parentOrg: "MOC_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HCMUFA: {
    entityId: "HCMUFA",
    canonicalName: "Trường Đại học Mỹ thuật TP.HCM",
    shortName: "ĐH Mỹ thuật",
    aliases: ["hcmufa", "đại học mỹ thuật tphcm", "đh mỹ thuật", "mỹ thuật tphcm", "mỹ thuật tp.hcm"],
    officialDomain: "hcmufa.edu.vn",
    allowedDomains: ["hcmufa.edu.vn"],
    parentOrg: "MCST_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HOU: {
    entityId: "HOU",
    canonicalName: "Trường Đại học Mở Hà Nội",
    shortName: "ĐH Mở Hà Nội",
    aliases: ["hou", "đại học mở hà nội", "đh mở hà nội", "mở hà nội", "viện đại học mở"],
    officialDomain: "hou.edu.vn",
    allowedDomains: ["hou.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  OU: {
    entityId: "OU",
    canonicalName: "Trường Đại học Mở TP.HCM",
    shortName: "ĐH Mở TP.HCM",
    aliases: ["ou", "đại học mở tphcm", "đh mở tphcm", "mở tphcm", "mở tp.hcm"],
    officialDomain: "ou.edu.vn",
    allowedDomains: ["ou.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  AOF: {
    entityId: "AOF",
    canonicalName: "Học viện Tài chính",
    shortName: "Học viện Tài chính",
    aliases: ["aof", "học viện tài chính", "hv tài chính", "tài chính"],
    officialDomain: "hvtc.edu.vn",
    allowedDomains: ["hvtc.edu.vn"],
    parentOrg: "MOF_VN",
    jurisdiction: "VN",
    type: "ACADEMY"
  },
  TMU: {
    entityId: "TMU",
    canonicalName: "Trường Đại học Thương mại",
    shortName: "ĐH Thương mại",
    aliases: ["tmu", "đại học thương mại", "đh thương mại", "thương mại"],
    officialDomain: "tmu.edu.vn",
    allowedDomains: ["tmu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HUCE: {
    entityId: "HUCE",
    canonicalName: "Trường Đại học Xây dựng Hà Nội",
    shortName: "ĐH Xây dựng",
    aliases: ["huce", "đại học xây dựng hà nội", "đh xây dựng", "xây dựng hà nội"],
    officialDomain: "huce.edu.vn",
    allowedDomains: ["huce.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  UTC: {
    entityId: "UTC",
    canonicalName: "Trường Đại học Giao thông Vận tải",
    shortName: "ĐH Giao thông Vận tải",
    aliases: ["utc", "đại học giao thông vận tải", "đh gtvt", "giao thông vận tải"],
    officialDomain: "utc.edu.vn",
    allowedDomains: ["utc.edu.vn", "utc2.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  UTC2: {
    entityId: "UTC2",
    canonicalName: "Trường Đại học Giao thông Vận tải Phân hiệu TP.HCM",
    shortName: "GTVT Phân hiệu TP.HCM",
    aliases: ["utc2", "gtvt phân hiệu tphcm", "utc phân hiệu tphcm", "giao thông vận tải phân hiệu"],
    officialDomain: "utc2.edu.vn",
    allowedDomains: ["utc2.edu.vn", "utc.edu.vn"],
    parentOrg: "UTC",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TLU: {
    entityId: "TLU",
    canonicalName: "Trường Đại học Thủy lợi",
    shortName: "ĐH Thủy lợi",
    aliases: ["tlu", "đại học thủy lợi", "đh thủy lợi", "thủy lợi"],
    officialDomain: "tlu.edu.vn",
    allowedDomains: ["tlu.edu.vn"],
    parentOrg: "MARD_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HAUI: {
    entityId: "HAUI",
    canonicalName: "Trường Đại học Công nghiệp Hà Nội",
    shortName: "ĐH Công nghiệp Hà Nội",
    aliases: ["haui", "đại học công nghiệp hà nội", "đh công nghiệp hà nội", "công nghiệp hà nội"],
    officialDomain: "haui.edu.vn",
    allowedDomains: ["haui.edu.vn"],
    parentOrg: "MOIT_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HUIT: {
    entityId: "HUIT",
    canonicalName: "Trường Đại học Công Thương TP.HCM",
    shortName: "ĐH Công Thương",
    aliases: ["huit", "đại học công thương tphcm", "công thương tphcm", "công nghiệp thực phẩm"],
    officialDomain: "huit.edu.vn",
    allowedDomains: ["huit.edu.vn"],
    parentOrg: "MOIT_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  UFM: {
    entityId: "UFM",
    canonicalName: "Trường Đại học Tài chính - Marketing",
    shortName: "UFM",
    aliases: ["ufm", "đại học tài chính marketing", "tài chính marketing", "đh tài chính marketing"],
    officialDomain: "ufm.edu.vn",
    allowedDomains: ["ufm.edu.vn"],
    parentOrg: "MOF_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  SGU: {
    entityId: "SGU",
    canonicalName: "Trường Đại học Sài Gòn",
    shortName: "ĐH Sài Gòn",
    aliases: ["sgu", "đại học sài gòn", "đh sài gòn", "sài gòn"],
    officialDomain: "sgu.edu.vn",
    allowedDomains: ["sgu.edu.vn"],
    parentOrg: "HCMC_GOV",
    jurisdiction: "VN",
    type: "MUNICIPAL_UNIVERSITY"
  },
  VLU: {
    entityId: "VLU",
    canonicalName: "Trường Đại học Văn Lang",
    shortName: "Văn Lang",
    aliases: ["vlu", "đại học văn lang", "văn lang", "đh văn lang"],
    officialDomain: "vlu.edu.vn",
    allowedDomains: ["vlu.edu.vn"],
    parentOrg: "PRIVATE",
    jurisdiction: "VN",
    type: "PRIVATE_UNIVERSITY"
  },
  HSU: {
    entityId: "HSU",
    canonicalName: "Trường Đại học Hoa Sen",
    shortName: "Hoa Sen",
    aliases: ["hsu", "đại học hoa sen", "hoa sen", "đh hoa sen"],
    officialDomain: "hoasen.edu.vn",
    allowedDomains: ["hoasen.edu.vn"],
    parentOrg: "PRIVATE",
    jurisdiction: "VN",
    type: "PRIVATE_UNIVERSITY"
  },
  HIU: {
    entityId: "HIU",
    canonicalName: "Trường Đại học Quốc tế Hồng Bàng",
    shortName: "Hồng Bàng",
    aliases: ["hiu", "đại học quốc tế hồng bàng", "hồng bàng", "đh hồng bàng"],
    officialDomain: "hiu.vn",
    allowedDomains: ["hiu.vn"],
    parentOrg: "PRIVATE",
    jurisdiction: "VN",
    type: "PRIVATE_UNIVERSITY"
  },
  HUTECH: {
    entityId: "HUTECH",
    canonicalName: "Trường Đại học HUTECH",
    shortName: "HUTECH",
    aliases: ["hutech", "đại học công nghệ tphcm", "hutech uni", "đh hutech"],
    officialDomain: "hutech.edu.vn",
    allowedDomains: ["hutech.edu.vn"],
    parentOrg: "PRIVATE",
    jurisdiction: "VN",
    type: "PRIVATE_UNIVERSITY"
  },
  NTTU: {
    entityId: "NTTU",
    canonicalName: "Trường Đại học Nguyễn Tất Thành",
    shortName: "Nguyễn Tất Thành",
    aliases: ["nttu", "đại học nguyễn tất thành", "nguyễn tất thành", "đh nguyễn tất thành"],
    officialDomain: "ntt.edu.vn",
    allowedDomains: ["ntt.edu.vn"],
    parentOrg: "PRIVATE",
    jurisdiction: "VN",
    type: "PRIVATE_UNIVERSITY"
  },
  VAA: {
    entityId: "VAA",
    canonicalName: "Học viện Hàng không Việt Nam",
    shortName: "Học viện Hàng không",
    aliases: ["vaa", "học viện hàng không", "hàng không việt nam", "hv hàng không"],
    officialDomain: "vaa.edu.vn",
    allowedDomains: ["vaa.edu.vn"],
    parentOrg: "MOT_VN",
    jurisdiction: "VN",
    type: "ACADEMY"
  },
  AJC: {
    entityId: "AJC",
    canonicalName: "Học viện Báo chí và Tuyên truyền",
    shortName: "Báo chí Tuyên truyền",
    aliases: [
      "ajc", "học viện báo chí", "học viện báo chí tuyên truyền", "học viện báo chí và tuyên truyền",
      "báo chí tuyên truyền", "báo chí và tuyên truyền", "hv báo chí"
    ],
    officialDomain: "ajc.edu.vn",
    allowedDomains: ["ajc.edu.vn"],
    parentOrg: "HCMA",
    jurisdiction: "VN",
    type: "ACADEMY"
  },
  VINUNI: {
    entityId: "VINUNI",
    canonicalName: "Đại học VinUni",
    shortName: "VinUni",
    aliases: ["vinuni", "đại học vinuni", "vinuniversity"],
    officialDomain: "vinuni.edu.vn",
    allowedDomains: ["vinuni.edu.vn"],
    parentOrg: "VINGROUP",
    jurisdiction: "VN",
    type: "PRIVATE_UNIVERSITY"
  },
  HUP: {
    entityId: "HUP",
    canonicalName: "Trường Đại học Dược Hà Nội",
    shortName: "ĐH Dược Hà Nội",
    aliases: ["hup", "đại học dược hà nội", "dược hà nội", "đh dược"],
    officialDomain: "hup.edu.vn",
    allowedDomains: ["hup.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "MEDICAL_UNIVERSITY"
  },
  CTUMP: {
    entityId: "CTUMP",
    canonicalName: "Trường Đại học Y Dược Cần Thơ",
    shortName: "ĐH Y Dược Cần Thơ",
    aliases: ["ctump", "y dược cần thơ", "đh y dược cần thơ", "đại học y dược cần thơ"],
    officialDomain: "ctump.edu.vn",
    allowedDomains: ["ctump.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "MEDICAL_UNIVERSITY"
  },
  DUMTP: {
    entityId: "DUMTP",
    canonicalName: "Trường Đại học Kỹ thuật Y - Dược Đà Nẵng",
    shortName: "Kỹ thuật Y Dược Đà Nẵng",
    aliases: ["dumtp", "kỹ thuật y dược đà nẵng", "đh kỹ thuật y dược đà nẵng"],
    officialDomain: "dhtm.edu.vn",
    allowedDomains: ["dhtm.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "MEDICAL_UNIVERSITY"
  },
  KTX_VNUHN: {
    entityId: "KTX_VNUHN",
    canonicalName: "Trung tâm Hỗ trợ Sinh viên ĐHQG Hà Nội (KTX Mễ Trì)",
    shortName: "KTX ĐHQG Hà Nội",
    aliases: ["ktx mễ trì", "ký túc xá mễ trì", "ktx đhqghn"],
    officialDomain: "cssv.vnu.edu.vn",
    allowedDomains: ["cssv.vnu.edu.vn", "vnu.edu.vn"],
    parentOrg: "VNUHN",
    jurisdiction: "VN",
    type: "STUDENT_SERVICES"
  },
  MOH_VN: {
    entityId: "MOH_VN",
    canonicalName: "Bộ Y tế",
    shortName: "Bộ Y tế",
    aliases: ["moh", "bộ y tế", "y tế việt nam"],
    officialDomain: "moh.gov.vn",
    allowedDomains: ["moh.gov.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "MINISTRY_REGULATOR"
  },
  MOLISA_VN: {
    entityId: "MOLISA_VN",
    canonicalName: "Bộ Lao động - Thương binh và Xã hội",
    shortName: "Bộ LĐTBXH",
    aliases: ["molisa", "bộ lao động", "bộ lđtbxh", "bộ lao động thương binh và xã hội"],
    officialDomain: "molisa.gov.vn",
    allowedDomains: ["molisa.gov.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "MINISTRY_REGULATOR"
  },
  VBSP: {
    entityId: "VBSP",
    canonicalName: "Ngân hàng Chính sách xã hội Việt Nam",
    shortName: "VBSP",
    aliases: [
      "vbsp", "ngân hàng chính sách xã hội", "chính sách xã hội", "ngân hàng csxh",
      "quyết định 157", "tín dụng sinh viên", "vay vốn sinh viên", "chính sách tín dụng vốn vay ưu đãi cho sinh viên"
    ],
    officialDomain: "vbsp.org.vn",
    allowedDomains: ["vbsp.org.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "POLICY_BANK"
  },
  MOD_VN: {
    entityId: "MOD_VN",
    canonicalName: "Bộ Quốc phòng",
    shortName: "Bộ Quốc phòng",
    aliases: [
      "bộ quốc phòng", "tuyển sinh quân sự", "hội đồng tuyển sinh quân sự",
      "nghĩa vụ quân sự", "tạm hoãn nghĩa vụ quân sự", "hoãn nghĩa vụ quân sự", "tạm hoãn gọi nhập ngũ", "luật nghĩa vụ quân sự"
    ],
    officialDomain: "mod.gov.vn",
    allowedDomains: ["mod.gov.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "MINISTRY_REGULATOR"
  },
  MIC_VN: {
    entityId: "MIC_VN",
    canonicalName: "Bộ Thông tin và Truyền thông",
    shortName: "Bộ TTTT",
    aliases: ["mic", "bộ thông tin và truyền thông", "bộ tttt", "bộ thông tin"],
    officialDomain: "mic.gov.vn",
    allowedDomains: ["mic.gov.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "MINISTRY_REGULATOR"
  },
  FPTSHOP: {
    entityId: "FPTSHOP",
    canonicalName: "Công ty Cổ phần Bán lẻ Kỹ thuật số FPT (FPT Shop)",
    shortName: "FPT Shop",
    aliases: ["fpt shop", "hệ thống fpt shop", "fpt retail"],
    officialDomain: "fptshop.com.vn",
    allowedDomains: ["fptshop.com.vn"],
    parentOrg: "FPT_GROUP",
    jurisdiction: "VN",
    type: "RETAIL"
  },
  MWG: {
    entityId: "MWG",
    canonicalName: "Công ty Cổ phần Đầu tư Thế Giới Di Động",
    shortName: "Thế Giới Di Động",
    aliases: ["thế giới di động", "tgdd", "mwg"],
    officialDomain: "thegioididong.com",
    allowedDomains: ["thegioididong.com"],
    parentOrg: "MWG_GROUP",
    jurisdiction: "VN",
    type: "RETAIL"
  },
  GRAB_VN: {
    entityId: "GRAB_VN",
    canonicalName: "Công ty TNHH Grab (Việt Nam)",
    shortName: "Grab",
    aliases: ["grab", "grab việt nam", "grabbike", "grabcar"],
    officialDomain: "grab.com",
    allowedDomains: ["grab.com"],
    parentOrg: "GRAB_HOLDINGS",
    jurisdiction: "VN",
    type: "TRANSPORT"
  },
  BE_GROUP: {
    entityId: "BE_GROUP",
    canonicalName: "Công ty Cổ phần Be Group",
    shortName: "Be Group",
    aliases: ["be", "be group", "bebike", "becar"],
    officialDomain: "be.com.vn",
    allowedDomains: ["be.com.vn"],
    parentOrg: "BE_GROUP",
    jurisdiction: "VN",
    type: "TRANSPORT"
  },
  AGRIBANK: {
    entityId: "AGRIBANK",
    canonicalName: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)",
    shortName: "Agribank",
    aliases: ["agribank", "ngân hàng nông nghiệp", "nông nghiệp và phát triển nông thôn"],
    officialDomain: "agribank.com.vn",
    allowedDomains: ["agribank.com.vn"],
    parentOrg: "SBV_VN",
    jurisdiction: "VN",
    type: "COMMERCIAL_BANK"
  },
  TCB: {
    entityId: "TCB",
    canonicalName: "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)",
    shortName: "Techcombank",
    aliases: ["techcombank", "kỹ thương việt nam", "tcb"],
    officialDomain: "techcombank.com.vn",
    allowedDomains: ["techcombank.com.vn"],
    parentOrg: "SBV_VN",
    jurisdiction: "VN",
    type: "COMMERCIAL_BANK"
  },
  VPB: {
    entityId: "VPB",
    canonicalName: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)",
    shortName: "VPBank",
    aliases: ["vpbank", "việt nam thịnh vượng", "vpb"],
    officialDomain: "vpbank.com.vn",
    allowedDomains: ["vpbank.com.vn"],
    parentOrg: "SBV_VN",
    jurisdiction: "VN",
    type: "COMMERCIAL_BANK"
  },
  TPB: {
    entityId: "TPB",
    canonicalName: "Ngân hàng TMCP Tiên Phong (TPBank)",
    shortName: "TPBank",
    aliases: ["tpbank", "tiên phong bank", "tpb", "ngân hàng tiên phong"],
    officialDomain: "tpb.vn",
    allowedDomains: ["tpb.vn"],
    parentOrg: "SBV_VN",
    jurisdiction: "VN",
    type: "COMMERCIAL_BANK"
  },
  SHOPEE_VN: {
    entityId: "SHOPEE_VN",
    canonicalName: "Sàn TMĐT Shopee Việt Nam",
    shortName: "Shopee",
    aliases: ["shopee", "shopee việt nam", "shopee vn"],
    officialDomain: "shopee.vn",
    allowedDomains: ["shopee.vn"],
    parentOrg: "SEA_GROUP",
    jurisdiction: "VN",
    type: "E_COMMERCE"
  },
  LAZADA_VN: {
    entityId: "LAZADA_VN",
    canonicalName: "Sàn TMĐT Lazada Việt Nam",
    shortName: "Lazada",
    aliases: ["lazada", "lazada việt nam"],
    officialDomain: "lazada.vn",
    allowedDomains: ["lazada.vn"],
    parentOrg: "ALIBABA",
    jurisdiction: "VN",
    type: "E_COMMERCE"
  },
  TIKTOK_VN: {
    entityId: "TIKTOK_VN",
    canonicalName: "TikTok Shop Việt Nam",
    shortName: "TikTok Shop",
    aliases: ["tiktok shop", "tiktok việt nam", "tiktok"],
    officialDomain: "tiktok.com",
    allowedDomains: ["tiktok.com"],
    parentOrg: "BYTEDANCE",
    jurisdiction: "VN",
    type: "E_COMMERCE"
  },
  VNG: {
    entityId: "VNG",
    canonicalName: "Công ty Cổ phần VNG",
    shortName: "VNG",
    aliases: ["vng", "tập đoàn vng", "vinagame"],
    officialDomain: "vng.com.vn",
    allowedDomains: ["vng.com.vn"],
    parentOrg: "VNG",
    jurisdiction: "VN",
    type: "TECH"
  },
  VTP: {
    entityId: "VTP",
    canonicalName: "Tổng công ty Cổ phần Bưu chính Viettel (Viettel Post)",
    shortName: "Viettel Post",
    aliases: ["viettel post", "chuyển phát viettel"],
    officialDomain: "viettelpost.com.vn",
    allowedDomains: ["viettelpost.com.vn"],
    parentOrg: "MOD_VN",
    jurisdiction: "VN",
    type: "LOGISTICS"
  },
  VNPOST: {
    entityId: "VNPOST",
    canonicalName: "Tổng công ty Bưu điện Việt Nam (VNPost)",
    shortName: "VNPost",
    aliases: ["vnpost", "bưu điện việt nam", "bưu chính việt nam"],
    officialDomain: "vnpost.vn",
    allowedDomains: ["vnpost.vn"],
    parentOrg: "MIC_VN",
    jurisdiction: "VN",
    type: "LOGISTICS"
  },
  MOBIFONE: {
    entityId: "MOBIFONE",
    canonicalName: "Tổng công ty Viễn thông MobiFone",
    shortName: "MobiFone",
    aliases: ["mobifone", "tổng công ty mobifone", "mobi"],
    officialDomain: "mobifone.vn",
    allowedDomains: ["mobifone.vn"],
    parentOrg: "CMSC",
    jurisdiction: "VN",
    type: "TELECOM"
  },
  AMBIGUOUS_UEH_UEL: {
    entityId: "AMBIGUOUS_UEH_UEL",
    canonicalName: "ĐH Kinh tế TP.HCM / ĐH Kinh tế - Luật",
    shortName: "UEH / UEL",
    aliases: ["ueh và uel", "ueh uel", "kinh tế và kinh tế luật", "kinh tế ueh", "kinh tế", "uel sắp sáp nhập vào ueh", "sáp nhập vào ueh"],
    officialDomain: "ueh.edu.vn",
    allowedDomains: ["ueh.edu.vn", "uel.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  GOV_VN: {
    entityId: "GOV_VN",
    canonicalName: "Cổng Thông tin điện tử Chính phủ nước CHXHCN Việt Nam",
    shortName: "Chính phủ Việt Nam",
    aliases: ["chính phủ", "chinhphu", "thủ tướng", "thủ tướng chính phủ", "nghị quyết chính phủ", "35/nq-cp", "nq-cp", "nđ-cp", "chinhphu.vn"],
    officialDomain: "chinhphu.vn",
    allowedDomains: ["chinhphu.vn", "data.gov.vn", "vanban.chinhphu.vn"],
    parentOrg: "STATE_VN",
    jurisdiction: "VN",
    type: "GOVERNMENT_PORTAL"
  },
  AMBIGUOUS_UTE: {
    entityId: "AMBIGUOUS_UTE",
    canonicalName: "Hệ thống ĐH Sư phạm Kỹ thuật (TP.HCM / Hưng Yên / Vinh)",
    shortName: "ĐH Sư phạm Kỹ thuật (UTE)",
    aliases: ["ute", "ute ở tp.hcm và trường ute ở hưng yên", "ute ở tphcm", "đh spkt", "spkt", "sư phạm kỹ thuật"],
    officialDomain: "hcmute.edu.vn",
    allowedDomains: ["hcmute.edu.vn", "utehy.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_DAV_BAV: {
    entityId: "AMBIGUOUS_DAV_BAV",
    canonicalName: "Học viện Ngoại giao / Học viện Ngân hàng",
    shortName: "DAV / BAV",
    aliases: ["dav và bav", "dav bav", "ngoại giao và ngân hàng", "học viện ngoại giao và học viện ngân hàng"],
    officialDomain: "dav.edu.vn",
    allowedDomains: ["dav.edu.vn", "hvnh.edu.vn"],
    parentOrg: "MOFA_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_DHKT: {
    entityId: "AMBIGUOUS_DHKT",
    canonicalName: "Đại học Kinh tế (UEH / UEL / ĐHQG)",
    shortName: "ĐH Kinh tế",
    aliases: ["đhkt", "đh kinh tế là ueh", "đh kinh tế", "đại học kinh tế", "kinh tế là ueh"],
    officialDomain: "ueh.edu.vn",
    allowedDomains: ["ueh.edu.vn", "uel.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_LUAT: {
    entityId: "AMBIGUOUS_LUAT",
    canonicalName: "Hệ thống ĐH Luật (HLU Hà Nội / ULAW TP.HCM)",
    shortName: "ĐH Luật (HLU / ULAW)",
    aliases: ["hlu và ulaw", "hlu ulaw", "đh luật hà nội (hlu) và đh luật tp.hcm (ulaw)", "đại học luật", "đh luật", "luật hà nội và luật tphcm", "trường đại học luật"],
    officialDomain: "hlu.edu.vn",
    allowedDomains: ["hlu.edu.vn", "ulaw.edu.vn"],
    parentOrg: "MOJ_VN",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  DUT: {
    entityId: "DUT",
    canonicalName: "Trường Đại học Bách khoa - Đại học Đà Nẵng",
    shortName: "ĐH Bách khoa Đà Nẵng",
    aliases: ["dut", "bách khoa đà nẵng", "đh bách khoa đà nẵng", "đại học bách khoa đà nẵng", "trường đại học bách khoa đà nẵng (dut)"],
    officialDomain: "dut.udn.vn",
    allowedDomains: ["dut.udn.vn", "udn.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  UHS_VNUHCM: {
    entityId: "UHS_VNUHCM",
    canonicalName: "Trường Đại học Khoa học Sức khỏe - ĐHQG-HCM",
    shortName: "ĐH Khoa học Sức khỏe (Khoa Y ĐHQG)",
    aliases: ["khoa y đhqg tp.hcm", "khoa y", "khoa y đhqg", "khoa y đhqg tphcm", "đại học khoa học sức khỏe", "đh khoa học sức khỏe", "uhs"],
    officialDomain: "medvnu.edu.vn",
    allowedDomains: ["medvnu.edu.vn", "vnuhcm.edu.vn"],
    parentOrg: "VNUHCM",
    jurisdiction: "VN",
    type: "NATIONAL_UNIVERSITY"
  },
  HCMIU_VNUHCM: {
    entityId: "HCMIU_VNUHCM",
    canonicalName: "Trường Đại học Quốc tế - ĐHQG-HCM",
    shortName: "ĐH Quốc tế (IU)",
    aliases: ["hcmiu", "đại học quốc tế iu", "đh quốc tế iu", "đại học quốc tế", "đh quốc tế", "quốc tế iu", "đh quốc tế đhqg"],
    officialDomain: "hcmiu.edu.vn",
    allowedDomains: ["hcmiu.edu.vn", "vnuhcm.edu.vn"],
    parentOrg: "VNUHCM",
    jurisdiction: "VN",
    type: "NATIONAL_UNIVERSITY"
  },
  AMBIGUOUS_KHTN: {
    entityId: "AMBIGUOUS_KHTN",
    canonicalName: "ĐH Khoa học Tự nhiên (HUS Hà Nội / HCMUS TP.HCM)",
    shortName: "ĐH Khoa học Tự nhiên",
    aliases: ["khoa học tự nhiên viết tắt là hus hay hcmus", "khoa học tự nhiên", "đh khoa học tự nhiên", "đại học khoa học tự nhiên", "tự nhiên", "hus hay hcmus", "hus", "hcmus"],
    officialDomain: "hus.vnu.edu.vn",
    allowedDomains: ["hus.vnu.edu.vn", "hcmus.edu.vn"],
    parentOrg: "VNU",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  AMBIGUOUS_KHXHNV: {
    entityId: "AMBIGUOUS_KHXHNV",
    canonicalName: "ĐH Khoa học Xã hội và Nhân văn (USSH Hà Nội / USSH TP.HCM)",
    shortName: "ĐH KHXH&NV",
    aliases: ["khoa học xã hội và nhân văn viết tắt là ussh", "khoa học xã hội và nhân văn", "đh khoa học xã hội và nhân văn", "đại học khoa học xã hội và nhân văn", "nhân văn", "ussh hà nội hay ussh", "ussh"],
    officialDomain: "ussh.vnu.edu.vn",
    allowedDomains: ["ussh.vnu.edu.vn", "hcmussh.edu.vn"],
    parentOrg: "VNU",
    jurisdiction: "VN",
    type: "AMBIGUOUS_ACADEMIC_SYSTEM"
  },
  UED_UDN: {
    entityId: "UED_UDN",
    canonicalName: "Trường Đại học Sư phạm - Đại học Đà Nẵng",
    shortName: "ĐH Sư phạm Đà Nẵng",
    aliases: ["ued_udn", "ued", "đại học sư phạm đà nẵng", "đh sư phạm đà nẵng", "sư phạm đà nẵng", "ued đà nẵng"],
    officialDomain: "ued.udn.vn",
    allowedDomains: ["ued.udn.vn", "udn.vn"],
    parentOrg: "UDN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HUCFL: {
    entityId: "HUCFL",
    canonicalName: "Trường Đại học Ngoại ngữ - Đại học Huế",
    shortName: "ĐH Ngoại ngữ Huế",
    aliases: ["hucfl", "đại học ngoại ngữ huế", "đh ngoại ngữ huế", "ngoại ngữ huế"],
    officialDomain: "hucfl.edu.vn",
    allowedDomains: ["hucfl.edu.vn", "hueuni.edu.vn"],
    parentOrg: "HUE_UNI",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HUP: {
    entityId: "HUP",
    canonicalName: "Trường Đại học Dược Hà Nội",
    shortName: "Dược Hà Nội",
    aliases: ["hup", "đại học dược hà nội", "đh dược hà nội", "dược hà nội"],
    officialDomain: "hup.edu.vn",
    allowedDomains: ["hup.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VNUA: {
    entityId: "VNUA",
    canonicalName: "Học viện Nông nghiệp Việt Nam",
    shortName: "Học viện Nông nghiệp",
    aliases: ["vnua", "học viện nông nghiệp việt nam", "học viện nông nghiệp", "nông nghiệp việt nam", "nông nghiệp 1"],
    officialDomain: "vnua.edu.vn",
    allowedDomains: ["vnua.edu.vn"],
    parentOrg: "MARD_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TBU: {
    entityId: "TBU",
    canonicalName: "Trường Đại học Tây Bắc",
    shortName: "ĐH Tây Bắc",
    aliases: ["tbu", "đại học tây bắc", "đh tây bắc", "tây bắc tbu", "utb"],
    officialDomain: "utb.edu.vn",
    allowedDomains: ["utb.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TBU_TB: {
    entityId: "TBU_TB",
    canonicalName: "Trường Đại học Thái Bình",
    shortName: "ĐH Thái Bình",
    aliases: ["tbu_tb", "đại học thái bình", "đh thái bình", "thái bình tbu_tb", "thái bình tbu"],
    officialDomain: "tbu.edu.vn",
    allowedDomains: ["tbu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TTU: {
    entityId: "TTU",
    canonicalName: "Trường Đại học Tân Tạo",
    shortName: "ĐH Tân Tạo",
    aliases: ["ttu", "đại học tân tạo", "đh tân tạo", "tân tạo ttu"],
    officialDomain: "ttu.edu.vn",
    allowedDomains: ["ttu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TVU_HN: {
    entityId: "TVU_HN",
    canonicalName: "Trường Đại học Trưng Vương",
    shortName: "ĐH Trưng Vương",
    aliases: ["tvu_hn", "đại học trưng vương", "đh trưng vương", "trưng vương tvu_hn"],
    officialDomain: "dhtrunguong.edu.vn",
    allowedDomains: ["dhtrunguong.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  MSA: {
    entityId: "MSA",
    canonicalName: "Học viện Khoa học Quân sự",
    shortName: "Học viện Khoa học Quân sự",
    aliases: ["msa", "học viện khoa học quân sự", "hvkhqs", "khoa học quân sự msa"],
    officialDomain: "hvkhqs.edu.vn",
    allowedDomains: ["hvkhqs.edu.vn"],
    parentOrg: "MOD_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  MTA: {
    entityId: "MTA",
    canonicalName: "Học viện Kỹ thuật Quân sự",
    shortName: "Học viện Kỹ thuật Quân sự",
    aliases: ["mta", "học viện kỹ thuật quân sự", "kỹ thuật quân sự mta"],
    officialDomain: "mta.edu.vn",
    allowedDomains: ["mta.edu.vn"],
    parentOrg: "MOD_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  PPA: {
    entityId: "PPA",
    canonicalName: "Học viện Cảnh sát Nhân dân",
    shortName: "Học viện Cảnh sát",
    aliases: ["ppa", "học viện cảnh sát nhân dân", "học viện cảnh sát", "cảnh sát nhân dân ppa"],
    officialDomain: "ppa.edu.vn",
    allowedDomains: ["ppa.edu.vn"],
    parentOrg: "MPS_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  T01: {
    entityId: "T01",
    canonicalName: "Học viện An ninh Nhân dân",
    shortName: "Học viện An ninh",
    aliases: ["t01", "học viện an ninh nhân dân", "học viện an ninh", "hvannd", "an ninh nhân dân t01"],
    officialDomain: "hvannd.edu.vn",
    allowedDomains: ["hvannd.edu.vn"],
    parentOrg: "MPS_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  FSCS: {
    entityId: "FSCS",
    canonicalName: "Trường Đại học Phòng cháy Chữa cháy",
    shortName: "ĐH Phòng cháy Chữa cháy",
    aliases: ["fscs", "đại học phòng cháy chữa cháy", "đh phòng cháy chữa cháy", "phòng cháy chữa cháy fscs", "pccc"],
    officialDomain: "daihocpccc.bocongan.gov.vn",
    allowedDomains: ["daihocpccc.bocongan.gov.vn", "bocongan.gov.vn"],
    parentOrg: "MPS_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HPU_KS: {
    entityId: "HPU_KS",
    canonicalName: "Trường Đại học Kiểm sát Hà Nội",
    shortName: "ĐH Kiểm sát",
    aliases: ["hpu_ks", "hpu", "đại học kiểm sát hà nội", "đh kiểm sát hà nội", "kiểm sát hà nội", "đại học kiểm sát"],
    officialDomain: "hpu.vn",
    allowedDomains: ["hpu.vn"],
    parentOrg: "SPP_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VCA: {
    entityId: "VCA",
    canonicalName: "Học viện Tòa án",
    shortName: "Học viện Tòa án",
    aliases: ["vca", "học viện tòa án", "hvta"],
    officialDomain: "hvta.toaan.gov.vn",
    allowedDomains: ["hvta.toaan.gov.vn", "toaan.gov.vn"],
    parentOrg: "SPC_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  DNTU: {
    entityId: "DNTU",
    canonicalName: "Trường Đại học Công nghệ Đồng Nai",
    shortName: "ĐH Công nghệ Đồng Nai",
    aliases: ["dntu", "đại học công nghệ đồng nai", "đh công nghệ đồng nai", "công nghệ đồng nai"],
    officialDomain: "dntu.edu.vn",
    allowedDomains: ["dntu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TGU: {
    entityId: "TGU",
    canonicalName: "Trường Đại học Tiền Giang",
    shortName: "ĐH Tiền Giang",
    aliases: ["tgu", "đại học tiền giang", "đh tiền giang", "tiền giang tgu"],
    officialDomain: "tgu.edu.vn",
    allowedDomains: ["tgu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TVU: {
    entityId: "TVU",
    canonicalName: "Trường Đại học Trà Vinh",
    shortName: "ĐH Trà Vinh",
    aliases: ["tvu", "đại học trà vinh", "đh trà vinh", "trà vinh tvu"],
    officialDomain: "tvu.edu.vn",
    allowedDomains: ["tvu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  BLU: {
    entityId: "BLU",
    canonicalName: "Trường Đại học Bạc Liêu",
    shortName: "ĐH Bạc Liêu",
    aliases: ["blu", "đại học bạc liêu", "đh bạc liêu", "bạc liêu blu"],
    officialDomain: "blu.edu.vn",
    allowedDomains: ["blu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  UKH: {
    entityId: "UKH",
    canonicalName: "Trường Đại học Khánh Hòa",
    shortName: "ĐH Khánh Hòa",
    aliases: ["ukh", "đại học khánh hòa", "đh khánh hòa", "khánh hòa ukh"],
    officialDomain: "ukh.edu.vn",
    allowedDomains: ["ukh.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  QNU_QN: {
    entityId: "QNU_QN",
    canonicalName: "Trường Đại học Quảng Nam",
    shortName: "ĐH Quảng Nam",
    aliases: ["qnu_qn", "đại học quảng nam", "đh quảng nam", "quảng nam qnu_qn"],
    officialDomain: "qnu.edu.vn",
    allowedDomains: ["qnu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  QBU: {
    entityId: "QBU",
    canonicalName: "Trường Đại học Quảng Bình",
    shortName: "ĐH Quảng Bình",
    aliases: ["qbu", "đại học quảng bình", "đh quảng bình", "quảng bình qbu"],
    officialDomain: "qbu.edu.vn",
    allowedDomains: ["qbu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HDU: {
    entityId: "HDU",
    canonicalName: "Trường Đại học Hồng Đức",
    shortName: "ĐH Hồng Đức",
    aliases: ["hdu", "đại học hồng đức", "đh hồng đức", "hồng đức thanh hóa", "hồng đức hdu"],
    officialDomain: "hdu.edu.vn",
    allowedDomains: ["hdu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VUTED: {
    entityId: "VUTED",
    canonicalName: "Trường Đại học Sư phạm Kỹ thuật Vinh",
    shortName: "ĐH SPKT Vinh",
    aliases: ["vuted", "đại học sư phạm kỹ thuật vinh", "đh sư phạm kỹ thuật vinh", "spkt vinh", "vuted vinh"],
    officialDomain: "vuted.edu.vn",
    allowedDomains: ["vuted.edu.vn"],
    parentOrg: "MOLISA_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HPMU: {
    entityId: "HPMU",
    canonicalName: "Trường Đại học Y Dược Hải Phòng",
    shortName: "ĐH Y Dược Hải Phòng",
    aliases: ["hpmu", "đại học y dược hải phòng", "đh y dược hải phòng", "y dược hải phòng hpmu"],
    officialDomain: "hpmu.edu.vn",
    allowedDomains: ["hpmu.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TBUMP: {
    entityId: "TBUMP",
    canonicalName: "Trường Đại học Y Dược Thái Bình",
    shortName: "ĐH Y Dược Thái Bình",
    aliases: ["tbump", "đại học y dược thái bình", "đh y dược thái bình", "y dược thái bình tbump"],
    officialDomain: "tbump.edu.vn",
    allowedDomains: ["tbump.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  FE: {
    entityId: "FE",
    canonicalName: "Tổ chức Giáo dục FPT",
    shortName: "FPT Education",
    aliases: ["tổ chức giáo dục fpt", "fpt education", "giáo dục fpt"],
    officialDomain: "fpt.edu.vn",
    allowedDomains: ["fpt.edu.vn", "daihoc.fpt.edu.vn"],
    parentOrg: "FPT_CORP",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  MISA: {
    entityId: "MISA",
    canonicalName: "Công ty Cổ phần MISA",
    shortName: "MISA",
    aliases: ["công ty cổ phần misa", "misa", "sisap"],
    officialDomain: "misa.vn",
    allowedDomains: ["misa.vn"],
    parentOrg: "ENTERPRISE",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  VINIF: {
    entityId: "VINIF",
    canonicalName: "Quỹ Đổi mới sáng tạo Vingroup",
    shortName: "VINIF",
    aliases: ["quỹ đổi mới sáng tạo vinif", "quỹ vinif", "vinif"],
    officialDomain: "vinif.org",
    allowedDomains: ["vinif.org"],
    parentOrg: "VINGROUP",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  VSSID: {
    entityId: "VSSID",
    canonicalName: "Bảo hiểm Xã hội Việt Nam - VssID",
    shortName: "VssID BHXH",
    aliases: ["vssid", "bảo hiểm xã hội việt nam", "bhxh", "ứng dụng vssid"],
    officialDomain: "baohiemxahoi.gov.vn",
    allowedDomains: ["baohiemxahoi.gov.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "GOVERNMENT_REGULATOR"
  },
  VNEID: {
    entityId: "VNEID",
    canonicalName: "Bộ Công an - Định danh điện tử VNeID",
    shortName: "VNeID",
    aliases: ["vneid", "định danh điện tử vneid", "ứng dụng vneid"],
    officialDomain: "vneid.gov.vn",
    allowedDomains: ["vneid.gov.vn", "bocongan.gov.vn"],
    parentOrg: "MPS_VN",
    jurisdiction: "VN",
    type: "GOVERNMENT_REGULATOR"
  },
  NEAC: {
    entityId: "NEAC",
    canonicalName: "Trung tâm Chứng thực điện tử Quốc gia",
    shortName: "NEAC",
    aliases: ["neac", "trung tâm chứng thực điện tử quốc gia"],
    officialDomain: "neac.gov.vn",
    allowedDomains: ["neac.gov.vn", "mic.gov.vn"],
    parentOrg: "MIC_VN",
    jurisdiction: "VN",
    type: "GOVERNMENT_REGULATOR"
  },
  VNPAY: {
    entityId: "VNPAY",
    canonicalName: "Ví điện tử VNPAY",
    shortName: "VNPAY",
    aliases: ["vnpay", "ví điện tử vnpay"],
    officialDomain: "vnpay.vn",
    allowedDomains: ["vnpay.vn"],
    parentOrg: "FINTECH",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  MBBANK: {
    entityId: "MBBANK",
    canonicalName: "Ngân hàng TMCP Quân đội MBBank",
    shortName: "MBBank",
    aliases: ["mbbank", "ngân hàng quân đội", "mb bank"],
    officialDomain: "mbbank.com.vn",
    allowedDomains: ["mbbank.com.vn"],
    parentOrg: "BANK",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  TCB: {
    entityId: "TCB",
    canonicalName: "Ngân hàng Techcombank",
    shortName: "Techcombank",
    aliases: ["techcombank", "ngân hàng techcombank", "tcb"],
    officialDomain: "techcombank.com",
    allowedDomains: ["techcombank.com", "techcombank.com.vn"],
    parentOrg: "BANK",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  CTG: {
    entityId: "CTG",
    canonicalName: "Ngân hàng VietinBank",
    shortName: "VietinBank",
    aliases: ["vietinbank", "ngân hàng vietinbank", "ctg"],
    officialDomain: "vietinbank.vn",
    allowedDomains: ["vietinbank.vn"],
    parentOrg: "BANK",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  AGRIBANK: {
    entityId: "AGRIBANK",
    canonicalName: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam Agribank",
    shortName: "Agribank",
    aliases: ["agribank", "ngân hàng agribank"],
    officialDomain: "agribank.com.vn",
    allowedDomains: ["agribank.com.vn"],
    parentOrg: "BANK",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  TPBANK: {
    entityId: "TPBANK",
    canonicalName: "Ngân hàng Tiên Phong TPBank",
    shortName: "TPBank",
    aliases: ["tpbank", "ngân hàng tpbank"],
    officialDomain: "tpb.vn",
    allowedDomains: ["tpb.vn", "tpbank.com.vn"],
    parentOrg: "BANK",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  VPBANK: {
    entityId: "VPBANK",
    canonicalName: "Ngân hàng TMCP Việt Nam Thịnh Vượng VPBank",
    shortName: "VPBank",
    aliases: ["vpbank", "ngân hàng vpbank"],
    officialDomain: "vpbank.com.vn",
    allowedDomains: ["vpbank.com.vn"],
    parentOrg: "BANK",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  ACB: {
    entityId: "ACB",
    canonicalName: "Ngân hàng Á Châu ACB",
    shortName: "ACB",
    aliases: ["acb", "ngân hàng acb"],
    officialDomain: "acb.com.vn",
    allowedDomains: ["acb.com.vn"],
    parentOrg: "BANK",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  FPT_CORP: {
    entityId: "FPT_CORP",
    canonicalName: "Tập đoàn FPT",
    shortName: "Tập đoàn FPT",
    aliases: ["tập đoàn fpt", "fpt telecom", "fpt software"],
    officialDomain: "fpt.com.vn",
    allowedDomains: ["fpt.com.vn", "fpt.vn"],
    parentOrg: "ENTERPRISE",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  VIETTEL: {
    entityId: "VIETTEL",
    canonicalName: "Tập đoàn Công nghiệp - Viễn thông Quân đội Viettel",
    shortName: "Viettel",
    aliases: ["viettel", "tập đoàn viettel"],
    officialDomain: "viettel.com.vn",
    allowedDomains: ["viettel.com.vn", "viettel.vn"],
    parentOrg: "ENTERPRISE",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  SHOPEEPAY: {
    entityId: "SHOPEEPAY",
    canonicalName: "Ví điện tử ShopeePay",
    shortName: "ShopeePay",
    aliases: ["shopeepay", "ví shopeepay"],
    officialDomain: "shopeepay.vn",
    allowedDomains: ["shopeepay.vn"],
    parentOrg: "FINTECH",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  ZALOPAY: {
    entityId: "ZALOPAY",
    canonicalName: "Ví điện tử ZaloPay",
    shortName: "ZaloPay",
    aliases: ["zalopay", "ví zalopay", "zalo mini app"],
    officialDomain: "zalopay.vn",
    allowedDomains: ["zalopay.vn"],
    parentOrg: "FINTECH",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  NAPAS: {
    entityId: "NAPAS",
    canonicalName: "Công ty Cổ phần Thanh toán Quốc gia Việt Nam NAPAS",
    shortName: "NAPAS",
    aliases: ["napas", "công ty cổ phần thanh toán quốc gia việt nam"],
    officialDomain: "napas.com.vn",
    allowedDomains: ["napas.com.vn"],
    parentOrg: "FINTECH",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  MICROSOFT: {
    entityId: "MICROSOFT",
    canonicalName: "Microsoft Corporation",
    shortName: "Microsoft",
    aliases: ["microsoft", "microsoft learn student ambassadors"],
    officialDomain: "microsoft.com",
    allowedDomains: ["microsoft.com"],
    parentOrg: "TECH_CORP",
    jurisdiction: "GLOBAL",
    type: "AUTHORIZED_ORGANIZATION"
  },
  GOOGLE: {
    entityId: "GOOGLE",
    canonicalName: "Google LLC",
    shortName: "Google",
    aliases: ["google", "google developer student clubs", "gdsc"],
    officialDomain: "developers.google.com",
    allowedDomains: ["developers.google.com", "google.com"],
    parentOrg: "TECH_CORP",
    jurisdiction: "GLOBAL",
    type: "AUTHORIZED_ORGANIZATION"
  },
  BRITISH_COUNCIL: {
    entityId: "BRITISH_COUNCIL",
    canonicalName: "Hội đồng Anh British Council",
    shortName: "British Council",
    aliases: ["british council", "hội đồng anh"],
    officialDomain: "britishcouncil.vn",
    allowedDomains: ["britishcouncil.vn"],
    parentOrg: "EDUCATION_ORG",
    jurisdiction: "GLOBAL",
    type: "AUTHORIZED_ORGANIZATION"
  },
  IDP: {
    entityId: "IDP",
    canonicalName: "IDP Education Vietnam",
    shortName: "IDP Vietnam",
    aliases: ["idp", "idp education vietnam", "idp vietnam"],
    officialDomain: "idp.com",
    allowedDomains: ["idp.com"],
    parentOrg: "EDUCATION_ORG",
    jurisdiction: "GLOBAL",
    type: "AUTHORIZED_ORGANIZATION"
  },
  IIG_VN: {
    entityId: "IIG_VN",
    canonicalName: "IIG Việt Nam",
    shortName: "IIG Việt Nam",
    aliases: ["iig việt nam", "iig vietnam", "iig"],
    officialDomain: "iigvietnam.com",
    allowedDomains: ["iigvietnam.com"],
    parentOrg: "EDUCATION_ORG",
    jurisdiction: "VN",
    type: "AUTHORIZED_ORGANIZATION"
  },
  TUU: {
    entityId: "TUU",
    canonicalName: "Trường Đại học Công đoàn",
    shortName: "ĐH Công đoàn",
    aliases: ["tuu", "đại học công đoàn", "đh công đoàn", "công đoàn tuu"],
    officialDomain: "tuu.edu.vn",
    allowedDomains: ["tuu.edu.vn"],
    parentOrg: "VGCL_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  ULSA: {
    entityId: "ULSA",
    canonicalName: "Trường Đại học Lao động - Xã hội",
    shortName: "ĐH Lao động Xã hội",
    aliases: ["ulsa", "đại học lao động xã hội", "đh lao động xã hội", "lao động xã hội ulsa"],
    officialDomain: "ulsa.edu.vn",
    allowedDomains: ["ulsa.edu.vn"],
    parentOrg: "MOLISA_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HUC: {
    entityId: "HUC",
    canonicalName: "Trường Đại học Văn hóa Hà Nội",
    shortName: "ĐH Văn hóa Hà Nội",
    aliases: ["huc", "đại học văn hóa hà nội", "đh văn hóa hà nội", "văn hóa hà nội huc"],
    officialDomain: "huc.edu.vn",
    allowedDomains: ["huc.edu.vn"],
    parentOrg: "MCST_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  USH: {
    entityId: "USH",
    canonicalName: "Trường Đại học Thể dục Thể thao TP.HCM",
    shortName: "ĐH TDTT TP.HCM",
    aliases: ["ush", "đại học thể dục thể thao tp.hcm", "đh thể dục thể thao tphcm", "thể dục thể thao ush"],
    officialDomain: "ush.edu.vn",
    allowedDomains: ["ush.edu.vn"],
    parentOrg: "MCST_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VFA: {
    entityId: "VFA",
    canonicalName: "Trường Đại học Mỹ thuật Việt Nam",
    shortName: "ĐH Mỹ thuật Việt Nam",
    aliases: ["vfa", "đại học mỹ thuật việt nam", "đh mỹ thuật việt nam", "mỹ thuật việt nam vfa"],
    officialDomain: "vfa.edu.vn",
    allowedDomains: ["vfa.edu.vn"],
    parentOrg: "MCST_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HCMCONS: {
    entityId: "HCMCONS",
    canonicalName: "Nhạc viện Thành phố Hồ Chí Minh",
    shortName: "Nhạc viện TP.HCM",
    aliases: ["hcmcons", "nhạc viện tp.hcm", "nhạc viện tphcm", "nhạc viện thành phố hồ chí minh"],
    officialDomain: "hcmcons.vn",
    allowedDomains: ["hcmcons.vn"],
    parentOrg: "MCST_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  SKDA: {
    entityId: "SKDA",
    canonicalName: "Trường Đại học Sân khấu - Điện ảnh Hà Nội",
    shortName: "ĐH Sân khấu Điện ảnh",
    aliases: ["skda", "đại học sân khấu điện ảnh hà nội", "đh sân khấu điện ảnh", "sân khấu điện ảnh skda"],
    officialDomain: "skda.edu.vn",
    allowedDomains: ["skda.edu.vn"],
    parentOrg: "MCST_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  UPT: {
    entityId: "UPT",
    canonicalName: "Trường Đại học Phan Thiết",
    shortName: "ĐH Phan Thiết",
    aliases: ["upt", "đại học phan thiết", "đh phan thiết", "phan thiết upt"],
    officialDomain: "upt.edu.vn",
    allowedDomains: ["upt.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  DNC: {
    entityId: "DNC",
    canonicalName: "Trường Đại học Nam Cần Thơ",
    shortName: "ĐH Nam Cần Thơ",
    aliases: ["dnc", "đại học nam cần thơ", "đh nam cần thơ", "nam cần thơ dnc"],
    officialDomain: "dnc.edu.vn",
    allowedDomains: ["dnc.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  MKU: {
    entityId: "MKU",
    canonicalName: "Trường Đại học Cửu Long",
    shortName: "ĐH Cửu Long",
    aliases: ["mku", "đại học cửu long", "đh cửu long", "cửu long mku"],
    officialDomain: "mku.edu.vn",
    allowedDomains: ["mku.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  BVU: {
    entityId: "BVU",
    canonicalName: "Trường Đại học Bà Rịa - Vũng Tàu",
    shortName: "ĐH Bà Rịa Vũng Tàu",
    aliases: ["bvu", "đại học bà rịa vũng tàu", "đh bà rịa vũng tàu", "bà rịa vũng tàu bvu"],
    officialDomain: "bvu.edu.vn",
    allowedDomains: ["bvu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  YERSIN: {
    entityId: "YERSIN",
    canonicalName: "Trường Đại học Yersin Đà Lạt",
    shortName: "ĐH Yersin",
    aliases: ["yersin", "đại học yersin đà lạt", "đh yersin đà lạt", "yersin đà lạt"],
    officialDomain: "yersin.edu.vn",
    allowedDomains: ["yersin.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VMMU: {
    entityId: "VMMU",
    canonicalName: "Học viện Quân y",
    shortName: "Học viện Quân y",
    aliases: ["vmmu", "học viện quân y", "quân y vmmu"],
    officialDomain: "vmmu.edu.vn",
    allowedDomains: ["vmmu.edu.vn"],
    parentOrg: "MOD_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HTU: {
    entityId: "HTU",
    canonicalName: "Trường Đại học Hà Tĩnh",
    shortName: "ĐH Hà Tĩnh",
    aliases: ["htu", "đại học hà tĩnh", "đh hà tĩnh", "hà tĩnh htu"],
    officialDomain: "htu.edu.vn",
    allowedDomains: ["htu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VMU: {
    entityId: "VMU",
    canonicalName: "Trường Đại học Hàng hải Việt Nam",
    shortName: "ĐH Hàng hải",
    aliases: ["vmu", "đại học hàng hải việt nam", "đh hàng hải việt nam", "hàng hải vmu", "vimaru"],
    officialDomain: "vimaru.edu.vn",
    allowedDomains: ["vimaru.edu.vn"],
    parentOrg: "MOT_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HUMG: {
    entityId: "HUMG",
    canonicalName: "Trường Đại học Mỏ - Địa chất",
    shortName: "ĐH Mỏ - Địa chất",
    aliases: ["humg", "đại học mỏ địa chất", "đh mỏ địa chất", "mỏ địa chất humg"],
    officialDomain: "humg.edu.vn",
    allowedDomains: ["humg.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VNAM: {
    entityId: "VNAM",
    canonicalName: "Học viện Âm nhạc Quốc gia Việt Nam",
    shortName: "Học viện Âm nhạc Quốc gia",
    aliases: ["vnam", "học viện âm nhạc quốc gia việt nam", "học viện âm nhạc quốc gia", "nhạc viện hà nội"],
    officialDomain: "vnam.edu.vn",
    allowedDomains: ["vnam.edu.vn"],
    parentOrg: "MCST_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  BMTU: {
    entityId: "BMTU",
    canonicalName: "Trường Đại học Y Dược Buôn Ma Thuột",
    shortName: "ĐH Y Dược Buôn Ma Thuột",
    aliases: ["bmtu", "đại học y dược buôn ma thuột", "đh y dược buôn ma thuột", "y dược buôn ma thuột"],
    officialDomain: "bmtu.edu.vn",
    allowedDomains: ["bmtu.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TBD: {
    entityId: "TBD",
    canonicalName: "Trường Đại học Thái Bình Dương",
    shortName: "ĐH Thái Bình Dương",
    aliases: ["tbd", "đại học thái bình dương", "đh thái bình dương", "thái bình dương tbd"],
    officialDomain: "tbd.edu.vn",
    allowedDomains: ["tbd.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  EIU: {
    entityId: "EIU",
    canonicalName: "Trường Đại học Quốc tế Miền Đông",
    shortName: "ĐH Quốc tế Miền Đông",
    aliases: ["eiu", "đại học quốc tế miền đông", "đh quốc tế miền đông", "quốc tế miền đông eiu"],
    officialDomain: "eiu.edu.vn",
    allowedDomains: ["eiu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  BHIU: {
    entityId: "BHIU",
    canonicalName: "Trường Đại học Quốc tế Bắc Hà",
    shortName: "ĐH Quốc tế Bắc Hà",
    aliases: ["bhiu", "đại học quốc tế bắc hà", "đh quốc tế bắc hà", "quốc tế bắc hà bhiu"],
    officialDomain: "bhiu.edu.vn",
    allowedDomains: ["bhiu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  CVA: {
    entityId: "CVA",
    canonicalName: "Trường Đại học Chu Văn An",
    shortName: "ĐH Chu Văn An",
    aliases: ["cva", "đại học chu văn an", "đh chu văn an", "chu văn an cva"],
    officialDomain: "cva.edu.vn",
    allowedDomains: ["cva.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VNUKG: {
    entityId: "VNUKG",
    canonicalName: "Trường Đại học Kiên Giang",
    shortName: "ĐH Kiên Giang",
    aliases: ["vnukg", "đại học kiên giang", "đh kiên giang", "kiên giang vnukg"],
    officialDomain: "vnukg.edu.vn",
    allowedDomains: ["vnukg.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  BLU: {
    entityId: "BLU",
    canonicalName: "Trường Đại học Bạc Liêu",
    shortName: "ĐH Bạc Liêu",
    aliases: ["blu", "đại học bạc liêu", "đh bạc liêu", "bạc liêu blu"],
    officialDomain: "blu.edu.vn",
    allowedDomains: ["blu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  UTB: {
    entityId: "UTB",
    canonicalName: "Trường Đại học Tây Bắc",
    shortName: "ĐH Tây Bắc",
    aliases: ["utb", "đại học tây bắc", "đh tây bắc", "tây bắc utb"],
    officialDomain: "utb.edu.vn",
    allowedDomains: ["utb.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  TTRU: {
    entityId: "TTRU",
    canonicalName: "Trường Đại học Tân Trào",
    shortName: "ĐH Tân Trào",
    aliases: ["ttru", "đại học tân trào", "đh tân trào", "tân trào ttru", "tân trào"],
    officialDomain: "daihoctantrao.edu.vn",
    allowedDomains: ["daihoctantrao.edu.vn", "ttru.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  PYU: {
    entityId: "PYU",
    canonicalName: "Trường Đại học Phú Yên",
    shortName: "ĐH Phú Yên",
    aliases: ["pyu", "đại học phú yên", "đh phú yên", "phú yên pyu", "phú yên"],
    officialDomain: "pyu.edu.vn",
    allowedDomains: ["pyu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  UKH: {
    entityId: "UKH",
    canonicalName: "Trường Đại học Khánh Hòa",
    shortName: "ĐH Khánh Hòa",
    aliases: ["ukh", "đại học khánh hòa", "đh khánh hòa", "khánh hòa ukh"],
    officialDomain: "ukh.edu.vn",
    allowedDomains: ["ukh.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  HTU: {
    entityId: "HTU",
    canonicalName: "Trường Đại học Hà Tĩnh",
    shortName: "ĐH Hà Tĩnh",
    aliases: ["htu", "đại học hà tĩnh", "đh hà tĩnh", "hà tĩnh htu"],
    officialDomain: "htu.edu.vn",
    allowedDomains: ["htu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  DThU: {
    entityId: "DThU",
    canonicalName: "Trường Đại học Đồng Tháp",
    shortName: "ĐH Đồng Tháp",
    aliases: ["dthu", "đại học đồng tháp", "đh đồng tháp", "đồng tháp dthu"],
    officialDomain: "dthu.edu.vn",
    allowedDomains: ["dthu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  QBU: {
    entityId: "QBU",
    canonicalName: "Trường Đại học Quảng Bình",
    shortName: "ĐH Quảng Bình",
    aliases: ["qbu", "đại học quảng bình", "đh quảng bình", "quảng bình qbu"],
    officialDomain: "qbu.edu.vn",
    allowedDomains: ["qbu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  BAFU: {
    entityId: "BAFU",
    canonicalName: "Trường Đại học Nông - Lâm Bắc Giang",
    shortName: "ĐH Nông - Lâm Bắc Giang",
    aliases: ["bafu", "đại học nông lâm bắc giang", "đh nông lâm bắc giang", "nông lâm bắc giang"],
    officialDomain: "bafu.edu.vn",
    allowedDomains: ["bafu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VLUTE: {
    entityId: "VLUTE",
    canonicalName: "Trường Đại học Sư phạm Kỹ thuật Vĩnh Long",
    shortName: "ĐH SPKT Vĩnh Long",
    aliases: ["vlute", "đại học sư phạm kỹ thuật vĩnh long", "đh spkt vĩnh long", "spkt vĩnh long"],
    officialDomain: "vlute.edu.vn",
    allowedDomains: ["vlute.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TGU: {
    entityId: "TGU",
    canonicalName: "Trường Đại học Tiền Giang",
    shortName: "ĐH Tiền Giang",
    aliases: ["tgu", "đại học tiền giang", "đh tiền giang", "tiền giang tgu"],
    officialDomain: "tgu.edu.vn",
    allowedDomains: ["tgu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  MTU: {
    entityId: "MTU",
    canonicalName: "Trường Đại học Xây dựng Miền Tây",
    shortName: "ĐH Xây dựng Miền Tây",
    aliases: ["mtu", "đại học xây dựng miền tây", "đh xây dựng miền tây", "xây dựng miền tây"],
    officialDomain: "mtu.edu.vn",
    allowedDomains: ["mtu.edu.vn"],
    parentOrg: "MOC_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  DLA: {
    entityId: "DLA",
    canonicalName: "Trường Đại học Kinh tế Công nghiệp Long An",
    shortName: "ĐH KTCN Long An",
    aliases: ["dla", "đại học kinh tế công nghiệp long an", "đh ktcn long an", "kinh tế công nghiệp long an"],
    officialDomain: "dla.edu.vn",
    allowedDomains: ["dla.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TBU: {
    entityId: "TBU",
    canonicalName: "Trường Đại học Thái Bình",
    shortName: "ĐH Thái Bình",
    aliases: ["tbu", "đại học thái bình", "đh thái bình", "thái bình tbu"],
    officialDomain: "tbu.edu.vn",
    allowedDomains: ["tbu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  TBUMP: {
    entityId: "TBUMP",
    canonicalName: "Trường Đại học Y Dược Thái Bình",
    shortName: "ĐH Y Dược Thái Bình",
    aliases: ["tbump", "đại học y dược thái bình", "đh y dược thái bình", "y dược thái bình"],
    officialDomain: "tbump.edu.vn",
    allowedDomains: ["tbump.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HPMU: {
    entityId: "HPMU",
    canonicalName: "Trường Đại học Y Dược Hải Phòng",
    shortName: "ĐH Y Dược Hải Phòng",
    aliases: ["hpmu", "đại học y dược hải phòng", "đh y dược hải phòng", "y dược hải phòng"],
    officialDomain: "hpmu.edu.vn",
    allowedDomains: ["hpmu.edu.vn"],
    parentOrg: "MOH_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VMU: {
    entityId: "VMU",
    canonicalName: "Trường Đại học Hàng hải Việt Nam",
    shortName: "ĐH Hàng hải",
    aliases: ["vmu", "đại học hàng hải", "đh hàng hải", "hàng hải việt nam", "vimaru"],
    officialDomain: "vimaru.edu.vn",
    allowedDomains: ["vimaru.edu.vn", "vmu.edu.vn"],
    parentOrg: "MOT_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HPU: {
    entityId: "HPU",
    canonicalName: "Trường Đại học Quản lý và Công nghệ Hải Phòng",
    shortName: "ĐH QL&CN Hải Phòng",
    aliases: ["hpu", "đại học dân lập hải phòng", "đại học quản lý và công nghệ hải phòng", "đh hpu"],
    officialDomain: "hpu.edu.vn",
    allowedDomains: ["hpu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  DQU: {
    entityId: "DQU",
    canonicalName: "Trường Đại học Quảng Nam",
    shortName: "ĐH Quảng Nam",
    aliases: ["dqu", "đại học quảng nam", "đh quảng nam", "quảng nam dqu"],
    officialDomain: "dqu.edu.vn",
    allowedDomains: ["dqu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  TVU: {
    entityId: "TVU",
    canonicalName: "Trường Đại học Trà Vinh",
    shortName: "ĐH Trà Vinh",
    aliases: ["tvu", "đại học trà vinh", "đh trà vinh", "trà vinh tvu"],
    officialDomain: "tvu.edu.vn",
    allowedDomains: ["tvu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  Mekong: {
    entityId: "Mekong",
    canonicalName: "Trường Đại học Cửu Long",
    shortName: "ĐH Cửu Long",
    aliases: ["mekong", "đại học cửu long", "đh cửu long", "cửu long mekong"],
    officialDomain: "mku.edu.vn",
    allowedDomains: ["mku.edu.vn", "mekong.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  DNC: {
    entityId: "DNC",
    canonicalName: "Trường Đại học Nam Cần Thơ",
    shortName: "ĐH Nam Cần Thơ",
    aliases: ["dnc", "đại học nam cần thơ", "đh nam cần thơ", "nam cần thơ dnc"],
    officialDomain: "nctu.edu.vn",
    allowedDomains: ["nctu.edu.vn", "dnc.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  FPT_CT: {
    entityId: "FPT_CT",
    canonicalName: "Đại học FPT Cần Thơ",
    shortName: "FPT Cần Thơ",
    aliases: [
      "fpt ct", "fpt cần thơ", "đại học fpt cần thơ", "fpt can tho",
      "đại học fpt phân hiệu cần thơ", "fpt phân hiệu cần thơ", "phân hiệu cần thơ"
    ],
    officialDomain: "cantho.fpt.edu.vn",
    allowedDomains: ["cantho.fpt.edu.vn", "fpt.edu.vn"],
    parentOrg: "FPTU",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  AGU: {
    entityId: "AGU",
    canonicalName: "Trường Đại học An Giang - ĐHQG TP.HCM",
    shortName: "ĐH An Giang",
    aliases: ["agu", "đại học an giang", "đh an giang", "an giang agu"],
    officialDomain: "agu.edu.vn",
    allowedDomains: ["agu.edu.vn", "vnuhcm.edu.vn"],
    parentOrg: "VNUHCM",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HDU: {
    entityId: "HDU",
    canonicalName: "Trường Đại học Hồng Đức",
    shortName: "ĐH Hồng Đức",
    aliases: ["hdu", "đại học hồng đức", "đh hồng đức", "hồng đức hdu"],
    officialDomain: "hdu.edu.vn",
    allowedDomains: ["hdu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "REGIONAL_UNIVERSITY"
  },
  DVHTD: {
    entityId: "DVHTD",
    canonicalName: "Trường Đại học Văn hóa, Thể thao và Du lịch Thanh Hóa",
    shortName: "ĐH VHTT&DL Thanh Hóa",
    aliases: [
      "dvhtd", "đại học văn hóa thể thao du lịch thanh hóa", "đh vhtt&dl thanh hóa",
      "đại học văn hóa thể thao và du lịch thanh hóa", "văn hóa thể thao và du lịch thanh hóa",
      "trường đại học văn hóa thể thao và du lịch thanh hóa"
    ],
    officialDomain: "dvhtd.edu.vn",
    allowedDomains: ["dvhtd.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  UTEHY: {
    entityId: "UTEHY",
    canonicalName: "Trường Đại học Sư phạm Kỹ thuật Hưng Yên",
    shortName: "ĐH SPKT Hưng Yên",
    aliases: ["utehy", "đại học sư phạm kỹ thuật hưng yên", "đh spkt hưng yên", "spkt hưng yên"],
    officialDomain: "utehy.edu.vn",
    allowedDomains: ["utehy.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  BUV: {
    entityId: "BUV",
    canonicalName: "Trường Đại học Anh Quốc Việt Nam - British University Vietnam",
    shortName: "BUV",
    aliases: ["buv", "đại học anh quốc", "british university vietnam"],
    officialDomain: "buv.edu.vn",
    allowedDomains: ["buv.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VINUNI: {
    entityId: "VINUNI",
    canonicalName: "Trường Đại học VinUni",
    shortName: "VinUni",
    aliases: ["vinuni", "đại học vinuni", "vinuniversity", "vin uni"],
    officialDomain: "vinuni.edu.vn",
    allowedDomains: ["vinuni.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  FUV: {
    entityId: "FUV",
    canonicalName: "Trường Đại học Fulbright Việt Nam",
    shortName: "Fullbright",
    aliases: ["fuv", "fulbright", "đại học fulbright", "fulbright vietnam"],
    officialDomain: "fulbright.edu.vn",
    allowedDomains: ["fulbright.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  SWINBURNE: {
    entityId: "SWINBURNE",
    canonicalName: "Swinburne Vietnam",
    shortName: "Swinburne",
    aliases: ["swinburne", "swinburne vietnam", "đại học swinburne"],
    officialDomain: "swinburne-vn.edu.vn",
    allowedDomains: ["swinburne-vn.edu.vn", "swinburne.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  EIU: {
    entityId: "EIU",
    canonicalName: "Trường Đại học Quốc tế Miền Đông",
    shortName: "EIU",
    aliases: ["eiu", "đại học quốc tế miền đông", "đh quốc tế miền đông"],
    officialDomain: "eiu.edu.vn",
    allowedDomains: ["eiu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  VLU: {
    entityId: "VLU",
    canonicalName: "Trường Đại học Văn Lang",
    shortName: "ĐH Văn Lang",
    aliases: ["vlu", "đại học văn lang", "đh văn lang", "văn lang"],
    officialDomain: "vlu.edu.vn",
    allowedDomains: ["vlu.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HSU: {
    entityId: "HSU",
    canonicalName: "Trường Đại học Hoa Sen",
    shortName: "ĐH Hoa Sen",
    aliases: ["hsu", "đại học hoa sen", "đh hoa sen", "hoa sen"],
    officialDomain: "hoasen.edu.vn",
    allowedDomains: ["hoasen.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HUTECH: {
    entityId: "HUTECH",
    canonicalName: "Trường Đại học Công nghệ TP.HCM",
    shortName: "HUTECH",
    aliases: ["hutech", "đại học công nghệ tphcm", "đh công nghệ tphcm"],
    officialDomain: "hutech.edu.vn",
    allowedDomains: ["hutech.edu.vn"],
    parentOrg: "MOET_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  SAMSUNG_SRV: {
    entityId: "SAMSUNG_SRV",
    canonicalName: "Samsung Vietnam R&D Center",
    shortName: "Samsung SRV",
    aliases: ["samsung srv", "samsung r&d", "samsung vietnam"],
    officialDomain: "samsung.com",
    allowedDomains: ["samsung.com"],
    parentOrg: "SAMSUNG",
    jurisdiction: "VN",
    type: "CORPORATE_PARTNER"
  },
  VINIF: {
    entityId: "VINIF",
    canonicalName: "Quỹ Đổi mới sáng tạo Vingroup",
    shortName: "VINIF",
    aliases: ["vinif", "quỹ vinif", "học bổng vinif"],
    officialDomain: "vinif.org",
    allowedDomains: ["vinif.org"],
    parentOrg: "VINGROUP",
    jurisdiction: "VN",
    type: "FOUNDATION"
  },
  MISA: {
    entityId: "MISA",
    canonicalName: "Công ty Cổ phần MISA",
    shortName: "MISA",
    aliases: ["misa", "misa tuyển dụng", "học bổng misa"],
    officialDomain: "misa.vn",
    allowedDomains: ["misa.vn"],
    parentOrg: "MISA",
    jurisdiction: "VN",
    type: "CORPORATE_PARTNER"
  },
  GOVERNMENT_VN: {
    entityId: "GOVERNMENT_VN",
    canonicalName: "Chính phủ Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam",
    shortName: "Chính phủ",
    aliases: ["chính phủ", "chính phủ việt nam", "thủ tướng", "thủ tướng chính phủ", "nghị định chính phủ", "chính phủ quy định", "khung học phí các cơ sở giáo dục đại học", "nghị định 81/2021", "nghị định 97/2023"],
    officialDomain: "chinhphu.vn",
    allowedDomains: ["chinhphu.vn", "baochinhphu.vn"],
    parentOrg: "NATIONAL_ASSEMBLY_VN",
    jurisdiction: "VN",
    type: "GOVERNMENT_REGULATOR"
  },
  BHXH_VN: {
    entityId: "BHXH_VN",
    canonicalName: "Bảo hiểm Xã hội Việt Nam",
    shortName: "BHXH Việt Nam",
    aliases: ["bhxh", "bảo hiểm xã hội", "bảo hiểm y tế", "bhyt", "bhyt sinh viên", "bảo hiểm y tế sinh viên", "mức đóng và quyền lợi khám chữa bệnh"],
    officialDomain: "baohiemxahoi.gov.vn",
    allowedDomains: ["baohiemxahoi.gov.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "GOVERNMENT_REGULATOR"
  },
  MOD_VN: {
    entityId: "MOD_VN",
    canonicalName: "Bộ Quốc phòng Việt Nam",
    shortName: "Bộ Quốc phòng",
    aliases: ["bộ quốc phòng", "nghĩa vụ quân sự", "tạm hoãn nghĩa vụ quân sự", "hoãn nghĩa vụ quân sự", "luật nghĩa vụ quân sự", "khám sơ tuyển nghĩa vụ"],
    officialDomain: "mod.gov.vn",
    allowedDomains: ["mod.gov.vn", "bqp.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "GOVERNMENT_REGULATOR"
  },
  TW_DOAN: {
    entityId: "TW_DOAN",
    canonicalName: "Trung ương Đoàn TNCS Hồ Chí Minh - Hội Sinh viên Việt Nam",
    shortName: "TW Đoàn",
    aliases: ["trung ương đoàn", "tw đoàn", "sinh viên 5 tốt", "hội sinh viên việt nam", "đoàn thanh niên"],
    officialDomain: "doanthanhnien.vn",
    allowedDomains: ["doanthanhnien.vn", "sinhvienvietnam.vn"],
    parentOrg: "COMMUNIST_PARTY_VN",
    jurisdiction: "VN",
    type: "STUDENT_AFFAIRS_BODY"
  },
  DVCQG: {
    entityId: "DVCQG",
    canonicalName: "Cổng Dịch vụ công Quốc gia",
    shortName: "DVCQG",
    aliases: ["dvcqg", "dịch vụ công quốc gia", "cổng dịch vụ công"],
    officialDomain: "dichvucong.gov.vn",
    allowedDomains: ["dichvucong.gov.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "GOVERNMENT_REGULATOR"
  },
  UIT_VNUHCM: {
    entityId: "UIT_VNUHCM",
    canonicalName: "Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM",
    shortName: "UIT",
    aliases: ["uit", "đại học công nghệ thông tin", "đh công nghệ thông tin", "cntt đhqg", "đh cntt"],
    officialDomain: "uit.edu.vn",
    allowedDomains: ["uit.edu.vn", "vnuhcm.edu.vn"],
    parentOrg: "VNUHCM",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  UTH: {
    entityId: "UTH",
    canonicalName: "Trường Đại học Giao thông Vận tải TP.HCM",
    shortName: "UTH",
    aliases: ["uth", "đại học giao thông vận tải tp.hcm", "đh gtvt tphcm", "gtvt tphcm", "đại học giao thông vận tải tphcm"],
    officialDomain: "uth.edu.vn",
    allowedDomains: ["uth.edu.vn"],
    parentOrg: "MOT_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  TUOITRE: {
    entityId: "TUOITRE",
    canonicalName: "Báo Tuổi Trẻ",
    shortName: "Tuổi Trẻ",
    aliases: [
      "tuổi trẻ", "báo tuổi trẻ", "tuoitre.vn",
      "tiếp sức đến trường", "tiep suc den truong", "học bổng tiếp sức đến trường"
    ],
    officialDomain: "tuoitre.vn",
    allowedDomains: ["tuoitre.vn"],
    parentOrg: "PRESS_MEDIA",
    jurisdiction: "VN",
    type: "PRESS_MEDIA"
  },
  RMIT: {
    entityId: "RMIT",
    canonicalName: "RMIT University Vietnam",
    shortName: "RMIT",
    aliases: ["rmit", "đại học rmit", "rmit việt nam", "rmit vietnam"],
    officialDomain: "rmit.edu.vn",
    allowedDomains: ["rmit.edu.vn"],
    parentOrg: "RMIT_AU",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  FSOFT: {
    entityId: "FSOFT",
    canonicalName: "FPT Software",
    shortName: "FPT Software",
    aliases: ["fsoft", "fpt software", "fpt software tuyển dụng"],
    officialDomain: "fptsoftware.com",
    allowedDomains: ["fptsoftware.com", "fpt.com"],
    parentOrg: "FPT_CORP",
    jurisdiction: "VN",
    type: "CORPORATE_PARTNER"
  },
  MOMO: {
    entityId: "MOMO",
    canonicalName: "Ví điện tử MoMo - Công ty Cổ phần Dịch vụ Di động Trực tuyến",
    shortName: "MoMo",
    aliases: ["momo", "ví momo", "momo tuyển dụng", "học bổng momo"],
    officialDomain: "momo.vn",
    allowedDomains: ["momo.vn"],
    parentOrg: "M_SERVICE",
    jurisdiction: "VN",
    type: "FINTECH_PARTNER"
  },
  SHOPEE: {
    entityId: "SHOPEE",
    canonicalName: "Shopee Vietnam",
    shortName: "Shopee",
    aliases: ["shopee", "shopee việt nam", "shopee tuyển dụng"],
    officialDomain: "shopee.vn",
    allowedDomains: ["shopee.vn"],
    parentOrg: "SEA_GROUP",
    jurisdiction: "VN",
    type: "CORPORATE_PARTNER"
  },
  HVTC: {
    entityId: "HVTC",
    canonicalName: "Học viện Tài chính",
    shortName: "Học viện Tài chính",
    aliases: ["hvtc", "học viện tài chính", "hv tài chính"],
    officialDomain: "hvtc.edu.vn",
    allowedDomains: ["hvtc.edu.vn"],
    parentOrg: "MOF_VN",
    jurisdiction: "VN",
    type: "ACADEMY"
  },
  HVNH: {
    entityId: "HVNH",
    canonicalName: "Học viện Ngân hàng",
    shortName: "Học viện Ngân hàng",
    aliases: ["hvnh", "học viện ngân hàng", "hv ngân hàng"],
    officialDomain: "hvnh.edu.vn",
    allowedDomains: ["hvnh.edu.vn"],
    parentOrg: "SBV_VN",
    jurisdiction: "VN",
    type: "ACADEMY"
  },
  VNU: {
    entityId: "VNU",
    canonicalName: "Đại học Quốc gia Hà Nội",
    shortName: "ĐHQG Hà Nội",
    aliases: ["vnu", "đhqg hà nội", "đhqghn", "đại học quốc gia hà nội"],
    officialDomain: "vnu.edu.vn",
    allowedDomains: ["vnu.edu.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "NATIONAL_UNIVERSITY"
  },
  VNU_UL: {
    entityId: "VNU_UL",
    canonicalName: "Trường Đại học Luật - ĐHQG Hà Nội",
    shortName: "ĐH Luật ĐHQGHN",
    aliases: ["đại học luật đhqghn", "đh luật đhqghn", "trường đh luật - đhqghn", "luật đhqghn"],
    officialDomain: "law.vnu.edu.vn",
    allowedDomains: ["law.vnu.edu.vn", "vnu.edu.vn"],
    parentOrg: "VNU",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  HTU_TEXTILE: {
    entityId: "HTU_TEXTILE",
    canonicalName: "Trường Đại học Công nghiệp Dệt May Hà Nội",
    shortName: "ĐH Dệt May",
    aliases: ["đại học công nghiệp dệt may hà nội", "đh dệt may", "dệt may hà nội", "đh công nghiệp dệt may"],
    officialDomain: "hict.edu.vn",
    allowedDomains: ["hict.edu.vn"],
    parentOrg: "MOIT_VN",
    jurisdiction: "VN",
    type: "HIGHER_EDUCATION_INSTITUTION"
  },
  BAOHIEM: {
    entityId: "BAOHIEM",
    canonicalName: "Cơ quan Bảo hiểm Y tế / Bảo hiểm Xã hội",
    shortName: "Bảo hiểm",
    aliases: [
      "bảo hiểm y tế sinh viên", "quy định bảo hiểm y tế",
      "bảo hiểm tai nạn", "bao hiem tai nan", "bảo hiểm thương tật", "bao hiem thuong tat",
      "bảo hiểm tai nạn thương tật"
    ],
    officialDomain: "baohiemxahoi.gov.vn",
    allowedDomains: ["baohiemxahoi.gov.vn"],
    parentOrg: "GOVERNMENT_VN",
    jurisdiction: "VN",
    type: "GOVERNMENT_REGULATOR"
  }
};

export class EntityResolutionService {
  static normalizeHomoglyphs(str) {
    return str
      .replace(/[ƉĐđ]/g, "đ")
      .replace(/[нh]/g, "h")
      .replace(/[вb]/g, "b")
      .replace(/[ѕs]/g, "s")
      .replace(/[тt]/g, "t")
      .replace(/[рp]/g, "p")
      .replace(/[аa]/g, "a")
      .replace(/[оo]/g, "o")
      .replace(/[еe]/g, "e")
      .replace(/[сc]/g, "c")
      .replace(/[уy]/g, "y")
      .replace(/[кk]/g, "k")
      .replace(/[мm]/g, "m")
      .replace(/[хx]/g, "x")
      .replace(/[і\u0456ї\u0457]/g, "i");
  }

  static stripDiacritics(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d");
  }

  /**
   * Resolves raw text or entity mentions to canonical entity records.
   * @param {string} text
   * @param {object} [options={}] - optional context parameters (e.g. contextEntityId)
   * @returns {Array<object>} Resolved entities with confidence and official domains
   */
  static resolveEntities(text, options = {}) {
    if (!text || typeof text !== "string") return [];
    const rawNormalized = text.toLowerCase().normalize("NFC");
    const normalized = EntityResolutionService.normalizeHomoglyphs(rawNormalized);
    // Multi-form normalization: collapse abbreviation dots and spaces
    const cleanNormalized = normalized
      .replace(/tp\.\s*hcm/g, "tphcm")
      .replace(/tp\s+hcm/g, "tphcm")
      .replace(/đh\./g, "đh")
      .replace(/hv\./g, "hv")
      .replace(/\s*-\s*/g, " ")
      .replace(/\s+/g, " ");
    const unaccented = EntityResolutionService.stripDiacritics(cleanNormalized);
    const matched = [];

    // Collect all (alias, entity) pairs and sort by alias length DESCENDING
    const allPairs = [];
    for (const entity of Object.values(CANONICAL_ENTITIES)) {
      for (const alias of entity.aliases) {
        allPairs.push({ alias, entity });
      }
    }
    allPairs.sort((a, b) => b.alias.length - a.alias.length);

    const matchedEntities = new Set();

    for (const { alias, entity } of allPairs) {
      if (matchedEntities.has(entity.entityId)) continue;

      // Escape special regex characters in alias
      const cleanAlias = alias.replace(/\s*-\s*/g, " ");
      const escapedAlias = cleanAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ])${escapedAlias}([^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]|$)`, "i");

      const unaccentedAlias = EntityResolutionService.stripDiacritics(cleanAlias);
      const escapedUnaccentedAlias = unaccentedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const unaccentedRegex = new RegExp(`(^|[^a-z0-9])${escapedUnaccentedAlias}([^a-z0-9]|$)`, "i");

      if (regex.test(normalized) || regex.test(cleanNormalized) || unaccentedRegex.test(unaccented)) {
        // Disambiguation: if alias is generic like "bách khoa" but text has "hà nội"
        if (entity.entityId === "HCMUT_VNUHCM" && (normalized.includes("hà nội") || normalized.includes("hust"))) {
          continue;
        }
        if (entity.entityId === "HUST" && (normalized.includes("tp.hcm") || normalized.includes("tphcm") || normalized.includes("quốc gia tp"))) {
          continue;
        }
        if (entity.entityId === "VNUHCM" && normalized.includes("hà nội")) {
          continue;
        }
        if (entity.entityId === "VNUHN" && (normalized.includes("tp.hcm") || normalized.includes("tphcm"))) {
          continue;
        }

        matchedEntities.add(entity.entityId);
        matched.push({
          entityId: entity.entityId,
          canonicalName: entity.canonicalName,
          officialDomain: entity.officialDomain,
          allowedDomains: entity.allowedDomains,
          type: entity.type,
          matchedAlias: alias,
          confidence: 0.98
        });
      }
    }

    // Specific entity signals:
    if (!matchedEntities.has("KTX_VNUHCM") && /ký túc xá khu b|ký túc xá đhqg|ktx khu b|ktx đhqg|ký túc xá/i.test(normalized)) {
      matched.push({
        entityId: "KTX_VNUHCM",
        canonicalName: CANONICAL_ENTITIES.KTX_VNUHCM.canonicalName,
        officialDomain: CANONICAL_ENTITIES.KTX_VNUHCM.officialDomain,
        allowedDomains: CANONICAL_ENTITIES.KTX_VNUHCM.allowedDomains,
        type: CANONICAL_ENTITIES.KTX_VNUHCM.type,
        matchedAlias: "inferred_ktx_vnuhcm",
        confidence: 0.95
      });
      matchedEntities.add("KTX_VNUHCM");
    }

    if (!matchedEntities.has("MOH_VN") && /thực tập lâm sàng|ngành y khoa|y đa khoa|bệnh viện thực tập/i.test(normalized)) {
      matched.push({
        entityId: "MOH_VN",
        canonicalName: CANONICAL_ENTITIES.MOH_VN.canonicalName,
        officialDomain: CANONICAL_ENTITIES.MOH_VN.officialDomain,
        allowedDomains: CANONICAL_ENTITIES.MOH_VN.allowedDomains,
        type: CANONICAL_ENTITIES.MOH_VN.type,
        matchedAlias: "inferred_moh_clinical_policy",
        confidence: 0.95
      });
      matchedEntities.add("MOH_VN");
    }

    if (!matchedEntities.has("MOLISA_VN") && /thương binh liệt sĩ|con thương binh|trợ cấp xã hội|sinh viên mồ côi|nghị định 20\/2021|20\/2021\/nđ-cp/i.test(normalized)) {
      matched.push({
        entityId: "MOLISA_VN",
        canonicalName: CANONICAL_ENTITIES.MOLISA_VN.canonicalName,
        officialDomain: CANONICAL_ENTITIES.MOLISA_VN.officialDomain,
        allowedDomains: CANONICAL_ENTITIES.MOLISA_VN.allowedDomains,
        type: CANONICAL_ENTITIES.MOLISA_VN.type,
        matchedAlias: "inferred_molisa_welfare_policy",
        confidence: 0.95
      });
      matchedEntities.add("MOLISA_VN");
    }

    if (!matchedEntities.has("VBSP") && /157\/2007|quyết định 157|tín dụng sinh viên|vay vốn sinh viên|ngân hàng chính sách|mức vay tối đa|tín dụng.*vốn vay|vay ưu đãi.*sinh viên/i.test(normalized)) {
      matched.push({
        entityId: "VBSP",
        canonicalName: CANONICAL_ENTITIES.VBSP.canonicalName,
        officialDomain: CANONICAL_ENTITIES.VBSP.officialDomain,
        allowedDomains: CANONICAL_ENTITIES.VBSP.allowedDomains,
        type: CANONICAL_ENTITIES.VBSP.type,
        matchedAlias: "inferred_vbsp_student_credit",
        confidence: 0.95
      });
      matchedEntities.add("VBSP");
    }

    if (!matchedEntities.has("MIC_VN") && /03\/2014\/tt-btttt|chuẩn đầu ra tin học|công nghệ thông tin cơ bản/i.test(normalized)) {
      matched.push({
        entityId: "MIC_VN",
        canonicalName: CANONICAL_ENTITIES.MIC_VN.canonicalName,
        officialDomain: CANONICAL_ENTITIES.MIC_VN.officialDomain,
        allowedDomains: CANONICAL_ENTITIES.MIC_VN.allowedDomains,
        type: CANONICAL_ENTITIES.MIC_VN.type,
        matchedAlias: "inferred_mic_it_standard",
        confidence: 0.95
      });
      matchedEntities.add("MIC_VN");
    }

    if (!matchedEntities.has("GOV_VN") && /35\/nq-cp|nghị quyết 35|chính phủ.*giáo dục/i.test(normalized)) {
      matched.push({
        entityId: "GOV_VN",
        canonicalName: CANONICAL_ENTITIES.GOV_VN.canonicalName,
        officialDomain: CANONICAL_ENTITIES.GOV_VN.officialDomain,
        allowedDomains: CANONICAL_ENTITIES.GOV_VN.allowedDomains,
        type: CANONICAL_ENTITIES.GOV_VN.type,
        matchedAlias: "inferred_gov_decree",
        confidence: 0.95
      });
      matchedEntities.add("GOV_VN");
    }

    // Domain Authority Inference: when no institutional entity was explicitly named,
    // infer relevant regulatory or cyber authority from topic signals.
    const hasEduEntity = matched.some(m => m.type === "HIGHER_EDUCATION_INSTITUTION" || m.type === "NATIONAL_UNIVERSITY" || m.type === "REGIONAL_UNIVERSITY");
    if (!hasEduEntity) {
      // Government Decree / Tuition Framework
      if (/khung học phí|nghị định.*học phí|chính phủ.*học phí|nghị định 81|nghị định 97|thủ tướng.*quyết định|nghị định quy định|nghị định 49|nghị định 86|cơ chế thu.*học phí|miễn giảm học phí/i.test(normalized)) {
        if (!matchedEntities.has("GOVERNMENT_VN")) {
          matched.push({
            entityId: "GOVERNMENT_VN",
            canonicalName: CANONICAL_ENTITIES.GOVERNMENT_VN.canonicalName,
            officialDomain: CANONICAL_ENTITIES.GOVERNMENT_VN.officialDomain,
            allowedDomains: CANONICAL_ENTITIES.GOVERNMENT_VN.allowedDomains,
            type: CANONICAL_ENTITIES.GOVERNMENT_VN.type,
            matchedAlias: "inferred_government_decree",
            confidence: 0.95
          });
          matchedEntities.add("GOVERNMENT_VN");
        }
      }

      // Military Service / Ministry of National Defence
      if (/nghĩa vụ quân sự|tạm hoãn.*quân sự|hoãn nghĩa vụ|khám sơ tuyển.*quân sự/i.test(normalized)) {
        if (!matchedEntities.has("MOD_VN")) {
          matched.push({
            entityId: "MOD_VN",
            canonicalName: CANONICAL_ENTITIES.MOD_VN.canonicalName,
            officialDomain: CANONICAL_ENTITIES.MOD_VN.officialDomain,
            allowedDomains: CANONICAL_ENTITIES.MOD_VN.allowedDomains,
            type: CANONICAL_ENTITIES.MOD_VN.type,
            matchedAlias: "inferred_military_service",
            confidence: 0.95
          });
          matchedEntities.add("MOD_VN");
        }
      }

      // Health / Social Insurance
      if (/bảo hiểm y tế|bhyt|bảo hiểm xã hội|bhxh|bảo hiểm tai nạn|tai nạn thương tật/i.test(normalized)) {
        if (!matchedEntities.has("BHXH_VN")) {
          matched.push({
            entityId: "BHXH_VN",
            canonicalName: CANONICAL_ENTITIES.BHXH_VN.canonicalName,
            officialDomain: CANONICAL_ENTITIES.BHXH_VN.officialDomain,
            allowedDomains: CANONICAL_ENTITIES.BHXH_VN.allowedDomains,
            type: CANONICAL_ENTITIES.BHXH_VN.type,
            matchedAlias: "inferred_health_insurance",
            confidence: 0.95
          });
          matchedEntities.add("BHXH_VN");
        }
      }

      // Student Union / 5 Tốt
      if (/sinh viên 5 tốt|trung ương đoàn|tw đoàn|hội sinh viên/i.test(normalized)) {
        if (!matchedEntities.has("TW_DOAN")) {
          matched.push({
            entityId: "TW_DOAN",
            canonicalName: CANONICAL_ENTITIES.TW_DOAN.canonicalName,
            officialDomain: CANONICAL_ENTITIES.TW_DOAN.officialDomain,
            allowedDomains: CANONICAL_ENTITIES.TW_DOAN.allowedDomains,
            type: CANONICAL_ENTITIES.TW_DOAN.type,
            matchedAlias: "inferred_student_union",
            confidence: 0.95
          });
          matchedEntities.add("TW_DOAN");
        }
      }

      // Education & Training Ministry (MOET)
      if (/nghị định|thông tư|bộ giáo dục|chuẩn giáo dục|cơ chế thu quản lý|chính sách học bổng|quy chế đào tạo|quy chế tuyển sinh|hướng dẫn thi tuyển sinh|văn bản đóng dấu|phí xét tuyển|phí giữ chỗ|thông tư cũ|thông tư 08|kỳ thi|tốt nghiệp thpt|bảo lưu kết quả|thời gian đào tạo|điểm ưu tiên|làm bằng đại học|hồ sơ gốc|nâng điểm|sửa điểm|chuẩn đầu ra|vstep|ngoại ngữ|liên thông|quy chế công nhận|chứng chỉ ielts|thực tập tốt nghiệp|kiểm định chất lượng|aun-qa|khuyến khích học tập|chi phí sinh hoạt.*sư phạm|sinh viên sư phạm|học bổng khuyến khích|cảnh cáo học vụ|buộc thôi học|kỷ luật.*sinh viên|gian lận thi cử|đề án 1665/i.test(normalized)) {
        if (!matchedEntities.has("MOET_VN")) {
          matched.push({
            entityId: "MOET_VN",
            canonicalName: CANONICAL_ENTITIES.MOET_VN.canonicalName,
            officialDomain: CANONICAL_ENTITIES.MOET_VN.officialDomain,
            allowedDomains: CANONICAL_ENTITIES.MOET_VN.allowedDomains,
            type: CANONICAL_ENTITIES.MOET_VN.type,
            matchedAlias: "inferred_education_decree",
            confidence: 0.92
          });
          matchedEntities.add("MOET_VN");
        }
      }

      // Cybercrime / Fraud Co-Authority: both MPS and NCSC have jurisdiction over cyber fraud & impersonation
      const isCyberScam = /lừa đảo|chiếm đoạt|dọa nợ|tống tiền|đe dọa|bắt giam|phạt tù|ma túy|cho thuê tài khoản|vay tiền nhanh|giả danh|mạo danh|cảnh báo|link giả mạo|mã otp|tin nhắn sms|đơn hàng|cộng tác viên|chốt đơn|tín nhiệm mạng|đánh cắp|lừa tiền|chiêu trò|nâng cấp sim|chiếm mã otp|đăng ảnh phòng trọ giả|chụp ảnh nhạy cảm|link rút gọn|mất quyền admin|app chấm điểm|trúng học bổng.*visa|khảo sát.*link|sms brandname|video quét gương mặt|thực tập google.*bảo lãnh|chuyển.*tiền quà|làm bằng|nâng điểm|icloud|thế chấp.*icloud|lookbook.*cởi đồ|chuyển cọc|cọc giữ chân|phòng trọ.*chuyển|giam tiền|đánh giá ứng dụng|telegram.*hoa hồng|hack tài khoản|mở hộ thẻ|trốn nghĩa vụ quân sự|khám sơ tuyển.*nộp phạt|thi hộ|mua bán chứng chỉ|tokutei.*150 triệu|phí môi giới.*bất hợp pháp|khóa.*2 giờ.*nộp tiền phạt|rút hết hạn mức/i.test(normalized);
      if (isCyberScam) {
        if (!matchedEntities.has("MPS_VN")) {
          matched.push({
            entityId: "MPS_VN",
            canonicalName: CANONICAL_ENTITIES.MPS_VN.canonicalName,
            officialDomain: CANONICAL_ENTITIES.MPS_VN.officialDomain,
            allowedDomains: CANONICAL_ENTITIES.MPS_VN.allowedDomains,
            type: CANONICAL_ENTITIES.MPS_VN.type,
            matchedAlias: "inferred_law_enforcement_warning",
            confidence: 0.92
          });
          matchedEntities.add("MPS_VN");
        }
        if (!matchedEntities.has("NCSC_VN")) {
          matched.push({
            entityId: "NCSC_VN",
            canonicalName: CANONICAL_ENTITIES.NCSC_VN.canonicalName,
            officialDomain: CANONICAL_ENTITIES.NCSC_VN.officialDomain,
            allowedDomains: CANONICAL_ENTITIES.NCSC_VN.allowedDomains,
            type: CANONICAL_ENTITIES.NCSC_VN.type,
            matchedAlias: "inferred_cybersecurity_alert",
            confidence: 0.92
          });
          matchedEntities.add("NCSC_VN");
        }
      }
    }

    // Campus Context Inference: If a session context is provided and no explicit educational entity was named
    if (options.contextEntityId && CANONICAL_ENTITIES[options.contextEntityId]) {
      const hasExplicitEdu = matched.some(m => m.type === "HIGHER_EDUCATION_INSTITUTION" || m.type === "NATIONAL_UNIVERSITY");
      if (!hasExplicitEdu && !matchedEntities.has(options.contextEntityId)) {
        const ent = CANONICAL_ENTITIES[options.contextEntityId];
        matched.push({
          entityId: ent.entityId,
          canonicalName: ent.canonicalName,
          officialDomain: ent.officialDomain,
          allowedDomains: ent.allowedDomains,
          type: ent.type,
          matchedAlias: "context_session_entity",
          confidence: 0.90
        });
        matchedEntities.add(options.contextEntityId);
      }
    }

    return matched;
  }

  /**
   * Resolves entities with structured resolution status: RESOLVED, AMBIGUOUS, UNKNOWN.
   * Section 8 requirement:
   * - If 1 unambiguous educational institution matches (or 1 exact canonical entity): RESOLVED
   * - If multiple competing institutions match (e.g. "ĐHBK" could be HCMUT/HUST): AMBIGUOUS (preserves both)
   * - If no institution matches: UNKNOWN (does NOT force a false entity)
   */
  static resolveEntitiesDetailed(text, options = {}) {
    const matches = this.resolveEntities(text, options);
    if (matches.length === 0) {
      return { status: "UNKNOWN", matches: [] };
    }

    // If an ambiguous academic system is present without an explicit specific institution, status is AMBIGUOUS
    if (matches.some((m) => m.entityId.startsWith("AMBIGUOUS_"))) {
      const explicitSpecificEdu = matches.filter(
        (m) =>
          (m.type === "HIGHER_EDUCATION_INSTITUTION" ||
           m.type === "NATIONAL_UNIVERSITY" ||
           m.type === "REGIONAL_UNIVERSITY") &&
          !m.entityId.startsWith("AMBIGUOUS_") &&
          !m.matchedAlias?.startsWith("inferred_")
      );
      if (explicitSpecificEdu.length === 0) {
        return { status: "AMBIGUOUS", matches };
      }
    }

    // Filter out AMBIGUOUS_ clusters if an exact specific institution match exists
    const specificMatches = matches.filter(
      (m) =>
        (m.type === "HIGHER_EDUCATION_INSTITUTION" ||
         m.type === "NATIONAL_UNIVERSITY" ||
         m.type === "REGIONAL_UNIVERSITY" ||
         m.type === "MINISTRY_REGULATOR" ||
         m.type === "GOVERNMENT_REGULATOR") &&
        !m.entityId.startsWith("AMBIGUOUS_")
    );

    if (specificMatches.length === 1 && specificMatches[0].confidence >= 0.90) {
      // Unambiguous specific institution identified
      return { status: "RESOLVED", matches: [specificMatches[0]] };
    }

    if (specificMatches.length > 1) {
      // Several competing institutions are not an unambiguous resolution.
      // Preserve every match for downstream soft ranking and force an explicit
      // ambiguity state instead of silently selecting one institution.
      return { status: "AMBIGUOUS", matches: specificMatches };
    }

    if (specificMatches.length === 1 || matches[0].confidence >= 0.85) {
      return { status: "RESOLVED", matches };
    }

    return { status: "UNKNOWN", matches };
  }

  /**
   * Checks whether a candidate URL belongs to the official domains of resolved entities.
   */
  static isOfficialDomainForEntity(url, entityId) {
    const entity = CANONICAL_ENTITIES[entityId];
    if (!entity || !url) return false;
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return entity.allowedDomains.some(d => hostname === d || hostname.endsWith(`.${d}`));
    } catch {
      return false;
    }
  }
}
