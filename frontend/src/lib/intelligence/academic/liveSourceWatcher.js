/**
 * StudentHub AI — Live Academic Source Watcher & SLA Monitor (Hardened Production Grade)
 * 
 * Enforces Live-Sync Principle:
 * Actively monitors official HCM-UTE sources with tiered SLAs, ETag / Last-Modified tracking,
 * SHA-256 hash tracking, respectful rate limiting, and exponential backoff with jitter.
 * 
 * Implements 5-Tier Source Trust Model and 4-Case Conditional Synchronization:
 * - Case A: ETag support (If-None-Match -> 304 -> UNCHANGED)
 * - Case B: Last-Modified support (If-Modified-Since -> 304 -> UNCHANGED)
 * - Case C: Server supports neither -> Raw bytes -> SHA-256 compare -> UNCHANGED / CHANGED
 * - Case D: Failure / Timeout / Corruption -> QUARANTINE -> LAST_VERIFIED_STATE + STALE_SOURCE_WARNING
 */

import crypto from "node:crypto";

export const SOURCE_TRUST_TIERS = {
  TIER_1_OFFICIAL: { level: 1, label: "Official Primary University Portal", priority: 100, allowDirectPromotionWithReview: true },
  TIER_2_OFFICIAL_MIRROR: { level: 2, label: "Official Mirror / Faculty Subdomain", priority: 80, allowDirectPromotionWithReview: true },
  TIER_3_VERIFIED_INSTITUTIONAL: { level: 3, label: "Verified Institutional Partner / Department", priority: 60, allowDirectPromotionWithReview: false },
  TIER_4_UNKNOWN: { level: 4, label: "Unverified External Source", priority: 20, allowDirectPromotionWithReview: false },
  TIER_5_UNTRUSTED: { level: 5, label: "Untrusted / Suspicious Origin", priority: 0, allowDirectPromotionWithReview: false }
};

export const SOURCE_SLA_TIERS = {
  CRITICAL_NOTICE: { label: "Critical Academic Notices", maxStalenessHours: 1, pollFrequencyMinutes: 30 },
  ANNOUNCEMENT: { label: "General University Announcements", maxStalenessHours: 6, pollFrequencyMinutes: 120 },
  CURRICULUM: { label: "Faculty Curriculum & Programs", maxStalenessHours: 24, pollFrequencyMinutes: 720 },
  REGULATION: { label: "Official University Regulations", maxStalenessHours: 168, pollFrequencyMinutes: 1440 }
};

export const SOURCE_HEALTH_STATES = {
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  STALE: "STALE",
  FAILED: "FAILED"
};

export const MONITORED_HCMUTE_SOURCES = [
  {
    sourceId: "SRC_HCMUTE_MAIN",
    name: "Cổng Thông Tin Chính Thức HCMUTE",
    url: "https://hcmute.edu.vn",
    sourceType: "OFFICIAL_PORTAL",
    authority: "TIER_1_OFFICIAL",
    sourceTier: "TIER_1_OFFICIAL",
    allowedDomains: ["hcmute.edu.vn", "www.hcmute.edu.vn"],
    expectedContentType: "text/html",
    slaTier: "ANNOUNCEMENT",
    crawlFrequencyMinutes: 120,
    lastChecked: "2026-08-26T12:00:00.000Z",
    lastSuccess: "2026-08-26T12:00:00.000Z",
    lastContentHash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    etag: '"3116-2025-hcmute-v1"',
    lastModified: "Wed, 26 Aug 2026 10:00:00 GMT",
    currentStatus: SOURCE_HEALTH_STATES.HEALTHY,
    errorCount: 0,
    consecutiveFailures: 0
  },
  {
    sourceId: "SRC_HCMUTE_DAOTAO",
    name: "Phòng Đào Tạo & Học Vụ HCMUTE",
    url: "https://daotao.hcmute.edu.vn",
    sourceType: "ACADEMIC_PORTAL",
    authority: "TIER_1_OFFICIAL",
    sourceTier: "TIER_1_OFFICIAL",
    allowedDomains: ["daotao.hcmute.edu.vn"],
    expectedContentType: "text/html",
    slaTier: "CRITICAL_NOTICE",
    crawlFrequencyMinutes: 30,
    lastChecked: "2026-08-26T13:30:00.000Z",
    lastSuccess: "2026-08-26T13:30:00.000Z",
    lastContentHash: "f6e5d4c3b2a109876543210fedcba9876543210fedcba9876543210fedcba987",
    etag: '"daotao-aug2026-qd3116"',
    lastModified: "Wed, 26 Aug 2026 11:30:00 GMT",
    currentStatus: SOURCE_HEALTH_STATES.HEALTHY,
    errorCount: 0,
    consecutiveFailures: 0
  },
  {
    sourceId: "SRC_HCMUTE_FIT",
    name: "Khoa Công Nghệ Thông Tin (FIT)",
    url: "https://fit.hcmute.edu.vn",
    sourceType: "FACULTY_PORTAL",
    authority: "TIER_1_OFFICIAL",
    sourceTier: "TIER_1_OFFICIAL",
    allowedDomains: ["fit.hcmute.edu.vn"],
    expectedContentType: "text/html",
    slaTier: "CURRICULUM",
    crawlFrequencyMinutes: 720,
    lastChecked: "2026-08-26T08:00:00.000Z",
    lastSuccess: "2026-08-26T08:00:00.000Z",
    lastContentHash: "9876543210abcdef0123456789fedcba9876543210abcdef0123456789fedcba",
    etag: '"fit-curriculum-k26-v2"',
    lastModified: "Mon, 24 Aug 2026 09:00:00 GMT",
    currentStatus: SOURCE_HEALTH_STATES.HEALTHY,
    errorCount: 0,
    consecutiveFailures: 0
  },
  {
    sourceId: "SRC_HCMUTE_CTSV",
    name: "Phòng Công Tác Sinh Viên",
    url: "https://ctsv.hcmute.edu.vn",
    sourceType: "STUDENT_AFFAIRS_PORTAL",
    authority: "TIER_1_OFFICIAL",
    sourceTier: "TIER_1_OFFICIAL",
    allowedDomains: ["ctsv.hcmute.edu.vn"],
    expectedContentType: "text/html",
    slaTier: "ANNOUNCEMENT",
    crawlFrequencyMinutes: 120,
    lastChecked: "2026-08-26T10:00:00.000Z",
    lastSuccess: "2026-08-26T10:00:00.000Z",
    lastContentHash: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    etag: '"ctsv-scholarship-2026"',
    lastModified: "Tue, 25 Aug 2026 14:00:00 GMT",
    currentStatus: SOURCE_HEALTH_STATES.HEALTHY,
    errorCount: 0,
    consecutiveFailures: 0
  }
];

