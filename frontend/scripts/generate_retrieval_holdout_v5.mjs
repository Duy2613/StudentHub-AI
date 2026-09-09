/**
 * StudentHub AI — Fresh retrieval holdout V5 generator.
 *
 * The gold entity/domain fields are written to the evaluation artifact, but
 * the runtime test passes only query text and resolver output to providers.
 * This set is intentionally different from retrieval V4 and is generated
 * after the public-API institution discovery lane was implemented.
 */

import fs from "node:fs";

const cases = [];

const institutions = [
  ["HUST", "Đại học Bách khoa Hà Nội", "hust.edu.vn"],
  ["HCMUT", "Đại học Bách khoa TP.HCM", "hcmut.edu.vn"],
  ["NEU", "Đại học Kinh tế Quốc dân", "neu.edu.vn"],
  ["FTU", "Đại học Ngoại thương", "ftu.edu.vn"],
  ["UEH", "Đại học Kinh tế TP.HCM", "ueh.edu.vn"],
  ["VNUHN", "Đại học Quốc gia Hà Nội", "vnu.edu.vn"],
  ["VNUHCM", "Đại học Quốc gia TP.HCM", "vnuhcm.edu.vn"],
  ["CTU", "Đại học Cần Thơ", "ctu.edu.vn"],
  ["UDN", "Đại học Đà Nẵng", "udn.vn"],
  ["HUEUNI", "Đại học Huế", "hueuni.edu.vn"],
  ["PTIT", "Học viện Công nghệ Bưu chính Viễn thông", "ptit.edu.vn"],
  ["DAV", "Học viện Ngoại giao", "dav.edu.vn"],
  ["HVNH", "Học viện Ngân hàng", "hvnh.edu.vn"],
  ["HMU", "Đại học Y Hà Nội", "hmu.edu.vn"],
  ["UMP", "Đại học Y Dược TP.HCM", "ump.edu.vn"],
  ["PNTU", "Đại học Y khoa Phạm Ngọc Thạch", "pnt.edu.vn"],
  ["ULAW", "Đại học Luật TP.HCM", "ulaw.edu.vn"],
  ["HLU", "Đại học Luật Hà Nội", "hlu.edu.vn"],
  ["HNUE", "Đại học Sư phạm Hà Nội", "hnue.edu.vn"],
  ["HCMUE", "Đại học Sư phạm TP.HCM", "hcmue.edu.vn"],
  ["UIT", "Đại học Công nghệ Thông tin ĐHQG TP.HCM", "uit.edu.vn"],
  ["HAU", "Đại học Kiến trúc Hà Nội", "hau.edu.vn"],
  ["UAH", "Đại học Kiến trúc TP.HCM", "uah.edu.vn"],
  ["BUV", "British University Vietnam", "buv.edu.vn"],
  ["VINUNI", "Đại học VinUni", "vinuni.edu.vn"],
  ["FUV", "Đại học Fulbright Việt Nam", "fulbright.edu.vn"],
  ["EIU", "Đại học Quốc tế Miền Đông", "eiu.edu.vn"],
  ["VLU", "Đại học Văn Lang", "vlu.edu.vn"],
  ["TLU", "Đại học Thủy lợi", "tlu.edu.vn"],
  ["HUMG", "Đại học Mỏ - Địa chất", "humg.edu.vn"],
  ["HAUI", "Đại học Công nghiệp Hà Nội", "haui.edu.vn"],
  ["TMU", "Đại học Thương mại", "tmu.edu.vn"],
  ["EPU", "Đại học Điện lực", "epu.edu.vn"],
  ["HUP", "Đại học Dược Hà Nội", "hup.edu.vn"],
  ["HUNRE", "Đại học Tài nguyên và Môi trường Hà Nội", "hunre.edu.vn"],
  ["IUH", "Đại học Công nghiệp TP.HCM", "iuh.edu.vn"],
  ["UEL", "Đại học Kinh tế - Luật", "uel.edu.vn"],
  ["DUT", "Đại học Bách khoa Đà Nẵng", "dut.udn.vn"],
  ["UED", "Đại học Sư phạm Đà Nẵng", "ued.udn.vn"],
  ["DUE", "Đại học Kinh tế Đà Nẵng", "due.udn.vn"],
  ["NTU", "Đại học Nha Trang", "ntu.edu.vn"],
  ["DLU", "Đại học Đà Lạt", "dlu.edu.vn"],
  ["TDU", "Đại học Tây Đô", "tdu.edu.vn"],
  ["VGU", "Đại học Việt Đức", "vgu.edu.vn"],
  ["RMIT", "RMIT Việt Nam", "rmit.edu.vn"],
  ["SIU", "Đại học Quốc tế Sài Gòn", "siu.edu.vn"],
  ["HOASEN", "Đại học Hoa Sen", "hoasen.edu.vn"],
  ["NTT", "Đại học Nguyễn Tất Thành", "ntt.edu.vn"],
  ["VHU", "Đại học Văn Hiến", "vhu.edu.vn"],
  ["UEF", "Đại học Kinh tế - Tài chính TP.HCM", "uef.edu.vn"],
  ["HUTECH", "Đại học Công nghệ TP.HCM", "hutech.edu.vn"],
  ["LHU", "Đại học Lạc Hồng", "lhu.edu.vn"],
  ["TDMU", "Đại học Thủ Dầu Một", "tdmu.edu.vn"],
  ["BDU", "Đại học Bình Dương", "bdu.edu.vn"],
  ["DNU", "Đại học Đồng Nai", "dnu.edu.vn"],
  ["SGU", "Đại học Sài Gòn", "sgu.edu.vn"],
  ["HANU", "Đại học Hà Nội", "hanu.vn"],
  ["UTC", "Đại học Giao thông Vận tải", "utc.edu.vn"],
  ["HVTC", "Học viện Tài chính", "hvtc.edu.vn"],
  ["USSH", "Đại học Khoa học Xã hội và Nhân văn ĐHQG Hà Nội", "ussh.vnu.edu.vn"],
];

