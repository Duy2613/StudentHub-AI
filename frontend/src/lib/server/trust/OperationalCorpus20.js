/**
 * StudentHub AI — 20-Case Operational Corpus (Sections 74 & 75: Evidence G8 Reproducibility)
 *
 * Provides a locked 20-case operational corpus demonstrating complete pipeline readiness:
 * - Claim -> Query -> Retrieval -> Canonical URL -> Snapshot URI -> SHA-256 -> Forensics -> Verdict -> Passport
 * - Complete provenance: publisher, domain, canonicalUrl, retrievedAt, publishedAt, jurisdiction,
 *   license/allowed-use, snapshotUri, contentDigest SHA-256, parserVersion, PII state, independenceKey.
 *
 * NOTE: Demonstrates operational pipeline readiness ONLY; does not claim statistical AI accuracy.
 */

import { createHash } from "node:crypto";

function sha256(str) {
  return createHash("sha256").update(str, "utf8").digest("hex");
}

export const OPERATIONAL_CORPUS_20 = [
  // ── 1. Scholarship Deposit Scam ─────────────────────────────────────────────
  {
    caseId: "CORPUS-001",
    title: "Mạo danh học bổng khuyến khích học tập yêu cầu đóng phí giữ chỗ",
    domain: "STUDENT_FINANCIAL_FRAUD",
    input: {
      type: "text",
      content: "Chúc mừng sinh viên nhận học bổng tài trợ 100% học phí kỳ 1 2026-2027. Vui lòng chuyển phí bảo lãnh hồ sơ 1.500.000 VNĐ vào STK cá nhân 1029384756 trong 24h để nhận quyết định.",
    },
    claims: [
      { claimId: "c1-1", text: "Sinh viên được cấp học bổng 100% học phí", type: "SCHOLARSHIP_BENEFIT" },
      { claimId: "c1-2", text: "Yêu cầu chuyển phí 1.500.000 VNĐ vào tài khoản cá nhân", type: "PAYMENT_REQUIREMENT" },
    ],
    retrieval: {
      query: "quy chế xét cấp học bổng khuyến khích học tập lệ phí",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-001",
    },
    sources: [
      {
        sourceId: "src-corp-001",
        publisher: "Trường Đại học Sư phạm Kỹ thuật TP.HCM",
        domain: "hcmute.edu.vn",
        canonicalUrl: "https://hcmute.edu.vn/hoc-bong/quy-che-khuyen-khich-hoc-tap",
        publishedAt: "2026-01-15T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/01/hcmute_hocbong_001.html",
        contentDigest: sha256("Nhà trường cấp học bổng khuyến khích học tập trực tiếp, hoàn toàn không thu bất kỳ khoản phí hồ sơ nào."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:hcmute.edu.vn",
        relevantSnippet: "Nhà trường cấp học bổng khuyến khích học tập trực tiếp, hoàn toàn không thu bất kỳ khoản phí hồ sơ nào.",
      },
    ],
    relations: [{ claimId: "c1-2", sourceId: "src-corp-001", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },

  // ── 2. Tuition Fee Account Alteration Scam ───────────────────────────────────
  {
    caseId: "CORPUS-002",
    title: "Thông báo nộp học phí qua tài khoản ngân hàng lạ",
    domain: "STUDENT_FINANCIAL_FRAUD",
    input: {
      type: "text",
      content: "Nhà trường thay đổi tài khoản nộp học phí kỳ 1. Đề nghị sinh viên chuyển tiền vào số tài khoản 987654321 ngân hàng TMCP Ngoại thương tên chủ TK NGUYEN VAN A.",
    },
    claims: [
      { claimId: "c2-1", text: "Trường đổi tài khoản nộp học phí sang STK cá nhân", type: "PAYMENT_REQUIREMENT" },
    ],
    retrieval: {
      query: "tài khoản thu học phí chính thức trường đại học sư phạm kỹ thuật",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-002",
    },
    sources: [
      {
        sourceId: "src-corp-002",
        publisher: "Phòng Kế hoạch Tài chính HCMUTE",
        domain: "hcmute.edu.vn",
        canonicalUrl: "https://hcmute.edu.vn/thong-bao-hoc-phi/tai-khoan-chinh-thuc",
        publishedAt: "2026-02-01T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/02/hcmute_hocphi_002.html",
        contentDigest: sha256("Nhà trường chỉ thu học phí qua cổng thanh toán sinh viên hoặc tài khoản định danh đứng tên Trường Đại học Sư phạm Kỹ thuật TP.HCM."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:hcmute.edu.vn",
        relevantSnippet: "Nhà trường chỉ thu học phí qua cổng thanh toán sinh viên hoặc tài khoản định danh đứng tên Trường Đại học Sư phạm Kỹ thuật TP.HCM.",
      },
    ],
    relations: [{ claimId: "c2-1", sourceId: "src-corp-002", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },

  // ── 3. Fake TOEIC Standard ──────────────────────────────────────────────────
  {
    caseId: "CORPUS-003",
    title: "Tin đồn hạ chuẩn ngoại ngữ tốt nghiệp TOEIC xuống 350",
    domain: "ACADEMIC_REGULATION",
    input: {
      type: "text",
      content: "Phòng Đào tạo thông báo giảm chuẩn ngoại ngữ ra trường năm 2026 cho toàn bộ sinh viên khối kỹ thuật xuống TOEIC 350.",
    },
    claims: [
      { claimId: "c3-1", text: "Chuẩn ngoại ngữ tốt nghiệp giảm xuống TOEIC 350", type: "ACADEMIC_RULE" },
    ],
    retrieval: {
      query: "quy định chuẩn đầu ra ngoại ngữ tốt nghiệp",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-003",
    },
    sources: [
      {
        sourceId: "src-corp-003",
        publisher: "Phòng Đào tạo HCMUTE",
        domain: "daotao.hcmute.edu.vn",
        canonicalUrl: "https://daotao.hcmute.edu.vn/chuan-dau-ra-ngoai-ngu",
        publishedAt: "2025-10-10T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2025/10/daotao_toeic_003.html",
        contentDigest: sha256("Chuẩn đầu ra ngoại ngữ trình độ đại học chính quy là chứng chỉ TOEIC tối thiểu 550 điểm."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:daotao.hcmute.edu.vn",
        relevantSnippet: "Chuẩn đầu ra ngoại ngữ trình độ đại học chính quy là chứng chỉ TOEIC tối thiểu 550 điểm.",
      },
    ],
    relations: [{ claimId: "c3-1", sourceId: "src-corp-003", relation: "CONTRADICTS" }],
    expectedVerdict: "CONTRADICTED",
  },

  // ── 4. Part-Time Recruitment Fee ───────────────────────────────────────────
  {
    caseId: "CORPUS-004",
    title: "Tuyển dụng trợ giảng trong trường yêu cầu nộp cọc hồ sơ",
    domain: "STUDENT_FINANCIAL_FRAUD",
    input: {
      type: "text",
      content: "Tuyển trợ giảng văn phòng khoa hỗ trợ nhập liệu, lương 5 triệu/tháng. Ứng viên nộp 300k tiền đồng phục và thẻ nhân viên qua ví điện tử.",
    },
    claims: [{ claimId: "c4-1", text: "Yêu cầu nộp 300k tiền cọc thẻ nhân viên", type: "PAYMENT_REQUIREMENT" }],
    retrieval: {
      query: "tuyển dụng sinh viên trợ giảng hỗ trợ học vụ thu phí",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-004",
    },
    sources: [
      {
        sourceId: "src-corp-004",
        publisher: "Trung tâm Hỗ trợ Sinh viên",
        domain: "hcmute.edu.vn",
        canonicalUrl: "https://hcmute.edu.vn/viec-lam/canh-bao-tuyen-dung-thu-phi",
        publishedAt: "2026-03-01T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/03/hcmute_tuyendung_004.html",
        contentDigest: sha256("Cảnh báo: Tất cả vị trí việc làm hỗ trợ sinh viên tại trường tuyệt đối không thu bất kỳ khoản phí nào."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:hcmute.edu.vn",
        relevantSnippet: "Tất cả vị trí việc làm hỗ trợ sinh viên tại trường tuyệt đối không thu bất kỳ khoản phí nào.",
      },
    ],
    relations: [{ claimId: "c4-1", sourceId: "src-corp-004", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },

  // ── 5. Coercive Disciplinary Notice ─────────────────────────────────────────
  {
    caseId: "CORPUS-005",
    title: "Tin nhắn dọa đình chỉ học tập nếu không thanh toán tiền phạt trong 2 giờ",
    domain: "SOCIAL_ENGINEERING",
    input: {
      type: "text",
      content: "Hội đồng kỷ luật khẩn cấp thông báo bạn bị đình chỉ học tập vì vi phạm nội quy. Nộp phạt khẩn 2 triệu trong 2h để hủy quyết định.",
    },
    claims: [{ claimId: "c5-1", text: "Hội đồng kỷ luật phạt tiền để hủy đình chỉ", type: "COERCIVE_THREAT" }],
    retrieval: {
      query: "quy trình xử lý kỷ luật sinh viên hcmute nộp phạt tiền",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-005",
    },
    sources: [
      {
        sourceId: "src-corp-005",
        publisher: "Phòng Công tác Sinh viên HCMUTE",
        domain: "ctsv.hcmute.edu.vn",
        canonicalUrl: "https://ctsv.hcmute.edu.vn/quy-che-cong-tac-sinh-vien",
        publishedAt: "2025-09-01T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2025/09/ctsv_quyche_005.html",
        contentDigest: sha256("Quy trình xem xét kỷ luật sinh viên tuân thủ hội đồng chính thức, không bao giờ có hình thức nộp phạt tiền hủy quyết định."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:ctsv.hcmute.edu.vn",
        relevantSnippet: "Quy trình xem xét kỷ luật sinh viên tuân thủ hội đồng chính thức, không bao giờ có hình thức nộp phạt tiền hủy quyết định.",
      },
    ],
    relations: [{ claimId: "c5-1", sourceId: "src-corp-005", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },

  // ── 6. Dormitory Fake Booking ───────────────────────────────────────────────
  {
    caseId: "CORPUS-006",
    title: "Mạo danh ban quản lý KTX yêu cầu đặt cọc giữ phòng qua Zalo",
    domain: "STUDENT_FINANCIAL_FRAUD",
    input: {
      type: "text",
      content: "KTX còn 3 phòng máy lạnh sinh viên mới. Chuyển cọc 1 triệu qua ZaloPay để giữ chỗ trước ngày 15/9.",
    },
    claims: [{ claimId: "c6-1", text: "Ban quản lý KTX nhận cọc giữ phòng qua ZaloPay", type: "PAYMENT_REQUIREMENT" }],
    retrieval: {
      query: "thông báo đăng ký ký túc xá đặt cọc",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-006",
    },
    sources: [
      {
        sourceId: "src-corp-006",
        publisher: "Ban Quản lý KTX HCMUTE",
        domain: "hcmute.edu.vn",
        canonicalUrl: "https://hcmute.edu.vn/ktx/dang-ky-noi-tru",
        publishedAt: "2026-08-01T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/08/ktx_dangky_006.html",
        contentDigest: sha256("Đăng ký KTX chỉ thực hiện trên cổng thông tin nội bộ của trường, không nhận cọc qua mạng xã hội."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:hcmute.edu.vn",
        relevantSnippet: "Đăng ký KTX chỉ thực hiện trên cổng thông tin nội bộ của trường, không nhận cọc qua mạng xã hội.",
      },
    ],
    relations: [{ claimId: "c6-1", sourceId: "src-corp-006", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },

  // ── 7. International Exchange Guarantee Scam ────────────────────────────────
  {
    caseId: "CORPUS-007",
    title: "Học bổng trao đổi Nhật Bản yêu cầu chuyển khoản bảo lãnh visa",
    domain: "STUDENT_FINANCIAL_FRAUD",
    input: {
      type: "text",
      content: "Chương trình trao đổi sinh viên sang ĐH Tokyo đài thọ 100%. Sinh viên ứng tuyển cần chuyển 10 triệu đồng lệ phí bảo lãnh visa vào STK cá nhân.",
    },
    claims: [{ claimId: "c7-1", text: "Chương trình trao đổi yêu cầu nộp 10 triệu bảo lãnh vào STK cá nhân", type: "PAYMENT_REQUIREMENT" }],
    retrieval: {
      query: "thông tin trao đổi quốc tế đại học nhật bản lệ phí bảo lãnh visa",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-007",
    },
    sources: [
      {
        sourceId: "src-corp-007",
        publisher: "Phòng Quan hệ Quốc tế HCMUTE",
        domain: "hcmute.edu.vn",
        canonicalUrl: "https://hcmute.edu.vn/quan-he-quoc-te/chuong-trinh-trao-doi",
        publishedAt: "2026-02-15T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/02/qhqt_traodoi_007.html",
        contentDigest: sha256("Mọi thủ tục visa được hướng dẫn qua Đại sứ quán, không bao giờ yêu cầu chuyển tiền bảo lãnh vào tài khoản cá nhân."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:hcmute.edu.vn",
        relevantSnippet: "Mọi thủ tục visa được hướng dẫn qua Đại sứ quán, không bao giờ yêu cầu chuyển tiền bảo lãnh vào tài khoản cá nhân.",
      },
    ],
    relations: [{ claimId: "c7-1", sourceId: "src-corp-007", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },

  // ── 8. Student Loan Emergency Grant Scam ────────────────────────────────────
  {
    caseId: "CORPUS-008",
    title: "Gói vay vốn sinh viên lãi suất 0% yêu cầu chuyển trước phí giải ngân",
    domain: "STUDENT_FINANCIAL_FRAUD",
    input: {
      type: "text",
      content: "Quỹ hỗ trợ sinh viên khó khăn cho vay 30 triệu không lãi suất. Cần đóng phí bảo hiểm khoản vay 1.200.000 VNĐ trước khi giải ngân.",
    },
    claims: [{ claimId: "c8-1", text: "Gói vay sinh viên thu trước phí bảo hiểm 1.200.000 VNĐ", type: "PAYMENT_REQUIREMENT" }],
    retrieval: {
      query: "chính sách tín dụng sinh viên ngân hàng chính sách xã hội phí bảo hiểm",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-008",
    },
    sources: [
      {
        sourceId: "src-corp-008",
        publisher: "Ngân hàng Chính sách Xã hội Việt Nam",
        domain: "vbsp.org.vn",
        canonicalUrl: "https://vbsp.org.vn/chinh-sach-tin-dung-hoc-sinh-sinh-vien",
        publishedAt: "2025-08-20T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_PUBLIC_BANKING",
        licenseAllowedUse: "PUBLIC_LEGAL_POLICY_CITABLE",
        snapshotUri: "storage://trust-snapshots/2025/08/vbsp_tindung_008.html",
        contentDigest: sha256("Vay vốn sinh viên chính sách không thu bất kỳ khoản phí trước nào. Cảnh báo các thủ đoạn thu phí giải ngân."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:vbsp.org.vn",
        relevantSnippet: "Vay vốn sinh viên chính sách không thu bất kỳ khoản phí trước nào.",
      },
    ],
    relations: [{ claimId: "c8-1", sourceId: "src-corp-008", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },

  // ── 9. Course Registration Slot Sale ─────────────────────────────────────────
  {
    caseId: "CORPUS-009",
    title: "Dịch vụ can thiệp hệ thống bán suất đăng ký môn học ưu tiên",
    domain: "ACADEMIC_INTEGRITY",
    input: {
      type: "text",
      content: "Nhận can thiệp hệ thống online đk môn học HCMUTE, cam kết có slot lớp thầy cô hot. Phí 500k/môn.",
    },
    claims: [{ claimId: "c9-1", text: "Can thiệp hệ thống bán suất đăng ký môn học", type: "SYSTEM_TAMPERING" }],
    retrieval: {
      query: "can thiệp đăng ký môn học xử lý kỷ luật sinh viên hcmute",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-009",
    },
    sources: [
      {
        sourceId: "src-corp-009",
        publisher: "Phòng Đào tạo HCMUTE",
        domain: "daotao.hcmute.edu.vn",
        canonicalUrl: "https://daotao.hcmute.edu.vn/canh-bao-mua-ban-slot-mon-hoc",
        publishedAt: "2026-01-05T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/01/daotao_slot_009.html",
        contentDigest: sha256("Nghiêm cấm mọi hành vi mua bán slot, can thiệp trái phép cổng đăng ký môn học. Vi phạm sẽ bị xử lý kỷ luật buộc thôi học."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:daotao.hcmute.edu.vn",
        relevantSnippet: "Nghiêm cấm mọi hành vi mua bán slot, can thiệp trái phép cổng đăng ký môn học.",
      },
    ],
    relations: [{ claimId: "c9-1", sourceId: "src-corp-009", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },

  // ── 10. Thesis Defense Fast-Track Solicitation ───────────────────────────────
  {
    caseId: "CORPUS-010",
    title: "Dịch vụ chạy điểm bảo vệ đồ án tốt nghiệp",
    domain: "ACADEMIC_INTEGRITY",
    input: {
      type: "text",
      content: "Nhận lo trọn gói điểm A hội đồng bảo vệ khóa luận tốt nghiệp khoa CNTT, cam kết bảo mật 100%.",
    },
    claims: [{ claimId: "c10-1", text: "Can thiệp điểm hội đồng bảo vệ khóa luận", type: "ACADEMIC_FRAUD" }],
    retrieval: {
      query: "quy chế đánh giá khóa luận tốt nghiệp xử lý gian lận",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-010",
    },
    sources: [
      {
        sourceId: "src-corp-010",
        publisher: "Trường Đại học Sư phạm Kỹ thuật TP.HCM",
        domain: "hcmute.edu.vn",
        canonicalUrl: "https://hcmute.edu.vn/quy-che-dao-tao-dai-hoc",
        publishedAt: "2025-06-15T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2025/06/hcmute_quyche_010.html",
        contentDigest: sha256("Quy chế đánh giá đồ án tốt nghiệp công khai minh bạch qua hội đồng chuyên môn. Mọi hành vi gian lận bị hủy kết quả và xem xét truy cứu trách nhiệm."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:hcmute.edu.vn",
        relevantSnippet: "Quy chế đánh giá đồ án tốt nghiệp công khai minh bạch qua hội đồng chuyên môn.",
      },
    ],
    relations: [{ claimId: "c10-1", sourceId: "src-corp-010", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },

  // ── 11. Legitimate Official Scholarship Notice (True Negative) ───────────────
  {
    caseId: "CORPUS-011",
    title: "Thông báo xét cấp học bổng khuyến khích học tập học kỳ 2 năm học 2025-2026",
    domain: "ACADEMIC_REGULATION",
    input: {
      type: "text",
      content: "Trường ĐH Sư phạm Kỹ thuật TP.HCM thông báo danh sách sinh viên dự kiến nhận học bổng khuyến khích học kỳ 2. Sinh viên đối chiếu điểm rèn luyện tại ctsv.hcmute.edu.vn.",
    },
    claims: [
      { claimId: "c11-1", text: "Trường công bố danh sách dự kiến học bổng khuyến khích học kỳ 2", type: "SCHOLARSHIP_BENEFIT" },
    ],
    retrieval: {
      query: "thông báo danh sách học bổng khuyến khích học tập học kỳ 2 ctsv",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-011",
    },
    sources: [
      {
        sourceId: "src-corp-011",
        publisher: "Phòng Công tác Sinh viên HCMUTE",
        domain: "ctsv.hcmute.edu.vn",
        canonicalUrl: "https://ctsv.hcmute.edu.vn/thong-bao-hoc-bong-hk2",
        publishedAt: "2026-03-01T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/03/ctsv_hocbong_011.html",
        contentDigest: sha256("Thông báo danh sách sinh viên dự kiến nhận học bổng khuyến khích học tập học kỳ 2 năm học 2025-2026."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:ctsv.hcmute.edu.vn",
        relevantSnippet: "Thông báo danh sách sinh viên dự kiến nhận học bổng khuyến khích học tập học kỳ 2 năm học 2025-2026.",
      },
    ],
    relations: [{ claimId: "c11-1", sourceId: "src-corp-011", relation: "SUPPORTS" }],
    expectedVerdict: "SUPPORTED",
  },

  // ── 12. Legitimate Tuition Payment Guide (True Negative) ─────────────────────
  {
    caseId: "CORPUS-012",
    title: "Hướng dẫn nộp học phí học kỳ 1 qua ứng dụng ngân hàng liên kết",
    domain: "ACADEMIC_REGULATION",
    input: {
      type: "text",
      content: "Hướng dẫn sinh viên đóng học phí học kỳ 1 bằng cách tra cứu mã sinh viên trên ứng dụng Vietcombank Digibank hoặc VCB iB@nking theo mã định danh của trường.",
    },
    claims: [{ claimId: "c12-1", text: "Nộp học phí bằng mã SV qua Vietcombank Digibank", type: "TUITION_POLICY" }],
    retrieval: {
      query: "hướng dẫn nộp học phí vietcombank mã định danh sinh viên",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-012",
    },
    sources: [
      {
        sourceId: "src-corp-012",
        publisher: "Phòng Kế hoạch Tài chính HCMUTE",
        domain: "hcmute.edu.vn",
        canonicalUrl: "https://hcmute.edu.vn/huong-dan-nop-hoc-phi",
        publishedAt: "2026-01-10T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/01/khtc_hocphi_012.html",
        contentDigest: sha256("Sinh viên thanh toán học phí qua tính năng Thanh toán học phí trên VCB Digibank bằng Mã sinh viên."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:hcmute.edu.vn",
        relevantSnippet: "Sinh viên thanh toán học phí qua tính năng Thanh toán học phí trên VCB Digibank bằng Mã sinh viên.",
      },
    ],
    relations: [{ claimId: "c12-1", sourceId: "src-corp-012", relation: "SUPPORTS" }],
    expectedVerdict: "SUPPORTED",
  },

  // ── 13. Legitimate Course Registration Notice (True Negative) ─────────────────
  {
    caseId: "CORPUS-013",
    title: "Lịch đăng ký môn học học kỳ 1 năm học 2026-2027",
    domain: "ACADEMIC_REGULATION",
    input: {
      type: "text",
      content: "Phòng Đào tạo thông báo thời gian đăng ký môn học đợt 1 dành cho sinh viên khóa 2023 từ 8h00 ngày 20/07/2026 trên portal online.hcmute.edu.vn.",
    },
    claims: [{ claimId: "c13-1", text: "Đăng ký môn học khóa 2023 mở ngày 20/07/2026 trên portal", type: "ACADEMIC_RULE" }],
    retrieval: {
      query: "kế hoạch đăng ký môn học học kỳ 1 năm học 2026 phòng đào tạo",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-013",
    },
    sources: [
      {
        sourceId: "src-corp-013",
        publisher: "Phòng Đào tạo HCMUTE",
        domain: "daotao.hcmute.edu.vn",
        canonicalUrl: "https://daotao.hcmute.edu.vn/ke-hoach-dang-ky-mon-hoc",
        publishedAt: "2026-07-01T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/07/daotao_dangky_013.html",
        contentDigest: sha256("Kế hoạch đăng ký môn học học kỳ 1 năm học 2026-2027 trên portal chính thức."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:daotao.hcmute.edu.vn",
        relevantSnippet: "Kế hoạch đăng ký môn học học kỳ 1 năm học 2026-2027 trên portal chính thức.",
      },
    ],
    relations: [{ claimId: "c13-1", sourceId: "src-corp-013", relation: "SUPPORTS" }],
    expectedVerdict: "SUPPORTED",
  },

  // ── 14. Legitimate Student Bus Pass Subsidy (True Negative) ────────────────────
  {
    caseId: "CORPUS-014",
    title: "Chính sách trợ giá vé xe buýt sinh viên TP.HCM",
    domain: "ACADEMIC_REGULATION",
    input: {
      type: "text",
      content: "Sinh viên các trường đại học tại TP.HCM được hưởng trợ giá vé xe buýt 3.000 đồng/lượt khi xuất trình thẻ sinh viên hợp lệ.",
    },
    claims: [{ claimId: "c14-1", text: "Giá vé xe buýt sinh viên trợ giá 3.000 đồng/lượt", type: "FACTUAL_STATEMENT" }],
    retrieval: {
      query: "giá vé xe buýt trợ giá học sinh sinh viên tphcm",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-014",
    },
    sources: [
      {
        sourceId: "src-corp-014",
        publisher: "Trung tâm Quản lý Giao thông công cộng TP.HCM",
        domain: "buyttphcm.com.vn",
        canonicalUrl: "https://buyttphcm.com.vn/chinh-sach-ve-xe-buyt",
        publishedAt: "2025-01-01T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_MUNICIPAL_TRANSPORT",
        licenseAllowedUse: "PUBLIC_GOVERNMENT_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2025/01/buyt_trogia_014.html",
        contentDigest: sha256("Giá vé xe buýt có trợ giá dành cho học sinh, sinh viên là 3.000 đồng/lượt."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:buyttphcm.com.vn",
        relevantSnippet: "Giá vé xe buýt có trợ giá dành cho học sinh, sinh viên là 3.000 đồng/lượt.",
      },
    ],
    relations: [{ claimId: "c14-1", sourceId: "src-corp-014", relation: "SUPPORTS" }],
    expectedVerdict: "SUPPORTED",
  },

  // ── 15. Legitimate Graduation Ceremony Schedule (True Negative) ───────────────
  {
    caseId: "CORPUS-015",
    title: "Kế hoạch tổ chức Lễ tốt nghiệp đợt tháng 9/2026",
    domain: "ACADEMIC_REGULATION",
    input: {
      type: "text",
      content: "Trường tổ chức Lễ trao bằng tốt nghiệp đợt tháng 9/2026 tại Hội trường Lớn vào hai ngày 25 và 26/09/2026.",
    },
    claims: [{ claimId: "c15-1", text: "Lễ trao bằng tốt nghiệp tổ chức ngày 25-26/09/2026", type: "ACADEMIC_EVENT" }],
    retrieval: {
      query: "kế hoạch lễ tốt nghiệp đợt tháng 9 năm 2026 hội trường lớn",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-015",
    },
    sources: [
      {
        sourceId: "src-corp-015",
        publisher: "Phòng Đào tạo HCMUTE",
        domain: "daotao.hcmute.edu.vn",
        canonicalUrl: "https://daotao.hcmute.edu.vn/ke-hoach-le-tot-nghiep",
        publishedAt: "2026-08-20T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/08/daotao_totnghiep_015.html",
        contentDigest: sha256("Lễ trao bằng tốt nghiệp đợt tháng 9/2026 diễn ra vào ngày 25 và 26/09/2026 tại Hội trường Lớn."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:daotao.hcmute.edu.vn",
        relevantSnippet: "Lễ trao bằng tốt nghiệp đợt tháng 9/2026 diễn ra vào ngày 25 và 26/09/2026.",
      },
    ],
    relations: [{ claimId: "c15-1", sourceId: "src-corp-015", relation: "SUPPORTS" }],
    expectedVerdict: "SUPPORTED",
  },

  // ── 16. Unofficial Forum Rumor (Insufficient Evidence) ────────────────────────
  {
    caseId: "CORPUS-016",
    title: "Tin đồn trường mở thêm cơ sở đào tạo mới tại Đà Lạt",
    domain: "ACADEMIC_REGULATION",
    input: {
      type: "text",
      content: "Nghe nói trường mình chuẩn bị khánh thành phân hiệu mới trên Đà Lạt vào cuối năm nay.",
    },
    claims: [{ claimId: "c16-1", text: "Trường mở phân hiệu mới tại Đà Lạt cuối năm", type: "FACTUAL_STATEMENT" }],
    retrieval: {
      query: "thành lập phân hiệu mới đà lạt đại học sư phạm kỹ thuật tphcm",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-016",
    },
    sources: [], // No official sources found
    relations: [],
    expectedVerdict: "INSUFFICIENT_EVIDENCE",
  },

  // ── 17. Conflicting Department Notices (Conflicted Evidence) ─────────────────
  {
    caseId: "CORPUS-017",
    title: "Mâu thuẫn hạn nộp chứng chỉ tin học xét tốt nghiệp giữa khoa và phòng đào tạo",
    domain: "ACADEMIC_REGULATION",
    input: {
      type: "text",
      content: "Khoa thông báo hạn nộp chứng chỉ tin học là ngày 15/08, nhưng trang web trường ghi hạn là 30/08.",
    },
    claims: [{ claimId: "c17-1", text: "Hạn chót nộp chứng chỉ tin học đợt tốt nghiệp", type: "ACADEMIC_DEADLINE" }],
    retrieval: {
      query: "hạn nộp chứng chỉ tin học tốt nghiệp đợt 2",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-017",
    },
    sources: [
      {
        sourceId: "src-corp-017a",
        publisher: "Khoa CNTT",
        domain: "fit.hcmute.edu.vn",
        canonicalUrl: "https://fit.hcmute.edu.vn/han-nop-chung-chi",
        publishedAt: "2026-07-20T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/07/fit_chungchi_017a.html",
        contentDigest: sha256("Hạn nộp chứng chỉ tin học cấp khoa: 15/08."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:fit.hcmute.edu.vn",
        relevantSnippet: "Hạn nộp chứng chỉ tin học cấp khoa: 15/08.",
      },
      {
        sourceId: "src-corp-017b",
        publisher: "Phòng Đào tạo HCMUTE",
        domain: "daotao.hcmute.edu.vn",
        canonicalUrl: "https://daotao.hcmute.edu.vn/han-chot-tot-nghiep",
        publishedAt: "2026-07-25T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/07/daotao_totnghiep_017b.html",
        contentDigest: sha256("Hạn chót tiếp nhận hồ sơ xét tốt nghiệp toàn trường: 30/08."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:daotao.hcmute.edu.vn",
        relevantSnippet: "Hạn chót tiếp nhận hồ sơ xét tốt nghiệp toàn trường: 30/08.",
      },
    ],
    relations: [
      { claimId: "c17-1", sourceId: "src-corp-017a", relation: "SUPPORTS" },
      { claimId: "c17-1", sourceId: "src-corp-017b", relation: "CONTRADICTS" },
    ],
    expectedVerdict: "CONFLICTED_EVIDENCE",
  },

  // ── 18. Expired Previous Regulation (Stale Evidence) ─────────────────────────
  {
    caseId: "CORPUS-018",
    title: "Áp dụng biểu phí ký túc xá năm 2022 cho sinh viên năm 2026",
    domain: "ACADEMIC_REGULATION",
    input: {
      type: "text",
      content: "Mức giá tiền phòng KTX sinh viên năm nay vẫn giữ nguyên 250k/tháng theo thông báo số 12/2022.",
    },
    claims: [{ claimId: "c18-1", text: "Giá phòng KTX áp dụng theo văn bản năm 2022", type: "FINANCIAL_POLICY" }],
    retrieval: {
      query: "biểu giá tiền phòng ký túc xá năm học 2026-2027",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-018",
    },
    sources: [
      {
        sourceId: "src-corp-018",
        publisher: "Ban Quản lý KTX HCMUTE",
        domain: "hcmute.edu.vn",
        canonicalUrl: "https://hcmute.edu.vn/ktx/bieu-phi-2022",
        publishedAt: "2022-09-01T08:00:00Z", // STALE
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2022/09/ktx_2022_018.html",
        contentDigest: sha256("Biểu phí nội trú ký túc xá năm học 2022-2023 là 250.000 đồng/tháng."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:hcmute.edu.vn",
        relevantSnippet: "Biểu phí nội trú ký túc xá năm học 2022-2023.",
      },
    ],
    relations: [{ claimId: "c18-1", sourceId: "src-corp-018", relation: "CONTEXTUALIZES" }],
    expectedVerdict: "INSUFFICIENT_EVIDENCE",
  },

  // ── 19. Phishing QR Code Screenshot ──────────────────────────────────────────
  {
    caseId: "CORPUS-019",
    title: "Ảnh chụp màn hình thông báo học vụ chứa mã QR liên kết ngân hàng giả",
    domain: "STUDENT_FINANCIAL_FRAUD",
    input: {
      type: "image",
      content: "https://fake-hcmute-portal.xyz/qr-phishing.jpg",
      metadata: { qrContent: "https://fake-banking-login.tk/auth" },
    },
    claims: [{ claimId: "c19-1", text: "Mã QR chuyển hướng đến cổng thanh toán trường", type: "PAYMENT_REQUIREMENT" }],
    retrieval: {
      query: "cổng thanh toán mã qr chính thức hcmute",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-019",
    },
    sources: [
      {
        sourceId: "src-corp-019",
        publisher: "Cổng thanh toán điện tử HCMUTE",
        domain: "online.hcmute.edu.vn",
        canonicalUrl: "https://online.hcmute.edu.vn/huong-dan-qr",
        publishedAt: "2026-01-01T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/01/online_qr_019.html",
        contentDigest: sha256("Mã QR chính thức của trường chỉ hiển thị trên domain *.hcmute.edu.vn."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:online.hcmute.edu.vn",
        relevantSnippet: "Mã QR chính thức của trường chỉ hiển thị trên domain *.hcmute.edu.vn.",
      },
    ],
    relations: [{ claimId: "c19-1", sourceId: "src-corp-019", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },

  // ── 20. Lookalike University Portal Phishing Domain ──────────────────────────
  {
    caseId: "CORPUS-020",
    title: "Tên miền giả mạo phòng đào tạo hcmute-daotao.xyz yêu cầu đăng nhập",
    domain: "DOMAIN_SPOOFING",
    input: {
      type: "url",
      content: "https://hcmute-daotao.xyz/login?session=student",
    },
    claims: [{ claimId: "c20-1", text: "Trang web là cổng thông tin đào tạo của trường", type: "SOURCE_AUTHENTICITY" }],
    retrieval: {
      query: "danh mục tên miền chính thức trường đại học sư phạm kỹ thuật",
      retrievalMethod: "VERIFIED_KNOWLEDGE_STORE",
      retrievalQueryId: "qry-corp-020",
    },
    sources: [
      {
        sourceId: "src-corp-020",
        publisher: "Trung tâm Tin học HCMUTE",
        domain: "hcmute.edu.vn",
        canonicalUrl: "https://hcmute.edu.vn/danh-ba-ten-mien-chinh-thuc",
        publishedAt: "2026-01-01T08:00:00Z",
        retrievedAt: "2026-09-09T08:00:00Z",
        jurisdiction: "VN_HIGHER_EDUCATION",
        licenseAllowedUse: "PUBLIC_ACADEMIC_NOTICE_CITABLE",
        snapshotUri: "storage://trust-snapshots/2026/01/hcmute_domains_020.html",
        contentDigest: sha256("Tất cả các hệ thống đào tạo chính thức của trường chỉ sử dụng tên miền có đuôi .hcmute.edu.vn."),
        parserVersion: "HTML_PARSER_V5.1",
        piiClassification: "NO_PII_PUBLIC",
        independenceKey: "origin:hcmute.edu.vn",
        relevantSnippet: "Tất cả các hệ thống đào tạo chính thức của trường chỉ sử dụng tên miền có đuôi .hcmute.edu.vn.",
      },
    ],
    relations: [{ claimId: "c20-1", sourceId: "src-corp-020", relation: "CONTRADICTS" }],
    expectedVerdict: "HIGH_RISK",
  },
];
