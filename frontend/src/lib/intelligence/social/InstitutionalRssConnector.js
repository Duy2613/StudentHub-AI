/**
 * StudentHub AI — Institutional RSS Connector (Live XML Fetcher)
 * 
 * Fetches and parses public RSS/Atom feeds from university announcement portals.
 * Transforms raw RSS items into standardized ContentItem records with provenance.
 */

import {
  ISourceConnector,
  CONNECTOR_PLATFORM,
  CONNECTOR_CAPABILITY,
  SOURCE_CLASSIFICATION,
  CONNECTOR_HEALTH
} from "./ISourceConnector.js";

export class InstitutionalRssConnector extends ISourceConnector {
  #feedUrls;

  constructor(options = {}) {
    super({
      connectorId: options.connectorId || "institutional_rss_announcements",
      platform: CONNECTOR_PLATFORM.INSTITUTIONAL_RSS,
      sourceClassification: SOURCE_CLASSIFICATION.OFFICIAL,
      capabilities: [
        CONNECTOR_CAPABILITY.CAN_READ_PUBLIC_CONTENT,
        CONNECTOR_CAPABILITY.CAN_SYNC
      ],
      rateLimits: { requestsPerMinute: 60, burstQuota: 10 },
      termsProfile: { allowIndexing: true, requiresAttribution: true },
      ...options
    });

    this.#feedUrls = options.feedUrls || [
      "https://pdt.hcmute.edu.vn/rss/thong-bao-chung.rss",
      "https://fit.hcmute.edu.vn/rss/thong-bao-khoa.rss"
    ];
  }

  /**
   * Fetches real RSS items from public endpoints
   */
  async syncIncremental({ cursor = null, limit = 20 } = {}) {
    const dataMode = process.env.DATA_MODE || (process.env.NODE_ENV === "test" ? "FIXTURE" : "REAL");

    if (dataMode === "REAL") {
      try {
        const fetchedItems = [];
        for (const url of this.#feedUrls) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const res = await fetch(url, {
              headers: { "User-Agent": "StudentHub-Academic-Agent/1.0" },
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const xmlText = await res.text();
              const parsed = this.#parseRssXml(xmlText, url);
              fetchedItems.push(...parsed);
            }
          } catch {
            clearTimeout(timeoutId);
            // Network unreachable or timeout -> Continue to next feed
          }
        }

        if (fetchedItems.length > 0) {
          this.health = CONNECTOR_HEALTH.HEALTHY;
          return {
            items: fetchedItems.slice(0, limit),
            nextCursor: `cursor_${Date.now()}`
          };
        }

        // If live feeds fail, update health to DEGRADED
        this.health = CONNECTOR_HEALTH.DEGRADED;
        return {
          items: [],
          nextCursor: cursor
        };
      } catch (err) {
        this.health = CONNECTOR_HEALTH.DEGRADED;
        throw err;
      }
    }

    // In FIXTURE / TEST mode, provide structured deterministic fixtures
    return {
      items: [
        {
          rawId: "rss_hcmute_01",
          title: "Thông báo lịch điều chỉnh phòng học học kỳ 2 năm học 2025-2026",
          content: "Phòng Đào Tạo thông báo điều chỉnh phòng học các lớp học phần Giải tích 1 từ D301 sang A1-204.",
          author: "Phòng Đào Tạo HCMUTE",
          publishedAt: new Date().toISOString(),
          url: "https://pdt.hcmute.edu.vn/thong-bao/phong-hoc"
        }
      ],
      nextCursor: `cursor_${Date.now()}`
    };
  }

  #parseRssXml(xml, sourceFeedUrl) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 50) {
      const itemContent = match[1];
      const titleMatch = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i.exec(itemContent);
      const linkMatch = /<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i.exec(itemContent);
      const descMatch = /<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i.exec(itemContent);
      const pubDateMatch = /<pubDate>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/i.exec(itemContent);

      if (titleMatch && descMatch) {
        items.push({
          rawId: linkMatch ? linkMatch[1] : `rss_${Date.now()}_${items.length}`,
          title: titleMatch[1].trim(),
          content: descMatch[1].replace(/<[^>]*>?/gm, "").trim(),
          author: "Phòng Đào Tạo HCMUTE",
          publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          url: linkMatch ? linkMatch[1].trim() : sourceFeedUrl
        });
      }
    }

    return items;
  }
}
