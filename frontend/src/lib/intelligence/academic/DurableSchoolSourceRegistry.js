// frontend/src/lib/intelligence/academic/DurableSchoolSourceRegistry.js
//
// Durable School Source Registry
// Prioritizes API > RSS/Atom > HTML Scraper.
// Stores official school source endpoints, update cadences, and caching metadata (ETag / Last-Modified).

export const SOURCE_TYPES = Object.freeze({
  API: "API",
  RSS: "RSS",
  HTML_SCRAPER: "HTML_SCRAPER",
});

export const SOURCE_HEALTH = Object.freeze({
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  UNAVAILABLE: "UNAVAILABLE",
  UNCHECKED: "UNCHECKED",
});

/**
 * Official registry of universities and academic institutions
 */
export const OFFICIAL_SCHOOL_SOURCES = Object.freeze([
  {
    sourceId: "src_hcmute_api",
    schoolId: "HCMUTE",
    schoolName: "Trường Đại học Sư phạm Kỹ thuật TP.HCM",
    endpointUrl: "https://online.hcmute.edu.vn/api/public/announcements/v1",
    sourceType: SOURCE_TYPES.API,
    priority: 1, // Highest priority
    intervalMinutes: 15,
    department: "Phòng Đào Tạo",
    headers: { "Accept": "application/json" },
  },
  {
    sourceId: "src_hcmute_rss",
    schoolId: "HCMUTE",
    schoolName: "Trường Đại học Sư phạm Kỹ thuật TP.HCM",
    endpointUrl: "https://hcmute.edu.vn/rss/thong-bao-phong-dao-tao.rss",
    sourceType: SOURCE_TYPES.RSS,
    priority: 2,
    intervalMinutes: 30,
    department: "Phòng Đào Tạo",
    headers: { "Accept": "application/rss+xml, application/xml" },
  },
  {
    sourceId: "src_hcmute_html",
    schoolId: "HCMUTE",
    schoolName: "Trường Đại học Sư phạm Kỹ thuật TP.HCM",
    endpointUrl: "https://online.hcmute.edu.vn/thong-bao",
    sourceType: SOURCE_TYPES.HTML_SCRAPER,
    priority: 3, // Fallback only
    intervalMinutes: 60,
    department: "Phòng Đào Tạo",
    headers: { "Accept": "text/html" },
  },
  {
    sourceId: "src_hcmut_rss",
    schoolId: "HCMUT",
    schoolName: "Trường Đại học Bách Khoa ĐHQG-HCM",
    endpointUrl: "https://aao.hcmut.edu.vn/rss/thong-bao-sinh-vien.xml",
    sourceType: SOURCE_TYPES.RSS,
    priority: 2,
    intervalMinutes: 30,
    department: "Phòng Đào Tạo",
    headers: { "Accept": "application/rss+xml, application/xml" },
  },
  {
    sourceId: "src_uit_rss",
    schoolId: "UIT",
    schoolName: "Trường Đại học Công nghệ Thông tin ĐHQG-HCM",
    endpointUrl: "https://daa.uit.edu.vn/rss/thong-bao",
    sourceType: SOURCE_TYPES.RSS,
    priority: 2,
    intervalMinutes: 30,
    department: "Phòng Đào Tạo",
    headers: { "Accept": "application/rss+xml, application/xml" },
  }
]);

export class DurableSchoolSourceRegistry {
  constructor(sources = OFFICIAL_SCHOOL_SOURCES) {
    this.sources = new Map();
    this.sourceMetadata = new Map();

    for (const src of sources) {
      this.registerSource(src);
    }
  }

  registerSource(sourceConfig) {
    if (!sourceConfig.sourceId || !sourceConfig.schoolId || !sourceConfig.endpointUrl) {
      throw new Error("Invalid school source configuration: missing required fields");
    }

    this.sources.set(sourceConfig.sourceId, {
      ...sourceConfig,
      registeredAt: new Date().toISOString(),
    });

    if (!this.sourceMetadata.has(sourceConfig.sourceId)) {
      this.sourceMetadata.set(sourceConfig.sourceId, {
        etag: null,
        lastModified: null,
        lastSuccessAt: null,
        lastAttemptAt: null,
        failureCount: 0,
        health: SOURCE_HEALTH.UNCHECKED,
      });
    }
  }

  /**
   * Get all sources for a specific school, sorted by priority (API > RSS > HTML)
   */
  getSourcesForSchool(schoolId) {
    const normSchool = String(schoolId || "").trim().toUpperCase();
    return Array.from(this.sources.values())
      .filter((s) => s.schoolId === normSchool)
      .sort((a, b) => a.priority - b.priority);
  }

  getSource(sourceId) {
    return this.sources.get(sourceId) || null;
  }

  getMetadata(sourceId) {
    return this.sourceMetadata.get(sourceId) || null;
  }

  updateConditionalHeaders(sourceId, { etag, lastModified }) {
    const meta = this.sourceMetadata.get(sourceId);
    if (!meta) return;
    if (etag) meta.etag = etag;
    if (lastModified) meta.lastModified = lastModified;
  }

  recordSuccess(sourceId) {
    const meta = this.sourceMetadata.get(sourceId);
    if (!meta) return;
    meta.lastSuccessAt = new Date().toISOString();
    meta.lastAttemptAt = meta.lastSuccessAt;
    meta.failureCount = 0;
    meta.health = SOURCE_HEALTH.HEALTHY;
  }

  recordFailure(sourceId) {
    const meta = this.sourceMetadata.get(sourceId);
    if (!meta) return;
    meta.lastAttemptAt = new Date().toISOString();
    meta.failureCount += 1;
    meta.health = meta.failureCount >= 3 ? SOURCE_HEALTH.UNAVAILABLE : SOURCE_HEALTH.DEGRADED;
  }
}

export const defaultSchoolSourceRegistry = new DurableSchoolSourceRegistry();
