/**
 * StudentHub AI — Parser Failure Safety & Data Corruption Quarantine Guard (Hardened Production Grade)
 * 
 * Enforces Ingestion Safety Constitution:
 * Prevents broken scrapers, disguised HTTP 200 error pages, WAF/CAPTCHA walls,
 * login barriers, or statistical collapses from contaminating the master verified knowledge base.
 */

export const INGESTION_SAFETY_STATES = {
  PASSED: "PASSED",
  PARSER_FAILURE: "PARSER_FAILURE",
  QUARANTINED: "QUARANTINED",
  ERROR_PAGE_DETECTED: "ERROR_PAGE_DETECTED",
  WAF_CHALLENGE_DETECTED: "WAF_CHALLENGE_DETECTED",
  LOGIN_WALL_DETECTED: "LOGIN_WALL_DETECTED"
};

export class ParserIntegrityGuard {
  /**
   * Inspects raw HTML response body for disguised error pages, WAF barriers, or login walls
   * @param {string} rawHtml 
   * @returns {object} Raw Body Integrity Assessment
   */
  static inspectRawContentSafety(rawHtml = "") {
    const text = String(rawHtml || "");

    // 1. Detect WAF / Cloudflare / DDoS-Guard / CAPTCHA Challenge Pages
    const wafPatterns = [
      /cf-browser-verification/i,
      /challenge-platform/i,
      /just a moment\.\.\./i,
      /attention required! \| cloudflare/i,
      /ddos-guard/i,
      /incapsula_resource/i,
      /recaptcha\/api\.js/i
    ];
    if (wafPatterns.some(p => p.test(text))) {
      return {
        status: INGESTION_SAFETY_STATES.WAF_CHALLENGE_DETECTED,
        stopIngestion: true,
        shouldQuarantine: true,
        reason: "Phát hiện màn hình chờ WAF / Cloudflare / CAPTCHA challenge. Tạm dừng nạp và phục vụ bản snapshot lưu trữ.",
        action: "QUARANTINE_AND_FALLBACK"
      };
    }

    // 2. Detect Disguised HTTP 200 Error Pages (IIS / ASP.NET / PHP / DB Errors)
    const errorPagePatterns = [
      /404 - file or directory not found/i,
      /runtime error/i,
      /server error in '\/' application/i,
      /database error/i,
      /an error occurred while processing your request/i,
      /access is denied/i,
      /hệ thống đang bảo trì/i,
      /trang bạn tìm kiếm không tồn tại/i
    ];
    if (errorPagePatterns.some(p => p.test(text))) {
      return {
        status: INGESTION_SAFETY_STATES.ERROR_PAGE_DETECTED,
        stopIngestion: true,
        shouldQuarantine: true,
        reason: "Trang web trả về HTTP 200 nhưng chứa nội dung lỗi hệ thống (IIS Runtime Error / 404 disguised / Bảo trì).",
        action: "QUARANTINE_AND_FALLBACK"
      };
    }

    // 3. Detect Login Wall replacing public portal
    const loginWallPatterns = [
      /<input[^>]*type=["']password["']/i,
      /đăng nhập hệ thống quản lý/i,
      /vui lòng đăng nhập để tiếp tục/i,
      /cas\/login/i
    ];
    // If page is short (< 5000 chars) and has password form, it's a login wall
    if (text.length < 5000 && loginWallPatterns.some(p => p.test(text))) {
      return {
        status: INGESTION_SAFETY_STATES.LOGIN_WALL_DETECTED,
        stopIngestion: true,
        shouldQuarantine: true,
        reason: "Trang công khai bị thay thế bởi giao diện Đăng nhập / Xác thực tài khoản.",
        action: "QUARANTINE_AND_FALLBACK"
      };
    }

    return {
      status: INGESTION_SAFETY_STATES.PASSED,
      stopIngestion: false,
      shouldQuarantine: false,
      reason: "Kiểm tra sơ bộ nội dung thô thành công, không phát hiện mã lỗi hoặc WAF."
    };
  }

  /**
   * Validates extracted course catalog against previous baseline metrics
   * @param {object[]} previousCatalog - Previous verified courses
   * @param {object[]} incomingCatalog - Newly extracted courses from crawler
   * @returns {object} Integrity Assessment
   */
  static validateCatalogIntegrity(previousCatalog = [], incomingCatalog = []) {
    const prevCount = previousCatalog.length;
    const incomingCount = incomingCatalog.length;

    // Rule 1: Empty or zero extraction
    if (incomingCount === 0 && prevCount > 0) {
      return {
        status: INGESTION_SAFETY_STATES.PARSER_FAILURE,
        shouldQuarantine: true,
        stopIngestion: true,
        reason: `Trích xuất rỗng (0 môn học) so với baseline ${prevCount} môn học. Dừng nạp để tránh xóa sạch dữ liệu.`,
        action: "SERVE_LAST_VERIFIED_STATE_WITH_WARNING"
      };
    }

    // Rule 2: Sudden drastic drop (> 50% loss of catalog)
    if (prevCount > 10 && incomingCount < prevCount * 0.5) {
      return {
        status: INGESTION_SAFETY_STATES.QUARANTINED,
        shouldQuarantine: true,
        stopIngestion: true,
        reason: `Phát hiện sụt giảm bất thường > 50% số lượng môn học (Từ ${prevCount} xuống ${incomingCount} môn). Đưa vào diện Quarantine.`,
        action: "HOLD_IN_QUARANTINE_FOR_MANUAL_INSPECTION"
      };
    }

    // Rule 3: Prerequisite collapse (Incoming has > 20 courses but 0 prerequisites across all)
    const prevHasPrereqs = previousCatalog.some(c => (c.prerequisites || []).length > 0);
    const incomingHasPrereqs = incomingCatalog.some(c => (c.prerequisites || []).length > 0);

    if (prevHasPrereqs && !incomingHasPrereqs && incomingCount > 10) {
      return {
        status: INGESTION_SAFETY_STATES.QUARANTINED,
        shouldQuarantine: true,
        stopIngestion: true,
        reason: "Mất toàn bộ liên kết môn tiên quyết trong bản trích xuất mới (Prerequisite Collapse). Đưa vào diện Quarantine.",
        action: "PRESERVE_BASELINE_PREVENT_CORRUPTION"
      };
    }

    // Rule 4: HTML structure breakage (Mandatory fields missing)
    const malformedCount = incomingCatalog.filter(c => !c.code || !c.name || typeof c.credits !== "number").length;
    if (malformedCount > incomingCount * 0.1) {
      return {
        status: INGESTION_SAFETY_STATES.PARSER_FAILURE,
        shouldQuarantine: true,
        stopIngestion: true,
        reason: `Cấu trúc HTML thay đổi: ${malformedCount}/${incomingCount} bản ghi thiếu trường dữ liệu bắt buộc.`,
        action: "STOP_INGESTION_UPDATE_PARSER"
      };
    }

    return {
      status: INGESTION_SAFETY_STATES.PASSED,
      shouldQuarantine: false,
      stopIngestion: false,
      reason: `Kiểm tra an toàn dữ liệu thành công (${incomingCount} môn học hợp lệ, baseline: ${prevCount}).`,
      action: "PROCEED_TO_SEMANTIC_DIFF"
    };
  }
}
