import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * StudentHub V5 — Fresh Retrieval Holdout Generator (N=150 Queries)
 *
 * Designed to strictly satisfy Sections 9, 10, 11, 12 of the Non-DB Convergence Protocol:
 * - 150 untouched queries across 7 required OOD and challenge categories:
 *   1. UNINDEXED_INSTITUTION (>= 30% -> 48 queries): Universities/colleges absent from KB
 *   2. PRIVATE_COMPANY_ORG (>= 15% -> 24 queries): Fintech, banks, telecoms, platforms
 *   3. FRESH_2026_NOTICES (>= 15% -> 24 queries): 2026 enrollment, schedules, regulations
 *   4. AMBIGUOUS_ABBREVIATION (>= 10% -> 18 queries): ĐHBK, ĐHQG, ĐHSP, FTU, UEH/UEL, PTIT
 *   5. SUPERSEDED_POLICY (>= 10% -> 18 queries): Circulars/decrees that were replaced
 *   6. SCAM_PHISHING (>= 10% -> 18 queries): Scholarship deposits, task scams, fake dorms
 *   7. ADVERSARIAL_SLANG_TYPO (>= 10% -> 18 queries): Student slang, typos, homoglyphs
 *
 * Outputs: docs/evaluation/retrieval_fresh_holdout_dataset.json
 */