const institutionTemplates = [
  (name) => `${name} tra cứu thông tin tuyển sinh và học phí năm 2026`,
  (name) => `${name} thông báo đăng ký học phần học kỳ 1 năm học 2026-2027`,
];

for (const [index, [id, name, domain]] of institutions.entries()) {
  for (const [templateIndex, template] of institutionTemplates.entries()) {
    cases.push({
      caseId: `RET-V5-INST-${String(index * institutionTemplates.length + templateIndex + 1).padStart(3, "0")}`,
      query: template(name),
      canonicalEntity: id,
      knownOfficialDomains: [domain],
      difficulty: "INSTITUTION_ENTITY_DISCOVERY",
    });
  }
}

const nonInstitutionCases = [
  ["GOVERNMENT_VN", "Nghị định mới về khung học phí giáo dục đại học công lập năm học 2026-2027", "chinhphu.vn", "PUBLIC_POLICY"],
  ["MOET", "Bộ Giáo dục hướng dẫn tuyển sinh đại học và xác nhận nhập học trực tuyến 2026", "moet.gov.vn", "PUBLIC_POLICY"],
  ["VBSP", "Chính sách vay vốn ưu đãi cho sinh viên tại Ngân hàng Chính sách Xã hội 2026", "vbsp.org.vn", "PUBLIC_POLICY"],
  ["BHXH_VN", "Thủ tục bảo hiểm y tế sinh viên và mức đóng năm học 2026-2027", "baohiemxahoi.gov.vn", "PUBLIC_POLICY"],
  ["MOD_VN", "Sinh viên xin tạm hoãn nghĩa vụ quân sự cần giấy xác nhận nào năm 2026", "mod.gov.vn", "PUBLIC_POLICY"],
  ["NCSC", "Cảnh báo giả mạo cổng học phí yêu cầu sinh viên cung cấp mật khẩu và OTP", "ncsc.gov.vn", "SCAM_ALERT"],
  ["MPS", "Cảnh báo mạo danh công an gọi điện đe dọa sinh viên chuyển tiền", "mps.gov.vn", "SCAM_ALERT"],
  ["CANHSAT", "Lừa đảo cho thuê phòng trọ giá rẻ yêu cầu chuyển cọc vào tài khoản cá nhân", "canhsat.gov.vn", "SCAM_ALERT"],
  ["NCSC", "Bẫy tuyển cộng tác viên online bắt sinh viên nạp tiền làm nhiệm vụ", "ncsc.gov.vn", "SCAM_ALERT"],
  ["MOET", "Cảnh báo bằng đại học giả và dịch vụ thi hộ chứng chỉ ngoại ngữ", "moet.gov.vn", "SCAM_ALERT"],
  ["VIETTEL", "Viettel tuyển thực tập sinh công nghệ và chương trình tài năng 2026", "viettel.com.vn", "CORPORATE"],
  ["FSOFT", "FPT Software tuyển fresher AI và data cho sinh viên mới tốt nghiệp 2026", "fptsoftware.com", "CORPORATE"],
  ["SAMSUNG", "Samsung R&D Vietnam mở chương trình thực tập kỹ thuật cho sinh viên 2026", "samsung.com", "CORPORATE"],
  ["VINIF", "Quỹ VINIF công bố học bổng nghiên cứu sau đại học năm 2026", "vinif.org", "CORPORATE"],
  ["MISA", "MISA tuyển thực tập sinh phát triển phần mềm và dữ liệu năm 2026", "misa.vn", "CORPORATE"],
  ["ADMISSIONS_POLICY", "So sánh quy định xét tuyển đại học bằng học bạ và điểm thi tốt nghiệp 2026", "moet.gov.vn", "PUBLIC_POLICY"],
  ["TUITION_POLICY", "Mức trần học phí đại học công lập tự chủ theo quy định mới", "chinhphu.vn", "PUBLIC_POLICY"],
  ["STUDENT_SAFETY", "Cổng thông tin an toàn không gian mạng cảnh báo phishing nhắm vào sinh viên", "ncsc.gov.vn", "SCAM_ALERT"],
  ["CAREER_DISCOVERY", "Ngày hội việc làm công nghệ dành cho sinh viên và người mới tốt nghiệp 2026", "viettel.com.vn", "CORPORATE"],
  ["RESEARCH_FUNDING", "Thông tin học bổng nghiên cứu và tài trợ đề tài cho sinh viên Việt Nam", "vinif.org", "CORPORATE"],
  ["PUBLIC_HEALTH", "Hướng dẫn quyền lợi bảo hiểm y tế của sinh viên khi khám chữa bệnh", "baohiemxahoi.gov.vn", "PUBLIC_POLICY"],
  ["STUDENT_LOAN", "Mức vay tối đa và hồ sơ vay tín dụng học tập năm 2026", "vbsp.org.vn", "PUBLIC_POLICY"],
  ["DIGITAL_SAFETY", "Cảnh báo mã độc trong file học bổng và link khảo sát nhận quà cho sinh viên", "ncsc.gov.vn", "SCAM_ALERT"],
  ["ADMISSION_FRAUD", "Mạo danh trường đại học gửi giấy báo trúng tuyển và yêu cầu phí giữ chỗ", "moet.gov.vn", "SCAM_ALERT"],
  ["CAMPUS_HOUSING", "Khuyến cáo phòng tránh lừa đảo đặt cọc ký túc xá và nhà trọ sinh viên", "canhsat.gov.vn", "SCAM_ALERT"],
  ["PUBLIC_REGULATION", "Quy định mới về chuẩn đầu ra và văn bằng giáo dục đại học năm 2026", "moet.gov.vn", "PUBLIC_POLICY"],
  ["EMPLOYMENT", "Chương trình tuyển dụng kỹ sư phần mềm cho sinh viên năm cuối 2026", "fptsoftware.com", "CORPORATE"],
  ["RESEARCH_INTERNSHIP", "Cơ hội thực tập nghiên cứu trí tuệ nhân tạo cho sinh viên Việt Nam", "samsung.com", "CORPORATE"],
  ["SCHOLARSHIP_FRAUD", "Cảnh báo học bổng toàn phần giả yêu cầu đóng phí bảo lãnh qua tài khoản cá nhân", "ncsc.gov.vn", "SCAM_ALERT"],
  ["ACADEMIC_REGULATION", "Thông tư hướng dẫn quản lý đào tạo và công nhận tín chỉ đại học 2026", "moet.gov.vn", "PUBLIC_POLICY"],
];

for (const [index, [id, query, domain, difficulty]] of nonInstitutionCases.entries()) {
  cases.push({
    caseId: `RET-V5-CONTEXT-${String(index + 1).padStart(3, "0")}`,
    query,
    canonicalEntity: id,
    knownOfficialDomains: [domain],
    difficulty,
  });
}

const artifact = {
  holdoutVersion: "RETRIEVAL_HOLDOUT_V5",
  count: cases.length,
  generatedAfter: "PUBLIC_API_INSTITUTION_DISCOVERY_LANE",
  cases,
};

console.log(`Total Retrieval V5 cases: ${cases.length}`);
fs.writeFileSync(
  "docs/evaluation/retrieval_fresh_holdout_v5_dataset.json",
  `${JSON.stringify(artifact, null, 2)}\n`,
  "utf8",
);
