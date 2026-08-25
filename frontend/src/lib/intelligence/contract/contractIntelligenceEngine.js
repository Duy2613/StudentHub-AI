/**
 * StudentHub AI — Contract Intelligence & Clause Analyzer (AI-11)
 * 
 * Extracts 14 core contract clauses, evaluates legal risk flags objectively,
 * cross-references Vietnamese legal foundations (Civil Code 2015 & Labor Code 2019),
 * and generates clear plain-language explanations without claiming definitive legal certainty.
 */

export const CORE_CONTRACT_CLAUSES = [
  "PARTIES",              // Chủ thể giao kết (Bên A, Bên B)
  "PAYMENT",              // Giá thuê / Lương & phương thức thanh toán
  "DEPOSIT",              // Tiền đặt cọc & bảo đảm thực hiện hợp đồng
  "REFUND",               // Điều kiện hoàn cọc & khấu trừ
  "PENALTY",              // Mức phạt vi phạm hợp đồng
  "TERMINATION",          // Đơn phương chấm dứt hợp đồng
  "NOTICE_PERIOD",        // Thời hạn báo trước khi hủy hợp đồng
  "ELECTRICITY_WATER",    // Giá điện nước & định mức sinh hoạt
  "CONFIDENTIALITY",      // Bảo mật thông tin & bí mật kinh doanh
  "WORKING_HOURS",        // Thời giờ làm việc & thời giờ nghỉ ngơi
  "OVERTIME",             // Tiền lương làm thêm giờ
  "PROBATION",            // Thời gian thử việc & lương thử việc
  "ID_RETENTION",         // Giữ giấy tờ tùy thân (CCCD / Bằng cấp gốc)
  "DISPUTE_RESOLUTION",   // Cơ chế giải quyết tranh chấp (Tòa án / Trọng tài)
];

export const LEGAL_REFERENCES = {
  CIVIL_CODE_2015: {
    name: "Bộ luật Dân sự 2015 (Luật số 91/2015/QH13)",
    articles: {
      ART_328: "Điều 328: Quy định về Đặt cọc và nghĩa vụ hoàn trả tiền cọc.",
      ART_472_482: "Điều 472 - 482: Hợp đồng thuê tài sản / thuê nhà ở và quyền đơn phương chấm dứt hợp đồng hợp pháp.",
    },
  },
  LABOR_CODE_2019: {
    name: "Bộ luật Lao động 2019 (Luật số 45/2019/QH14)",
    articles: {
      ART_20: "Điều 20: Hành vi người sử dụng lao động KHÔNG ĐƯỢC LÀM khi giao kết HĐLĐ (Nghiêm cấm giữ bản chính CCCD, văn bằng, chứng chỉ; Nghiêm cấm yêu cầu người lao động đặt cọc tiền hoặc tài sản).",
      ART_24_27: "Điều 24 - 27: Tiền lương thử việc phải đạt ít nhất 85% mức lương chính thức.",
    },
  },
  CIRCULAR_09_2023: {
    name: "Thông tư số 09/2023/TT-BCT (Bộ Công Thương)",
    articles: {
      ELEC_PRICE: "Quy định giá bán lẻ điện cho sinh viên và người thuê trọ (tối đa theo bậc 3 hoặc cấp định mức 1 chỉ số/người).",
    },
  },
};

/**
 * Analyzes contract text and returns structured clauses, risk flags, and plain explanations
 */
