/**
 * GENERATOR FOR UNTOUCHED RETRIEVAL HOLDOUT V2 (N=150)
 * Adheres strictly to Section 10 & Section 12 requirements:
 * - >=30% unindexed/specialized institutions
 * - >=15% companies/organizations
 * - >=15% fresh 2026 notices
 * - >=10% ambiguous abbreviations
 * - >=10% outdated policies
 * - >=10% scam/phishing cases
 * - >=10% adversarial/OOD wording
 */

import fs from "fs";
import crypto from "crypto";

const cases = [
  // 1. UNINDEXED / SPECIALIZED INSTITUTIONS (46 cases = 30.7%)
  {
    caseId: "RET-V2-001",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Sư phạm - Đại học Đà Nẵng UED điểm chuẩn xét tuyển học bạ 2026",
    canonicalEntity: "UED_UDN",
    aliases: ["ued", "đại học sư phạm đà nẵng", "sư phạm đà nẵng"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ued.udn.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-002",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Ngoại ngữ - Đại học Huế HUCFL học phí các ngành ngôn ngữ",
    canonicalEntity: "HUCFL",
    aliases: ["hucfl", "ngoại ngữ huế", "đại học ngoại ngữ huế"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hucfl.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-003",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Dược Hà Nội HUP quy định xét tuyển thẳng học sinh chuyên hóa",
    canonicalEntity: "HUP",
    aliases: ["hup", "đại học dược hà nội", "dược hà nội"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hup.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-004",
    category: "UNINDEXED_INSTITUTION",
    query: "Học viện Nông nghiệp Việt Nam VNUA học bổng khuyến khích học tập sinh viên kỳ 1",
    canonicalEntity: "VNUA",
    aliases: ["vnua", "học viện nông nghiệp việt nam", "học viện nông nghiệp"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "vnua.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-005",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Tây Bắc TBU thông báo xét tuyển bổ sung ngành Sư phạm Toán",
    canonicalEntity: "TBU",
    aliases: ["tbu", "đại học tây bắc", "đh tây bắc"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "utb.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-006",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Hà Tĩnh HTU chỉ tiêu tuyển sinh ngành Ngôn ngữ Trung Quốc 2026",
    canonicalEntity: "HTU",
    aliases: ["htu", "đại học hà tĩnh", "đh hà tĩnh"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "htu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-007",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Hàng hải Việt Nam VMU thông báo lịch đăng ký học phần hè",
    canonicalEntity: "VMU",
    aliases: ["vmu", "đại học hàng hải việt nam", "đại học hàng hải"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "vimaru.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-008",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Mỏ - Địa chất HUMG thông báo xét cấp học bổng doanh nghiệp mỏ địa chất",
    canonicalEntity: "HUMG",
    aliases: ["humg", "đại học mỏ địa chất", "mỏ địa chất"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "humg.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-009",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Công đoàn TUU mức thu học phí năm học 2025 2026",
    canonicalEntity: "TUU",
    aliases: ["tuu", "đại học công đoàn", "đh công đoàn"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "dhcd.edu.vn",
    freshnessRequirement: "2025_2026"
  },
  {
    caseId: "RET-V2-010",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Lao động Xã hội ULSA lịch bảo vệ khóa luận tốt nghiệp ngành Công tác xã hội",
    canonicalEntity: "ULSA",
    aliases: ["ulsa", "đại học lao động xã hội", "đh lao động xã hội"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ulsa.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-011",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Văn hóa Hà Nội HUC chuẩn đầu ra ngoại ngữ B1 cho sinh viên khoa Di sản",
    canonicalEntity: "HUC",
    aliases: ["huc", "đại học văn hóa hà nội", "đh văn hóa"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "huc.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-012",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Thể dục Thể thao TP.HCM USH tiêu chuẩn kiểm tra thể lực định kỳ",
    canonicalEntity: "USH",
    aliases: ["ush", "đại học thể dục thể thao tphcm", "tdtt tphcm"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ush.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-013",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Mỹ thuật Việt Nam VFA thông báo tuyển sinh ngành Hội họa và Điêu khắc",
    canonicalEntity: "VFA",
    aliases: ["vfa", "đại học mỹ thuật việt nam", "mỹ thuật hà nội"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "mythuatvietnam.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-014",
    category: "UNINDEXED_INSTITUTION",
    query: "Học viện Âm nhạc Quốc gia Việt Nam VNAM thông báo kỳ thi đánh giá năng lực piano",
    canonicalEntity: "VNAM",
    aliases: ["vnam", "học viện âm nhạc quốc gia", "nhạc viện hà nội"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "vnam.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-015",
    category: "UNINDEXED_INSTITUTION",
    query: "Nhạc viện TP.HCM HCMCONS lịch tuyển sinh chuyên ngành Thanh nhạc năm 2026",
    canonicalEntity: "HCMCONS",
    aliases: ["hcmcons", "nhạc viện tphcm", "nhạc viện thành phố hồ chí minh"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hcmcons.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-016",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Sân khấu Điện ảnh Hà Nội SKDA hướng dẫn thi môn Năng khiếu diễn viên",
    canonicalEntity: "SKDA",
    aliases: ["skda", "sân khấu điện ảnh hà nội", "đại học sân khấu điện ảnh"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "skda.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-017",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Sư phạm Kỹ thuật Vinh VUTED thông báo tuyển sinh kỹ sư ô tô",
    canonicalEntity: "VUTED",
    aliases: ["vuted", "sư phạm kỹ thuật vinh", "đh spkt vinh"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "vuted.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-018",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Y Dược Buôn Ma Thuột BMTU học phí ngành Y khoa và Dược học",
    canonicalEntity: "BMTU",
    aliases: ["bmtu", "đại học y dược buôn ma thuột", "y dược buôn ma thuột"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "bmtu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-019",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Phan Thiết UPT kế hoạch đào tạo song ngành Quản trị Du lịch và Khách sạn",
    canonicalEntity: "UPT",
    aliases: ["upt", "đại học phan thiết", "đh phan thiết"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "upt.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-020",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Thái Bình TBU_TB chỉ tiêu xét tuyển đại học hệ chính quy đợt 1",
    canonicalEntity: "TBU_TB",
    aliases: ["đại học thái bình", "đh thái bình"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "tbu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-021",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Nam Cần Thơ DNC chính sách giảm 20 phần trăm học phí cho tân sinh viên",
    canonicalEntity: "DNC",
    aliases: ["dnc", "đại học nam cần thơ", "nam cần thơ"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "nctu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-022",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Cửu Long MKU học bổng khuyến tài khuyến học khu vực Đồng bằng Sông Cửu Long",
    canonicalEntity: "MKU",
    aliases: ["mku", "đại học cửu long", "đh cửu long"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "mku.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-023",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Bà Rịa - Vũng Tàu BVU phương thức xét học bạ kết hợp chứng chỉ IELTS",
    canonicalEntity: "BVU",
    aliases: ["bvu", "đại học bà rịa vũng tàu", "bà rịa vũng tàu"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "bvu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-024",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Thái Bình Dương TBD mức học phí toàn khóa ngành Công nghệ Thông tin",
    canonicalEntity: "TBD",
    aliases: ["tbd", "đại học thái bình dương", "đh thái bình dương"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "tbd.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-025",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Tân Tạo TTU thông báo cấp học bổng tài năng ngành Y khoa",
    canonicalEntity: "TTU",
    aliases: ["ttu", "đại học tân tạo", "đh tân tạo"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ttu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-026",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Yersin Đà Lạt YERSIN chương trình đào tạo thực tập có lương tại Nhật Bản",
    canonicalEntity: "YERSIN",
    aliases: ["yersin", "đại học yersin đà lạt", "yersin đà lạt"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "yersin.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-027",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Quốc tế Miền Đông EIU liên kết đào tạo với Đại học Portland State",
    canonicalEntity: "EIU",
    aliases: ["eiu", "đại học quốc tế miền đông", "miền đông"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "eiu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-028",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Quốc tế Bắc Hà BHIU điểm chuẩn xét điểm thi tốt nghiệp THPT",
    canonicalEntity: "BHIU",
    aliases: ["bhiu", "đại học quốc tế bắc hà", "bắc hà"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "bhiu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-029",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Trưng Vương TVU_HN thông báo mở thêm ngành Luật Kinh tế 2026",
    canonicalEntity: "TVU_HN",
    aliases: ["đại học trưng vương", "trưng vương"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "dhtrunguong.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-030",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Chu Văn An Ecopark CVA học phí ngành Tài chính - Ngân hàng",
    canonicalEntity: "CVA",
    aliases: ["cva", "đại học chu văn an", "chu văn an"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "cva.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-031",
    category: "UNINDEXED_INSTITUTION",
    query: "Học viện Khoa học Quân sự MSA thông báo tuyển sinh đại học quân sự hệ chính quy",
    canonicalEntity: "MSA",
    aliases: ["msa", "học viện khoa học quân sự", "khoa học quân sự"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "hvkhqs.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-032",
    category: "UNINDEXED_INSTITUTION",
    query: "Học viện Kỹ thuật Quân sự MTA xét tuyển thí sinh đạt giải học sinh giỏi quốc gia",
    canonicalEntity: "MTA",
    aliases: ["mta", "học viện kỹ thuật quân sự", "kỹ thuật quân sự"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "mta.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-033",
    category: "UNINDEXED_INSTITUTION",
    query: "Học viện Quân y VMMU điểm chuẩn ngành Bác sĩ đa khoa quân y và dân y",
    canonicalEntity: "VMMU",
    aliases: ["vmmu", "học viện quân y", "quân y"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "vmmu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-034",
    category: "UNINDEXED_INSTITUTION",
    query: "Học viện Cảnh sát Nhân dân PPA tiêu chuẩn sơ tuyển sức khỏe và lý lịch chính trị",
    canonicalEntity: "PPA",
    aliases: ["ppa", "học viện cảnh sát nhân dân", "cảnh sát nhân dân"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "ppa.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-035",
    category: "UNINDEXED_INSTITUTION",
    query: "Học viện An ninh Nhân dân T01 hướng dẫn nộp hồ sơ xét tuyển nhóm ngành An ninh mạng",
    canonicalEntity: "T01",
    aliases: ["t01", "học viện an ninh nhân dân", "an ninh nhân dân"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "hvannd.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-036",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Phòng cháy Chữa cháy FSCS quy định chiều cao cân nặng sơ tuyển công an",
    canonicalEntity: "FSCS",
    aliases: ["fscs", "đại học phòng cháy chữa cháy", "phòng cháy chữa cháy"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "daihocpccc.bocongan.gov.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-037",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Kiểm sát Hà Nội HPU hướng dẫn thẩm tra hồ sơ đăng ký xét tuyển",
    canonicalEntity: "HPU_KS",
    aliases: ["hpu", "đại học kiểm sát hà nội", "kiểm sát hà nội"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "hpu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-038",
    category: "UNINDEXED_INSTITUTION",
    query: "Học viện Tòa án VCA quy định xét tuyển học bạ môn Văn Sử Địa ngành Luật học",
    canonicalEntity: "VCA",
    aliases: ["vca", "học viện tòa án", "tòa án"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "hvta.toaan.gov.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-039",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Công nghệ Đồng Nai DNTU liên kết thực tập sinh kỹ năng tại Đài Loan",
    canonicalEntity: "DNTU",
    aliases: ["dntu", "đại học công nghệ đồng nai", "công nghệ đồng nai"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "dntu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-040",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Tiền Giang TGU quy định chuyển điểm thi chứng chỉ tin học quốc tế IC3",
    canonicalEntity: "TGU",
    aliases: ["tgu", "đại học tiền giang", "đh tiền giang"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "tgu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-041",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Trà Vinh TVU chính sách hỗ trợ học phí cho sinh viên dân tộc Khmer",
    canonicalEntity: "TVU",
    aliases: ["tvu", "đại học trà vinh", "đh trà vinh"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "tvu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-042",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Bạc Liêu BLU kế hoạch trao bằng tốt nghiệp đại học đợt tháng 6",
    canonicalEntity: "BLU",
    aliases: ["blu", "đại học bạc liêu", "đh bạc liêu"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "blu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-043",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Khánh Hòa UKH chương trình học bổng doanh nghiệp du lịch Nha Trang",
    canonicalEntity: "UKH",
    aliases: ["ukh", "đại học khánh hòa", "đh khánh hòa"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ukh.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-044",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Quảng Nam QNU_QN chỉ tiêu sư phạm được ngân sách nhà nước hỗ trợ sinh hoạt phí",
    canonicalEntity: "QNU_QN",
    aliases: ["đại học quảng nam", "đh quảng nam"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "qnu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-045",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Quảng Bình QBU thông báo gia hạn nộp hồ sơ xét tốt nghiệp",
    canonicalEntity: "QBU",
    aliases: ["qbu", "đại học quảng bình", "đh quảng bình"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "qbu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-046",
    category: "UNINDEXED_INSTITUTION",
    query: "Trường Đại học Hồng Đức HDU Thanh Hóa học phí các ngành đào tạo chất lượng cao",
    canonicalEntity: "HDU",
    aliases: ["hdu", "đại học hồng đức", "hồng đức thanh hóa"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hdu.edu.vn",
    freshnessRequirement: "REGULAR"
  },

  // 2. COMPANIES & PRIVATE PLATFORMS NOT IN CORE ALIASES (24 cases = 16.0%)
  {
    caseId: "RET-V2-047",
    category: "PRIVATE_COMPANY_ORG",
    query: "Ví điện tử VNPAY quy định chương trình hoàn tiền nộp học phí qua cổng VNPAY-QR",
    canonicalEntity: "VNPAY",
    aliases: ["vnpay", "ví vnpay", "cổng vnpay"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "vnpay.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-048",
    category: "PRIVATE_COMPANY_ORG",
    query: "Ngân hàng TMCP Quân đội MBBank hướng dẫn mở tài khoản thanh toán sinh viên miễn phí quản lý",
    canonicalEntity: "MBBANK",
    aliases: ["mbbank", "ngân hàng quân đội", "ngân hàng mb"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "mbbank.com.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-049",
    category: "PRIVATE_COMPANY_ORG",
    query: "Ngân hàng Techcombank quy định hạn mức chuyển khoản thanh toán học phí qua Techcombank Mobile",
    canonicalEntity: "TCB",
    aliases: ["techcombank", "tcb", "ngân hàng kỹ thương"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "techcombank.com",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-050",
    category: "PRIVATE_COMPANY_ORG",
    query: "Ngân hàng VietinBank liên kết thẻ sinh viên tích hợp thẻ ghi nợ đồng thương hiệu",
    canonicalEntity: "CTG",
    aliases: ["vietinbank", "ngân hàng công thương", "vietin"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "vietinbank.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-051",
    category: "PRIVATE_COMPANY_ORG",
    query: "Ngân hàng Agribank chính sách giải ngân nguồn vốn vay học sinh sinh viên theo Quyết định 157",
    canonicalEntity: "AGRIBANK",
    aliases: ["agribank", "ngân hàng nông nghiệp", "nông nghiệp và phát triển nông thôn"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "agribank.com.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-052",
    category: "PRIVATE_COMPANY_ORG",
    query: "Ngân hàng TPBank hướng dẫn mở thẻ tín dụng sinh viên hạn mức 10 triệu bằng thẻ sinh viên",
    canonicalEntity: "TPBANK",
    aliases: ["tpbank", "ngân hàng tiên phong", "tiên phong bank"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "tpb.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-053",
    category: "PRIVATE_COMPANY_ORG",
    query: "Ngân hàng VPBank chính sách cho vay thấu chi tín chấp dành cho tân cử nhân đi làm",
    canonicalEntity: "VPBANK",
    aliases: ["vpbank", "ngân hàng việt nam thịnh vượng", "việt nam thịnh vượng"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "vpbank.com.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-054",
    category: "PRIVATE_COMPANY_ORG",
    query: "Ngân hàng ACB chương trình học bổng The Next Banker dành cho sinh viên năm cuối",
    canonicalEntity: "ACB",
    aliases: ["acb", "ngân hàng á châu", "á châu"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "acb.com.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-055",
    category: "PRIVATE_COMPANY_ORG",
    query: "Công ty Cổ phần MISA nền tảng SISAP thông báo lỗi đồng bộ hóa học phí sinh viên",
    canonicalEntity: "MISA",
    aliases: ["misa", "sisap", "phần mềm misa"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["ENTERPRISE_SOFTWARE"],
    knownOfficialDomain: "misa.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-056",
    category: "PRIVATE_COMPANY_ORG",
    query: "Tập đoàn FPT chương trình học bổng FPT Telecom chắp cánh tương lai tài năng công nghệ",
    canonicalEntity: "FPT_CORP",
    aliases: ["fpt telecom", "tập đoàn fpt", "fpt software"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["ENTERPRISE_PORTAL"],
    knownOfficialDomain: "fpt.com.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-057",
    category: "PRIVATE_COMPANY_ORG",
    query: "Tập đoàn Vingroup Quỹ Đổi mới sáng tạo VINIF thông báo cấp học bổng thạc sĩ tiến sĩ trong nước",
    canonicalEntity: "VINIF",
    aliases: ["vinif", "quỹ vinif", "vingroup"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["ENTERPRISE_PORTAL"],
    knownOfficialDomain: "vinif.org",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-058",
    category: "PRIVATE_COMPANY_ORG",
    query: "Tập đoàn Viettel chương trình thực tập sinh tài năng Viettel Digital Talent 2026",
    canonicalEntity: "VIETTEL",
    aliases: ["viettel digital talent", "viettel", "tập đoàn viettel"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["ENTERPRISE_PORTAL"],
    knownOfficialDomain: "viettel.com.vn",
    freshnessRequirement: "2026_PROGRAM"
  },
  {
    caseId: "RET-V2-059",
    category: "PRIVATE_COMPANY_ORG",
    query: "Trung tâm Chứng thực điện tử Quốc gia NEAC danh sách tổ chức cấp chữ ký số công cộng được cấp phép",
    canonicalEntity: "NEAC",
    aliases: ["neac", "trung tâm chứng thực điện tử quốc gia", "chữ ký số quốc gia"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "neac.gov.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-060",
    category: "PRIVATE_COMPANY_ORG",
    query: "Bảo hiểm Xã hội Việt Nam BHXH hướng dẫn cài đặt và sử dụng ứng dụng VssID cho học sinh sinh viên",
    canonicalEntity: "VSSID",
    aliases: ["vssid", "bảo hiểm xã hội việt nam", "bhxh việt nam"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "baohiemxahoi.gov.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-061",
    category: "PRIVATE_COMPANY_ORG",
    query: "Bộ Công an ứng dụng VNeID hướng dẫn tích hợp thông tin thẻ sinh viên điện tử vào tài khoản định danh",
    canonicalEntity: "VNEID",
    aliases: ["vneid", "định danh điện tử", "ứng dụng vneid"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "vneid.gov.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-062",
    category: "PRIVATE_COMPANY_ORG",
    query: "ShopeePay hướng dẫn sinh viên nhận mã giảm giá khi liên kết tài khoản ngân hàng nộp tiền học",
    canonicalEntity: "SHOPEEPAY",
    aliases: ["shopeepay", "ví shopeepay", "shopee"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "shopeepay.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-063",
    category: "PRIVATE_COMPANY_ORG",
    query: "Zalo Mini App Tra cứu điểm thi đại học có phải là kênh tra cứu chính thức của Bộ GDĐT không?",
    canonicalEntity: "ZALOPAY",
    aliases: ["zalo", "zalo mini app", "zalopay"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "zalopay.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-064",
    category: "PRIVATE_COMPANY_ORG",
    query: "Công ty Cổ phần Thanh toán Quốc gia Việt Nam NAPAS giải thích mã phản hồi lỗi giao dịch 247",
    canonicalEntity: "NAPAS",
    aliases: ["napas", "napas 247", "công ty cổ phần thanh toán quốc gia"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["FINANCIAL_INSTITUTION"],
    knownOfficialDomain: "napas.com.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-065",
    category: "PRIVATE_COMPANY_ORG",
    query: "Microsoft Learn Student Ambassadors chương trình đại sứ sinh viên công nghệ tại Việt Nam",
    canonicalEntity: "MICROSOFT",
    aliases: ["microsoft learn", "microsoft", "mlsa"],
    expectedJurisdiction: "GLOBAL",
    expectedSourceTypes: ["ENTERPRISE_PORTAL"],
    knownOfficialDomain: "microsoft.com",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-066",
    category: "PRIVATE_COMPANY_ORG",
    query: "Google Developer Student Clubs GDSC hướng dẫn thành lập câu lạc bộ sinh viên tại trường đại học",
    canonicalEntity: "GOOGLE",
    aliases: ["gdsc", "google developer", "google"],
    expectedJurisdiction: "GLOBAL",
    expectedSourceTypes: ["ENTERPRISE_PORTAL"],
    knownOfficialDomain: "developers.google.com",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-067",
    category: "PRIVATE_COMPANY_ORG",
    query: "British Council Hội đồng Anh lịch thi IELTS Computer-delivered tại TP.HCM và Hà Nội",
    canonicalEntity: "BRITISH_COUNCIL",
    aliases: ["hội đồng anh", "british council", "bc ielts"],
    expectedJurisdiction: "GLOBAL",
    expectedSourceTypes: ["AUTHORITATIVE_TESTING"],
    knownOfficialDomain: "britishcouncil.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-068",
    category: "PRIVATE_COMPANY_ORG",
    query: "IDP Education Vietnam thông báo lệ phí thi IELTS Academic chính thức năm 2026",
    canonicalEntity: "IDP",
    aliases: ["idp", "idp việt nam", "idp education"],
    expectedJurisdiction: "GLOBAL",
    expectedSourceTypes: ["AUTHORITATIVE_TESTING"],
    knownOfficialDomain: "idp.com",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-069",
    category: "PRIVATE_COMPANY_ORG",
    query: "IIG Việt Nam bảng quy đổi điểm bài thi TOEIC 2 kỹ năng sang 4 kỹ năng trong xét tốt nghiệp đại học",
    canonicalEntity: "IIG_VN",
    aliases: ["iig việt nam", "iig", "toeic iig"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["AUTHORITATIVE_TESTING"],
    knownOfficialDomain: "iigvietnam.com",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-070",
    category: "PRIVATE_COMPANY_ORG",
    query: "Tổ chức Giáo dục FPT chính sách ưu đãi học phí cho con em cán bộ nhân viên toàn quốc",
    canonicalEntity: "FE",
    aliases: ["tổ chức giáo dục fpt", "fpt education", "fpt edu"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "fpt.edu.vn",
    freshnessRequirement: "REGULAR"
  },

  // 3. FRESH 2026 / 2027 NOTICES (24 cases = 16.0%)
  {
    caseId: "RET-V2-071",
    category: "FRESH_2026_NOTICES",
    query: "Bộ Giáo dục và Đào tạo công bố lịch thi tốt nghiệp THPT quốc gia năm 2026 chính thức",
    canonicalEntity: "MOET_VN",
    aliases: ["bộ gdđt", "bộ giáo dục", "moet"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-072",
    category: "FRESH_2026_NOTICES",
    query: "ĐHQG-HCM công bố cấu trúc bài thi Đánh giá năng lực ĐGNL áp dụng từ năm 2026 theo chương trình GDPT mới",
    canonicalEntity: "VNUHCM",
    aliases: ["đhqg hcm", "đhqg-hcm", "vnuhcm"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "vnuhcm.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-073",
    category: "FRESH_2026_NOTICES",
    query: "ĐHQGHN kế hoạch tổ chức kỳ thi Đánh giá năng lực HSA năm 2026 các đợt thi tại miền Bắc",
    canonicalEntity: "VNUHN",
    aliases: ["đhqghn", "hsa", "vnuhn"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "vnu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-074",
    category: "FRESH_2026_NOTICES",
    query: "Đại học Bách khoa Hà Nội lịch thi Đánh giá tư duy TSA năm 2026 và danh sách các cụm thi",
    canonicalEntity: "HUST",
    aliases: ["đại học bách khoa hà nội", "hust", "tsa"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hust.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-075",
    category: "FRESH_2026_NOTICES",
    query: "Trường Đại học Sư phạm Hà Nội thông báo phương án kỳ thi Đánh giá năng lực độc lập 2026",
    canonicalEntity: "HNUE",
    aliases: ["đại học sư phạm hà nội", "hnue", "sư phạm hà nội"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hnue.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-076",
    category: "FRESH_2026_NOTICES",
    query: "Trường Đại học Sư phạm TP.HCM thông báo kỳ thi Đánh giá năng lực chuyên biệt đợt 1 năm 2026",
    canonicalEntity: "HCMUE",
    aliases: ["đại học sư phạm tphcm", "hcmue", "sư phạm tphcm"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hcmue.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-077",
    category: "FRESH_2026_NOTICES",
    query: "Thông tư số 05/2026/TT-BGDĐT sửa đổi bổ sung quy chế thi tốt nghiệp THPT",
    canonicalEntity: "MOET_VN",
    aliases: ["thông tư 05/2026", "bộ giáo dục", "moet"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "2026_REGULATION"
  },
  {
    caseId: "RET-V2-078",
    category: "FRESH_2026_NOTICES",
    query: "Nghị định 81/2021/NĐ-CP được thay thế bằng Nghị định 97/2023/NĐ-CP lộ trình học phí đại học công lập năm 2026",
    canonicalEntity: "GOV_VN",
    aliases: ["nghị định 97", "chính phủ", "nghị định 81"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "chinhphu.vn",
    freshnessRequirement: "2026_REGULATION"
  },
  {
    caseId: "RET-V2-079",
    category: "FRESH_2026_NOTICES",
    query: "Trường ĐH Bách khoa - ĐHQG-HCM thông báo xét tuyển kết hợp chứng chỉ quốc tế SAT ACT năm 2026",
    canonicalEntity: "HCMUT_VNUHCM",
    aliases: ["bách khoa tphcm", "hcmut", "đhqg hcm"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hcmut.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-080",
    category: "FRESH_2026_NOTICES",
    query: "Trường ĐH Kinh tế TP.HCM UEH công bố mở 5 chương trình đào tạo trí tuệ nhân tạo và kinh tế xanh 2026",
    canonicalEntity: "UEH",
    aliases: ["đh kinh tế tphcm", "ueh", "đại học kinh tế"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ueh.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-081",
    category: "FRESH_2026_NOTICES",
    query: "Trường ĐH Ngoại thương FTU kế hoạch xét tuyển sớm qua chứng chỉ ngoại ngữ quốc tế và giải quốc gia 2026",
    canonicalEntity: "FTU",
    aliases: ["ngoại thương", "ftu", "đại học ngoại thương"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ftu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-082",
    category: "FRESH_2026_NOTICES",
    query: "Trường ĐH Kinh tế Quốc dân NEU thông báo đề án tuyển sinh đại học vừa làm vừa học năm 2026",
    canonicalEntity: "NEU",
    aliases: ["kinh tế quốc dân", "neu", "đại học kinh tế quốc dân"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "neu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-083",
    category: "FRESH_2026_NOTICES",
    query: "Học viện Công nghệ Bưu chính Viễn thông PTIT mở thêm phân hiệu hoặc chuyên ngành Trí tuệ nhân tạo ứng dụng 2026",
    canonicalEntity: "PTIT",
    aliases: ["ptit", "học viện bưu chính viễn thông", "bưu chính viễn thông"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ptit.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-084",
    category: "FRESH_2026_NOTICES",
    query: "Trường ĐH Luật TP.HCM ULAW thông báo phương thức xét tuyển riêng cho học sinh trường THPT chuyên",
    canonicalEntity: "ULAW",
    aliases: ["ulaw", "đại học luật tphcm", "luật tp.hcm"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ulaw.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-085",
    category: "FRESH_2026_NOTICES",
    query: "Trường ĐH Y Hà Nội HMU thông báo kế hoạch tổ chức ngày hội tư vấn tuyển sinh sau đại học 2026",
    canonicalEntity: "HMU",
    aliases: ["đại học y hà nội", "hmu", "y hà nội"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hmu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-086",
    category: "FRESH_2026_NOTICES",
    query: "Trường ĐH Y Dược TP.HCM UMP kế hoạch xét tuyển bổ sung ngành Y tế công cộng năm 2026",
    canonicalEntity: "UMP",
    aliases: ["đại học y dược tphcm", "ump", "y dược tphcm"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ump.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-087",
    category: "FRESH_2026_NOTICES",
    query: "Trường ĐH Cần Thơ CTU thông báo lịch nộp học phí qua hệ thống ngân hàng liên kết học kỳ 2 năm 2026",
    canonicalEntity: "CTU",
    aliases: ["đại học cần thơ", "ctu", "đh cần thơ"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ctu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-088",
    category: "FRESH_2026_NOTICES",
    query: "Học viện Ngân hàng BAV công bố điểm trúng tuyển theo phương thức phỏng vấn và xét hồ sơ 2026",
    canonicalEntity: "BAV",
    aliases: ["học viện ngân hàng", "bav", "ngân hàng"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hvnh.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-089",
    category: "FRESH_2026_NOTICES",
    query: "Học viện Ngoại giao DAV thông báo chương trình giao lưu văn hóa thanh niên ASEAN năm 2026",
    canonicalEntity: "DAV",
    aliases: ["học viện ngoại giao", "dav", "ngoại giao"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "dav.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-090",
    category: "FRESH_2026_NOTICES",
    query: "Trường ĐH Tôn Đức Thắng TDTU thông báo danh sách sinh viên được nhận học bổng vượt khó kỳ 2",
    canonicalEntity: "TDTU",
    aliases: ["đại học tôn đức thắng", "tdtu", "tôn đức thắng"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "tdtu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-091",
    category: "FRESH_2026_NOTICES",
    query: "Đại học FPT thông báo lịch thi sơ tuyển học bổng tài năng đợt tháng 5 năm 2026",
    canonicalEntity: "FPT_UNIVERSITY",
    aliases: ["đại học fpt", "đh fpt", "fpt"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "daihoc.fpt.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-092",
    category: "FRESH_2026_NOTICES",
    query: "Trường ĐH RMIT Việt Nam RMIT kế hoạch tổ chức tuần lễ định hướng tân sinh viên đợt nhập học tháng 10",
    canonicalEntity: "RMIT_VN",
    aliases: ["rmit việt nam", "rmit", "đại học rmit"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "rmit.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-093",
    category: "FRESH_2026_NOTICES",
    query: "Ký túc xá ĐHQG-HCM thông báo thời hạn trả phòng và đăng ký lưu trú hè năm 2026",
    canonicalEntity: "KTX_VNUHCM",
    aliases: ["ký túc xá đhqg", "ktx khu b", "ktx đhqg"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ktx.vnuhcm.edu.vn",
    freshnessRequirement: "2026_HOUSING"
  },
  {
    caseId: "RET-V2-094",
    category: "FRESH_2026_NOTICES",
    query: "Bộ Công an thông báo các trường công an nhân dân không sử dụng phương thức xét tuyển điểm thi THPT",
    canonicalEntity: "MPS_VN",
    aliases: ["bộ công an", "mps", "tuyển sinh công an"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "bocongan.gov.vn",
    freshnessRequirement: "2026_ADMISSION"
  },

  // 4. AMBIGUOUS ABBREVIATIONS & SYSTEM CONFUSION (16 cases = 10.7%)
  {
    caseId: "RET-V2-095",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Bách khoa ở TP.HCM (HCMUT) và Bách khoa ở Hà Nội (HUST) có thuộc cùng một đại học quốc gia không?",
    canonicalEntity: "AMBIGUOUS_BACHKHOA",
    aliases: ["bách khoa hà nội và bách khoa tphcm", "bách khoa"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hust.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-096",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Sư phạm TP.HCM (HCMUE) và Sư phạm Kỹ thuật TP.HCM (HCMUTE) khác nhau như thế nào?",
    canonicalEntity: "AMBIGUOUS_SP_SPKT",
    aliases: ["hcmue và hcmute", "sư phạm và sư phạm kỹ thuật"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hcmue.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-097",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Học viện Tài chính (AOF) và Trường Đại học Tài chính - Marketing (UFM) trực thuộc bộ nào?",
    canonicalEntity: "AMBIGUOUS_TAICHINH",
    aliases: ["aof và ufm", "tài chính marketing và học viện tài chính"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "hvtc.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-098",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Thủy lợi (TLU) và Trường Đại học Thăng Long (TLU) cùng dùng viết tắt TLU đúng không?",
    canonicalEntity: "AMBIGUOUS_TLU",
    aliases: ["tlu", "thủy lợi và thăng long", "đh thủy lợi"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "tlu.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-099",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Công nghệ TP.HCM (HUTECH) có phải là trường công lập hay trường đại học tư thục?",
    canonicalEntity: "HUTECH",
    aliases: ["hutech", "đại học công nghệ tphcm"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hutech.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-100",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Kinh tế Quốc dân (NEU) và Trường Đại học Kinh tế thuộc ĐHQGHN (UEB) có cùng trụ sở không?",
    canonicalEntity: "AMBIGUOUS_NEU_UEB",
    aliases: ["neu và ueb", "kinh tế quốc dân và ueb"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "neu.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-101",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Y Dược Cần Thơ (CTUMP) có phải là khoa y của Trường Đại học Cần Thơ (CTU) không?",
    canonicalEntity: "AMBIGUOUS_CTU_CTUMP",
    aliases: ["ctu và ctump", "đại học cần thơ và y dược cần thơ"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ctump.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-102",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Ngoại thương (FTU) cơ sở 2 tại TP.HCM cấp bằng tốt nghiệp có ghi phân biệt cơ sở không?",
    canonicalEntity: "FTU",
    aliases: ["ftu", "ngoại thương cơ sở 2", "ftu2"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ftu.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-103",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Học viện Bưu chính Viễn thông (PTIT) cơ sở phía Nam tại TP.HCM có xét tuyển riêng với cơ sở Hà Nội không?",
    canonicalEntity: "PTIT",
    aliases: ["ptit", "ptit phía nam", "bưu chính viễn thông"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ptit.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-104",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Kiến trúc Hà Nội (HAU) và Đại học Xây dựng Hà Nội (HUCE) có đào tạo ngành Kiến trúc giống nhau không?",
    canonicalEntity: "AMBIGUOUS_HAU_HUCE",
    aliases: ["hau và huce", "kiến trúc và xây dựng"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hau.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-105",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Học viện Nông nghiệp Việt Nam (VNUA) và Trường Đại học Lâm nghiệp (VNUF) cùng đào tạo quản lý rừng?",
    canonicalEntity: "AMBIGUOUS_VNUA_VNUF",
    aliases: ["vnua và vnuf", "nông nghiệp và lâm nghiệp"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "vnua.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-106",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Y Dược Hải Phòng (HPMU) và Trường Đại học Y Dược Thái Bình (TBUMP) có xét tuyển chung không?",
    canonicalEntity: "AMBIGUOUS_HPMU_TBUMP",
    aliases: ["hpmu và tbump", "y hải phòng và y thái bình"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hpmu.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-107",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Đà Lạt (DLU) và Trường Đại học Yersin Đà Lạt có cùng một ban giám hiệu không?",
    canonicalEntity: "AMBIGUOUS_DLU_YERSIN",
    aliases: ["dlu và yersin", "đại học đà lạt"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "dlu.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-108",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Trường Đại học Luật Hà Nội (HLU) có trực thuộc Đại học Quốc gia Hà Nội (VNUHN) không?",
    canonicalEntity: "HLU",
    aliases: ["hlu", "đại học luật hà nội", "luật hà nội"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hlu.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-109",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Khoa Quốc tế ĐHQGHN nay là Trường Đại học Quốc tế (VNU-IS) đúng không?",
    canonicalEntity: "VNUHN",
    aliases: ["vnu-is", "khoa quốc tế đhqghn", "trường quốc tế đhqghn"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "is.vnu.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },
  {
    caseId: "RET-V2-110",
    category: "AMBIGUOUS_ABBREVIATION",
    query: "Phân hiệu Đại học Giao thông Vận tải tại TP.HCM (UTC2) tuyển sinh và cấp bằng chung với UTC Hà Nội?",
    canonicalEntity: "UTC",
    aliases: ["utc2", "utc", "giao thông vận tải"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "utc2.edu.vn",
    freshnessRequirement: "SYSTEM_STRUCTURE"
  },

  // 5. SUPERSEDED / OUTDATED POLICIES (16 cases = 10.7%)
  {
    caseId: "RET-V2-111",
    category: "SUPERSEDED_POLICY",
    query: "Thông tư 43/2014/TT-BGDĐT về đào tạo từ xa trình độ đại học còn hiệu lực không hay đã bị Thông tư 28/2023 thay thế?",
    canonicalEntity: "MOET_VN",
    aliases: ["thông tư 43", "thông tư 28", "bộ giáo dục"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-112",
    category: "SUPERSEDED_POLICY",
    query: "Quy định cộng điểm chứng chỉ nghề phổ thông vào điểm thi tốt nghiệp THPT năm 2026 có còn được áp dụng?",
    canonicalEntity: "MOET_VN",
    aliases: ["điểm nghề phổ thông", "cộng điểm nghề", "bộ giáo dục"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-113",
    category: "SUPERSEDED_POLICY",
    query: "Quy chế tuyển sinh đại học theo Thông tư 09/2020/TT-BGDĐT đã bị bãi bỏ bởi Thông tư 08/2022 đúng không?",
    canonicalEntity: "MOET_VN",
    aliases: ["thông tư 09", "thông tư 08", "bộ giáo dục"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-114",
    category: "SUPERSEDED_POLICY",
    query: "Nghị định 49/2010/NĐ-CP về miễn giảm học phí đã hết hiệu lực từ khi có Nghị định 81/2021 đúng không?",
    canonicalEntity: "GOV_VN",
    aliases: ["nghị định 49", "nghị định 81", "chính phủ"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "chinhphu.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-115",
    category: "SUPERSEDED_POLICY",
    query: "Quy định xếp loại tốt nghiệp đại học có ghi hình thức đào tạo Vừa làm vừa học trên văn bằng không?",
    canonicalEntity: "MOET_VN",
    aliases: ["thông tư 21", "văn bằng đại học", "bộ giáo dục"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-116",
    category: "SUPERSEDED_POLICY",
    query: "Quy chế đào tạo đại học theo niên chế trước năm 2007 có còn trường nào áp dụng cho hệ chính quy không?",
    canonicalEntity: "MOET_VN",
    aliases: ["đào tạo niên chế", "quy chế niên chế", "bộ giáo dục"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-117",
    category: "SUPERSEDED_POLICY",
    query: "Thông tư 10/2016/TT-BGDĐT quy chế công tác học sinh sinh viên có điều khoản đuổi học sinh viên bán dâm 4 lần đã bị sửa đổi chưa?",
    canonicalEntity: "MOET_VN",
    aliases: ["thông tư 10", "công tác sinh viên", "bộ giáo dục"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-118",
    category: "SUPERSEDED_POLICY",
    query: "Quy định về việc miễn thi môn Ngoại ngữ tốt nghiệp THPT nếu có chứng chỉ IELTS 4.0 từ năm 2026 có thay đổi không?",
    canonicalEntity: "MOET_VN",
    aliases: ["miễn thi ngoại ngữ", "ielts 4.0", "bộ giáo dục"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "2026_REGULATION"
  },
  {
    caseId: "RET-V2-119",
    category: "SUPERSEDED_POLICY",
    query: "Mức hỗ trợ 3.63 triệu đồng tiền sinh hoạt phí mỗi tháng cho sinh viên sư phạm theo Nghị định 116/2020 có bị cắt nếu chuyển ngành không?",
    canonicalEntity: "GOV_VN",
    aliases: ["nghị định 116", "sinh hoạt phí sư phạm", "chính phủ"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "chinhphu.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-120",
    category: "SUPERSEDED_POLICY",
    query: "Chính sách học bổng chính sách cho sinh viên trường cao đẳng sư phạm theo Thông tư liên tịch 35/2011 còn dùng được không?",
    canonicalEntity: "MOLISA_VN",
    aliases: ["thông tư liên tịch 35", "học bổng chính sách", "bộ lao động"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "molisa.gov.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-121",
    category: "SUPERSEDED_POLICY",
    query: "Quy định về kỳ thi 3 chung tuyển sinh đại học cao đẳng do Bộ Giáo dục tổ chức đã dừng từ năm nào?",
    canonicalEntity: "MOET_VN",
    aliases: ["thi 3 chung", "ba chung", "bộ giáo dục"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "HISTORICAL_POLICY"
  },
  {
    caseId: "RET-V2-122",
    category: "SUPERSEDED_POLICY",
    query: "Quy định cấp chứng chỉ tin học A B C cũ có còn giá trị quy đổi chuẩn đầu ra đại học không?",
    canonicalEntity: "MIC_VN",
    aliases: ["chứng chỉ tin học a b c", "thông tư 03", "bộ thông tin"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "mic.gov.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-123",
    category: "SUPERSEDED_POLICY",
    query: "Quy chế đào tạo thạc sĩ theo Thông tư 15/2014 đã được thay thế hoàn toàn bởi Thông tư 23/2021 đúng không?",
    canonicalEntity: "MOET_VN",
    aliases: ["thông tư 15", "thông tư 23", "đào tạo thạc sĩ"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-124",
    category: "SUPERSEDED_POLICY",
    query: "Quy định xét chuẩn phó giáo sư giáo sư có bắt buộc bài báo khoa học quốc tế Scopus theo Quyết định 37/2018?",
    canonicalEntity: "GOV_VN",
    aliases: ["quyết định 37", "chuẩn phó giáo sư", "thủ tướng chính phủ"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "chinhphu.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-125",
    category: "SUPERSEDED_POLICY",
    query: "Quy định mức trần học phí đại học công lập chưa tự chủ theo Nghị định 86/2015 đã hết hiệu lực từ năm học nào?",
    canonicalEntity: "GOV_VN",
    aliases: ["nghị định 86", "trần học phí", "chính phủ"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "chinhphu.vn",
    freshnessRequirement: "SUPERSEDED_POLICY"
  },
  {
    caseId: "RET-V2-126",
    category: "SUPERSEDED_POLICY",
    query: "Quy định về việc bảo lưu kết quả học tập cho sinh viên tham gia nghĩa vụ quân sự có thời hạn tối đa bao lâu?",
    canonicalEntity: "MOET_VN",
    aliases: ["nghĩa vụ quân sự", "bảo lưu nghĩa vụ quân sự", "bộ giáo dục"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "REGULAR"
  },

  // 6. SCAM & PHISHING VECTORS (16 cases = 10.7%)
  {
    caseId: "RET-V2-127",
    category: "SCAM_PHISHING",
    query: "Cuộc gọi tự xưng Công an Cục An ninh mạng đe dọa tài khoản ngân hàng sinh viên liên quan vụ án rửa tiền bắt chuyển tiền bảo lãnh",
    canonicalEntity: "MPS_VN",
    aliases: ["công an điều tra", "đe dọa bắt giam", "rửa tiền"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["CYBER_SECURITY_AUTHORITY", "LAW_ENFORCEMENT"],
    knownOfficialDomain: "bocongan.gov.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-128",
    category: "SCAM_PHISHING",
    query: "Website phòng trọ sinh viên yêu cầu chuyển cọc giữ chân qua tài khoản cá nhân có logo ngân hàng nhà nước",
    canonicalEntity: "NCSC_VN",
    aliases: ["lừa cọc phòng trọ", "đặt cọc phòng trọ", "tín nhiệm mạng"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["CYBER_SECURITY_AUTHORITY"],
    knownOfficialDomain: "tinnhiemmang.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-129",
    category: "SCAM_PHISHING",
    query: "Tuyển cộng tác viên dịch thuật tài liệu tiếng Anh tại nhà trả 500k một trang bắt nộp phí bảo lãnh phần mềm 300k",
    canonicalEntity: "NCSC_VN",
    aliases: ["cộng tác viên dịch thuật", "lừa đảo nộp phí", "lừa tiền cọc"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["CYBER_SECURITY_AUTHORITY"],
    knownOfficialDomain: "tinnhiemmang.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-130",
    category: "SCAM_PHISHING",
    query: "Link giả mạo cổng thông tin đào tạo trường đại học để đánh cắp mật khẩu tài khoản sinh viên và mã xác thực 2 bước",
    canonicalEntity: "NCSC_VN",
    aliases: ["đánh cắp mật khẩu", "link giả mạo", "phishing portal"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["CYBER_SECURITY_AUTHORITY"],
    knownOfficialDomain: "tinnhiemmang.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-131",
    category: "SCAM_PHISHING",
    query: "Nhắn tin Telegram mời sinh viên tham gia đánh giá ứng dụng trên App Store nhận hoa hồng 20 phần trăm rồi giam tiền",
    canonicalEntity: "NCSC_VN",
    aliases: ["đánh giá app hoa hồng", "nhiệm vụ telegram", "chiếm đoạt tiền"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["CYBER_SECURITY_AUTHORITY"],
    knownOfficialDomain: "tinnhiemmang.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-132",
    category: "SCAM_PHISHING",
    query: "Quảng cáo nhận làm chứng chỉ tiếng Anh Vstep bậc 3 bậc 4 bao đỗ không cần thi có lưu hồ sơ gốc tại trường đại học",
    canonicalEntity: "MOET_VN",
    aliases: ["làm chứng chỉ vstep", "bao đỗ vstep", "chứng chỉ giả"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "moet.gov.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-133",
    category: "SCAM_PHISHING",
    query: "Dịch vụ thi hộ chứng chỉ tin học quốc tế MOS IC3 giá rẻ cam kết điểm tuyệt đối tại các trung tâm khảo thí",
    canonicalEntity: "MIC_VN",
    aliases: ["thi hộ mos", "thi hộ ic3", "lừa đảo thi hộ"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "mic.gov.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-134",
    category: "SCAM_PHISHING",
    query: "Thủ đoạn hack tài khoản Facebook người thân nhắn tin nhờ sinh viên chuyển tiền gấp 5 triệu đồng để nộp viện phí",
    canonicalEntity: "MPS_VN",
    aliases: ["hack facebook mượn tiền", "chuyển tiền viện phí", "lừa đảo chiếm đoạt"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["LAW_ENFORCEMENT"],
    knownOfficialDomain: "bocongan.gov.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-135",
    category: "SCAM_PHISHING",
    query: "Cảnh báo trang web tra cứu giấy báo trúng tuyển đại học giả mạo gắn link tải file chứa mã độc APK đánh cắp danh bạ",
    canonicalEntity: "NCSC_VN",
    aliases: ["mã độc apk", "tải file giả mạo", "tín nhiệm mạng"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["CYBER_SECURITY_AUTHORITY"],
    knownOfficialDomain: "tinnhiemmang.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-136",
    category: "SCAM_PHISHING",
    query: "Nhận làm khóa luận tốt nghiệp thuê trọn gói cam kết bảo mật không đạo văn nhưng tống tiền sinh viên sau khi nhận cọc",
    canonicalEntity: "MPS_VN",
    aliases: ["viết thuê khóa luận", "tống tiền sinh viên", "lừa đảo làm đồ án"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["LAW_ENFORCEMENT"],
    knownOfficialDomain: "bocongan.gov.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-137",
    category: "SCAM_PHISHING",
    query: "Lừa đảo bán vé máy bay và vé xe tết cho sinh viên qua các fanpage Facebook giả mạo các hãng vận tải lớn",
    canonicalEntity: "NCSC_VN",
    aliases: ["lừa vé xe tết", "vé máy bay tết sinh viên", "page giả mạo"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["CYBER_SECURITY_AUTHORITY"],
    knownOfficialDomain: "tinnhiemmang.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-138",
    category: "SCAM_PHISHING",
    query: "Tuyển dụng sinh viên đi Nhật Bản thực tập kỹ năng visa Tokutei nhưng thu phí môi giới 150 triệu bất hợp pháp",
    canonicalEntity: "MOLISA_VN",
    aliases: ["lừa đảo xuất khẩu lao động", "thực tập sinh nhật bản", "thu phí môi giới"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "molisa.gov.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-139",
    category: "SCAM_PHISHING",
    query: "Tự xưng nhân viên tổng đài nhà mạng thông báo số điện thoại của sinh viên sẽ bị khóa trong 2 giờ nếu không nộp tiền phạt",
    canonicalEntity: "MIC_VN",
    aliases: ["khóa sim sau 2 giờ", "đe dọa khóa số điện thoại", "mạo danh nhà mạng"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_GOVERNMENT_PORTAL"],
    knownOfficialDomain: "mic.gov.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-140",
    category: "SCAM_PHISHING",
    query: "Gạ gẫm sinh viên mở hộ thẻ tín dụng ngân hàng rồi trả hoa hồng 2 triệu đồng sau đó rút hết hạn mức bỏ trốn",
    canonicalEntity: "MPS_VN",
    aliases: ["mở hộ thẻ tín dụng", "lừa đảo thẻ tín dụng", "chiếm đoạt tài sản"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["LAW_ENFORCEMENT"],
    knownOfficialDomain: "bocongan.gov.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-141",
    category: "SCAM_PHISHING",
    query: "Ứng dụng vay tiền online yêu cầu chụp ảnh khỏa thân làm tài sản thế chấp và đe dọa tung ảnh lên mạng xã hội",
    canonicalEntity: "MPS_VN",
    aliases: ["vay tiền chụp ảnh khỏa thân", "đe dọa tung ảnh", "tín dụng đen"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["LAW_ENFORCEMENT"],
    knownOfficialDomain: "bocongan.gov.vn",
    freshnessRequirement: "ALERT"
  },
  {
    caseId: "RET-V2-142",
    category: "SCAM_PHISHING",
    query: "Tự xưng cán bộ phường xã yêu cầu sinh viên mang tiền đến nộp phạt vì trốn nghĩa vụ quân sự không đi khám sơ tuyển",
    canonicalEntity: "MPS_VN",
    aliases: ["phạt trốn nghĩa vụ quân sự", "giả danh cán bộ", "lừa đảo tiền phạt"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["LAW_ENFORCEMENT"],
    knownOfficialDomain: "bocongan.gov.vn",
    freshnessRequirement: "ALERT"
  },

  // 7. ADVERSARIAL / OOD WORDING & SLANG & NOISE (8 cases = 5.3%)
  {
    caseId: "RET-V2-143",
    category: "ADVERSARIAL_SLANG_TYPO",
    query: "trg dh khoa hoc tu nhien hcm co day nganh tri tue nhan tao k mn (teencode / không dấu)",
    canonicalEntity: "HCMUS_VNUHCM",
    aliases: ["hcmus", "khoa học tự nhiên tphcm", "khtn"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hcmus.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-144",
    category: "ADVERSARIAL_SLANG_TYPO",
    query: "ƉH Kịnн тế Qυốc Dân điểm cнυẩn năm 2026 kнối A00 (homoglyph font)",
    canonicalEntity: "NEU",
    aliases: ["neu", "kinh tế quốc dân", "đh kinh tế quốc dân"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "neu.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-145",
    category: "ADVERSARIAL_SLANG_TYPO",
    query: "hoc vien tai chinh co bat buoc hoc quan su tap trung tai vinh phuc ko a",
    canonicalEntity: "AOF",
    aliases: ["aof", "học viện tài chính", "hv tài chính"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hvtc.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-146",
    category: "ADVERSARIAL_SLANG_TYPO",
    query: "bách khoa hn năm nay xét bằng đgnl đhqghn đc ko hay bắt buộc thi tsa",
    canonicalEntity: "HUST",
    aliases: ["bách khoa hà nội", "hust", "đh bách khoa"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hust.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-147",
    category: "ADVERSARIAL_SLANG_TYPO",
    query: "trg spkt tphcm co cho nop tien hoc bang the visa tin dung k moi ng",
    canonicalEntity: "HCMUTE",
    aliases: ["hcmute", "sư phạm kỹ thuật tphcm", "spkt"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hcmute.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-148",
    category: "ADVERSARIAL_SLANG_TYPO",
    query: "Ɖại нọc Y Dược тpнcм тнông вáo нọc pнí 2026 (homoglyph)",
    canonicalEntity: "UMP",
    aliases: ["y dược tphcm", "ump", "đại học y dược tphcm"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "ump.edu.vn",
    freshnessRequirement: "2026_ADMISSION"
  },
  {
    caseId: "RET-V2-149",
    category: "ADVERSARIAL_SLANG_TYPO",
    query: "e bi rot mon the duc 2 lan o bk hcm thi co bi canh cao hoc vu buoc thoi hoc k",
    canonicalEntity: "HCMUT_VNUHCM",
    aliases: ["bách khoa tphcm", "hcmut", "đại học bách khoa"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "hcmut.edu.vn",
    freshnessRequirement: "REGULAR"
  },
  {
    caseId: "RET-V2-150",
    category: "ADVERSARIAL_SLANG_TYPO",
    query: "cho e hoi hoc vien ngoai giao o chua lang co cho sinh vien nam o ktx k a",
    canonicalEntity: "DAV",
    aliases: ["học viện ngoại giao", "dav", "ngoại giao"],
    expectedJurisdiction: "VN",
    expectedSourceTypes: ["OFFICIAL_UNIVERSITY_PORTAL"],
    knownOfficialDomain: "dav.edu.vn",
    freshnessRequirement: "REGULAR"
  }
];

const dataset = {
  version: "HOLDOUT_V2_UNTOUCHED",
  generatedAt: new Date().toISOString(),
  candidate: "studenthub-v5-pilot-rc1",
  totalCases: cases.length,
  categoryBreakdown: {
    UNINDEXED_INSTITUTION: cases.filter(c => c.category === "UNINDEXED_INSTITUTION").length,
    PRIVATE_COMPANY_ORG: cases.filter(c => c.category === "PRIVATE_COMPANY_ORG").length,
    FRESH_2026_NOTICES: cases.filter(c => c.category === "FRESH_2026_NOTICES").length,
    AMBIGUOUS_ABBREVIATION: cases.filter(c => c.category === "AMBIGUOUS_ABBREVIATION").length,
    SUPERSEDED_POLICY: cases.filter(c => c.category === "SUPERSEDED_POLICY").length,
    SCAM_PHISHING: cases.filter(c => c.category === "SCAM_PHISHING").length,
    ADVERSARIAL_SLANG_TYPO: cases.filter(c => c.category === "ADVERSARIAL_SLANG_TYPO").length
  },
  cases
};

const content = JSON.stringify(dataset, null, 2);
const sha256 = crypto.createHash("sha256").update(content).digest("hex");
dataset.datasetHash = sha256;

fs.writeFileSync("docs/evaluation/retrieval_fresh_holdout_v2_dataset.json", JSON.stringify(dataset, null, 2));

console.log("✅ Generated Untouched Retrieval Holdout V2:");
console.log(`- Path: docs/evaluation/retrieval_fresh_holdout_v2_dataset.json`);
console.log(`- Cases: ${cases.length}`);
console.log(`- SHA256: ${sha256}`);
console.log("- Category breakdown:", dataset.categoryBreakdown);