export class LiveSourceWatcher {
  /**
   * Computes SHA-256 hash of normalized document content or raw bytes
   * @param {string|Buffer} rawContent 
   * @returns {string} SHA-256 Hash
   */
  static computeContentHash(rawContent) {
    return crypto.createHash("sha256").update(rawContent || "").digest("hex");
  }

  /**
   * Checks if a source has exceeded its Freshness SLA
   * @param {object} source 
   * @param {Date} currentTime 
   * @returns {object} SLA status
   */
  static evaluateSourceFreshnessSLA(source, currentTime = new Date()) {
    const sla = SOURCE_SLA_TIERS[source.slaTier] || SOURCE_SLA_TIERS.ANNOUNCEMENT;
    const lastCheckedTime = new Date(source.lastChecked).getTime();
    const elapsedHours = (currentTime.getTime() - lastCheckedTime) / (1000 * 60 * 60);

    const isSlaBreached = elapsedHours > sla.maxStalenessHours;

    return {
      sourceId: source.sourceId,
      slaTier: source.slaTier,
      maxAllowedStalenessHours: sla.maxStalenessHours,
      elapsedHours: Number(elapsedHours.toFixed(2)),
      isSlaBreached,
      recommendedStatus: isSlaBreached ? SOURCE_HEALTH_STATES.STALE : source.currentStatus
    };
  }

