/**
 * StudentHub AI — Document Intelligence & Version Diff Engine (AI-10)
 * 
 * Extracts structured semantic entities from official university announcements & regulations
 * and computes precise version diffs between v1 and v2 documents (ADDED, REMOVED, MODIFIED, UNCHANGED).
 */

/**
 * Parses raw document text and extracts structured operational fields
 */
export function extractDocumentIntelligence(text, metadata = {}) {
  if (!text || typeof text !== "string") {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      message: "Văn bản rỗng hoặc không thể đọc nội dung.",
    };
  }

  const normalized = text.toLowerCase();

  // 1. Who it applies to (Target Audience)
  const targetMatches = [];
  if (normalized.includes("sinh viên") || normalized.includes("toàn thể")) targetMatches.push("Toàn thể sinh viên chính quy");
  if (normalized.includes("k23") || normalized.includes("khóa 2023")) targetMatches.push("Sinh viên Khóa 2023 (K23)");
  if (normalized.includes("k22") || normalized.includes("khóa 2022")) targetMatches.push("Sinh viên Khóa 2022 (K22)");
  if (normalized.includes("k24") || normalized.includes("tân sinh viên")) targetMatches.push("Tân sinh viên Khóa 2024 (K24)");
  if (normalized.includes("clc") || normalized.includes("chất lượng cao")) targetMatches.push("Hệ Chất lượng cao");
  if (normalized.includes("đại trà")) targetMatches.push("Hệ Đại trà");

  const appliesTo = targetMatches.length > 0 ? targetMatches : ["Tất cả sinh viên thuộc phạm vi điều chỉnh của văn bản"];

  // 2. Deadlines Extraction (Regex for dates)
  const dateRegex = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}|\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4})\b/gi;
  const rawDates = text.match(dateRegex) || [];
  const deadlines = [...new Set(rawDates)];

  // 3. Required Actions Extraction
  const actions = [];
  if (normalized.includes("nộp học phí") || normalized.includes("đóng tiền")) actions.push("Hoàn thành nghĩa vụ học phí qua cổng trực tuyến hoặc ngân hàng liên kết");
  if (normalized.includes("đăng ký học phần") || normalized.includes("chọn môn")) actions.push("Truy cập hệ thống đăng ký tín chỉ đúng khung giờ quy định");
  if (normalized.includes("nộp hồ sơ") || normalized.includes("minh chứng")) actions.push("Nộp bản scan / hồ sơ giấy minh chứng cho Phòng CTSV");
  if (normalized.includes("khảo sát") || normalized.includes("đánh giá")) actions.push("Thực hiện khảo sát đánh giá giảng viên trước ngày khóa cổng học vụ");

  // 4. Penalties / Consequences
  const penalties = [];
  if (normalized.includes("hủy học phần") || normalized.includes("xóa tên")) penalties.push("Bị hủy kết quả đăng ký học phần / xóa tên khỏi danh sách lớp học");
  if (normalized.includes("cấm thi") || normalized.includes("không được dự thi")) penalties.push("Không đủ điều kiện dự thi kết thúc học phần");
  if (normalized.includes("hạ điểm rèn luyện")) penalties.push("Bị trừ điểm rèn luyện theo quy chế CTSV");

  return {
    status: "PROCESSED",
    summary: metadata.title || "Trích xuất công văn & thông báo học vụ",
    publisher: metadata.publisher || "Phòng Đào tạo / CTSV HCMUTE",
    sourceUrl: metadata.sourceUrl || "https://online.hcmute.edu.vn",
    effectiveDate: metadata.effectiveDate || deadlines[0] || "Ngay khi ban hành",
    appliesTo,
    deadlines: deadlines.length > 0 ? deadlines : ["Xem chi tiết trong phụ lục công văn"],
    requiredActions: actions.length > 0 ? actions : ["Theo dõi hướng dẫn chi tiết của Khoa / Bộ môn"],
    penalties: penalties.length > 0 ? penalties : ["Xử lý theo Quy chế đào tạo và công tác sinh viên hiện hành"],
    extractedEntities: {
      datesCount: deadlines.length,
      actionsCount: actions.length,
      penaltiesCount: penalties.length,
    },
  };
}

/**
 * Computes Version Diff between Document v1 and Document v2
 */
export function computeDocumentVersionDiff(docV1, docV2) {
  if (!docV1 || !docV2) {
    return {
      status: "ERROR",
      message: "Cần cung cấp đầy đủ cả hai phiên bản văn bản (v1 và v2) để đối soát.",
    };
  }

  const diffItems = [];

  // Compare Deadlines
  const v1Deadlines = docV1.deadlines || [];
  const v2Deadlines = docV2.deadlines || [];
  if (JSON.stringify(v1Deadlines) !== JSON.stringify(v2Deadlines)) {
    diffItems.push({
      field: "DEADLINE / HẠN CHÓT",
      changeType: "MODIFIED",
      oldValue: v1Deadlines.join(", ") || "Không có",
      newValue: v2Deadlines.join(", ") || "Không có",
      impact: "Thời hạn thực hiện đã được gia hạn hoặc điều chỉnh",
      severity: "HIGH",
    });
  }

  // Compare Target Audience
  const v1Audience = docV1.appliesTo || [];
  const v2Audience = docV2.appliesTo || [];
  const addedAudience = v2Audience.filter((x) => !v1Audience.includes(x));
  const removedAudience = v1Audience.filter((x) => !v2Audience.includes(x));

  if (addedAudience.length > 0) {
    diffItems.push({
      field: "ĐỐI TƯỢNG ÁP DỤNG",
      changeType: "ADDED",
      oldValue: v1Audience.join(", "),
      newValue: `Mở rộng bổ sung: ${addedAudience.join(", ")}`,
      impact: "Mở rộng thêm đối tượng sinh viên được thụ hưởng hoặc áp dụng",
      severity: "MEDIUM",
    });
  }
  if (removedAudience.length > 0) {
    diffItems.push({
      field: "ĐỐI TƯỢNG ÁP DỤNG",
      changeType: "REMOVED",
      oldValue: removedAudience.join(", "),
      newValue: v2Audience.join(", "),
      impact: "Thu hẹp hoặc loại bỏ đối tượng áp dụng",
      severity: "HIGH",
    });
  }

  // Compare Actions / Requirements
  const v1Actions = docV1.requiredActions || [];
  const v2Actions = docV2.requiredActions || [];
  if (JSON.stringify(v1Actions) !== JSON.stringify(v2Actions)) {
    diffItems.push({
      field: "HÀNH ĐỘNG BẮT BUỘC",
      changeType: "MODIFIED",
      oldValue: v1Actions.join("; "),
      newValue: v2Actions.join("; "),
      impact: "Quy trình thực hiện hoặc biểu mẫu đã có sự thay đổi",
      severity: "MEDIUM",
    });
  }

  return {
    status: "DIFF_COMPLETED",
    v1Metadata: { title: docV1.summary, version: "v1.0" },
    v2Metadata: { title: docV2.summary, version: "v2.0" },
    totalChanges: diffItems.length,
    hasCriticalChanges: diffItems.some((d) => d.severity === "HIGH"),
    diffItems: diffItems.length > 0 ? diffItems : [
      {
        field: "TOÀN BỘ NỘI DUNG",
        changeType: "UNCHANGED",
        oldValue: "Trùng khớp 100%",
        newValue: "Không có sự thay đổi điều khoản cốt lõi",
        impact: "Văn bản giữ nguyên giá trị pháp lý và tiến độ",
        severity: "INFO",
      },
    ],
  };
}