const categories = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. UNINDEXED_INSTITUTION (48 queries)
  // ──────────────────────────────────────────────────────────────────────────
  {
    category: "UNINDEXED_INSTITUTION",
    items: [
      { q: "Học phí Trường Đại học Cần Thơ năm 2026 ngành Công nghệ thông tin", entity: "CTU", aliases: ["ctu", "đại học cần thơ", "đhct"], domain: "ctu.edu.vn", jurisdiction: "ACADEMIC_SOUTHERN_REGIONAL" },
      { q: "Phương thức tuyển sinh Đại học Đà Nẵng 2026 hệ chính quy", entity: "UDN", aliases: ["udn", "đại học đà nẵng", "đhđn"], domain: "udn.vn", jurisdiction: "ACADEMIC_CENTRAL_REGIONAL" },
      { q: "Học phí Trường Đại học Ngoại thương Cơ sở 2 TP.HCM năm 2026", entity: "FTU_CS2", aliases: ["ftu cs2", "ngoại thương cơ sở 2", "ftu hcm"], domain: "cs2.ftu.edu.vn", jurisdiction: "ACADEMIC_CENTRAL_UNIVERSITY" },
      { q: "Quy định chuẩn đầu ra ngoại ngữ Đại học Huế năm 2026", entity: "HUEUNI", aliases: ["hueuni", "đại học huế", "đh huế"], domain: "hueuni.edu.vn", jurisdiction: "ACADEMIC_CENTRAL_REGIONAL" },
      { q: "Học bổng thủ khoa đầu vào Trường Đại học FPT năm 2026", entity: "FPTU", aliases: ["fptu", "đại học fpt", "đh fpt"], domain: "fpt.edu.vn", jurisdiction: "ACADEMIC_PRIVATE" },
      { q: "Biểu phí chương trình quốc tế Đại học RMIT Việt Nam 2026", entity: "RMIT_VN", aliases: ["rmit", "rmit vietnam", "đại học rmit"], domain: "rmit.edu.vn", jurisdiction: "ACADEMIC_FOREIGN_BRANCH" },
      { q: "Điểm chuẩn xét học bạ Trường Đại học Phenikaa năm 2026", entity: "PHENIKAA", aliases: ["phenikaa", "đại học phenikaa"], domain: "phenikaa-uni.edu.vn", jurisdiction: "ACADEMIC_PRIVATE" },
      { q: "Quy định xét miễn học phần Giáo dục thể chất Đại học Tôn Đức Thắng", entity: "TDTU", aliases: ["tdtu", "đại học tôn đức thắng", "tôn đức thắng"], domain: "tdtu.edu.vn", jurisdiction: "ACADEMIC_AUTONOMOUS" },
      { q: "Học viện Công nghệ Bưu chính Viễn thông thông báo xét tuyển 2026", entity: "PTIT", aliases: ["ptit", "học viện bưu chính viễn thông", "hv công nghệ bưu chính viễn thông"], domain: "ptit.edu.vn", jurisdiction: "ACADEMIC_MINISTRY_MIC" },
      { q: "Học viện Ngoại giao thông báo điều chỉnh chỉ tiêu tuyển sinh 2026", entity: "DAV", aliases: ["dav", "học viện ngoại giao", "ngoại giao"], domain: "dav.edu.vn", jurisdiction: "ACADEMIC_MINISTRY_MOFA" },
      { q: "Học viện Ngân hàng quy định khung học phí năm học 2026-2027", entity: "BAV", aliases: ["bav", "học viện ngân hàng", "hv ngân hàng"], domain: "hvnh.edu.vn", jurisdiction: "ACADEMIC_MINISTRY_SBV" },
      { q: "Trường Đại học Y Hà Nội thông báo lịch thi bác sĩ nội trú 2026", entity: "HMU", aliases: ["hmu", "đại học y hà nội", "y hà nội"], domain: "hmu.edu.vn", jurisdiction: "ACADEMIC_HEALTHCARE" },
      { q: "Đại học Y Dược TP.HCM công bố chính sách học bổng khuyến khích học tập", entity: "UMP", aliases: ["ump", "đại học y dược tphcm", "y dược tphcm"], domain: "ump.edu.vn", jurisdiction: "ACADEMIC_HEALTHCARE" },
      { q: "Trường Đại học Y khoa Phạm Ngọc Thạch biểu giá học phí sinh viên ngoại tỉnh", entity: "PNTU", aliases: ["pntu", "phạm ngọc thạch", "y khoa phạm ngọc thạch"], domain: "pnt.edu.vn", jurisdiction: "ACADEMIC_HEALTHCARE_MUNICIPAL" },
      { q: "Trường Đại học Luật TP.HCM quy chế đánh giá điểm rèn luyện sinh viên", entity: "ULAW", aliases: ["ulaw", "đại học luật tphcm", "đh luật tphcm"], domain: "hcmulaw.edu.vn", jurisdiction: "ACADEMIC_SPECIALIZED_LAW" },
      { q: "Trường Đại học Luật Hà Nội công bố chương trình liên kết quốc tế 2026", entity: "HLU", aliases: ["hlu", "đại học luật hà nội", "đh luật hn"], domain: "hlu.edu.vn", jurisdiction: "ACADEMIC_SPECIALIZED_LAW" },
      { q: "Trường Đại học Tây Nguyên thông báo chính sách trợ cấp sinh viên dân tộc thiểu số", entity: "TTN", aliases: ["ttn", "đại học tây nguyên", "đh tây nguyên"], domain: "ttn.edu.vn", jurisdiction: "ACADEMIC_REGIONAL" },
      { q: "Trường Đại học Nha Trang quy định điều kiện tốt nghiệp chứng chỉ tin học", entity: "NTU", aliases: ["ntu", "đại học nha trang", "đh nha trang"], domain: "ntu.edu.vn", jurisdiction: "ACADEMIC_REGIONAL" },
      { q: "Trường Đại học Quy Nhơn kế hoạch giảng dạy học kỳ hè năm 2026", entity: "QNU", aliases: ["qnu", "đại học quy nhơn", "đh quy nhơn"], domain: "qnu.edu.vn", jurisdiction: "ACADEMIC_REGIONAL" },
      { q: "Trường Đại học Sư phạm Hà Nội thông báo kỳ thi đánh giá năng lực 2026", entity: "HNUE", aliases: ["hnue", "đại học sư phạm hà nội", "đhsp hà nội"], domain: "hnue.edu.vn", jurisdiction: "ACADEMIC_PEDAGOGY" },
      { q: "Trường Đại học Sư phạm TP.HCM quy định miễn giảm học phí ngành sư phạm", entity: "HCMUE", aliases: ["hcmue", "đại học sư phạm tphcm", "đhsp tphcm"], domain: "hcmue.edu.vn", jurisdiction: "ACADEMIC_PEDAGOGY" },
      { q: "Trường Đại học Nông Lâm TP.HCM biểu phí ký túc xá khu A năm 2026", entity: "NLU", aliases: ["nlu", "đại học nông lâm", "nông lâm tphcm"], domain: "hcmuaf.edu.vn", jurisdiction: "ACADEMIC_AGRICULTURE" },
      { q: "Trường Đại học Kiến trúc TP.HCM điều kiện dự thi môn vẽ năng khiếu 2026", entity: "UAH", aliases: ["uah", "đại học kiến trúc tphcm", "kiến trúc tphcm"], domain: "uah.edu.vn", jurisdiction: "ACADEMIC_ARTS_ARCHITECTURE" },
      { q: "Trường Đại học Mỹ thuật TP.HCM quy định bảo lưu kết quả học tập", entity: "HCMUFA", aliases: ["hcmufa", "đại học mỹ thuật tphcm", "mỹ thuật tphcm"], domain: "hcmufa.edu.vn", jurisdiction: "ACADEMIC_ARTS" },
      { q: "Trường Đại học Mở Hà Nội phương thức đào tạo từ xa trực tuyến 2026", entity: "HOU", aliases: ["hou", "đại học mở hà nội", "viện đại học mở"], domain: "hou.edu.vn", jurisdiction: "ACADEMIC_OPEN" },
      { q: "Trường Đại học Mở TP.HCM biểu mức học phí chương trình chất lượng cao", entity: "OU", aliases: ["ou", "đại học mở tphcm", "mở tphcm"], domain: "ou.edu.vn", jurisdiction: "ACADEMIC_OPEN" },
      { q: "Học viện Tài chính kế hoạch đăng ký tín chỉ chuyên ngành năm 2026", entity: "AOF", aliases: ["aof", "học viện tài chính", "hv tài chính"], domain: "hvtc.edu.vn", jurisdiction: "ACADEMIC_MINISTRY_MOF" },
      { q: "Trường Đại học Thương mại tiêu chí xét tuyển học sinh trường chuyên 2026", entity: "TMU", aliases: ["tmu", "đại học thương mại", "thương mại"], domain: "tmu.edu.vn", jurisdiction: "ACADEMIC_COMMERCE" },
      { q: "Trường Đại học Xây dựng Hà Nội quy chế thực tập doanh nghiệp bắt buộc", entity: "HUCE", aliases: ["huce", "đại học xây dựng hà nội", "xây dựng hà nội"], domain: "huce.edu.vn", jurisdiction: "ACADEMIC_ENGINEERING" },
      { q: "Trường Đại học Giao thông Vận tải cơ sở Hà Nội công bố học bổng sinh viên giỏi", entity: "UTC", aliases: ["utc", "đại học giao thông vận tải", "đh gtvt"], domain: "utc.edu.vn", jurisdiction: "ACADEMIC_TRANSPORT" },
      { q: "Trường Đại học Giao thông Vận tải Phân hiệu TP.HCM lịch học giáo dục quốc phòng", entity: "UTC2", aliases: ["utc2", "gtvt phân hiệu tphcm", "utc phân hiệu tphcm"], domain: "utc2.edu.vn", jurisdiction: "ACADEMIC_TRANSPORT" },
      { q: "Trường Đại học Thủy lợi cơ sở miền Nam quy định đăng ký môn học lại", entity: "TLU", aliases: ["tlu", "đại học thủy lợi", "thủy lợi"], domain: "tlu.edu.vn", jurisdiction: "ACADEMIC_ENGINEERING" },
      { q: "Trường Đại học Công nghiệp Hà Nội quy chế hỗ trợ việc làm sau tốt nghiệp", entity: "HAUI", aliases: ["haui", "đại học công nghiệp hà nội", "đh công nghiệp hà nội"], domain: "haui.edu.vn", jurisdiction: "ACADEMIC_MINISTRY_MOIT" },
      { q: "Trường Đại học Công Thương TP.HCM danh sách các ngành được cấp chứng nhận AUN-QA", entity: "HUIT", aliases: ["huit", "đại học công thương tphcm", "công nghiệp thực phẩm"], domain: "huit.edu.vn", jurisdiction: "ACADEMIC_MINISTRY_MOIT" },
      { q: "Trường Đại học Tài chính - Marketing chính sách học bổng thặng dư sinh viên khá giỏi", entity: "UFM", aliases: ["ufm", "đại học tài chính marketing", "tài chính marketing"], domain: "ufm.edu.vn", jurisdiction: "ACADEMIC_MINISTRY_MOF" },
      { q: "Trường Đại học Sài Gòn quy định công nhận tương đương chứng chỉ tin học IC3", entity: "SGU", aliases: ["sgu", "đại học sài gòn", "đh sài gòn"], domain: "sgu.edu.vn", jurisdiction: "ACADEMIC_MUNICIPAL" },
      { q: "Trường Đại học Văn Lang mức học phí ngành Răng Hàm Mặt khóa tuyển sinh 2026", entity: "VLU", aliases: ["vlu", "đại học văn lang", "văn lang"], domain: "vlu.edu.vn", jurisdiction: "ACADEMIC_PRIVATE" },
      { q: "Trường Đại học Hoa Sen chính sách học bổng tài năng doanh nhân 2026", entity: "HSU", aliases: ["hsu", "đại học hoa sen", "hoa sen"], domain: "hoasen.edu.vn", jurisdiction: "ACADEMIC_PRIVATE" },
      { q: "Trường Đại học Quốc tế Hồng Bàng học phí ngành Y khoa đa khoa 2026", entity: "HIU", aliases: ["hiu", "đại học quốc tế hồng bàng", "hồng bàng"], domain: "hiu.vn", jurisdiction: "ACADEMIC_PRIVATE" },
      { q: "Trường Đại học HUTECH quy định mặc đồng phục và đeo thẻ sinh viên", entity: "HUTECH", aliases: ["hutech", "đại học công nghệ tphcm", "hutech uni"], domain: "hutech.edu.vn", jurisdiction: "ACADEMIC_PRIVATE" },
      { q: "Trường Đại học Nguyễn Tất Thành chính sách giảm 20% học phí kỳ đầu tiên", entity: "NTTU", aliases: ["nttu", "đại học nguyễn tất thành", "nguyễn tất thành"], domain: "ntt.edu.vn", jurisdiction: "ACADEMIC_PRIVATE" },
      { q: "Học viện Hàng không Việt Nam tiêu chuẩn sức khỏe ngành quản lý bay", entity: "VAA", aliases: ["vaa", "học viện hàng không", "hàng không việt nam"], domain: "vaa.edu.vn", jurisdiction: "ACADEMIC_TRANSPORT" },
      { q: "Học viện Báo chí và Tuyên truyền thông báo thi tuyển môn Năng khiếu báo chí", entity: "AJC", aliases: ["ajc", "học viện báo chí tuyên truyền", "báo chí tuyên truyền"], domain: "ajc.edu.vn", jurisdiction: "ACADEMIC_POLITICAL" },
      { q: "Đại học VinUni thông báo chương trình học bổng toàn phần 100% học phí", entity: "VINUNI", aliases: ["vinuni", "đại học vinuni", "vinuniversity"], domain: "vinuni.edu.vn", jurisdiction: "ACADEMIC_PRIVATE" },
      { q: "Trường Đại học Phenikaa chính sách ký túc xá miễn phí cho tân sinh viên", entity: "PHENIKAA", aliases: ["phenikaa", "đại học phenikaa"], domain: "phenikaa-uni.edu.vn", jurisdiction: "ACADEMIC_PRIVATE" },
      { q: "Trường Đại học Dược Hà Nội thông báo điều kiện cấp chứng chỉ hành nghề dược", entity: "HUP", aliases: ["hup", "đại học dược hà nội", "dược hà nội"], domain: "hup.edu.vn", jurisdiction: "ACADEMIC_HEALTHCARE" },
      { q: "Trường Đại học Kỹ thuật Y Dược Đà Nẵng quy chế đánh giá thực tập lâm sàng", entity: "DUMTP", aliases: ["dumtp", "kỹ thuật y dược đà nẵng"], domain: "dhtm.edu.vn", jurisdiction: "ACADEMIC_HEALTHCARE" },
      { q: "Trường Đại học Y Dược Cần Thơ quy định tuyển sinh liên thông chính quy 2026", entity: "CTUMP", aliases: ["ctump", "y dược cần thơ", "đh y dược cần thơ"], domain: "ctump.edu.vn", jurisdiction: "ACADEMIC_HEALTHCARE" }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. PRIVATE_COMPANY_ORG (24 queries)
  // ──────────────────────────────────────────────────────────────────────────
  {
    category: "PRIVATE_COMPANY_ORG",
    items: [
      { q: "Ví điện tử MoMo có thu phí duy trì tài khoản sinh viên hàng tháng không?", entity: "MOMO_VN", aliases: ["momo", "ví momo", "công ty m-service"], domain: "momo.vn", jurisdiction: "FINTECH_E_WALLET" },
      { q: "ZaloPay quy định hạn mức giao dịch chuyển tiền cho tài khoản chưa xác thực CCCD", entity: "ZALOPAY", aliases: ["zalopay", "ví zalopay", "vng zalopay"], domain: "zalopay.vn", jurisdiction: "FINTECH_E_WALLET" },
      { q: "ShopeePay liên kết ngân hàng nhận ưu đãi thanh toán học phí đại học", entity: "SHOPEEPAY", aliases: ["shopeepay", "ví shopeepay"], domain: "shopeepay.vn", jurisdiction: "FINTECH_E_WALLET" },
      { q: "Viettel Telecom thông báo gói cước 4G ưu đãi sinh viên 50k mỗi tháng", entity: "VIETTEL", aliases: ["viettel", "tập đoàn viettel", "viettel telecom"], domain: "viettel.vn", jurisdiction: "TELECOM" },
      { q: "VNPT VinaPhone hướng dẫn đăng ký sim sinh viên chính chủ online", entity: "VINAPHONE", aliases: ["vinaphone", "vnpt", "mạng vinaphone"], domain: "vinaphone.com.vn", jurisdiction: "TELECOM" },
      { q: "MobiFone chính sách gói cước data sinh viên không giới hạn dung lượng", entity: "MOBIFONE", aliases: ["mobifone", "tổng công ty mobifone"], domain: "mobifone.vn", jurisdiction: "TELECOM" },
      { q: "FPT Shop chương trình ưu đãi giảm 10% laptop tựu trường cho tân sinh viên", entity: "FPTSHOP", aliases: ["fpt shop", "hệ thống fpt shop"], domain: "fptshop.com.vn", jurisdiction: "RETAIL_TECH" },
      { q: "Thế Giới Di Động chương trình đổi điểm thi đại học nhận voucher mua laptop", entity: "MWG", aliases: ["thế giới di động", "tgdd", "mwg"], domain: "thegioididong.com", jurisdiction: "RETAIL_TECH" },
      { q: "Grab Vietnam chính sách mã giảm giá GrabBike sinh viên tại các làng đại học", entity: "GRAB_VN", aliases: ["grab", "grab việt nam", "grabbike"], domain: "grab.com", jurisdiction: "RIDE_HAILING" },
      { q: "Be Group chính sách đăng ký làm tài xế beBike part-time cho sinh viên", entity: "BE_GROUP", aliases: ["be", "be group", "beamin"], domain: "be.com.vn", jurisdiction: "RIDE_HAILING" },
      { q: "Ngân hàng Vietcombank thủ tục mở thẻ tín dụng sinh viên không cần chứng minh thu nhập", entity: "VCB", aliases: ["vietcombank", "vcb", "ngân hàng ngoại thương"], domain: "vietcombank.com.vn", jurisdiction: "BANKING_COMMERCIAL" },
      { q: "Ngân hàng BIDV chính sách vay vốn học tập sinh viên theo diện bảo lãnh", entity: "BIDV", aliases: ["bidv", "ngân hàng bidv", "đầu tư và phát triển việt nam"], domain: "bidv.com.vn", jurisdiction: "BANKING_COMMERCIAL" },
      { q: "Ngân hàng VietinBank biểu phí chuyển tiền quốc tế thanh toán học phí du học", entity: "CTG", aliases: ["vietinbank", "ngân hàng công thương"], domain: "vietinbank.vn", jurisdiction: "BANKING_COMMERCIAL" },
      { q: "Ngân hàng Agribank thủ tục nhận tiền kiều hối cho lưu học sinh", entity: "AGRIBANK", aliases: ["agribank", "ngân hàng nông nghiệp"], domain: "agribank.com.vn", jurisdiction: "BANKING_COMMERCIAL" },
      { q: "Ngân hàng Techcombank quy định mở tài khoản thanh toán số đẹp miễn phí cho sinh viên", entity: "TCB", aliases: ["techcombank", "kỹ thương việt nam"], domain: "techcombank.com.vn", jurisdiction: "BANKING_COMMERCIAL" },
      { q: "Ngân hàng MB Bank chính sách phát hành thẻ sinh viên tích hợp thẻ ghi nợ quốc tế", entity: "MBB", aliases: ["mb bank", "ngân hàng quân đội", "mbbank"], domain: "mbbank.com.vn", jurisdiction: "BANKING_COMMERCIAL" },
      { q: "Ngân hàng VPBank điều kiện vay thấu chi tín chấp dành cho sinh viên năm cuối", entity: "VPB", aliases: ["vpbank", "ngân hàng việt nam thịnh vượng"], domain: "vpbank.com.vn", jurisdiction: "BANKING_COMMERCIAL" },
      { q: "Ngân hàng TPBank dịch vụ mở thẻ LiveBank 24/7 lấy ngay thẻ sinh viên", entity: "TPB", aliases: ["tpbank", "tiên phong bank"], domain: "tpb.vn", jurisdiction: "BANKING_COMMERCIAL" },
      { q: "Sàn thương mại Shopee Việt Nam cảnh báo thủ đoạn tuyển CTV xử lý đơn ảo", entity: "SHOPEE_VN", aliases: ["shopee", "shopee việt nam"], domain: "shopee.vn", jurisdiction: "E_COMMERCE" },
      { q: "Sàn Lazada Việt Nam quy định về tài khoản gian hàng chính hãng LazMall cho trường đại học", entity: "LAZADA_VN", aliases: ["lazada", "lazada việt nam"], domain: "lazada.vn", jurisdiction: "E_COMMERCE" },
      { q: "TikTok Shop Việt Nam chính sách kiểm duyệt livestream bán sách giáo trình đại học", entity: "TIKTOK_VN", aliases: ["tiktok shop", "tiktok việt nam"], domain: "tiktok.com", jurisdiction: "SOCIAL_COMMERCE" },
      { q: "Tập đoàn VNG thông báo chương trình thực tập sinh VNG Fresher 2026", entity: "VNG", aliases: ["vng", "tập đoàn vng", "vinagame"], domain: "vng.com.vn", jurisdiction: "TECH_ENTERPRISE" },
      { q: "Viettel Post dịch vụ giao nhận hồ sơ thi chuyển phát nhanh bảo đảm cho thí sinh", entity: "VTP", aliases: ["viettel post", "chuyển phát viettel"], domain: "viettelpost.com.vn", jurisdiction: "LOGISTICS" },
      { q: "Bưu điện Việt Nam VNPost dịch vụ nhận đăng ký nguyện vọng đại học tại bưu cục", entity: "VNPOST", aliases: ["vnpost", "bưu điện việt nam"], domain: "vnpost.vn", jurisdiction: "LOGISTICS" }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. FRESH_2026_NOTICES (24 queries)
  // ──────────────────────────────────────────────────────────────────────────
  {
    category: "FRESH_2026_NOTICES",
    items: [
      { q: "Lịch nghỉ Tết Nguyên đán 2026 của sinh viên ĐHQG TP.HCM", entity: "VNUHCM", aliases: ["vnuhcm", "đhqg-hcm"], domain: "vnuhcm.edu.vn", jurisdiction: "ACADEMIC_NATIONAL_UNIVERSITY" },
      { q: "Thời hạn nộp hồ sơ xét tốt nghiệp đợt tháng 3 năm 2026 Bách khoa TP.HCM", entity: "HCMUT_VNUHCM", aliases: ["hcmut", "bách khoa tphcm"], domain: "hcmut.edu.vn", jurisdiction: "ACADEMIC_MEMBER_UNIVERSITY" },
      { q: "Kế hoạch tổ chức kỳ thi Đánh giá năng lực đợt 1 năm 2026 ĐHQG TP.HCM", entity: "VNUHCM", aliases: ["vnuhcm", "đánh giá năng lực đhqg"], domain: "cete.vnuhcm.edu.vn", jurisdiction: "ACADEMIC_TESTING" },
      { q: "Lịch thi Đánh giá tư duy TSA năm 2026 của Đại học Bách khoa Hà Nội", entity: "HUST", aliases: ["hust", "bách khoa hà nội", "đhbk hà nội"], domain: "hust.edu.vn", jurisdiction: "ACADEMIC_TESTING" },
      { q: "Thông báo tuyển sinh đào tạo thạc sĩ đợt 1 năm 2026 Đại học Kinh tế TP.HCM", entity: "UEH", aliases: ["ueh", "đại học kinh tế tphcm"], domain: "ueh.edu.vn", jurisdiction: "ACADEMIC_POSTGRADUATE" },
      { q: "Trường Đại học Kinh tế Quốc dân thông báo xét tuyển kết hợp chứng chỉ SAT 2026", entity: "NEU", aliases: ["neu", "kinh tế quốc dân"], domain: "neu.edu.vn", jurisdiction: "ACADEMIC_NATIONAL_UNIVERSITY" },
      { q: "Thời gian đóng học phí học kỳ 2 năm học 2025-2026 HCMUTE", entity: "HCMUTE", aliases: ["hcmute", "sư phạm kỹ thuật tphcm"], domain: "hcmute.edu.vn", jurisdiction: "ACADEMIC_AUTONOMOUS" },
      { q: "Lịch đăng ký đề tài khóa luận tốt nghiệp ngành Kế toán UEH năm 2026", entity: "UEH", aliases: ["ueh", "kinh tế tphcm"], domain: "ueh.edu.vn", jurisdiction: "ACADEMIC_UNDERGRADUATE" },
      { q: "Quy định mức thu học phí khóa tuyển sinh năm 2026 Đại học Ngoại thương", entity: "FTU", aliases: ["ftu", "ngoại thương"], domain: "ftu.edu.vn", jurisdiction: "ACADEMIC_CENTRAL_UNIVERSITY" },
      { q: "Thông báo gia hạn đăng ký học phần giáo dục thể chất học kỳ 2 ĐHQGHN 2026", entity: "VNUHN", aliases: ["vnuhn", "đhqghn"], domain: "vnu.edu.vn", jurisdiction: "ACADEMIC_NATIONAL_UNIVERSITY" },
      { q: "Hội đồng tuyển sinh Quân sự Bộ Quốc phòng thông báo chỉ tiêu tuyển sinh 2026", entity: "MOD_VN", aliases: ["bộ quốc phòng", "tuyển sinh quân sự"], domain: "mod.gov.vn", jurisdiction: "GOVERNMENT_DEFENSE" },
      { q: "Bộ Công an công bố phương thức thi đánh giá năng lực tuyển sinh công an nhân dân 2026", entity: "MPS_VN", aliases: ["bộ công an", "a05", "tuyển sinh candoan"], domain: "bocongan.gov.vn", jurisdiction: "GOVERNMENT_PUBLIC_SECURITY" },
      { q: "Lịch tổ chức thi tốt nghiệp trung học phổ thông năm 2026 của Bộ Giáo dục", entity: "MOET_VN", aliases: ["moet", "bộ giáo dục"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Trung tâm Giám sát an toàn không gian mạng quốc gia cảnh báo thủ đoạn lừa đảo mới tháng 2/2026", entity: "NCSC_VN", aliases: ["ncsc", "tinnhiemmang"], domain: "tinnhiemmang.vn", jurisdiction: "CYBER_SECURITY" },
      { q: "Quy định mới về tổ chức thực tập lâm sàng ngành Y khoa có hiệu lực từ 01/01/2026", entity: "MOH_VN", aliases: ["bộ y tế", "moh"], domain: "moh.gov.vn", jurisdiction: "GOVERNMENT_HEALTH" },
      { q: "Bộ Lao động Thương binh và Xã hội lịch nghỉ lễ Quốc khánh 02/09/2026", entity: "MOLISA_VN", aliases: ["bộ lđtbxh", "molisa"], domain: "molisa.gov.vn", jurisdiction: "GOVERNMENT_LABOR" },
      { q: "Ngân hàng Chính sách xã hội nâng mức cho vay học sinh sinh viên năm học 2026", entity: "VBSP", aliases: ["ngân hàng chính sách xã hội", "vbsp"], domain: "vbsp.org.vn", jurisdiction: "GOVERNMENT_BANKING" },
      { q: "Lịch bảo vệ đồ án tốt nghiệp kỹ sư ngành Cơ điện tử HUST đợt xuân 2026", entity: "HUST", aliases: ["hust", "bách khoa hà nội"], domain: "hust.edu.vn", jurisdiction: "ACADEMIC_ENGINEERING" },
      { q: "Thời hạn đăng ký ở ký túc xá khu B ĐHQG TP.HCM học kỳ 2 năm học 2025-2026", entity: "KTX_VNUHCM", aliases: ["ktx khu b", "ký túc xá đhqg"], domain: "ktxb.vnuhcm.edu.vn", jurisdiction: "STUDENT_SERVICES" },
      { q: "Ký túc xá Mễ Trì Đại học Quốc gia Hà Nội thông báo gia hạn lưu trú 2026", entity: "KTX_VNUHN", aliases: ["ktx mễ trì", "ký túc xá mễ trì"], domain: "cssv.vnu.edu.vn", jurisdiction: "STUDENT_SERVICES" },
      { q: "Thông báo tuyển dụng trợ giảng và cộng tác viên nghiên cứu Viện Nghiên cứu ĐHQGHN 2026", entity: "VNUHN", aliases: ["đhqghn", "vnu"], domain: "vnu.edu.vn", jurisdiction: "ACADEMIC_RESEARCH" },
      { q: "Trường Đại học Bách khoa TP.HCM thông báo nhận hồ sơ học bổng OISP Alumni 2026", entity: "HCMUT_VNUHCM", aliases: ["oisp", "hcmut"], domain: "oisp.hcmut.edu.vn", jurisdiction: "ACADEMIC_SCHOLARSHIP" },
      { q: "Chính sách học bổng khuyến khích phát triển tài năng năm học 2026 ĐH Bách khoa Hà Nội", entity: "HUST", aliases: ["hust", "học bổng tài năng"], domain: "hust.edu.vn", jurisdiction: "ACADEMIC_SCHOLARSHIP" },
      { q: "Lịch khám sức khỏe định kỳ cho toàn thể sinh viên Trường Đại học Sư phạm Kỹ thuật TP.HCM 2026", entity: "HCMUTE", aliases: ["hcmute", "trạm y tế hcmute"], domain: "hcmute.edu.vn", jurisdiction: "STUDENT_HEALTH" }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. AMBIGUOUS_ABBREVIATION (18 queries)
  // ──────────────────────────────────────────────────────────────────────────
  {
    category: "AMBIGUOUS_ABBREVIATION",
    items: [
      { q: "ĐHBK thông báo tuyển sinh năm 2026 (Phân biệt BK Hà Nội vs BK TP.HCM)", entity: "AMBIGUOUS_DHBK", aliases: ["đhbk", "bách khoa"], domain: "hust.edu.vn,hcmut.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "Học phí ngành Khoa học máy tính tại ĐHBK năm 2026 là bao nhiêu?", entity: "AMBIGUOUS_DHBK", aliases: ["đhbk", "bách khoa"], domain: "hust.edu.vn,hcmut.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "ĐHQG công bố lịch thi đánh giá năng lực năm 2026 (Hà Nội hay TP.HCM)", entity: "AMBIGUOUS_DHQG", aliases: ["đhqg"], domain: "vnu.edu.vn,vnuhcm.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "Điểm chuẩn xét tuyển kỳ thi ĐGNL vào các trường thành viên ĐHQG 2026", entity: "AMBIGUOUS_DHQG", aliases: ["đhqg"], domain: "vnu.edu.vn,vnuhcm.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "ĐHSP thông báo chế độ trợ cấp sinh hoạt phí theo Nghị định 116 (Hà Nội vs TP.HCM)", entity: "AMBIGUOUS_DHSP", aliases: ["đhsp", "sư phạm"], domain: "hnue.edu.vn,hcmue.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "FTU cơ sở 1 và cơ sở 2 có áp dụng chung một mức học phí không?", entity: "FTU", aliases: ["ftu", "ngoại thương"], domain: "ftu.edu.vn,cs2.ftu.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "UEH và UEL khác nhau như thế nào về chương trình đào tạo Luật kinh tế?", entity: "AMBIGUOUS_UEH_UEL", aliases: ["ueh", "uel"], domain: "ueh.edu.vn,uel.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "Trường UTE ở TP.HCM và trường UTE ở Hưng Yên có phải là một trường không?", entity: "AMBIGUOUS_UTE", aliases: ["ute", "spkt"], domain: "hcmute.edu.vn,utehy.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "Ký hiệu PTIT đại diện cho cơ sở đào tạo nào tại Hà Nội và TP.HCM?", entity: "PTIT", aliases: ["ptit"], domain: "ptit.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "DAV và BAV có trực thuộc cùng một bộ chủ quản không?", entity: "AMBIGUOUS_DAV_BAV", aliases: ["dav", "bav"], domain: "dav.edu.vn,hvnh.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "ĐH Kinh tế là UEH tại TP.HCM hay UEL thuộc ĐHQG-HCM?", entity: "AMBIGUOUS_DHKT", aliases: ["đh kinh tế", "đại học kinh tế"], domain: "ueh.edu.vn,uel.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "ĐH Luật Hà Nội (HLU) và ĐH Luật TP.HCM (ULAW) có trực thuộc Bộ Tư pháp không?", entity: "AMBIGUOUS_LUAT", aliases: ["hlu", "ulaw"], domain: "hlu.edu.vn,hcmulaw.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "Trường Đại học Bách khoa Đà Nẵng (DUT) có trực thuộc ĐHQG không?", entity: "DUT", aliases: ["dut", "bách khoa đà nẵng"], domain: "dut.udn.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "Học viện Ngân hàng cơ sở Bắc Ninh và cơ sở Phú Yên cấp bằng có khác nhau không?", entity: "BAV", aliases: ["bav", "học viện ngân hàng"], domain: "hvnh.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "Khoa Y ĐHQG TP.HCM đã đổi tên thành Trường Đại học Khoa học Sức khỏe chưa?", entity: "UHS_VNUHCM", aliases: ["khoa y", "đại học khoa học sức khỏe"], domain: "medvnu.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "Trường Đại học Quốc tế IU có phải toàn bộ môn học đều dạy bằng tiếng Anh không?", entity: "HCMIU_VNUHCM", aliases: ["iu", "đại học quốc tế"], domain: "hcmiu.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "Trường Đại học Khoa học Tự nhiên viết tắt là HUS hay HCMUS?", entity: "AMBIGUOUS_KHTN", aliases: ["hus", "hcmus", "tự nhiên"], domain: "hus.vnu.edu.vn,hcmus.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" },
      { q: "Trường Đại học Khoa học Xã hội và Nhân văn viết tắt là USSH Hà Nội hay USSH TP.HCM?", entity: "AMBIGUOUS_KHXHNV", aliases: ["ussh", "nhân văn"], domain: "ussh.vnu.edu.vn,hcmussh.edu.vn", jurisdiction: "AMBIGUOUS_ACADEMIC" }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. SUPERSEDED_POLICY (18 queries)
  // ──────────────────────────────────────────────────────────────────────────
  {
    category: "SUPERSEDED_POLICY",
    items: [
      { q: "Nghị định 81/2021/NĐ-CP về trần học phí đại học còn hiệu lực nguyên vẹn hay đã sửa đổi?", entity: "MOET_VN", aliases: ["nghị định 81", "nghị định 97"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Nghị định 97/2023/NĐ-CP đã lùi lộ trình tăng học phí đại học công lập như thế nào?", entity: "MOET_VN", aliases: ["nghị định 97", "học phí đại học"], domain: "chinhphu.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Thông tư 08/2022/TT-BGDĐT ban hành Quy chế tuyển sinh đại học có còn áp dụng cho năm 2026?", entity: "MOET_VN", aliases: ["thông tư 08", "quy chế tuyển sinh"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Quy chế đào tạo đại học theo Thông tư 47/2014 đã bị thay thế bởi Thông tư 08/2021 chưa?", entity: "MOET_VN", aliases: ["thông tư 08/2021", "quy chế đào tạo"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Nghị định 116/2020/NĐ-CP về hỗ trợ tiền đóng học phí cho sinh viên sư phạm có quy định bồi hoàn kinh phí không?", entity: "MOET_VN", aliases: ["nghị định 116", "sinh viên sư phạm"], domain: "chinhphu.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Quyết định số 157/2007/QĐ-TTg về tín dụng sinh viên đã được sửa đổi mức vay tối đa bao nhiêu?", entity: "VBSP", aliases: ["quyết định 157", "vay vốn sinh viên"], domain: "vbsp.org.vn", jurisdiction: "GOVERNMENT_BANKING" },
      { q: "Quy định cộng điểm ưu tiên khu vực trong tuyển sinh đại học chỉ có hiệu lực 2 năm đúng không?", entity: "MOET_VN", aliases: ["điểm ưu tiên", "ưu tiên khu vực"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Chính sách miễn giảm học phí cho con thương binh liệt sĩ quy định tại văn bản nào mới nhất?", entity: "MOLISA_VN", aliases: ["miễn giảm học phí", "chính sách ưu đãi"], domain: "molisa.gov.vn", jurisdiction: "GOVERNMENT_LABOR" },
      { q: "Thông tư 22/2019/TT-BGDĐT quy định về hội thi giáo viên dạy giỏi có áp dụng cho giảng viên đại học không?", entity: "MOET_VN", aliases: ["thông tư 22"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Quy định về chuẩn chức danh giảng viên đại học hạng III theo Thông tư 40/2020/TT-BGDĐT", entity: "MOET_VN", aliases: ["thông tư 40", "chức danh giảng viên"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Sinh viên có được xét miễn học phần tiếng Anh nếu chứng chỉ IELTS hết hạn 2 năm không?", entity: "HCMUT_VNUHCM", aliases: ["chuẩn tiếng anh", "ielts 2 năm"], domain: "hcmut.edu.vn", jurisdiction: "ACADEMIC_REGULATION" },
      { q: "Quy chế bảo lưu kết quả thi tốt nghiệp THPT qua các năm được quy định như thế nào?", entity: "MOET_VN", aliases: ["bảo lưu thpt", "thi tốt nghiệp"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Nghị quyết 35/NQ-CP năm 2019 về tăng cường huy động các nguồn lực cho giáo dục có cho phép tăng học phí tự do không?", entity: "GOV_VN", aliases: ["nghị quyết 35"], domain: "chinhphu.vn", jurisdiction: "GOVERNMENT_POLICY" },
      { q: "Quy định về thời gian đào tạo tối đa của sinh viên đại học hệ chính quy theo hệ thống tín chỉ", entity: "MOET_VN", aliases: ["thời gian tối đa", "đào tạo tín chỉ"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Thông tư liên tịch số 20/2014 về chế độ phụ cấp độc hại cho nhân viên phòng thí nghiệm trường học", entity: "MOET_VN", aliases: ["phụ cấp độc hại"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" },
      { q: "Quy định thi chuẩn đầu ra Tin học ứng dụng công nghệ thông tin cơ bản theo Thông tư 03/2014/TT-BTTTT", entity: "MIC_VN", aliases: ["thông tư 03", "tin học cơ bản"], domain: "mic.gov.vn", jurisdiction: "GOVERNMENT_MIC" },
      { q: "Chính sách trợ cấp xã hội cho sinh viên mồ côi cả cha lẫn mẹ theo Nghị định 20/2021/NĐ-CP", entity: "MOLISA_VN", aliases: ["nghị định 20", "trợ cấp xã hội"], domain: "molisa.gov.vn", jurisdiction: "GOVERNMENT_LABOR" },
      { q: "Quy chế đánh giá công nhận trường đại học đạt tiêu chuẩn chất lượng giáo dục theo Thông tư 12/2017", entity: "MOET_VN", aliases: ["thông tư 12", "kiểm định chất lượng"], domain: "moet.gov.vn", jurisdiction: "GOVERNMENT_EDUCATION" }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. SCAM_PHISHING (18 queries)
  // ──────────────────────────────────────────────────────────────────────────
  {
    category: "SCAM_PHISHING",
    items: [
      { q: "Nhận tin nhắn yêu cầu nộp 3 triệu phí giữ chỗ học bổng trao đổi Nhật Bản có phải lừa đảo?", entity: "NCSC_VN", aliases: ["học bổng nhật bản", "phí giữ chỗ"], domain: "tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Fanpage ĐH Bách khoa tuyển cộng tác viên dịch thuật tài liệu nhận 500k/trang yêu cầu nạp cọc", entity: "HCMUT_VNUHCM", aliases: ["cộng tác viên dịch thuật", "nạp cọc"], domain: "hcmut.edu.vn,tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Email từ đuôi @gmail.com mạo danh phòng đào tạo yêu cầu chuyển khoản học phí lại do lỗi hệ thống", entity: "HCMUTE", aliases: ["chuyển khoản học phí", "mạo danh phòng đào tạo"], domain: "hcmute.edu.vn,tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Cảnh báo trang web ký túc xá giả mạo thu tiền đặt cọc phòng trọ của tân sinh viên qua ví Momo", entity: "KTX_VNUHCM", aliases: ["lừa cọc phòng trọ", "web giả mạo"], domain: "ktxb.vnuhcm.edu.vn,tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Sinh viên nhận cuộc gọi tự xưng công an quận thông báo liên quan đường dây rửa tiền yêu cầu kê khai tài khoản", entity: "MPS_VN", aliases: ["cuộc gọi lừa đảo", "công an giả mạo"], domain: "bocongan.gov.vn,tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Hội nhóm sinh viên chia sẻ link tải phần mềm bẻ khóa SPSS dính mã độc đánh cắp mật khẩu Facebook", entity: "NCSC_VN", aliases: ["mã độc spss", "đánh cắp tài khoản"], domain: "tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "App chấm điểm thi đại học yêu cầu cấp quyền truy cập danh bạ và hình ảnh trên điện thoại", entity: "NCSC_VN", aliases: ["app lừa đảo", "quyền danh bạ"], domain: "tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Nhận thông báo trúng học bổng toàn phần du học Úc nhưng phải đóng 10 triệu lệ phí visa trước", entity: "NCSC_VN", aliases: ["học bổng úc lừa đảo", "lệ phí visa"], domain: "tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Dịch vụ làm bằng đại học chính quy có hồ sơ gốc tại trường thật giá 5 triệu đồng", entity: "MOET_VN", aliases: ["làm bằng giả", "hồ sơ gốc"], domain: "moet.gov.vn,bocongan.gov.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Dịch vụ nâng điểm thi đại học và sửa điểm tín chỉ trong hệ thống quản lý đào tạo", entity: "MOET_VN", aliases: ["nâng điểm tín chỉ", "sửa điểm portal"], domain: "moet.gov.vn,bocongan.gov.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Tuyển sinh viên tham gia khảo sát nhận 200k qua link rút gọn chứa trang đăng nhập Google giả", entity: "NCSC_VN", aliases: ["phishing google", "khảo sát 200k"], domain: "tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Nhắn tin Zalo tự xưng giảng viên hướng dẫn yêu cầu sinh viên chuyển 1 triệu tiền quà chấm luận văn", entity: "HCMUT_VNUHCM", aliases: ["mạo danh giảng viên", "tiền chấm luận văn"], domain: "hcmut.edu.vn,tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "SMS Brandname ngân hàng giả mạo gửi đường link lạ yêu cầu đăng nhập huỷ dịch vụ học phí tự động", entity: "NCSC_VN", aliases: ["sms brandname giả", "link lạ huỷ dịch vụ"], domain: "tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Cảnh báo trang web bình chọn cuộc thi Nét đẹp sinh viên yêu cầu quét mã QR đăng nhập Zalo", entity: "NCSC_VN", aliases: ["bình chọn thi ảnh", "quét qr hack zalo"], domain: "tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Học bổng trợ cấp khó khăn yêu cầu sinh viên gửi hình ảnh CCCD hai mặt và video quét gương mặt", entity: "NCSC_VN", aliases: ["lừa đảo cccd", "video quét mặt sinh trắc"], domain: "tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Cho vay tiền sinh viên bằng thế chấp tài khoản iCloud với lãi suất cắt cổ", entity: "MPS_VN", aliases: ["vay icloud", "tín dụng đen sinh viên"], domain: "bocongan.gov.vn,tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Tuyển người mẫu ảnh sinh viên chụp lookbook yêu cầu cởi đồ quay video phỏng vấn online", entity: "MPS_VN", aliases: ["tuyển mẫu ảnh lừa đảo", "tống tiền video"], domain: "bocongan.gov.vn,tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" },
      { q: "Thư điện tử thông báo trúng tuyển chương trình thực tập Google tại Singapore nhưng bắt nộp phí bảo lãnh", entity: "NCSC_VN", aliases: ["thực tập google giả", "phí bảo lãnh"], domain: "tinnhiemmang.vn", jurisdiction: "CYBER_FRAUD" }
    ]
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. ADVERSARIAL_SLANG_TYPO (18 queries)
  // ──────────────────────────────────────────────────────────────────────────
  {
    category: "ADVERSARIAL_SLANG_TYPO",
    items: [
      { q: "check giùm e cái mail trúng tuyển bk tphcm này real hay fake ạ mn", entity: "HCMUT_VNUHCM", aliases: ["bk tphcm", "bách khoa"], domain: "hcmut.edu.vn", jurisdiction: "SLANG_VERIFICATION" },
      { q: "học bổng này bảo nạp 5 củ giữ slot có legit k hay lừa đảo zậy", entity: "NCSC_VN", aliases: ["học bổng", "nạp củ giữ slot"], domain: "tinnhiemmang.vn", jurisdiction: "SLANG_VERIFICATION" },
      { q: "spkt có cho nợ chuẩn đầu ra toeic để nhận bằng k mn ơi", entity: "HCMUTE", aliases: ["spkt", "chuẩn toeic"], domain: "hcmute.edu.vn", jurisdiction: "SLANG_VERIFICATION" },
      { q: "bên kinh tế ueh học phí tín chỉ năm nay tăng bnhiu % v mn", entity: "UEH", aliases: ["ueh", "học phí tín chỉ"], domain: "ueh.edu.vn", jurisdiction: "SLANG_VERIFICATION" },
      { q: "nghe đồn uel sắp sáp nhập vào ueh có đúng k v mn", entity: "AMBIGUOUS_UEH_UEL", aliases: ["uel", "ueh", "sáp nhập"], domain: "ueh.edu.vn,uel.edu.vn", jurisdiction: "SLANG_VERIFICATION" },
      { q: "điểm rèn luyện dưới 50 có bị đình chỉ học tập ở hust k zậy", entity: "HUST", aliases: ["hust", "điểm rèn luyện"], domain: "hust.edu.vn", jurisdiction: "SLANG_VERIFICATION" },
      { q: "xin rv ktx khu b phòng dịch vụ 4 ng có máy lạnh giá bn ạ", entity: "KTX_VNUHCM", aliases: ["ktx khu b", "phòng dịch vụ 4 ng"], domain: "ktxb.vnuhcm.edu.vn", jurisdiction: "SLANG_VERIFICATION" },
      { q: "neu năm nay có xét học bạ k hay chỉ xét đgnl vs ielts v mn", entity: "NEU", aliases: ["neu", "xét học bạ"], domain: "neu.edu.vn", jurisdiction: "SLANG_VERIFICATION" },
      { q: "ftu cs2 có ktx riêng cho sv ngoại tỉnh k hay phải thuê trọ ngoài", entity: "FTU_CS2", aliases: ["ftu cs2", "ktx ftu"], domain: "cs2.ftu.edu.vn", jurisdiction: "SLANG_VERIFICATION" },
      { q: "e lỡ bấm vào link lạ trên fb giờ mất quyền admin page khoa thì làm s", entity: "NCSC_VN", aliases: ["mất page khoa", "link lạ fb"], domain: "tinnhiemmang.vn", jurisdiction: "SLANG_VERIFICATION" },
      { q: "trường dại hoc bach khoa tp hcm hoc phi nam 2026 (typo không dấu)", entity: "HCMUT_VNUHCM", aliases: ["hcmut", "đại học bách khoa"], domain: "hcmut.edu.vn", jurisdiction: "TYPO_NON_ACCENT" },
      { q: "truong dh su pham ky thuat tp hcm tuyen sinh 2026 nganh oto (typo)", entity: "HCMUTE", aliases: ["hcmute", "sư phạm kỹ thuật"], domain: "hcmute.edu.vn", jurisdiction: "TYPO_NON_ACCENT" },
      { q: "hoc vien buu chinh vien thong diem chuan 2026 khoi a00 (typo)", entity: "PTIT", aliases: ["ptit", "bưu chính viễn thông"], domain: "ptit.edu.vn", jurisdiction: "TYPO_NON_ACCENT" },
      { q: "dai hoc y duoc can tho co xet tuyen thang hs gioi quoc gia k (typo)", entity: "CTUMP", aliases: ["ctump", "y dược cần thơ"], domain: "ctump.edu.vn", jurisdiction: "TYPO_NON_ACCENT" },
      { q: "Học pнí Ɖại нọc Bácн Kнoa тp.нcм (ký tự teen code / homoglyphs)", entity: "HCMUT_VNUHCM", aliases: ["hcmut", "bách khoa tphcm"], domain: "hcmut.edu.vn", jurisdiction: "HOMOGLYPH_EVASION" },
      { q: "Tнông вáo тuyển ѕinн ƉH Kịnн тế тpнcм 2026 (teen code / homoglyphs)", entity: "UEH", aliases: ["ueh", "kinh tế tphcm"], domain: "ueh.edu.vn", jurisdiction: "HOMOGLYPH_EVASION" },
      { q: "cảnh вáo lừa đảo nạp тiền giữ ѕuấт нọc вổng (teen code / homoglyphs)", entity: "NCSC_VN", aliases: ["lừa đảo học bổng", "nạp tiền"], domain: "tinnhiemmang.vn", jurisdiction: "HOMOGLYPH_EVASION" },
      { q: "sinh viên có bắt buộc phải tham gia bảo hiểm y tế tại trường k ạ mn", entity: "MOET_VN", aliases: ["bảo hiểm y tế", "bhyt bắt buộc"], domain: "baohiemxahoi.gov.vn,moet.gov.vn", jurisdiction: "SLANG_VERIFICATION" }
    ]
  }
];

// Flatten all items and assign caseId
let count = 1;
const allQueries = [];

for (const cat of categories) {
  for (const item of cat.items) {
    const caseId = `RET-FRESH-${String(count++).padStart(4, "0")}`;
    const domains = item.domain.split(",").map(d => d.trim());
    
    allQueries.push({
      caseId,
      query: item.q,
      oodCategory: cat.category,
      canonicalEntity: item.entity,
      aliases: item.aliases,
      expectedJurisdiction: item.jurisdiction,
      relevantSourceTypes: ["OFFICIAL_PORTAL", "GOVERNMENT_CIRCULAR", "CYBER_BULLETIN"],
      knownOfficialDomains: domains,
      relevanceGrades: {
        EXACT_OFFICIAL: 3,
        OFFICIAL_RELATED: 2,
        REPUTABLE_NEWS: 1,
        UNVERIFIED: 0
      },
      freshnessRequirement: cat.category === "FRESH_2026_NOTICES" ? "YEAR_2026" : "CURRENT_ACTIVE",
      caseHash: crypto.createHash("sha256").update(`${caseId}-${item.q}-${item.entity}`).digest("hex")
    });
  }
}

const manifest = {
  benchmarkVersion: "2.0.0-fresh-holdout",
  benchmarkType: "UNTOUCHED_FRESH_HOLDOUT_EVALUATION",
  createdAt: new Date().toISOString(),
  totalQueries: allQueries.length,
  categoryCounts: categories.reduce((acc, cat) => {
    acc[cat.category] = cat.items.length;
    return acc;
  }, {}),
  datasetHash: crypto.createHash("sha256").update(JSON.stringify(allQueries)).digest("hex"),
  cases: allQueries
};

const targetPath = path.resolve("docs/evaluation/retrieval_fresh_holdout_dataset.json");
fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Generated Fresh Retrieval Holdout Dataset: ${allQueries.length} queries to ${targetPath}`);
console.log(`   SHA-256 Digest: ${manifest.datasetHash}`);
console.log(`   Category Breakdown:`, manifest.categoryCounts);