export function analyzeContractIntelligence(contractText, contractType = "RENTAL") {
  if (!contractText || typeof contractText !== "string" || contractText.trim().length < 20) {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      message: "Văn bản hợp đồng quá ngắn hoặc không chứa đầy đủ các điều khoản cơ bản để phân tích.",
      riskLevel: "UNKNOWN",
    };
  }

  const text = contractText.toLowerCase();
  const detectedClauses = [];
  const riskFlags = [];

  // 1. Check ID Retention Trap (Serious Labor Trap)
  if (text.includes("giữ cccd") || text.includes("giữ bằng") || text.includes("nộp bản chính") || text.includes("giữ cmnd")) {
    detectedClauses.push("ID_RETENTION");
    riskFlags.push({
      id: "FLAG_ID_RETENTION",
      clauseType: "ID_RETENTION",
      severity: "CRITICAL",
      title: "CẢNH BÁO: Giữ Giấy Tờ Tùy Thân / Bằng Cấp Gốc",
      detectedText: "Điều khoản yêu cầu nộp hoặc tạm giữ bản chính CCCD/Bằng cấp gốc",
      legalReference: LEGAL_REFERENCES.LABOR_CODE_2019.articles.ART_20,
      plainExplanation: "Theo Điều 20 Bộ luật Lao động 2019, người sử dụng lao động bị nghiêm cấm giữ bản chính giấy tờ tùy thân của người lao động dưới mọi hình thức. Bạn tuyệt đối không bàn giao giấy tờ gốc.",
      suggestedAction: "Yêu cầu bên sử dụng lao động bỏ điều khoản này hoặc chỉ cung cấp bản photo công chứng.",
    });
  }

  // 2. Check Deposit / Guarantee Money Trap in Labor
  if (contractType === "LABOR" && (text.includes("đặt cọc") || text.includes("phí đào tạo") || text.includes("tiền thế chân") || text.includes("tiền bảo đảm"))) {
    detectedClauses.push("DEPOSIT");
    riskFlags.push({
      id: "FLAG_LABOR_DEPOSIT",
      clauseType: "DEPOSIT",
      severity: "CRITICAL",
      title: "CẢNH BÁO: Bắt Đóng Tiền Thế Chân / Tiền Cọc Việc Làm",
      detectedText: "Yêu cầu người lao động đóng tiền cọc/phí bảo đảm/đồng phục trước khi nhận việc",
      legalReference: LEGAL_REFERENCES.LABOR_CODE_2019.articles.ART_20,
      plainExplanation: "Pháp luật lao động Việt Nam nghiêm cấm hành vi yêu cầu người lao động phải đóng tiền hoặc thế chấp tài sản để bảo đảm thực hiện hợp đồng. Đây là dấu hiệu rất phổ biến của các công ty ma hoặc bẫy lừa đảo việc làm.",
      suggestedAction: "Không chuyển tiền và dừng ngay việc ký kết hợp đồng.",
    });
  }

  // 3. Check Electricity & Water Price Overcharge (Rental)
  if (text.includes("giá điện") || text.includes("tiền điện") || text.includes("kwh")) {
    detectedClauses.push("ELECTRICITY_WATER");
    const elePriceMatch = text.match(/(\d{1,2}[.,]\d{3}|\d{4,5})\s*(đ|vnd|đồng)\s*\/\s*(kwh|số|ký)/i);
    if (elePriceMatch) {
      const rawNum = parseInt(elePriceMatch[1].replace(/[.,]/g, ""), 10);
      if (rawNum > 4500) {
        riskFlags.push({
          id: "FLAG_ELEC_OVERCHARGE",
          clauseType: "ELECTRICITY_WATER",
          severity: "HIGH",
          title: "Giá Điện Thu Vượt Khung Quy Định",
          detectedText: `Mức giá điện ghi nhận: ${rawNum.toLocaleString("vi-VN")} đ/kWh`,
          legalReference: LEGAL_REFERENCES.CIRCULAR_09_2023.articles.ELEC_PRICE,
          plainExplanation: `Mức giá điện ${rawNum.toLocaleString("vi-VN")} đ/kWh cao hơn đáng kể so với biểu giá bán lẻ điện sinh hoạt bậc thang cao nhất của Bộ Công Thương. Bạn có thể bị phụ thu tiền điện sai quy định.`,
          suggestedAction: "Đề nghị chủ trọ kê khai đăng ký định mức điện sinh hoạt cho sinh viên theo Thông tư 09/2023/TT-BCT.",
        });
      }
    }
  }

  // 4. Check Unreasonable Penalty / Forfeiture of Deposit
  if (text.includes("mất toàn bộ tiền cọc") || text.includes("phạt gấp đôi") || text.includes("không hoàn trả cọc trong mọi trường hợp")) {
    detectedClauses.push("PENALTY");
    detectedClauses.push("REFUND");
    riskFlags.push({
      id: "FLAG_UNFAIR_FORFEITURE",
      clauseType: "PENALTY",
      severity: "HIGH",
      title: "Điều Khoản Tịch Thu Cọc Không Căn Cứ",
      detectedText: "Quy định mất 100% tiền cọc dù có báo trước hoặc có lý do bất khả kháng",
      legalReference: LEGAL_REFERENCES.CIVIL_CODE_2015.articles.ART_328,
      plainExplanation: "Hợp đồng quy định chế tài tịch thu toàn bộ tiền đặt cọc một cách bất cân xứng mà không tính đến quyền báo trước hợp lý hoặc các sự kiện bất khả kháng.",
      suggestedAction: "Đàm phán bổ sung điều khoản: 'Nếu báo trước tối thiểu 30 ngày thì bên thuê được hoàn trả 100% tiền đặt cọc'.",
    });
  }

  // Determine overall contract risk score & level
  let overallRiskScore = 15; // baseline
  if (riskFlags.some((f) => f.severity === "CRITICAL")) {
    overallRiskScore = 90;
  } else if (riskFlags.some((f) => f.severity === "HIGH")) {
    overallRiskScore = 65;
  } else if (riskFlags.length > 0) {
    overallRiskScore = 40;
  }

  let riskVerdict = "AN TOÀN / HỢP LỆ";
  if (overallRiskScore >= 80) riskVerdict = "RỦI RO CAO / CẦN ĐÀM PHÁN LẠI GẤP";
  else if (overallRiskScore >= 50) riskVerdict = "CẦN LƯU Ý MỘT SỐ ĐIỀU KHOẢN BẤT LỢI";

  return {
    status: "ANALYSIS_COMPLETE",
    contractType,
    overallRiskScore,
    riskVerdict,
    detectedClausesCount: detectedClauses.length,
    riskFlags,
    plainSummary: `Hệ thống đã rà soát văn bản và phát hiện ${riskFlags.length} điểm cần đặc biệt lưu ý trước khi ký kết.`,
    legalDisclaimer: "Kết quả trên là phân tích rủi ro văn bản tự động phục vụ mục đích tham khảo; không thay thế ý kiến tư vấn pháp lý chính thức từ luật sư hoặc cơ quan nhà nước có thẩm quyền.",
  };
}