  /**
   * Evaluates conditional headers and body hashes across all 4 production cases
   * @param {object} source - Registered Source Object
   * @param {object} incomingFetchResult - { etag, lastModified, statusCode, rawBody, contentHash }
   * @returns {object} Crawl Decision & Synchronization State
   */
  static evaluateConditionalFetch(source, incomingFetchResult = {}) {
    const { etag, lastModified, statusCode = 200, rawBody, contentHash } = incomingFetchResult;

    // Case D: Server Error / 5xx / 4xx
    if (statusCode >= 400 || statusCode === 0) {
      return {
        hasChanged: false,
        shouldDownloadBody: false,
        syncCase: "CASE_D_FAILURE",
        status: "FAILED",
        quarantineRequired: true,
        reason: `Mã lỗi HTTP ${statusCode}. Chuyển sang phục vụ LAST_VERIFIED_STATE.`
      };
    }

    // Case A & B: Explicit HTTP 304 Not Modified from Server
    if (statusCode === 304) {
      return {
        hasChanged: false,
        shouldDownloadBody: false,
        syncCase: "CASE_A_ETAG_304",
        status: "UNCHANGED",
        quarantineRequired: false,
        reason: "HTTP 304 Not Modified (Server xác nhận nội dung không đổi qua ETag/Last-Modified)."
      };
    }

    // Case A: Cached ETag Match on Client Side
    const etagMatch = Boolean(source.etag && etag && source.etag === etag);
    if (etagMatch) {
      return {
        hasChanged: false,
        shouldDownloadBody: false,
        syncCase: "CASE_A_ETAG_MATCH",
        status: "UNCHANGED",
        quarantineRequired: false,
        reason: "ETag trùng khớp với bản chụp đã xác minh - bỏ qua tải lại body."
      };
    }

    // Case B: Cached Last-Modified Match on Client Side
    const dateMatch = Boolean(source.lastModified && lastModified && source.lastModified === lastModified);
    if (dateMatch) {
      return {
        hasChanged: false,
        shouldDownloadBody: false,
        syncCase: "CASE_B_LAST_MODIFIED_MATCH",
        status: "UNCHANGED",
        quarantineRequired: false,
        reason: "Last-Modified trùng khớp với bản chụp đã xác minh - bỏ qua tải lại body."
      };
    }

    // Case C: Server lacks ETag / Last-Modified -> Compute SHA-256 Hash of Body
    if (!etag && !lastModified) {
      const computedHash = contentHash || this.computeContentHash(rawBody || "");
      const isHashIdentical = Boolean(source.lastContentHash && source.lastContentHash === computedHash);

      if (isHashIdentical) {
        return {
          hasChanged: false,
          shouldDownloadBody: false,
          syncCase: "CASE_C_SHA256_FALLBACK_UNCHANGED",
          status: "UNCHANGED",
          computedHash,
          quarantineRequired: false,
          reason: "Server không hỗ trợ ETag/Last-Modified; SHA-256 trùng khớp 100% với bản chụp trước đó."
        };
      }

      return {
        hasChanged: true,
        shouldDownloadBody: true,
        syncCase: "CASE_C_SHA256_FALLBACK_CHANGED",
        status: "CHANGED",
        computedHash,
        quarantineRequired: false,
        reason: "Phát hiện biến thiên qua băm SHA-256 mới (Server không hỗ trợ ETag/Last-Modified)."
      };
    }

    return {
      hasChanged: true,
      shouldDownloadBody: true,
      syncCase: "CASE_NEW_CONTENT_DETECTED",
      status: "CHANGED",
      quarantineRequired: false,
      reason: "Phát hiện biến thiên qua thay đổi tiêu đề HTTP."
    };
  }

  /**
   * Enforces Source Trust Hierarchy: Blocks lower-tier sources from overwriting higher-tier sources
   * @param {object} existingSource - Current master source
   * @param {object} incomingSource - Source attempting to update
   * @returns {object} Overwrite Authorization
   */
  static isLowerTierOverwriteBlocked(existingSource, incomingSource) {
    const existingTier = SOURCE_TRUST_TIERS[existingSource?.sourceTier] || SOURCE_TRUST_TIERS.TIER_4_UNKNOWN;
    const incomingTier = SOURCE_TRUST_TIERS[incomingSource?.sourceTier] || SOURCE_TRUST_TIERS.TIER_4_UNKNOWN;

    if (incomingTier.level > existingTier.level) {
      return {
        allowed: false,
        reason: `Chặn ghi đè: Nguồn mới (${incomingSource?.sourceTier} cấp ${incomingTier.level}) có độ ưu tiên thấp hơn nguồn hiện tại (${existingSource?.sourceTier} cấp ${existingTier.level}).`,
        action: "QUARANTINE_LOWER_TIER_ATTEMPT"
      };
    }

    return {
      allowed: true,
      reason: `Nguồn mới (${incomingSource?.sourceTier}) có thẩm quyền hợp lệ (${incomingTier.level} <= ${existingTier.level}).`,
      action: "PROCEED_TO_INTEGRITY_CHECK"
    };
  }

  /**
   * Handles crawl failure with exponential backoff and jitter
   * @param {object} source 
   * @returns {object} Backoff schedule
   */
  static handleCrawlFailure(source) {
    const failures = (source.consecutiveFailures || 0) + 1;
    const baseDelayMinutes = 5;
    const maxDelayMinutes = 360; // 6 hours max backoff

    const exponentialDelay = Math.min(maxDelayMinutes, baseDelayMinutes * Math.pow(2, failures - 1));
    const jitter = Math.floor(Math.random() * 5); // 0-5 mins jitter
    const retryDelayMinutes = exponentialDelay + jitter;

    const newStatus = failures >= 3 ? SOURCE_HEALTH_STATES.FAILED : SOURCE_HEALTH_STATES.DEGRADED;

    return {
      sourceId: source.sourceId,
      consecutiveFailures: failures,
      newStatus,
      retryDelayMinutes,
      fallbackMode: "SERVE_LAST_VERIFIED_SNAPSHOT"
    };
  }
}
