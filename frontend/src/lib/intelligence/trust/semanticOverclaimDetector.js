/**
 * StudentHub AI — Semantic Overclaim Detector V2
 * 
 * Inspects AI drafted sentences against cited evidence spans to detect
 * unsupported semantic extensions (e.g. ungrounded channels like 'online',
 * hallucinated cutoff dates, additional requirements, or ungrounded penalties).
 */

export class SemanticOverclaimDetector {
  /**
   * Detects if the draft text introduces claims not grounded in the source passage
   */
  static detectOverclaim(draftText = "", sourcePassage = "") {
    if (!draftText || !draftText.trim()) {
      return { hasOverclaim: false, ungroundedExtensions: [], confidence: 1.0 };
    }
    if (!sourcePassage || !sourcePassage.trim()) {
      return {
        hasOverclaim: true,
        ungroundedExtensions: ["TOÀN_BỘ_TUYÊN_BỐ_KHÔNG_CÓ_NGUỒN"],
        reason: "Không có văn bản nguồn chứng minh.",
        confidence: 0.0
      };
    }

    const draftNormalized = draftText.toLowerCase();
    const sourceNormalized = sourcePassage.toLowerCase();

    const ungroundedExtensions = [];

    // 1. Channel / Modality extensions (e.g. 'online', 'trực tuyến', 'qua email', 'nộp trực tiếp')
    const channels = ["online", "trực tuyến", "qua email", "nộp trực tiếp", "cổng sinh viên", "google form"];
    for (const ch of channels) {
      if (draftNormalized.includes(ch) && !sourceNormalized.includes(ch)) {
        ungroundedExtensions.push(`KÊNH_THỰC_HIỆN_CHƯA_XÁC_MINH (${ch})`);
      }
    }

    // 2. Date / Deadline extensions (e.g. 'trước ngày 05/09', 'hạn chót ngày 15')
    const dateRegex = /(?:trước|vào|hạn|ngày|đến)\s*(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/gi;
    let match;
    while ((match = dateRegex.exec(draftText)) !== null) {
      const dateSnippet = match[1];
      if (!sourceNormalized.includes(dateSnippet.toLowerCase())) {
        ungroundedExtensions.push(`THỜI_HẠN_CHƯA_CÓ_CĂN_CỨ (${dateSnippet})`);
      }
    }

    // 3. Numeric requirement extensions (e.g. '550', '600', '7.0', '12 tín chỉ')
    const numRegex = /\b(\d{2,4})\b/g;
    const draftNums = draftText.match(numRegex) || [];
    for (const num of draftNums) {
      // Ignore common non-constraint numbers like 2025/2026 if in year context
      if (num === "2024" || num === "2025" || num === "2026") continue;
      if (!sourcePassage.includes(num)) {
        ungroundedExtensions.push(`CHỈ_SỐ_ĐỊNH_LƯỢNG_KHÔNG_CÓ_TRONG_NGUỒN (${num})`);
      }
    }

    // 4. Strict Penalty extensions (e.g. 'bị đình chỉ', 'hủy kết quả', 'bị phạt tiền')
    const penalties = ["bị đình chỉ", "hủy kết quả", "buộc thôi học", "phạt tiền", "hạ bậc"];
    for (const p of penalties) {
      if (draftNormalized.includes(p) && !sourceNormalized.includes(p)) {
        ungroundedExtensions.push(`CHẾ_TÀI_CHƯA_CÓ_CĂN_CỨ (${p})`);
      }
    }

    const hasOverclaim = ungroundedExtensions.length > 0;
    return {
      hasOverclaim,
      ungroundedExtensions,
      reason: hasOverclaim 
        ? `Phát hiện ${ungroundedExtensions.length} chi tiết mở rộng không có trong văn bản nguồn trích dẫn.`
        : "Nội dung khẳng định hoàn toàn nằm trong phạm vi ngữ nghĩa của nguồn.",
      safeGroundedText: hasOverclaim ? this.pruneOverclaim(draftText, ungroundedExtensions) : draftText
    };
  }

  /**
   * Automatically extracts and safe-prunes ungrounded extensions from text
   */
  static pruneOverclaim(draftText = "", ungroundedExtensions = []) {
    let safe = draftText;
    for (const ext of ungroundedExtensions) {
      const termMatch = ext.match(/\((.*?)\)/);
      if (termMatch && termMatch[1]) {
        const term = termMatch[1];
        safe = safe.replace(new RegExp(`\\b${term}\\b`, "gi"), "");
      }
    }
    return safe.replace(/\s+/g, " ").trim();
  }
}
